import api from './api';
import { mapCampagneFromBackend, mapCampagneToBackend } from '../utils/mappers';
import { Campagne } from '../types';

export const campaignService = {
  async getAll(): Promise<Campagne[]> {
    const response = await api.get('/campaigns');
    return response.data.map(mapCampagneFromBackend);
  },

  async getById(id: string): Promise<Campagne> {
    const response = await api.get(`/campaigns/${id}`);
    return mapCampagneFromBackend(response.data);
  },

  async getByProject(projectId: string): Promise<Campagne[]> {
    const response = await api.get(`/campaigns?project_id=${projectId}`);
    return response.data.map(mapCampagneFromBackend);
  },

  async getStatistics(id: string): Promise<any> {
    const response = await api.get(`/campaigns/${id}/statistics`);
    return response.data;
  },

  async create(campagne: Partial<Campagne>): Promise<Campagne> {
    const payload = mapCampagneToBackend(campagne);
    const response = await api.post('/campaigns', payload);
    return mapCampagneFromBackend(response.data.campaign);
  },

  async update(id: string, campagne: Partial<Campagne>): Promise<Campagne> {
    const payload = mapCampagneToBackend(campagne);
    const response = await api.put(`/campaigns/${id}`, payload);
    return mapCampagneFromBackend(response.data.campaign);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/campaigns/${id}`);
  },
};
