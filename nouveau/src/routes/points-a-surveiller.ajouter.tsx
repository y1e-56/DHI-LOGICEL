import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { watchPointForm } from "@/lib/forms/watchpoint-form";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/points-a-surveiller/ajouter")({
  head: () => ({
    meta: [{ title: "Créer un point à surveiller — DHI Quality Platform" }],
  }),
  component: CreateWatchPointPage,
});

function CreateWatchPointPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const goToWatchPoints = () => void navigate({ to: "/points-a-surveiller" });

  return (
    <AppShell
      title={t("pages.watchpoints.title")}
      subtitle={t("pages.watchpoints.subtitle")}
      breadcrumb={t("pages.watchpoints.breadcrumb")}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goToWatchPoints} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("pages.watchpoints.title")}
          </Button>
        </div>

        <EntityForm
          schema={watchPointForm}
          mode="create"
          onCancel={goToWatchPoints}
          onSaved={goToWatchPoints}
        />
      </div>
    </AppShell>
  );
}
