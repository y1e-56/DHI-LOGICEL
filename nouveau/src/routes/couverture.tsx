import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Check, Minus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { Panel } from "@/components/dhi/indicators";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isInteractiveClick } from "@/lib/clickable-row";
import { cellState, requiredTypes, summarizeCoverage, type CoverageState } from "@/lib/coverage";
import { evaluateRule, type RuleVerdict } from "@/lib/rules";
import type { Feature } from "@/lib/dhi-data";
import { TEST_TYPES } from "@/lib/dhi-data";
import { cn } from "@/lib/utils";

import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/dhi-store";
import { useVisibleProductIds } from "@/lib/use-scope";

export const Route = createFileRoute("/couverture")({
  head: () => ({
    meta: [
      { title: "Matrice de couverture — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Matrice de couverture 2D : fonctionnalités × types de tests, avec alertes sur les trous.",
      },
      { property: "og:title", content: "Matrice de couverture — DHI Quality Platform" },
      {
        property: "og:description",
        content: "Visualisez les trous de couverture de tests par fonctionnalité.",
      },
    ],
  }),
  component: CoveragePage,
});

const CELL_STYLE: Record<CoverageState, string> = {
  covered: "bg-success-soft text-success",
  at_risk: "bg-warning-soft text-warning",
  missing: "bg-danger-soft text-danger",
  extra: "text-muted-foreground",
  not_required: "text-muted-foreground/50",
};

function CellIcon({ state }: { state: CoverageState }) {
  if (state === "covered") return <Check className="size-4" />;
  if (state === "at_risk") return <AlertTriangle className="size-4" />;
  if (state === "missing") return <X className="size-4" />;
  if (state === "extra") return <Check className="size-3.5" />;
  return <Minus className="size-3.5" />;
}

function CoveragePage() {
  const { t } = useI18n();
  const { features, tests, products, rules } = useStore();
  // Cibles du referentiel : RG-7 pour une fonctionnalite critique, RG-6 sinon
  // (et RG-6 pour le bilan global). Taux arrondi au dixieme, comme le serveur.
  const rateOf = (list: Feature[]) => {
    const { required, covered } = summarizeCoverage(list, tests);
    return required ? Math.round((covered / required) * 1000) / 10 : null;
  };
  const ruleById = (id: string) => rules.find((r) => r.id === id);
  const targetVerdict = (f: Feature): RuleVerdict | null => {
    const rate = rateOf([f]);
    if (rate === null) return null;
    return evaluateRule(ruleById(f.criticality === "critique" ? "RG-7" : "RG-6"), rate);
  };
  const navigate = useNavigate();
  const [productFilter, setProductFilter] = useState("all");
  const [showAllTypes, setShowAllTypes] = useState(false);
  const visiblePIds = useVisibleProductIds(products);

  const rows = useMemo(
    () =>
      features
        .filter((f) => visiblePIds.has(f.productId))
        .filter((f) => productFilter === "all" || f.productId === productFilter),
    [features, productFilter, visiblePIds],
  );

  // Par defaut, seuls les types requis par au moins une fonctionnalite de la
  // vue : afficher les 18 colonnes noyait les vrais trous dans du bruit.
  const columns = useMemo(() => {
    const wanted = showAllTypes ? TEST_TYPES.map((tt) => tt.id) : requiredTypes(rows);
    return TEST_TYPES.filter((tt) => wanted.includes(tt.id));
  }, [rows, showAllTypes]);

  const summary = useMemo(() => summarizeCoverage(rows, tests), [rows, tests]);
  const globalRate = rateOf(rows);
  const globalVerdict = globalRate === null ? null : evaluateRule(ruleById("RG-6"), globalRate);
  const typeLabel = (id: string) => TEST_TYPES.find((tt) => tt.id === id)?.label ?? id;
  const stateLabel = (state: CoverageState) =>
    ({
      covered: t("pages.couverture.state_covered"),
      at_risk: t("pages.couverture.state_at_risk"),
      missing: t("pages.couverture.state_missing"),
      extra: t("pages.couverture.state_extra"),
      not_required: t("pages.couverture.state_not_required"),
    })[state];

  return (
    <AppShell
      title={t("pages.couverture.title")}
      subtitle={t("pages.couverture.subtitle")}
      breadcrumb={t("pages.couverture.breadcrumb")}
    >
      <Panel
        title={t("pages.couverture.grid_title")}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={showAllTypes}
                onCheckedChange={(v) => setShowAllTypes(v === true)}
              />
              {t("pages.couverture.show_all_types")}
            </label>
            <SearchableSelect
              value={productFilter}
              onValueChange={setProductFilter}
              options={[
                { value: "all", label: t("pages.couverture.all_products") },
                ...products
                  .filter((p) => visiblePIds.has(p.id))
                  .map((p) => ({ value: p.id, label: p.name })),
              ]}
              placeholder={t("pages.couverture.product_placeholder")}
              className="w-52"
            />
          </div>
        }
      >
        {columns.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("pages.couverture.no_required_types")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("pages.couverture.feature")}</TableHead>
                  <TableHead className="text-right">{t("pages.couverture.rate_col")}</TableHead>
                  {columns.map((testType) => (
                    <TableHead key={testType.id} className="text-center">
                      {testType.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((f) => (
                  <TableRow
                    key={f.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      if (isInteractiveClick(e)) return;
                      navigate({
                        to: "/fonctionnalites/$featureId/modifier",
                        params: { featureId: f.id },
                      });
                    }}
                  >
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="text-right">
                      <RateCell rate={rateOf([f])} verdict={targetVerdict(f)} />
                    </TableCell>
                    {columns.map((testType) => {
                      const state = cellState(f, testType.id, tests);
                      return (
                        <TableCell key={testType.id} className="text-center">
                          <span
                            className={cn(
                              "inline-flex size-7 items-center justify-center rounded-md",
                              CELL_STYLE[state],
                            )}
                            title={`${f.name} · ${testType.label} : ${stateLabel(state)}`}
                          >
                            <CellIcon state={state} />
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {t("pages.couverture.legend")}
            {(["covered", "at_risk", "missing", "not_required"] as CoverageState[]).map((state) => (
              <span key={state} className="inline-flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded",
                    CELL_STYLE[state],
                  )}
                >
                  <CellIcon state={state} />
                </span>
                {stateLabel(state)}
              </span>
            ))}
          </p>
          <p className="num text-sm font-medium">
            {summary.rate === null
              ? t("pages.couverture.no_required_cells")
              : t("pages.couverture.required_summary")
                  .replace("{covered}", String(summary.covered))
                  .replace("{required}", String(summary.required))
                  .replace("{pct}", String(summary.rate))}
            <GlobalTarget verdict={globalVerdict} />
          </p>
        </div>
      </Panel>

      <Panel title={t("pages.couverture.alerts_title")} className="mt-4">
        {summary.required === 0 ? (
          <p className="text-sm text-muted-foreground">{t("pages.couverture.no_required_types")}</p>
        ) : summary.gaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("pages.couverture.full_coverage")}</p>
        ) : (
          <ul className="space-y-2">
            {summary.gaps.slice(0, 10).map(({ feature, type, state }) => (
              <li
                key={`${feature.id}-${type}`}
                className={cn(
                  "flex items-start gap-3 rounded-md border px-3 py-2 text-sm",
                  state === "missing"
                    ? "border-danger/30 bg-danger-soft"
                    : "border-warning/40 bg-warning-soft",
                )}
              >
                <AlertTriangle
                  className={cn("mt-0.5 size-4", state === "missing" ? "text-danger" : "text-warning")}
                />
                <span>
                  {t(state === "missing" ? "pages.couverture.no_test" : "pages.couverture.not_passed")
                    .replace("{feature}", feature.name)
                    .replace("{type}", typeLabel(type).toLowerCase())}
                </span>
              </li>
            ))}
            {summary.gaps.length > 10 ? (
              <li className="text-sm text-muted-foreground">
                {t("pages.couverture.more_trou").replace(
                  "{count}",
                  String(summary.gaps.length - 10),
                )}
              </li>
            ) : null}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}

/** Taux d'une fonctionnalite, colore selon sa cible (RG-6 ou RG-7). */
function RateCell({ rate, verdict }: { rate: number | null; verdict: RuleVerdict | null }) {
  if (rate === null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "num text-sm font-medium",
        !verdict ? "text-muted-foreground" : verdict.ok ? "text-success" : "text-danger",
      )}
      title={verdict?.message}
    >
      {String(rate).replace(".", ",")} %
    </span>
  );
}

/** Bilan global compare a la cible RG-6. */
function GlobalTarget({ verdict }: { verdict: RuleVerdict | null }) {
  const { t } = useI18n();
  if (!verdict) return null;
  return (
    <span className={cn("ml-2", verdict.ok ? "text-success" : "text-danger")}>
      ·{" "}
      {t(verdict.ok ? "pages.couverture.target_reached" : "pages.couverture.target_missed")
        .replace("{threshold}", verdict.threshold)
        .replace("{id}", verdict.id)}
    </span>
  );
}
