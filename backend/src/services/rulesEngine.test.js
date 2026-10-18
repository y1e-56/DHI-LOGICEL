import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRule, formatThreshold, normalizeRule } from './rulesEngine.js';

const rule = (over = {}) => ({
  id: 'RG-4',
  label: "Taux d'exécution minimal avant clôture",
  active: true,
  value: '95',
  unit: 'percent',
  comparator: 'gte',
  mode: 'warning',
  ...over,
});

describe('rulesEngine — seuils structurés', () => {
  test('formatThreshold produit un libellé lisible par unité', () => {
    assert.equal(formatThreshold({ value: 95, unit: 'percent', comparator: 'gte' }), '≥ 95 %');
    assert.equal(formatThreshold({ value: 7, unit: 'days', comparator: 'lte' }), '≤ 7 jours');
    assert.equal(formatThreshold({ value: 1, unit: 'days', comparator: 'lte' }), '≤ 1 jour');
    assert.equal(formatThreshold({ value: 85, unit: 'score', comparator: 'gte' }), '≥ 85/100');
    assert.equal(formatThreshold({ value: 0, unit: 'count', comparator: 'lte' }), '≤ 0');
    assert.equal(formatThreshold({ value: null, unit: 'percent', comparator: 'gte' }), '');
  });

  test('normalizeRule convertit la valeur NUMERIC (chaîne) en nombre', () => {
    assert.equal(normalizeRule(rule()).value, 95);
    assert.equal(normalizeRule(rule({ value: null })).value, null);
  });

  test('evaluateRule : gte respecté / non respecté', () => {
    assert.equal(evaluateRule(rule(), 96).ok, true);
    assert.equal(evaluateRule(rule(), 95).ok, true);
    const fail = evaluateRule(rule(), 67);
    assert.equal(fail.ok, false);
    assert.equal(fail.mode, 'warning');
    assert.match(fail.message, /RG-4 .* 67 % \(attendu ≥ 95 %\)/);
  });

  test('evaluateRule : lte (délai, nombre maximal)', () => {
    const r = rule({ id: 'RG-9', value: 0, unit: 'count', comparator: 'lte', mode: 'blocking' });
    assert.equal(evaluateRule(r, 0).ok, true);
    const fail = evaluateRule(r, 2);
    assert.equal(fail.ok, false);
    assert.equal(fail.mode, 'blocking');
  });

  test('une règle inactive, absente ou sans seuil ne s\'applique pas', () => {
    assert.equal(evaluateRule(rule({ active: false }), 10), null);
    assert.equal(evaluateRule(undefined, 10), null);
    assert.equal(evaluateRule(rule({ value: null }), 10), null);
  });
});
