import api from './api';
import { TestCase } from '../types';

export const testCaseService = {
  async list(params?: { featureId?: string; campaignId?: string }): Promise<TestCase[]> {
    const query = new URLSearchParams();
    if (params?.featureId) query.set('featureId', params.featureId);
    if (params?.campaignId) query.set('campaignId', params.campaignId);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/test-cases${suffix}`);
    return res.data.map((tc: any) => mapTestCaseFromBackend(tc));
  },

  async getById(id: string): Promise<TestCase> {
    const res = await api.get(`/test-cases/${id}`);
    return mapTestCaseFromBackend(res.data);
  },
};

const mapTestCaseFromBackend = (tc: any): TestCase => ({
  id: String(tc.id),
  featureId: String(tc.feature_id),
  nom: tc.name,
  steps: tc.steps || '',
  expectedResult: tc.expected_result || '',
  status: tc.status,
  priority: tc.priority,
  dateCreation: tc.created_at,
});
