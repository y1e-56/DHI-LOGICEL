import { Router } from 'express';
import { z } from 'zod';
import * as projectService from '../services/projectService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

router.get('/', authenticate, async (req, res) => {
  const includeArchived = req.query.includeArchived === 'true';
  const projects = await projectService.listProjects(includeArchived);
  res.json(projects);
});

router.get('/:id', authenticate, async (req, res) => {
  const project = await projectService.getProject(Number(req.params.id));
  res.json(project);
});

router.post('/', authenticate, async (req, res) => {
  const data = createSchema.parse(req.body);
  const project = await projectService.createProject({ ...data, created_by: req.user.id });
  res.status(201).json({ project });
});

router.put('/:id', authenticate, async (req, res) => {
  const project = await projectService.updateProject(Number(req.params.id), req.body);
  res.json({ project });
});

router.patch('/:id/archive', authenticate, async (req, res) => {
  const project = await projectService.archiveProject(Number(req.params.id));
  res.json({ project });
});

router.delete('/:id', authenticate, async (req, res) => {
  await projectService.deleteProject(Number(req.params.id));
  res.status(204).send();
});

router.get('/:id/campaigns', authenticate, async (req, res) => {
  const campaigns = await projectService.getProjectCampaigns(Number(req.params.id));
  res.json(campaigns);
});

export default router;
