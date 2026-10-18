import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import type { TestCase } from "@/lib/dhi-data";
import { testForm, type TestFormValues } from "./test-form";
import type { FormMode, FormRunContext, Store } from "./types";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: vi.fn() };
});

const t = (key: string) => key;

function fakeStore(overrides: Record<string, unknown> = {}) {
  return {
    campaigns: [{ id: "camp-1", productId: "42", testers: ["Alice"] }],
    products: [{ id: "42", name: "Ancien" }],
    features: [
      { id: "f1", productId: "42", name: "Connexion" },
      { id: "f2", productId: "77", name: "Autre" },
    ],
    users: [
      { id: "7", name: "Alice", active: true, roles: ["testeur"] },
      { id: "8", name: "Inactif", active: false, roles: ["testeur"] },
    ],
    tests: [],
    addTestCase: vi.fn(() => "T-new"),
    updateTest: vi.fn(),
    ...overrides,
  };
}

const values: TestFormValues = {
  name: "  Test SSO  ",
  featureId: "f1",
  criticality: "haute",
  type: "regression",
  tester: "Alice",
  preconditions: "Naviguer\nSe connecter",
  steps: "Etape 1\nEtape 2",
  expected: "OK",
  observed: "  Vu  ",
  comment: "  note  ",
};

const ctx = (
  mode: FormMode = "create",
  store = fakeStore(),
  formValues: TestFormValues = values,
  entity?: TestCase | undefined,
): FormRunContext<TestFormValues, TestCase> => ({
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

describe("testForm.validation", () => {
  it("rejette le nom vide avec la cle du domaine", () => {
    const result = testForm("camp-1")
      .validation(ctx())
      .safeParse({ ...values, name: " " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["name"],
        message: "pages.campaign_detail.nom_test_obligatoire",
      });
    }
  });

  it("accepte un formulaire valide et conserve les types proposes", () => {
    const result = testForm("camp-1").validation(ctx()).safeParse(values);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ ...values, name: "Test SSO" });
  });

  it("refuse un type hors des types proposes", () => {
    const result = testForm("camp-1")
      .validation(ctx())
      .safeParse({ ...values, type: "ux" });
    expect(result.success).toBe(false);
  });
});

describe("testForm adaptation au contexte de campagne", () => {
  it("ne propose que les fonctionnalites du produit de la campagne", () => {
    const store = fakeStore();
    const field = testForm("camp-1")
      .fields(ctx("create", store))
      .find((f) => f.name === "featureId");
    expect(field?.options?.(ctx("create", store))).toEqual([{ value: "f1", label: "Connexion" }]);
  });

  it("signale l'absence de fonctionnalite par une option inactive", () => {
    const store = fakeStore({
      features: [{ id: "f2", productId: "77", name: "Autre" }],
    });
    const field = testForm("camp-1")
      .fields(ctx("create", store))
      .find((f) => f.name === "featureId");
    expect(field?.options?.(ctx("create", store))).toEqual([
      { value: "", label: "pages.campaign_detail.aucune_fonctionnalite", disabled: true },
    ]);
  });

  it("conserve en modification le testeur retire de la campagne", () => {
    const store = fakeStore({
      tests: [{ id: "T-1", tester: "Zoe", assignedTo: 9 }],
    });
    const entity = { id: "T-1", tester: "Zoe", assignedTo: 9 } as never;
    const field = testForm("camp-1")
      .fields(ctx("update", store, values, entity))
      .find((f) => f.name === "tester");
    const options = field?.options?.(ctx("update", store, values, entity)) ?? [];
    expect(options.map((o) => o.value)).toEqual(["", "Alice", "Zoe"]);
  });

  it("part de la premiere fonctionnalite en creation, de l'entite en modification", () => {
    const store = fakeStore();
    expect(testForm("camp-1").defaults({ ctx: initCtx(store) })).toEqual({
      name: "",
      featureId: "f1",
      criticality: "moyenne",
      type: "fonctionnel",
      tester: "",
      preconditions: "",
      steps: "",
      expected: "",
      observed: "",
      comment: "",
    });

    const entity = {
      name: "Test SSO",
      featureId: "f1",
      criticality: "critique",
      type: "regression",
      tester: "Zoe",
      preconditions: ["a", "b"],
      steps: ["c"],
      expected: ["d"],
      observed: "vu",
      comment: "note",
    };
    expect(testForm("camp-1").defaults({ entity: entity as never, ctx: initCtx(store) })).toEqual({
      name: "Test SSO",
      featureId: "f1",
      criticality: "critique",
      type: "regression",
      tester: "Zoe",
      preconditions: "a\nb",
      steps: "c",
      expected: "d",
      observed: "vu",
      comment: "note",
    });
  });

  it("adapte titre, libelle, notice et soumission au mode", () => {
    const store = fakeStore();
    const entity = { id: "T-1", name: "Test SSO" } as never;
    expect(testForm("camp-1").title(ctx("create", store))).toBe(
      "pages.campaign_detail.ajouter_un_test",
    );
    expect(testForm("camp-1").title(ctx("update", store, values, entity))).toBe(
      "pages.campaign_detail.modifier_cas_test — T-1 · Test SSO",
    );
    expect(testForm("camp-1").submitLabel(ctx("create", store))).toBe(
      "pages.campaign_detail.creer_le_cas_test",
    );
    expect(testForm("camp-1").submitLabel(ctx("update", store))).toBe("actions.enregistrer");
    expect(testForm("camp-1").successMessage(ctx("create", store), "T-9")).toBe(
      "pages.campaign_detail.cas_test_creer",
    );
    expect(testForm("camp-1").successMessage(ctx("update", store, values, entity))).toBe(
      "pages.campaign_detail.cas_test_modifier",
    );
  });
});

describe("testForm.save", () => {
  it("en creation : addTestCase avec lignes et testeur resolu, puis retourne l'id", async () => {
    const store = fakeStore();
    const saved = await testForm("camp-1").save({
      values,
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(store.addTestCase).toHaveBeenCalledWith({
      campaignId: "camp-1",
      name: "Test SSO",
      featureId: "f1",
      criticality: "haute",
      type: "regression",
      preconditions: ["Naviguer", "Se connecter"],
      steps: ["Etape 1", "Etape 2"],
      expected: ["OK"],
      observed: "Vu",
      comment: "note",
      tester: "Alice",
      assignedTo: 7,
    });
    expect(saved).toBe("T-new");
    expect(store.updateTest).not.toHaveBeenCalled();
  });

  it("sans testeur affecte : assignedTo null explicite", async () => {
    const store = fakeStore();
    await testForm("camp-1").save({
      values: { ...values, tester: "" },
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.addTestCase).toHaveBeenCalledWith(
      expect.objectContaining({ tester: undefined, assignedTo: null }),
    );
  });

  it("en modification hors ligne : updateTest seul", async () => {
    const store = fakeStore();
    await testForm("camp-1").save({
      values,
      mode: "update",
      id: "T-1",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.updateTest).toHaveBeenCalledWith(
      "T-1",
      expect.objectContaining({ name: "Test SSO", tester: "Alice", assignedTo: 7 }),
    );
    expect(api).not.toHaveBeenCalled();
  });

  it("en modification en ligne : updateTest puis PUT /test-cases/:id", async () => {
    const store = fakeStore();
    await testForm("camp-1").save({
      values: { ...values, featureId: "12" },
      mode: "update",
      id: "77",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(store.updateTest).toHaveBeenCalled();
    expect(api).toHaveBeenCalledWith(
      "/test-cases/77",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          name: "Test SSO",
          feature_id: 12,
          steps: "Etape 1\nEtape 2",
          expected_result: "OK",
          priority: "high",
          type: "regression",
          assigned_to: 7,
        }),
      }),
    );
  });

  it("en modification, le testeur conserve hors campagne garde son affectation", async () => {
    const store = fakeStore({
      tests: [{ id: "T-1", tester: "Zoe", assignedTo: 9 }],
    });
    await testForm("camp-1").save({
      values: { ...values, tester: "Zoe" },
      mode: "update",
      id: "T-1",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.updateTest).toHaveBeenCalledWith(
      "T-1",
      expect.objectContaining({ tester: "Zoe", assignedTo: 9 }),
    );
  });
});
