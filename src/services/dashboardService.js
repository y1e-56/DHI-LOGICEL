import pool from '../config/database.js';

export async function getGlobalStats() {
  const [projects, campaigns, features, anomalies, users] = await Promise.all([
    pool.query('SELECT COUNT(*)::int as count FROM projects WHERE is_archived = FALSE'),
    pool.query('SELECT COUNT(*)::int as count FROM campaigns'),
    pool.query('SELECT COUNT(*)::int as count FROM features'),
    pool.query('SELECT COUNT(*)::int as count FROM anomalies'),
    pool.query('SELECT COUNT(*)::int as count FROM users'),
  ]);

  const anomaliesByStatus = await pool.query(
    'SELECT status, COUNT(*)::int as count FROM anomalies GROUP BY status'
  );

  const recentActivity = await pool.query(
    `SELECT h.*, u.first_name, u.last_name
     FROM history_actions h
     LEFT JOIN users u ON u.id = h.user_id
     ORDER BY h.created_at DESC
     LIMIT 20`
  );

  return {
    projects: projects.rows[0].count,
    campaigns: campaigns.rows[0].count,
    features: features.rows[0].count,
    anomalies: anomalies.rows[0].count,
    users: users.rows[0].count,
    anomaliesByStatus: anomaliesByStatus.rows,
    recentActivity: recentActivity.rows,
  };
}

export async function getProjectDashboard(projectId) {
  const project = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);

  if (project.rows.length === 0) {
    return { error: 'Projet non trouvé' };
  }

  const campaigns = await pool.query(
    'SELECT * FROM campaigns WHERE project_id = $1 ORDER BY created_at DESC',
    [projectId]
  );

  const campaignIds = campaigns.rows.map((c) => c.id);
  let featuresData = { rows: [] };
  let anomaliesData = { rows: [] };

  if (campaignIds.length > 0) {
    const placeholders = campaignIds.map((_, i) => `$${i + 1}`).join(',');
    [featuresData, anomaliesData] = await Promise.all([
      pool.query(`SELECT * FROM features WHERE campaign_id IN (${placeholders})`, campaignIds),
      pool.query(`SELECT * FROM anomalies WHERE campaign_id IN (${placeholders})`, campaignIds),
    ]);
  }

  return {
    project: project.rows[0],
    campaigns: campaigns.rows,
    features: featuresData.rows,
    anomalies: anomaliesData.rows,
  };
}

export async function getHistory(userId, campaignId) {
  let query = `SELECT h.*, u.first_name, u.last_name FROM history_actions h LEFT JOIN users u ON u.id = h.user_id WHERE 1=1`;
  const params = [];
  let index = 1;

  if (userId) {
    query += ` AND h.user_id = $${index++}`;
    params.push(userId);
  }
  if (campaignId) {
    query += ` AND (h.entity_type = 'campaign' AND h.entity_id = $${index++})`;
    params.push(campaignId);
  }
  query += ' ORDER BY h.created_at DESC LIMIT 50';

  const result = await pool.query(query, params);
  return result.rows;
}

export async function addHistoryAction(data) {
  await pool.query(
    `INSERT INTO history_actions (entity_type, entity_id, user_id, action_type, description)
     VALUES ($1, $2, $3, $4, $5)`,
    [data.entity_type, data.entity_id, data.user_id || null, data.action_type, data.description || null]
  );
}
