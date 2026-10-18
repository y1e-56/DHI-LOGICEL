import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

/**
 * Versions d'un produit (table releases). Un produit, un projet et une
 * campagne visent une version determinee (CDC RG-005) : les formulaires
 * choisissent une version existante du produit ou en saisissent une nouvelle,
 * creee ici a la volee.
 */

export const VERSION_MESSAGES = {
  required: 'Version requise',
  tooLong: 'Version trop longue (50 caractères maximum)',
  noProduct: 'Le projet n\'est rattaché à aucun produit : impossible de déterminer la version',
};

/** Numero de version nettoye ; 400 s'il est vide ou trop long. */
export function normalizeVersion(version) {
  const v = String(version ?? '').trim();
  if (!v) throw new AppError(VERSION_MESSAGES.required, 400);
  if (v.length > 50) throw new AppError(VERSION_MESSAGES.tooLong, 400);
  return v;
}

/**
 * Identifiant de la version `version` du produit, creee si elle n'existe pas.
 * La recherche ignore la casse : « V2.1 » et « v2.1 » sont la meme version.
 */
export async function ensureRelease(productId, version, createdBy = null, client = null) {
  const v = normalizeVersion(version);
  const existing = await db.releases.findByVersion(productId, v, null, client);
  if (existing) return existing.id;
  const release = await db.releases.create(
    { product_id: Number(productId), version: v, status: 'planned', created_by: createdBy },
    client
  );
  bus.emit('release:created', { release, user_id: createdBy });
  return release.id;
}
