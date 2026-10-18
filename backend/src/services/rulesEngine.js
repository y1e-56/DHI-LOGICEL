import * as db from '../db/index.js';

/**
 * Moteur des regles du referentiel : source unique des seuils appliques.
 *
 * Une regle structuree porte une valeur, une unite, un sens de comparaison et
 * un mode. Les controles (cloture de campagne, conformite, Go-Live…) lui
 * soumettent une valeur mesuree et recoivent un verdict ; ils n'ecrivent plus
 * de seuil en dur.
 *
 * Fonctions pures (formatThreshold, evaluateRule) testables sans base ;
 * loadRules lit les regles en base.
 */

export const RULE_UNITS = ['score', 'percent', 'days', 'count'];
export const RULE_COMPARATORS = ['gte', 'lte'];
export const RULE_MODES = ['blocking', 'warning'];

const UNIT_SUFFIX = { score: '/100', percent: ' %', days: ' jours', count: '' };
const COMPARATOR_SIGN = { gte: '≥', lte: '≤' };

/** Normalise une ligne de base (NUMERIC arrive en chaine). */
export function normalizeRule(row) {
  if (!row) return null;
  const value = row.value === null || row.value === undefined ? null : Number(row.value);
  return { ...row, value: Number.isFinite(value) ? value : null };
}

/** Libelle lisible d'un seuil structure : « ≥ 95 % », « ≤ 7 jours », « ≥ 85/100 ». */
export function formatThreshold({ value, unit, comparator }) {
  if (value === null || value === undefined || !unit || !comparator) return '';
  const n = Number(value);
  const shown = Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
  const suffix = unit === 'days' && n <= 1 ? ' jour' : UNIT_SUFFIX[unit] ?? '';
  return `${COMPARATOR_SIGN[comparator] ?? ''} ${shown}${suffix}`.trim();
}

/**
 * Evalue une valeur mesuree contre une regle.
 * @returns {null | { id, label, mode, threshold, expected, actual, ok, message }}
 *   null si la regle est absente, inactive ou sans seuil structure : elle ne
 *   s'applique pas.
 */
export function evaluateRule(rule, actual) {
  const r = normalizeRule(rule);
  if (!r || !r.active || r.value === null || !r.comparator) return null;
  const ok = r.comparator === 'gte' ? actual >= r.value : actual <= r.value;
  const threshold = formatThreshold(r);
  const measured = formatThreshold({ ...r, comparator: 'gte', value: actual }).replace('≥ ', '');
  return {
    id: r.id,
    label: r.label,
    mode: r.mode === 'blocking' ? 'blocking' : 'warning',
    threshold,
    expected: r.value,
    actual,
    ok,
    message: `${r.id} — ${r.label} : ${measured} (attendu ${threshold})`,
  };
}

/** Regles en base, indexees par identifiant. */
export async function loadRules() {
  const rows = await db.referentialRules.listRules();
  return new Map(rows.map((row) => [row.id, normalizeRule(row)]));
}
