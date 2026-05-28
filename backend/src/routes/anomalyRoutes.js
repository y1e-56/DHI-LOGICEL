const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const anomalyController = require('../controllers/anomalyController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes pour la gestion des anomalies (Module 5)
router.post('/', authenticate, authorize('admin', 'test_lead', 'tester'), [
  body('feature_id').isInt().withMessage('ID de la fonctionnalité invalide'),
  body('campaign_id').isInt().withMessage('ID de la campagne invalide'),
  body('description').notEmpty().withMessage('La description est obligatoire'),
  body('assigned_to').optional().isInt().withMessage('ID du développeur invalide')
], anomalyController.createAnomaly);

router.get('/campaigns/:campaign_id', authenticate, anomalyController.getCampaignAnomalies);

router.get('/my-anomalies', authenticate, authorize('admin', 'developer'), anomalyController.getMyAnomalies);

router.get('/reported', authenticate, authorize('admin', 'test_lead', 'tester'), anomalyController.getReportedAnomalies);

router.get('/:id', authenticate, anomalyController.getAnomaly);

router.patch('/:id/signal-resolution', authenticate, authorize('admin', 'developer'), [
  body('resolution_description').optional()
], anomalyController.signalResolution);

router.patch('/:id/validate', authenticate, authorize('admin', 'test_lead', 'tester'), anomalyController.validateAnomaly);

router.patch('/:id/reject', authenticate, authorize('admin', 'test_lead', 'tester'), anomalyController.rejectAnomaly);

// Routes pour les notifications
router.get('/notifications/my', authenticate, anomalyController.getNotifications);

router.get('/notifications/unread-count', authenticate, anomalyController.getUnreadCount);

router.patch('/notifications/:id/read', authenticate, anomalyController.markNotificationAsRead);

router.patch('/notifications/mark-all-read', authenticate, anomalyController.markAllAsRead);

module.exports = router;
