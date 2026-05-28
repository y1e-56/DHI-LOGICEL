const CampaignMember = require('../models/CampaignMember');
const ActionLog = require('../models/ActionLog');

// Ajouter un membre à une campagne
const addMember = async (req, res) => {
  try {
    const { campaign_id, user_id, team_type } = req.body;

    // Validation des données
    if (!campaign_id || !user_id || !team_type) {
      return res.status(400).json({ message: 'La campagne, l\'utilisateur et le type d\'équipe sont obligatoires' });
    }

    // Valider le type d'équipe
    if (!['tester', 'developer'].includes(team_type)) {
      return res.status(400).json({ message: 'Le type d\'équipe doit être "tester" ou "developer"' });
    }

    // Vérifier si le membre existe déjà
    const existingMember = await CampaignMember.isMember(campaign_id, user_id);
    if (existingMember) {
      return res.status(400).json({ message: 'Cet utilisateur est déjà membre de cette campagne' });
    }

    // Ajouter le membre
    const member = await CampaignMember.add({
      campaign_id,
      user_id,
      team_type
    });

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      campaign_id: campaign_id,
      action_type: 'member_added',
      entity_type: 'campaign_member',
      entity_id: member.id,
      description: `Ajout d'un membre ${team_type} à la campagne`,
      ip_address: req.ip
    });

    res.status(201).json({
      message: 'Membre ajouté avec succès',
      member
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du membre:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout du membre' });
  }
};

// Retirer un membre d'une campagne
const removeMember = async (req, res) => {
  try {
    const { campaign_id, user_id } = req.params;

    const member = await CampaignMember.remove(campaign_id, user_id);

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Logger l'action
    await ActionLog.create({
      user_id: req.user.id,
      campaign_id: campaign_id,
      action_type: 'member_removed',
      entity_type: 'campaign_member',
      entity_id: member.id,
      description: `Retrait d'un membre de la campagne`,
      ip_address: req.ip
    });

    res.json({
      message: 'Membre retiré avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du retrait du membre:', error);
    res.status(500).json({ message: 'Erreur lors du retrait du membre' });
  }
};

// Lister les membres d'une campagne
const getCampaignMembers = async (req, res) => {
  try {
    const { campaign_id } = req.params;
    const { team_type } = req.query;

    const members = await CampaignMember.findByCampaign(campaign_id, team_type);
    res.json(members);
  } catch (error) {
    console.error('Erreur lors de la récupération des membres:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des membres' });
  }
};

// Lister les campagnes d'un utilisateur
const getUserCampaigns = async (req, res) => {
  try {
    const { user_id } = req.params;

    const campaigns = await CampaignMember.findByUser(user_id);
    res.json(campaigns);
  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des campagnes' });
  }
};

// Vérifier si un utilisateur est membre d'une campagne
const checkMembership = async (req, res) => {
  try {
    const { campaign_id, user_id } = req.params;

    const isMember = await CampaignMember.isMember(campaign_id, user_id);
    const teamType = isMember ? await CampaignMember.getTeamType(campaign_id, user_id) : null;

    res.json({
      is_member: isMember,
      team_type: teamType
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du membership:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification du membership' });
  }
};

module.exports = {
  addMember,
  removeMember,
  getCampaignMembers,
  getUserCampaigns,
  checkMembership
};
