import { createFileRoute, redirect, Link, Outlet, useMatches } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard } from "@/components/dhi/indicators";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABEL, type AppRole, type PlatformUser } from "@/lib/dhi-data";
import { isInteractiveClick } from "@/lib/clickable-row";
import { cn } from "@/lib/utils";

import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/dhi-store";
import { hasSessionRole } from "@/lib/role-protection";

export const Route = createFileRoute("/administration")({
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
    meta: [{ title: "Administration — DHI Quality Platform" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const matches = useMatches();
  if (matches[matches.length - 1]?.pathname !== "/administration") return <Outlet />;
  return <AdminList />;
}

/** Profils d'un utilisateur, le principal en premier. */
const rolesOf = (user: PlatformUser): AppRole[] => {
  const all = user.roles && user.roles.length > 0 ? user.roles : [user.role];
  return [user.role, ...all.filter((r) => r !== user.role)];
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function UserAvatar({ user }: { user: PlatformUser }) {
  return (
    <Avatar className="size-8 border border-border">
      <AvatarFallback
        className={cn(
          "text-[11px] font-semibold",
          user.active ? "bg-primary/10 text-primary" : "bg-subtle text-muted-foreground",
        )}
      >
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function StateBadge({ active }: { active: boolean }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        active
          ? "border-success/30 bg-success-soft text-success"
          : "border-border bg-subtle text-muted-foreground",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground/60")}
      />
      {active ? t("common.actif") : t("common.inactif")}
    </span>
  );
}

function RoleBadge({ role, main }: { role: AppRole; main?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
        main
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground",
      )}
    >
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

function UserDetailDialog({
  user,
  open,
  onOpenChange,
}: {
  user: PlatformUser | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useI18n();
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <UserAvatar user={user} />
            <div className="min-w-0">
              <DialogTitle>{user.name}</DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{t("pages.administration.profile")}</dt>
          <dd className="flex flex-wrap items-center gap-1.5">
            {rolesOf(user).map((r) => (
              <RoleBadge key={r} role={r} main={r === user.role} />
            ))}
          </dd>
          <dt className="text-muted-foreground">{t("pages.administration.state")}</dt>
          <dd>
            <StateBadge active={user.active} />
          </dd>
        </dl>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("actions.fermer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type StateFilter = "all" | "active" | "inactive";

function AdminList() {
  const { t } = useI18n();
  const { users, currentUser, updateUserRole, toggleUserActive, removeUser } = useStore();
  const roles = Object.keys(ROLE_LABEL) as AppRole[];
  const [detail, setDetail] = useState<PlatformUser | null>(null);
  const [toDelete, setToDelete] = useState<PlatformUser | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");

  const activeCount = users.filter((u) => u.active).length;
  const query = search.trim().toLowerCase();
  const filteredUsers = users
    .filter((u) => {
      const userRoles = rolesOf(u);
      if (roleFilter !== "all" && !userRoles.includes(roleFilter)) return false;
      if (stateFilter === "active" && !u.active) return false;
      if (stateFilter === "inactive" && u.active) return false;
      if (!query) return true;
      const roleLabels = userRoles.map((r) => ROLE_LABEL[r] ?? r).join(" ");
      return `${u.name} ${u.email} ${roleLabels}`.toLowerCase().includes(query);
    })
    // Comptes actifs d'abord, puis ordre alphabetique.
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "fr"));

  const changeRole = async (user: PlatformUser, role: AppRole) => {
    try {
      await updateUserRole(user.id, role);
      toast.success(t("pages.administration.role_updated").replace("{name}", user.name));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("pages.administration.error"));
    }
  };

  const toggleActive = async (user: PlatformUser) => {
    try {
      await toggleUserActive(user.id);
      toast.success(
        user.active
          ? t("pages.administration.deactivated").replace("{name}", user.name)
          : t("pages.administration.reactivated").replace("{name}", user.name),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("pages.administration.error"));
    }
  };

  const confirmDelete = async () => {
    const user = toDelete;
    setToDelete(null);
    if (!user) return;
    try {
      await removeUser(user.id);
      toast.success(t("pages.administration.deleted").replace("{name}", user.name));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("pages.administration.error"));
    }
  };

  return (
    <AppShell
      title={t("pages.administration.title")}
      subtitle={t("pages.administration.subtitle")}
      breadcrumb={["Système", "Administration"]}
      actions={
        <Button size="sm" asChild>
          <Link to="/administration/ajouter-utilisateur">
            <Plus className="size-4" /> {t("pages.administration.add_user")}
          </Link>
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <KpiCard label={t("pages.administration.users")} value={users.length} />
        <KpiCard label={t("pages.administration.active")} value={activeCount} tone="success" />
        <KpiCard
          label={t("pages.administration.inactive")}
          value={users.length - activeCount}
          tone={users.length - activeCount > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-subtle px-4 py-2.5">
          <h2 className="mr-auto text-[13px] font-semibold tracking-tight">
            {t("pages.administration.accounts")}
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("pages.administration.search_placeholder")}
              className="h-8 bg-background pl-8 text-sm"
            />
          </div>
          <SearchableSelect
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as AppRole | "all")}
            options={[
              { value: "all", label: t("pages.administration.all_profiles") },
              ...roles.map((r) => ({ value: r, label: ROLE_LABEL[r] })),
            ]}
            className="h-8 w-48 bg-background text-xs"
          />
          <SearchableSelect
            value={stateFilter}
            onValueChange={(v) => setStateFilter(v as StateFilter)}
            options={[
              { value: "all", label: t("pages.administration.all_states") },
              { value: "active", label: t("pages.administration.active") },
              { value: "inactive", label: t("pages.administration.inactive") },
            ]}
            className="h-8 w-36 bg-background text-xs"
          />
          <p className="label-eyebrow whitespace-nowrap">
            {t("pages.administration.entries").replace("{count}", String(filteredUsers.length))}
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages.administration.user")}</TableHead>
                <TableHead>{t("pages.administration.main_profile")}</TableHead>
                <TableHead>{t("pages.administration.other_profiles")}</TableHead>
                <TableHead>{t("pages.administration.state")}</TableHead>
                <TableHead className="text-right">{t("pages.administration.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                const others = rolesOf(u).slice(1);
                // Son propre compte : ni desactivation ni suppression (refusees
                // par le serveur, et l'admin se couperait lui-meme l'acces).
                const isSelf = currentUser?.id === u.id;
                return (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      if (isInteractiveClick(e)) return;
                      setDetail(u);
                    }}
                  >
                    <TableCell>
                      <div className={cn("flex items-center gap-3", !u.active && "opacity-60")}>
                        <UserAvatar user={u} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <SearchableSelect
                        value={u.role}
                        onValueChange={(v) => void changeRole(u, v as AppRole)}
                        options={roles.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
                        className="h-8 w-52 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      {others.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {others.map((r) => (
                            <RoleBadge key={r} role={r} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StateBadge active={u.active} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-24"
                          disabled={isSelf}
                          title={isSelf ? t("pages.administration.self_protected") : undefined}
                          onClick={() => void toggleActive(u)}
                        >
                          {u.active
                            ? t("pages.administration.deactivate")
                            : t("pages.administration.activate")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-danger hover:bg-danger/10"
                          aria-label={`${t("pages.administration.delete")} ${u.name}`}
                          title={
                            isSelf
                              ? t("pages.administration.self_protected")
                              : `${t("pages.administration.delete")} ${u.name}`
                          }
                          disabled={isSelf}
                          onClick={() => setToDelete(u)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    {t("pages.administration.no_results")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <UserDetailDialog
        user={detail}
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
      />

      {/* Suppression d'un compte : action irreversible, toujours confirmee. */}
      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("pages.administration.delete_confirm_title").replace(
                "{name}",
                toDelete?.name ?? "",
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("pages.administration.delete_confirm_body").replace(
                "{email}",
                toDelete?.email ?? "",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.annuler")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => void confirmDelete()}
            >
              {t("pages.administration.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
