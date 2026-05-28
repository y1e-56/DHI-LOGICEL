const Feature = require('../models/Feature');
const CampaignMember = require('../models/CampaignMember');
const ActionLog = require('../models/ActionLog');

// Mettre à jour le statut d'une fonctionnalité (RG-01: Seuls les testeurs peuvent le faire)
const updateFeatureStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation du statut
    if (!['conforme', 'anomaly_detected'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide. Doit être "conforme" ou "anomaly_detected"' });
    }

    // Récupérer la fonctionnalité
    const feature = await Feature.findById(id);

    if (!feature) {
      return res.status(404).json({ message: 'Fonctionnalité non trouvée' });
    }

    // RG-01: Vérifier que l'utilisateur est un testeur dans cette campagne
    const teamType = await CampaignMember.getTeamType(feature.campaign_id, req.user.id);
    if (teamType !== 'tester' && req.user.role !== 'admin' && req.user.role !== 'test_lead') {
      return res.status(403).json({ message: 'RG-01: Seuls les membres de l\'équipe testeur peuvent modifier le statut d\'une fonctionnalité' });
    }

    // Mettre à jour le statut
    const updatedFeature = await Feature.updateStatus(id, status);

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      campaign_id: feature.campaign_id,
      action_type: 'feature_status_updated',
      entity_type: 'feature',
      entity_id: parseInt(id),
      description: `Mise à jour du statut de la fonctionnalité à ${status}`,
      ip_address: req.ip
    });

    res.json({
      message: 'Statut de la fonctionnalité mis à jour avec succès',
      feature: updatedFeature
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
  }
};

// Obtenir le statut d'une fonctionnalité
const getFeatureStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const feature = await Feature.findById(id);

    if (!feature) {
      return res.status(404).json({ message: 'Fonctionnalité non trouvée' });
    }

    res.json({
      id: feature.id,
      name: feature.name,
      status: feature.status
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du statut' });
  }
};

module.exports = {
  updateFeatureStatus,
  getFeatureStatus
};
