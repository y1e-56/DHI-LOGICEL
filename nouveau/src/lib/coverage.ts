import { TEST_TYPES, type Feature, type TestCase, type TestType } from "@/lib/dhi-data";

/**
 * Couverture d'une fonctionnalite par type de test.
 *
 * Les types *requis* sont ceux coches dans la fiche de la fonctionnalite
 * (`feature.coverage`). La couverture *reelle* se deduit des cas de test :
 * aucun type n'est couvert « sur declaration ».
 *
 * - covered      requis, au moins un cas de ce type reussi
 * - at_risk      requis, des cas existent mais aucun n'est reussi
 * - missing      requis, aucun cas de test : le vrai trou de couverture
 * - extra        non requis, mais des cas existent (information, non compte)
 * - not_required non requis et aucun cas (non compte)
 */
export type CoverageState = "covered" | "at_risk" | "missing" | "extra" | "not_required";

const PASSED: TestCase["verdict"][] = ["PASS", "PASS_WITH_RESERVATION"];

export function cellState(feature: Feature, type: TestType, tests: TestCase[]): CoverageState {
  const required = !!feature.coverage[type];
  const cases = tests.filter((tc) => tc.featureId === feature.id && tc.type === type);
  if (!required) return cases.length > 0 ? "extra" : "not_required";
  if (cases.length === 0) return "missing";
  return cases.some((tc) => PASSED.includes(tc.verdict)) ? "covered" : "at_risk";
}

export type CoverageGap = { feature: Feature; type: TestType; state: "missing" | "at_risk" };

export type CoverageSummary = {
  /** Cases requises (seules comptees). */
  required: number;
  covered: number;
  /** Requises mais non couvertes (manquantes ou a risque), les manquantes d'abord. */
  gaps: CoverageGap[];
  /** Taux de couverture des cases requises, null s'il n'y en a aucune. */
  rate: number | null;
};

export function summarizeCoverage(features: Feature[], tests: TestCase[]): CoverageSummary {
  let required = 0;
  let covered = 0;
  const missing: CoverageGap[] = [];
  const atRisk: CoverageGap[] = [];
  for (const feature of features) {
    for (const { id: type } of TEST_TYPES) {
      const state = cellState(feature, type, tests);
      if (state === "covered") {
        required++;
        covered++;
      } else if (state === "missing") {
        required++;
        missing.push({ feature, type, state });
      } else if (state === "at_risk") {
        required++;
        atRisk.push({ feature, type, state });
      }
    }
  }
  return {
    required,
    covered,
    gaps: [...missing, ...atRisk],
    rate: required ? Math.round((covered / required) * 100) : null,
  };
}

/** Types requis par au moins une des fonctionnalites (colonnes utiles de la matrice). */
export function requiredTypes(features: Feature[]): TestType[] {
  return TEST_TYPES.map((t) => t.id).filter((type) => features.some((f) => !!f.coverage[type]));
}
