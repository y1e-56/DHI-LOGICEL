import { AppError } from '../middleware/errorHandler.js';
import * as db from '../db/index.js';

export async function listVersionsPaginated(filters = {}) {
  return db.versions.findPaginated(filters);
}

export async function listByCampaign(campaignId) {
  return db.versions.findByCampaign(campaignId);
}

export async function listByFeature(featureId) {
  return db.versions.findByFeature(featureId);
}

export async function getVersion(id) {
  const v = await db.versions.findById(id);
  if (!v) throw new AppError('Version non trouvée', 404);
  return v;
}

export async function createVersion(data) {
  if (!data.version_number) throw new AppError('version_number requis', 400);
  return db.versions.create(data);
}

export async function updateVersion(id, data) {
  const updated = await db.versions.update(id, data);
  if (!updated) throw new AppError('Version non trouvée', 404);
  return updated;
}

export async function deleteVersion(id) {
  const deleted = await db.versions.remove(id);
  if (!deleted) throw new AppError('Version non trouvée', 404);
  return deleted;
}
