const pool = require('../config/database');

class AnomalyNotification {
  // Créer une notification
  static async create(notificationData) {
    const { anomaly_id, notified_user_id, notification_type } = notificationData;
    const query = `
      INSERT INTO anomaly_notifications (anomaly_id, notified_user_id, notification_type)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [anomaly_id, notified_user_id, notification_type];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Marquer une notification comme lue
  static async markAsRead(id) {
    const query = 'UPDATE anomaly_notifications SET is_read = true WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Lister les notifications d'un utilisateur
  static async findByUser(user_id, unreadOnly = false) {
    let query = `
      SELECT an.*, a.description as anomaly_description, a.status as anomaly_status,
             f.name as feature_name, c.name as campaign_name
      FROM anomaly_notifications an
      JOIN anomalies a ON an.anomaly_id = a.id
      JOIN features f ON a.feature_id = f.id
      JOIN campaigns c ON a.campaign_id = c.id
      WHERE an.notified_user_id = $1
    `;
    const values = [user_id];

    if (unreadOnly) {
      query += ' AND an.is_read = false';
    }

    query += ' ORDER BY an.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Compter les notifications non lues d'un utilisateur
  static async countUnread(user_id) {
    const query = 'SELECT COUNT(*) as count FROM anomaly_notifications WHERE notified_user_id = $1 AND is_read = false';
    const result = await pool.query(query, [user_id]);
    return parseInt(result.rows[0].count);
  }

  // Marquer toutes les notifications d'un utilisateur comme lues
  static async markAllAsRead(user_id) {
    const query = 'UPDATE anomaly_notifications SET is_read = true WHERE notified_user_id = $1';
    await pool.query(query, [user_id]);
  }

  // Lister les notifications d'une anomalie
  static async findByAnomaly(anomaly_id) {
    const query = `
      SELECT an.*, u.first_name, u.last_name, u.email
      FROM anomaly_notifications an
      JOIN users u ON an.notified_user_id = u.id
      WHERE an.anomaly_id = $1
      ORDER BY an.created_at DESC
    `;
    const result = await pool.query(query, [anomaly_id]);
    return result.rows;
  }
}

module.exports = AnomalyNotification;
