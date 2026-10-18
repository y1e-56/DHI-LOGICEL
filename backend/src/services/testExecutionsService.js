import { AppError } from '../middleware/errorHandler.js';
import { assertCanReexecute, assertCanRecordVerdict } from './separationGuard.js';
import { assertCampaignInProgress, assertCanExecuteAssigned } from './workflowGuard.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listExecutionsPaginated(filters = {}) {
  if (!filters.campaignId) throw new AppError('campaignId requis', 400);
  return db.testExecutions.findByCampaign(filters.campaignId, filters);
}

export async function listByTestCase(testCaseId) {
  return db.testExecutions.findByTestCase(testCaseId);
}

export async function getExecution(id) {
  const exec = await db.testExecutions.findById(id);
  if (!exec) throw new AppError('Exécution non trouvée', 404);
  return exec;
}

export async function createExecution(data, actorRoles = null) {
  if (!data.test_case_id) throw new AppError('test_case_id requis', 400);
  if (!data.campaign_id) throw new AppError('campaign_id requis', 400);

  const testCase = await db.testCases.findById(data.test_case_id);
  if (!testCase) throw new AppError('Cas de test non trouvé', 404);

  const campaign = await db.campaigns.findById(data.campaign_id);
  if (!campaign) throw new AppError('Campagne non trouvée', 404);
  assertCampaignInProgress(campaign);

  // Créer une nouvelle exécution sur un cas déjà jugé dans la campagne
  // reviendrait à le rejouer : même règle que la modification.
  if (actorRoles) {
    assertCanExecuteAssigned({
      assignedTo: testCase.assigned_to,
      actorId: data.executed_by,
      actorRoles,
    });
    const previous = await db.testExecutions.findByTestCase(data.test_case_id);
    const closed = previous.find(
      (e) => Number(e.campaign_id) === Number(data.campaign_id) && e.result !== 'not_run'
    );
    assertCanReexecute({ actorRoles, currentResult: closed?.result ?? null });
  }

  const exec = await db.testExecutions.create(data);
  bus.emit('test_execution:created', exec);
  return exec;
}

export async function updateExecution(id, data, userId = null, actorRoles = null) {
  const existing = await db.testExecutions.findById(id);
  if (!existing) throw new AppError('Exécution non trouvée', 404);

  // Une exécution terminée n'est plus modifiable par un testeur simple, y
  // compris pour la rouvrir : c'est une décision du responsable de campagne.
  if (actorRoles) {
    assertCanReexecute({ actorRoles, currentResult: existing.result });
    const testCase = await db.testCases.findById(existing.test_case_id);
    assertCanExecuteAssigned({ assignedTo: testCase?.assigned_to, actorId: userId, actorRoles });
  }

  // Une campagne planifiee, terminee ou archivee n'accepte plus d'execution.
  const campaign = await db.campaigns.findById(existing.campaign_id);
  assertCampaignInProgress(campaign);

  // Séparation des responsabilités : le verdict d'une exécution déjà
  // renseignée ne peut être modifié ou confirmé que par un autre membre que
  // celui qui l'a exécutée (un revolver de verdict doit se prononcer).
  // Réouvrir une exécution (retour à `not_run`, p. ex. après réaffectation d'un
  // cas échoué) n'est ni une saisie ni une confirmation de verdict : la garde
  // ne s'applique donc pas à une remise à zéro.
  if (data.result !== 'not_run') {
    assertCanRecordVerdict({
      executedBy: existing.executed_by,
      actorId: userId,
      currentResult: existing.result,
    });
  }

  const updated = await db.testExecutions.update(id, data);
  if (!updated) throw new AppError('Exécution non trouvée', 404);
  bus.emit('test_execution:updated', updated);
  return updated;
}

export async function deleteExecution(id) {
  const deleted = await db.testExecutions.remove(id);
  if (!deleted) throw new AppError('Exécution non trouvée', 404);
  return deleted;
}

export async function getExecutionStats(campaignId) {
  return db.testExecutions.stats(campaignId);
}
