import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { ProjectAccessDenied } from "@/components/dhi/AccessDenied";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { projectForm } from "@/lib/forms/project-form";
import { getUser, projectVisibleTo } from "@/lib/access";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";
import { projects as seedProjects } from "@/lib/dhi-data";

export const Route = createFileRoute("/projets/$projectId/modifier")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const projects = snapshot?.projects ?? seedProjects;
    const p = projects.find((x) => x.id === params.projectId);
    return { name: p?.name ?? "Projet" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Modifier ${loaderData?.name ?? "le projet"} — DHI Quality Platform` }],
  }),
  component: EditProjectPage,
});

function EditProjectPage() {
  const { projectId } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { products, projects } = useStore();
  const project = projects.find((p) => p.id === projectId);
  const goToProjects = () => void navigate({ to: "/projets" });

  if (project && !projectVisibleTo(project, products, getUser())) {
    return <ProjectAccessDenied subject={project.name} />;
  }
  if (!project) return null;

  return (
    <AppShell
      title={t("pages.projects.title")}
      subtitle={t("pages.projects.subtitle")}
      breadcrumb={t("pages.projects.breadcrumb")}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goToProjects} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("common.projets")}
          </Button>
        </div>

        <EntityForm
          schema={projectForm}
          mode="update"
          id={project.id}
          entity={project}
          onCancel={goToProjects}
          onSaved={goToProjects}
        />
      </div>
    </AppShell>
  );
}
