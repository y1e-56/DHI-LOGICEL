import { Router } from 'express';
import { z } from 'zod';
import * as anomalyCommentService from '../services/anomalyCommentService.js';
import { authenticate } from '../middleware/auth.js';
import bus from '../lib/eventBus.js';

const router = Router();

const createSchema = z.object({
  message: z.string().max(2000).optional(),
  audio_data: z.string().max(100_000_000).optional(),
  audio_type: z.string().max(100).optional(),
  transcription: z.string().max(5000).optional(),
  duration_seconds: z.number().int().positive().optional(),
}).refine(data => data.message || data.audio_data, {
  message: 'Un commentaire doit contenir un message texte ou un enregistrement audio',
});

/**
 * @swagger
 * /anomaly-comments/anomaly/{anomalyId}:
 *   get:
 *     tags: [AnomalyComments]
 *     summary: Lister les commentaires d'une anomalie
 *     parameters:
 *       - name: anomalyId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des commentaires
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/anomaly/:anomalyId', authenticate, async (req, res) => {
  const comments = await anomalyCommentService.listComments(Number(req.params.anomalyId));
  res.json(comments);
});

/**
 * @swagger
 * /anomaly-comments/anomaly/{anomalyId}:
 *   post:
 *     tags: [AnomalyComments]
 *     summary: Ajouter un commentaire (texte et/ou audio) à une anomalie
 *     parameters:
 *       - name: anomalyId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message: { type: string }
 *               audio_data: { type: string }
 *               audio_type: { type: string }
 *               transcription: { type: string }
 *               duration_seconds: { type: integer }
 *     responses:
 *       201:
 *         description: Commentaire créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comment: { type: object }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/anomaly/:anomalyId', authenticate, async (req, res) => {
  const data = createSchema.parse(req.body);
  const comment = await anomalyCommentService.addComment({
    anomalyId: Number(req.params.anomalyId),
    userId: req.user.id,
    message: data.message,
    audioData: data.audio_data,
    audioType: data.audio_type,
    transcription: data.transcription,
    durationSeconds: data.duration_seconds,
  });
  bus.emit('data:changed', { entity: 'anomaly_comments' });
  res.status(201).json({ comment });
});

/**
 * @swagger
 * /anomaly-comments/{id}:
 *   delete:
 *     tags: [AnomalyComments]
 *     summary: Supprimer un commentaire (auteur ou admin)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Commentaire supprimé
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403:
 *         description: Non autorisé
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authenticate, async (req, res) => {
  await anomalyCommentService.deleteComment(Number(req.params.id), req.user.id, req.user.role);
  bus.emit('data:changed', { entity: 'anomaly_comments' });
  res.status(204).send();
});

export default router;
