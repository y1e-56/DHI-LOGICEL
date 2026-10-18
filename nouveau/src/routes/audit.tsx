import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isInteractiveClick } from "@/lib/clickable-row";
import type { AuditEntry } from "@/lib/dhi-data";

import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [{ title: "Audit & historique — DHI Quality Platform" }],
  }),
  component: AuditPage,
});

function AuditDetailDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: AuditEntry | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useI18n();
  if (!entry) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry.action}</DialogTitle>
          <DialogDescription className="num">
            {entry.entity} · {entry.at}
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{t("pages.audit.acteur")}</dt>
          <dd>{entry.actor}</dd>
          <dt className="text-muted-foreground">{t("pages.audit.detail")}</dt>
          <dd className="whitespace-pre-wrap">{entry.detail}</dd>
        </dl>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("actions.fermer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AuditPage() {
  const { t } = useI18n();
  const { audit } = useStore();
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<AuditEntry | null>(null);
  const rows = useMemo(() => {
    if (!q.trim()) return audit;
    const s = q.toLowerCase();
    return audit.filter(
      (e) =>
        e.actor.toLowerCase().includes(s) ||
        e.action.toLowerCase().includes(s) ||
        e.entity.toLowerCase().includes(s) ||
        e.detail.toLowerCase().includes(s),
    );
  }, [audit, q]);

  return (
    <AppShell
      title={t("pages.audit.title")}
      subtitle={t("pages.audit.subtitle")}
      breadcrumb={t("pages.audit.breadcrumb")}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <KpiCard
          label={t("pages.audit.events")}
          value={audit.length}
          hint={t("pages.audit.memory_journal")}
        />
        <KpiCard
          label={t("pages.audit.displayed")}
          value={rows.length}
          hint={t("pages.audit.after_filter")}
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-subtle px-4 py-2.5">
          <h2 className="text-[13px] font-semibold tracking-tight">{t("pages.audit.journal")}</h2>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("pages.audit.filter_placeholder")}
            className="ml-auto w-72"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("pages.audit.acteur")}</TableHead>
              <TableHead>{t("pages.audit.action")}</TableHead>
              <TableHead>{t("pages.audit.entite")}</TableHead>
              <TableHead>{t("pages.audit.detail")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => (
              <TableRow
                key={e.id}
                className="cursor-pointer"
                onClick={(event) => {
                  if (isInteractiveClick(event)) return;
                  setDetail(e);
                }}
              >
                <TableCell className="num whitespace-nowrap text-xs text-muted-foreground">
                  {e.at}
                </TableCell>
                <TableCell className="text-sm">{e.actor}</TableCell>
                <TableCell className="text-sm font-medium">{e.action}</TableCell>
                <TableCell className="num text-sm">{e.entity}</TableCell>
                <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                  {e.detail}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {t("pages.audit.no_events")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <AuditDetailDialog
        entry={detail}
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
      />
    </AppShell>
  );
}
