import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { ProductAccessDenied } from "@/components/dhi/AccessDenied";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { productForm } from "@/lib/forms/product-form";
import { getUser, productVisibleTo } from "@/lib/access";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";
import { products as seedProducts } from "@/lib/dhi-data";

export const Route = createFileRoute("/produits/$productId/modifier")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const products = snapshot?.products ?? seedProducts;
    const p = products.find((x) => x.id === params.productId);
    return { name: p?.name ?? "Produit" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Modifier ${loaderData?.name ?? "le produit"} — DHI Quality Platform` }],
  }),
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { products } = useStore();
  const product = products.find((p) => p.id === productId);
  const goToPortfolio = () => void navigate({ to: "/produits" });

  if (product && !productVisibleTo(product, getUser())) {
    return <ProductAccessDenied subject={product.name} />;
  }
  if (!product) return null;

  return (
    <AppShell
      title={t("pages.products.title")}
      subtitle={t("pages.products.subtitle")}
      breadcrumb={t("pages.products.breadcrumb")}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goToPortfolio} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("pages.product_detail.portfolio")}
          </Button>
        </div>

        <EntityForm
          schema={productForm}
          mode="update"
          id={product.id}
          entity={product}
          onCancel={goToPortfolio}
          onSaved={goToPortfolio}
        />
      </div>
    </AppShell>
  );
}
