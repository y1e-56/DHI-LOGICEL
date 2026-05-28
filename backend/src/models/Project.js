const pool = require('../config/database');

class Project {
  // Créer un nouveau projet
  static async create(projectData) {
    const { name, description, start_date, end_date, created_by } = projectData;
    const query = `
      INSERT INTO projects (name, description, start_date, end_date, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [name, description, start_date, end_date, created_by];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Trouver un projet par ID
  static async findById(id) {
    const query = 'SELECT * FROM projects WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Mettre à jour un projet
  static async update(id, projectData) {
    const { name, description, start_date, end_date, is_archived } = projectData;
    const query = `
      UPDATE projects
      SET name = $1, description = $2, start_date = $3, end_date = $4, is_archived = $5
      WHERE id = $6
      RETURNING *
    `;
    const values = [name, description, start_date, end_date, is_archived, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Archiver un projet
  static async archive(id) {
    const query = 'UPDATE projects SET is_archived = true WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Lister tous les projets
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM projects WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.is_archived !== undefined) {
      paramCount++;
      query += ` AND is_archived = $${paramCount}`;
      values.push(filters.is_archived);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Supprimer un projet
  static async delete(id) {
    const query = 'DELETE FROM projects WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Project;
