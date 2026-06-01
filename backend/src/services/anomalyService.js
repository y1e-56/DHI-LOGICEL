import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import * as notificationService from './notificationService.js';
import { emitAnomalyCreated, emitAnomalyUpdated, emitNotification } from './websocketService.js';

export async function listAnomalies(campaignId, featureId, assignedTo, reportedBy) {
  let query = 'SELECT * FROM anomalies WHERE 1=1';
  const params = [];
  let index = 1;

  if (campaignId) { query += ` AND campaign_id = $${index++}`; params.push(campaignId); }
  if (featureId) { query += ` AND feature_id = $${index++}`; params.push(featureId); }
  if (assignedTo) { query += ` AND assigned_to = $${index++}`; params.push(assignedTo); }
  if (reportedBy) { query += ` AND reported_by = $${index++}`; params.push(reportedBy); }
  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getAnomaly(id) {
  const result = await pool.query('SELECT * FROM anomalies WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Anomalie non trouvée', 404);
  }
  return result.rows[0];
}

export async function createAnomaly(data) {
  const result = await pool.query(
    `INSERT INTO anomalies (feature_id, campaign_id, description, reported_by, assigned_to)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.feature_id, data.campaign_id, data.description, data.reported_by || null, data.assigned_to || null]
  );

  await pool.query(
    "UPDATE features SET status = 'anomaly_detected', updated_at = NOW() WHERE id = $1",
    [data.feature_id]
  );

  if (data.assigned_to) {
    await notificationService.createNotification({
      notified_user_id: data.assigned_to,
      anomaly_id: result.rows[0].id,
      notification_type: 'anomaly_reported',
    });
    emitNotification(data.assigned_to, {
      type: 'anomaly_reported',
      anomaly_id: result.rows[0].id,
      message: 'Nouvelle anomalie assignée',
    });
  }

  emitAnomalyCreated(data.campaign_id, result.rows[0]);

  return result.rows[0];
}

export async function updateAnomaly(id, data) {
  const fields = [];
  const values = [];
  let index = 1;
  const allowedFields = ['description', 'assigned_to', 'status', 'resolution_description'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${index++}`);
      values.push(data[field]);
    }
  }

  fields.push(`updated_at = $${index++}`);
  values.push(new Date());

  if (fields.length === 1) {
    throw new AppError('Aucune donnée à mettre à jour', 400);
  }

  values.push(id);
  const result = await pool.query(`UPDATE anomalies SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, values);
  if (result.rows.length === 0) {
    throw new AppError('Anomalie non trouvée', 404);
  }

  const updated = result.rows[0];

  if (data.status === 'resolution_signaled' && data.assigned_to) {
    await notificationService.createNotification({
      notified_user_id: data.assigned_to,
      anomaly_id: id,
      notification_type: 'resolution_signaled',
    });
    emitNotification(data.assigned_to, {
      type: 'resolution_signaled',
      anomaly_id: id,
      message: 'Résolution signalée',
    });
  }

  if (data.status === 'rejected') {
    await notificationService.createNotification({
      notified_user_id: updated.reported_by,
      anomaly_id: id,
      notification_type: 'reopened',
    });
    emitNotification(updated.reported_by, {
      type: 'reopened',
      anomaly_id: id,
      message: 'Anomalie rouverte',
    });
  }

  emitAnomalyUpdated(updated.campaign_id, updated);

  return updated;
}

export async function deleteAnomaly(id) {
  const result = await pool.query('DELETE FROM anomalies WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    throw new AppError('Anomalie non trouvée', 404);
  }
}

export async function getAnomalyHistory(anomalyId) {
  const result = await pool.query(
    'SELECT * FROM history_actions WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
    ['anomaly', anomalyId]
  );
  return result.rows;
}

export async function signalResolution(id, resolutionDescription) {
  return updateAnomaly(id, { status: 'resolution_signaled', resolution_description: resolutionDescription });
}

export async function validateAnomaly(id) {
  return updateAnomaly(id, { status: 'validated' });
}

export async function rejectAnomaly(id) {
  return updateAnomaly(id, { status: 'rejected' });
}
