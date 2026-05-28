const pool = require('../config/database');

class CampaignMember {
  // Ajouter un membre à une campagne
  static async add(memberData) {
    const { campaign_id, user_id, team_type } = memberData;
    const query = `
      INSERT INTO campaign_members (campaign_id, user_id, team_type)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [campaign_id, user_id, team_type];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Retirer un membre d'une campagne
  static async remove(campaign_id, user_id) {
    const query = 'DELETE FROM campaign_members WHERE campaign_id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(query, [campaign_id, user_id]);
    return result.rows[0];
  }

  // Lister les membres d'une campagne
  static async findByCampaign(campaign_id, team_type = null) {
    let query = `
      SELECT cm.*, u.email, u.first_name, u.last_name, u.role
      FROM campaign_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.campaign_id = $1
    `;
    const values = [campaign_id];

    if (team_type) {
      query += ' AND cm.team_type = $2';
      values.push(team_type);
    }

    query += ' ORDER BY u.first_name, u.last_name';

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Trouver les campagnes d'un utilisateur
  static async findByUser(user_id) {
    const query = `
      SELECT cm.*, c.name as campaign_name, c.project_id
      FROM campaign_members cm
      JOIN campaigns c ON cm.campaign_id = c.id
      WHERE cm.user_id = $1
    `;
    const result = await pool.query(query, [user_id]);
    return result.rows;
  }

  // Vérifier si un utilisateur est membre d'une campagne
  static async isMember(campaign_id, user_id) {
    const query = 'SELECT * FROM campaign_members WHERE campaign_id = $1 AND user_id = $2';
    const result = await pool.query(query, [campaign_id, user_id]);
    return result.rows.length > 0;
  }

  // Obtenir le type d'équipe d'un utilisateur dans une campagne
  static async getTeamType(campaign_id, user_id) {
    const query = 'SELECT team_type FROM campaign_members WHERE campaign_id = $1 AND user_id = $2';
    const result = await pool.query(query, [campaign_id, user_id]);
    return result.rows[0] ? result.rows[0].team_type : null;
  }
}

module.exports = CampaignMember;
