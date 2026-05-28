const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes pour la gestion des projets (Module 1)
// Seuls les admins et les chefs de projet peuvent créer/modifier/supprimer des projets
router.post('/', authenticate, authorize('admin', 'test_lead'), [
  body('name').notEmpty().withMessage('Le nom du projet est requis'),
  body('start_date').isDate().withMessage('Date de début invalide')
], projectController.createProject);

router.get('/', authenticate, projectController.getProjects);

router.get('/:id', authenticate, projectController.getProject);

router.put('/:id', authenticate, authorize('admin', 'test_lead'), [
  body('name').optional().notEmpty().withMessage('Le nom du projet ne peut pas être vide'),
  body('start_date').optional().isDate().withMessage('Date de début invalide')
], projectController.updateProject);

router.patch('/:id/archive', authenticate, authorize('admin', 'test_lead'), projectController.archiveProject);

router.delete('/:id', authenticate, authorize('admin'), projectController.deleteProject);

module.exports = router;
