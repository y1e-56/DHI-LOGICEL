import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { WATCH_LEVEL_LABEL, type WatchPoint } from "@/lib/dhi-data";
import { watchPointForm, type WatchPointFormValues } from "./watchpoint-form";
import type { FormMode, FormRunContext, Store } from "./types";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    api: vi.fn(),
    mapBackendWatchPoint: (response: { id: number }, productId: string) => ({
      id: String(response.id),
      productId,
      title: "Point SSO",
    }),
  };
});

const t = (key: string) => key;

function fakeStore(overrides: Record<string, unknown> = {}) {
  return {
    products: [
      { id: "42", name: "Ancien" },
      { id: "77", name: "Nouveau" },
    ],
    features: [
      { id: "f1", productId: "42", name: "Connexion" },
      { id: "f2", productId: "77", name: "Export" },
    ],
    users: [
      { id: "7", name: "Alice", active: true },
      { id: "8", name: "Bob", active: false },
    ],
    projects: [{ id: "42", productId: "42" }],
    watchPoints: [{ id: "w1" }],
    addWatchPoint: vi.fn(),
    replaceWatchPoints: vi.fn(),
    ...overrides,
  };
}

const values: WatchPointFormValues = {
  title: "  Point SSO  ",
  description: "desc",
  productId: "42",
  featureId: "f1",
  level: "vigilance",
  owner: "Alice",
};

const ctx = (
  mode: FormMode = "create",
  store = fakeStore(),
  formValues: WatchPointFormValues = values,
): FormRunContext<WatchPointFormValues, WatchPoint> => ({
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("watchPointForm.validation", () => {
  it("rejette le titre vide avec la cle du domaine", () => {
    const result = watchPointForm.validation(ctx()).safeParse({ ...values, title: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["title"],
        message: "pages.watchpoints.title_required",
      });
    }
  });

  it("rejette la description vide, exigée par le serveur", () => {
    const result = watchPointForm.validation(ctx()).safeParse({ ...values, description: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["description"],
        message: "pages.watchpoints.description_required",
      });
    }
  });

  it("accepte un formulaire valide et rogne le titre", () => {
    const result = watchPointForm.validation(ctx()).safeParse(values);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Point SSO");
  });
});

describe("watchPointForm adaptation au contexte", () => {
  it("ne propose que les fonctionnalites du produit courant, avec l'option sans", () => {
    const store = fakeStore();
    const field = watchPointForm.fields(ctx("create", store)).find((f) => f.name === "featureId");
    expect(field?.options?.(ctx("create", store))).toEqual([
      { value: "", label: "pages.watchpoints.no_feature" },
      { value: "f1", label: "Connexion" },
    ]);
  });

  it("vide la fonctionnalite liee quand le produit change", () => {
    const field = watchPointForm.fields(ctx()).find((f) => f.name === "productId");
    const setValue = vi.fn();
    field?.onChange?.({ value: "77", ctx: ctx(), setValue, getValues: () => values });
    expect(setValue).toHaveBeenCalledWith("featureId", "");
  });

  it("propose les niveaux et les membres actifs", () => {
    const store = fakeStore();
    const fields = watchPointForm.fields(ctx("create", store));
    const level = fields.find((f) => f.name === "level");
    expect(level?.options?.(ctx("create", store))).toEqual([
      { value: "info", label: WATCH_LEVEL_LABEL.info },
      { value: "vigilance", label: WATCH_LEVEL_LABEL.vigilance },
      { value: "critique", label: WATCH_LEVEL_LABEL.critique },
    ]);
    const owner = fields.find((f) => f.name === "owner");
    expect(owner?.options?.(ctx("create", store))).toEqual([{ value: "Alice", label: "Alice" }]);
  });

  it("part du premier produit visible, du premier membre actif", () => {
    const store = fakeStore();
    expect(watchPointForm.defaults({ ctx: initCtx(store) })).toEqual({
      title: "",
      description: "",
      productId: "42",
      featureId: "",
      level: "vigilance",
      owner: "Alice",
    });
  });

  it("publie les cles de la page", () => {
    const store = fakeStore();
    expect(watchPointForm.title(ctx("create", store))).toBe("pages.watchpoints.new_point_page");
    expect(watchPointForm.submitLabel(ctx("create", store))).toBe("pages.watchpoints.enregistrer");
    expect(watchPointForm.successMessage(ctx("create", store))).toBe("pages.watchpoints.saved");
  });
});

describe("watchPointForm.save", () => {
  it("hors ligne : ecrit le point local sans cle featureId vide", async () => {
    const store = fakeStore();
    await watchPointForm.save({
      values,
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.addWatchPoint).toHaveBeenCalledWith({
      productId: "42",
      title: "Point SSO",
      description: "desc",
      level: "vigilance",
      status: "ouvert",
      owner: "Alice",
      featureId: "f1",
    });
    expect(api).not.toHaveBeenCalled();
  });

  it("sans fonctionnalite liee : la cle featureId est absente", async () => {
    const store = fakeStore();
    await watchPointForm.save({
      values: { ...values, featureId: "" },
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.addWatchPoint).toHaveBeenCalledWith(
      expect.not.objectContaining({ featureId: expect.anything() }),
    );
  });

  it("en ligne sans projet numerique pour le produit : reste local", async () => {
    const store = fakeStore({ projects: [{ id: "f-1", productId: "42" }] });
    await watchPointForm.save({
      values,
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(store.addWatchPoint).toHaveBeenCalled();
    expect(api).not.toHaveBeenCalled();
  });

  it("en ligne : POST /watch-points puis remplace la liste", async () => {
    vi.mocked(api).mockResolvedValue({ id: 9 });
    const store = fakeStore();
    await watchPointForm.save({
      values: { ...values, featureId: "55" },
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(api).toHaveBeenCalledWith(
      "/watch-points",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          project_id: 42,
          feature_id: 55,
          title: "Point SSO",
          description: "desc",
          criticality: "high",
          owner_id: 7,
          status: "open",
        }),
      }),
    );
    expect(store.replaceWatchPoints).toHaveBeenCalledWith([
      { id: "w1" },
      { id: "9", productId: "42", title: "Point SSO", owner: "Alice" },
    ]);
    expect(store.addWatchPoint).not.toHaveBeenCalled();
  });

  it("en ligne avec id de fonctionnalite non numerique : feature_id absent", async () => {
    vi.mocked(api).mockResolvedValue({ id: 9 });
    const store = fakeStore();
    await watchPointForm.save({
      values,
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    const body = JSON.parse(String(vi.mocked(api).mock.calls[0]?.[1]?.body));
    expect(body).not.toHaveProperty("feature_id");
    expect(body.project_id).toBe(42);
  });
});
