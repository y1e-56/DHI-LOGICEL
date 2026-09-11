import { AppError } from '../middleware/errorHandler.js';
import * as db from '../db/index.js';

export async function listRequirementsPaginated(filters = {}) {
  return db.requirements.findByFeaturePaginated(filters);
}

export async function listByFeature(featureId) {
  return db.requirements.findByFeature(featureId);
}

export async function getRequirement(id) {
  const req = await db.requirements.findById(id);
  if (!req) throw new AppError('Exigence non trouvée', 404);
  return req;
}

export async function createRequirement(data) {
  const feature = await db.features.findById(data.feature_id);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  return db.requirements.create(data);
}

export async function updateRequirement(id, data) {
  const updated = await db.requirements.update(id, data);
  if (!updated) throw new AppError('Exigence non trouvée', 404);
  return updated;
}

export async function deleteRequirement(id) {
  const deleted = await db.requirements.remove(id);
  if (!deleted) throw new AppError('Exigence non trouvée', 404);
  return deleted;
}
