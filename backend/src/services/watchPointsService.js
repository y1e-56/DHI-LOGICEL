import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listWatchPointsPaginated(filters = {}) {
  if (!filters.projetId) throw new AppError('projetId requis', 400);
  return db.watchPoints.findByProject(filters.projetId, filters);
}

export async function listByCampaign(campaignId) {
  return db.watchPoints.findByCampaign(campaignId);
}

export async function getWatchPoint(id) {
  const wp = await db.watchPoints.findById(id);
  if (!wp) throw new AppError('Point à surveiller non trouvé', 404);
  return wp;
}

export async function createWatchPoint(data) {
  if (!data.project_id) throw new AppError('project_id requis', 400);
  if (!data.title) throw new AppError('title requis', 400);
  const wp = await db.watchPoints.create(data);
  bus.emit('watch_point:created', wp);
  return wp;
}

export async function updateWatchPoint(id, data) {
  const updated = await db.watchPoints.update(id, data);
  if (!updated) throw new AppError('Point à surveiller non trouvé', 404);
  bus.emit('watch_point:updated', updated);
  return updated;
}

export async function deleteWatchPoint(id) {
  const deleted = await db.watchPoints.remove(id);
  if (!deleted) throw new AppError('Point à surveiller non trouvé', 404);
  bus.emit('watch_point:deleted', { id });
  return deleted;
}

export async function getWatchPointStats(projectId) {
  return db.watchPoints.stats(projectId);
}
