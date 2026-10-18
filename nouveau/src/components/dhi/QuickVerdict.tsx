import { CheckCircle2, Paperclip, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";
import type { TestCase } from "@/lib/dhi-data";

/**
 * Resolution en un clic d'un cas de test.
 *
 * "Valide" enregistre directement. "Non valide" ouvre une modale qui exige le
 * comportement observe et au moins une preuve : un echec sans justificatif
 * n'est pas verifiable a la recette, et l'anomalie qui en decoule ne serait
 * defendable par personne.
 *
 * partage entre la liste des cas d'une campagne et le tableau de bord du
 * testeur, pour que la resolution soit accessible depuis les deux.
 */
export function QuickVerdictButtons({
  test,
  onResolved,
  size = "sm",
}: {
  test: TestCase;
  onResolved?: () => void;
  size?: "sm" | "default";
}) {
  const { t } = useI18n();
  const { recordTestVerdict } = useStore();
  const [busy, setBusy] = useState(false);
  const [failing, setFailing] = useState(false);
  const [observed, setObserved] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const reportError = (error: unknown) => {
    toast.error(
      t("quick_verdict.enregistrement_echoue").replace(
        "{message}",
        error instanceof Error ? error.message : "—",
      ),
    );
  };

  const markValid = async () => {
    setBusy(true);
    try {
      await recordTestVerdict(test.id, "PASS");
      toast.success(t("quick_verdict.cas_valide").replace("{id}", test.id));
      onResolved?.();
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  };

  const submitFail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!observed.trim()) {
      toast.error(t("quick_verdict.observation_requise"));
      return;
    }
    if (files.length === 0) {
      toast.error(t("quick_verdict.preuve_requise"));
      return;
    }
    setBusy(true);
    try {
      await recordTestVerdict(test.id, "FAIL", {
        observed: observed.trim(),
        comment: observed.trim(),
        files,
      });
      setFailing(false);
      setObserved("");
      setFiles([]);
      toast.success(t("quick_verdict.cas_non_valide").replace("{id}", test.id));
      onResolved?.();
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          size={size}
          variant="outline"
          disabled={busy}
          onClick={() => void markValid()}
          title={t("quick_verdict.valider_au_clic")}
        >
          <CheckCircle2 className="text-success" />
          {t("quick_verdict.marquer_valide")}
        </Button>
        <Button
          size={size}
          variant="outline"
          disabled={busy}
          onClick={() => setFailing(true)}
          title={t("quick_verdict.non_valide_renseigne")}
        >
          <XCircle className="text-destructive" />
          {t("quick_verdict.marquer_non_valide")}
        </Button>
      </div>

      <Dialog
        open={failing}
        onOpenChange={(open) => {
          if (!open) setFailing(false);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("quick_verdict.non_valide_titre").replace("{id}", test.id)}
            </DialogTitle>
            <DialogDescription>{t("quick_verdict.non_valide_description")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitFail} className="grid gap-4">
            <div>
              <Label htmlFor={`observed-${test.id}`}>{t("quick_verdict.observation")}</Label>
              <Textarea
                id={`observed-${test.id}`}
                rows={4}
                className="mt-1.5"
                value={observed}
                onChange={(event) => setObserved(event.target.value)}
                placeholder={t("quick_verdict.observation_placeholder")}
              />
            </div>
            <div>
              <Label htmlFor={`proofs-${test.id}`}>{t("quick_verdict.preuves")}</Label>
              <input
                id={`proofs-${test.id}`}
                ref={fileInput}
                type="file"
                multiple
                accept="image/*,video/*,.log,.txt,.json,.csv"
                className="hidden"
                onChange={(event) => {
                  setFiles(Array.from(event.target.files ?? []));
                  // Reset pour pouvoir reselectionner le meme fichier ensuite.
                  event.target.value = "";
                }}
              />
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInput.current?.click()}
                >
                  <Paperclip />
                  {t("quick_verdict.ajouter_preuves")}
                </Button>
                {files.length > 0 ? (
                  <ul className="min-w-0 space-y-0.5 text-xs text-muted-foreground">
                    {files.map((file) => (
                      <li key={file.name} className="truncate">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFailing(false)} disabled={busy}>
                {t("actions.annuler")}
              </Button>
              <Button type="submit" variant="destructive" disabled={busy}>
                {t("quick_verdict.enregistrer_non_valide")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
