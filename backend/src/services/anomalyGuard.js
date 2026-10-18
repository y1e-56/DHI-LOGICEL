import { AppError } from '../middleware/errorHandler.js';

/**
 * Cohérence anomalie ↔ cas de test.
 *
 * Une anomalie naît d'un cas de test non validé : elle n'est déclarable que
 * si la dernière exécution du cas, dans la campagne, est en échec ou bloquée.
 * Un cas réussi, non exécuté ou non applicable ne justifie pas d'anomalie.
 *
 * Référentiel pur et testable : n'accède jamais à la base.
 */

/** Résultats d'exécution qui autorisent la déclaration d'une anomalie. */
export const ANOMALY_ALLOWED_RESULTS = ['failed', 'blocked'];

export const ANOMALY_GUARD_MESSAGES = {
  testCaseRequired: 'Une anomalie doit être rattachée à un cas de test.',
  testCaseMismatch:
    "Le cas de test n'appartient pas à la fonctionnalité ou à la campagne de l'anomalie.",
  testCaseNotFailed:
    "Une anomalie ne peut être déclarée que sur un cas de test en échec ou bloqué.",
};

/**
 * Vérifie qu'une anomalie peut être déclarée sur ce cas de test.
 * @param {object} opts
 * @param {object|null} opts.testCase    - cas de test ({ feature_id, campaign_id })
 * @param {number} opts.featureId        - fonctionnalité de l'anomalie
 * @param {number} opts.campaignId       - campagne de l'anomalie
 * @param {string|null} opts.latestResult- résultat de la dernière exécution du cas dans la campagne
 * @throws {AppError} 400 si le cas est absent, incohérent ou non en échec/bloqué
 */
export function assertCanReportAnomaly({ testCase, featureId, campaignId, latestResult }) {
  if (!testCase) throw new AppError(ANOMALY_GUARD_MESSAGES.testCaseRequired, 400);
  const sameFeature = testCase.feature_id == null || Number(testCase.feature_id) === Number(featureId);
  const sameCampaign =
    testCase.campaign_id == null || Number(testCase.campaign_id) === Number(campaignId);
  if (!sameFeature || !sameCampaign) {
    throw new AppError(ANOMALY_GUARD_MESSAGES.testCaseMismatch, 400);
  }
  if (!ANOMALY_ALLOWED_RESULTS.includes(latestResult)) {
    throw new AppError(ANOMALY_GUARD_MESSAGES.testCaseNotFailed, 400);
  }
}
