import * as notificationService from '../notificationService.js';
import * as db from '../../db/index.js';
import { emitNotification } from '../../socket.js';

// Abonnements du bus d'événements responsables de la création des
// notifications in-app et de leur diffusion en temps réel (socket).

export function registerNotificationSubscribers(bus, io) {
  bus.on('feature:conforme', async ({ feature, campaign_name, test_lead_id }) => {
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: test_lead_id,
        anomaly_id: null,
        notification_type: 'feature_conforme',
        description: `[${campaign_name}] La fonctionnalité "${feature.name}" a été marquée comme conforme`,
        link_url: `/campagnes/${feature.campaign_id}`,
      });
      if (io) emitNotification(io, test_lead_id, notification);
    } catch (e) {
      console.error('[events] Erreur notification feature:conforme', e);
    }
  });

  bus.on('anomaly:created', async ({ anomaly, assigned_to }) => {
    if (!assigned_to) return;
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: assigned_to,
        anomaly_id: anomaly.id,
        notification_type: 'anomaly_reported',
        anomaly_description: anomaly.description,
      });
      if (io) emitNotification(io, assigned_to, notification);
    } catch (e) {
      console.error('[events] Erreur notification anomaly:created', e);
    }
  });

  bus.on('anomaly:validated', async ({ anomaly, campaign_name, test_lead_id }) => {
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: test_lead_id,
        anomaly_id: anomaly.id,
        notification_type: 'anomaly_resolved',
        description: `[${campaign_name}] L'anomalie "${(anomaly.description || '').slice(0, 80)}" a été résolue et validée`,
        link_url: `/anomalies/${anomaly.id}`,
      });
      if (io) emitNotification(io, test_lead_id, notification);
    } catch (e) {
      console.error('[events] Erreur notification anomaly:validated', e);
    }
  });

  bus.on('anomaly:resolution_signaled', async ({ anomaly, reported_by }) => {
    if (!reported_by) return;
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: reported_by,
        anomaly_id: anomaly.id,
        notification_type: 'resolution_signaled',
        anomaly_description: anomaly.description,
      });
      if (io) emitNotification(io, reported_by, notification);
    } catch (e) {
      console.error('[events] Erreur notification anomaly:resolution_signaled', e);
    }
  });

  bus.on('anomaly:rejected', async ({ anomaly, reported_by }) => {
    if (!reported_by) return;
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: reported_by,
        anomaly_id: anomaly.id,
        notification_type: 'reopened',
        anomaly_description: anomaly.description,
      });
      if (io) emitNotification(io, reported_by, notification);
    } catch (e) {
      console.error('[events] Erreur notification anomaly:rejected', e);
    }
  });

  bus.on('assignment:created', async ({ assigned_to, feature_name }) => {
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: assigned_to,
        anomaly_id: null,
        notification_type: 'task_assigned',
        description: `La fonctionnalité "${feature_name}" vous a été assignée`,
        link_url: '/testeur/taches',
      });
      if (io) emitNotification(io, assigned_to, notification);
    } catch (e) {
      console.error('[events] Erreur notification assignment:created', e);
    }
  });

  bus.on('assignment:reassigned', async ({ assigned_to, feature_name }) => {
    try {
      const notification = await notificationService.createNotification({
        notified_user_id: assigned_to,
        anomaly_id: null,
        notification_type: 'task_assigned',
        description: `La fonctionnalité "${feature_name}" vous a été réassignée`,
        link_url: '/testeur/taches',
      });
      if (io) emitNotification(io, assigned_to, notification);
    } catch (e) {
      console.error('[events] Erreur notification assignment:reassigned', e);
    }
  });

  bus.on('campaign:completed', async ({ campaign }) => {
    try {
      const admins = await db.users.listByRole('admin');
      const projectName = campaign.project_name || `Projet #${campaign.project_id}`;
      for (const admin of admins) {
        try {
          const notification = await notificationService.createNotification({
            notified_user_id: admin.id,
            anomaly_id: null,
            notification_type: 'campaign_completed',
            description: `La campagne « ${campaign.name} » (${projectName}) a été marquée comme terminée`,
            link_url: `/campagnes/${campaign.id}`,
          });
          if (io) emitNotification(io, admin.id, notification);
        } catch (e) {
          console.error('[events] Erreur notification campaign:completed admin', e);
        }
      }
    } catch (e) {
      console.error('[events] Erreur campaign:completed', e);
    }
  });

  bus.on('project:created', async ({ project }) => {
    try {
      const leadIds = [...new Set(project.test_lead_ids || [])];
      for (const id of leadIds) {
        const lead = await db.users.findById(id).catch(() => null);
        if (!lead) continue;
        try {
          const notification = await notificationService.createNotification({
            notified_user_id: lead.id,
            anomaly_id: null,
            notification_type: 'project_created',
            description: `Vous avez été ajouté(e) comme chef de test au projet « ${project.name} »`,
            link_url: '/projets',
          });
          if (io) emitNotification(io, lead.id, notification);
        } catch (e) {
          console.error('[events] Erreur notification project:created', e);
        }
      }
    } catch (e) {
      console.error('[events] Erreur project:created', e);
    }
  });

  bus.on('campaignMember:added', async ({ campaign_id, user_id, team_type }) => {
    try {
      const campaign = await db.campaigns.findById(campaign_id);
      if (campaign) {
        const roleLabel = team_type === 'tester' ? 'testeur' : 'développeur';
        const notification = await notificationService.createNotification({
          notified_user_id: user_id,
          anomaly_id: null,
          notification_type: 'member_added',
          description: `Vous avez été ajouté comme ${roleLabel} à la campagne "${campaign.name}"`,
          link_url: `/campagnes/${campaign_id}`,
        });
        if (io) emitNotification(io, user_id, notification);
      }
    } catch (e) {
      console.error('[events] Erreur notification campaignMember:added', e);
    }
  });

  bus.on('user:created', async ({ user }) => {
    try {
      const admins = await db.users.listByRole('admin');
      const roleLabels = { admin: 'Administrateur', chef_testeur: 'Chef testeur', tester: 'Testeur', developer: 'Développeur' };
      const roleLabel = roleLabels[user.role] || user.role;
      for (const admin of admins) {
        if (admin.id === user.id) continue;
        try {
          const notification = await notificationService.createNotification({
            notified_user_id: admin.id,
            anomaly_id: null,
            notification_type: 'member_added',
            description: `Nouveau compte créé : ${user.first_name} ${user.last_name} (${roleLabel})`,
            link_url: '/admin/utilisateurs',
          });
          if (io) emitNotification(io, admin.id, notification);
        } catch (e) {
          console.error('[events] Erreur notification user:created admin', e);
        }
      }
    } catch (e) {
      console.error('[events] Erreur notifications admins user:created', e);
    }
  });

  bus.on('user:password_forgot', async ({ user, admins }) => {
    for (const admin of admins || []) {
      try {
        const notification = await notificationService.createNotification({
          notified_user_id: admin.id,
          anomaly_id: null,
          notification_type: 'password_forgot',
          description: `${user.first_name} ${user.last_name} (${user.email}) a signalé avoir oublié son mot de passe`,
          link_url: '/admin/utilisateurs',
        });
        if (io) emitNotification(io, admin.id, notification);
      } catch (e) {
        console.error('[events] Erreur notification user:password_forgot', e);
      }
    }
  });
}
