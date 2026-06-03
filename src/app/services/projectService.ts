import api from './api';
import { mapProjetFromBackend, mapProjetToBackend } from '../utils/mappers';
import { Projet } from '../types';

export const projectService = {
  async getAll(): Promise<Projet[]> {
    const response = await api.get('/projects');
    return response.data.map(mapProjetFromBackend);
  },

  async getById(id: string): Promise<Projet> {
    const response = await api.get(`/projects/${id}`);
    return mapProjetFromBackend(response.data);
  },

  async create(projet: Partial<Projet>): Promise<Projet> {
    const payload = mapProjetToBackend(projet);
    const response = await api.post('/projects', payload);
    return mapProjetFromBackend(response.data.project);
  },

  async update(id: string, projet: Partial<Projet>): Promise<Projet> {
    const payload = mapProjetToBackend(projet);
    const response = await api.put(`/projects/${id}`, payload);
    return mapProjetFromBackend(response.data.project);
  },

  async archive(id: string): Promise<Projet> {
    const response = await api.patch(`/projects/${id}/archive`);
    return mapProjetFromBackend(response.data.project);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};
