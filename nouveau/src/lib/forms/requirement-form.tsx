import { z } from "zod";
import { CriticalityBadge } from "@/components/dhi/indicators";
import { getUser, visibleProducts } from "@/lib/access";
import {
  api,
  backendIdOf,
  mapBackendRequirement,
  toBackendRequirementPriority,
  toBackendRequirementStatus,
} from "@/lib/api";
import type { BackendRequirement } from "@/lib/api";
import type { Criticality, Requirement, RequirementStatus } from "@/lib/dhi-data";
import type { TranslationKey } from "@/lib/i18n";
import type { EntityFormSchema, FieldSpec, SelectOption } from "./types";

export type RequirementFormValues = {
  title: string;
  description: string;
  productId: string;
  priority: Criticality;
  status: RequirementStatus;
  featureIds: string[];
};

type RequirementOption = SelectOption & { criticality: Criticality };

const REQUIREMENT_STATUS_T_KEY: Record<RequirementStatus, TranslationKey> = {
  brouillon: "pages.requirements.status_brouillon",
  validee: "pages.requirements.status_validee",
  couverte: "pages.requirements.status_couverte",
};

const PRIORITY_T_KEY: Record<Criticality, TranslationKey> = {
  critique: "pages.requirements.priority_critique",
  haute: "pages.requirements.priority_haute",
  moyenne: "pages.requirements.priority_moyenne",
  basse: "pages.requirements.priority_basse",
};

/**
 * Formulaire d'entite Exigence : un seul schema pour creer et modifier.
 * Le bloc « fonctionnalites couvertes » n'apparait que si le produit courant
 * en a ; changer de produit le vide (liaison incompatible).
 */
export const requirementForm: EntityFormSchema<RequirementFormValues, Requirement> = {
  title: (ctx) =>
    ctx.mode === "create"
      ? ctx.t("pages.requirements.new_requirement_page")
      : `${ctx.t("pages.requirements.edit_requirement_page")} — ${ctx.entity?.id ?? ""} · ${ctx.entity?.title ?? ""}`,
  subtitle: (ctx) => ctx.t("pages.requirements.subtitle"),
  fields: (ctx) => {
    const fields: FieldSpec<RequirementFormValues>[] = [
      {
        name: "title",
        type: "text",
        label: (c) => c.t("pages.requirements.form_title"),
        placeholder: (c) => c.t("pages.requirements.title_placeholder"),
        width: "full",
      },
      {
        name: "description",
        type: "textarea",
        rows: 3,
        label: (c) => c.t("pages.requirements.description_detaillee"),
        placeholder: (c) => c.t("pages.requirements.description_placeholder"),
        width: "full",
      },
      {
        name: "productId",
        type: "select",
        label: (c) => c.t("common.produit"),
        width: "third",
        options: (c) =>
          visibleProducts(c.store.products, getUser()).map((product) => ({
            value: product.id,
            label: product.name,
          })),
        onChange: ({ setValue }) => setValue("featureIds", []),
      },
      {
        name: "priority",
        type: "select",
        label: (c) => c.t("pages.requirements.priorite"),
        width: "third",
        options: (c) =>
          (Object.keys(PRIORITY_T_KEY) as Criticality[]).map((value) => ({
            value,
            label: c.t(PRIORITY_T_KEY[value]),
          })),
      },
      {
        name: "status",
        type: "select",
        label: (c) => c.t("common.statut"),
        width: "third",
        options: (c) =>
          (Object.keys(REQUIREMENT_STATUS_T_KEY) as RequirementStatus[]).map((value) => ({
            value,
            label: c.t(REQUIREMENT_STATUS_T_KEY[value]),
          })),
      },
    ];

    const linkedFeatures = ctx.store.features.filter(
      (feature) => feature.productId === ctx.values.productId,
    );
    if (linkedFeatures.length > 0) {
      fields.push({
        name: "featureIds",
        type: "multiselect",
        label: (c) => c.t("pages.requirements.fonctionnalites_couvertes"),
        width: "full",
        columns: 2,
        scrollable: true,
        options: () =>
          linkedFeatures.map((feature) => ({
            value: feature.id,
            label: feature.name,
            criticality: feature.criticality,
          })),
        hint: (option) =>
          linkedFeatures.find((f) => f.id === option.value)?.description ||
          ctx.t("pages.requirements.sans_description"),
        badge: (option) => <CriticalityBadge level={(option as RequirementOption).criticality} />,
        counter: ({ selected, total }) =>
          `${ctx.t("pages.requirements.selection_count").replace("{count}", String(selected))} / ${total}`,
      });
    }
    return fields;
  },
  validation: (ctx) =>
    z.object({
      title: z.string().trim().min(1, ctx.t("pages.requirements.title_required")),
      description: z.string(),
      productId: z.string(),
      priority: z.enum(["critique", "haute", "moyenne", "basse"]),
      status: z.enum(["brouillon", "validee", "couverte"]),
      featureIds: z.array(z.string()),
    }),
  defaults: ({ entity, ctx }) => ({
    title: entity?.title ?? "",
    description: entity?.description ?? "",
    productId: entity?.productId ?? visibleProducts(ctx.store.products, getUser())[0]?.id ?? "",
    priority: entity?.priority ?? "moyenne",
    status: entity?.status ?? "brouillon",
    featureIds: entity ? [...entity.featureIds] : [],
  }),
  save: async ({ values, mode, id, online, store }) => {
    const local = {
      productId: values.productId,
      title: values.title.trim(),
      description: values.description,
      priority: values.priority,
      status: values.status,
      featureIds: values.featureIds,
    };

    if (!online) {
      if (mode === "create") {
        store.addRequirement(local);
      } else {
        store.updateRequirement(id ?? "", local);
      }
      return;
    }

    const payload = {
      title: local.title,
      description: local.description,
      status: toBackendRequirementStatus(local.status),
      priority: toBackendRequirementPriority(local.priority),
      product_id: backendIdOf(local.productId) ?? null,
      feature_ids: local.featureIds
        .map((featureId) => backendIdOf(featureId))
        .filter((featureId): featureId is number => featureId != null),
    };
    if (mode === "create") {
      const response = await api<BackendRequirement>("/requirements", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      store.replaceRequirements([...store.requirements, mapBackendRequirement(response)]);
    } else {
      const response = await api<BackendRequirement>(`/requirements/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      store.replaceRequirements(
        store.requirements.map((item) => (item.id === id ? mapBackendRequirement(response) : item)),
      );
    }
  },
  submitLabel: (ctx) => ctx.t(ctx.mode === "create" ? "actions.ajouter" : "actions.enregistrer"),
  successMessage: (ctx) => {
    if (ctx.mode === "create") {
      // Hors ligne, on annonce la degradation plutot qu'un succes plein.
      if (!ctx.online) {
        return {
          message: ctx.t("pages.requirements.not_authenticated"),
          kind: "warning",
          duration: 9000,
        };
      }
      return ctx.t("pages.requirements.added");
    }
    return ctx.t("pages.requirements.updated").replace("{id}", ctx.entity?.id ?? "");
  },
};
