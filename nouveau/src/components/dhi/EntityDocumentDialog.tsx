import * as React from "react";
import { FileText } from "lucide-react";

import { EvidenceDownloadButton } from "@/components/dhi/EvidenceDownloadButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

export type EntityDocumentInfo = {
  id: string;
  name: string;
  typeLabel: string;
  fileName?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  content?: string;
};

/**
 * Fiche detail d'un document rattache a une entite (produit, projet, campagne,
 * fonctionnalite). Les documents n'ont pas de route dediee : l'ouverture se fait
 * dans une modale, avec le telechargement et d'eventuelles actions supplementaires.
 */
export function EntityDocumentDialog({
  doc,
  open,
  onOpenChange,
  extraActions,
}: {
  doc: EntityDocumentInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraActions?: React.ReactNode;
}) {
  const { t } = useI18n();
  if (!doc) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">{doc.name}</span>
          </DialogTitle>
          <DialogDescription>{doc.typeLabel}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{t("pages.documents.file")}</dt>
          <dd className="truncate">{doc.fileName ?? "—"}</dd>
          <dt className="text-muted-foreground">{t("pages.documents.uploaded_by")}</dt>
          <dd>{doc.uploadedBy ?? "—"}</dd>
          <dt className="text-muted-foreground">{t("pages.documents.uploaded_at")}</dt>
          <dd className="num">{doc.uploadedAt ?? "—"}</dd>
        </dl>
        {doc.content ? <p className="text-sm text-muted-foreground">{doc.content}</p> : null}
        <DialogFooter className="gap-2">
          {extraActions}
          <EvidenceDownloadButton id={doc.id} fileName={doc.fileName ?? ""} />
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("actions.fermer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
