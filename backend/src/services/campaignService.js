import { withTransaction } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';
import { assertCampaignCanClose, campaignRates } from './workflowGuard.js';
import { VERSION_MESSAGES, ensureRelease } from './versionService.js';
import { evaluateRule, loadRules } from './rulesEngine.js';
import { coverageVerdicts } from './coverageGuard.js';
import { _setTestersWithClient, _setDevelopersWithClient } from './campaignMemberService.js';

export async function listCampaigns(projectId) {
  const campaigns = await db.campaigns.list(projectId);
  
  const enriched = await Promise.all(
    campaigns.map(async (campaign) => {
      const members = await db.campaignMembers.getMemberIds(campaign.id);
      return { ...campaign, ...members };
    })
  );
  
  return enriched;
}

export async function listCampaignsPaginated(filters = {}) {
  const result = await db.campaigns.listPaginated({
    projetId: filters.projetId,
    statut: filters.statut,
    recherche: filters.recherche,
    chefTesteurId: filters.chefTesteurId,
    dateDebut: filters.dateDebut,
    dateFin: filters.dateFin,
    page: filters.page,
    limit: filters.limit,
    orderBy: filters.orderBy,
  });

  result.data = await Promise.all(
    result.data.map(async (campaign) => {
      const members = await db.campaignMembers.getMemberIds(campaign.id);
      return { ...campaign, ...members };
    })
  );

  return result;
}

export async function listCampaignsByProject(projectId) {
  return listCampaigns(projectId);
}

export async function getCampaign(id) {
  const campaign = await db.campaigns.findById(id);
  if (!campaign) throw new AppError('Campagne non trouvée', 404);
  return getCampaignWithMembers(id);
}

export async function getCampaignBasic(id) {
  const campaign = await db.campaigns.findById(id);
  if (!campaign) throw new AppError('Campagne non trouvée', 404);
  return campaign;
}

export async function getCampaignWithMembers(id, client = null) {
  const campaign = await db.campaigns.findById(id, client);
  if (!campaign) throw new AppError('Campagne non trouvée', 404);
  
  const members = await db.campaignMembers.getMemberIds(id, client);
  
  return { ...campaign, ...members };
}

export async function createCampaign(data) {
  console.log('[campaignService] createCampaign avec data:', data);
  
  const existing = await db.campaigns.findByName(data.project_id, data.name);
  if (existing) throw new AppError('Une campagne avec ce nom existe déjà dans ce projet', 409);

  // Toute campagne vise une version determinee du produit de son projet.
  if (data.version !== undefined) {
    const { version, ...rest } = data;
    data = { ...rest, release_id: await releaseOfProject(data.project_id, version, data.created_by) };
  }
  if (!data.release_id) throw new AppError(VERSION_MESSAGES.required, 400);

  return withTransaction(async (client) => {
    const campaign = await db.campaigns.create(data, client);
    console.log('[campaignService] Campagne créée:', campaign);
    
    if (data.testers && data.testers.length > 0) {
      console.log('[campaignService] Ajout de testeurs:', data.testers);
      await _setTestersWithClient(campaign.id, data.testers, client);
    }
    
    if (data.developers && data.developers.length > 0) {
      console.log('[campaignService] Ajout de développeurs:', data.developers);
      await _setDevelopersWithClient(campaign.id, data.developers, client);
    }
    
    const campaignWithMembers = await getCampaignWithMembers(campaign.id, client);
    console.log('[campaignService] Campagne retournée avec membres:', campaignWithMembers);

    let project_name = '';
    try {
      const proj = await db.projects.findById(campaign.project_id).catch(() => null);
      if (proj) project_name = proj.name;
    } catch {}
    bus.emit('campaign:created', { campaign: campaignWithMembers, user_id: data.created_by, project_name });

    return campaignWithMembers;
  });
}

/** Version `version` du produit du projet, creee si besoin. */
async function releaseOfProject(projectId, version, createdBy = null) {
  const project = await db.projects.findById(projectId);
  if (!project) throw new AppError('Projet non trouvé', 404);
  if (!project.product_id) throw new AppError(VERSION_MESSAGES.noProduct, 400);
  return ensureRelease(project.product_id, version, createdBy);
}

export async function updateCampaign(id, data) {
  // Changement de version : resolue sur le produit du projet de la campagne.
  if (data.version !== undefined) {
    const current = await db.campaigns.findById(id);
    if (!current) throw new AppError('Campagne non trouvée', 404);
    const { version, ...rest } = data;
    data = { ...rest, release_id: await releaseOfProject(current.project_id, version) };
  }
  console.log('[campaignService] updateCampaign id=' + id + ' avec data:', data);
  const scalarFields = ['name', 'objective', 'organization_mode', 'start_date', 'end_date', 'status',
    'objective_audio_data', 'objective_audio_type', 'objective_transcription', 'objective_duration_seconds'];
  const hasScalarFields = scalarFields.some(field => data[field] !== undefined);
  const hasTestLeadIds = data.test_lead_ids !== undefined;

  if (!hasScalarFields && !hasTestLeadIds && !data.testers && !data.developers) {
    throw new AppError('Aucune donnée à mettre à jour', 400);
  }

  // Cloture : regles RG-4 / RG-5 du referentiel. Une regle bloquante non
  // respectee refuse la cloture ; une regle en avertissement, ou des anomalies
  // non validees, demandent une confirmation explicite.
  let closing = false;
  if (data.status === 'completed') {
    const current = await db.campaigns.findById(id);
    if (!current) throw new AppError('Campagne non trouvée', 404);
    closing = current.status !== 'completed';
    if (closing) {
      const [testCases, openAnomalies, features] = await Promise.all([
        db.testCases.listWithLatestResult({ campaignId: id }),
        db.anomalies.countOpen({ campaignId: id }),
        db.features.findByCampaign(id),
      ]);
      // Seuils du referentiel : RG-4 (taux d'execution), RG-5 (taux de succes).
      // Une regle inactive ou un taux non calculable (aucun cas) ne s'applique pas.
      const rules = await loadRules();
      const rates = campaignRates(testCases);
      const verdicts = [
        rates.executionRate === null ? null : evaluateRule(rules.get('RG-4'), rates.executionRate),
        rates.successRate === null ? null : evaluateRule(rules.get('RG-5'), rates.successRate),
        // RG-6 (couverture globale des types requis) et RG-7 (fonctionnalites critiques).
        ...coverageVerdicts(features, testCases, rules),
      ].filter(Boolean);
      assertCampaignCanClose({ verdicts, openAnomalies }, data.confirm_incomplete === true);
    }
  }

  if (data.name !== undefined) {
    const current = await db.campaigns.findById(id);
    if (!current) throw new AppError('Campagne non trouvée', 404);
    const existing = await db.campaigns.findByName(current.project_id, data.name, id);
    if (existing) throw new AppError('Une campagne avec ce nom existe déjà dans ce projet', 409);
  }

  return withTransaction(async (client) => {
    if (hasScalarFields || hasTestLeadIds) {
      try {
        const updated = await db.campaigns.update(id, data, client);
        if (!updated) throw new AppError('Campagne non trouvée', 404);
        console.log('[campaignService] Champs campagne mis à jour');
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(error.message, 400);
      }
    }
    
    if (data.testers !== undefined) {
      const oldTesters = await db.campaignMembers.getMemberIds(id, client);
      await _setTestersWithClient(id, data.testers, client);
      const newTesters = data.testers;
      const addedTesters = newTesters.filter(t => !oldTesters.testers.includes(t));
      for (const userId of addedTesters) {
        bus.emit('campaignMember:added', { campaign_id: id, user_id: userId, team_type: 'tester' });
      }
    }
    
    if (data.developers !== undefined) {
      const oldDevs = await db.campaignMembers.getMemberIds(id, client);
      await _setDevelopersWithClient(id, data.developers, client);
      const newDevs = data.developers;
      const addedDevs = newDevs.filter(d => !oldDevs.developers.includes(d));
      for (const userId of addedDevs) {
        bus.emit('campaignMember:added', { campaign_id: id, user_id: userId, team_type: 'developer' });
      }
    }
    
    const campaignWithMembers = await getCampaignWithMembers(id, client);
    console.log('[campaignService] Campagne retournée avec membres:', campaignWithMembers);

    bus.emit('campaign:updated', { campaign: campaignWithMembers, campaign_id: id, user_id: null });

    // Seul le vrai passage a « terminee » notifie : un second PUT du meme
    // statut (synchronisation du store) envoyait les notifications en double.
    if (closing) {
      bus.emit('campaign:completed', { campaign: campaignWithMembers });
    }

    return campaignWithMembers;
  });
}

export async function deleteCampaign(id) {
  console.log('[campaignService] deleteCampaign id=' + id);
  
  return withTransaction(async (client) => {
    await db.campaignMembers.deleteAll(id, client);
    await db.campaigns.setTestLeads(id, [], client);
    console.log('[campaignService] Membres et chefs testeurs de la campagne supprimés');
    
    const result = await db.campaigns.remove(id, client);
    if (!result) throw new AppError('Campagne non trouvée', 404);
    console.log('[campaignService] Campagne supprimée');

    bus.emit('campaign:deleted', { campaign_id: id, user_id: null });
  });
}

export async function getCampaignStats(campaignId) {
  return db.campaigns.getStats(campaignId);
}
