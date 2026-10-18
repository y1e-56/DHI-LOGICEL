import { z } from "zod";
import {
  getUser,
  isTesterRole,
  visibleCampaigns,
  visibleProducts,
  visibleProjects,
} from "@/lib/access";
import { api, mapBackendCampaign, type BackendCampaign } from "@/lib/api";
import { CAMPAIGN_OWNER_ROLES, type AppRole, type CampaignStatus } from "@/lib/dhi-data";
import type { MemberOption } from "@/components/dhi/MemberMultiSelect";
import type { EntityFormSchema, Store } from "./types";
import {
  NEW_VERSION,
  defaultVersionChoice,
  resolveVersion,
  versionMissing,
  versionOptions,
  versionsOf,
  withProductVersion,
} from "./version-field";

export type CampaignFormValues = {
  name: string;
  type: string;
  productId: string;
  projectId: string;
  /** Version visee choisie dans la liste, ou NEW_VERSION. */
  version: string;
  /** Saisie libre quand « Nouvelle version… » est choisi. */
  newVersion: string;
  environment: string;
  owner: string;
  startDate: string;
  endDate: string;
  clone: boolean;
  cloneFrom: string;
  testers: Set<string>;
  developers: Set<string>;
};

const CAMPAIGN_TYPES = ["Recette", "Régression", "Sécurité", "Performance", "Exploratoire"];
const ENVIRONMENTS = ["RECETTE", "PREPROD", "DEV", "PROD"];

const memberOptionsOf = (store: Store): MemberOption[] =>
  store.users.map((u) => ({
    name: u.name,
    role: u.role,
    roles: u.roles ?? [u.role],
    active: u.active,
  }));

const ownerOptionsOf = (store: Store): MemberOption[] =>
  memberOptionsOf(store).filter(
    (o) =>
      o.active && (o.roles ?? [o.role]).some((r) => CAMPAIGN_OWNER_ROLES.includes(r as AppRole)),
  );

const testerOptionsOf = (store: Store): MemberOption[] =>
  memberOptionsOf(store).filter((o) => o.active && isTesterRole(o.roles, o.role));

const devOptionsOf = (store: Store): MemberOption[] =>
  memberOptionsOf(store).filter((o) => o.active && (o.roles ?? [o.role]).includes("developpeur"));

/**
 * Formulaire de campagne (creation seule) : la campagne est une tranche du
 * projet, sa periode doit y tenir ; elle se clone depuis une campagne existante
 * pour recreer ses tests.
 */
export const campaignForm: EntityFormSchema<CampaignFormValues> = {
  title: (ctx) => ctx.t("pages.add_campaign.informations_generales"),
  subtitle: (ctx) => ctx.t("pages.add_campaign.informations_generales_hint"),
  submitLabel: (ctx) => ctx.t("pages.add_campaign.create"),
  successMessage: (ctx) =>
    `${ctx.t("common.campagne")} « ${ctx.values.name.trim()} » ${ctx.t("pages.add_campaign.created")}`,

  fields: (ctx) => [
    {
      name: "name",
      type: "text",
      label: (c) => c.t("pages.add_campaign.campaign_name"),
      placeholder: (c) => c.t("pages.add_campaign.name_placeholder"),
    },
    {
      name: "type",
      type: "select",
      width: "half",
      label: (c) => c.t("common.type"),
      options: () => CAMPAIGN_TYPES.map((value) => ({ value, label: value })),
    },
    {
      name: "productId",
      type: "select",
      width: "half",
      label: (c) => c.t("common.produit"),
      // Le produit est figé quand on crée depuis une fiche produit/projet :
      // il dérive alors du contexte d'entrée et le champ disparaît.
      when: (c) => !c.seed?.productId && !c.seed?.projectId,
      options: (c) =>
        visibleProducts(c.store.products, getUser()).map((p) => ({ value: p.id, label: p.name })),
      // Le changement de produit recale le projet sur le premier projet du
      // produit et adopte sa version cible.
      onChange: ({ value, ctx: run, setValue, getValues }) => {
        const first = visibleProjects(run.store.projects, run.store.products, getUser()).find(
          (pr) => pr.productId === value,
        );
        setValue("projectId", first?.id ?? "");
        setValue(
          "version",
          defaultVersionChoice(versionsOf(run.store, String(value)), first?.targetVersion),
        );
        setValue("newVersion", getValues().newVersion);
      },
    },
    {
      name: "projectId",
      type: "select",
      width: "half",
      label: (c) => c.t("common.projet"),
      placeholder: (c) => c.t("pages.add_campaign.choose_project"),
      // Le projet est figé et masqué quand on crée depuis une fiche projet.
      when: (c) => !c.seed?.projectId,
      options: (c) =>
        visibleProjects(c.store.projects, c.store.products, getUser())
          .filter((pr) => pr.productId === c.values.productId)
          .map((pr) => ({ value: pr.id, label: pr.name })),
      // Le changement de projet recale le produit parent et sa version cible.
      onChange: ({ value, ctx: run, setValue, getValues }) => {
        const pr = visibleProjects(run.store.projects, run.store.products, getUser()).find(
          (p) => p.id === value,
        );
        const productId = pr?.productId ?? getValues().productId;
        setValue("productId", productId);
        setValue("version", defaultVersionChoice(versionsOf(run.store, productId), pr?.targetVersion));
      },
    },
    {
      // Obligatoire (CDC RG-005) : une version du produit, existante ou
      // nouvelle (creee pour le produit a l'enregistrement).
      name: "version",
      type: "select",
      width: "half",
      label: (c) => c.t("common.version"),
      options: (c) => versionOptions(versionsOf(c.store, c.values.productId), c.t("common.version_new")),
    },
    {
      name: "newVersion",
      type: "text",
      width: "half",
      label: (c) => c.t("common.version_new_label"),
      placeholder: () => "Ex. 2.1",
      when: (c) => c.values.version === NEW_VERSION,
    },
    {
      name: "environment",
      type: "select",
      width: "half",
      label: (c) => c.t("pages.add_campaign.environment"),
      options: () => ENVIRONMENTS.map((value) => ({ value, label: value })),
    },
    {
      name: "owner",
      type: "select",
      width: "half",
      label: (c) => c.t("common.responsable"),
      options: (c) => ownerOptionsOf(c.store).map((o) => ({ value: o.name, label: o.name })),
    },
    {
      name: "startDate",
      type: "date",
      width: "half",
      label: (c) => c.t("pages.add_campaign.start_date"),
      min: () => new Date().toISOString().slice(0, 10),
    },
    {
      name: "endDate",
      type: "date",
      width: "half",
      label: (c) => c.t("pages.add_campaign.end_date"),
      min: (c) => c.values.startDate,
    },
    {
      name: "clone",
      type: "checkbox",
      section: {
        label: (c) => c.t("pages.add_campaign.test_config"),
        hint: (c) => c.t("pages.add_campaign.test_config_hint"),
      },
      label: (c) => c.t("pages.add_campaign.recreate_from_existing"),
    },
    {
      name: "cloneFrom",
      type: "select",
      when: (c) => c.values.clone,
      label: (c) => c.t("pages.add_campaign.test_config"),
      options: (c) =>
        visibleCampaigns(c.store.campaigns, c.store.products, getUser()).map((campaign) => ({
          value: campaign.id,
          label: campaign.name,
        })),
    },
    {
      name: "testers",
      type: "members",
      label: (c) => c.t("pages.add_campaign.assigned_testers"),
      member: {
        options: (c) => testerOptionsOf(c.store),
        showRole: false,
        placeholder: (c) => c.t("pages.add_campaign.aucun_membre"),
        selectionLabel: (c) => ({
          label: c.t("pages.add_campaign.membre"),
          labelPlural: c.t("pages.add_campaign.membres"),
        }),
      },
    },
    {
      name: "developers",
      type: "members",
      label: (c) => c.t("pages.add_campaign.assigned_developers"),
      member: {
        options: (c) => devOptionsOf(c.store),
        showRole: false,
        placeholder: (c) => c.t("pages.add_campaign.aucun_membre"),
        selectionLabel: (c) => ({
          label: c.t("pages.add_campaign.membre"),
          labelPlural: c.t("pages.add_campaign.membres"),
        }),
      },
    },
  ],

  validation: (ctx) =>
    z
      .object({
        name: z.string().trim().min(1, "pages.add_campaign.name_required"),
        type: z.string(),
        productId: z.string(),
        projectId: z.string().min(1, "pages.add_campaign.project_required"),
        version: z.string(),
        newVersion: z.string(),
        environment: z.string(),
        owner: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        clone: z.boolean(),
        cloneFrom: z.string(),
        testers: z.custom<Set<string>>((v) => v instanceof Set),
        developers: z.custom<Set<string>>((v) => v instanceof Set),
      })
      .superRefine((values, issue) => {
        if (versionMissing(values.version, values.newVersion)) {
          issue.addIssue({
            code: z.ZodIssueCode.custom,
            message: "common.version_required",
            path: [values.version === NEW_VERSION ? "newVersion" : "version"],
          });
        }
        if (values.endDate && values.startDate > values.endDate) {
          issue.addIssue({
            code: z.ZodIssueCode.custom,
            message: "pages.add_campaign.end_date_before_start",
            path: ["endDate"],
          });
        }
        // La campagne est une tranche du projet : sa periode doit y tenir.
        const parent = visibleProjects(ctx.store.projects, ctx.store.products, getUser()).find(
          (p) => p.id === values.projectId,
        );
        if (parent?.startDate && values.startDate < parent.startDate) {
          issue.addIssue({
            code: z.ZodIssueCode.custom,
            message: "pages.add_campaign.starts_before_project",
            path: ["startDate"],
          });
        }
        if (parent?.endDate && values.endDate && values.endDate > parent.endDate) {
          issue.addIssue({
            code: z.ZodIssueCode.custom,
            message: "pages.add_campaign.ends_after_project",
            path: ["endDate"],
          });
        }
      }),

  defaults: ({ ctx }) => {
    const base = {
      name: "",
      type: "Recette",
      productId: "p-paiement",
      projectId: "pr-3ds",
      version: "",
      newVersion: "",
      environment: "RECETTE",
      owner: "Marie Martin",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      clone: true,
      cloneFrom: "c-recette-412",
      testers: new Set<string>(),
      developers: new Set<string>(),
    };

    // Creation depuis une fiche projet : le produit derive du projet et la
    // version cible du projet est adoptée.
    if (ctx.seed?.projectId) {
      const project = visibleProjects(ctx.store.projects, ctx.store.products, getUser()).find(
        (p) => p.id === ctx.seed?.projectId,
      );
      if (project) {
        return {
          ...base,
          productId: project.productId,
          projectId: project.id,
          version: defaultVersionChoice(
            versionsOf(ctx.store, project.productId),
            project.targetVersion,
          ),
        };
      }
    }

    // Creation depuis une fiche produit : le produit est fixe, la version
    // cible peut venir de son premier projet visible.
    if (ctx.seed?.productId) {
      const first = visibleProjects(ctx.store.projects, ctx.store.products, getUser()).find(
        (p) => p.productId === ctx.seed?.productId,
      );
      return {
        ...base,
        productId: ctx.seed.productId,
        projectId: first?.id ?? base.projectId,
        version: defaultVersionChoice(
          versionsOf(ctx.store, ctx.seed.productId),
          first?.targetVersion,
        ),
      };
    }

    return base;
  },

  save: async ({ values, online, store }) => {
    const version = resolveVersion(values.version, values.newVersion);
    // La version (nouvelle ou non) est connue du produit pour les formulaires suivants.
    store.replaceProducts(withProductVersion(store.products, values.productId, version));
    const localCampaign = {
      productId: values.productId,
      projectId: values.projectId,
      name: values.name.trim(),
      type: values.type,
      version,
      environment: values.environment,
      owner: values.owner,
      status: "planifiee" as CampaignStatus,
      startDate: values.startDate,
      endDate: values.endDate || values.startDate,
      testers: [...values.testers],
      developers: [...values.developers],
      testLeads: [values.owner],
    };

    if (!online || !/^\d+$/.test(values.projectId)) {
      return store.addCampaign(localCampaign, values.clone ? values.cloneFrom : undefined);
    }

    const numericUserId = (id: string | undefined) => {
      const n = Number(id);
      return Number.isInteger(n) && n > 0 ? n : undefined;
    };
    const toNumericIds = (names: Set<string>) =>
      store.users
        .filter((user) => names.has(user.name))
        .map((user) => numericUserId(user.id))
        .filter((n): n is number => n !== undefined);
    const organizationMode =
      values.type === "Recette" || values.type === "Régression"
        ? "scenario"
        : values.type === "Sécurité" || values.type === "Performance"
          ? "combination"
          : "exploratory";
    const response = await api<{ campaign: BackendCampaign }>("/campaigns", {
      method: "POST",
      body: JSON.stringify({
        project_id: Number(values.projectId),
        name: localCampaign.name,
        objective: `Campagne ${values.type} ${version}`,
        version,
        organization_mode: organizationMode,
        start_date: localCampaign.startDate,
        end_date: localCampaign.endDate,
        test_lead_ids: toNumericIds(new Set([values.owner])),
        testers: toNumericIds(values.testers),
        developers: toNumericIds(values.developers),
      }),
    });
    const backendCampaign = mapBackendCampaign(
      response.campaign,
      store.projects.find((project) => project.id === values.projectId)
        ? { id: Number(values.projectId), product_id: Number(values.productId), name: "" }
        : undefined,
    );
    store.replaceCampaigns([
      ...store.campaigns,
      { ...backendCampaign, ...localCampaign, id: String(response.campaign.id) },
    ]);
    return String(response.campaign.id);
  },
};
