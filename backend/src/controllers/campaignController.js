const Campaign = require('../models/Campaign');
const ActionLog = require('../models/ActionLog');

// Créer une nouvelle campagne
const createCampaign = async (req, res) => {
  try {
    const { project_id, name, objective, organization_mode, start_date, end_date } = req.body;

    // Validation des données
    if (!project_id || !name || !start_date) {
      return res.status(400).json({ message: 'Le projet, le nom et la date de début sont obligatoires' });
    }

    // Valider le mode d'organisation
    if (organization_mode && !['features', 'modules'].includes(organization_mode)) {
      return res.status(400).json({ message: 'Le mode d\'organisation doit être "features" ou "modules"' });
    }

    // Créer la campagne
    const campaign = await Campaign.create({
      project_id,
      name,
      objective,
      organization_mode: organization_mode || 'features',
      start_date,
      end_date,
      created_by: req.user.id
    });

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      campaign_id: campaign.id,
      action_type: 'campaign_created',
      entity_type: 'campaign',
      entity_id: campaign.id,
      description: `Création de la campagne ${name}`,
      ip_address: req.ip
    });

    res.status(201).json({
      message: 'Campagne créée avec succès',
      campaign
    });
  } catch (error) {
    console.error('Erreur lors de la création de la campagne:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la campagne' });
  }
};

// Obtenir une campagne par ID
const getCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Erreur lors de la récupération de la campagne:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la campagne' });
  }
};

// Mettre à jour une campagne
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, objective, start_date, end_date } = req.body;

    const campaign = await Campaign.update(id, {
      name,
      objective,
      start_date,
      end_date
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      campaign_id: campaign.id,
      action_type: 'campaign_updated',
      entity_type: 'campaign',
      entity_id: campaign.id,
      description: `Mise à jour de la campagne ${name}`,
      ip_address: req.ip
    });

    res.json({
      message: 'Campagne mise à jour avec succès',
      campaign
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la campagne:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la campagne' });
  }
};

// Lister toutes les campagnes
const getCampaigns = async (req, res) => {
  try {
    const { project_id } = req.query;
    const filters = {};

    if (project_id) {
      filters.project_id = parseInt(project_id);
    }

    const campaigns = await Campaign.findAll(filters);
    res.json(campaigns);
  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des campagnes' });
  }
};

// Supprimer une campagne
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.delete(id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      action_type: 'campaign_deleted',
      entity_type: 'campaign',
      entity_id: parseInt(id),
      description: `Suppression de la campagne ID ${id}`,
      ip_address: req.ip
    });

    res.json({
      message: 'Campagne supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la campagne:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la campagne' });
  }
};

// Obtenir les statistiques d'une campagne
const getCampaignStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const statistics = await Campaign.getStatistics(id);

    if (!statistics) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    res.json(statistics);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};

module.exports = {
  createCampaign,
  getCampaign,
  updateCampaign,
  getCampaigns,
  deleteCampaign,
  getCampaignStatistics
};
