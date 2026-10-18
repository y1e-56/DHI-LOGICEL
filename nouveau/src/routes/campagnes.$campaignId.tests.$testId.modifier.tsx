import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { testForm } from "@/lib/forms/test-form";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { getUser, campaignVisibleTo } from "@/lib/access";
import { CampaignAccessDenied } from "@/components/dhi/AccessDenied";
import { canManageCampaign } from "@/lib/role-protection";
import { campaigns as seedCampaigns, testCases as seedTests } from "@/lib/dhi-data";
import { campaignTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/campagnes/$campaignId/tests/$testId/modifier")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const campaigns = snapshot?.campaigns ?? seedCampaigns;
    const tests = snapshot?.tests ?? seedTests;
    const c = campaigns.find((x) => x.id === params.campaignId);
    const test = tests.find((x) => x.id === params.testId);
    return { name: test?.name ?? "Test" };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Modifier ${loaderData?.name ?? "le test"} — DHI Quality Platform`,
      },
    ],
  }),
  component: EditTestPage,
});

function EditTestPage() {
  const { campaignId, testId } = Route.useParams();
  const store = useStore();
  const { campaigns, tests, products } = store;
  const { t } = useI18n();
  const navigate = useNavigate();
  const campaign = campaigns.find((c) => c.id === campaignId);
  const test = tests.find((x) => x.id === testId);

  const goToCampaign = () => {
    if (campaign)
      void navigate({ to: "/campagnes/$campaignId", params: { campaignId: campaign.id } });
  };

  if (campaign && !campaignVisibleTo(campaign, products, getUser())) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (campaign && !canManageCampaign()) {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (campaign?.status === "terminee") {
    return <CampaignAccessDenied subject={campaign.name} />;
  }
  if (!campaign || !test) return null;

  return (
    <AppShell
      title={`${t("common.campagne")} : ${campaign.name}`}
      subtitle={`${t("pages.campaign_detail.modifier_cas_test")} ${test.id}`}
      breadcrumb={[t("nav.execution"), t("pages.campaigns.campaigns"), campaign.name]}
      tabs={campaignTabs(campaignId)}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goToCampaign} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("pages.campaigns.campaigns")}
          </Button>
        </div>

        <EntityForm
          schema={testForm(campaignId)}
          mode="update"
          id={test.id}
          entity={test}
          onCancel={goToCampaign}
          onSaved={goToCampaign}
        />
      </div>
    </AppShell>
  );
}
