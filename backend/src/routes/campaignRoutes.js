const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const campaignController = require('../controllers/campaignController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes pour la gestion des campagnes (Module 2)
router.post('/', authenticate, authorize('admin', 'test_lead'), [
  body('project_id').isInt().withMessage('ID du projet invalide'),
  body('name').notEmpty().withMessage('Le nom de la campagne est requis'),
  body('start_date').isDate().withMessage('Date de début invalide'),
  body('organization_mode').optional().isIn(['features', 'modules']).withMessage('Mode d\'organisation invalide')
], campaignController.createCampaign);

router.get('/', authenticate, campaignController.getCampaigns);

router.get('/:id', authenticate, campaignController.getCampaign);

router.get('/:id/statistics', authenticate, campaignController.getCampaignStatistics);

router.put('/:id', authenticate, authorize('admin', 'test_lead'), [
  body('name').optional().notEmpty().withMessage('Le nom de la campagne ne peut pas être vide'),
  body('start_date').optional().isDate().withMessage('Date de début invalide')
], campaignController.updateCampaign);

router.delete('/:id', authenticate, authorize('admin', 'test_lead'), campaignController.deleteCampaign);

module.exports = router;
