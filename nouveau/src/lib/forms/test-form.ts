import { z } from "zod";
import { api, toBackendPriority } from "@/lib/api";
import { campaignTesterOptions } from "@/lib/access";
import type { Criticality, TestCase } from "@/lib/dhi-data";
import type { EntityFormSchema, FormInitContext } from "./types";

/** Types proposes par les routes cas de test (sous-ensemble de TestType). */
const TEST_TYPE_IDS = [
  "fonctionnel",
  "regression",
  "integration",
  "api",
  "recette_metier",
  "smoke",
  "sanity",
  "exploratoire",
  "securite",
  "penetration",
  "performance",
  "charge",
  "endurance",
  "volumetrie",
  "robustesse",
  "accessibilite",
  "compatibilite",
  "conformite",
] as const;

export type FormTestType = (typeof TEST_TYPE_IDS)[number];

const CRITICALITIES: Criticality[] = ["critique", "haute", "moyenne", "basse"];

export type TestFormValues = {
  name: string;
  featureId: string;
  criticality: Criticality;
  type: FormTestType;
  /** Nom du testeur ("" = non affecte) : le store resout l'id au save. */
  tester: string;
  preconditions: string;
  steps: string;
  expected: string;
  observed: string;
  comment: string;
};

function splitLines(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Reproduit le `capitalize` CSS des selects d'origine (libelles bruts). */
function capitalizeWords(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function campaignOf(ctx: FormInitContext<TestFormValues, TestCase>, campaignId: string) {
  return ctx.store.campaigns.find((c) => c.id === campaignId);
}

function campaignFeaturesOf(ctx: FormInitContext<TestFormValues, TestCase>, campaignId: string) {
  const campaign = campaignOf(ctx, campaignId);
  return ctx.store.features.filter((f) => f.productId === campaign?.productId);
}

/** Testeurs : comptes actifs inscrits sur la campagne (+ testeur actuel en modification). */
function testerOptionsOf(
  ctx: FormInitContext<TestFormValues, TestCase>,
  campaignId: string,
): { id: string; name: string }[] {
  const campaign = campaignOf(ctx, campaignId);
  const options = campaignTesterOptions(ctx.store.users, campaign?.testers);
  const current = ctx.entity;
  if (current?.tester && !options.some((o) => o.name === current.tester)) {
    options.push({
      id: current.assignedTo != null ? String(current.assignedTo) : "0",
      name: current.tester,
    });
  }
  return options;
}

/**
 * Formulaire d'entite Cas de test, ferme sur sa campagne : les fonctionnalites
 * et les testeurs proposes dependent du campagne de la route. Une fabrique
 * `testForm(campaignId)` fournit le schema, create et update partagent le meme.
 */
export function testForm(campaignId: string): EntityFormSchema<TestFormValues, TestCase> {
  return {
    title: (ctx) =>
      ctx.mode === "create"
        ? ctx.t("pages.campaign_detail.ajouter_un_test")
        : `${ctx.t("pages.campaign_detail.modifier_cas_test")} — ${ctx.entity?.id ?? ""} · ${ctx.entity?.name ?? ""}`,
    subtitle: (ctx) =>
      ctx.mode === "create"
        ? ctx.t("pages.campaign_detail.ajouter_un_test")
        : `${ctx.t("pages.campaign_detail.modifier_cas_test")} ${ctx.entity?.id ?? ""}`,
    fields: (ctx) => {
      const campaignFeatures = campaignFeaturesOf(ctx, campaignId);
      const testerOptions = testerOptionsOf(ctx, campaignId);
      return [
        {
          name: "name",
          type: "text",
          label: (c) => c.t("pages.campaign_detail.nom_du_test"),
          placeholder: (c) => c.t("pages.campaign_detail.nom_test_placeholder"),
          width: "full",
        },
        {
          name: "featureId",
          type: "select",
          label: (c) => c.t("pages.campaign_detail.fonctionnalite_associee"),
          placeholder: (c) => c.t("pages.campaign_detail.selectionner_fonctionnalite"),
          width: "half",
          options: (c) =>
            campaignFeatures.length === 0
              ? [
                  {
                    value: "",
                    label: c.t("pages.campaign_detail.aucune_fonctionnalite"),
                    disabled: true,
                  },
                ]
              : campaignFeatures.map((feature) => ({ value: feature.id, label: feature.name })),
        },
        {
          name: "tester",
          type: "select",
          label: (c) => c.t("pages.campaign_detail.testeur_referent"),
          placeholder: (c) => c.t("pages.campaign_detail.tester_placeholder"),
          width: "half",
          options: (c) => [
            { value: "", label: c.t("pages.campaign_detail.unassigned") },
            ...testerOptions.map((option) => ({ value: option.name, label: option.name })),
          ],
        },
        {
          name: "criticality",
          type: "select",
          label: (c) => c.t("common.criticite"),
          width: "half",
          options: () => CRITICALITIES.map((value) => ({ value, label: capitalizeWords(value) })),
        },
        {
          name: "type",
          type: "select",
          label: (c) => c.t("pages.campaign_detail.type_de_test"),
          width: "half",
          options: () =>
            TEST_TYPE_IDS.map((value) => ({
              value,
              label: capitalizeWords(value.replace(/_/g, " ")),
            })),
        },
        {
          name: "preconditions",
          type: "textarea",
          rows: 3,
          label: (c) => c.t("pages.campaign_detail.preconditions_une_par_ligne"),
          placeholder: (c) => c.t("pages.campaign_detail.preconditions_placeholder"),
          width: "full",
        },
        {
          name: "steps",
          type: "textarea",
          rows: 4,
          label: (c) => c.t("pages.campaign_detail.etapes_une_par_ligne"),
          placeholder: (c) => c.t("pages.campaign_detail.etapes_placeholder"),
          width: "full",
        },
        {
          name: "expected",
          type: "textarea",
          rows: 3,
          label: (c) => c.t("pages.campaign_detail.resultats_attendus"),
          placeholder: (c) => c.t("pages.campaign_detail.expected_placeholder"),
          width: "full",
        },
        {
          name: "observed",
          type: "textarea",
          rows: 3,
          label: (c) => c.t("pages.campaign_detail.resultat_obtenu"),
          placeholder: (c) => c.t("pages.campaign_detail.resultat_obtenu_placeholder"),
          width: "full",
        },
        {
          name: "comment",
          type: "textarea",
          rows: 3,
          label: (c) => c.t("pages.campaign_detail.commentaires"),
          placeholder: (c) => c.t("pages.campaign_detail.commentaires_placeholder"),
          width: "full",
        },
      ];
    },
    validation: (ctx) =>
      z.object({
        name: z.string().trim().min(1, ctx.t("pages.campaign_detail.nom_test_obligatoire")),
        featureId: z.string(),
        criticality: z.enum(["critique", "haute", "moyenne", "basse"]),
        type: z.enum(TEST_TYPE_IDS),
        tester: z.string(),
        preconditions: z.string(),
        steps: z.string(),
        expected: z.string(),
        observed: z.string(),
        comment: z.string(),
      }),
    defaults: ({ entity, ctx }) => ({
      name: entity?.name ?? "",
      featureId: entity?.featureId ?? campaignFeaturesOf(ctx, campaignId)[0]?.id ?? "",
      criticality: entity?.criticality ?? "moyenne",
      // Les cas hors des 18 types proposes gardent leur valeur : le select
      // reste alors vide, comme le formulaire d'origine.
      type: (entity?.type as FormTestType | undefined) ?? "fonctionnel",
      tester: entity?.tester ?? "",
      preconditions: entity ? entity.preconditions.join("\n") : "",
      steps: entity ? entity.steps.join("\n") : "",
      expected: entity ? entity.expected.join("\n") : "",
      observed: entity?.observed ?? "",
      comment: entity?.comment ?? "",
    }),
    save: async ({ values, mode, id, online, store }) => {
      const campaign = store.campaigns.find((c) => c.id === campaignId);
      const testerOptions = campaignTesterOptions(store.users, campaign?.testers);
      if (mode === "update") {
        const current = store.tests.find((t) => t.id === id);
        if (current?.tester && !testerOptions.some((o) => o.name === current.tester)) {
          testerOptions.push({
            id: current.assignedTo != null ? String(current.assignedTo) : "0",
            name: current.tester,
          });
        }
      }
      const selectedTester = testerOptions.find((o) => o.name === values.tester);

      const patch = {
        name: values.name.trim(),
        featureId: values.featureId,
        criticality: values.criticality,
        type: values.type,
        tester: selectedTester?.name,
        // `null` retire l'affectation et doit etre envoye explicitement.
        assignedTo: selectedTester ? Number(selectedTester.id) : null,
        preconditions: splitLines(values.preconditions),
        steps: splitLines(values.steps),
        expected: splitLines(values.expected),
        observed: values.observed.trim(),
        comment: values.comment.trim(),
      };

      if (mode === "create") {
        return store.addTestCase({ campaignId, ...patch });
      }

      store.updateTest(id ?? "", patch);
      if (online) {
        const numericFeatureId = Number(values.featureId);
        await api(`/test-cases/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: patch.name,
            feature_id:
              Number.isInteger(numericFeatureId) && numericFeatureId > 0
                ? numericFeatureId
                : undefined,
            steps: patch.steps.join("\n"),
            expected_result: patch.expected.join("\n"),
            priority: toBackendPriority(patch.criticality),
            type: patch.type,
            // `null` efface l'affectation cote serveur ; un id la remplace.
            assigned_to: patch.assignedTo,
          }),
        });
      }
      return;
    },
    submitLabel: (ctx) =>
      ctx.t(
        ctx.mode === "create" ? "pages.campaign_detail.creer_le_cas_test" : "actions.enregistrer",
      ),
    successMessage: (ctx, saved) =>
      ctx
        .t(
          ctx.mode === "create"
            ? "pages.campaign_detail.cas_test_creer"
            : "pages.campaign_detail.cas_test_modifier",
        )
        .replace("{id}", ctx.mode === "create" ? (saved ?? "") : (ctx.entity?.id ?? "")),
  };
}
