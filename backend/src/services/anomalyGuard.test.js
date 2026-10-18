import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../middleware/errorHandler.js';
import { ANOMALY_GUARD_MESSAGES, assertCanReportAnomaly } from './anomalyGuard.js';

const testCase = { id: 3, feature_id: 10, campaign_id: 20 };
const base = { testCase, featureId: 10, campaignId: 20 };
const rejectsWith = (message) => (err) =>
  err instanceof AppError && err.statusCode === 400 && err.message === message;

describe('anomalyGuard — anomalie conditionnée par un cas de test non validé', () => {
  test('autorise une anomalie sur un cas en échec ou bloqué', () => {
    for (const latestResult of ['failed', 'blocked']) {
      assert.doesNotThrow(() => assertCanReportAnomaly({ ...base, latestResult }));
    }
  });

  test('refuse une anomalie sur un cas réussi, non exécuté ou non applicable', () => {
    for (const latestResult of ['passed', 'not_run', 'skipped', null]) {
      assert.throws(
        () => assertCanReportAnomaly({ ...base, latestResult }),
        rejectsWith(ANOMALY_GUARD_MESSAGES.testCaseNotFailed)
      );
    }
  });

  test('refuse une anomalie sans cas de test', () => {
    assert.throws(
      () => assertCanReportAnomaly({ ...base, testCase: null, latestResult: 'failed' }),
      rejectsWith(ANOMALY_GUARD_MESSAGES.testCaseRequired)
    );
  });

  test('refuse un cas d\'une autre fonctionnalité ou campagne', () => {
    assert.throws(
      () => assertCanReportAnomaly({ ...base, featureId: 11, latestResult: 'failed' }),
      rejectsWith(ANOMALY_GUARD_MESSAGES.testCaseMismatch)
    );
    assert.throws(
      () => assertCanReportAnomaly({ ...base, campaignId: 21, latestResult: 'failed' }),
      rejectsWith(ANOMALY_GUARD_MESSAGES.testCaseMismatch)
    );
  });
});
