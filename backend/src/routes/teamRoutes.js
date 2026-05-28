const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const teamController = require('../controllers/teamController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes pour la gestion des équipes (Module 3)
router.post('/members', authenticate, authorize('admin', 'test_lead'), [
  body('campaign_id').isInt().withMessage('ID de la campagne invalide'),
  body('user_id').isInt().withMessage('ID de l\'utilisateur invalide'),
  body('team_type').isIn(['tester', 'developer']).withMessage('Type d\'équipe invalide')
], teamController.addMember);

router.delete('/members/:campaign_id/:user_id', authenticate, authorize('admin', 'test_lead'), teamController.removeMember);

router.get('/campaigns/:campaign_id/members', authenticate, teamController.getCampaignMembers);

router.get('/users/:user_id/campaigns', authenticate, teamController.getUserCampaigns);

router.get('/campaigns/:campaign_id/users/:user_id/check', authenticate, teamController.checkMembership);

module.exports = router;
