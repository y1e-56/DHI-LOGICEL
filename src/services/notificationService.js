import pool from '../config/database.js';

export async function getUserNotifications(userId) {
  const result = await pool.query(
    `SELECT n.*, a.description as anomaly_description
     FROM notifications n
     LEFT JOIN anomalies a ON a.id = n.anomaly_id
     WHERE n.notified_user_id = $1
     ORDER BY n.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function markAsRead(notificationId, userId) {
  await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND notified_user_id = $2',
    [notificationId, userId]
  );
}

export async function markAllAsRead(userId) {
  await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE notified_user_id = $1',
    [userId]
  );
}

export async function createNotification(data) {
  await pool.query(
    'INSERT INTO notifications (notified_user_id, anomaly_id, notification_type) VALUES ($1, $2, $3)',
    [data.notified_user_id, data.anomaly_id, data.notification_type]
  );
}
