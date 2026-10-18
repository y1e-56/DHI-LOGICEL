import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { EvidenceThumbnails } from "@/components/dhi/EvidenceThumbnails";
import { ScreenshotPicker } from "@/components/dhi/ScreenshotPicker";
import { DefectStatusBadge, SeverityBadge } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Separator } from "@/components/ui/separator";
import {
  DEFECT_STATUS_LABEL,
  DEFECT_TRANSITIONS,
  defects as seedDefects,
  type DefectStatus,
} from "@/lib/dhi-data";

import { useI18n } from "@/lib/i18n";
import { api, uploadEvidence } from "@/lib/api";
import { canResolveAnomaly, canValidateAnomaly } from "@/lib/role-protection";
import { loadSnapshot, useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/anomalies/$defectId")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const defects = snapshot?.defects ?? seedDefects;
    const d = defects.find((x) => x.id === params.defectId);
    if (!d) throw notFound();
    return { title: d.title };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Anomalie"} — DHI Quality Platform` },
      {
        name: "description",
        content: "Détail d'une anomalie : gravité, statut, affectation et capitalisation.",
      },
    ],
  }),
  component: DefectDetailPage,
});

function DefectDetailPage() {
  const { defectId } = Route.useParams();
  const { t } = useI18n();
  const { defects, features, users, tests, campaigns, updateDefect } = useStore();
  const defect = defects.find((d) => d.id === defectId);
  if (!defect) return null;
  const linkedTest = defect.testId ? tests.find((test) => test.id === defect.testId) : undefined;
  const linkedCampaign = defect.campaignId
    ? campaigns.find((campaign) => campaign.id === defect.campaignId)
    : undefined;
  const fallbackCampaign =
    linkedCampaign ??
    (linkedTest ? campaigns.find((campaign) => campaign.id === linkedTest.campaignId) : undefined);
  // Id hébergé en base : les preuves nécessitent un serveur et un jeton.
  const backendId = /^\d+$/.test(defect.id) ? Number(defect.id) : null;

  /** Captures justifiant l'anomalie ou confirmant une correction en attente d'envoi. */
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [serverProofCount, setServerProofCount] = useState(0);
  const [savingProof, setSavingProof] = useState(false);
  const [evidenceRefresh, setEvidenceRefresh] = useState(0);
  const [pickerKey, setPickerKey] = useState(0);
  const captureLabels = {
    add: t("pages.anomalies.add_capture"),
    count: t("pages.anomalies.captures_count"),
    remove: t("pages.anomalies.remove_capture"),
    imageOnly: t("pages.anomalies.images_only"),
    nonImageIgnored: t("pages.anomalies.non_image_ignored"),
    tooBig: t("pages.anomalies.capture_too_big"),
    maxReached: t("pages.anomalies.max_captures"),
  };

  const saveProof = async () => {
    if (!backendId || proofFiles.length === 0) return;
    if (!localStorage.getItem("token")) {
      toast.error(t("pages.anomalies.login_required_for_captures"));
      return;
    }
    setSavingProof(true);
    try {
      const results = await Promise.allSettled(
        proofFiles.map((file) =>
          uploadEvidence(
            "anomaly",
            String(backendId),
            file,
            JSON.stringify({ name: file.name, type: "capture" }),
          ),
        ),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        console.error(
          `[DHI] ${failed}/${proofFiles.length} capture(s) d'anomalie non enregistrée(s)`,
        );
      }
      setProofFiles([]);
      setPickerKey((k) => k + 1);
      setEvidenceRefresh((n) => n + 1);
      toast.success(t("pages.anomalies.evidence_saved"));
    } finally {
      setSavingProof(false);
    }
  };
  const universe = users.filter((u) => u.active).map((u) => u.name);
  const devs = users
    .filter((u) => u.active && (u.roles ?? [u.role]).includes("developpeur"))
    .map((u) => u.name);

  const reassign = (v: string) => {
    updateDefect(defect.id, { assignee: v });
    toast.success(`${defect.id} ${t("pages.anomalies.reassigned")} ${v}.`);
  };

  const setDeveloper = (v: string) => {
    updateDefect(defect.id, { developer: v });
    toast.success(`${defect.id} ${t("pages.anomalies.assigned_to_developer")} ${v}.`);
  };

  const changeStatus = async (v: DefectStatus) => {
    // Signaler la résolution exige une preuve (capture confirmant la
    // correction), conformément au processus d'anomalie.
    if (v === "a_retester") {
      if (!backendId) {
        if (proofFiles.length === 0) {
          toast.error(t("pages.anomalies.fix_requires_captures"));
          return;
        }
      } else {
        const totalProofs = serverProofCount + proofFiles.length;
        if (totalProofs === 0) {
          toast.error(t("pages.anomalies.fix_requires_captures"));
          return;
        }
        if (proofFiles.length > 0) {
          if (!localStorage.getItem("token")) {
            toast.error(t("pages.anomalies.login_required_for_captures"));
            return;
          }
          let uploaded = true;
          setSavingProof(true);
          try {
            const results = await Promise.allSettled(
              proofFiles.map((file) =>
                uploadEvidence(
                  "anomaly",
                  String(backendId),
                  file,
                  JSON.stringify({ name: file.name, type: "capture" }),
                ),
              ),
            );
            uploaded = results.every((r) => r.status === "fulfilled");
          } finally {
            setSavingProof(false);
          }
          if (!uploaded) {
            toast.error(t("pages.anomalies.fix_requires_captures"));
            return;
          }
          setProofFiles([]);
          setPickerKey((k) => k + 1);
          setEvidenceRefresh((n) => n + 1);
        }
      }
    }
    updateDefect(defect.id, { status: v });
    toast.success(`${t("pages.anomalies.status_updated")} : ${DEFECT_STATUS_LABEL[v]}.`);
    if (!/^\d+$/.test(defect.id) || !localStorage.getItem("token")) return;
    try {
      if (v === "a_retester") {
        await api(`/anomalies/${defect.id}/signal-resolution`, {
          method: "PATCH",
          body: JSON.stringify({ resolution_description: defect.title }),
        });
      } else if (v === "fermee") {
        await api(`/anomalies/${defect.id}/validate`, { method: "PATCH" });
      } else if (v === "reouverte") {
        await api(`/anomalies/${defect.id}/reject`, { method: "PATCH" });
      } else {
        const backendStatus = {
          nouvelle: "new",
          encorrection: "in_progress",
          a_retester: "resolution_signaled",
          fermee: "validated",
          reouverte: "rejected",
        }[v];
        if (backendStatus) {
          await api(`/anomalies/${defect.id}`, {
            method: "PUT",
            body: JSON.stringify({ status: backendStatus }),
          });
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("pages.anomalies.status_updated"));
    }
  };

  // Le développeur fait avancer l'anomalie vers la résolution (correction puis
  // « à retester ») ; le testeur tranche ensuite (valider / réouvrir). Chacun ne
  // voit que les cibles qui relèvent de son rôle, et l'affectation reste gérée
  // par les rôles qui pilotent (le développeur ne se réassigne pas tout seul).
  const canResolve = canResolveAnomaly();
  const canValidate = canValidateAnomaly();
  const canAssign = canValidate;
  const allowedNext = DEFECT_TRANSITIONS[defect.status] ?? [];
  const resolveTargets = canResolve
    ? allowedNext.filter((s) => s !== "fermee" && s !== "reouverte")
    : [];
  const validateTargets = canValidate
    ? allowedNext.filter((s) => s === "fermee" || s === "reouverte")
    : [];
  const allowedForUser = [...resolveTargets, ...validateTargets];
  const canChangeStatus = allowedForUser.length > 0;

  return (
    <AppShell
      title={`${defect.id} : ${defect.title}`}
      subtitle={t("pages.anomalies.subtitle")}
      breadcrumb={[t("nav.systeme"), t("nav.anomalies"), defect.id]}
      backTo={{ to: "/anomalies" }}
    >
      <div className="panel p-6 pl-12 sm:p-8 sm:pl-16 xl:pl-20">
        <div className="flex flex-wrap gap-2">
          <SeverityBadge level={defect.severity} />
          <DefectStatusBadge status={defect.status} />
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
            {features.find((f) => f.id === defect.featureId)?.name ?? defect.featureId}
          </span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("pages.anomalies.detail_detected_by")} {defect.reporter}{" "}
          {t("pages.anomalies.detail_detected_on")} {defect.createdAt} · {t("common.version")}{" "}
          {defect.version}
          {defect.testId ? ` · ${t("pages.anomalies.detail_test")} ${defect.testId}` : ""}
        </p>
        {fallbackCampaign ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("common.campagne")} :{" "}
            <Link
              to="/campagnes/$campaignId"
              params={{ campaignId: fallbackCampaign.id }}
              className="font-medium text-primary hover:underline"
            >
              {fallbackCampaign.name}
            </Link>
          </p>
        ) : null}
        <Separator className="my-4" />
        <p className="text-sm text-muted-foreground">{defect.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel grid gap-1.5">
          <Label>{t("pages.anomalies.assignee")}</Label>
          {canAssign ? (
            <SearchableSelect
              value={defect.assignee}
              onValueChange={reassign}
              options={universe.map((p) => ({ value: p, label: p }))}
            />
          ) : (
            <div className="flex h-9 items-center rounded-md border border-border px-3">
              <span className="text-sm font-medium">{defect.assignee}</span>
            </div>
          )}
        </div>
        <div className="panel grid gap-1.5">
          <Label>{t("pages.anomalies.developer")}</Label>
          {canAssign ? (
            <SearchableSelect
              value={defect.developer ?? ""}
              onValueChange={setDeveloper}
              options={devs.map((p) => ({ value: p, label: p }))}
              placeholder={t("pages.anomalies.developer_placeholder")}
            />
          ) : (
            <div className="flex h-9 items-center rounded-md border border-border px-3">
              <span className="text-sm font-medium">{defect.developer ?? "—"}</span>
            </div>
          )}
        </div>
        <div className="panel grid gap-1.5">
          <Label>{t("common.statut")}</Label>
          {canChangeStatus ? (
            <SearchableSelect
              value={defect.status}
              onValueChange={(v) => void changeStatus(v as DefectStatus)}
              options={allowedForUser.map((s) => ({ value: s, label: DEFECT_STATUS_LABEL[s] }))}
            />
          ) : (
            <div className="flex h-9 items-center rounded-md border border-border px-3">
              <span className="text-sm font-medium">{DEFECT_STATUS_LABEL[defect.status]}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{t("pages.anomalies.evidence_section")}</p>
            <p className="text-sm text-muted-foreground">{t("pages.anomalies.captures_hint")}</p>
          </div>
          {backendId && canResolve && proofFiles.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void saveProof()}
              disabled={savingProof}
            >
              {savingProof ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {t("pages.anomalies.save_captures")}
            </Button>
          ) : null}
        </div>
        <EvidenceThumbnails
          entityType="anomaly"
          backendId={backendId}
          refreshKey={evidenceRefresh}
          onCountChange={setServerProofCount}
        />
        {backendId && canResolve ? (
          <div className="mt-3">
            <ScreenshotPicker key={pickerKey} onChange={setProofFiles} labels={captureLabels} />
          </div>
        ) : !backendId ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("pages.anomalies.login_required_for_captures")}
          </p>
        ) : null}
      </div>

      <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
        <p className="font-medium">{t("pages.anomalies.capitalization")}</p>
        <p className="mt-1 text-muted-foreground">
          {t("pages.anomalies.regression_note")} : « {defect.title} » (version {defect.version}).
        </p>
      </div>
    </AppShell>
  );
}
