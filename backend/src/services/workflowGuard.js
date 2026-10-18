import { AppError } from '../middleware/errorHandler.js';
import { EXECUTION_MANAGER_ROLES } from './separationGuard.js';

/**
 * Cohérence du cycle de vie d'une campagne de tests.
 *
 * - On n'exécute un cas et on ne déclare une anomalie que dans une campagne
 *   en cours.
 * - Un testeur n'exécute que les cas qui lui sont affectés (ou non affectés).
 * - Une fonctionnalité n'est conforme que si tous ses cas sont validés et
 *   toutes ses anomalies validées.
 * - La clôture d'une campagne suit les règles RG-4 (taux d'exécution) et RG-5
 *   (taux de succès) du référentiel : une règle bloquante non respectée refuse
 *   la clôture, une règle en avertissement (ou des anomalies encore ouvertes)
 *   demande une confirmation explicite.
 *
 * Référentiel pur et testable : n'accède jamais à la base.
 */

/** Résultats d'exécution qui valident un cas de test (`skipped` = non applicable). */
export const VALIDATED_RESULTS = ['passed', 'skipped'];

export const WORKFLOW_MESSAGES = {
  campaignNotInProgress:
    "La campagne n'est pas en cours : l'exécution des cas et la déclaration d'anomalies sont fermées.",
  notAssigned:
    "Ce cas de test est affecté à un autre testeur : seul lui, ou un responsable de la campagne, peut l'exécuter.",
  featureNotConforme: ({ notRun, failed, openAnomalies }) =>
    `La fonctionnalité ne peut pas être déclarée conforme : ${notRun} cas non exécuté(s), ` +
    `${failed} cas en échec ou bloqué(s), ${openAnomalies} anomalie(s) non validée(s).`,
  closeRefused: (reasons) => `Clôture refusée : ${reasons.join(' ; ')}.`,
  closeToConfirm: (reasons) => `Clôture à confirmer : ${reasons.join(' ; ')}.`,
  openAnomalies: (n) => `${n} anomalie(s) non validée(s)`,
  invalidFeatureStatus: 'Statut de fonctionnalité invalide.',
};

/**
 * Bilan d'un périmètre (fonctionnalité ou campagne).
 * @param {{ latest_result: string|null }[]} testCases - cas avec le résultat de leur dernière exécution
 * @param {number} openAnomalies - anomalies non validées
 */
export function summarizeOutcome(testCases, openAnomalies) {
  let notRun = 0;
  let failed = 0;
  for (const tc of testCases) {
    const result = tc.latest_result;
    if (result == null || result === 'not_run') notRun += 1;
    else if (!VALIDATED_RESULTS.includes(result)) failed += 1;
  }
  return { notRun, failed, openAnomalies };
}

const isComplete = ({ notRun, failed, openAnomalies }) =>
  notRun === 0 && failed === 0 && openAnomalies === 0;

/** @throws {AppError} 409 si la campagne n'est pas en cours */
export function assertCampaignInProgress(campaign) {
  if (campaign?.status !== 'in_progress') {
    throw new AppError(WORKFLOW_MESSAGES.campaignNotInProgress, 409);
  }
}

/**
 * Un testeur simple n'exécute que les cas qui lui sont affectés, ou ceux qui
 * ne sont encore affectés à personne.
 * @throws {AppError} 403 si le cas est affecté à quelqu'un d'autre
 */
export function assertCanExecuteAssigned({ assignedTo, actorId, actorRoles }) {
  if (actorRoles.some((r) => EXECUTION_MANAGER_ROLES.includes(r))) return;
  if (assignedTo == null || Number(assignedTo) === Number(actorId)) return;
  throw new AppError(WORKFLOW_MESSAGES.notAssigned, 403);
}

/** @throws {AppError} 409 si un cas n'est pas validé ou une anomalie pas validée */
export function assertFeatureCanBeConforme(summary) {
  if (!isComplete(summary)) {
    throw new AppError(WORKFLOW_MESSAGES.featureNotConforme(summary), 409);
  }
}

const round1 = (x) => Math.round(x * 10) / 10;

/**
 * Taux d'une campagne, a partir du dernier resultat de chaque cas.
 * - executionRate : cas executes / total (null s'il n'y a aucun cas)
 * - successRate   : cas reussis / cas executes applicables (non applicables
 *   exclus ; null si aucun cas applicable n'a ete execute)
 */
export function campaignRates(testCases) {
  const total = testCases.length;
  let executed = 0;
  let skipped = 0;
  let passed = 0;
  for (const tc of testCases) {
    const result = tc.latest_result;
    if (result == null || result === 'not_run') continue;
    executed += 1;
    if (result === 'skipped') skipped += 1;
    else if (result === 'passed') passed += 1;
  }
  const applicable = executed - skipped;
  return {
    total,
    executed,
    passed,
    executionRate: total ? round1((executed / total) * 100) : null,
    successRate: applicable ? round1((passed / applicable) * 100) : null,
  };
}

/**
 * Cloture d'une campagne selon les verdicts des regles RG-4 / RG-5.
 * @param {{ verdicts: Array<{ ok: boolean, mode: string, message: string }>, openAnomalies: number }} check
 * @param {boolean} confirmed - l'utilisateur a confirme la cloture
 * @throws {AppError} 409 « Clôture refusée » si une regle bloquante n'est pas
 *   respectee (meme confirmee) ; 409 « Clôture à confirmer » si une regle en
 *   avertissement n'est pas respectee ou si des anomalies restent ouvertes.
 */
export function assertCampaignCanClose({ verdicts, openAnomalies }, confirmed) {
  const failing = verdicts.filter((v) => v && !v.ok);
  const blocking = failing.filter((v) => v.mode === 'blocking');
  if (blocking.length > 0) {
    throw new AppError(WORKFLOW_MESSAGES.closeRefused(blocking.map((v) => v.message)), 409);
  }
  const warnings = failing.map((v) => v.message);
  if (openAnomalies > 0) warnings.push(WORKFLOW_MESSAGES.openAnomalies(openAnomalies));
  if (!confirmed && warnings.length > 0) {
    throw new AppError(WORKFLOW_MESSAGES.closeToConfirm(warnings), 409);
  }
}
