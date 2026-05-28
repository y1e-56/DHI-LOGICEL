const Anomaly = require('../models/Anomaly');
const AnomalyNotification = require('../models/AnomalyNotification');
const CampaignMember = require('../models/CampaignMember');
const ActionLog = require('../models/ActionLog');
const Feature = require('../models/Feature');

// Créer une nouvelle anomalie
const createAnomaly = async (req, res) => {
  try {
    const { feature_id, campaign_id, assigned_to, description } = req.body;

    if (!feature_id || !campaign_id || !description) {
      return res.status(400).json({ message: 'La fonctionnalité, la campagne et la description sont obligatoires' });
    }

    // Vérifier que l'utilisateur est un testeur dans cette campagne
    const teamType = await CampaignMember.getTeamType(campaign_id, req.user.id);
    if (teamType !== 'tester' && req.user.role !== 'admin' && req.user.role !== 'test_lead') {
      return res.status(403).json({ message: 'Seuls les testeurs peuvent signaler des anomalies' });
    }

    // Créer l'anomalie
    const anomaly = await Anomaly.create({
      feature_id,
      campaign_id,
      reported_by: req.user.id,
      assigned_to,
      description
    });

    // Mettre à jour le statut de la fonctionnalité à "anomaly_detected"
    await Feature.updateStatus(feature_id, 'anomaly_detected');

    // Créer une notification pour le développeur assigné
    if (assigned_to) {
      await AnomalyNotification.create({
        anomaly_id: anomaly.id,
        notified_user_id: assigned_to,
        notification_type: 'anomaly_reported'
      });
    }

    // Notifier le chef de l'équipe testeur
    const testLeadMembers = await CampaignMember.findByCampaign(campaign_id, 'tester');
    for (const member of testLeadMembers) {
      // Vérifier si c'est un chef testeur (role = test_lead)
      if (member.role === 'test_lead' && member.user_id !== req.user.id) {
        await AnomalyNotification.create({
          anomaly_id: anomaly.id,
          notified_user_id: member.user_id,
          notification_type: 'anomaly_reported'
        });
      }
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      campaign_id: campaign_id,
      action_type: 'anomaly_created',
      entity_type: 'anomaly',
      entity_id: anomaly.id,
      description: `Signalement d'une anomalie sur la fonctionnalité ${feature_id}`,
      ip_address: req.ip
    });

    res.status(201).json({
      message: 'Anomalie signalée avec succès',
      anomaly
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'anomalie:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'anomalie' });
  }
};

// Signaler la résolution d'une anomalie
const signalResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_description } = req.body;

    const anomaly = await Anomaly.findById(id);

    if (!anomaly) {
      return res.status(404).json({ message: 'Anomalie non trouvée' });
    }

    // Vérifier que l'utilisateur est le développeur assigné
    if (anomaly.assigned_to !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seul le développeur assigné peut signaler la résolution' });
    }

    // Signaler la résolution
    const updatedAnomaly = await Anomaly.signalResolution(id, resolution_description);

    // Notifier le testeur qui a signalé l'anomalie
    await AnomalyNotification.create({
      anomaly_id: id,
      notified_user_id: anomaly.reported_by,
      notification_type: 'resolution_signaled'
    });

    // Notifier le chef de l'équipe testeur
    const testLeadMembers = await CampaignMember.findByCampaign(anomaly.campaign_id, 'tester');
    for (const member of testLeadMembers) {
      if (member.role === 'test_lead') {
        await AnomalyNotification.create({
          anomaly_id: id,
          notified_user_id: member.user_id,
          notification_type: 'resolution_signaled'
        });
      }
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      campaign_id: anomaly.campaign_id,
      action_type: 'anomaly_resolution_signaled',
      entity_type: 'anomaly',
      entity_id: parseInt(id),
      description: `Signalement de résolution de l'anomalie ${id}`,
      ip_address: req.ip
    });

    res.json({
      message: 'Résolution signalée avec succès',
      anomaly: updatedAnomaly
    });
  } catch (error) {
    console.error('Erreur lors du signalement de résolution:', error);
    res.status(500).json({ message: 'Erreur lors du signalement de résolution' });
  }
};

// Valider une anomalie (clôturer)
const validateAnomaly = async (req, res) => {
  try {
    const { id } = req.params;

    const anomaly = await Anomaly.findById(id);

    if (!anomaly) {
      return res.status(404).json({ message: 'Anomalie non trouvée' });
    }

    // Vérifier que l'utilisateur est un testeur
    const teamType = await CampaignMember.getTeamType(anomaly.campaign_id, req.user.id);
    if (teamType !== 'tester' && req.user.role !== 'admin' && req.user.role !== 'test_lead') {
      return res.status(403).json({ message: 'Seuls les testeurs peuvent valider les anomalies' });
    }

    // Valider l'anomalie
    const updatedAnomaly = await Anomaly.validate(id);

    // Mettre à jour le statut de la fonctionnalité à "conforme"
    await Feature.updateStatus(anomaly.feature_id, 'conforme');

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      campaign_id: anomaly.campaign_id,
      action_type: 'anomaly_validated',
      entity_type: 'anomaly',
      entity_id: parseInt(id),
      description: `Validation de l'anomalie ${id} - Statut fonctionnalité mis à conforme`,
      ip_address: req.ip
    });

    res.json({
      message: 'Anomalie validée avec succès',
      anomaly: updatedAnomaly
    });
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    res.status(500).json({ message: 'Erreur lors de la validation' });
  }
};

// Rejeter une résolution (réouvrir)
const rejectAnomaly = async (req, res) => {
  try {
    const { id } = req.params;

    const anomaly = await Anomaly.findById(id);

    if (!anomaly) {
      return res.status(404).json({ message: 'Anomalie non trouvée' });
    }

    // Vérifier que l'utilisateur est un testeur
    const teamType = await CampaignMember.getTeamType(anomaly.campaign_id, req.user.id);
    if (teamType !== 'tester' && req.user.role !== 'admin' && req.user.role !== 'test_lead') {
      return res.status(403).json({ message: 'Seuls les testeurs peuvent rejeter les résolutions' });
    }

    // Rejeter l'anomalie
    const updatedAnomaly = await Anomaly.reject(id);

    // Notifier le développeur assigné
    if (updatedAnomaly.assigned_to) {
      await AnomalyNotification.create({
        anomaly_id: id,
        notified_user_id: updatedAnomaly.assigned_to,
        notification_type: 'reopened'
      });
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      campaign_id: anomaly.campaign_id,
      action_type: 'anomaly_reopened',
      entity_type: 'anomaly',
      entity_id: parseInt(id),
      description: `Réouverture de l'anomalie ${id}`,
      ip_address: req.ip
    });

    res.json({
      message: 'Anomalie réouverte avec succès',
      anomaly: updatedAnomaly
    });
  } catch (error) {
    console.error('Erreur lors du rejet:', error);
    res.status(500).json({ message: 'Erreur lors du rejet' });
  }
};

// Lister les anomalies d'une campagne
const getCampaignAnomalies = async (req, res) => {
  try {
    const { campaign_id } = req.params;
    const { status, reported_by, assigned_to } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (reported_by) filters.reported_by = parseInt(reported_by);
    if (assigned_to) filters.assigned_to = parseInt(assigned_to);

    const anomalies = await Anomaly.findByCampaign(campaign_id, filters);
    res.json(anomalies);
  } catch (error) {
    console.error('Erreur lors de la récupération des anomalies:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des anomalies' });
  }
};

// Lister les anomalies assignées à un développeur
const getMyAnomalies = async (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};

    if (status) filters.status = status;

    const anomalies = await Anomaly.findByAssignee(req.user.id, filters);

    // RG-06: Vérifier que le développeur est membre des campagnes des anomalies
    const filteredAnomalies = [];
    for (const anomaly of anomalies) {
      const isMember = await CampaignMember.isMember(anomaly.campaign_id, req.user.id);
      if (isMember) {
        filteredAnomalies.push(anomaly);
      }
    }

    res.json(filteredAnomalies);
  } catch (error) {
    console.error('Erreur lors de la récupération des anomalies:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des anomalies' });
  }
};

// Lister les anomalies signalées par un testeur
const getReportedAnomalies = async (req, res) => {
  try {
    const { status } = req.query;
    const filters = {};

    if (status) filters.status = status;

    const anomalies = await Anomaly.findByReporter(req.user.id, filters);
    res.json(anomalies);
  } catch (error) {
    console.error('Erreur lors de la récupération des anomalies:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des anomalies' });
  }
};

// Obtenir une anomalie par ID
const getAnomaly = async (req, res) => {
  try {
    const { id } = req.params;
    const anomaly = await Anomaly.findById(id);

    if (!anomaly) {
      return res.status(404).json({ message: 'Anomalie non trouvée' });
    }

    res.json(anomaly);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'anomalie:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'anomalie' });
  }
};

// Lister les notifications d'un utilisateur
const getNotifications = async (req, res) => {
  try {
    const { unread_only } = req.query;
    const unreadOnly = unread_only === 'true';

    const notifications = await AnomalyNotification.findByUser(req.user.id, unreadOnly);
    res.json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
  }
};

// Compter les notifications non lues
const getUnreadCount = async (req, res) => {
  try {
    const count = await AnomalyNotification.countUnread(req.user.id);
    res.json({ count });
  } catch (error) {
    console.error('Erreur lors du comptage des notifications:', error);
    res.status(500).json({ message: 'Erreur lors du comptage des notifications' });
  }
};

// Marquer une notification comme lue
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await AnomalyNotification.markAsRead(id);
    res.json(notification);
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    res.status(500).json({ message: 'Erreur lors du marquage comme lu' });
  }
};

// Marquer toutes les notifications comme lues
const markAllAsRead = async (req, res) => {
  try {
    await AnomalyNotification.markAllAsRead(req.user.id);
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    res.status(500).json({ message: 'Erreur lors du marquage comme lu' });
  }
};

module.exports = {
  createAnomaly,
  signalResolution,
  validateAnomaly,
  rejectAnomaly,
  getCampaignAnomalies,
  getMyAnomalies,
  getReportedAnomalies,
  getAnomaly,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead
};
