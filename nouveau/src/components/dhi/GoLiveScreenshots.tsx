import { useEffect, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { API_BASE_URL, downloadEvidence, getEvidenceByEntity } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

/**
 * Affiche les captures d'ecran rattachees a une decision Go Live.
 *
 * Les preuves sont protegees par Bearer : un <img src> ne recevrait pas le
 * jeton, donc chaque vignette passe par un blob + object URL, comme le
 * telechargement dans `downloadEvidence`.
 */
export function GoLiveScreenshots({
  backendId,
}: {
  backendId: number | null | undefined;
}) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<{ id: number; name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!backendId) return;
    let cancelled = false;
    const created: string[] = [];

    (async () => {
      setLoading(true);
      try {
        const images = (await getEvidenceByEntity("go_live_decision", backendId))
          .data.filter((e) => e.file_type?.startsWith("image/"));
        if (cancelled || images.length === 0) return;
        const loaded = await Promise.all(
          images.map(async (e) => {
            const blob = await fetchEvidenceBlob(e.id);
            return { id: e.id, name: e.file_name ?? "capture", url: blob };
          }),
        );
        if (cancelled) {
          for (const item of loaded) URL.revokeObjectURL(item.url);
          return;
        }
        for (const item of loaded) created.push(item.url);
        setUrls(loaded);
      } catch {
        // Une preuve illisible ne doit pas casser l'affichage de l'historique.
        if (!cancelled) setUrls([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [backendId]);

  if (!backendId || (!loading && urls.length === 0)) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {loading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          {urls.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void downloadEvidence(item.id, item.name)}
              title={item.name}
              className="overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80"
            >
              <img src={item.url} alt={item.name} className="size-16 object-cover" />
            </button>
          ))}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ImageOff className="size-3" />
            {t("pages.go_live.decision_screenshots")}
          </span>
        </>
      )}
    </div>
  );
}

/** Recupere une preuve en blob authentifie pour l'afficher en vignette. */
async function fetchEvidenceBlob(id: number): Promise<string> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/evidence/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("evidence blob");
  return URL.createObjectURL(await response.blob());
}
