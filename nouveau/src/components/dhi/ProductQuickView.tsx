import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight, FolderKanban } from "lucide-react";
import { HealthBadge, ScoreValue, KpiCard } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PROJECT_STATUS_LABEL, type Project } from "@/lib/dhi-data";
import { useStore } from "@/lib/dhi-store";
import { productIndicators } from "@/lib/product-indicators";
import { projectProgress } from "@/lib/progress";
import { useI18n } from "@/lib/i18n";
import { QualityBar } from "@/components/dhi/indicators";

function ActiveProjectRow({ project }: { project: Project }) {
  const { t } = useI18n();
  const { tests, campaigns } = useStore();
  const progress = projectProgress(tests, campaigns, project.id);
  return (
    <Link
      to="/projets/$projectId"
      params={{ projectId: project.id }}
      className="block rounded-md border border-border bg-subtle/50 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium">{project.name}</p>
        <span className="num shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium">
          {project.targetVersion}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
        <QualityBar value={progress} neutral className="max-w-24" />
        <span className="num text-[11px] text-muted-foreground">{progress} %</span>
      </div>
    </Link>
  );
}

/**
 * Apercu rapide d'un produit : score, KPIs et projets actifs, sans quitter la
 * page courante. Ouvert au clic sur le nom d'un produit (liste, fiche) et
 * mene vers la fiche complete via « Ouvrir la fiche complete ».
 */
export function ProductQuickView({
  productId,
  open,
  onOpenChange,
}: {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const { products, projects, features, campaigns, tests, defects } = useStore();

  const product = products.find((p) => p.id === productId);
  const indicators = useMemo(
    () =>
      product
        ? productIndicators(product, { projects, features, campaigns, tests, defects })
        : null,
    [product, projects, features, campaigns, tests, defects],
  );

  if (!product || !indicators) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("pages.product_detail.quick_view_title")}</DialogTitle>
          <DialogDescription className="line-clamp-2">{product.name}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-subtle/50 p-4">
          <div className="flex items-baseline gap-2">
            <ScoreValue score={indicators.score} size="lg" />
          </div>
          <HealthBadge score={indicators.score} />
          <p className="ml-auto min-w-0 truncate text-sm text-muted-foreground">{product.owner}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label={t("pages.product_detail.failed_tests_product_campaigns")}
            value={indicators.failedTests}
            tone={indicators.failedTests > 0 ? "danger" : "neutral"}
          />
          <KpiCard
            label={t("pages.product_detail.open_defects")}
            value={indicators.openDefects}
            tone={indicators.openDefects > 0 ? "warning" : "neutral"}
          />
          <KpiCard
            label={t("pages.product_detail.high_severity_incidents")}
            value={indicators.highSeverityIncidents}
            tone={indicators.highSeverityIncidents > 0 ? "danger" : "neutral"}
          />
          <KpiCard
            label={t("pages.product_detail.associated_projects")}
            value={indicators.associatedProjects}
            icon={<FolderKanban className="size-4" />}
          />
        </div>

        {indicators.activeProjects.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              {t("pages.product_detail.product_projects")}
            </p>
            <div className="space-y-1.5">
              {indicators.activeProjects.slice(0, 5).map((p) => (
                <ActiveProjectRow key={p.id} project={p} />
              ))}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Link to="/produits/$productId" params={{ productId }}>
            <Button onClick={() => onOpenChange(false)}>
              {t("pages.product_detail.open_full_sheet")}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
