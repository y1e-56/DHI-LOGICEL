import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProduct, updateProductById, type BackendProduct } from "@/lib/api";
import type { Product } from "@/lib/dhi-data";
import { productForm, type ProductFormValues } from "./product-form";
import type { FormMode, FormRunContext, Store } from "./types";

vi.mock("@/lib/api", () => ({
  createProduct: vi.fn(),
  updateProductById: vi.fn(),
  mapBackendProduct: (product: object, versions: string[] = []) => ({ ...product, versions }),
}));

const t = (key: string) => key;

function fakeStore() {
  return {
    users: [
      { id: "7", name: "Alice", active: true },
      { id: "8", name: "Bob", active: false },
      { id: "9", name: "Carol", active: true },
    ],
    products: [{ id: "42", name: "Ancien" }],
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    replaceProducts: vi.fn(),
  };
}

const values: ProductFormValues = {
  name: "  Nova  ",
  description: "desc",
  owner: "Alice",
  qaLead: "Carol",
  version: "2.0",
};

const ctx = (
  mode: FormMode = "create",
  store = fakeStore(),
  formValues: ProductFormValues = values,
  entity?: Product | undefined,
): FormRunContext<ProductFormValues, Product> => ({
  mode,
  t,
  store: store as unknown as Store,
  values: formValues,
  entity,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("productForm.validation", () => {
  it("rejette le nom vide avec la cle forms.required", () => {
    const result = productForm.validation(ctx()).safeParse({
      ...values,
      name: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["name"],
        message: "forms.required",
      });
    }
  });

  it("rejette le responsable QA absent", () => {
    const result = productForm.validation(ctx()).safeParse({ ...values, qaLead: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["qaLead"],
        message: "forms.required",
      });
    }
  });

  it("exige la version initiale à la création", () => {
    const result = productForm.validation(ctx()).safeParse({ ...values, version: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["version"],
        message: "common.version_required",
      });
    }
  });

  it("exige une version à la modification d'un produit qui n'en a pas", () => {
    const sansVersion = { versions: [] } as unknown as Product;
    const avecVersion = { versions: ["1.0"] } as unknown as Product;
    const noVersion = { ...values, version: "" };
    expect(productForm.validation(ctx("update", fakeStore(), noVersion, sansVersion)).safeParse(noVersion).success).toBe(false);
    expect(productForm.validation(ctx("update", fakeStore(), noVersion, avecVersion)).safeParse(noVersion).success).toBe(true);
  });

  it("accepte un formulaire valide et rogne le nom", () => {
    const result = productForm.validation(ctx()).safeParse(values);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Nova");
  });
});

describe("productForm adaptation au contexte", () => {
  it("propose uniquement les utilisateurs actifs en responsable QA", () => {
    const qaField = productForm.fields(ctx()).find((field) => field.name === "qaLead");
    expect(qaField?.options?.(ctx())).toEqual([
      { value: "Alice", label: "Alice" },
      { value: "Carol", label: "Carol" },
    ]);
  });

  it("adapte titre et libelle de soumission au mode", () => {
    expect(productForm.title(ctx("create"))).toBe("pages.products.new_product");
    expect(productForm.title(ctx("update"))).toBe("pages.products.edit_product");
    expect(productForm.submitLabel(ctx("create"))).toBe("pages.products.create");
    expect(productForm.submitLabel(ctx("update"))).toBe("actions.enregistrer");
    expect(productForm.successMessage(ctx("create"))).toBe("pages.products.created");
    expect(productForm.successMessage(ctx("update"))).toBe("pages.products.updated_msg");
  });

  it("part d'un formulaire vide en creation, du produit en modification", () => {
    const init = { mode: "create" as FormMode, t, store: fakeStore() as unknown as Store };
    expect(productForm.defaults({ ctx: init })).toEqual({
      name: "",
      description: "",
      owner: "",
      qaLead: "",
      version: "",
    });
    const entity = { name: "Nova", description: "d", owner: "Alice", qaLead: "Carol" };
    expect(productForm.defaults({ entity: entity as never, ctx: init })).toEqual({
      ...entity,
      version: "",
    });
  });
});

describe("productForm.save", () => {
  it("hors ligne en creation : ecrit dans le store local avec les defauts", async () => {
    const store = fakeStore();
    await productForm.save({
      values,
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.addProduct).toHaveBeenCalledWith({
      name: "Nova",
      description: "desc",
      owner: "Alice",
      qaLead: "Carol",
      qaTeam: ["Carol"],
      versions: ["2.0"],
      score: 80,
    });
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("hors ligne en modification : ne touche ni versions ni score", async () => {
    const store = fakeStore();
    await productForm.save({
      values,
      mode: "update",
      id: "p-9",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.updateProduct).toHaveBeenCalledWith("p-9", {
      name: "Nova",
      description: "desc",
      owner: "Alice",
      qaLead: "Carol",
      qaTeam: ["Carol"],
    });
    expect(updateProductById).not.toHaveBeenCalled();
  });

  it("en ligne en creation : passe par l'API puis remplace la liste", async () => {
    vi.mocked(createProduct).mockResolvedValue({
      product: { id: 42 } as unknown as BackendProduct,
    });
    const store = fakeStore();
    await productForm.save({
      values,
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(createProduct).toHaveBeenCalledWith({
      name: "Nova",
      description: "desc",
      owner_id: 7,
      owner_name: "Alice",
      quality_manager_id: 9,
      version: "2.0",
    });
    expect(store.replaceProducts).toHaveBeenCalledWith([
      { id: "42", name: "Ancien" },
      {
        id: 42,
        versions: ["2.0"],
        name: "Nova",
        description: "desc",
        owner: "Alice",
        qaLead: "Carol",
        qaTeam: ["Carol"],
      },
    ]);
  });

  it("en ligne en modification : met a jour la ligne existante", async () => {
    vi.mocked(updateProductById).mockResolvedValue({
      product: { id: 42 } as unknown as BackendProduct,
    });
    const store = fakeStore();
    await productForm.save({
      values: { ...values, version: "" },
      mode: "update",
      id: "42",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(updateProductById).toHaveBeenCalledWith(42, {
      name: "Nova",
      description: "desc",
      owner_id: 7,
      owner_name: "Alice",
      quality_manager_id: 9,
    });
    expect(store.replaceProducts).toHaveBeenCalledWith([
      {
        id: 42,
        versions: [],
        name: "Nova",
        description: "desc",
        owner: "Alice",
        qaLead: "Carol",
        qaTeam: ["Carol"],
      },
    ]);
  });
});
