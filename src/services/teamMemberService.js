import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export async function addMember(campaignId, userId, teamType) {
  await pool.query(
    'INSERT INTO campaign_members (campaign_id, user_id, team_type) VALUES ($1, $2, $3) ON CONFLICT (campaign_id, user_id) DO UPDATE SET team_type = $3',
    [campaignId, userId, teamType]
  );
}

export async function removeMember(campaignId, userId) {
  const result = await pool.query(
    'DELETE FROM campaign_members WHERE campaign_id = $1 AND user_id = $2 RETURNING id',
    [campaignId, userId]
  );
  if (result.rows.length === 0) {
    throw new AppError('Membre non trouvé dans cette campagne', 404);
  }
}

export async function getCampaignMembers(campaignId) {
  const result = await pool.query(
    `SELECT cm.team_type, u.id, u.email, u.first_name, u.last_name, u.role, u.created_at
     FROM campaign_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.campaign_id = $1`,
    [campaignId]
  );

  const testers = [];
  const developers = [];

  for (const row of result.rows) {
    const user = {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      role: row.role,
      created_at: row.created_at,
    };
    if (row.team_type === 'tester') {
      testers.push(user);
    } else {
      developers.push(user);
    }
  }

  return { testers, developers };
}

export async function getUserCampaigns(userId) {
  const result = await pool.query(
    'SELECT campaign_id, team_type FROM campaign_members WHERE user_id = $1',
    [userId]
  );
  return result.rows;
}
