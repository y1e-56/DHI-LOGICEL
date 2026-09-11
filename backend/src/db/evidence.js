import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT e.*,
            u.first_name || ' ' || u.last_name AS uploaded_by_name
     FROM evidence e
     LEFT JOIN users u ON u.id = e.uploaded_by
     WHERE e.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findByEntity(entityType, entityId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT e.*, u.first_name || ' ' || u.last_name AS uploaded_by_name
     FROM evidence e
     LEFT JOIN users u ON u.id = e.uploaded_by
     WHERE e.entity_type = $1 AND e.entity_id = $2
     ORDER BY e.created_at DESC`,
    [entityType, entityId]
  );
  return result.rows;
}

export async function findByEntityPaginated(filters = {}, client = null) {
  const c = client || pool;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (filters.entity_type) {
    conditions.push(`e.entity_type = $${idx++}`);
    params.push(filters.entity_type);
  }
  if (filters.entity_id) {
    conditions.push(`e.entity_id = $${idx++}`);
    params.push(filters.entity_id);
  }
  if (filters.uploaded_by) {
    conditions.push(`e.uploaded_by = $${idx++}`);
    params.push(filters.uploaded_by);
  }
  if (filters.recherche) {
    conditions.push(`(e.file_name ILIKE $${idx} OR e.description ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countQuery = `SELECT COUNT(*) FROM evidence e ${where}`;
  const dataQuery = `
    SELECT e.*, u.first_name || ' ' || u.last_name AS uploaded_by_name
    FROM evidence e
    LEFT JOIN users u ON u.id = e.uploaded_by
    ${where}`;
  return paginate(c, countQuery, dataQuery, params, { page: filters.page, limit: filters.limit, orderBy: 'e.created_at DESC' });
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO evidence (entity_type, entity_id, file_path, file_name, file_type, file_size, description, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [data.entity_type, data.entity_id, data.file_path, data.file_name,
     data.file_type || null, data.file_size || null, data.description || null, data.uploaded_by]
  );
  return result.rows[0];
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM evidence WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function countByEntity(entityType, entityId, client = null) {
  const c = client || pool;
  const result = await c.query(
    'SELECT COUNT(*) FROM evidence WHERE entity_type = $1 AND entity_id = $2',
    [entityType, entityId]
  );
  return parseInt(result.rows[0].count, 10);
}
