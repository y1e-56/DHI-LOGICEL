import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../middleware/errorHandler.js';
import { evaluateRule } from './rulesEngine.js';
import {
  assertCampaignCanClose,
  assertCampaignInProgress,
  campaignRates,
  assertCanExecuteAssigned,
  assertFeatureCanBeConforme,
  summarizeOutcome,
} from './workflowGuard.js';

const status = (code) => (err) => err instanceof AppError && err.statusCode === code;
const complete = { notRun: 0, failed: 0, openAnomalies: 0 };

describe('workflowGuard — cohérence du cycle de vie', () => {
  test('summarizeOutcome compte non exécutés et échecs', () => {
    const summary = summarizeOutcome(
      [
        { latest_result: null },
        { latest_result: 'not_run' },
        { latest_result: 'failed' },
        { latest_result: 'blocked' },
        { latest_result: 'passed' },
        { latest_result: 'skipped' },
      ],
      2
    );
    assert.deepEqual(summary, { notRun: 2, failed: 2, openAnomalies: 2 });
  });

  test('exécution et anomalies réservées aux campagnes en cours', () => {
    assert.doesNotThrow(() => assertCampaignInProgress({ status: 'in_progress' }));
    for (const s of ['planning', 'completed', 'archived']) {
      assert.throws(() => assertCampaignInProgress({ status: s }), status(409));
    }
    assert.throws(() => assertCampaignInProgress(null), status(409));
  });

  test('un testeur n\'exécute que ses cas ou les cas non affectés', () => {
    assert.doesNotThrow(() =>
      assertCanExecuteAssigned({ assignedTo: 5, actorId: 5, actorRoles: ['tester'] })
    );
    assert.doesNotThrow(() =>
      assertCanExecuteAssigned({ assignedTo: null, actorId: 5, actorRoles: ['tester'] })
    );
    assert.throws(
      () => assertCanExecuteAssigned({ assignedTo: 6, actorId: 5, actorRoles: ['tester'] }),
      status(403)
    );
  });

  test('un responsable de campagne exécute tous les cas', () => {
    assert.doesNotThrow(() =>
      assertCanExecuteAssigned({ assignedTo: 6, actorId: 5, actorRoles: ['chef_testeur'] })
    );
  });

  test('conformité refusée tant qu\'un cas ou une anomalie n\'est pas validé', () => {
    assert.doesNotThrow(() => assertFeatureCanBeConforme(complete));
    for (const gap of [{ notRun: 1 }, { failed: 1 }, { openAnomalies: 1 }]) {
      assert.throws(() => assertFeatureCanBeConforme({ ...complete, ...gap }), status(409));
    }
  });

  test('campaignRates : exécution sur le total, succès sur les cas applicables exécutés', () => {
    const rates = campaignRates([
      { latest_result: 'passed' },
      { latest_result: 'passed' },
      { latest_result: 'failed' },
      { latest_result: 'skipped' },
      { latest_result: 'not_run' },
      { latest_result: null },
    ]);
    assert.equal(rates.executionRate, 66.7);
    assert.equal(rates.successRate, 66.7);
    assert.deepEqual(campaignRates([]), {
      total: 0,
      executed: 0,
      passed: 0,
      executionRate: null,
      successRate: null,
    });
  });

  const rg = (over) => ({
    id: 'RG-4',
    label: 'Taux',
    active: true,
    value: 95,
    unit: 'percent',
    comparator: 'gte',
    mode: 'warning',
    ...over,
  });

  test('clôture : règle en avertissement non respectée → confirmation exigée', () => {
    const verdicts = [evaluateRule(rg(), 67)];
    assert.throws(
      () => assertCampaignCanClose({ verdicts, openAnomalies: 0 }, false),
      (e) => e.statusCode === 409 && /à confirmer.*RG-4/.test(e.message)
    );
    assert.doesNotThrow(() => assertCampaignCanClose({ verdicts, openAnomalies: 0 }, true));
  });

  test('clôture : règle bloquante non respectée → refusée même confirmée', () => {
    const verdicts = [evaluateRule(rg({ mode: 'blocking' }), 67)];
    assert.throws(
      () => assertCampaignCanClose({ verdicts, openAnomalies: 0 }, true),
      (e) => e.statusCode === 409 && /refusée.*RG-4/.test(e.message)
    );
  });

  test('clôture : règles respectées, sans anomalie ouverte → aucune confirmation', () => {
    const verdicts = [evaluateRule(rg({ mode: 'blocking' }), 96)];
    assert.doesNotThrow(() => assertCampaignCanClose({ verdicts, openAnomalies: 0 }, false));
  });

  test('clôture : anomalies ouvertes → confirmation, même si les règles passent', () => {
    assert.throws(() => assertCampaignCanClose({ verdicts: [], openAnomalies: 2 }, false), /2 anomalie/);
    assert.doesNotThrow(() => assertCampaignCanClose({ verdicts: [], openAnomalies: 2 }, true));
  });
});
