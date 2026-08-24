import pool from '../config/database.js';

export async function listByAnomaly(anomalyId, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT c.*, u.first_name, u.last_name, u.email
     FROM anomaly_comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.anomaly_id = $1
     ORDER BY c.created_at ASC`,
    [anomalyId]
  );
  return result.rows;
}

export async function create(data, client = null) {
  const c = client || pool;
  const result = await c.query(
    `INSERT INTO anomaly_comments (anomaly_id, user_id, message, audio_data, audio_type, transcription, duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      data.anomaly_id,
      data.user_id || null,
      data.message || null,
      data.audio_data || null,
      data.audio_type || null,
      data.transcription || null,
      data.duration_seconds || null,
    ]
  );
  return result.rows[0];
}

export async function findById(id, client = null) {
  const c = client || pool;
  const result = await c.query(
    `SELECT c.*, u.first_name, u.last_name, u.email
     FROM anomaly_comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function remove(id, client = null) {
  const c = client || pool;
  const result = await c.query('DELETE FROM anomaly_comments WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}
