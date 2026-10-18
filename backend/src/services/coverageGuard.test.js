import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertConformityCoverage,
  coverageVerdicts,
  featureConformityVerdict,
  featureCoverage,
  requiredTypesOf,
} from './coverageGuard.js';

const rule = (id, value, mode, label) => ({ id, label, active: true, value, unit: 'percent', comparator: 'gte', mode });
const rules = new Map([
  ['RG-6', rule('RG-6', 90, 'warning', 'Couverture fonctionnelle cible')],
  ['RG-7', rule('RG-7', 100, 'blocking', 'Couverture fonctionnalité critique')],
]);

const auth = { id: 1, name: 'Auth', priority: 'critical', coverage: { fonctionnel: true, securite: true, regression: false } };
const export_ = { id: 2, name: 'Export', priority: 'medium', coverage: { fonctionnel: true } };
const cases = [
  { feature_id: 1, type: 'fonctionnel', latest_result: 'passed' },
  { feature_id: 1, type: 'securite', latest_result: 'failed' },
  { feature_id: 2, type: 'fonctionnel', latest_result: 'passed' },
];

describe('coverageGuard — RG-6 / RG-7', () => {
  test('requiredTypesOf ne garde que les types cochés', () => {
    assert.deepEqual(requiredTypesOf(auth), ['fonctionnel', 'securite']);
    assert.deepEqual(requiredTypesOf({}), []);
  });

  test('featureCoverage : un type est couvert par un cas réussi', () => {
    assert.deepEqual(featureCoverage(auth, cases), { required: 2, covered: 1, rate: 50 });
    assert.equal(featureCoverage({ id: 9, coverage: {} }, cases).rate, null);
  });

  test('coverageVerdicts : RG-6 global puis RG-7 par fonctionnalité critique', () => {
    const verdicts = coverageVerdicts([auth, export_], cases, rules);
    assert.deepEqual(verdicts.map((v) => [v.id, v.ok]), [['RG-6', false], ['RG-7', false]]);
    assert.match(verdicts[0].message, /66,7 %/);
    assert.match(verdicts[1].message, /« Auth » : 50 % \(attendu ≥ 100 %\)/);
  });

  test('conformité : RG-7 pour une critique, RG-6 sinon', () => {
    assert.equal(featureConformityVerdict(auth, cases, rules).id, 'RG-7');
    const v = featureConformityVerdict(export_, cases, rules);
    assert.equal(v.id, 'RG-6');
    assert.equal(v.ok, true);
  });

  test('conformité : bloquant refusé, avertissement à confirmer', () => {
    const blocking = featureConformityVerdict(auth, cases, rules);
    assert.throws(() => assertConformityCoverage(blocking, true), /Conformité refusée/);
    const warning = { ...blocking, mode: 'warning' };
    assert.throws(() => assertConformityCoverage(warning, false), /Conformité à confirmer/);
    assert.doesNotThrow(() => assertConformityCoverage(warning, true));
    assert.doesNotThrow(() => assertConformityCoverage(null, false));
  });
});
