const pool = require('../config/database');

class TaskAssignment {
  // Assigner une tâche
  static async create(assignmentData) {
    const { feature_id, assigned_to, assigned_by } = assignmentData;
    const query = `
      INSERT INTO task_assignments (feature_id, assigned_to, assigned_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [feature_id, assigned_to, assigned_by];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Trouver une assignation par ID
  static async findById(id) {
    const query = 'SELECT * FROM task_assignments WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Mettre à jour le statut d'une tâche
  static async updateStatus(id, status) {
    const query = `
      UPDATE task_assignments
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  // Réassigner une tâche
  static async reassign(id, new_assigned_to, assigned_by) {
    const query = `
      UPDATE task_assignments
      SET assigned_to = $1, assigned_by = $2, status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const values = [new_assigned_to, assigned_by, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Lister les tâches assignées à un utilisateur
  static async findByAssignee(user_id, filters = {}) {
    let query = `
      SELECT ta.*, f.name as feature_name, f.description as feature_description, 
             f.priority, c.id as campaign_id, c.name as campaign_name
      FROM task_assignments ta
      JOIN features f ON ta.feature_id = f.id
      JOIN campaigns c ON f.campaign_id = c.id
      WHERE ta.assigned_to = $1
    `;
    const values = [user_id];
    let paramCount = 1;

    if (filters.status) {
      paramCount++;
      query += ` AND ta.status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters.campaign_id) {
      paramCount++;
      query += ` AND c.id = $${paramCount}`;
      values.push(filters.campaign_id);
    }

    query += ' ORDER BY ta.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Lister toutes les tâches d'une campagne
  static async findByCampaign(campaign_id) {
    const query = `
      SELECT ta.*, f.name as feature_name, f.description as feature_description, 
             f.priority, u.first_name as assigned_to_name, u.last_name as assigned_to_last_name
      FROM task_assignments ta
      JOIN features f ON ta.feature_id = f.id
      LEFT JOIN users u ON ta.assigned_to = u.id
      WHERE f.campaign_id = $1
      ORDER BY ta.created_at DESC
    `;
    const result = await pool.query(query, [campaign_id]);
    return result.rows;
  }

  // Supprimer une assignation
  static async delete(id) {
    const query = 'DELETE FROM task_assignments WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = TaskAssignment;
