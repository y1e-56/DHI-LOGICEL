import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { featureForm } from "@/lib/forms/feature-form";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/fonctionnalites/ajouter")({
  head: () => ({
    meta: [{ title: "Créer une fonctionnalité — DHI Quality Platform" }],
  }),
  component: CreateFeaturePage,
});

function CreateFeaturePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const goToFeatures = () => void navigate({ to: "/fonctionnalites" });

  return (
    <AppShell
      title={t("pages.features.title")}
      subtitle={t("pages.features.subtitle")}
      breadcrumb={[t("nav.qualite"), t("nav.fonctionnalites")]}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goToFeatures} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("nav.fonctionnalites")}
          </Button>
        </div>

        <EntityForm
          schema={featureForm}
          mode="create"
          onCancel={goToFeatures}
          onSaved={goToFeatures}
        />
      </div>
    </AppShell>
  );
}
