const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const featureStatusController = require('../controllers/featureStatusController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes pour la gestion du statut des fonctionnalités (RG-01)
router.patch('/:id/status', authenticate, authorize('admin', 'test_lead', 'tester'), [
  body('status').isIn(['conforme', 'anomaly_detected']).withMessage('Statut invalide')
], featureStatusController.updateFeatureStatus);

router.get('/:id/status', authenticate, featureStatusController.getFeatureStatus);

module.exports = router;
