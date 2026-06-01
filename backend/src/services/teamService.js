import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getTeamMembers(projectId) {
  if (projectId) {
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at
       FROM users u
       JOIN campaigns c ON c.test_lead_id = u.id
       WHERE c.project_id = $1
       UNION
       SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at
       FROM users u
       JOIN anomalies a ON a.assigned_to = u.id OR a.reported_by = u.id
       JOIN campaigns c ON c.id = a.campaign_id
       WHERE c.project_id = $1
       ORDER BY id`,
      [projectId]
    );
    return result.rows;
  }

  const result = await pool.query(
    'SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY id'
  );
  return result.rows;
}

export async function getProjectTeamStats(projectId) {
  const result = await pool.query(
    `SELECT
       u.id as "userId",
       COUNT(DISTINCT a_assigned.id) FILTER (WHERE a_assigned.id IS NOT NULL) as "anomaliesAssigned",
       COUNT(DISTINCT a_reported.id) FILTER (WHERE a_reported.id IS NOT NULL) as "anomaliesReported"
     FROM users u
     LEFT JOIN anomalies a_assigned ON a_assigned.assigned_to = u.id AND a_assigned.campaign_id IN (SELECT id FROM campaigns WHERE project_id = $1)
     LEFT JOIN anomalies a_reported ON a_reported.reported_by = u.id AND a_reported.campaign_id IN (SELECT id FROM campaigns WHERE project_id = $1)
     GROUP BY u.id
     ORDER BY u.id`,
    [projectId]
  );
  return result.rows;
}
