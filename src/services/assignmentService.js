import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export async function createAssignment(featureId, assignedTo) {
  const result = await pool.query(
    'INSERT INTO assignments (feature_id, assigned_to) VALUES ($1, $2) RETURNING *',
    [featureId, assignedTo]
  );
  return result.rows[0];
}

export async function getAssignment(id) {
  const result = await pool.query('SELECT * FROM assignments WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Assignation non trouvée', 404);
  }
  return result.rows[0];
}

export async function updateAssignment(id, data) {
  const fields = [];
  const values = [];
  let index = 1;

  if (data.assigned_to !== undefined) { fields.push(`assigned_to = $${index++}`); values.push(data.assigned_to); }
  if (data.status !== undefined) { fields.push(`status = $${index++}`); values.push(data.status); }

  if (fields.length === 0) {
    throw new AppError('Aucune donnée à mettre à jour', 400);
  }

  values.push(id);
  const result = await pool.query(`UPDATE assignments SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, values);
  if (result.rows.length === 0) {
    throw new AppError('Assignation non trouvée', 404);
  }
  return result.rows[0];
}

export async function deleteAssignment(id) {
  const result = await pool.query('DELETE FROM assignments WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Assignation non trouvée', 404);
  }
}

export async function getUserAssignments(userId) {
  const result = await pool.query(
    'SELECT * FROM assignments WHERE assigned_to = $1 ORDER BY assigned_at DESC',
    [userId]
  );
  return result.rows;
}

export async function getCampaignAssignments(campaignId) {
  const result = await pool.query(
    `SELECT a.*, f.name as feature_name
     FROM assignments a
     JOIN features f ON f.id = a.feature_id
     WHERE f.campaign_id = $1
     ORDER BY a.assigned_at DESC`,
    [campaignId]
  );
  return result.rows;
}

export async function getFeatureAssignments(featureId) {
  const result = await pool.query(
    `SELECT a.*, u.id as user_id, u.email, u.first_name, u.last_name, u.role, u.created_at
     FROM assignments a
     JOIN users u ON u.id = a.assigned_to
     WHERE a.feature_id = $1
     ORDER BY a.assigned_at DESC`,
    [featureId]
  );
  return result.rows.map((r) => ({
    id: r.id,
    feature_id: r.feature_id,
    assigned_to: r.assigned_to,
    assigned_at: r.assigned_at,
    status: r.status,
    user: {
      id: r.user_id,
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      role: r.role,
      created_at: r.created_at,
    },
  }));
}
