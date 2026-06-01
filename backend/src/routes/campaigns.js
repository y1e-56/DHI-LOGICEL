import { Router } from 'express';
import { z } from 'zod';
import * as campaignService from '../services/campaignService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  project_id: z.number(),
  name: z.string().min(1, 'Nom requis'),
  objective: z.string().optional(),
  organization_mode: z.enum(['exploratory', 'scenario', 'combination']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  test_lead_id: z.number().optional(),
});

router.get('/', authenticate, async (req, res) => {
  const projectId = req.query.project_id ? Number(req.query.project_id) : req.query.projectId ? Number(req.query.projectId) : undefined;
  const campaigns = await campaignService.listCampaigns(projectId);
  res.json(campaigns);
});

router.get('/:id', authenticate, async (req, res) => {
  const campaign = await campaignService.getCampaign(Number(req.params.id));
  res.json(campaign);
});

router.post('/', authenticate, async (req, res) => {
  const data = createSchema.parse(req.body);
  const campaign = await campaignService.createCampaign(data);
  res.status(201).json({ campaign });
});

router.put('/:id', authenticate, async (req, res) => {
  const campaign = await campaignService.updateCampaign(Number(req.params.id), req.body);
  res.json({ campaign });
});

router.delete('/:id', authenticate, async (req, res) => {
  await campaignService.deleteCampaign(Number(req.params.id));
  res.status(204).send();
});

router.get('/:id/stats', authenticate, async (req, res) => {
  const stats = await campaignService.getCampaignStats(Number(req.params.id));
  res.json(stats);
});

router.get('/:id/statistics', authenticate, async (req, res) => {
  const stats = await campaignService.getCampaignStats(Number(req.params.id));
  res.json(stats);
});

export default router;
