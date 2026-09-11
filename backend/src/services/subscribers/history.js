import * as db from '../../db/index.js';

// Abonnements du bus d'événements responsables de l'écriture des
// entrées d'audit (historique) en base de données.

export function registerHistorySubscribers(bus) {
  bus.on('campaign:created', async ({ campaign, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'campaign',
        entity_id: campaign.id,
        user_id,
        action_type: 'created',
        description: `Campagne "${campaign.name}" créée`,
      });
    } catch (e) {
      console.error('[events] Erreur history campaign:created', e);
    }
  });

  bus.on('campaign:updated', async ({ campaign_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'campaign',
        entity_id: campaign_id,
        user_id,
        action_type: 'updated',
        description: 'Campagne mise à jour',
      });
    } catch (e) {
      console.error('[events] Erreur history campaign:updated', e);
    }
  });

  bus.on('campaign:deleted', async ({ campaign_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'campaign',
        entity_id: campaign_id,
        user_id,
        action_type: 'deleted',
        description: 'Campagne supprimée',
      });
    } catch (e) {
      console.error('[events] Erreur history campaign:deleted', e);
    }
  });

  bus.on('project:created', async ({ project, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'project',
        entity_id: project.id,
        user_id,
        action_type: 'created',
        description: `Projet "${project.name}" créé`,
      });
    } catch (e) {
      console.error('[events] Erreur history project:created', e);
    }
  });

  bus.on('project:updated', async ({ project_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'project',
        entity_id: project_id,
        user_id,
        action_type: 'updated',
        description: 'Projet mis à jour',
      });
    } catch (e) {
      console.error('[events] Erreur history project:updated', e);
    }
  });

  bus.on('project:deleted', async ({ project_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'project',
        entity_id: project_id,
        user_id,
        action_type: 'deleted',
        description: 'Projet supprimé',
      });
    } catch (e) {
      console.error('[events] Erreur history project:deleted', e);
    }
  });

  bus.on('project:archived', async ({ project, project_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'project',
        entity_id: project_id,
        user_id,
        action_type: 'archived',
        description: `Projet "${project.name || ''}" archivé — campagnes liées archivées`,
      });
    } catch (e) {
      console.error('[events] Erreur history project:archived', e);
    }
  });

  bus.on('anomaly:created', async ({ anomaly, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'anomaly',
        entity_id: anomaly.id,
        user_id,
        action_type: 'created',
        description: `Anomalie signalée : ${anomaly.description?.slice(0, 100)}`,
      });
    } catch (e) {
      console.error('[events] Erreur history anomaly:created', e);
    }
  });

  bus.on('anomaly:status_changed', async ({ anomaly, user_id, new_status }) => {
    try {
      await db.history.addAction({
        entity_type: 'anomaly',
        entity_id: anomaly.id,
        user_id,
        action_type: 'status_changed',
        description: `Anomalie passée en "${new_status}"`,
      });
    } catch (e) {
      console.error('[events] Erreur history anomaly:status_changed', e);
    }
  });

  bus.on('anomaly:resolution_signaled', async ({ anomaly, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'anomaly',
        entity_id: anomaly.id,
        user_id: user_id || null,
        action_type: 'status_changed',
        description: 'Résolution signalée par le développeur',
      });
    } catch (e) {
      console.error('[events] Erreur history anomaly:resolution_signaled', e);
    }
  });

  bus.on('anomaly:rejected', async ({ anomaly, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'anomaly',
        entity_id: anomaly.id,
        user_id: user_id || null,
        action_type: 'status_changed',
        description: 'Résolution rejetée par le testeur — anomalie rouverte',
      });
    } catch (e) {
      console.error('[events] Erreur history anomaly:rejected', e);
    }
  });

  bus.on('anomaly:deleted', async ({ anomaly_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'anomaly',
        entity_id: anomaly_id,
        user_id: user_id || null,
        action_type: 'deleted',
        description: 'Anomalie supprimée',
      });
    } catch (e) {
      console.error('[events] Erreur history anomaly:deleted', e);
    }
  });

  bus.on('feature:status_changed', async ({ feature, user_id, new_status }) => {
    try {
      await db.history.addAction({
        entity_type: 'feature',
        entity_id: feature.id,
        user_id,
        action_type: 'status_changed',
        description: `Fonctionnalité "${feature.name}" passée en "${new_status}"`,
      });
    } catch (e) {
      console.error('[events] Erreur history feature:status_changed', e);
    }
  });

  bus.on('assignment:created', async ({ feature_name, feature_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'feature',
        entity_id: feature_id,
        user_id: user_id || null,
        action_type: 'assigned',
        description: `Fonctionnalité "${feature_name}" assignée au testeur`,
      });
    } catch (e) {
      console.error('[events] Erreur history assignment:created', e);
    }
  });

  bus.on('assignment:reassigned', async ({ feature_name, feature_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'feature',
        entity_id: feature_id,
        user_id: user_id || null,
        action_type: 'assigned',
        description: `Fonctionnalité "${feature_name}" réassignée`,
      });
    } catch (e) {
      console.error('[events] Erreur history assignment:reassigned', e);
    }
  });

  bus.on('assignment:deleted', async ({ assignment, feature_id, user_id }) => {
    try {
      const featureName = assignment?.feature_id ? `#${assignment.feature_id}` : '';
      await db.history.addAction({
        entity_type: 'feature',
        entity_id: feature_id,
        user_id: user_id || null,
        action_type: 'assigned',
        description: `Assignation supprimée pour la fonctionnalité ${featureName}`,
      });
    } catch (e) {
      console.error('[events] Erreur history assignment:deleted', e);
    }
  });

  bus.on('campaignMember:added', async ({ campaign_id, user_id, team_type }) => {
    try {
      await db.history.addAction({
        entity_type: 'campaign',
        entity_id: campaign_id,
        user_id,
        action_type: 'member_added',
        description: `Membre ${team_type} ajouté à la campagne`,
      });
    } catch (e) {
      console.error('[events] Erreur history campaignMember:added', e);
    }
  });

  bus.on('campaignMember:removed', async ({ campaign_id, user_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'campaign',
        entity_id: campaign_id,
        user_id,
        action_type: 'member_removed',
        description: 'Membre retiré de la campagne',
      });
    } catch (e) {
      console.error('[events] Erreur history campaignMember:removed', e);
    }
  });

  bus.on('testCase:created', async ({ feature_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'feature',
        entity_id: feature_id,
        user_id: null,
        action_type: 'test_case_created',
        description: 'Cas de test ajouté',
      });
    } catch (e) {
      console.error('[events] Erreur history testCase:created', e);
    }
  });

  bus.on('testCase:deleted', async ({ feature_id }) => {
    try {
      await db.history.addAction({
        entity_type: 'feature',
        entity_id: feature_id,
        user_id: null,
        action_type: 'test_case_deleted',
        description: 'Cas de test supprimé',
      });
    } catch (e) {
      console.error('[events] Erreur history testCase:deleted', e);
    }
  });
}
