import pool from '../config/database.js';
import { paginate } from './helpers/paginate.js';

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT te.*,
            tc.name AS test_case_title,
            u.first_name || ' ' || u.last_name AS executed_by_name,
            a.description AS anomaly_title
     FROM test_executions te
     LEFT JOIN test_cases tc ON tc.id = te.test_case_id
     LEFT JOIN users u ON u.id = te.executed_by
     LEFT JOIN anomalies a ON a.id = te.anomaly_id
     WHERE te.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findByCampaign(campaignId, filters = {}, client = null) {
  const c = client || pool;
  const conditions = ['te.campaign_id = $1'];
  const params = [campaignId];
  let idx = 2;

  if (filters.result) {
    conditions.push(`te.result = $${idx++}`);
    params.push(filters.result);
  }
  if (filters.executedBy) {
    conditions.push(`te.executed_by = $${idx++}`);
    params.push(filters.executedBy);
  }
  if (filters.testCaseId) {
    conditions.push(`te.test_case_id = $${idx++}`);
    params.push(filters.testCaseId);
  }
  if (filters.recherche) {
    conditions.push(`(tc.name ILIKE $${idx} OR te.notes ILIKE $${idx})`);
    params.push(`%${filters.recherche}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  const countQuery = `SELECT COUNT(*) FROM test_executions te LEFT JOIN test_cases tc ON tc.id = te.test_case_id WHERE ${where}`;
  const dataQuery = `
    SELECT te.*,
           tc.name AS test_case_title,
           u.first_name || ' ' || u.last_name AS executed_by_name,
           a.description AS anomaly_title
    FROM test_executions te
    LEFT JOIN test_cases tc ON tc.id = te.test_case_id
    LEFT JOIN users u ON u.id = te.executed_by
    LEFT JOIN anomalies a ON a.id = te.anomaly_id
    WHERE ${where}`;
  return paginate(c, countQuery, dataQuery, params, { page: filters.page, limit: filters.limit, orderBy: 'te.execution_date DESC' });
}

export async function findByTestCase(testCaseId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT te.*, u.first_name || ' ' || u.last_name AS executed_by_name
     FROM test_executions te
     LEFT JOIN users u ON u.id = te.executed_by
     WHERE te.test_case_id = $1
     ORDER BY te.execution_date DESC`,
    [testCaseId]
  );
  return result.rows;
}

export async function stats(campaignId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT te.result, COUNT(*) AS count
     FROM test_executions te
     WHERE te.campaign_id = $1
     GROUP BY te.result`,
    [campaignId]
  );
  return result.rows;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO test_executions (test_case_id, campaign_id, executed_by, result, execution_date, duration_seconds, environment, notes, screenshot_path, expected_behavior, actual_behavior, anomaly_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [data.test_case_id, data.campaign_id, data.executed_by, data.result || 'not_run',
     data.execution_date || new Date(), data.duration_seconds || null, data.environment || null,
     data.notes || null, data.screenshot_path || null, data.expected_behavior || null,
     data.actual_behavior || null, data.anomaly_id || null]
  );
  return result.rows[0];
}

export async function update(id, data, client = null) {
  const c = client || pool;
  const allowedFields = ['result', 'duration_seconds', 'environment', 'notes', 'screenshot_path', 'expected_behavior', 'actual_behavior', 'anomaly_id'];
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
    `UPDATE test_executions SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM test_executions WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}
