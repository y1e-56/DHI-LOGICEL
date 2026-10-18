import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { campaignForm } from "@/lib/forms/campaign-form";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/campagnes/ajouter")({
  // Contexte d'entree optionnel : creation depuis une fiche produit
  // (`?productId=`) ou depuis une fiche projet (`?projectId=`) fige le champ
  // correspondant dans le formulaire.
  validateSearch: z.object({
    productId: z.string().optional(),
    projectId: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Créer une campagne — DHI Quality Platform" },
      {
        name: "description",
        content: "Créer une nouvelle campagne de tests.",
      },
    ],
  }),
  component: CreateCampaignPage,
});

function CreateCampaignPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { productId, projectId } = Route.useSearch();
  const seed = {
    ...(productId ? { productId } : {}),
    ...(projectId ? { projectId } : {}),
  };
  const goToCampaigns = () => void navigate({ to: "/campagnes" });

  return (
    <AppShell
      title={t("pages.add_campaign.title")}
      subtitle={t("pages.add_campaign.subtitle")}
      breadcrumb={[
        t("nav.execution"),
        t("nav.campagnes"),
        t("pages.add_campaign.breadcrumb_create"),
      ]}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goToCampaigns} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("pages.add_campaign.back_to_campaigns")}
          </Button>
        </div>

        <EntityForm
          schema={campaignForm}
          mode="create"
          seed={seed}
          onCancel={goToCampaigns}
          onSaved={(saved) => {
            if (saved) {
              void navigate({ to: "/campagnes/$campaignId", params: { campaignId: saved } });
            } else {
              goToCampaigns();
            }
          }}
        />
      </div>
    </AppShell>
  );
}
