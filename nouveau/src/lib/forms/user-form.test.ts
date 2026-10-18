import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLE_LABEL } from "@/lib/dhi-data";
import { userForm, type UserFormValues } from "./user-form";
import type { FormMode, FormRunContext, Store } from "./types";

const t = (key: string) => key;

function fakeStore(overrides: Record<string, unknown> = {}) {
  return {
    addUser: vi.fn(async () => "u-9"),
    ...overrides,
  };
}

const values: UserFormValues = {
  name: "  Jean Dupont  ",
  email: "  jean@exemple.com  ",
  roles: ["testeur", "qa_lead"],
  password: "secret1",
  confirmPassword: "secret1",
};

const ctx = (
  mode: FormMode = "create",
  store = fakeStore(),
  formValues: UserFormValues = values,
): FormRunContext<UserFormValues, undefined> => ({
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

const parse = (partial: Partial<UserFormValues>) =>
  userForm.validation(ctx()).safeParse({ ...values, ...partial });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("userForm.validation", () => {
  it("exige un nom complet (prenom et nom)", () => {
    const empty = parse({ name: "   " });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.error.issues[0]).toMatchObject({
        path: ["name"],
        message: "pages.add_user.name_required",
      });
    }
    const single = parse({ name: "Jean" });
    expect(single.success).toBe(false);
    if (!single.success) {
      expect(single.error.issues[0]).toMatchObject({
        path: ["name"],
        message: "pages.add_user.name_full",
      });
    }
  });

  it("exige un e-mail present puis valide", () => {
    const empty = parse({ email: "  " });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.error.issues[0]).toMatchObject({
        path: ["email"],
        message: "pages.add_user.email_required",
      });
    }
    const invalid = parse({ email: "jean.exemple.com" });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues[0]).toMatchObject({
        path: ["email"],
        message: "pages.add_user.email_invalid",
      });
    }
  });

  it("exige au moins un role", () => {
    const result = parse({ roles: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["roles"],
        message: "pages.add_user.roles_required",
      });
    }
  });

  it("exige un mot de passe de six caracteres au minimum", () => {
    const empty = parse({ password: "", confirmPassword: "" });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.error.issues[0]).toMatchObject({
        path: ["password"],
        message: "pages.add_user.password_required",
      });
    }
    const short = parse({ password: "abcde", confirmPassword: "abcde" });
    expect(short.success).toBe(false);
    if (!short.success) {
      expect(short.error.issues[0]).toMatchObject({
        path: ["password"],
        message: "pages.add_user.password_min_length",
      });
    }
  });

  it("verifie la concordance des mots de passe sur le champ de confirmation", () => {
    const result = parse({ confirmPassword: "autre1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["confirmPassword"],
        message: "pages.add_user.password_mismatch",
      });
    }
  });

  it("accepte un formulaire valide et rogne nom et e-mail", () => {
    const result = userForm.validation(ctx()).safeParse(values);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jean Dupont");
      expect(result.data.email).toBe("jean@exemple.com");
    }
  });
});

describe("userForm adaptation au contexte", () => {
  it("propose tous les roles avec leur libelle", () => {
    const store = fakeStore();
    const field = userForm.fields(ctx("create", store)).find((f) => f.name === "roles");
    expect(field?.options?.(ctx("create", store))).toEqual(
      Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })),
    );
    expect(field?.helpText?.(ctx("create", store))).toBe("pages.add_user.roles_hint");
  });

  it("ouvre la section mot de passe sur le premier champ concerne", () => {
    const store = fakeStore();
    const fields = userForm.fields(ctx("create", store));
    expect(fields.find((f) => f.name === "password")?.section).toMatchObject({
      label: expect.any(Function),
      hint: expect.any(Function),
    });
    expect(fields.find((f) => f.name === "confirmPassword")?.section).toBeUndefined();
  });

  it("part d'un compte vierge avec le role lecteur", () => {
    const store = fakeStore();
    expect(userForm.defaults({ ctx: initCtx(store) })).toEqual({
      name: "",
      email: "",
      roles: ["lecteur"],
      password: "",
      confirmPassword: "",
    });
  });

  it("publie les cles de la page", () => {
    const store = fakeStore();
    expect(userForm.title(ctx("create", store))).toBe("pages.add_user.personal_info");
    expect(userForm.submitLabel(ctx("create", store))).toBe("pages.add_user.create");
    const notice = userForm.successMessage(
      ctx("create", store, { ...values, name: "  Jean Dupont  " }),
    );
    expect(notice).toBe("pages.add_user.success".replace("{name}", "Jean Dupont"));
  });
});

describe("userForm.save", () => {
  it("cree le compte avec les valeurs rognees et le premier role en role principal", async () => {
    const store = fakeStore();
    const result = await userForm.save({
      values,
      mode: "create",
      online: true,
      store: store as unknown as Store,
      t,
    });
    expect(result).toBe("u-9");
    expect(store.addUser).toHaveBeenCalledWith({
      name: "Jean Dupont",
      email: "jean@exemple.com",
      role: "testeur",
      roles: ["testeur", "qa_lead"],
      active: true,
      password: "secret1",
    });
  });

  it("retombe sur lecteur si la liste des roles est vide", async () => {
    const store = fakeStore();
    await userForm.save({
      values: { ...values, roles: [] },
      mode: "create",
      online: false,
      store: store as unknown as Store,
      t,
    });
    expect(store.addUser).toHaveBeenCalledWith(expect.objectContaining({ role: "lecteur" }));
  });

  it("laisse remonter l'erreur de creation (toast d'erreur par le moteur)", async () => {
    const store = fakeStore({
      addUser: vi.fn(async () => {
        throw new Error("deja pris");
      }),
    });
    await expect(
      userForm.save({
        values,
        mode: "create",
        online: true,
        store: store as unknown as Store,
        t,
      }),
    ).rejects.toThrow("deja pris");
  });
});
