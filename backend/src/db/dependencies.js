import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT fd.*,
            f.name AS feature_name,
            df.name AS depends_on_name,
            u.first_name || ' ' || u.last_name AS created_by_name
     FROM feature_dependencies fd
     LEFT JOIN features f ON f.id = fd.feature_id
     LEFT JOIN features df ON df.id = fd.depends_on_feature_id
     LEFT JOIN users u ON u.id = fd.created_by
     WHERE fd.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findByFeature(featureId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT fd.*,
            df.name AS depends_on_name,
            u.first_name || ' ' || u.last_name AS created_by_name
     FROM feature_dependencies fd
     LEFT JOIN features df ON df.id = fd.depends_on_feature_id
     LEFT JOIN users u ON u.id = fd.created_by
     WHERE fd.feature_id = $1
     ORDER BY fd.created_at DESC`,
    [featureId]
  );
  return result.rows;
}

export async function findDependents(featureId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT fd.*,
            f.name AS feature_name,
            u.first_name || ' ' || u.last_name AS created_by_name
     FROM feature_dependencies fd
     LEFT JOIN features f ON f.id = fd.feature_id
     LEFT JOIN users u ON u.id = fd.created_by
     WHERE fd.depends_on_feature_id = $1
     ORDER BY fd.created_at DESC`,
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
    conditions.push(`f.campaign_id = $${idx++}`);
    params.push(filters.campaignId);
  }
  if (filters.featureId) {
    conditions.push(`fd.feature_id = $${idx++}`);
    params.push(filters.featureId);
  }
  if (filters.dependencyType) {
    conditions.push(`fd.dependency_type = $${idx++}`);
    params.push(filters.dependencyType);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countQuery = `
    SELECT COUNT(*) FROM feature_dependencies fd
    LEFT JOIN features f ON f.id = fd.feature_id
    ${where}`;
  const dataQuery = `
    SELECT fd.*,
           f.name AS feature_name,
           df.name AS depends_on_name,
           u.first_name || ' ' || u.last_name AS created_by_name
    FROM feature_dependencies fd
    LEFT JOIN features f ON f.id = fd.feature_id
    LEFT JOIN features df ON df.id = fd.depends_on_feature_id
    LEFT JOIN users u ON u.id = fd.created_by
    ${where}`;
  return paginate(c, countQuery, dataQuery, params, { page: filters.page, limit: filters.limit, orderBy: 'fd.created_at DESC' });
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO feature_dependencies (feature_id, depends_on_feature_id, dependency_type, description, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.feature_id, data.depends_on_feature_id, data.dependency_type || 'blocks',
     data.description || null, data.created_by]
  );
  return result.rows[0];
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM feature_dependencies WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}
