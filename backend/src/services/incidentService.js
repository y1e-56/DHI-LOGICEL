import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listIncidentsPaginated(filters = {}) {
  return db.incidents.findByCampaignPaginated(filters);
}

export async function listByFeature(featureId) {
  return db.incidents.findByFeature(featureId);
}

export async function getIncident(id) {
  const inc = await db.incidents.findById(id);
  if (!inc) throw new AppError('Incident non trouvé', 404);
  return inc;
}

export async function createIncident(data) {
  if (!data.title) throw new AppError('title requis', 400);
  if (!data.description) throw new AppError('description requise', 400);
  const inc = await db.incidents.create(data);
  bus.emit('incident:created', inc);
  return inc;
}

export async function updateIncident(id, data) {
  const updated = await db.incidents.update(id, data);
  if (!updated) throw new AppError('Incident non trouvé', 404);
  bus.emit('incident:updated', updated);
  return updated;
}

export async function deleteIncident(id) {
  const deleted = await db.incidents.remove(id);
  if (!deleted) throw new AppError('Incident non trouvé', 404);
  return deleted;
}

export async function getIncidentStats(campaignId) {
  return db.incidents.stats(campaignId);
}
