const TaskAssignment = require('../models/TaskAssignment');
const Feature = require('../models/Feature');
const ActionLog = require('../models/ActionLog');
const CampaignMember = require('../models/CampaignMember');

// Créer une fonctionnalité
const createFeature = async (req, res) => {
  try {
    const { campaign_id, name, description, priority } = req.body;

    if (!campaign_id || !name) {
      return res.status(400).json({ message: 'La campagne et le nom sont obligatoires' });
    }

    const feature = await Feature.create({
      campaign_id,
      name,
      description,
      priority: priority || 'medium'
    });

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      campaign_id: campaign_id,
      action_type: 'feature_created',
      entity_type: 'feature',
      entity_id: feature.id,
      description: `Création de la fonctionnalité ${name}`,
      ip_address: req.ip
    });

    res.status(201).json({
      message: 'Fonctionnalité créée avec succès',
      feature
    });
  } catch (error) {
    console.error('Erreur lors de la création de la fonctionnalité:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la fonctionnalité' });
  }
};

// Assigner une tâche
const assignTask = async (req, res) => {
  try {
    const { feature_id, assigned_to } = req.body;

    if (!feature_id || !assigned_to) {
      return res.status(400).json({ message: 'La fonctionnalité et l\'assignataire sont obligatoires' });
    }

    const assignment = await TaskAssignment.create({
      feature_id,
      assigned_to,
      assigned_by: req.user.id
    });

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      action_type: 'task_assigned',
      entity_type: 'task_assignment',
      entity_id: assignment.id,
      description: `Assignation de la tâche à l'utilisateur ID ${assigned_to}`,
      ip_address: req.ip
    });

    res.status(201).json({
      message: 'Tâche assignée avec succès',
      assignment
    });
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la tâche:', error);
    res.status(500).json({ message: 'Erreur lors de l\'assignation de la tâche' });
  }
};

// Mettre à jour le statut d'une tâche
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const assignment = await TaskAssignment.updateStatus(id, status);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignation non trouvée' });
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      action_type: 'task_status_updated',
      entity_type: 'task_assignment',
      entity_id: parseInt(id),
      description: `Mise à jour du statut de la tâche à ${status}`,
      ip_address: req.ip
    });

    res.json({
      message: 'Statut de la tâche mis à jour avec succès',
      assignment
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
  }
};

// Réassigner une tâche
const reassignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_assigned_to } = req.body;

    if (!new_assigned_to) {
      return res.status(400).json({ message: 'Le nouvel assignataire est obligatoire' });
    }

    const assignment = await TaskAssignment.reassign(id, new_assigned_to, req.user.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignation non trouvée' });
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      action_type: 'task_reassigned',
      entity_type: 'task_assignment',
      entity_id: parseInt(id),
      description: `Réassignation de la tâche à l'utilisateur ID ${new_assigned_to}`,
      ip_address: req.ip
    });

    res.json({
      message: 'Tâche réassignée avec succès',
      assignment
    });
  } catch (error) {
    console.error('Erreur lors de la réassignation:', error);
    res.status(500).json({ message: 'Erreur lors de la réassignation' });
  }
};

// Lister les tâches assignées à un utilisateur
const getMyTasks = async (req, res) => {
  try {
    const { status, campaign_id } = req.query;
    const filters = {};

    if (status) {
      filters.status = status;
    }

    if (campaign_id) {
      filters.campaign_id = parseInt(campaign_id);
    }

    const tasks = await TaskAssignment.findByAssignee(req.user.id, filters);
    res.json(tasks);
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tâches' });
  }
};

// Lister toutes les tâches d'une campagne
const getCampaignTasks = async (req, res) => {
  try {
    const { campaign_id } = req.params;

    // Vérifier que l'utilisateur est membre de la campagne (sauf admin)
    if (req.user.role !== 'admin') {
      const isMember = await CampaignMember.isMember(campaign_id, req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: 'Vous n\'êtes pas membre de cette campagne' });
      }
    }

    const tasks = await TaskAssignment.findByCampaign(campaign_id);
    res.json(tasks);
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tâches' });
  }
};

// Lister les fonctionnalités d'une campagne
const getCampaignFeatures = async (req, res) => {
  try {
    const { campaign_id } = req.params;

    // Vérifier que l'utilisateur est membre de la campagne (sauf admin)
    if (req.user.role !== 'admin') {
      const isMember = await CampaignMember.isMember(campaign_id, req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: 'Vous n\'êtes pas membre de cette campagne' });
      }
    }

    const features = await Feature.findByCampaign(campaign_id);
    res.json(features);
  } catch (error) {
    console.error('Erreur lors de la récupération des fonctionnalités:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des fonctionnalités' });
  }
};

// Supprimer une assignation
const deleteTaskAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await TaskAssignment.delete(id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignation non trouvée' });
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      action_type: 'task_assignment_deleted',
      entity_type: 'task_assignment',
      entity_id: parseInt(id),
      description: `Suppression de l'assignation de tâche`,
      ip_address: req.ip
    });

    res.json({
      message: 'Assignation supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

module.exports = {
  createFeature,
  assignTask,
  updateTaskStatus,
  reassignTask,
  getMyTasks,
  getCampaignTasks,
  getCampaignFeatures,
  deleteTaskAssignment
};
