import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { CAMPAIGN_OWNER_ROLES } from "@/lib/dhi-data";
import { campaignForm, type CampaignFormValues } from "./campaign-form";
import type { FormMode, FormRunContext, Store } from "./types";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    api: vi.fn(),
    mapBackendCampaign: (response: { id: number }, project?: { product_id?: number }) => ({
      id: String(response.id),
      productId: project?.product_id ? String(project.product_id) : "",
      name: "Campagne backend",
    }),
  };
});

const t = (key: string) => key;

function fakeStore(overrides: Record<string, unknown> = {}) {
  return {
    products: [
      { id: "p1", name: "Produit A", versions: ["2.0", "4.13"] },
      { id: "p2", name: "Produit B", versions: ["9.9"] },
    ],
    replaceProducts: vi.fn(),
    projects: [
      {
        id: "10",
        productId: "p1",
        name: "Projet A",
        targetVersion: "2.0",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
      { id: "11", productId: "p2", name: "Projet B", targetVersion: "9.9" },
    ],
    campaigns: [{ id: "c1", productId: "p1", name: "Recette 4.12", status: "encours" }],
    users: [
      { id: "7", name: "Alice", active: true, role: "chef_testeur" },
      { id: "5", name: "Bob", active: true, role: "developpeur" },
      { id: "6", name: "Carla", active: true, role: "testeur" },
      { id: "8", name: "Dan", active: false, role: "chef_testeur" },
      { id: "9", name: "Eve", active: true, role: "lecteur" },
    ],
    addCampaign: vi.fn(() => "c-new"),
    replaceCampaigns: vi.fn(),
    ...overrides,
  };
}

const values: CampaignFormValues = {
  name: "  Recette v4.13  ",
  type: "Recette",
  productId: "p1",
  projectId: "10",
  version: "4.13",
  newVersion: "",
  environment: "RECETTE",
  owner: "Alice",
  startDate: "2026-06-01",
  endDate: "2026-06-30",
  clone: true,
  cloneFrom: "c1",
  testers: new Set(["Alice", "Carla"]),
  developers: new Set(["Bob"]),
};

const ctx = (
  mode: FormMode = "create",
  store = fakeStore(),
  formValues: CampaignFormValues = values,
): FormRunContext<CampaignFormValues, undefined> => ({
  mode,
  t,
  store: store as unknown as Store,
  values: formValues,
});

const initCtx = (store = fakeStore()) => ({
  mode: "create" as FormMode,
  t,
  store: store as unknown as Store,
});

const parse = (partial: Partial<CampaignFormValues>) =>
  campaignForm.validation(ctx()).safeParse({ ...values, ...partial });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("campaignForm.validation", () => {
  it("exige le nom et le rattachement a un projet", () => {
    const name = parse({ name: "   " });
    expect(name.success).toBe(false);
    if (!name.success) {
      expect(name.error.issues[0]).toMatchObject({
        path: ["name"],
        message: "pages.add_campaign.name_required",
      });
    }
    const project = parse({ projectId: "" });
    expect(project.success).toBe(false);
    if (!project.success) {
      expect(project.error.issues[0]).toMatchObject({
        path: ["projectId"],
        message: "pages.add_campaign.project_required",
      });
    }
  });

  it("interdit une date de fin avant la date de debut", () => {
    const result = parse({ endDate: "2026-05-01" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["endDate"],
        message: "pages.add_campaign.end_date_before_start",
      });
    }
  });

  it("tient la campagne dans les bornes du projet parent", () => {
    const before = parse({ startDate: "2025-12-01" });
    expect(before.success).toBe(false);
    if (!before.success) {
      expect(before.error.issues[0]).toMatchObject({
        path: ["startDate"],
        message: "pages.add_campaign.starts_before_project",
      });
    }
    const after = parse({ endDate: "2027-01-01" });
    expect(after.success).toBe(false);
    if (!after.success) {
      expect(after.error.issues[0]).toMatchObject({
        path: ["endDate"],
        message: "pages.add_campaign.ends_after_project",
      });
    }
  });

  it("accepte une campagne dans les bornes du projet", () => {
    expect(campaignForm.validation(ctx()).safeParse(values).success).toBe(true);
  });
});

describe("campaignForm adaptation au contexte", () => {
  it("filtre les projets sur le produit courant", () => {
    const store = fakeStore();
    const field = campaignForm.fields(ctx("create", store)).find((f) => f.name === "projectId");
    expect(field?.options?.(ctx("create", store))).toEqual([{ value: "10", label: "Projet A" }]);
  });

  it("ne propose comme responsable que les roles habilites", () => {
    const store = fakeStore();
    const field = campaignForm.fields(ctx("create", store)).find((f) => f.name === "owner");
    expect(field?.options?.(ctx("create", store))).toEqual([{ value: "Alice", label: "Alice" }]);
    expect(CAMPAIGN_OWNER_ROLES).toContain("chef_testeur");
  });

  it("propose les testeurs et developpeurs actifs", () => {
    const store = fakeStore();
    const fields = campaignForm.fields(ctx("create", store));
    const testers = fields.find((f) => f.name === "testers");
    expect(testers?.member?.options(ctx("create", store)).map((o) => o.name)).toEqual(["Carla"]);
    const developers = fields.find((f) => f.name === "developers");
    expect(developers?.member?.options(ctx("create", store)).map((o) => o.name)).toEqual(["Bob"]);
  });

  it("ne rend le choix de la campagne source que si le clonage est actif", () => {
    const store = fakeStore();
    const field = campaignForm.fields(ctx("create", store)).find((f) => f.name === "cloneFrom");
    expect(field?.when?.(ctx("create", store, { ...values, clone: true }))).toBe(true);
    expect(field?.when?.(ctx("create", store, { ...values, clone: false }))).toBe(false);
  });

  it("borne la date de fin a la date de debut", () => {
    const store = fakeStore();
    const field = campaignForm.fields(ctx("create", store)).find((f) => f.name === "endDate");
    expect(field?.min?.(ctx("create", store))).toBe("2026-06-01");
  });

  it("recalcule projet et version quand le produit change", () => {
    const store = fakeStore();
    const field = campaignForm.fields(ctx("create", store)).find((f) => f.name === "productId");
    const setValue = vi.fn();
    field?.onChange?.({
      value: "p2",
      ctx: ctx("create", store),
      setValue,
      getValues: () => values,
    });
    expect(setValue).toHaveBeenCalledWith("projectId", "11");
    expect(setValue).toHaveBeenCalledWith("version", "9.9");
  });

  it("recalcule produit et version quand le projet change", () => {
    const store = fakeStore();
    const field = campaignForm.fields(ctx("create", store)).find((f) => f.name === "projectId");
    const setValue = vi.fn();
    field?.onChange?.({
      value: "11",
      ctx: ctx("create", store),
      setValue,
      getValues: () => values,
    });
    expect(setValue).toHaveBeenCalledWith("productId", "p2");
    expect(setValue).toHaveBeenCalledWith("version", "9.9");
  });

  it("exige une version visée", () => {
    const store = fakeStore();
    const empty = campaignForm.validation(ctx("create", store)).safeParse({ ...values, version: "" });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.error.issues[0]).toMatchObject({
        path: ["version"],
        message: "common.version_required",
      });
    }
    const newEmpty = campaignForm
      .validation(ctx("create", store))
      .safeParse({ ...values, version: "__new__", newVersion: " " });
    expect(newEmpty.success).toBe(false);
  });

  it("propose les versions du produit et « Nouvelle version »", () => {
    const store = fakeStore();
    const field = campaignForm.fields(ctx("create", store)).find((f) => f.name === "version");
    expect(field?.options?.(ctx("create", store))).toEqual([
      { value: "2.0", label: "2.0" },
      { value: "4.13", label: "4.13" },
      { value: "__new__", label: "common.version_new" },
    ]);
  });

  it("part des valeurs de depart de la page d'origine", () => {
    const store = fakeStore();
    const defaults = campaignForm.defaults({ ctx: initCtx(store) });
    expect(defaults).toEqual({
      name: "",
      type: "Recette",
      productId: "p-paiement",
      projectId: "pr-3ds",
      version: "",
      newVersion: "",
      environment: "RECETTE",
      owner: "Marie Martin",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      clone: true,
      cloneFrom: "c-recette-412",
      testers: new Set<string>(),
      developers: new Set<string>(),
    });
  });

  it("publie les cles de la page", () => {
    const store = fakeStore();
    expect(campaignForm.title(ctx("create", store))).toBe(
      "pages.add_campaign.informations_generales",
    );
    expect(campaignForm.submitLabel(ctx("create", store))).toBe("pages.add_campaign.create");
    expect(campaignForm.successMessage(ctx("create", store))).toBe(
      `common.campagne « Recette v4.13 » pages.add_campaign.created`,
    );
  });
});

describe("campaignForm.save", () => {
  it("hors ligne : cree la campagne locale avec clonage", async () => {
    const store = fakeStore();
    const result = await campaignForm.save({
      values,
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(result).toBe("c-new");
    expect(store.addCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "p1",
        projectId: "10",
        name: "Recette v4.13",
        type: "Recette",
        status: "planifiee",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        testers: ["Alice", "Carla"],
        developers: ["Bob"],
        testLeads: ["Alice"],
      }),
      "c1",
    );
    expect(api).not.toHaveBeenCalled();
  });

  it("hors ligne sans clonage : aucune campagne source", async () => {
    const store = fakeStore();
    await campaignForm.save({
      values: { ...values, clone: false },
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.addCampaign).toHaveBeenCalledWith(expect.anything(), undefined);
  });

  it("sans date de fin : la fin retombe sur le debut", async () => {
    const store = fakeStore();
    await campaignForm.save({
      values: { ...values, endDate: "" },
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.addCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ endDate: "2026-06-01" }),
      expect.anything(),
    );
  });

  it("en ligne avec projet non numerique : reste local", async () => {
    const store = fakeStore();
    await campaignForm.save({
      values: { ...values, projectId: "pr-3ds" },
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(api).not.toHaveBeenCalled();
    expect(store.addCampaign).toHaveBeenCalled();
  });

  it("en ligne : POST /campaigns puis remplace la liste", async () => {
    vi.mocked(api).mockResolvedValue({ campaign: { id: 99 } });
    const store = fakeStore();
    const result = await campaignForm.save({
      values,
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(result).toBe("99");
    expect(api).toHaveBeenCalledWith("/campaigns", expect.objectContaining({ method: "POST" }));
    const body = JSON.parse(String(vi.mocked(api).mock.calls[0]?.[1]?.body));
    expect(body).toEqual({
      project_id: 10,
      name: "Recette v4.13",
      objective: "Campagne Recette 4.13",
      organization_mode: "scenario",
      start_date: "2026-06-01",
      end_date: "2026-06-30",
      version: "4.13",
      test_lead_ids: [7],
      testers: [7, 6],
      developers: [5],
    });
    expect(store.replaceCampaigns).toHaveBeenCalledWith([
      { id: "c1", productId: "p1", name: "Recette 4.12", status: "encours" },
      expect.objectContaining({ id: "99", name: "Recette v4.13", status: "planifiee" }),
    ]);
    expect(store.addCampaign).not.toHaveBeenCalled();
  });

  it("nouvelle version : envoyée au serveur et ajoutée aux versions du produit", async () => {
    vi.mocked(api).mockResolvedValue({ campaign: { id: 99 } });
    const store = fakeStore();
    await campaignForm.save({
      values: { ...values, version: "__new__", newVersion: "5.0" },
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    const body = JSON.parse(String(vi.mocked(api).mock.calls[0]?.[1]?.body));
    expect(body.version).toBe("5.0");
    const products = vi.mocked(store.replaceProducts).mock.calls[0]?.[0] as { id: string; versions: string[] }[];
    expect(products.find((p) => p.id === "p1")?.versions).toEqual(["2.0", "4.13", "5.0"]);
  });

  it("choisit le mode d'organisation selon le type de campagne", async () => {
    vi.mocked(api).mockResolvedValue({ campaign: { id: 99 } });
    const store = fakeStore();
    await campaignForm.save({
      values: { ...values, type: "Sécurité" },
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    const body = JSON.parse(String(vi.mocked(api).mock.calls[0]?.[1]?.body));
    expect(body.organization_mode).toBe("combination");
  });
});
