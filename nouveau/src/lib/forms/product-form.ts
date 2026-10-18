import { z } from "zod";
import { createProduct, mapBackendProduct, updateProductById } from "@/lib/api";
import type { Product } from "@/lib/dhi-data";
import type { EntityFormSchema } from "./types";

export type ProductFormValues = {
  name: string;
  description: string;
  owner: string;
  qaLead: string;
  /** Version initiale : obligatoire a la creation, et pour un produit sans version. */
  version: string;
};

/** Le champ version est demande a la creation, ou si le produit n'en a aucune. */
const needsVersion = (mode: string, entity: Product | undefined) =>
  mode === "create" || !entity || entity.versions.length === 0;

/**
 * Formulaire d'entite Produit : un seul schema pour creer et modifier.
 * Le mode choisit le titre, le libelle de soumission et le message de succes ;
 * les options de la liste QA viennent du contexte d'execution.
 */
export const productForm: EntityFormSchema<ProductFormValues, Product> = {
  title: (ctx) =>
    ctx.t(ctx.mode === "create" ? "pages.products.new_product" : "pages.products.edit_product"),
  subtitle: (ctx) => ctx.t("pages.products.subtitle"),
  fields: () => [
    {
      name: "name",
      type: "text",
      label: (ctx) => ctx.t("pages.products.name_label"),
      placeholder: (ctx) => ctx.t("pages.products.name_placeholder"),
      width: "full",
    },
    {
      name: "description",
      type: "text",
      label: (ctx) => ctx.t("common.description"),
      width: "full",
    },
    {
      name: "owner",
      type: "text",
      label: (ctx) => ctx.t("pages.products.owner"),
      placeholder: (ctx) => ctx.t("pages.products.owner_placeholder"),
      width: "half",
    },
    {
      name: "qaLead",
      type: "select",
      label: (ctx) => ctx.t("pages.products.qa_lead"),
      placeholder: (ctx) => ctx.t("pages.go_live.choose"),
      width: "half",
      options: ({ store }) =>
        store.users
          .filter((user) => user.active)
          .map((user) => ({ value: user.name, label: user.name })),
    },
    {
      // CDC RG-005 : un produit a toujours au moins une version. Les versions
      // suivantes se creent depuis un projet ou une campagne.
      name: "version",
      type: "text",
      label: (ctx) => ctx.t("common.initial_version"),
      placeholder: () => "Ex. 1.0",
      width: "half",
      when: (ctx) => needsVersion(ctx.mode, ctx.entity as Product | undefined),
    },
  ],
  validation: (ctx) =>
    z.object({
      name: z.string().trim().min(1, ctx.t("forms.required")),
      description: z.string(),
      version: needsVersion(ctx.mode, ctx.entity)
        ? z.string().trim().min(1, ctx.t("common.version_required")).max(50)
        : z.string(),
      owner: z.string().trim().min(1, ctx.t("forms.required")),
      qaLead: z.string().min(1, ctx.t("forms.required")),
    }),
  defaults: ({ entity: product }) => ({
    name: product?.name ?? "",
    description: product?.description ?? "",
    owner: product?.owner ?? "",
    qaLead: product?.qaLead ?? "",
    version: "",
  }),
  save: async ({ values, mode, id, online, store }) => {
    const version = values.version.trim();
    const ownerName = values.owner.trim();
    const owner = store.users.find((user) => user.name === ownerName);
    const qaLead = store.users.find((user) => user.name === values.qaLead);
    const local = {
      name: values.name.trim(),
      description: values.description,
      owner: ownerName,
      qaLead: values.qaLead,
      qaTeam: [values.qaLead],
    };

    if (!online) {
      if (mode === "create") {
        store.addProduct({ ...local, versions: [version], score: 80 });
      } else {
        store.updateProduct(id ?? "", local);
      }
      return;
    }

    const payload = {
      name: values.name.trim(),
      description: values.description,
      owner_id: owner ? Number(owner.id) : null,
      owner_name: ownerName,
      quality_manager_id: qaLead ? Number(qaLead.id) : null,
    };
    const withVersion = (product: Product): Product =>
      version && !product.versions.includes(version)
        ? { ...product, versions: [...product.versions, version] }
        : product;
    // Le mappage vit ici, pas dans la route : createProduct/updateProductById
    // sont les seuls a parler HTTP pour cette entite.
    if (mode === "create") {
      const response = await createProduct({ ...payload, version });
      store.replaceProducts([
        ...store.products,
        withVersion({ ...mapBackendProduct(response.product), ...local }),
      ]);
    } else {
      const response = await updateProductById(Number(id), {
        ...payload,
        ...(version ? { version } : {}),
      });
      store.replaceProducts(
        store.products.map((item) =>
          item.id === id
            ? withVersion({
                ...mapBackendProduct(response.product, item.versions),
                ...local,
              })
            : item,
        ),
      );
    }
  },
  submitLabel: (ctx) =>
    ctx.t(ctx.mode === "create" ? "pages.products.create" : "actions.enregistrer"),
  successMessage: (ctx) =>
    ctx.t(ctx.mode === "create" ? "pages.products.created" : "pages.products.updated_msg"),
};
