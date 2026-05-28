const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes pour l'assignation des tâches (Module 4)
router.post('/features', authenticate, authorize('admin', 'test_lead'), [
  body('campaign_id').isInt().withMessage('ID de la campagne invalide'),
  body('name').notEmpty().withMessage('Le nom de la fonctionnalité est requis'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Priorité invalide')
], taskController.createFeature);

router.post('/assignments', authenticate, authorize('admin', 'test_lead'), [
  body('feature_id').isInt().withMessage('ID de la fonctionnalité invalide'),
  body('assigned_to').isInt().withMessage('ID de l\'assignataire invalide')
], taskController.assignTask);

router.get('/my-tasks', authenticate, taskController.getMyTasks);

router.get('/campaigns/:campaign_id/tasks', authenticate, taskController.getCampaignTasks);

router.get('/campaigns/:campaign_id/features', authenticate, taskController.getCampaignFeatures);

router.patch('/assignments/:id/status', authenticate, [
  body('status').isIn(['pending', 'in_progress', 'completed']).withMessage('Statut invalide')
], taskController.updateTaskStatus);

router.patch('/assignments/:id/reassign', authenticate, authorize('admin', 'test_lead'), [
  body('new_assigned_to').isInt().withMessage('ID de l\'assignataire invalide')
], taskController.reassignTask);

router.delete('/assignments/:id', authenticate, authorize('admin', 'test_lead'), taskController.deleteTaskAssignment);

module.exports = router;
