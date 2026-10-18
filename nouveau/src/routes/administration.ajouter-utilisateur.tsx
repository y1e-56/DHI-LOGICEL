import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { EntityForm } from "@/lib/forms/engine";
import { userForm } from "@/lib/forms/user-form";
import { useI18n } from "@/lib/i18n";
import { hasSessionRole } from "@/lib/role-protection";

export const Route = createFileRoute("/administration/ajouter-utilisateur")({
  // Pas de rendu serveur : la session vit dans le navigateur (localStorage).
  // Rendue cote serveur, la page voyait toujours « non connecte » et le
  // controle d'acces ne se refaisait pas ensuite dans le navigateur.
  ssr: false,
  beforeLoad: () => {
    if (!hasSessionRole("admin")) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [{ title: "Ajouter un utilisateur — DHI Quality Platform" }],
  }),
  component: AddUserPage,
});

function AddUserPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const goToAdministration = () => void navigate({ to: "/administration" });

  return (
    <AppShell
      title={t("pages.add_user.title")}
      subtitle={t("pages.add_user.subtitle")}
      breadcrumb={t("pages.add_user.breadcrumb")}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="-ml-12 mb-6 sm:-ml-16 xl:-ml-20">
          <Button variant="outline" size="sm" onClick={goToAdministration} className="gap-2">
            <ArrowLeft className="size-4" />
            {t("pages.add_user.back_to_admin")}
          </Button>
        </div>

        <EntityForm
          schema={userForm}
          mode="create"
          onCancel={goToAdministration}
          onSaved={goToAdministration}
        />
      </div>
    </AppShell>
  );
}
