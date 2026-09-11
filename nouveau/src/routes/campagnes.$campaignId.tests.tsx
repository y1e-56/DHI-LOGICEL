import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, VerdictBadge } from "@/components/dhi/indicators";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { campaigns as seedCampaigns } from "@/lib/dhi-data";
import { campaignTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { api, mapBackendTestCase, type BackendTestCase, type BackendTestExecution } from "@/lib/api";
import type { TestCase } from "@/lib/dhi-data";

export const Route = createFileRoute("/campagnes/$campaignId/tests")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const campaigns = snapshot?.campaigns ?? seedCampaigns;
    const campaign = campaigns.find((item) => item.id === params.campaignId);
    return { name: campaign?.name ?? "Campagne" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Cas de test · ${loaderData?.name ?? "Campagne"} — DHI Quality Platform` }],
  }),
  component: CampaignTests,
});

function CampaignTests() {
  const { campaignId } = Route.useParams();
  const matches = useMatches();
  const { t } = useI18n();
  const { campaigns, tests } = useStore();
  const [backendTests, setBackendTests] = useState<TestCase[] | null>(null);
  const [search, setSearch] = useState("");
  const exact = matches[matches.length - 1]?.pathname === `/campagnes/${campaignId}/tests`;
  if (!exact) return <Outlet />;

  const campaign = campaigns.find((item) => item.id === campaignId);

  useEffect(() => {
    if (!localStorage.getItem("token") || !/^\d+$/.test(campaignId)) return;
    void Promise.all([
      api<BackendTestCase[]>(`/test-cases?campaignId=${campaignId}`),
      api<{ data: BackendTestExecution[] }>(`/test-executions?campaignId=${campaignId}&limit=200`),
    ])
      .then(([items, executionPage]) => {
        const latestExecution = new Map<number, BackendTestExecution>();
        for (const execution of executionPage.data) {
          if (!latestExecution.has(execution.test_case_id)) {
            latestExecution.set(execution.test_case_id, execution);
          }
        }
        setBackendTests(items.map((item) => mapBackendTestCase(item, latestExecution.get(item.id))));
      })
      .catch((error) => console.error("[CampaignTests] Impossible de charger les cas de test", error));
  }, [campaignId]);

  const availableTests = backendTests ?? tests;
  const rows = useMemo(() => {
    const executed = availableTests
      .filter((test) => test.campaignId === campaignId && (backendTests ? true : test.executedAt))
      .sort((a, b) => (Date.parse(b.executedAt ?? "") || 0) - (Date.parse(a.executedAt ?? "") || 0))
      .slice(0, 10);
    const query = search.trim().toLowerCase();
    return query
      ? executed.filter((test) => test.id.toLowerCase().includes(query) || test.name.toLowerCase().includes(query))
      : executed;
  }, [availableTests, campaignId, search]);

  return (
    <AppShell
      title={campaign?.name ?? t("nav.campaign_tests")}
      subtitle={t("nav.campaign_tests")}
      breadcrumb={[t("nav.execution"), t("nav.campagnes"), campaign?.name ?? "", t("nav.campaign_tests")]}
      tabs={campaignTabs(campaignId)}
    >
      <div className="panel">
        <div className="border-b border-border px-4 py-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("pages.campaign_detail.rechercher_cas_test")} className="pl-8" />
          </div>
        </div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("common.id")}</TableHead><TableHead>{t("pages.campaign_detail.test")}</TableHead>
            <TableHead>{t("common.criticite")}</TableHead><TableHead>{t("common.type")}</TableHead>
            <TableHead>{t("common.verdict")}</TableHead><TableHead>{t("common.testeur")}</TableHead>
            <TableHead className="text-right">{t("pages.campaign_detail.execution")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((test) => (
              <TableRow key={test.id}>
                <TableCell className="num font-medium">{test.id}</TableCell><TableCell className="max-w-xs truncate">{test.name}</TableCell>
                <TableCell><CriticalityBadge level={test.criticality} /></TableCell><TableCell className="text-sm capitalize">{test.type.replace(/_/g, " ")}</TableCell>
                <TableCell><VerdictBadge verdict={test.verdict} /></TableCell><TableCell className="text-sm">{test.tester ?? "—"}</TableCell>
                <TableCell className="text-right">{campaign?.status === "terminee" ? <span className="text-xs text-muted-foreground">{t("pages.campaign_detail.campagne_verrouillee")}</span> : <Link to="/execution/$testId" params={{ testId: test.id }} className="text-xs font-medium text-primary hover:underline">{t("pages.campaign_detail.executer")}</Link>}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">{t("pages.product_detail.no_campaigns_for_product")}</TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}

