import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import type { Requirement } from "@/lib/dhi-data";
import { requirementForm, type RequirementFormValues } from "./requirement-form";
import type { FormMode, FormRunContext, Store } from "./types";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    api: vi.fn(),
    mapBackendRequirement: (requirement: { id: number; title?: string }) => ({
      id: String(requirement.id),
      title: requirement.title ?? "",
    }),
  };
});

const t = (key: string) => key;

function fakeStore() {
  return {
    products: [
      { id: "42", name: "Ancien" },
      { id: "77", name: "Nouveau" },
    ],
    features: [
      { id: "f1", productId: "42", name: "Connexion", description: "SSO", criticality: "critique" },
      { id: "f2", productId: "42", name: "Export", description: "", criticality: "basse" },
      { id: "f3", productId: "42", name: "Autre", description: "", criticality: "moyenne" },
    ],
    requirements: [{ id: "1", title: "Existant" }],
    addRequirement: vi.fn(),
    updateRequirement: vi.fn(),
    replaceRequirements: vi.fn(),
  };
}

const values: RequirementFormValues = {
  title: "  Exigence A  ",
  description: "detail",
  productId: "42",
  priority: "haute",
  status: "validee",
  featureIds: ["f1"],
};

const ctx = (
  mode: FormMode = "create",
  store = fakeStore(),
  formValues: RequirementFormValues = values,
  entity?: Requirement | undefined,
): FormRunContext<RequirementFormValues, Requirement> => ({
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

describe("requirementForm.validation", () => {
  it("rejette le titre vide avec la cle du domaine", () => {
    const result = requirementForm.validation(ctx()).safeParse({ ...values, title: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["title"],
        message: "pages.requirements.title_required",
      });
    }
  });

  it("accepte un formulaire valide et rogne le titre", () => {
    const result = requirementForm.validation(ctx()).safeParse(values);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Exigence A");
  });
});

describe("requirementForm adaptation au contexte", () => {
  it("n'affiche les fonctionnalites couvertes que si le produit en a", () => {
    const names = (formValues: RequirementFormValues) =>
      requirementForm.fields(ctx("create", fakeStore(), formValues)).map((f) => f.name);
    expect(names({ ...values, productId: "42" })).toContain("featureIds");
    expect(names({ ...values, productId: "77" })).not.toContain("featureIds");
  });

  it("vide les fonctionnalites liees quand le produit change", () => {
    const field = requirementForm.fields(ctx()).find((f) => f.name === "productId");
    const setValue = vi.fn();
    field?.onChange?.({ value: "77", ctx: ctx(), setValue, getValues: () => values });
    expect(setValue).toHaveBeenCalledWith("featureIds", []);
  });

  it("adapte titre, libelle et notice au mode", () => {
    const store = fakeStore();
    const entity = { id: "REQ-3", title: "Exigence A" } as never;
    expect(requirementForm.title(ctx("create", store))).toBe(
      "pages.requirements.new_requirement_page",
    );
    expect(requirementForm.title(ctx("update", store, values, entity))).toBe(
      "pages.requirements.edit_requirement_page — REQ-3 · Exigence A",
    );
    expect(requirementForm.submitLabel(ctx("create", store))).toBe("actions.ajouter");
    expect(requirementForm.submitLabel(ctx("update", store))).toBe("actions.enregistrer");
    expect(requirementForm.successMessage({ ...ctx("create", store), online: false })).toEqual({
      message: "pages.requirements.not_authenticated",
      kind: "warning",
      duration: 9000,
    });
    expect(requirementForm.successMessage({ ...ctx("create", store), online: true })).toBe(
      "pages.requirements.added",
    );
    expect(
      requirementForm.successMessage(ctx("update", store, values, { id: "REQ-3" } as never)),
    ).toBe("pages.requirements.updated");
  });

  it("part du premier produit visible en creation, de l'entite en modification", () => {
    const store = fakeStore();
    expect(requirementForm.defaults({ ctx: initCtx(store) })).toMatchObject({
      title: "",
      productId: "42",
      priority: "moyenne",
      status: "brouillon",
      featureIds: [],
    });
    const entity = {
      title: "Exigence A",
      description: "d",
      productId: "77",
      priority: "critique" as const,
      status: "couverte" as const,
      featureIds: ["f3"],
    };
    expect(requirementForm.defaults({ entity: entity as never, ctx: initCtx(store) })).toEqual(
      entity,
    );
    expect(
      requirementForm.defaults({ entity: entity as never, ctx: initCtx(store) }).featureIds,
    ).not.toBe(entity.featureIds);
  });
});

describe("requirementForm.save", () => {
  it("hors ligne en creation : ecrit dans le store local", async () => {
    const store = fakeStore();
    await requirementForm.save({
      values,
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.addRequirement).toHaveBeenCalledWith({
      productId: "42",
      title: "Exigence A",
      description: "detail",
      priority: "haute",
      status: "validee",
      featureIds: ["f1"],
    });
    expect(api).not.toHaveBeenCalled();
  });

  it("hors ligne en modification : passe par updateRequirement", async () => {
    const store = fakeStore();
    await requirementForm.save({
      values,
      mode: "update",
      id: "9",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.updateRequirement).toHaveBeenCalledWith(
      "9",
      expect.objectContaining({ title: "Exigence A" }),
    );
    expect(api).not.toHaveBeenCalled();
  });

  it("en ligne en creation : POST /requirements puis remplace la liste", async () => {
    vi.mocked(api).mockResolvedValue({ id: 77, title: "Exigence A" });
    const store = fakeStore();
    await requirementForm.save({
      values,
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(api).toHaveBeenCalledWith(
      "/requirements",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          title: "Exigence A",
          description: "detail",
          status: "validated",
          priority: "high",
          product_id: 42,
          feature_ids: [],
        }),
      }),
    );
    expect(store.replaceRequirements).toHaveBeenCalledWith([
      { id: "1", title: "Existant" },
      { id: "77", title: "Exigence A" },
    ]);
  });

  it("en ligne en modification : PUT /requirements/:id sur la bonne ligne", async () => {
    vi.mocked(api).mockResolvedValue({ id: 9, title: "Exigence A" });
    const store = fakeStore();
    store.requirements = [{ id: "9", title: "Existant" }];
    await requirementForm.save({
      values,
      mode: "update",
      id: "9",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(api).toHaveBeenCalledWith("/requirements/9", expect.objectContaining({ method: "PUT" }));
    expect(store.replaceRequirements).toHaveBeenCalledWith([{ id: "9", title: "Exigence A" }]);
  });
});
