import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT i.*,
            f.name AS feature_name,
            c.name AS campaign_name,
            rb.first_name || ' ' || rb.last_name AS reported_by_name,
            au.first_name || ' ' || au.last_name AS assigned_to_name,
            a.title AS anomaly_title
     FROM incidents i
     LEFT JOIN features f ON f.id = i.feature_id
     LEFT JOIN campaigns c ON c.id = i.campaign_id
     LEFT JOIN users rb ON rb.id = i.reported_by
     LEFT JOIN users au ON au.id = i.assigned_to
     LEFT JOIN anomalies a ON a.id = i.anomaly_id
     WHERE i.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findByFeature(featureId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT i.*, rb.first_name || ' ' || rb.last_name AS reported_by_name
     FROM incidents i
     LEFT JOIN users rb ON rb.id = i.reported_by
     WHERE i.feature_id = $1
     ORDER BY i.severity DESC, i.created_at DESC`,
    [featureId]
  );
  return result.rows;
}

export async function findByCampaignPaginated(filters = {}, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.campaignId) {
    conditions.push(`i.campaign_id = $${idx++}`);
    params.push(filters.campaignId);
  }
  if (filters.featureId) {
    conditions.push(`i.feature_id = $${idx++}`);
    params.push(filters.featureId);
  }
  if (filters.statut) {
    conditions.push(`i.status = $${idx++}`);
    params.push(filters.statut);
  }
  if (filters.severite) {
    conditions.push(`i.severity = $${idx++}`);
    params.push(filters.severite);
  }
  if (filters.assignedTo) {
    conditions.push(`i.assigned_to = $${idx++}`);
    params.push(filters.assignedTo);
  }
  if (filters.recherche) {
    conditions.push(`(i.title ILIKE $${idx} OR i.description ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countQuery = `SELECT COUNT(*) FROM incidents i ${where}`;
  const dataQuery = `
    SELECT i.*,
           f.name AS feature_name,
           c.name AS campaign_name,
           rb.first_name || ' ' || rb.last_name AS reported_by_name,
           au.first_name || ' ' || au.last_name AS assigned_to_name
    FROM incidents i
    LEFT JOIN features f ON f.id = i.feature_id
    LEFT JOIN campaigns c ON c.id = i.campaign_id
    LEFT JOIN users rb ON rb.id = i.reported_by
    LEFT JOIN users au ON au.id = i.assigned_to
    ${where}`;
  return paginate(c, countQuery, dataQuery, params, { page: filters.page, limit: filters.limit, orderBy: 'i.severity DESC, i.created_at DESC' });
}

export async function stats(campaignId, client = null) {
  const c = client || pool;
  const where = campaignId ? 'WHERE campaign_id = $1' : '';
  const params = campaignId ? [campaignId] : [];
  const result = await c.query(
    `SELECT severity, status, COUNT(*) AS count FROM incidents ${where} GROUP BY severity, status`,
    params
  );
  return result.rows;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO incidents (title, description, steps_to_reproduce, expected_behavior, actual_behavior,
       severity, status, feature_id, campaign_id, anomaly_id, test_execution_id,
       reported_by, assigned_to, environment, version_affected, fix_version, resolution_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
    [data.title, data.description, data.steps_to_reproduce || null, data.expected_behavior || null,
     data.actual_behavior || null, data.severity || 'majeur', data.status || 'ouvert',
     data.feature_id || null, data.campaign_id || null, data.anomaly_id || null,
     data.test_execution_id || null, data.reported_by, data.assigned_to || null,
     data.environment || null, data.version_affected || null, data.fix_version || null,
     data.resolution_notes || null]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['title', 'description', 'steps_to_reproduce', 'expected_behavior',
    'actual_behavior', 'severity', 'status', 'assigned_to', 'environment',
    'version_affected', 'fix_version', 'resolution_notes'];
  const sets = [];
  const values = [];
  let idx = 1;
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = $${idx++}`);
      values.push(data[field]);
    }
  }
  if (sets.length === 0) return null;
  sets.push(`updated_at = NOW()`);
  values.push(id);
  const result = await c.query(
    `UPDATE incidents SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM incidents WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}
