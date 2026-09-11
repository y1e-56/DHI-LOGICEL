import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT ts.*,
            cb.first_name || ' ' || cb.last_name AS created_by_name,
            COUNT(tc.id) AS test_case_count
     FROM test_scenarios ts
     LEFT JOIN users cb ON cb.id = ts.created_by
     LEFT JOIN test_cases tc ON tc.scenario_id = ts.id
     WHERE ts.id = $1
     GROUP BY ts.id, cb.first_name, cb.last_name`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findByCampaign(campaignId, filters = {}, client = null) {
  const c = client || pool;
  const conditions = ['ts.campaign_id = $1'];
  const params = [campaignId];
  let idx = 2;

  if (filters.featureId) {
    conditions.push(`ts.feature_id = $${idx++}`);
    params.push(filters.featureId);
  }

  if (filters.categorie) {
    conditions.push(`ts.category = $${idx++}`);
    params.push(filters.categorie);
  }
  if (filters.recherche) {
    conditions.push(`(ts.title ILIKE $${idx} OR ts.description ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  const countQuery = `SELECT COUNT(*) FROM test_scenarios ts WHERE ${where}`;
  const dataQuery = `
    SELECT ts.*,
           cb.first_name || ' ' || cb.last_name AS created_by_name,
           COUNT(tc.id) AS test_case_count
    FROM test_scenarios ts
    LEFT JOIN users cb ON cb.id = ts.created_by
    LEFT JOIN test_cases tc ON tc.scenario_id = ts.id
    WHERE ${where}
    GROUP BY ts.id, cb.first_name, cb.last_name`;
  return paginate(c, countQuery, dataQuery, params, { page: filters.page, limit: filters.limit, orderBy: 'ts.created_at DESC' });
}

export async function findByFeature(featureId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT ts.*,
            cb.first_name || ' ' || cb.last_name AS created_by_name,
            COUNT(tc.id) AS test_case_count
     FROM test_scenarios ts
     LEFT JOIN users cb ON cb.id = ts.created_by
     LEFT JOIN test_cases tc ON tc.scenario_id = ts.id
     WHERE ts.feature_id = $1
     GROUP BY ts.id, cb.first_name, cb.last_name
     ORDER BY ts.created_at DESC`,
    [featureId]
  );
  return result.rows;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO test_scenarios (campaign_id, feature_id, title, description, category, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.campaign_id, data.feature_id || null, data.title, data.description || null, data.category || 'fonctionnel', data.created_by]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['title', 'description', 'category'];
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
    `UPDATE test_scenarios SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM test_scenarios WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}
