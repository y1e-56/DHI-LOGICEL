import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { featureForm } from "@/lib/forms/feature-form";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { features as seedFeatures } from "@/lib/dhi-data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/fonctionnalites/$featureId/modifier")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const features = snapshot?.features ?? seedFeatures;
    const f = features.find((x) => x.id === params.featureId);
    return { name: f?.name ?? "Fonctionnalité" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Modifier ${loaderData?.name ?? "la fonctionnalité"} — DHI Quality Platform` }],
  }),
  component: EditFeaturePage,
});

function EditFeaturePage() {
  const { featureId } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { features } = useStore();
  const feature = features.find((f) => f.id === featureId);
  const goToFeatures = () => void navigate({ to: "/fonctionnalites" });

  if (!feature) return null;

  return (
    <AppShell
      title={t("pages.features.title")}
      subtitle={t("pages.features.subtitle")}
      breadcrumb={[t("nav.qualite"), t("nav.fonctionnalites")]}
      actions={
        <Button size="sm" asChild>
          <Link to="/fonctionnalites/$featureId/documents" params={{ featureId }}>
            <FileText className="size-4" /> {t("pages.documents.feature_docs")}
          </Link>
        </Button>
      }
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
          mode="update"
          id={feature.id}
          entity={feature}
          onCancel={goToFeatures}
          onSaved={goToFeatures}
        />
      </div>
    </AppShell>
  );
}
