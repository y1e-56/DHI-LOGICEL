import { Router } from 'express';
import { z } from 'zod';
import * as authService from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  role: z.enum(['admin', 'test_lead', 'tester', 'developer']),
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

router.post('/register', async (req, res) => {
  const data = registerSchema.parse(req.body);
  const user = await authService.register(data.email, data.password, data.first_name, data.last_name, data.role);
  res.status(201).json({ user });
});

router.post('/login', async (req, res) => {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data.email, data.password);
  res.json(result);
});

router.get('/profile', authenticate, async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json(user);
});

router.get('/me', authenticate, async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json(user);
});

router.put('/me', authenticate, async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json(user);
});

router.put('/me/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.json({ message: 'Mot de passe mis à jour' });
});

router.get('/users', authenticate, async (_req, res) => {
  const users = await authService.listUsers();
  res.json(users);
});

router.patch('/users/:id/block', authenticate, async (req, res) => {
  await authService.blockUser(Number(req.params.id));
  res.json({ message: 'Utilisateur bloqué' });
});

router.patch('/users/:id/unblock', authenticate, async (req, res) => {
  await authService.unblockUser(Number(req.params.id));
  res.json({ message: 'Utilisateur débloqué' });
});

export default router;
