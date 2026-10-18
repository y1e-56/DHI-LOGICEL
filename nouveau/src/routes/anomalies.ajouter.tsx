import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AccessDenied } from "@/components/dhi/AccessDenied";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { defectForm } from "@/lib/forms/defect-form";
import { useI18n } from "@/lib/i18n";
import { canReportAnomaly } from "@/lib/role-protection";

export const Route = createFileRoute("/anomalies/ajouter")({
  head: () => ({
    meta: [{ title: "Créer une anomalie — DHI Quality Platform" }],
  }),
  component: CreateDefectPage,
});

function CreateDefectPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const goToDefects = () => void navigate({ to: "/anomalies" });

  // Developpeur, lecteur… : le backend refuserait la creation, inutile
  // d'afficher le formulaire.
  if (!canReportAnomaly()) return <AccessDenied subject={t("nav.anomalies")} />;

  return (
    <AppShell
      title={t("pages.anomalies.title")}
      subtitle={t("pages.anomalies.subtitle")}
      breadcrumb={[t("nav.systeme"), t("nav.anomalies"), t("pages.anomalies.breadcrumb_new")]}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goToDefects} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("nav.anomalies")}
          </Button>
        </div>

        <EntityForm
          schema={defectForm}
          mode="create"
          onCancel={goToDefects}
          onSaved={goToDefects}
        />
      </div>
    </AppShell>
  );
}
