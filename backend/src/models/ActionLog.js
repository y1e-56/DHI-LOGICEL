const pool = require('../config/database');

class ActionLog {
  // Créer un log d'action
  static async create(logData) {
    const { user_id, campaign_id, action_type, entity_type, entity_id, description, ip_address } = logData;
    const query = `
      INSERT INTO action_logs (user_id, campaign_id, action_type, entity_type, entity_id, description, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [user_id, campaign_id, action_type, entity_type, entity_id, description, ip_address];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Lister les logs d'une campagne
  static async findByCampaign(campaign_id, filters = {}) {
    let query = `
      SELECT al.*, u.first_name, u.last_name, u.email
      FROM action_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.campaign_id = $1
    `;
    const values = [campaign_id];
    let paramCount = 1;

    if (filters.action_type) {
      paramCount++;
      query += ` AND al.action_type = $${paramCount}`;
      values.push(filters.action_type);
    }

    if (filters.entity_type) {
      paramCount++;
      query += ` AND al.entity_type = $${paramCount}`;
      values.push(filters.entity_type);
    }

    if (filters.user_id) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      values.push(filters.user_id);
    }

    if (filters.start_date) {
      paramCount++;
      query += ` AND al.created_at >= $${paramCount}`;
      values.push(filters.start_date);
    }

    if (filters.end_date) {
      paramCount++;
      query += ` AND al.created_at <= $${paramCount}`;
      values.push(filters.end_date);
    }

    query += ' ORDER BY al.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Lister les logs d'un utilisateur
  static async findByUser(user_id, filters = {}) {
    let query = `
      SELECT al.*, c.name as campaign_name
      FROM action_logs al
      LEFT JOIN campaigns c ON al.campaign_id = c.id
      WHERE al.user_id = $1
    `;
    const values = [user_id];
    let paramCount = 1;

    if (filters.campaign_id) {
      paramCount++;
      query += ` AND al.campaign_id = $${paramCount}`;
      values.push(filters.campaign_id);
    }

    if (filters.action_type) {
      paramCount++;
      query += ` AND al.action_type = $${paramCount}`;
      values.push(filters.action_type);
    }

    query += ' ORDER BY al.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Lister tous les logs (pour les administrateurs)
  static async findAll(filters = {}) {
    let query = `
      SELECT al.*, u.first_name, u.last_name, u.email, c.name as campaign_name
      FROM action_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN campaigns c ON al.campaign_id = c.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;

    if (filters.campaign_id) {
      paramCount++;
      query += ` AND al.campaign_id = $${paramCount}`;
      values.push(filters.campaign_id);
    }

    if (filters.user_id) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      values.push(filters.user_id);
    }

    if (filters.action_type) {
      paramCount++;
      query += ` AND al.action_type = $${paramCount}`;
      values.push(filters.action_type);
    }

    if (filters.start_date) {
      paramCount++;
      query += ` AND al.created_at >= $${paramCount}`;
      values.push(filters.start_date);
    }

    if (filters.end_date) {
      paramCount++;
      query += ` AND al.created_at <= $${paramCount}`;
      values.push(filters.end_date);
    }

    query += ' ORDER BY al.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = ActionLog;
