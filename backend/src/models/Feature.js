const pool = require('../config/database');

class Feature {
  // Créer une nouvelle fonctionnalité
  static async create(featureData) {
    const { campaign_id, name, description, priority } = featureData;
    const query = `
      INSERT INTO features (campaign_id, name, description, priority, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `;
    const values = [campaign_id, name, description, priority];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Trouver une fonctionnalité par ID
  static async findById(id) {
    const query = 'SELECT * FROM features WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Mettre à jour une fonctionnalité
  static async update(id, featureData) {
    const { name, description, priority } = featureData;
    const query = `
      UPDATE features
      SET name = $1, description = $2, priority = $3
      WHERE id = $4
      RETURNING *
    `;
    const values = [name, description, priority, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Mettre à jour le statut d'une fonctionnalité (RG-01: Seuls les testeurs peuvent le faire)
  static async updateStatus(id, status) {
    if (!['pending', 'conforme', 'anomaly_detected'].includes(status)) {
      throw new Error('Statut invalide');
    }
    const query = `
      UPDATE features
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  // Lister toutes les fonctionnalités d'une campagne
  static async findByCampaign(campaign_id) {
    const query = `
      SELECT f.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', ta.id,
                   'assigned_to', ta.assigned_to,
                   'assigned_by', ta.assigned_by,
                   'status', ta.status,
                   'assigned_at', ta.assigned_at
                 ) ORDER BY ta.assigned_at DESC
               ) FILTER (WHERE ta.id IS NOT NULL), 
               '[]'
             ) as assignments
      FROM features f
      LEFT JOIN task_assignments ta ON f.id = ta.feature_id
      WHERE f.campaign_id = $1
      GROUP BY f.id
      ORDER BY f.priority DESC, f.created_at DESC
    `;
    const result = await pool.query(query, [campaign_id]);
    return result.rows;
  }

  // Supprimer une fonctionnalité
  static async delete(id) {
    const query = 'DELETE FROM features WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Mettre à jour le statut d'une fonctionnalité (via l'assignation)
  static async updateStatus(feature_id, status) {
    const query = `
      UPDATE task_assignments
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE feature_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, feature_id]);
    return result.rows;
  }
}

module.exports = Feature;
