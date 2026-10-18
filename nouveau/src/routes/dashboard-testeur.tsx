import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { FlaskConical, Bug, History, ListChecks } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, KpiCard, Panel, VerdictBadge } from "@/components/dhi/indicators";
import { QuickVerdictButtons } from "@/components/dhi/QuickVerdict";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/dhi-store";
import { loadSession } from "@/lib/dhi-store";
import { hasSessionRole } from "@/lib/role-protection";
import { useI18n } from "@/lib/i18n";
import type { TestCase } from "@/lib/dhi-data";

export const Route = createFileRoute("/dashboard-testeur")({
  // Pas de rendu serveur : la session vit dans le navigateur (localStorage).
  // Rendue cote serveur, la page voyait toujours « non connecte » et le
  // controle d'acces ne se refaisait pas ensuite dans le navigateur.
  ssr: false,
  beforeLoad: () => {
    if (!hasSessionRole("testeur") && !hasSessionRole("chef_testeur")) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Dashboard Testeur — DHI Quality Platform" },
      {
        name: "description",
        content: "Espace dédié aux testeurs : campagnes de tests et anomalies.",
      },
    ],
  }),
  component: TesteurDashboard,
});

function TesteurDashboard() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { campaigns, tests, defects } = useStore();
  const session = loadSession();

  const myCampaigns = campaigns.filter(
    (c) => c.testers.some((t) => t === session?.name) || c.owner === session?.name,
  );

  /**
   * Cas de test a traiter.
   *
   * Un testeur ne voit que ce qui lui est affecte : sans ce filtre, son tableau
   * de bord afficherait les cas de ses collegues et il ne saurait pas lesquels
   * sont les siens. Le chef de testeur, lui, pilote les campagnes dont il est
   * responsable et doit voir la charge complete pour la redistribuer.
   */
  const assignedTests = (() => {
    const inMyCampaigns = tests.filter((t) => myCampaigns.some((c) => c.id === t.campaignId));
    if (hasSessionRole("chef_testeur")) return inMyCampaigns;
    // `assignedTo` est l'id base, `tester` le nom affiche : l'affectation
    // passe par l'un ou l'autre selon l'anciennete de la donnee.
    const myId = session?.id;
    return inMyCampaigns.filter(
      (t) => (myId != null && String(t.assignedTo ?? "") === String(myId)) || t.tester === session?.name,
    );
  })();

  // Les cas a traiter remontent en tete : c'est la seule question que le
  // testeur se pose en se connectant.
  const todoTests = assignedTests
    .filter((t) => t.verdict === "NOT_RUN")
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const myDefects = defects.filter(
    (d) => d.assignee === session?.name || d.reporter === session?.name,
  );

  const activeCampaigns = myCampaigns.filter(
    (c) => c.status === "encours" || c.status === "planifiee",
  ).length;

  const openDefects = myDefects.filter((d) => d.status !== "fermee").length;

  return (
    <AppShell
      title={t("dashboard.tester.title")}
      subtitle={t("dashboard.tester.subtitle")}
      breadcrumb={["Testeur", "Dashboard"]}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={t("dashboard.tester.my_campaigns")}
          value={myCampaigns.length}
          icon={<FlaskConical className="size-4" />}
          hint={t("dashboard.tester.active_campaigns")}
          onClick={() => void navigate({ to: "/campagnes" })}
        />
        <KpiCard
          label={t("dashboard.tester.active_campaigns")}
          value={activeCampaigns}
          tone="info"
          hint={t("pages.campaigns.in_progress_hint")}
          onClick={() => void navigate({ to: "/campagnes" })}
        />
        <KpiCard
          label={t("dashboard.tester.my_test_cases")}
          value={todoTests.length}
          tone={todoTests.length ? "warning" : "success"}
          icon={<ListChecks className="size-4" />}
          hint={t("dashboard.tester.todo_hint")}
          onClick={() => document.getElementById("mes-cas-de-test")?.scrollIntoView({ behavior: "smooth" })}
        />
        <KpiCard
          label={t("dashboard.tester.my_defects")}
          value={myDefects.length}
          tone={openDefects ? "warning" : "success"}
          icon={<Bug className="size-4" />}
          hint={t("dashboard.tester.quick_actions")}
          onClick={() => void navigate({ to: "/anomalies" })}
        />
      </div>

      {/* Le travail du testeur. Sans ce panneau, un cas affecte n'etait
          atteignable qu'en passant par Campagnes puis par l'onglet du cas :
          rien ne montrait au testeur ce qu'il avait a faire. */}
      <div id="mes-cas-de-test">
        <Panel
          title={
            hasSessionRole("chef_testeur")
              ? t("dashboard.tester.cases_to_distribute")
              : t("dashboard.tester.my_test_cases")
          }
        >
          {todoTests.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("dashboard.tester.no_todo")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.id")}</TableHead>
                  <TableHead>{t("pages.campaign_detail.test")}</TableHead>
                  <TableHead>{t("nav.campagnes")}</TableHead>
                  <TableHead>{t("common.criticite")}</TableHead>
                  <TableHead>{t("common.testeur")}</TableHead>
                  <TableHead className="text-right">{t("quick_verdict.resolution_rapide")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todoTests.map((tc: TestCase) => {
                  const parent = myCampaigns.find((c) => c.id === tc.campaignId);
                  // La resolution en un clic n'a de sens que sur une campagne
                  // demarree ; sinon le testeur passe par "Executer".
                  const resolvable = parent?.status === "encours";
                  return (
                    <TableRow key={tc.id}>
                      <TableCell className="num font-medium">{tc.id}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <Link
                          to="/execution/$testId"
                          params={{ testId: tc.id }}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {tc.name}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">
                        {parent?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <CriticalityBadge level={tc.criticality} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {tc.tester ?? t("pages.campaign_detail.unassigned")}
                      </TableCell>
                      <TableCell className="text-right">
                        {resolvable ? (
                          <QuickVerdictButtons test={tc} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("pages.campaign_detail.campagne_non_demarree")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={t("dashboard.tester.my_campaigns")}
          actions={
            <Link
              to="/campagnes"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dashboard.tester.all_campaigns")}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {myCampaigns.slice(0, 5).map((c) => {
              return (
                <li key={c.id}>
                  <Link
                    to="/campagnes/$campaignId"
                    params={{ campaignId: c.id }}
                    className="-mx-4 block px-4 py-2.5 transition-colors hover:bg-subtle"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{c.name}</p>
                      <span className="text-xs text-muted-foreground">{c.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.type} · v{c.version} · {c.environment}
                    </p>
                  </Link>
                </li>
              );
            })}
            {myCampaigns.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.executive.none")}
              </li>
            )}
          </ul>
        </Panel>

        <Panel
          title={t("dashboard.tester.my_defects")}
          actions={
            <Link
              to="/anomalies"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dashboard.tester.all_defects")}
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {myDefects
              .filter((d) => d.status !== "fermee")
              .slice(0, 5)
              .map((d) => {
                return (
                  <li key={d.id}>
                    <div className="-mx-4 block px-4 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{d.title}</p>
                        <span className="text-xs text-muted-foreground">{d.severity}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.status} · {d.assignee || t("pages.dashboards.tester.unassigned")}
                      </p>
                    </div>
                  </li>
                );
              })}
            {myDefects.filter((d) => d.status !== "fermee").length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.executive.none")}
              </li>
            )}
          </ul>
        </Panel>
      </div>

      <Panel title={t("dashboard.tester.quick_actions")}>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/campagnes"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <FlaskConical className="mr-2 size-4" /> {t("dashboard.tester.view_my_campaigns")}
          </Link>
          <Link
            to="/anomalies"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Bug className="mr-2 size-4" /> {t("dashboard.tester.view_my_defects")}
          </Link>
          <Link
            to="/audit"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <History className="mr-2 size-4" /> {t("dashboard.tester.my_history")}
          </Link>
        </div>
      </Panel>
    </AppShell>
  );
}
