import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { EvidenceDownloadButton } from "@/components/dhi/EvidenceDownloadButton";
import {
  EntityDocumentDialog,
  type EntityDocumentInfo,
} from "@/components/dhi/EntityDocumentDialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { FEATURE_DOC_TYPE_LABEL, features as seedFeatures } from "@/lib/dhi-data";
import { useI18n } from "@/lib/i18n";
import {
  canDeleteFeatureDoc,
  canReadFeatureDoc,
  canUploadAnyFeatureDoc,
} from "@/lib/document-permissions";
import { api, mapBackendEvidence, type BackendEvidence } from "@/lib/api";
import { isInteractiveClick } from "@/lib/clickable-row";

export const Route = createFileRoute("/fonctionnalites/$featureId/documents")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const features = snapshot?.features ?? seedFeatures;
    const feat = features.find((x) => x.id === params.featureId);
    return { name: feat?.name ?? "Fonctionnalité" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Documents · ${loaderData?.name ?? "Fonctionnalité"} — DHI Quality Platform` }],
  }),
  component: FeatureDocuments,
});

function FeatureDocuments() {
  const { featureId } = Route.useParams();
  const { t } = useI18n();
  const { features, featureDocuments, deleteFeatureDocument, replaceFeatureDocuments } = useStore();
  const feature = features.find((f) => f.id === featureId);
  const [detail, setDetail] = useState<EntityDocumentInfo | null>(null);

  // Les actions du store sont recrées a chaque changement d'etat : les lire
  // via un ref evite que le chargement se redeclenche en boucle.
  const replaceRef = useRef(replaceFeatureDocuments);
  useEffect(() => {
    replaceRef.current = replaceFeatureDocuments;
  });

  // « Ajouter un document » est une route enfant de cette page : elle s'affiche
  // dans l'Outlet ci-dessous. Revenir sur la liste relance le chargement, pour
  // afficher le document qui vient d'etre envoye.
  const matches = useMatches();
  const onChildRoute = matches[matches.length - 1]?.routeId !== Route.id;

  useEffect(() => {
    if (onChildRoute) return;
    if (!localStorage.getItem("token") || !/^\d+$/.test(featureId)) return;
    let cancelled = false;
    void api<BackendEvidence[]>(`/evidence/by-entity/feature/${featureId}`)
      .then((items) => {
        if (cancelled) return;
        replaceRef.current(items.map((item) => ({ ...mapBackendEvidence(item), featureId })));
      })
      .catch((error) =>
        console.error("[Documents] Impossible de charger les documents fonctionnalité", error),
      );
    return () => {
      cancelled = true;
    };
  }, [featureId, onChildRoute]);

  if (onChildRoute) return <Outlet />;

  const docs = featureDocuments.filter((d) => d.featureId === featureId);

  return (
    <AppShell
      title={feature?.name ?? t("pages.documents.feature_docs")}
      subtitle={t("pages.documents.feature_docs")}
      breadcrumb={[
        t("nav.qualite"),
        t("nav.fonctionnalites"),
        feature?.name ?? "",
        t("pages.documents.feature_docs"),
      ]}
      actions={
        canReadFeatureDoc() && canUploadAnyFeatureDoc() ? (
          <Button size="sm" asChild>
            <Link to="/fonctionnalites/$featureId/documents/ajouter" params={{ featureId }}>
              <Plus className="size-4" /> {t("pages.documents.add_feature")}
            </Link>
          </Button>
        ) : undefined
      }
      backTo={{ to: "/fonctionnalites" }}
    >
      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("pages.documents.type")}</TableHead>
              <TableHead>{t("pages.documents.name")}</TableHead>
              <TableHead>{t("pages.documents.file")}</TableHead>
              <TableHead>{t("pages.documents.uploaded_by")}</TableHead>
              <TableHead>{t("pages.documents.uploaded_at")}</TableHead>
              <TableHead className="text-right">{t("pages.documents.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((d) => (
              <TableRow
                key={d.id}
                className="cursor-pointer"
                onClick={(e) => {
                  if (isInteractiveClick(e)) return;
                  setDetail({
                    id: d.id,
                    name: d.name,
                    typeLabel:
                      FEATURE_DOC_TYPE_LABEL[d.type as keyof typeof FEATURE_DOC_TYPE_LABEL] ??
                      d.type,
                    fileName: d.fileName,
                    uploadedBy: d.uploadedBy,
                    uploadedAt: d.uploadedAt,
                    content: d.content,
                  });
                }}
              >
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <FileText className="size-4 text-muted-foreground" />
                    {FEATURE_DOC_TYPE_LABEL[d.type as keyof typeof FEATURE_DOC_TYPE_LABEL] ??
                      d.type}
                  </span>
                  {d.content ? (
                    <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                      {d.content}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.fileName}</TableCell>
                <TableCell className="text-sm">{d.uploadedBy}</TableCell>
                <TableCell className="num text-sm">{d.uploadedAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <EvidenceDownloadButton id={d.id} fileName={d.fileName} />
                    {canDeleteFeatureDoc(d.type) ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          deleteFeatureDocument(d.id);
                          toast.success(t("pages.documents.deleted"));
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {docs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t("pages.documents.empty_feature")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <EntityDocumentDialog
        doc={detail}
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
      />
    </AppShell>
  );
}
