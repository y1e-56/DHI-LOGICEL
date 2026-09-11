import { AppError } from '../middleware/errorHandler.js';
import * as db from '../db/index.js';

export async function listScenariosPaginated(filters = {}) {
  if (!filters.campaignId) throw new AppError('campaignId requis', 400);
  return db.testScenarios.findByCampaign(filters.campaignId, filters);
}

export async function listByFeature(featureId) {
  return db.testScenarios.findByFeature(featureId);
}

export async function getScenario(id) {
  const s = await db.testScenarios.findById(id);
  if (!s) throw new AppError('Scénario non trouvé', 404);
  return s;
}

export async function createScenario(data) {
  if (!data.campaign_id) throw new AppError('campaign_id requis', 400);
  if (!data.title) throw new AppError('title requis', 400);
  return db.testScenarios.create(data);
}

export async function updateScenario(id, data) {
  const updated = await db.testScenarios.update(id, data);
  if (!updated) throw new AppError('Scénario non trouvé', 404);
  return updated;
}

export async function deleteScenario(id) {
  const deleted = await db.testScenarios.remove(id);
  if (!deleted) throw new AppError('Scénario non trouvé', 404);
  return deleted;
}
