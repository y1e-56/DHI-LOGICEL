import api from './api';
import { mapFonctionnaliteFromBackend, mapFonctionnaliteToBackend } from '../utils/mappers';
import { Fonctionnalite } from '../types';

export const taskService = {
  // ===== Fonctionnalités =====
  async createFeature(fonctionnalite: Partial<Fonctionnalite>): Promise<Fonctionnalite> {
    const payload = mapFonctionnaliteToBackend(fonctionnalite);
    const response = await api.post('/tasks/features', payload);
    return mapFonctionnaliteFromBackend(response.data.feature);
  },

  async getCampaignFeatures(campaignId: string): Promise<Fonctionnalite[]> {
    const response = await api.get(`/tasks/campaigns/${campaignId}/features`);
    return response.data.map(mapFonctionnaliteFromBackend);
  },

  // ===== Assignations =====
  async assignTask(featureId: string, userId: string): Promise<any> {
    const response = await api.post('/tasks/assignments', {
      feature_id: parseInt(featureId),
      assigned_to: parseInt(userId),
    });
    return response.data;
  },

  async reassignTask(assignmentId: string, newUserId: string): Promise<any> {
    const response = await api.patch(`/tasks/assignments/${assignmentId}/reassign`, {
      new_assigned_to: parseInt(newUserId),
    });
    return response.data;
  },

  async updateTaskStatus(assignmentId: string, status: 'pending' | 'in_progress' | 'completed'): Promise<any> {
    const response = await api.patch(`/tasks/assignments/${assignmentId}/status`, { status });
    return response.data;
  },

  async getMyTasks(): Promise<any[]> {
    const response = await api.get('/tasks/my-tasks');
    return response.data;
  },

  async getCampaignTasks(campaignId: string): Promise<any[]> {
    const response = await api.get(`/tasks/campaigns/${campaignId}/tasks`);
    return response.data;
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    await api.delete(`/tasks/assignments/${assignmentId}`);
  },

  // ===== Statut fonctionnalité (RG-01) =====
  async updateFeatureStatus(featureId: string, status: 'conforme' | 'anomaly_detected'): Promise<Fonctionnalite> {
    const response = await api.patch(`/features/${featureId}/status`, { status });
    return mapFonctionnaliteFromBackend(response.data.feature);
  },
};
