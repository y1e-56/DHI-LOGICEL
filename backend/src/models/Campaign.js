const pool = require('../config/database');

class Campaign {
  // Créer une nouvelle campagne
  static async create(campaignData) {
    const { project_id, name, objective, organization_mode, start_date, end_date, created_by } = campaignData;
    const query = `
      INSERT INTO campaigns (project_id, name, objective, organization_mode, start_date, end_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [project_id, name, objective, organization_mode, start_date, end_date, created_by];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Trouver une campagne par ID
  static async findById(id) {
    const query = 'SELECT * FROM campaigns WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Mettre à jour une campagne
  static async update(id, campaignData) {
    const { name, objective, start_date, end_date } = campaignData;
    const query = `
      UPDATE campaigns
      SET name = $1, objective = $2, start_date = $3, end_date = $4
      WHERE id = $5
      RETURNING *
    `;
    const values = [name, objective, start_date, end_date, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Lister toutes les campagnes
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM campaigns WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.project_id) {
      paramCount++;
      query += ` AND project_id = $${paramCount}`;
      values.push(filters.project_id);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Supprimer une campagne
  static async delete(id) {
    const query = 'DELETE FROM campaigns WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Obtenir les statistiques d'une campagne
  static async getStatistics(id) {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM features WHERE campaign_id = $1) as total_features,
        (SELECT COUNT(*) FROM task_assignments ta 
         JOIN features f ON ta.feature_id = f.id 
         WHERE f.campaign_id = $1) as total_tasks,
        (SELECT COUNT(*) FROM task_assignments ta 
         JOIN features f ON ta.feature_id = f.id 
         WHERE f.campaign_id = $1 AND ta.status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM anomalies WHERE campaign_id = $1) as total_anomalies,
        (SELECT COUNT(*) FROM anomalies WHERE campaign_id = $1 AND status = 'new') as new_anomalies,
        (SELECT COUNT(*) FROM anomalies WHERE campaign_id = $1 AND status = 'in_progress') as in_progress_anomalies,
        (SELECT COUNT(*) FROM anomalies WHERE campaign_id = $1 AND status = 'resolution_signaled') as awaiting_validation,
        (SELECT COUNT(*) FROM anomalies WHERE campaign_id = $1 AND status = 'validated') as validated_anomalies
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Campaign;
