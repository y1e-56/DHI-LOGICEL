import { AppError } from '../middleware/errorHandler.js';
import * as db from '../db/index.js';

export async function listDependenciesPaginated(filters = {}) {
  return db.dependencies.findByCampaignPaginated(filters);
}

export async function listByFeature(featureId) {
  return db.dependencies.findByFeature(featureId);
}

export async function listDependents(featureId) {
  return db.dependencies.findDependents(featureId);
}

export async function getDependency(id) {
  const dep = await db.dependencies.findById(id);
  if (!dep) throw new AppError('Dépendance non trouvée', 404);
  return dep;
}

export async function createDependency(data) {
  if (!data.feature_id) throw new AppError('feature_id requis', 400);
  if (!data.depends_on_feature_id) throw new AppError('depends_on_feature_id requis', 400);
  if (data.feature_id === data.depends_on_feature_id) {
    throw new AppError('Une fonctionnalité ne peut pas dépendre d\'elle-même', 400);
  }

  const feature = await db.features.findById(data.feature_id);
  if (!feature) throw new AppError('Fonctionnalité source non trouvée', 404);

  const dependsOn = await db.features.findById(data.depends_on_feature_id);
  if (!dependsOn) throw new AppError('Fonctionnalité cible non trouvée', 404);

  try {
    return await db.dependencies.create(data);
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError('Cette dépendance existe déjà', 409);
    }
    throw err;
  }
}

export async function deleteDependency(id) {
  const deleted = await db.dependencies.remove(id);
  if (!deleted) throw new AppError('Dépendance non trouvée', 404);
  return deleted;
}
