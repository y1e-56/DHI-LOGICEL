import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listProjects(includeArchived = false) {
  let query = 'SELECT * FROM projects';
  if (!includeArchived) {
    query += ' WHERE is_archived = FALSE';
  }
  query += ' ORDER BY created_at DESC';
  const result = await pool.query(query);
  return result.rows;
}

export async function getProject(id) {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Projet non trouvé', 404);
  }
  return result.rows[0];
}

export async function createProject(data) {
  const result = await pool.query(
    'INSERT INTO projects (name, description, start_date, end_date, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [data.name, data.description || null, data.start_date || null, data.end_date || null, data.created_by]
  );
  return result.rows[0];
}

export async function updateProject(id, data) {
  const fields = [];
  const values = [];
  let index = 1;

  if (data.name !== undefined) { fields.push(`name = $${index++}`); values.push(data.name); }
  if (data.description !== undefined) { fields.push(`description = $${index++}`); values.push(data.description); }
  if (data.start_date !== undefined) { fields.push(`start_date = $${index++}`); values.push(data.start_date); }
  if (data.end_date !== undefined) { fields.push(`end_date = $${index++}`); values.push(data.end_date); }
  if (data.is_archived !== undefined) { fields.push(`is_archived = $${index++}`); values.push(data.is_archived); }

  if (fields.length === 0) {
    throw new AppError('Aucune donnée à mettre à jour', 400);
  }

  values.push(id);
  const result = await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, values);
  if (result.rows.length === 0) {
    throw new AppError('Projet non trouvé', 404);
  }
  return result.rows[0];
}

export async function archiveProject(id) {
  return updateProject(id, { is_archived: true });
}

export async function deleteProject(id) {
  const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Projet non trouvé', 404);
  }
}

export async function getProjectCampaigns(projectId) {
  const result = await pool.query('SELECT * FROM campaigns WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
  return result.rows;
}
