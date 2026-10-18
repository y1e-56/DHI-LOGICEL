import { z } from "zod";
import { ROLE_LABEL, type AppRole } from "@/lib/dhi-data";
import type { EntityFormSchema } from "./types";

export type UserFormValues = {
  name: string;
  email: string;
  roles: AppRole[];
  password: string;
  confirmPassword: string;
};

const ROLE_KEYS = Object.keys(ROLE_LABEL) as [AppRole, ...AppRole[]];

/** Regles de creation de compte, dans l'ordre de la page d'origine. */
export const userForm: EntityFormSchema<UserFormValues> = {
  title: (ctx) => ctx.t("pages.add_user.personal_info"),
  subtitle: (ctx) => ctx.t("pages.add_user.personal_info_hint"),
  submitLabel: (ctx) => ctx.t("pages.add_user.create"),
  successMessage: (ctx) =>
    ctx.t("pages.add_user.success").replace("{name}", ctx.values.name.trim()),

  fields: (ctx) => [
    {
      name: "name",
      type: "text",
      label: (c) => c.t("pages.add_user.full_name"),
      placeholder: () => "Jean Dupont",
    },
    {
      name: "email",
      type: "text",
      label: (c) => c.t("pages.add_user.email"),
      placeholder: () => "jean.dupont@exemple.com",
    },
    {
      name: "roles",
      type: "multiselect",
      borderless: true,
      label: (c) => c.t("pages.add_user.role"),
      helpText: (c) => c.t("pages.add_user.roles_hint"),
      options: () => ROLE_KEYS.map((role) => ({ value: role, label: ROLE_LABEL[role] })),
    },
    {
      name: "password",
      type: "password",
      width: "half",
      section: {
        label: (c) => c.t("pages.add_user.password_section"),
        hint: (c) => c.t("pages.add_user.password_section_hint"),
      },
      label: (c) => c.t("pages.add_user.password"),
      placeholder: (c) => c.t("pages.add_user.password_placeholder"),
    },
    {
      name: "confirmPassword",
      type: "password",
      width: "half",
      label: (c) => c.t("pages.add_user.confirm_password"),
      placeholder: (c) => c.t("pages.add_user.confirm_password_placeholder"),
    },
  ],

  validation: () =>
    z
      .object({
        name: z
          .string()
          .trim()
          .min(1, "pages.add_user.name_required")
          .refine((v) => v.includes(" "), "pages.add_user.name_full"),
        email: z
          .string()
          .trim()
          .min(1, "pages.add_user.email_required")
          .refine((v) => v.includes("@"), "pages.add_user.email_invalid"),
        roles: z.array(z.enum(ROLE_KEYS)).min(1, "pages.add_user.roles_required"),
        password: z
          .string()
          .min(1, "pages.add_user.password_required")
          .min(6, "pages.add_user.password_min_length"),
        confirmPassword: z.string(),
      })
      .superRefine((values, issue) => {
        if (values.password !== values.confirmPassword) {
          issue.addIssue({
            code: z.ZodIssueCode.custom,
            message: "pages.add_user.password_mismatch",
            path: ["confirmPassword"],
          });
        }
      }),

  defaults: () => ({
    name: "",
    email: "",
    roles: ["lecteur"],
    password: "",
    confirmPassword: "",
  }),

  save: async ({ values, store }) =>
    store.addUser({
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.roles[0] ?? "lecteur",
      roles: values.roles,
      active: true,
      password: values.password,
    }),
};
