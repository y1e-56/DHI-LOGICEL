import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { isInteractiveClick } from "@/lib/clickable-row";
import { products as seedProducts, PROJECT_STATUS_LABEL } from "@/lib/dhi-data";
import { cn } from "@/lib/utils";
import { productTabs } from "@/lib/dhi-nav";
import { projectProgress } from "@/lib/progress";
import { canCreateProject } from "@/lib/role-protection";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/produits/$productId/projets")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const products = snapshot?.products ?? seedProducts;
    const p = products.find((x) => x.id === params.productId);
    return { name: p?.name ?? "Produit" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Projets · ${loaderData?.name ?? "Produit"} — DHI Quality Platform` }],
  }),
  component: ProductProjects,
});

const STATUS_TONE: Record<string, string> = {
  encours: "border-info/30 bg-info-soft text-info",
  termine: "border-success/30 bg-success-soft text-success",
  planifie: "border-border bg-secondary text-secondary-foreground",
};

function ProductProjects() {
  const { productId } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { products, projects, campaigns, tests } = useStore();
  const product = products.find((p) => p.id === productId);
  const [search, setSearch] = useState("");

  const prodProjects = useMemo(() => {
    const productProjects = projects.filter((pr) => pr.productId === productId);
    if (!search.trim()) return productProjects;
    const query = search.toLowerCase();
    return productProjects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.objective.toLowerCase().includes(query) ||
        project.targetVersion.toLowerCase().includes(query),
    );
  }, [projects, productId, search]);

  return (
    <AppShell
      title={product?.name ?? t("nav.product_projects")}
      subtitle={t("nav.product_projects")}
      breadcrumb={[
        t("nav.qualite"),
        t("nav.produits"),
        product?.name ?? "",
        t("nav.product_projects"),
      ]}
      tabs={productTabs(productId)}
      actions={
        canCreateProject() ? (
          <Link to="/projets/ajouter" search={{ productId }}>
            <Button size="sm">
              <Plus className="size-4" /> {t("pages.projects.new_project")}
            </Button>
          </Link>
        ) : undefined
      }
    >
      <div className="panel">
        <div className="border-b border-border px-4 py-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("pages.projects.search_placeholder")}
              className="pl-8"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.projet")}</TableHead>
              <TableHead>{t("common.etat")}</TableHead>
              <TableHead>{t("pages.campaigns.progress")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prodProjects.map((pr) => {
              const prCampaigns = campaigns.filter((c) => c.projectId === pr.id);
              const rate = projectProgress(tests, campaigns, pr.id);
              return (
                <TableRow
                  key={pr.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    if (isInteractiveClick(e)) return;
                    void navigate({ to: "/projets/$projectId", params: { projectId: pr.id } });
                  }}
                >
                  <TableCell>
                    <Link
                      to="/projets/$projectId"
                      params={{ projectId: pr.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {pr.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold",
                        STATUS_TONE[pr.status],
                      )}
                    >
                      {PROJECT_STATUS_LABEL[pr.status]}
                    </span>
                  </TableCell>
                  <TableCell className="num text-sm">
                    {prCampaigns.length} · {rate} %
                  </TableCell>
                </TableRow>
              );
            })}
            {prodProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  {t("pages.product_detail.no_projects")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
