import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listCampaigns(projectId) {
  let query = 'SELECT * FROM campaigns';
  const params = [];
  if (projectId) {
    query += ' WHERE project_id = $1';
    params.push(projectId);
  }
  query += ' ORDER BY created_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getCampaign(id) {
  const result = await pool.query('SELECT * FROM campaigns WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Campagne non trouvée', 404);
  }
  return result.rows[0];
}

export async function createCampaign(data) {
  const result = await pool.query(
    `INSERT INTO campaigns (project_id, name, objective, organization_mode, start_date, end_date, test_lead_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.project_id, data.name, data.objective || null, data.organization_mode || 'exploratory',
     data.start_date || null, data.end_date || null, data.test_lead_id || null]
  );
  return result.rows[0];
}

export async function updateCampaign(id, data) {
  const fields = [];
  const values = [];
  let index = 1;
  const allowedFields = ['name', 'objective', 'organization_mode', 'start_date', 'end_date', 'test_lead_id', 'status'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${index++}`);
      values.push(data[field]);
    }
  }

  if (fields.length === 0) {
    throw new AppError('Aucune donnée à mettre à jour', 400);
  }

  values.push(id);
  const result = await pool.query(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, values);
  if (result.rows.length === 0) {
    throw new AppError('Campagne non trouvée', 404);
  }
  return result.rows[0];
}

export async function deleteCampaign(id) {
  const result = await pool.query('DELETE FROM campaigns WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Campagne non trouvée', 404);
  }
}

export async function getCampaignStats(campaignId) {
  const features = await pool.query(
    'SELECT status, COUNT(*)::int as count FROM features WHERE campaign_id = $1 GROUP BY status',
    [campaignId]
  );
  const anomalies = await pool.query(
    'SELECT status, COUNT(*)::int as count FROM anomalies WHERE campaign_id = $1 GROUP BY status',
    [campaignId]
  );

  const totalFeatures = features.rows.reduce((acc, r) => acc + r.count, 0);
  const totalAnomalies = anomalies.rows.reduce((acc, r) => acc + r.count, 0);

  return {
    totalFeatures,
    totalAnomalies,
    featuresByStatus: features.rows,
    anomaliesByStatus: anomalies.rows,
  };
}
