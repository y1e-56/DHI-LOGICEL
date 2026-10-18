import { z } from "zod";
import { campaignVisibleTo, getUser, workProducts } from "@/lib/access";
import { api, mapBackendWatchPoint, type BackendWatchPoint } from "@/lib/api";
import { WATCH_LEVEL_LABEL, type WatchLevel, type WatchPoint } from "@/lib/dhi-data";
import type { EntityFormSchema, FormRunContext } from "./types";

export type WatchPointFormValues = {
  title: string;
  description: string;
  productId: string;
  /** "" = sans fonctionnalite liee. */
  featureId: string;
  level: WatchLevel;
  owner: string;
};

/**
 * Formulaire d'entite Point a surveiller. La route n'existe qu'en creation ;
 * l'ecriture bifurque : sans jeton, ou sans projet numerique pour le produit,
 * le point reste local (le schema ne voit jamais localStorage : `online`
 * vient du moteur).
 */
/** Produits sur lesquels l'utilisateur travaille (role produit ou campagnes). */
const productsOf = (store: FormRunContext<WatchPointFormValues>["store"]) =>
  workProducts(store.products, store.campaigns ?? [], getUser());

export const watchPointForm: EntityFormSchema<WatchPointFormValues, WatchPoint> = {
  title: (ctx) => ctx.t("pages.watchpoints.new_point_page"),
  subtitle: (ctx) => ctx.t("pages.watchpoints.subtitle"),
  fields: (ctx) => [
    {
      name: "title",
      type: "text",
      label: (c) => c.t("pages.watchpoints.titre"),
      placeholder: (c) => c.t("pages.watchpoints.title_placeholder"),
      width: "full",
    },
    {
      name: "description",
      type: "textarea",
      rows: 3,
      label: (c) => c.t("pages.watchpoints.description"),
      width: "full",
    },
    {
      name: "productId",
      type: "select",
      label: (c) => c.t("pages.watchpoints.produit"),
      width: "half",
      options: (c) =>
        productsOf(c.store).map((product) => ({
          value: product.id,
          label: product.name,
        })),
      onChange: ({ setValue }) => setValue("featureId", ""),
    },
    {
      name: "featureId",
      type: "select",
      label: (c) => c.t("pages.watchpoints.feature"),
      placeholder: (c) => c.t("pages.watchpoints.no_feature"),
      width: "half",
      options: (c) => [
        { value: "", label: c.t("pages.watchpoints.no_feature") },
        ...c.store.features
          .filter((feature) => feature.productId === c.values.productId)
          .map((feature) => ({ value: feature.id, label: feature.name })),
      ],
    },
    {
      name: "level",
      type: "select",
      label: (c) => c.t("pages.watchpoints.niveau"),
      width: "half",
      options: () =>
        (Object.keys(WATCH_LEVEL_LABEL) as WatchLevel[]).map((value) => ({
          value,
          label: WATCH_LEVEL_LABEL[value],
        })),
    },
    {
      name: "owner",
      type: "select",
      label: (c) => c.t("pages.watchpoints.responsable"),
      width: "half",
      options: (c) =>
        c.store.users
          .filter((user) => user.active)
          .map((user) => ({ value: user.name, label: user.name })),
    },
  ],
  validation: (ctx) =>
    z.object({
      title: z.string().trim().min(1, ctx.t("pages.watchpoints.title_required")),
      // Le serveur exige une description : la refuser vide ici evite un echec
      // a l'enregistrement.
      description: z.string().trim().min(1, ctx.t("pages.watchpoints.description_required")),
      productId: z.string(),
      featureId: z.string(),
      level: z.enum(["info", "vigilance", "critique"]),
      owner: z.string(),
    }),
  defaults: ({ ctx }) => {
    const activeMembers = ctx.store.users.filter((user) => user.active).map((user) => user.name);
    return {
      title: "",
      description: "",
      productId: productsOf(ctx.store)[0]?.id ?? "",
      featureId: "",
      level: "vigilance" as WatchLevel,
      owner: activeMembers[0] ?? "",
    };
  },
  save: async ({ values, online, store }) => {
    const localPoint: Omit<WatchPoint, "id" | "createdAt"> = {
      productId: values.productId,
      title: values.title.trim(),
      description: values.description,
      level: values.level,
      status: "ouvert",
      owner: values.owner,
      ...(values.featureId ? { featureId: values.featureId } : {}),
    };
    // Le projet d'une campagne de l'utilisateur sur ce produit, a defaut le
    // premier projet du produit : le point se rattache la ou il travaille.
    const user = getUser();
    const campaignProjectId = (store.campaigns ?? []).find(
      (c) =>
        c.productId === values.productId &&
        /^\d+$/.test(c.projectId) &&
        campaignVisibleTo(c, store.products, user),
    )?.projectId;
    const project =
      store.projects.find((item) => item.id === campaignProjectId) ??
      store.projects.find((item) => item.productId === values.productId && /^\d+$/.test(item.id));
    if (!online || !project) {
      store.addWatchPoint(localPoint);
      return;
    }

    const owner = store.users.find((user) => user.name === values.owner);
    const ownerId = owner ? Number(owner.id) : undefined;
    const numericOwnerId =
      ownerId !== undefined && Number.isInteger(ownerId) && ownerId > 0 ? ownerId : undefined;
    const featureId =
      values.featureId && /^\d+$/.test(values.featureId) ? Number(values.featureId) : undefined;
    const response = await api<BackendWatchPoint>("/watch-points", {
      method: "POST",
      body: JSON.stringify({
        project_id: Number(project.id),
        feature_id: featureId,
        title: localPoint.title,
        description: localPoint.description,
        criticality: ({ critique: "critical", vigilance: "high", info: "low" } as const)[
          values.level
        ],
        owner_id: numericOwnerId,
        status: "open",
      }),
    });
    store.replaceWatchPoints([
      ...store.watchPoints,
      {
        ...mapBackendWatchPoint(response, localPoint.productId),
        owner: localPoint.owner,
        productId: localPoint.productId,
      },
    ]);
  },
  submitLabel: (ctx) => ctx.t("pages.watchpoints.enregistrer"),
  successMessage: (ctx) => ctx.t("pages.watchpoints.saved"),
};
