import { beforeEach, describe, expect, it, vi } from "vitest";
import { REQUIREMENT_STATUS_LABEL, TEST_TYPES, type Feature } from "@/lib/dhi-data";
import { featureForm, type FeatureFormValues } from "./feature-form";
import type { FormMode, FormRunContext, Store } from "./types";

const t = (key: string) => key;

function fakeStore(overrides: Record<string, unknown> = {}) {
  return {
    products: [
      { id: "42", name: "Ancien" },
      { id: "77", name: "Nouveau" },
    ],
    campaigns: [{ id: "c1", productId: "42", name: "Camp A" }],
    productDocuments: [{ id: "d1", productId: "42", name: "CDC.pdf" }],
    requirements: [
      {
        id: "r1",
        productId: "42",
        title: "Exigence 1",
        featureIds: [] as string[],
        priority: "haute",
        status: "validee",
      },
      {
        id: "r2",
        productId: "77",
        title: "Exigence 2",
        featureIds: [] as string[],
        priority: "basse",
        status: "brouillon",
      },
    ],
    addFeature: vi.fn(() => "f-new"),
    updateFeature: vi.fn(),
    updateRequirement: vi.fn(),
    ...overrides,
  };
}

const values: FeatureFormValues = {
  name: "  Connexion SSO  ",
  description: "desc",
  productId: "42",
  criticality: "haute",
  campaignId: "c1",
  sourceDocId: "d1",
  coverage: ["fonctionnel"],
  requirementIds: ["r1"],
};

const ctx = (
  mode: FormMode = "create",
  store = fakeStore(),
  formValues: FeatureFormValues = values,
  entity?: Feature | undefined,
): FormRunContext<FeatureFormValues, Feature> => ({
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

describe("featureForm.validation", () => {
  it("rejette le nom vide avec la cle du domaine", () => {
    const result = featureForm.validation(ctx()).safeParse({ ...values, name: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["name"],
        message: "pages.features.name_required",
      });
    }
  });

  it("accepte un formulaire valide et rogne le nom", () => {
    const result = featureForm.validation(ctx()).safeParse(values);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Connexion SSO");
  });
});

describe("featureForm adaptation au contexte", () => {
  it("n'affiche le rattachement campagne qu'en creation", () => {
    const names = (mode: FormMode) => featureForm.fields(ctx(mode)).map((f) => f.name);
    expect(names("create")).toContain("campaignId");
    expect(names("update")).not.toContain("campaignId");
  });

  it("reinitialise campagne, document source et exigences quand le produit change", () => {
    const field = featureForm.fields(ctx()).find((f) => f.name === "productId");
    const setValue = vi.fn();
    field?.onChange?.({ value: "77", ctx: ctx(), setValue, getValues: () => values });
    expect(setValue).toHaveBeenCalledWith("campaignId", "");
    expect(setValue).toHaveBeenCalledWith("sourceDocId", "");
    expect(setValue).toHaveBeenCalledWith("requirementIds", []);
  });

  it("propose l'option automatique seulement si le produit a des campagnes", () => {
    const campaignField = featureForm.fields(ctx()).find((f) => f.name === "campaignId");
    expect(campaignField?.options?.(ctx())).toEqual([
      { value: "", label: "pages.features.campaign_auto" },
      { value: "c1", label: "Camp A" },
    ]);

    const withoutCampaign = fakeStore({ campaigns: [] });
    const field = featureForm
      .fields(ctx("create", withoutCampaign))
      .find((f) => f.name === "campaignId");
    expect(field?.options?.(ctx("create", withoutCampaign))).toEqual([
      { value: "", label: "pages.features.no_campaign_for_product", disabled: true },
    ]);
    expect(field?.helpText?.(ctx("create", withoutCampaign))).toBe(
      "pages.features.sync_no_campaign",
    );
  });

  it("limite les exigences au produit courant, avec statut en legende", () => {
    const store = fakeStore();
    const field = featureForm.fields(ctx("create", store)).find((f) => f.name === "requirementIds");
    const options = field?.options?.(ctx("create", store)) ?? [];
    expect(options.map((option) => option.value)).toEqual(["r1"]);
    expect(field?.hint?.(options[0]!)).toBe(REQUIREMENT_STATUS_LABEL.validee);
    expect(field?.emptyText?.(ctx("create", fakeStore({ requirements: [] })))).toBe(
      "pages.features.no_requirement_for_product",
    );
  });

  it("adapte titre et notice au mode", () => {
    const store = fakeStore();
    const entity = { id: "f-1", name: "Connexion" } as never;
    expect(featureForm.title(ctx("create", store))).toBe("pages.features.new_feature_page");
    expect(featureForm.title(ctx("update", store, values, entity))).toBe(
      "pages.features.edit_feature_page — Connexion",
    );
    expect(featureForm.successMessage(ctx("create", store))).toBe("pages.features.created_msg");
    expect(featureForm.successMessage(ctx("update", store, values, entity))).toBe(
      "pages.features.updated_msg",
    );
  });

  it("part du premier produit en creation, de l'entite en modification", () => {
    const store = fakeStore();
    expect(featureForm.defaults({ ctx: initCtx(store) })).toMatchObject({
      name: "",
      productId: "42",
      criticality: "moyenne",
      campaignId: "",
      sourceDocId: "",
      coverage: [],
      requirementIds: [],
    });

    store.requirements.push({
      id: "r9",
      productId: "42",
      title: "Lien",
      featureIds: ["f-1"],
      priority: "moyenne",
      status: "brouillon",
    });
    const entity = {
      id: "f-1",
      productId: "77",
      name: "Connexion",
      description: "d",
      criticality: "critique",
      coverage: { fonctionnel: true, api: true },
      sourceDocId: "",
    };
    const defaults = featureForm.defaults({ entity: entity as never, ctx: initCtx(store) });
    expect(defaults).toEqual({
      name: "Connexion",
      description: "d",
      productId: "77",
      criticality: "critique",
      campaignId: "",
      sourceDocId: "",
      coverage: ["fonctionnel", "api"],
      requirementIds: ["r9"],
    });
    expect(defaults.coverage).not.toBe(entity.coverage);
  });
});

describe("featureForm.save", () => {
  it("en creation : addFeature avec coverage en record, puis liens aller-retour", async () => {
    const store = fakeStore();
    const saved = await featureForm.save({
      values,
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    const expectedCoverage: Record<string, boolean> = {};
    for (const testType of TEST_TYPES) {
      expectedCoverage[testType.id] = testType.id === "fonctionnel";
    }
    expect(store.addFeature).toHaveBeenCalledWith({
      productId: "42",
      campaignId: "c1",
      name: "Connexion SSO",
      description: "desc",
      criticality: "haute",
      coverage: expectedCoverage,
      sourceDocId: "d1",
    });
    expect(saved).toBe("f-new");
    expect(store.updateRequirement).toHaveBeenCalledWith("r1", {
      featureIds: ["f-new"],
    });
    expect(store.updateFeature).not.toHaveBeenCalled();
  });

  it("en creation sans campagne ni document : champs absents du montage", async () => {
    const store = fakeStore();
    await featureForm.save({
      values: { ...values, campaignId: "", sourceDocId: "" },
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.addFeature).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: undefined, sourceDocId: undefined }),
    );
  });

  it("en modification : updateFeature sans campagne, liens retires et ajoutes", async () => {
    const store = fakeStore();
    store.requirements = [
      {
        id: "r1",
        productId: "42",
        title: "E1",
        featureIds: [],
        priority: "haute",
        status: "validee",
      },
      {
        id: "r2",
        productId: "42",
        title: "E2",
        featureIds: ["f-1"],
        priority: "basse",
        status: "brouillon",
      },
    ];
    await featureForm.save({
      values,
      mode: "update",
      id: "f-1",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(store.updateFeature).toHaveBeenCalledWith(
      "f-1",
      expect.objectContaining({
        name: "Connexion SSO",
        criticality: "haute",
        sourceDocId: "d1",
      }),
    );
    expect(store.updateFeature).toHaveBeenCalledWith(
      "f-1",
      expect.not.objectContaining({ campaignId: expect.anything() }),
    );
    expect(store.addFeature).not.toHaveBeenCalled();
    // r1 est selectionnee mais pas liee : le lien est cree ; r2 est liee mais
    // deselectionnee : le lien part.
    expect(store.updateRequirement).toHaveBeenCalledWith("r1", {
      featureIds: ["f-1"],
    });
    expect(store.updateRequirement).toHaveBeenCalledWith("r2", { featureIds: [] });
  });
});
