import type { Campaign, TestCase } from "@/lib/dhi-data";

/**
 * Avancement d'un projet : taux d'exécution des tests applicables
 * (hors NOT_APPLICABLE) des campagnes rattachées au projet.
 *
 * Source de vérité unique du calcul — l'ancien champ manuel `Project.progress`
 * n'était jamais persisté par le backend et affichait donc 0 % partout.
 * Cohérent avec le taux d'exécution affiché sur les lignes de campagne.
 */
export function projectProgress(
  tests: TestCase[],
  campaigns: Campaign[],
  projectId: string,
): number {
  const campaignIds = new Set(campaigns.filter((c) => c.projectId === projectId).map((c) => c.id));
  const applicable = tests.filter(
    (t) => campaignIds.has(t.campaignId) && t.verdict !== "NOT_APPLICABLE",
  );
  if (applicable.length === 0) return 0;
  const executed = applicable.filter((t) => t.verdict !== "NOT_RUN").length;
  return Math.round((executed / applicable.length) * 100);
}
