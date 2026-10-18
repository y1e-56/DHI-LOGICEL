import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProject, updateProjectById, type BackendProject } from "@/lib/api";
import type { Project } from "@/lib/dhi-data";
import { projectForm, type ProjectFormValues } from "./project-form";
import type { FormMode, FormRunContext, Store } from "./types";

vi.mock("@/lib/api", () => ({
  createProject: vi.fn(),
  updateProjectById: vi.fn(),
  mapBackendProject: (project: unknown) => project,
}));

const t = (key: string) => key;

function fakeStore() {
  return {
    currentUser: { id: "3", name: "Dave", active: true, role: "chef_projet" },
    users: [
      { id: "3", name: "Dave", active: true, role: "chef_projet" },
      { id: "7", name: "Alice", active: true, role: "chef_projet" },
      { id: "8", name: "Bob", active: true, role: "qa_lead" },
      { id: "9", name: "Zoe", active: false, role: "admin" },
    ],
    products: [
      { id: "42", name: "Ancien", versions: ["1.0", "1.1"] },
      { id: "77", name: "Nouveau", versions: ["2.0"] },
    ],
    projects: [{ id: "42", name: "Ancien" }],
    replaceProducts: vi.fn(),
    addProject: vi.fn(),
    updateProject: vi.fn(),
    replaceProjects: vi.fn(),
  };
}

const values: ProjectFormValues = {
  name: "  Atlas  ",
  objective: "Portail",
  productId: "77",
  targetVersion: "2.0",
  newTargetVersion: "",
  manager: "Alice",
  qaLead: "Bob",
  status: "encours",
  startDate: "2026-01-01",
  endDate: "2026-02-01",
};

const ctx = (
  mode: FormMode = "create",
  store = fakeStore(),
  formValues: ProjectFormValues = values,
  entity?: Project | undefined,
): FormRunContext<ProjectFormValues, Project> => ({
  mode,
  t,
  store: store as unknown as Store,
  values: formValues,
  entity,
});

const initCtx = (store = fakeStore()) => ({
  mode: "create" as FormMode,
  t,
  store: store as unknown as Store,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("projectForm.validation", () => {
  it("rejette le nom vide avec la cle forms.required", () => {
    const result = projectForm.validation(ctx()).safeParse({ ...values, name: "   " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["name"],
        message: "forms.required",
      });
    }
  });

  it("rejette le produit parent absent", () => {
    const result = projectForm.validation(ctx()).safeParse({ ...values, productId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["productId"],
        message: "forms.required",
      });
    }
  });

  it("rejette une date de fin anterieure a la date de debut", () => {
    const result = projectForm.validation(ctx()).safeParse({
      ...values,
      startDate: "2026-02-01",
      endDate: "2026-01-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["endDate"],
        message: "pages.projects.end_date_before_start",
      });
    }
  });

  it("exige une version cible : « Nouvelle version » sans saisie est refusé", () => {
    const result = projectForm
      .validation(ctx())
      .safeParse({ ...values, targetVersion: "__new__", newTargetVersion: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["newTargetVersion"],
        message: "common.version_required",
      });
    }
  });

  it("accepte un formulaire valide et rogne le nom", () => {
    const result = projectForm.validation(ctx()).safeParse(values);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Atlas");
  });
});

describe("projectForm adaptation au contexte", () => {
  it("propose les responsables eligible sans l'utilisateur courant, sans doublon", () => {
    const managerField = projectForm
      .fields(ctx("create"))
      .find((field) => field.name === "manager");
    expect(managerField?.options?.(ctx("create"))).toEqual([
      { value: "Alice", label: "Alice" },
      { value: "Bob", label: "Bob" },
    ]);
    const qaField = projectForm.fields(ctx("create")).find((field) => field.name === "qaLead");
    expect(qaField?.options?.(ctx("create"))).toEqual([{ value: "Bob", label: "Bob" }]);
  });

  it("en modification conserve la valeur enregistree meme quand c'est moi", () => {
    const store = fakeStore();
    const formValues = { ...values, manager: "Dave", qaLead: "Dave" };
    const managerField = projectForm
      .fields(ctx("update", store, formValues))
      .find((field) => field.name === "manager");
    expect(managerField?.options?.(ctx("update", store, formValues))).toEqual([
      { value: "Alice", label: "Alice" },
      { value: "Bob", label: "Bob" },
      { value: "Dave", label: "Dave" },
    ]);
  });

  it("propose les versions du produit et « Nouvelle version »", () => {
    const field = projectForm.fields(ctx()).find((f) => f.name === "targetVersion");
    expect(field?.options?.(ctx())).toEqual([
      { value: "2.0", label: "2.0" },
      { value: "__new__", label: "common.version_new" },
    ]);
  });

  it("changer de produit recale la version cible sur ses versions", () => {
    const field = projectForm.fields(ctx()).find((f) => f.name === "productId");
    const setValue = vi.fn();
    field?.onChange?.({ value: "42", ctx: ctx(), setValue, getValues: () => values });
    expect(setValue).toHaveBeenCalledWith("targetVersion", "1.1");
  });

  it("propose tous les produits en creation", () => {
    const productField = projectForm
      .fields(ctx("create"))
      .find((field) => field.name === "productId");
    expect(productField?.options?.(ctx("create"))).toEqual([
      { value: "42", label: "Ancien" },
      { value: "77", label: "Nouveau" },
    ]);
  });

  it("adapte titre, libelle de soumission et message de succes au mode", () => {
    const store = fakeStore();
    expect(projectForm.title(ctx("create", store))).toBe("pages.projects.new_project_page");
    expect(projectForm.title(ctx("update", store, values, { name: "Atlas" } as never))).toBe(
      "pages.projects.edit_project_page — Atlas",
    );
    expect(projectForm.submitLabel(ctx("create", store))).toBe("pages.projects.new_project");
    expect(projectForm.submitLabel(ctx("update", store))).toBe("actions.enregistrer");
    expect(projectForm.successMessage(ctx("create", store))).toBe(
      "pages.projects.created « Atlas »",
    );
    expect(projectForm.successMessage(ctx("update", store))).toBe(
      "pages.projects.updated « Atlas »",
    );
  });

  it("part du premier produit en creation, de l'entite en modification", () => {
    const store = fakeStore();
    expect(projectForm.defaults({ ctx: initCtx(store) })).toMatchObject({
      name: "",
      productId: "42",
      targetVersion: "1.1",
      newTargetVersion: "",
      manager: "Alice",
      qaLead: "Bob",
      status: "planifie",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
    });
    const entity = {
      name: "Atlas",
      objective: "Portail",
      productId: "77",
      targetVersion: "2.0",
      manager: "Alice",
      qaLead: "Bob",
      status: "encours",
      startDate: "2026-01-01",
      endDate: "2026-02-01",
    };
    expect(projectForm.defaults({ entity: entity as never, ctx: initCtx(store) })).toEqual({
      ...entity,
      newTargetVersion: "",
    });
  });
});

describe("projectForm.save", () => {
  it("hors ligne en creation : ecrit dans le store local avec normalisation", async () => {
    const store = fakeStore();
    await projectForm.save({
      values,
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.addProject).toHaveBeenCalledWith({
      productId: "77",
      name: "Atlas",
      objective: "Portail",
      targetVersion: "2.0",
      status: "encours",
      startDate: "2026-01-01",
      endDate: "2026-02-01",
      manager: "Alice",
      qaLead: "Bob",
    });
    expect(createProject).not.toHaveBeenCalled();
  });

  it("hors ligne en modification : passe par updateProject", async () => {
    const store = fakeStore();
    await projectForm.save({
      values,
      mode: "update",
      id: "42",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.updateProject).toHaveBeenCalledWith(
      "42",
      expect.objectContaining({
        name: "Atlas",
        targetVersion: "2.0",
      }),
    );
    expect(updateProjectById).not.toHaveBeenCalled();
  });

  it("en ligne en creation : poste le payload puis remplace la liste", async () => {
    vi.mocked(createProject).mockResolvedValue({
      project: { id: 99 } as unknown as BackendProject,
    });
    const store = fakeStore();
    await projectForm.save({
      values,
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(createProject).toHaveBeenCalledWith({
      name: "Atlas",
      description: "Portail",
      product_id: 77,
      target_version: "2.0",
      test_lead_ids: [7, 8],
      start_date: "2026-01-01",
      end_date: "2026-02-01",
    });
    expect(store.replaceProjects).toHaveBeenCalledWith([
      { id: "42", name: "Ancien" },
      {
        id: "99",
        productId: "77",
        name: "Atlas",
        objective: "Portail",
        targetVersion: "2.0",
        status: "encours",
        startDate: "2026-01-01",
        endDate: "2026-02-01",
        manager: "Alice",
        qaLead: "Bob",
      },
    ]);
  });

  it("en ligne en modification : met a jour la ligne existante", async () => {
    vi.mocked(updateProjectById).mockResolvedValue({
      project: { id: 42 } as unknown as BackendProject,
    });
    const store = fakeStore();
    await projectForm.save({
      values,
      mode: "update",
      id: "42",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(updateProjectById).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ name: "Atlas", product_id: 77, test_lead_ids: [7, 8] }),
    );
    expect(store.replaceProjects).toHaveBeenCalledWith([
      expect.objectContaining({ id: "42", name: "Atlas", targetVersion: "2.0" }),
    ]);
  });

  it("nouvelle version : envoyée au serveur et ajoutée aux versions du produit", async () => {
    vi.mocked(createProject).mockResolvedValue({
      project: { id: 99 } as unknown as BackendProject,
    });
    const store = fakeStore();
    await projectForm.save({
      values: { ...values, targetVersion: "__new__", newTargetVersion: " 3.0 " },
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(createProject).toHaveBeenCalledWith(expect.objectContaining({ target_version: "3.0" }));
    const products = vi.mocked(store.replaceProducts).mock.calls[0]?.[0] as { id: string; versions: string[] }[];
    expect(products.find((p) => p.id === "77")?.versions).toEqual(["2.0", "3.0"]);
  });

  it("deduplique et filtre les identifiants de test", async () => {
    vi.mocked(createProject).mockResolvedValue({
      project: { id: 99 } as unknown as BackendProject,
    });
    const store = fakeStore();
    await projectForm.save({
      values: { ...values, manager: "Bob", qaLead: "Bob" },
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(createProject).toHaveBeenCalledWith(expect.objectContaining({ test_lead_ids: [8] }));
  });
});
