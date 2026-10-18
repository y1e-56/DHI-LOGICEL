import { z } from "zod";
import { getUser, userHasAnyRole, visibleProducts } from "@/lib/access";
import { createProject, mapBackendProject, updateProjectById } from "@/lib/api";
import type { BackendProjectPayload } from "@/lib/api";
import type { AppRole, Project, ProjectStatus } from "@/lib/dhi-data";
import type { EntityFormSchema, SelectOption, Store } from "./types";
import {
  NEW_VERSION,
  defaultVersionChoice,
  resolveVersion,
  versionMissing,
  versionOptions,
  versionsOf,
  withProductVersion,
} from "./version-field";

export type ProjectFormValues = {
  name: string;
  objective: string;
  productId: string;
  /** Version cible choisie dans la liste, ou NEW_VERSION. */
  targetVersion: string;
  /** Saisie libre quand « Nouvelle version… » est choisi. */
  newTargetVersion: string;
  manager: string;
  qaLead: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
};

const MANAGER_ROLES: AppRole[] = ["chef_projet", "quality_manager", "qa_lead"];
const QA_ROLES: AppRole[] = ["quality_manager", "qa_lead"];

function roleNames(store: Store, roles: AppRole[]): string[] {
  return store.users
    .filter((user) => user.active && userHasAnyRole(user, ...roles))
    .map((user) => user.name);
}

/**
 * On ne se propose pas soi-meme comme responsable. En edition on conserve
 * neanmoins la valeur deja enregistree, sinon elle disparaitrait de la liste
 * et le select afficherait un choix fantome.
 */
function withoutMe(store: Store, names: string[], current?: string): string[] {
  const others = names.filter((name) => name !== store.currentUser?.name);
  const kept = [...others];
  if (current && names.includes(current) && !kept.includes(current)) {
    kept.push(current);
  }
  return kept.length > 0 ? kept : names;
}

function toOptions(names: string[]): SelectOption[] {
  return names.map((name) => ({ value: name, label: name }));
}

/**
 * Formulaire d'entite Projet : un seul schema pour creer et modifier.
 * Les listes derivees (produits visibles, responsables eligible sans moi)
 * sortent du contexte d'execution ; le mode choisit titre, libelle de
 * soumission et message de succes.
 */
export const projectForm: EntityFormSchema<ProjectFormValues, Project> = {
  title: (ctx) =>
    ctx.mode === "create"
      ? ctx.t("pages.projects.new_project_page")
      : `${ctx.t("pages.projects.edit_project_page")} — ${ctx.entity?.name ?? ""}`,
  subtitle: (ctx) => ctx.t("pages.projects.subtitle"),
  fields: (ctx) => [
    {
      name: "name",
      type: "text",
      label: (fieldCtx) => fieldCtx.t("pages.projects.name_label"),
      placeholder: (fieldCtx) => fieldCtx.t("pages.projects.name_placeholder"),
      width: "full",
    },
    {
      name: "objective",
      type: "text",
      label: (fieldCtx) => fieldCtx.t("pages.projects.objective"),
      width: "full",
    },
    {
      name: "productId",
      type: "select",
      label: (fieldCtx) => fieldCtx.t("pages.projects.parent_product"),
      width: "half",
      // Produit figé quand on crée depuis une fiche produit : il dérive du
      // contexte d'entrée et le champ disparaît.
      when: (fieldCtx) => !fieldCtx.seed?.productId,
      // Creation : tous les produits. Edition : la selection doit rester
      // dans le perimetre visible de l'utilisateur.
      options: ({ mode, store }) => {
        const source =
          mode === "create" ? store.products : visibleProducts(store.products, getUser());
        return source.map((product) => ({ value: product.id, label: product.name }));
      },
      // La version cible appartient au produit : changer de produit la recale.
      onChange: ({ value, ctx: run, setValue }) => {
        setValue("targetVersion", defaultVersionChoice(versionsOf(run.store, String(value))));
        setValue("newTargetVersion", "");
      },
    },
    {
      // Obligatoire (CDC RG-005) : une version existante du produit, ou une
      // nouvelle, creee pour le produit a l'enregistrement.
      name: "targetVersion",
      type: "select",
      label: (fieldCtx) => fieldCtx.t("pages.projects.target_version"),
      width: "half",
      options: ({ store, values, t }) =>
        versionOptions(versionsOf(store, values.productId), t("common.version_new")),
    },
    {
      name: "newTargetVersion",
      type: "text",
      label: (fieldCtx) => fieldCtx.t("common.version_new_label"),
      placeholder: () => "Ex. 2.1",
      width: "half",
      when: (fieldCtx) => fieldCtx.values.targetVersion === NEW_VERSION,
    },
    {
      name: "status",
      type: "select",
      label: (fieldCtx) => fieldCtx.t("common.statut"),
      width: "half",
      options: ({ t }) => [
        { value: "planifie", label: t("pages.projects.status_planifie") },
        { value: "encours", label: t("pages.projects.status_encours") },
        { value: "termine", label: t("pages.projects.status_termine") },
      ],
    },
    {
      name: "startDate",
      type: "date",
      label: (fieldCtx) => fieldCtx.t("pages.projects.start_date"),
      width: "half",
    },
    {
      name: "endDate",
      type: "date",
      label: (fieldCtx) => fieldCtx.t("pages.projects.end_date"),
      width: "half",
    },
    {
      name: "manager",
      type: "select",
      label: (fieldCtx) => fieldCtx.t("pages.projects.manager_label"),
      width: "half",
      options: ({ store, values }) =>
        toOptions(withoutMe(store, roleNames(store, MANAGER_ROLES), values.manager)),
    },
    {
      name: "qaLead",
      type: "select",
      label: (fieldCtx) => fieldCtx.t("pages.projects.qa_lead"),
      width: "half",
      options: ({ store, values }) =>
        toOptions(withoutMe(store, roleNames(store, QA_ROLES), values.qaLead)),
    },
  ],
  validation: (ctx) =>
    z
      .object({
        name: z.string().trim().min(1, ctx.t("forms.required")),
        objective: z.string(),
        productId: z.string().min(1, ctx.t("forms.required")),
        targetVersion: z.string(),
        newTargetVersion: z.string(),
        manager: z.string(),
        qaLead: z.string(),
        status: z.enum(["planifie", "encours", "termine"]),
        startDate: z.string(),
        endDate: z.string(),
      })
      .refine((form) => !form.startDate || !form.endDate || form.startDate <= form.endDate, {
        message: ctx.t("pages.projects.end_date_before_start"),
        path: ["endDate"],
      })
      .refine((form) => !versionMissing(form.targetVersion, form.newTargetVersion), {
        message: ctx.t("common.version_required"),
        path: ["newTargetVersion"],
      }),
  defaults: ({ entity, ctx }) => {
    if (entity) {
      return {
        name: entity.name,
        objective: entity.objective,
        productId: entity.productId,
        // Un projet existant sans version cible devra en recevoir une (RG-005).
        targetVersion: defaultVersionChoice(
          versionsOf(ctx.store, entity.productId),
          entity.targetVersion,
        ),
        newTargetVersion: "",
        manager: entity.manager,
        qaLead: entity.qaLead,
        status: entity.status,
        startDate: entity.startDate,
        endDate: entity.endDate,
      };
    }
    const managers = withoutMe(ctx.store, roleNames(ctx.store, MANAGER_ROLES));
    const qaLeads = withoutMe(ctx.store, roleNames(ctx.store, QA_ROLES));
    return {
      name: "",
      objective: "",
      productId: ctx.seed?.productId ?? ctx.store.products[0]?.id ?? "",
      targetVersion: defaultVersionChoice(
        versionsOf(ctx.store, ctx.seed?.productId ?? ctx.store.products[0]?.id ?? ""),
      ),
      newTargetVersion: "",
      manager: managers[0] ?? "",
      qaLead: qaLeads.find((name) => name !== managers[0]) ?? qaLeads[0] ?? "",
      status: "planifie" as ProjectStatus,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
    };
  },
  save: async ({ values, mode, id, online, store }) => {
    // Normalisation unique : le nom est rogne, la version retenue est celle
    // choisie ou la nouvelle saisie. Les deux chemins (local et backend)
    // partagent ces valeurs.
    const targetVersion = resolveVersion(values.targetVersion, values.newTargetVersion);
    const local: Omit<Project, "id"> = {
      productId: values.productId,
      name: values.name.trim(),
      objective: values.objective,
      targetVersion,
      status: values.status,
      startDate: values.startDate,
      endDate: values.endDate,
      manager: values.manager,
      qaLead: values.qaLead,
    };

    // Une nouvelle version existe desormais pour le produit : les autres
    // formulaires (campagne) la proposent sans rechargement.
    store.replaceProducts(withProductVersion(store.products, local.productId, targetVersion));

    if (!online) {
      if (mode === "create") {
        store.addProject(local);
      } else {
        store.updateProject(id ?? "", local);
      }
      return;
    }

    const testLeadIds = [values.manager, values.qaLead]
      .map((name) => store.users.find((user) => user.name === name)?.id)
      .filter((userId): userId is string => !!userId)
      .map((userId) => Number(userId))
      .filter((userId) => Number.isInteger(userId) && userId > 0)
      .filter((userId, index, all) => all.indexOf(userId) === index);

    const payload: BackendProjectPayload = {
      name: local.name,
      description: local.objective,
      product_id: local.productId ? Number(local.productId) : null,
      target_version: targetVersion,
      test_lead_ids: testLeadIds,
      ...(local.startDate ? { start_date: local.startDate } : {}),
      ...(local.endDate ? { end_date: local.endDate } : {}),
    };

    if (mode === "create") {
      const response = await createProject(payload);
      store.replaceProjects([
        ...store.projects,
        { ...mapBackendProject(response.project), ...local, id: String(response.project.id) },
      ]);
    } else {
      const response = await updateProjectById(Number(id), payload);
      store.replaceProjects(
        store.projects.map((item) =>
          item.id === id ? { ...mapBackendProject(response.project), ...local, id } : item,
        ),
      );
    }
  },
  submitLabel: (ctx) =>
    ctx.t(ctx.mode === "create" ? "pages.projects.new_project" : "actions.enregistrer"),
  successMessage: (ctx) =>
    `${ctx.t(ctx.mode === "create" ? "pages.projects.created" : "pages.projects.updated")} « ${ctx.values.name.trim()} »`,
};
