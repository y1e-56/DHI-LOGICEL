import { VERSION_MESSAGES, ensureRelease } from './versionService.js';
import { AppError } from '../middleware/errorHandler.js';
import { withTransaction } from '../config/database.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listProjects(includeArchived = false) {
  return db.projects.list(includeArchived);
}

export async function listProjectsPaginated(filters = {}) {
  return db.projects.listPaginated({
    recherche: filters.recherche,
    statut: filters.statut,
    chefTesteurId: filters.chefTesteurId,
    page: filters.page,
    limit: filters.limit,
    orderBy: filters.orderBy,
  });
}

export async function getProject(id) {
  const project = await db.projects.findById(id);
  if (!project) throw new AppError('Projet non trouvé', 404);
  return project;
}

export async function createProject(data) {
  const existing = await db.projects.findByName(data.name);
  if (existing) throw new AppError('Un projet avec ce nom existe déjà', 409);

  // Version cible obligatoire : une version du produit, creee si elle est nouvelle.
  const { target_version, ...fields } = data;
  const target_release_id = await ensureRelease(fields.product_id, target_version, fields.created_by);
  const project = await db.projects.create({ ...fields, target_release_id });
  bus.emit('project:created', { project, user_id: data.created_by || null });
  return project;
}

export async function setProjectTestLeads(projectId, testLeadIds) {
  await db.projects.setTestLeads(projectId, testLeadIds);
}

export async function updateProject(id, data) {
  try {
    if (data.name !== undefined) {
      const existing = await db.projects.findByName(data.name, id);
      if (existing) throw new AppError('Un projet avec ce nom existe déjà', 409);
    }
    // Version cible : resolue sur le produit du projet (nouveau ou actuel).
    const { target_version, ...fields } = data;
    if (target_version !== undefined) {
      const current = await db.projects.findById(id);
      if (!current) throw new AppError('Projet non trouvé', 404);
      const productId = fields.product_id ?? current.product_id;
      if (!productId) throw new AppError(VERSION_MESSAGES.noProduct, 400);
      fields.target_release_id = await ensureRelease(productId, target_version);
    }
    const project = await db.projects.update(id, fields);
    if (!project) throw new AppError('Projet non trouvé', 404);
    bus.emit('project:updated', { project, project_id: id, user_id: null });
    return project;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
}

export async function archiveProject(id) {
  return withTransaction(async (client) => {
    const project = await db.projects.update(id, { is_archived: true }, client);
    if (!project) throw new AppError('Projet non trouvé', 404);

    const campaignIds = await db.campaigns.archiveByProject(id, client);

    bus.emit('project:archived', { project, project_id: id, campaign_ids: campaignIds });

    return project;
  });
}

export async function unarchiveProject(id) {
  return withTransaction(async (client) => {
    const project = await db.projects.update(id, { is_archived: false }, client);
    if (!project) throw new AppError('Projet non trouvé', 404);

    const campaignIds = await db.campaigns.unarchiveByProject(id, client);

    bus.emit('project:unarchived', { project, project_id: id, campaign_ids: campaignIds });

    return project;
  });
}

export async function deleteProject(id) {
  return withTransaction(async (client) => {
    await db.history.deleteByProject(id, client);
    const result = await db.projects.remove(id, client);
    if (!result) throw new AppError('Projet non trouvé', 404);
    bus.emit('project:deleted', { project_id: id, user_id: null });
  });
}

export async function getProjectCampaigns(projectId) {
  return db.projects.getCampaigns(projectId);
}
