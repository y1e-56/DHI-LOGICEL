const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, authorize } = require('../middleware/auth');

// Health check public (utile pour le frontend savoir si l'IA est dispo)
router.get('/health', aiController.health);

// Toutes les autres routes nécessitent l'authentification
router.use(authenticate);

// Suggestion de priorité d'anomalie - accessible aux testeurs, chefs de test, admins
router.post(
  '/suggest-priority',
  authorize('admin', 'test_lead', 'tester'),
  aiController.suggestPriority
);

// Suggestion de développeur - réservé aux chefs de test et admins (qui assignent)
router.post(
  '/suggest-developer',
  authorize('admin', 'test_lead'),
  aiController.suggestDeveloper
);

// Détection de doublons - accessible aux testeurs, chefs de test, admins
router.post(
  '/detect-duplicates',
  authorize('admin', 'test_lead', 'tester'),
  aiController.detectDuplicates
);

module.exports = router;
