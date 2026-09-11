import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT r.*, f.name AS feature_name
     FROM requirements r
     LEFT JOIN features f ON f.id = r.feature_id
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findByFeature(featureId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT * FROM requirements WHERE feature_id = $1 ORDER BY created_at DESC',
    [featureId]
  );
  return result.rows;
}

export async function findByFeaturePaginated(filters = {}, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.featureId) {
    conditions.push(`r.feature_id = $${idx++}`);
    params.push(filters.featureId);
  }
  if (filters.categorie) {
    conditions.push(`r.category = $${idx++}`);
    params.push(filters.categorie);
  }
  if (filters.statut) {
    conditions.push(`r.status = $${idx++}`);
    params.push(filters.statut);
  }
  if (filters.recherche) {
    conditions.push(`(r.title ILIKE $${idx} OR r.description ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countQuery = `SELECT COUNT(*) FROM requirements r ${where}`;
  const dataQuery = `SELECT r.*, f.name AS feature_name FROM requirements r LEFT JOIN features f ON f.id = r.feature_id ${where}`;
  return paginate(c, countQuery, dataQuery, params, { page: filters.page, limit: filters.limit, orderBy: 'r.created_at DESC' });
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO requirements (feature_id, title, description, category, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.feature_id, data.title, data.description || null, data.category || 'fonctionnelle', data.status || 'proposed', data.created_by]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['title', 'description', 'category', 'status'];
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
    `UPDATE requirements SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM requirements WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}
