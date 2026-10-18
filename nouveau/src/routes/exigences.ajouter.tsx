import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { requirementForm } from "@/lib/forms/requirement-form";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/exigences/ajouter")({
  head: () => ({
    meta: [{ title: "Créer une exigence — DHI Quality Platform" }],
  }),
  component: CreateRequirementPage,
});

function CreateRequirementPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const goToRequirements = () => void navigate({ to: "/exigences" });

  return (
    <AppShell
      title={t("pages.requirements.title")}
      subtitle={t("pages.requirements.subtitle")}
      breadcrumb={t("pages.requirements.breadcrumb")}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goToRequirements} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("nav.exigences")}
          </Button>
        </div>

        <EntityForm
          schema={requirementForm}
          mode="create"
          onCancel={goToRequirements}
          onSaved={goToRequirements}
        />
      </div>
    </AppShell>
  );
}
