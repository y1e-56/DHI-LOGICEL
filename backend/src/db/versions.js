import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT sv.*,
            camp.name AS campaign_name,
            f.name AS feature_name,
            cb.first_name || ' ' || cb.last_name AS created_by_name
     FROM software_versions sv
     LEFT JOIN campaigns camp ON camp.id = sv.campaign_id
     LEFT JOIN features f ON f.id = sv.feature_id
     LEFT JOIN users cb ON cb.id = sv.created_by
     WHERE sv.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findByCampaign(campaignId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT sv.*, f.name AS feature_name,
            cb.first_name || ' ' || cb.last_name AS created_by_name
     FROM software_versions sv
     LEFT JOIN features f ON f.id = sv.feature_id
     LEFT JOIN users cb ON cb.id = sv.created_by
     WHERE sv.campaign_id = $1
     ORDER BY sv.created_at DESC`,
    [campaignId]
  );
  return result.rows;
}

export async function findByFeature(featureId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT sv.*, camp.name AS campaign_name,
            cb.first_name || ' ' || cb.last_name AS created_by_name
     FROM software_versions sv
     LEFT JOIN campaigns camp ON camp.id = sv.campaign_id
     LEFT JOIN users cb ON cb.id = sv.created_by
     WHERE sv.feature_id = $1
     ORDER BY sv.created_at DESC`,
    [featureId]
  );
  return result.rows;
}

export async function findPaginated(filters = {}, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.campaignId) {
    conditions.push(`sv.campaign_id = $${idx++}`);
    params.push(filters.campaignId);
  }
  if (filters.featureId) {
    conditions.push(`sv.feature_id = $${idx++}`);
    params.push(filters.featureId);
  }
  if (filters.statut) {
    conditions.push(`sv.status = $${idx++}`);
    params.push(filters.statut);
  }
  if (filters.recherche) {
    conditions.push(`(sv.version_number ILIKE $${idx} OR sv.name ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countQuery = `SELECT COUNT(*) FROM software_versions sv ${where}`;
  const dataQuery = `
    SELECT sv.*, camp.name AS campaign_name, f.name AS feature_name,
           cb.first_name || ' ' || cb.last_name AS created_by_name
    FROM software_versions sv
    LEFT JOIN campaigns camp ON camp.id = sv.campaign_id
    LEFT JOIN features f ON f.id = sv.feature_id
    LEFT JOIN users cb ON cb.id = sv.created_by
    ${where}`;
  return paginate(c, countQuery, dataQuery, params, { page: filters.page, limit: filters.limit, orderBy: 'sv.created_at DESC' });
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO software_versions (version_number, name, description, campaign_id, feature_id, status, release_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.version_number, data.name || null, data.description || null,
     data.campaign_id || null, data.feature_id || null,
     data.status || 'en_preparation', data.release_date || null, data.created_by]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['version_number', 'name', 'description', 'status', 'release_date'];
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
    `UPDATE software_versions SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM software_versions WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}
