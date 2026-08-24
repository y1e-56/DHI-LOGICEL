import { AppError } from '../middleware/errorHandler.js';
import * as db from '../db/index.js';

export function validateCommentInput({ message, audioData }) {
  const hasMessage = typeof message === 'string' && message.trim().length > 0;
  const hasAudio = typeof audioData === 'string' && audioData.trim().length > 0;
  return hasMessage || hasAudio;
}

export async function listComments(anomalyId) {
  const anomaly = await db.anomalies.findById(anomalyId);
  if (!anomaly) throw new AppError('Anomalie non trouvée', 404);
  return db.anomalyComments.listByAnomaly(anomalyId);
}

export async function addComment({ anomalyId, userId, message, audioData, audioType, transcription, durationSeconds }) {
  const anomaly = await db.anomalies.findById(anomalyId);
  if (!anomaly) throw new AppError('Anomalie non trouvée', 404);

  if (!validateCommentInput({ message, audioData })) {
    throw new AppError('Un commentaire doit contenir un message texte ou un enregistrement audio', 400);
  }

  const comment = await db.anomalyComments.create({
    anomaly_id: anomalyId,
    user_id: userId,
    message,
    audio_data: audioData,
    audio_type: audioType,
    transcription,
    duration_seconds: durationSeconds,
  });

  return db.anomalyComments.findById(comment.id);
}

export async function deleteComment(id, userId, role) {
  const comment = await db.anomalyComments.findById(id);
  if (!comment) throw new AppError('Commentaire non trouvé', 404);

  const estAuteur = comment.user_id === userId;
  const estAdmin = role === 'admin';
  if (!estAuteur && !estAdmin) {
    throw new AppError('Vous ne pouvez supprimer que vos propres commentaires', 403);
  }

  await db.anomalyComments.remove(id);
}
