import { summarizeCoverage } from "@/lib/coverage";
import type { Feature, ReferentialRule, TestCase } from "@/lib/dhi-data";
import { evaluateRule, type RuleVerdict } from "@/lib/rules";

/**
 * Cloture d'une campagne : miroir de campaignRates / assertCampaignCanClose
 * (backend/services/workflowGuard.js). L'interface annonce ce que le serveur
 * decidera : refus si une regle bloquante n'est pas respectee, confirmation
 * si une regle en avertissement ne l'est pas ou si des anomalies sont ouvertes.
 */

const round1 = (x: number) => Math.round(x * 10) / 10;

export type CampaignRates = {
  total: number;
  executed: number;
  passed: number;
  /** cas executes / total ; null sans cas */
  executionRate: number | null;
  /** cas reussis / cas executes applicables ; null si aucun */
  successRate: number | null;
};

export function campaignRatesOf(list: TestCase[]): CampaignRates {
  let executed = 0;
  let skipped = 0;
  let passed = 0;
  for (const tc of list) {
    if (tc.verdict === "NOT_RUN") continue;
    executed += 1;
    if (tc.verdict === "NOT_APPLICABLE") skipped += 1;
    else if (tc.verdict === "PASS" || tc.verdict === "PASS_WITH_RESERVATION") passed += 1;
  }
  const applicable = executed - skipped;
  return {
    total: list.length,
    executed,
    passed,
    executionRate: list.length ? round1((executed / list.length) * 100) : null,
    successRate: applicable ? round1((passed / applicable) * 100) : null,
  };
}

export type CloseCheck = {
  rates: CampaignRates;
  /** Regles bloquantes non respectees : la cloture est refusee. */
  refused: RuleVerdict[];
  /** Raisons de demander une confirmation (regles en avertissement, anomalies). */
  warnings: string[];
};

/** Taux de couverture des types requis, arrondi comme cote serveur ; null sans type requis. */
function coverageRate(features: Feature[], list: TestCase[]): number | null {
  const { required, covered } = summarizeCoverage(features, list);
  return required ? round1((covered / required) * 100) : null;
}

/**
 * RG-6 sur la couverture globale des fonctionnalites de la campagne, RG-7 sur
 * chaque fonctionnalite critique (miroir de coverageVerdicts cote serveur).
 */
export function campaignCoverageVerdicts(
  features: Feature[],
  list: TestCase[],
  rules: ReferentialRule[],
): RuleVerdict[] {
  const rule = (id: string) => rules.find((r) => r.id === id);
  const globalRate = coverageRate(features, list);
  const verdicts = [globalRate === null ? null : evaluateRule(rule("RG-6"), globalRate)];
  const rg7 = rule("RG-7");
  for (const feature of features.filter((f) => f.criticality === "critique")) {
    const rate = coverageRate([feature], list);
    if (rate === null || !rg7) continue;
    verdicts.push(evaluateRule({ ...rg7, label: `${rg7.label} « ${feature.name} »` }, rate));
  }
  return verdicts.filter((v): v is RuleVerdict => v !== null);
}

export function campaignCloseCheck(
  list: TestCase[],
  openAnomalies: number,
  rules: ReferentialRule[],
  features: Feature[] = [],
): CloseCheck {
  const rates = campaignRatesOf(list);
  const rule = (id: string) => rules.find((r) => r.id === id);
  const verdicts = [
    rates.executionRate === null ? null : evaluateRule(rule("RG-4"), rates.executionRate),
    rates.successRate === null ? null : evaluateRule(rule("RG-5"), rates.successRate),
    ...campaignCoverageVerdicts(features, list, rules),
  ].filter((v): v is RuleVerdict => v !== null);
  const failing = verdicts.filter((v) => !v.ok);
  const warnings = failing.filter((v) => v.mode === "warning").map((v) => v.message);
  if (openAnomalies > 0) warnings.push(`${openAnomalies} anomalie(s) non validée(s)`);
  return { rates, refused: failing.filter((v) => v.mode === "blocking"), warnings };
}
