import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { QualityBar, StatusBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { campaignStats, loadSnapshot, useStore } from "@/lib/dhi-store";
import { isInteractiveClick } from "@/lib/clickable-row";
import { projects as seedProjects } from "@/lib/dhi-data";
import { projectTabs } from "@/lib/dhi-nav";
import { canCreateCampaign } from "@/lib/role-protection";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/projets/$projectId/campagnes")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const projects = snapshot?.projects ?? seedProjects;
    const pr = projects.find((x) => x.id === params.projectId);
    return { name: pr?.name ?? "Projet" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Campagnes · ${loaderData?.name ?? "Projet"} — DHI Quality Platform` }],
  }),
  component: ProjectCampaigns,
});

function ProjectCampaigns() {
  const { projectId } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { projects, campaigns, tests } = useStore();
  const project = projects.find((p) => p.id === projectId);

  const rows = campaigns.filter((c) => c.projectId === projectId);

  return (
    <AppShell
      title={project?.name ?? t("nav.project_campaigns")}
      subtitle={t("nav.project_campaigns")}
      breadcrumb={[
        t("nav.qualite"),
        t("nav.projets"),
        project?.name ?? "",
        t("nav.project_campaigns"),
      ]}
      tabs={projectTabs(projectId)}
      actions={
        canCreateCampaign() ? (
          <Link to="/campagnes/ajouter" search={{ projectId }}>
            <Button size="sm">
              <Plus className="size-4" /> {t("pages.campaigns.new_campaign")}
            </Button>
          </Link>
        ) : undefined
      }
    >
      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.campagne")}</TableHead>
              <TableHead>{t("common.version")}</TableHead>
              <TableHead>{t("common.etat")}</TableHead>
              <TableHead>{t("pages.campaigns.progress")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => {
              const st = campaignStats(tests, c.id);
              return (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    if (isInteractiveClick(e)) return;
                    void navigate({ to: "/campagnes/$campaignId", params: { campaignId: c.id } });
                  }}
                >
                  <TableCell>
                    <Link
                      to="/campagnes/$campaignId"
                      params={{ campaignId: c.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="num">{c.version}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <QualityBar value={st.executionRate} neutral />
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {t("pages.project_detail.no_campaigns")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
