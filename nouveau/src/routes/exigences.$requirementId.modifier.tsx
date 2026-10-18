import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { requirementForm } from "@/lib/forms/requirement-form";
import { useStore, loadSnapshot } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";
import { requirements as seedRequirements } from "@/lib/dhi-data";

export const Route = createFileRoute("/exigences/$requirementId/modifier")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const requirements = snapshot?.requirements ?? seedRequirements;
    const r = requirements.find((x) => x.id === params.requirementId);
    return { name: r?.title ?? "Exigence" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Modifier ${loaderData?.name ?? "l'exigence"} — DHI Quality Platform` }],
  }),
  component: EditRequirementPage,
});

function EditRequirementPage() {
  const { requirementId } = Route.useParams();
  const { requirements } = useStore();
  const requirement = requirements.find((r) => r.id === requirementId);
  const { t } = useI18n();
  const navigate = useNavigate();
  const goToRequirements = () => void navigate({ to: "/exigences" });

  if (!requirement) return null;

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
          mode="update"
          id={requirement.id}
          entity={requirement}
          onCancel={goToRequirements}
          onSaved={goToRequirements}
        />
      </div>
    </AppShell>
  );
}
