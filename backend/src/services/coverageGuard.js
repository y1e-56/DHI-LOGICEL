import { AppError } from '../middleware/errorHandler.js';
import { evaluateRule } from './rulesEngine.js';

/**
 * Couverture par les regles du referentiel :
 *   RG-6  couverture globale des types de tests requis (cible, ex. ≥ 90 %)
 *   RG-7  couverture d'une fonctionnalite critique (cible, ex. 100 %)
 *
 * Meme calcul que la matrice de l'interface (nouveau/src/lib/coverage.ts) :
 * un type requis (coche dans features.coverage) est couvert si au moins un cas
 * de ce type, pour la fonctionnalite, a son dernier resultat « passed ».
 * Seuls les types requis comptent.
 *
 * Referentiel pur et testable : n'accede jamais a la base.
 */

const round1 = (x) => Math.round(x * 10) / 10;

/** Types requis d'une fonctionnalite (cases cochees de sa fiche). */
export function requiredTypesOf(feature) {
  return Object.entries(feature?.coverage ?? {})
    .filter(([, required]) => required === true)
    .map(([type]) => type);
}

/**
 * Couverture d'une fonctionnalite.
 * @param {{ id: number, coverage?: object }} feature
 * @param {{ feature_id: number, type: string, latest_result: string|null }[]} testCases
 * @returns {{ required: number, covered: number, rate: number|null }} rate null sans type requis
 */
export function featureCoverage(feature, testCases) {
  const types = requiredTypesOf(feature);
  const covered = types.filter((type) =>
    testCases.some(
      (tc) => Number(tc.feature_id) === Number(feature.id) && tc.type === type && tc.latest_result === 'passed'
    )
  ).length;
  return {
    required: types.length,
    covered,
    rate: types.length ? round1((covered / types.length) * 100) : null,
  };
}

const isCritical = (feature) => feature?.priority === 'critical';

/** Verdict RG-7 pour une fonctionnalite critique, libelle precise par son nom. */
function criticalVerdict(feature, rate, rules) {
  const rule = rules.get('RG-7');
  return evaluateRule(rule && { ...rule, label: `${rule.label} « ${feature.name} »` }, rate);
}

/**
 * Verdicts de couverture d'un ensemble de fonctionnalites (celles d'une
 * campagne) : RG-6 sur la couverture globale, RG-7 sur chaque fonctionnalite
 * critique. Une regle inactive ou un taux non calculable ne produit rien.
 */
export function coverageVerdicts(features, testCases, rules) {
  let required = 0;
  let covered = 0;
  const critical = [];
  for (const feature of features) {
    const cov = featureCoverage(feature, testCases);
    required += cov.required;
    covered += cov.covered;
    if (isCritical(feature) && cov.rate !== null) critical.push(criticalVerdict(feature, cov.rate, rules));
  }
  const globalRate = required ? round1((covered / required) * 100) : null;
  return [globalRate === null ? null : evaluateRule(rules.get('RG-6'), globalRate), ...critical].filter(Boolean);
}

/** Verdict de couverture pour declarer une fonctionnalite conforme (RG-7 si critique, sinon RG-6). */
export function featureConformityVerdict(feature, testCases, rules) {
  const { rate } = featureCoverage(feature, testCases);
  if (rate === null) return null;
  return isCritical(feature) ? criticalVerdict(feature, rate, rules) : evaluateRule(rules.get('RG-6'), rate);
}

/**
 * Conformite : une regle bloquante non respectee refuse, une regle en
 * avertissement demande une confirmation explicite.
 * @throws {AppError} 409
 */
export function assertConformityCoverage(verdict, confirmed) {
  if (!verdict || verdict.ok) return;
  if (verdict.mode === 'blocking') {
    throw new AppError(`Conformité refusée : ${verdict.message}.`, 409);
  }
  if (!confirmed) throw new AppError(`Conformité à confirmer : ${verdict.message}.`, 409);
}
