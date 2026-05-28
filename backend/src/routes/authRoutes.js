const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes d'authentification
router.post('/register', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('first_name').notEmpty().withMessage('Le prénom est requis'),
  body('last_name').notEmpty().withMessage('Le nom est requis'),
  body('role').isIn(['admin', 'test_lead', 'tester', 'developer']).withMessage('Rôle invalide')
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
], authController.login);

router.get('/profile', authenticate, authController.getProfile);

// Routes admin de gestion des utilisateurs
router.get('/users', authenticate, authorize('admin'), authController.listUsers);
router.patch('/users/:id/block', authenticate, authorize('admin'), authController.blockUser);
router.patch('/users/:id/unblock', authenticate, authorize('admin'), authController.unblockUser);

module.exports = router;
