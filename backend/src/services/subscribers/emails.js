import { sendEmail, canSendLoginEmail } from '../emailService.js';
import {
  taskAssignedEmail,
  anomalyAssignedEmail,
  resolutionSignaledEmail,
  anomalyRejectedEmail,
  anomalyValidatedEmail,
  featureConformeEmail,
  projectCreatedEmail,
  campaignCreatedEmail,
  campaignCompletedEmail,
  loginNotificationEmail,
  userCreatedEmail,
  passwordForgotAdminEmail,
  passwordResetByAdminEmail,
} from '../emailTemplates.js';
import * as db from '../../db/index.js';

// Abonnements du bus d'événements responsables de l'envoi des emails.

const APP_URL = () => process.env.APP_URL || 'http://localhost:5173';

export function registerEmailSubscribers(bus) {
  bus.on('feature:conforme', async ({ feature, campaign_name, test_lead_id }) => {
    try {
      const lead = await db.users.findById(test_lead_id);
      if (lead?.email) {
        await sendEmail({
          to: lead.email,
          subject: `Fonctionnalité conforme — ${feature.name}`,
          html: featureConformeEmail({
            userFirstName: lead.first_name,
            featureName: feature.name,
            campaignName: campaign_name || '',
            linkUrl: `${APP_URL()}/campagnes/${feature.campaign_id}`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi feature:conforme', e);
    }
  });

  bus.on('anomaly:created', async ({ anomaly, assigned_to }) => {
    if (!assigned_to) return;
    try {
      const dev = await db.users.findById(assigned_to);
      if (dev?.email) {
        let featureName = `#${anomaly.feature_id}`;
        try {
          const feat = await db.features.findById(anomaly.feature_id);
          if (feat) featureName = feat.name;
        } catch {}
        await sendEmail({
          to: dev.email,
          subject: `Anomalie assignée — ${anomaly.description?.slice(0, 60)}`,
          html: anomalyAssignedEmail({
            userFirstName: dev.first_name,
            anomalyDescription: anomaly.description || '',
            featureName,
            linkUrl: `${APP_URL()}/developpeur/anomalies`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi anomaly:created', e);
    }
  });

  bus.on('anomaly:validated', async ({ anomaly, campaign_name, test_lead_id }) => {
    try {
      const lead = await db.users.findById(test_lead_id);
      if (lead?.email) {
        await sendEmail({
          to: lead.email,
          subject: `Anomalie résolue — #${anomaly.id}`,
          html: anomalyValidatedEmail({
            userFirstName: lead.first_name,
            anomalyDescription: anomaly.description || '',
            campaignName: campaign_name || '',
            linkUrl: `${APP_URL()}/anomalies/${anomaly.id}`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi anomaly:validated', e);
    }
  });

  bus.on('anomaly:resolution_signaled', async ({ anomaly, reported_by }) => {
    if (!reported_by) return;
    try {
      const tester = await db.users.findById(reported_by);
      if (tester?.email) {
        const dev = anomaly.assigned_to ? await db.users.findById(anomaly.assigned_to).catch(() => null) : null;
        await sendEmail({
          to: tester.email,
          subject: `Résolution signalée — anomalie #${anomaly.id}`,
          html: resolutionSignaledEmail({
            userFirstName: tester.first_name,
            anomalyDescription: anomaly.description || '',
            devName: dev ? `${dev.first_name} ${dev.last_name}` : 'Le développeur',
            linkUrl: `${APP_URL()}/anomalies/${anomaly.id}`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi anomaly:resolution_signaled', e);
    }
  });

  bus.on('anomaly:rejected', async ({ anomaly, reported_by }) => {
    if (!reported_by) return;
    try {
      const tester = await db.users.findById(reported_by);
      if (tester?.email && anomaly.assigned_to) {
        const dev = await db.users.findById(anomaly.assigned_to).catch(() => null);
        await sendEmail({
          to: tester.email,
          subject: `Résolution rejetée — anomalie #${anomaly.id}`,
          html: anomalyRejectedEmail({
            userFirstName: dev ? dev.first_name : 'Développeur',
            anomalyDescription: anomaly.description || '',
            testerName: `${tester.first_name} ${tester.last_name}`,
            linkUrl: `${APP_URL()}/anomalies/${anomaly.id}`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi anomaly:rejected', e);
    }
  });

  bus.on('assignment:created', async ({ assigned_to, feature_name, campaign_name }) => {
    try {
      const tester = await db.users.findById(assigned_to);
      if (tester?.email) {
        await sendEmail({
          to: tester.email,
          subject: `Nouvelle tâche — ${feature_name}`,
          html: taskAssignedEmail({
            userFirstName: tester.first_name,
            featureName: feature_name || '',
            campaignName: campaign_name || '',
            linkUrl: `${APP_URL()}/testeur/taches`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi assignment:created', e);
    }
  });

  bus.on('assignment:reassigned', async ({ assigned_to, feature_name, campaign_name }) => {
    try {
      const tester = await db.users.findById(assigned_to);
      if (tester?.email) {
        await sendEmail({
          to: tester.email,
          subject: `Tâche réassignée — ${feature_name}`,
          html: taskAssignedEmail({
            userFirstName: tester.first_name,
            featureName: feature_name || '',
            campaignName: campaign_name || '',
            linkUrl: `${APP_URL()}/testeur/taches`,
          }),
        });
      }
    } catch (e) {
      console.error('[email] Erreur envoi assignment:reassigned', e);
    }
  });

  bus.on('campaign:created', async ({ campaign, project_name }) => {
    try {
      const projectName = project_name || `#${campaign.project_id}`;
      const allMemberIds = [...(campaign.testers || []), ...(campaign.developers || [])];
      const uniqueIds = [...new Set(allMemberIds)];

      for (const userId of uniqueIds) {
        const user = await db.users.findById(userId).catch(() => null);
        if (!user?.email) continue;

        const isTester = (campaign.testers || []).includes(userId);
        const roleLabel = isTester ? 'testeur' : 'développeur';

        await sendEmail({
          to: user.email,
          subject: `Nouvelle campagne — ${campaign.name}`,
          html: campaignCreatedEmail({
            userFirstName: user.first_name,
            campaignName: campaign.name,
            projectName,
            campaignLink: `${APP_URL()}/campagnes/${campaign.id}`,
            roleLabel,
          }),
        }).catch(e => console.error('[email] Erreur envoi campaign:created à', user.email, e.message));
      }
    } catch (e) {
      console.error('[email] Erreur campaign:created', e);
    }
  });

  bus.on('campaign:completed', async ({ campaign }) => {
    try {
      const admins = await db.users.listByRole('admin');
      const projectName = campaign.project_name || `Projet #${campaign.project_id}`;
      const linkUrl = `${APP_URL()}/campagnes/${campaign.id}`;

      for (const admin of admins) {
        if (admin.email) {
          try {
            await sendEmail({
              to: admin.email,
              subject: `Campagne terminée — ${campaign.name}`,
              html: campaignCompletedEmail({
                adminFirstName: admin.first_name,
                campaignName: campaign.name,
                projectName,
                linkUrl,
              }),
            });
          } catch (e) {
            console.error('[email] Erreur envoi campaign:completed admin', e);
          }
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

        if (lead.email) {
          await sendEmail({
            to: lead.email,
            subject: `Nouveau projet — ${project.name}`,
            html: projectCreatedEmail({
              userFirstName: lead.first_name,
              projectName: project.name,
              linkUrl: `${APP_URL()}/projets`,
            }),
          }).catch(e => console.error('[email] Erreur envoi project:created à', lead.email, e.message));
        }
      }
    } catch (e) {
      console.error('[events] Erreur project:created', e);
    }
  });

  bus.on('user:created', async ({ user, password }) => {
    if (user?.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Votre compte DHI Test Tracking',
          html: userCreatedEmail({
            userFirstName: user.first_name,
            email: user.email,
            password,
            linkUrl: APP_URL(),
          }),
        });
      } catch (e) {
        console.error('[email] Erreur envoi user:created (utilisateur)', e);
      }
    }

    try {
      const admins = await db.users.listByRole('admin');
      for (const admin of admins) {
        if (admin.id === user.id) continue;
        if (admin.email) {
          try {
            await sendEmail({
              to: admin.email,
              subject: `Nouveau compte — ${user.first_name} ${user.last_name}`,
              html: userCreatedEmail({
                userFirstName: admin.first_name,
                email: user.email,
                password: `[confidentiel — envoyé à ${user.email}]`,
                linkUrl: `${APP_URL()}/admin/utilisateurs`,
              }),
            });
          } catch (e) {
            console.error('[email] Erreur envoi user:created admin', e);
          }
        }
      }
    } catch (e) {
      console.error('[events] Erreur notifications admins user:created', e);
    }
  });

  bus.on('user:logged_in', async ({ user, ip }) => {
    if (!user?.email) return;
    if (!canSendLoginEmail(user.id)) return;

    try {
      const now = new Date();
      await sendEmail({
        to: user.email,
        subject: 'Connexion à votre compte DHI Test Tracking',
        html: loginNotificationEmail({
          userFirstName: user.first_name,
          date: now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          ip: ip || 'Inconnue',
        }),
      });
    } catch (e) {
      console.error('[email] Erreur envoi user:logged_in', e);
    }
  });

  bus.on('user:password_forgot', async ({ user, admins }) => {
    for (const admin of admins || []) {
      try {
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject: `Mot de passe oublié — ${user.first_name} ${user.last_name}`,
            html: passwordForgotAdminEmail({
              adminFirstName: admin.first_name,
              userFullName: `${user.first_name} ${user.last_name}`,
              userEmail: user.email,
              linkUrl: `${APP_URL()}/admin/utilisateurs`,
            }),
          });
        }
      } catch (e) {
        console.error('[email] Erreur envoi user:password_forgot', e);
      }
    }
  });

  bus.on('user:password_reset_by_admin', async ({ user, tempPassword }) => {
    if (!user?.email) return;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Votre mot de passe a été réinitialisé',
        html: passwordResetByAdminEmail({
          userFirstName: user.first_name,
          tempPassword,
          linkUrl: APP_URL(),
        }),
      });
    } catch (e) {
      console.error('[email] Erreur envoi user:password_reset_by_admin', e);
    }
  });
}
