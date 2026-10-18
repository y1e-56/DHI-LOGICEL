import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel, QualityBar } from "@/components/dhi/indicators";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  SCORE_LABELS,
  SCORE_WEIGHTS,
  type ReferentialRule,
  type RuleMode,
  type ScoreBreakdown,
} from "@/lib/dhi-data";
import {
  RULE_MODE_LABEL,
  RULE_SCOPES,
  RULE_UNIT_LABEL,
  formatThreshold,
  thresholdLabel,
} from "@/lib/rules";
import { cn } from "@/lib/utils";

import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/dhi-store";
import { canManageReferentials } from "@/lib/role-protection";

export const Route = createFileRoute("/referentiels")({
  head: () => ({
    meta: [{ title: "Référentiels & règles — DHI Quality Platform" }],
  }),
  component: ReferentialsPage,
});

function ReferentialsPage() {
  const { t } = useI18n();
  const { rules, updateRule } = useStore();
  const active = rules.filter((r) => r.active).length;
  // Tri par numero (RG-2 avant RG-10), et non alphabetique.
  const ruleNumber = (id: string) => Number(id.replace(/\D/g, "")) || 0;
  const sortedRules = [...rules].sort((a, b) => ruleNumber(a.id) - ruleNumber(b.id));

  return (
    <AppShell
      title={t("pages.referentials.title")}
      subtitle={t("pages.referentials.subtitle")}
      breadcrumb={t("pages.referentials.breadcrumb")}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={t("pages.referentials.rules")}
          value={rules.length}
          hint={t("pages.referentials.global_scope")}
        />
        <KpiCard
          label={t("pages.referentials.active")}
          value={active}
          tone="success"
          hint={t("pages.referentials.applied_in_calc")}
        />
        <KpiCard
          label={t("pages.referentials.inactive")}
          value={rules.length - active}
          hint={t("pages.referentials.kept_unused")}
        />
      </div>

      <Panel title={t("pages.referentials.score_comp")}>
        <ul className="space-y-3">
          {(Object.keys(SCORE_WEIGHTS) as (keyof ScoreBreakdown)[]).map((key) => (
            <li key={key}>
              <div className="flex justify-between text-sm">
                <span>{SCORE_LABELS[key]}</span>
                <span className="num text-muted-foreground">
                  {Math.round(SCORE_WEIGHTS[key] * 100)} %
                </span>
              </div>
              <QualityBar value={SCORE_WEIGHTS[key] * 100} className="mt-1" />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("pages.referentials.blocking_criterion")}
        </p>
      </Panel>

      <div className="panel overflow-hidden">
        <div className="flex h-11 items-center border-b border-border bg-subtle px-4">
          <h2 className="text-[13px] font-semibold tracking-tight">
            {t("pages.referentials.operational_rules")}
          </h2>
        </div>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t("pages.referentials.domain")}</TableHead>
              <TableHead>{t("pages.referentials.rule")}</TableHead>
              <TableHead>{t("pages.referentials.threshold")}</TableHead>
              <TableHead>{t("pages.referentials.mode")}</TableHead>
              <TableHead>{t("pages.referentials.applies_to")}</TableHead>
              <TableHead className="text-right">{t("pages.referentials.active_short")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRules.map((r) => {
              const scope = RULE_SCOPES[r.id];
              const editable = canManageReferentials();
              return (
              <TableRow key={r.id} className={cn(!r.active && "opacity-60")}>
                <TableCell className="num font-medium">{r.id}</TableCell>
                <TableCell className="text-sm">{r.domain}</TableCell>
                <TableCell className="text-sm">{r.label}</TableCell>
                <TableCell className="text-sm">
                  {editable && r.value !== null && r.value !== undefined && r.unit && r.comparator ? (
                    <ThresholdEditor
                      rule={r}
                      onSave={(value) => {
                        updateRule(r.id, { value });
                        toast.success(
                          t("pages.referentials.threshold_saved")
                            .replace("{id}", r.id)
                            .replace("{threshold}", formatThreshold({ ...r, value })),
                        );
                      }}
                    />
                  ) : (
                    <span className="num text-sm">{thresholdLabel(r)}</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {!scope?.control ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : editable ? (
                    <SearchableSelect
                      value={r.mode ?? "warning"}
                      onValueChange={(v) => {
                        updateRule(r.id, { mode: v as RuleMode });
                        toast.success(
                          t("pages.referentials.mode_saved")
                            .replace("{id}", r.id)
                            .replace("{mode}", RULE_MODE_LABEL[v as RuleMode]),
                        );
                      }}
                      options={(["blocking", "warning"] as RuleMode[]).map((m) => ({
                        value: m,
                        label: RULE_MODE_LABEL[m],
                      }))}
                      className="h-8 w-40 text-xs"
                    />
                  ) : (
                    <ModeBadge mode={r.mode ?? "warning"} />
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{scope?.where ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {canManageReferentials() ? (
                    <Switch
                      checked={r.active}
                      onCheckedChange={(v) => {
                        updateRule(r.id, { active: v });
                        toast.success(
                          `${r.id} ${v ? t("pages.referentials.enabled") : t("pages.referentials.disabled")}.`,
                        );
                      }}
                    />
                  ) : (
                    <span
                      className={
                        r.active ? "label-eyebrow text-success" : "label-eyebrow text-muted-foreground"
                      }
                    >
                      {r.active ? t("pages.referentials.enabled") : t("pages.referentials.disabled")}
                    </span>
                  )}
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>
    </AppShell>
  );
}

function ModeBadge({ mode }: { mode: RuleMode }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
        mode === "blocking"
          ? "border-danger/30 bg-danger-soft text-danger"
          : "border-warning/40 bg-warning-soft text-warning",
      )}
    >
      {RULE_MODE_LABEL[mode]}
    </span>
  );
}

/** Seuil numerique : signe (≥ / ≤) + valeur + unite, enregistre a la sortie du champ. */
function ThresholdEditor({
  rule,
  onSave,
}: {
  rule: ReferentialRule;
  onSave: (value: number) => void;
}) {
  const { t } = useI18n();
  const bounded = rule.unit === "percent" || rule.unit === "score";
  return (
    <div className="flex items-center gap-1.5">
      <span className="num text-muted-foreground">{rule.comparator === "lte" ? "≤" : "≥"}</span>
      <Input
        key={`${rule.id}-${rule.value}`}
        type="number"
        min={0}
        max={bounded ? 100 : undefined}
        step={1}
        defaultValue={rule.value ?? ""}
        className="h-8 w-20 text-sm"
        aria-label={`${rule.id} ${rule.label}`}
        onBlur={(e) => {
          const raw = e.target.value.trim();
          const value = Number(raw);
          if (raw === "" || !Number.isFinite(value) || value < 0 || (bounded && value > 100)) {
            toast.error(t("pages.referentials.threshold_invalid"));
            e.target.value = String(rule.value ?? "");
            return;
          }
          if (value !== rule.value) onSave(value);
        }}
      />
      <span className="text-xs text-muted-foreground">{rule.unit ? RULE_UNIT_LABEL[rule.unit] : ""}</span>
    </div>
  );
}
