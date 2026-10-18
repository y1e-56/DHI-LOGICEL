import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';
import { RULE_COMPARATORS, RULE_MODES, RULE_UNITS, formatThreshold, normalizeRule } from './rulesEngine.js';

const RULE_KEYS = ['domain', 'label', 'threshold', 'active', 'value', 'unit', 'comparator', 'mode'];

export async function listRules() {
  return (await db.referentialRules.listRules()).map(normalizeRule);
}

/** Verifie les champs structures d'un seuil. */
function validateStructured(data) {
  if (data.value !== undefined && data.value !== null) {
    const n = Number(data.value);
    if (!Number.isFinite(n) || n < 0) throw new AppError('Valeur de seuil invalide', 400);
    data.value = n;
  }
  if (data.unit !== undefined && data.unit !== null && !RULE_UNITS.includes(data.unit)) {
    throw new AppError('Unité de seuil invalide', 400);
  }
  if (data.comparator !== undefined && data.comparator !== null && !RULE_COMPARATORS.includes(data.comparator)) {
    throw new AppError('Comparaison de seuil invalide', 400);
  }
  if (data.mode !== undefined && !RULE_MODES.includes(data.mode)) {
    throw new AppError('Mode de règle invalide (bloquant ou avertissement)', 400);
  }
  if ((data.unit === 'percent' || data.unit === 'score') && data.value > 100) {
    throw new AppError('Un pourcentage ou un score ne dépasse pas 100', 400);
  }
}

export async function updateRule(id, patch) {
  if (!id) throw new AppError('Identifiant de règle requis', 400);
  if (!patch || typeof patch !== 'object') throw new AppError('Données invalides', 400);
  const data = {};
  for (const key of RULE_KEYS) {
    if (patch[key] !== undefined) data[key] = patch[key];
  }
  if (data.active !== undefined) data.active = !!data.active;
  if (Object.keys(data).length === 0) throw new AppError('Aucun champ à mettre à jour', 400);
  validateStructured(data);

  // Le libelle du seuil suit toujours la valeur structuree : on le regenere des
  // qu'un champ de seuil change, pour que l'affichage ne diverge jamais.
  if (['value', 'unit', 'comparator'].some((k) => data[k] !== undefined)) {
    const current = normalizeRule(await db.referentialRules.findRule(id));
    if (!current) throw new AppError('Règle non trouvée', 404);
    const merged = { ...current, ...data };
    if ((merged.unit === 'percent' || merged.unit === 'score') && merged.value > 100) {
      throw new AppError('Un pourcentage ou un score ne dépasse pas 100', 400);
    }
    const label = formatThreshold(merged);
    if (label) data.threshold = label;
  }
  const rule = normalizeRule(await db.referentialRules.updateRule(id, data));
  if (!rule) throw new AppError('Règle non trouvée', 404);
  bus.emit('referential:rule_updated', { rule, user_id: null });
  return rule;
}

export async function createRule(data) {
  if (!data || !data.id || !String(data.domain).trim() || !String(data.label).trim()) {
    throw new AppError('id, domain et label sont requis', 400);
  }
  const rule = await db.referentialRules.createRule({
    id: String(data.id).trim(),
    domain: String(data.domain).trim(),
    label: String(data.label).trim(),
    threshold: data.threshold != null ? String(data.threshold) : '',
    active: data.active !== undefined ? !!data.active : true,
  });
  bus.emit('referential:rule_created', { rule, user_id: null });
  return rule;
}

export async function deleteRule(id) {
  if (!id) throw new AppError('Identifiant de règle requis', 400);
  const removed = await db.referentialRules.deleteRule(id);
  if (!removed) throw new AppError('Règle non trouvée', 404);
  bus.emit('referential:rule_deleted', { id, user_id: null });
  return removed;
}