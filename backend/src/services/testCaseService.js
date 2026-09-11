import { AppError } from '../middleware/errorHandler.js';
import bus from '../lib/eventBus.js';
import * as db from '../db/index.js';

export async function listTestCases(featureId, campaignId) {
  return db.testCases.list(featureId, campaignId);
}

export async function getTestCase(id) {
  const testCase = await db.testCases.findById(id);
  if (!testCase) throw new AppError('Cas de test non trouvé', 404);
  return testCase;
}

export async function createTestCase(data) {
  const feature = await db.testCases.getCampaignIdByFeature(data.feature_id);
  if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);

  const existing = await db.testCases.findByName(data.feature_id, data.name);
  if (existing) throw new AppError('Un cas de test avec ce nom existe déjà pour cette fonctionnalité', 409);

  const testCase = await db.testCases.create(data, feature.campaign_id);
  bus.emit('testCase:created', { testCase, feature_id: data.feature_id });
  return testCase;
}

export async function deleteTestCase(id) {
  const testCase = await db.testCases.findById(id);
  if (!testCase) throw new AppError('Cas de test non trouvé', 404);
  await db.testCases.remove(id);
  bus.emit('testCase:deleted', { test_case_id: id, feature_id: testCase.feature_id });
  return testCase;
}

export async function updateTestCase(id, data) {
  const testCase = await db.testCases.findById(id);
  if (!testCase) throw new AppError('Cas de test non trouvé', 404);

  if (data.name !== undefined) {
    const existing = await db.testCases.findByName(testCase.feature_id, data.name, id);
    if (existing) throw new AppError('Un cas de test avec ce nom existe déjà pour cette fonctionnalité', 409);
  }

  const featureId = data.feature_id ?? testCase.feature_id;
  if (data.feature_id !== undefined && data.feature_id !== testCase.feature_id) {
    const feature = await db.testCases.getCampaignIdByFeature(data.feature_id);
    if (!feature) throw new AppError('Fonctionnalité non trouvée', 404);
  }

  const updated = await db.testCases.update(id, { ...data, feature_id: featureId });
  if (!updated) throw new AppError('Cas de test non trouvé', 404);
  bus.emit('testCase:updated', { testCase: updated, feature_id: featureId });
  return updated;
}
