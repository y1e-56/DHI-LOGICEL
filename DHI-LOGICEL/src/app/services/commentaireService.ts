import api from './api';
import { AnomalieCommentaire } from '../types';
import { toAudioDataUri } from '../utils/mappers';

export interface CommentaireInput {
  message?: string;
  audioData?: string;
  audioType?: string;
  durationSeconds?: number;
}

const mapCommentaireFromBackend = (c: any): AnomalieCommentaire => ({
  id: String(c.id),
  anomalieId: String(c.anomaly_id),
  userId: String(c.user_id),
  userName: [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Inconnu',
  userEmail: c.email || undefined,
  message: c.message || undefined,
  audioData: toAudioDataUri(c.audio_data, c.audio_type),
  audioType: c.audio_type || undefined,
  transcription: c.transcription || undefined,
  durationSeconds: c.duration_seconds != null ? Number(c.duration_seconds) : undefined,
  dateCreation: c.created_at,
});

export const commentaireService = {
  async listByAnomalie(anomalieId: string): Promise<AnomalieCommentaire[]> {
    const res = await api.get(`/anomaly-comments/anomaly/${anomalieId}`);
    return res.data.map(mapCommentaireFromBackend);
  },

  async create(anomalieId: string, input: CommentaireInput): Promise<AnomalieCommentaire> {
    const res = await api.post(`/anomaly-comments/anomaly/${anomalieId}`, {
      message: input.message || undefined,
      audio_data: input.audioData || undefined,
      audio_type: input.audioType || undefined,
      duration_seconds: input.durationSeconds,
    });
    return mapCommentaireFromBackend(res.data.comment);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/anomaly-comments/${id}`);
  },
};
