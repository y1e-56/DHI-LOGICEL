import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT wp.*,
            u.first_name || ' ' || u.last_name AS owner_name,
            cb.first_name || ' ' || cb.last_name AS created_by_name,
            f.name AS feature_name
     FROM watch_points wp
     LEFT JOIN users u ON u.id = wp.owner_id
     LEFT JOIN users cb ON cb.id = wp.created_by
     LEFT JOIN features f ON f.id = wp.feature_id
     WHERE wp.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findByProject(projectId, filters = {}, client = null) {
  const c = client || pool;
  const conditions = ['wp.project_id = $1'];
  const params = [projectId];
  let idx = 2;

  if (filters.campaign_id) {
    conditions.push(`wp.campaign_id = $${idx++}`);
    params.push(filters.campaign_id);
  }
  if (filters.statut) {
    conditions.push(`wp.status = $${idx++}`);
    params.push(filters.statut);
  }
  if (filters.criticite) {
    conditions.push(`wp.criticality = $${idx++}`);
    params.push(filters.criticite);
  }
  if (filters.recherche) {
    conditions.push(`(wp.title ILIKE $${idx} OR wp.description ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  const countQuery = `SELECT COUNT(*) FROM watch_points wp WHERE ${where}`;
  const dataQuery = `
    SELECT wp.*,
           u.first_name || ' ' || u.last_name AS owner_name,
           cb.first_name || ' ' || cb.last_name AS created_by_name,
           f.name AS feature_name
    FROM watch_points wp
    LEFT JOIN users u ON u.id = wp.owner_id
    LEFT JOIN users cb ON cb.id = wp.created_by
    LEFT JOIN features f ON f.id = wp.feature_id
    WHERE ${where}`;
  return paginate(c, countQuery, dataQuery, params, { page: filters.page, limit: filters.limit, orderBy: 'wp.criticality DESC, wp.created_at DESC' });
}

export async function findByCampaign(campaignId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT wp.*, f.name AS feature_name
     FROM watch_points wp
     LEFT JOIN features f ON f.id = wp.feature_id
     WHERE wp.campaign_id = $1
     ORDER BY wp.criticality DESC, wp.created_at DESC`,
    [campaignId]
  );
  return result.rows;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO watch_points (project_id, campaign_id, feature_id, title, description, context, criticality, consequence, owner_id, validation_criteria, recommendations, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [data.project_id, data.campaign_id || null, data.feature_id || null, data.title, data.description, data.context || null,
     data.criticality || 'high', data.consequence || null, data.owner_id || null, data.validation_criteria || null,
     data.recommendations || null, data.status || 'open', data.created_by]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['title', 'description', 'context', 'criticality', 'consequence', 'owner_id', 'validation_criteria', 'recommendations', 'status'];
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
    `UPDATE watch_points SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM watch_points WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function stats(projectId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT status, criticality, COUNT(*) AS count
     FROM watch_points WHERE project_id = $1 GROUP BY status, criticality`,
    [projectId]
  );
  return result.rows;
}
