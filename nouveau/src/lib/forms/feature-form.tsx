import { z } from "zod";
import { CriticalityBadge } from "@/components/dhi/indicators";
import {
  CRITICALITY_LABEL,
  REQUIREMENT_STATUS_LABEL,
  TEST_TYPES,
  type Criticality,
  type Feature,
  type TestType,
} from "@/lib/dhi-data";
import type { EntityFormSchema, FieldSpec, SelectOption } from "./types";

export type FeatureFormValues = {
  name: string;
  description: string;
  productId: string;
  criticality: Criticality;
  /** Create uniquement : rattachement back-office (vide = automatique). */
  campaignId: string;
  sourceDocId: string;
  coverage: string[];
  requirementIds: string[];
};

/**
 * Formulaire d'entite Fonctionnalite : creer et modifier partagent le schema.
 * Changer de produit reinitialise les selections dependantes (campagne,
 * document source, exigences satisfaites) ; l'enregistrement resynchronise
 * les liens aller-retour avec les exigences.
 */
export const featureForm: EntityFormSchema<FeatureFormValues, Feature> = {
  title: (ctx) =>
    ctx.mode === "create"
      ? ctx.t("pages.features.new_feature_page")
      : `${ctx.t("pages.features.edit_feature_page")} — ${ctx.entity?.name ?? ""}`,
  subtitle: (ctx) => ctx.t("pages.features.subtitle"),
  fields: (ctx) => {
    const fields: FieldSpec<FeatureFormValues>[] = [
      {
        name: "name",
        type: "text",
        label: (c) => c.t("common.nom"),
        placeholder: (c) => c.t("pages.features.name_placeholder"),
        width: "full",
      },
      {
        name: "description",
        type: "text",
        label: (c) => c.t("common.description"),
        width: "full",
      },
      {
        name: "productId",
        type: "select",
        label: (c) => c.t("common.produit"),
        width: "half",
        options: (c) =>
          c.store.products.map((product) => ({ value: product.id, label: product.name })),
        onChange: ({ setValue }) => {
          setValue("campaignId", "");
          setValue("sourceDocId", "");
          setValue("requirementIds", []);
        },
      },
      {
        name: "criticality",
        type: "select",
        label: (c) => c.t("common.criticite"),
        width: "half",
        options: (c) =>
          (Object.keys(CRITICALITY_LABEL) as Criticality[]).map((value) => ({
            value,
            label: CRITICALITY_LABEL[value],
          })),
      },
    ];

    const productCampaigns = ctx.store.campaigns.filter(
      (campaign) => campaign.productId === ctx.values.productId,
    );
    if (ctx.mode === "create") {
      fields.push({
        name: "campaignId",
        type: "select",
        label: (c) => c.t("pages.features.campaign_choice"),
        optional: (c) => c.t("pages.features.optional"),
        placeholder: (c) => c.t("pages.features.campaign_auto"),
        width: "full",
        options: (c) =>
          productCampaigns.length === 0
            ? [{ value: "", label: c.t("pages.features.no_campaign_for_product"), disabled: true }]
            : [
                { value: "", label: c.t("pages.features.campaign_auto") },
                ...productCampaigns.map((campaign) => ({
                  value: campaign.id,
                  label: campaign.name,
                })),
              ],
        helpText: (c) =>
          productCampaigns.length === 0 ? c.t("pages.features.sync_no_campaign") : undefined,
      });
    }

    const productDocs = ctx.store.productDocuments.filter(
      (document) => document.productId === ctx.values.productId,
    );
    fields.push({
      name: "sourceDocId",
      type: "select",
      label: (c) => c.t("pages.features.source_doc"),
      optional: (c) => c.t("pages.features.optional"),
      placeholder: (c) => c.t("pages.features.source_doc_placeholder"),
      width: "full",
      options: (c) =>
        productDocs.length === 0
          ? [{ value: "", label: c.t("pages.features.no_doc_for_product"), disabled: true }]
          : productDocs.map((document) => ({
              value: document.id,
              label: document.name,
            })),
      helpText: (c) =>
        c.values.sourceDocId
          ? c
              .t("pages.features.based_on")
              .replace(
                "{name}",
                productDocs.find((document) => document.id === c.values.sourceDocId)?.name ?? "",
              )
          : undefined,
    });

    fields.push({
      name: "coverage",
      type: "multiselect",
      label: (c) => c.t("pages.features.coverage_label"),
      width: "full",
      columns: 2,
      scrollable: true,
      borderless: true,
      options: () => TEST_TYPES.map((testType) => ({ value: testType.id, label: testType.label })),
      counter: ({ selected, total }) => `${selected} / ${total} ${ctx.t("pages.features.types")}`,
    });

    const productRequirements = ctx.store.requirements.filter(
      (requirement) => requirement.productId === ctx.values.productId,
    );
    const requirementOf = (option: SelectOption) =>
      productRequirements.find((requirement) => requirement.id === option.value);
    fields.push({
      name: "requirementIds",
      type: "multiselect",
      label: (c) => c.t("pages.features.requirements_satisfied"),
      width: "full",
      columns: 2,
      scrollable: true,
      options: () =>
        productRequirements.map((requirement) => ({
          value: requirement.id,
          label: `${requirement.id} · ${requirement.title}`,
        })),
      hint: (option) => {
        const requirement = requirementOf(option);
        return requirement ? REQUIREMENT_STATUS_LABEL[requirement.status] : "";
      },
      badge: (option) => {
        const requirement = requirementOf(option);
        return requirement ? <CriticalityBadge level={requirement.priority} /> : null;
      },
      emptyText: (c) => c.t("pages.features.no_requirement_for_product"),
      counter: ({ selected, total }) =>
        ctx
          .t("pages.features.selected_count")
          .replace("{count}", String(selected))
          .replace("{total}", String(total)),
    });

    return fields;
  },
  validation: (ctx) =>
    z.object({
      name: z.string().trim().min(1, ctx.t("pages.features.name_required")),
      description: z.string(),
      productId: z.string(),
      criticality: z.enum(["critique", "haute", "moyenne", "basse"]),
      campaignId: z.string(),
      sourceDocId: z.string(),
      coverage: z.array(z.string()),
      requirementIds: z.array(z.string()),
    }),
  defaults: ({ entity, ctx }) => ({
    name: entity?.name ?? "",
    description: entity?.description ?? "",
    productId: entity?.productId ?? ctx.store.products[0]?.id ?? "",
    criticality: entity?.criticality ?? "moyenne",
    campaignId: "",
    sourceDocId: entity?.sourceDocId ?? "",
    coverage: entity
      ? TEST_TYPES.filter((testType) => entity.coverage[testType.id]).map((testType) => testType.id)
      : [],
    requirementIds: entity
      ? ctx.store.requirements
          .filter((requirement) => requirement.featureIds.includes(entity.id))
          .map((requirement) => requirement.id)
      : [],
  }),
  save: async ({ values, mode, id, store }) => {
    const coverage: Partial<Record<TestType, boolean>> = {};
    for (const testType of TEST_TYPES)
      coverage[testType.id] = values.coverage.includes(testType.id);

    // Liens aller-retour : chaque exigence selectionnee porte le lien vers
    // cette fonctionnalite, et l'inverse — exactement ce que faisaient les routes.
    const syncRequirementsBackLinks = (featureId: string) => {
      for (const requirement of store.requirements) {
        const wasLinked = requirement.featureIds.includes(featureId);
        const shouldLink = values.requirementIds.includes(requirement.id);
        if (wasLinked && !shouldLink) {
          store.updateRequirement(requirement.id, {
            featureIds: requirement.featureIds.filter((f) => f !== featureId),
          });
        } else if (!wasLinked && shouldLink) {
          store.updateRequirement(requirement.id, {
            featureIds: [...requirement.featureIds, featureId],
          });
        }
      }
    };

    if (mode === "create") {
      const featureId = store.addFeature({
        productId: values.productId,
        campaignId: values.campaignId || undefined,
        name: values.name.trim(),
        description: values.description,
        criticality: values.criticality,
        coverage,
        sourceDocId: values.sourceDocId || undefined,
      });
      syncRequirementsBackLinks(featureId);
      return featureId;
    }

    store.updateFeature(id ?? "", {
      productId: values.productId,
      name: values.name.trim(),
      description: values.description,
      criticality: values.criticality,
      coverage,
      sourceDocId: values.sourceDocId || undefined,
    });
    syncRequirementsBackLinks(id ?? "");
    return;
  },
  submitLabel: (ctx) => ctx.t("actions.enregistrer"),
  successMessage: (ctx) =>
    ctx
      .t(ctx.mode === "create" ? "pages.features.created_msg" : "pages.features.updated_msg")
      .replace("{name}", ctx.values.name.trim()),
};
