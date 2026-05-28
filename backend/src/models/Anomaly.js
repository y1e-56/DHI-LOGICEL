const pool = require('../config/database');

class Anomaly {
  // Créer une nouvelle anomalie
  static async create(anomalyData) {
    const { feature_id, campaign_id, reported_by, assigned_to, description } = anomalyData;
    const query = `
      INSERT INTO anomalies (feature_id, campaign_id, reported_by, assigned_to, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [feature_id, campaign_id, reported_by, assigned_to, description];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Trouver une anomalie par ID
  static async findById(id) {
    const query = `
      SELECT a.*, 
             f.name as feature_name,
             u1.first_name as reporter_first_name, 
             u1.last_name as reporter_last_name,
             u2.first_name as assignee_first_name, 
             u2.last_name as assignee_last_name
      FROM anomalies a
      JOIN features f ON a.feature_id = f.id
      JOIN users u1 ON a.reported_by = u1.id
      LEFT JOIN users u2 ON a.assigned_to = u2.id
      WHERE a.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Mettre à jour une anomalie
  static async update(id, anomalyData) {
    const { assigned_to, description, status, resolution_description } = anomalyData;
    const query = `
      UPDATE anomalies
      SET assigned_to = COALESCE($1, assigned_to),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          resolution_description = COALESCE($4, resolution_description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const values = [assigned_to, description, status, resolution_description, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Signaler la résolution d'une anomalie
  static async signalResolution(id, resolution_description) {
    const query = `
      UPDATE anomalies
      SET status = 'resolution_signaled',
          resolution_description = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [resolution_description, id]);
    return result.rows[0];
  }

  // Valider une anomalie (clôturer)
  static async validate(id) {
    const query = `
      UPDATE anomalies
      SET status = 'validated',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Rejeter une résolution (réouvrir)
  static async reject(id) {
    const query = `
      UPDATE anomalies
      SET status = 'new',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Lister les anomalies d'une campagne
  static async findByCampaign(campaign_id, filters = {}) {
    let query = `
      SELECT a.*, 
             f.name as feature_name,
             u1.first_name as reporter_first_name, 
             u1.last_name as reporter_last_name,
             u2.first_name as assignee_first_name, 
             u2.last_name as assignee_last_name
      FROM anomalies a
      JOIN features f ON a.feature_id = f.id
      JOIN users u1 ON a.reported_by = u1.id
      LEFT JOIN users u2 ON a.assigned_to = u2.id
      WHERE a.campaign_id = $1
    `;
    const values = [campaign_id];
    let paramCount = 1;

    if (filters.status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters.reported_by) {
      paramCount++;
      query += ` AND a.reported_by = $${paramCount}`;
      values.push(filters.reported_by);
    }

    if (filters.assigned_to) {
      paramCount++;
      query += ` AND a.assigned_to = $${paramCount}`;
      values.push(filters.assigned_to);
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Lister les anomalies assignées à un développeur
  static async findByAssignee(user_id, filters = {}) {
    let query = `
      SELECT a.*, 
             f.name as feature_name,
             c.name as campaign_name,
             u1.first_name as reporter_first_name, 
             u1.last_name as reporter_last_name
      FROM anomalies a
      JOIN features f ON a.feature_id = f.id
      JOIN campaigns c ON a.campaign_id = c.id
      JOIN users u1 ON a.reported_by = u1.id
      WHERE a.assigned_to = $1
    `;
    const values = [user_id];
    let paramCount = 1;

    if (filters.status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      values.push(filters.status);
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Lister les anomalies signalées par un testeur
  static async findByReporter(user_id, filters = {}) {
    let query = `
      SELECT a.*, 
             f.name as feature_name,
             c.name as campaign_name,
             u2.first_name as assignee_first_name, 
             u2.last_name as assignee_last_name
      FROM anomalies a
      JOIN features f ON a.feature_id = f.id
      JOIN campaigns c ON a.campaign_id = c.id
      LEFT JOIN users u2 ON a.assigned_to = u2.id
      WHERE a.reported_by = $1
    `;
    const values = [user_id];
    let paramCount = 1;

    if (filters.status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      values.push(filters.status);
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Supprimer une anomalie
  static async delete(id) {
    const query = 'DELETE FROM anomalies WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Anomaly;
