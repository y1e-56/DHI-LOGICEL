import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listFeatures(campaignId) {
  let query = 'SELECT * FROM features';
  const params = [];
  if (campaignId) {
    query += ' WHERE campaign_id = $1';
    params.push(campaignId);
  }
  query += ' ORDER BY created_at ASC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getFeature(id) {
  const result = await pool.query('SELECT * FROM features WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Fonctionnalité non trouvée', 404);
  }
  return result.rows[0];
}

export async function createFeature(data) {
  const result = await pool.query(
    'INSERT INTO features (campaign_id, name, description, priority) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.campaign_id, data.name, data.description || null, data.priority || 'medium']
  );
  return result.rows[0];
}

export async function updateFeature(id, data) {
  const fields = [];
  const values = [];
  let index = 1;
  const allowedFields = ['name', 'description', 'priority', 'status'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${index++}`);
      values.push(data[field]);
    }
  }

  fields.push(`updated_at = $${index++}`);
  values.push(new Date());

  if (fields.length === 1) {
    throw new AppError('Aucune donnée à mettre à jour', 400);
  }

  values.push(id);
  const result = await pool.query(`UPDATE features SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, values);
  if (result.rows.length === 0) {
    throw new AppError('Fonctionnalité non trouvée', 404);
  }
  return result.rows[0];
}

export async function deleteFeature(id) {
  const result = await pool.query('DELETE FROM features WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Fonctionnalité non trouvée', 404);
  }
}

export async function getFeatureAnomalies(featureId) {
  const result = await pool.query('SELECT * FROM anomalies WHERE feature_id = $1 ORDER BY created_at DESC', [featureId]);
  return result.rows;
}

export async function updateFeatureStatus(id, status) {
  const result = await pool.query(
    "UPDATE features SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [status, id]
  );
  if (result.rows.length === 0) {
    throw new AppError('Fonctionnalité non trouvée', 404);
  }
  return result.rows[0];
}
