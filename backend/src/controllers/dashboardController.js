const pool = require('../config/database');
const Campaign = require('../models/Campaign');
const ActionLog = require('../models/ActionLog');

// Tableau de bord par projet
const getProjectDashboard = async (req, res) => {
  try {
    const { project_id } = req.params;

    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.start_date,
        p.end_date,
        COUNT(DISTINCT c.id) as total_campaigns,
        COUNT(DISTINCT c.id) FILTER (WHERE c.end_date >= CURRENT_DATE) as active_campaigns,
        COUNT(DISTINCT f.id) as total_features,
        COUNT(DISTINCT a.id) as total_anomalies
      FROM projects p
      LEFT JOIN campaigns c ON p.id = c.project_id
      LEFT JOIN features f ON c.id = f.campaign_id
      LEFT JOIN anomalies a ON c.id = a.campaign_id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
    const result = await pool.query(query, [project_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du tableau de bord projet:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du tableau de bord projet' });
  }
};

// Tableau de bord par campagne
const getCampaignDashboard = async (req, res) => {
  try {
    const { campaign_id } = req.params;

    const statistics = await Campaign.getStatistics(campaign_id);
    
    if (!statistics) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    res.json(statistics);
  } catch (error) {
    console.error('Erreur lors de la récupération du tableau de bord campagne:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du tableau de bord campagne' });
  }
};

// Tableau de bord personnel (pour l'utilisateur connecté)
const getPersonalDashboard = async (req, res) => {
  try {
    const user_id = req.user.id;
    const role = req.user.role;

    let dashboardData = {};

    if (role === 'tester' || role === 'test_lead') {
      // Pour les testeurs : tâches assignées et anomalies signalées
      const tasksQuery = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE ta.status = 'pending') as pending_tasks,
          COUNT(*) FILTER (WHERE ta.status = 'in_progress') as in_progress_tasks,
          COUNT(*) FILTER (WHERE ta.status = 'completed') as completed_tasks
        FROM task_assignments ta
        WHERE ta.assigned_to = $1
      `;
      const tasksResult = await pool.query(tasksQuery, [user_id]);
      dashboardData.tasks = tasksResult.rows[0];

      const anomaliesQuery = `
        SELECT 
          COUNT(*) as total_anomalies,
          COUNT(*) FILTER (WHERE a.status = 'new') as new_anomalies,
          COUNT(*) FILTER (WHERE a.status = 'in_progress') as in_progress_anomalies,
          COUNT(*) FILTER (WHERE a.status = 'resolution_signaled') as awaiting_validation,
          COUNT(*) FILTER (WHERE a.status = 'validated') as validated_anomalies
        FROM anomalies a
        WHERE a.reported_by = $1
      `;
      const anomaliesResult = await pool.query(anomaliesQuery, [user_id]);
      dashboardData.reported_anomalies = anomaliesResult.rows[0];
    }

    if (role === 'developer') {
      // Pour les développeurs : anomalies assignées
      const anomaliesQuery = `
        SELECT 
          COUNT(*) as total_anomalies,
          COUNT(*) FILTER (WHERE a.status = 'new') as new_anomalies,
          COUNT(*) FILTER (WHERE a.status = 'in_progress') as in_progress_anomalies,
          COUNT(*) FILTER (WHERE a.status = 'resolution_signaled') as resolution_signaled,
          COUNT(*) FILTER (WHERE a.status = 'validated') as validated_anomalies
        FROM anomalies a
        WHERE a.assigned_to = $1
      `;
      const anomaliesResult = await pool.query(anomaliesQuery, [user_id]);
      dashboardData.assigned_anomalies = anomaliesResult.rows[0];
    }

    if (role === 'admin' || role === 'test_lead') {
      // Pour les admins et chefs testeurs : vue globale
      const projectsQuery = `
        SELECT COUNT(*) as total_projects, 
               COUNT(*) FILTER (WHERE is_archived = false) as active_projects
        FROM projects
      `;
      const projectsResult = await pool.query(projectsQuery);
      dashboardData.projects = projectsResult.rows[0];

      const campaignsQuery = `
        SELECT COUNT(*) as total_campaigns
        FROM campaigns
      `;
      const campaignsResult = await pool.query(campaignsQuery);
      dashboardData.campaigns = campaignsResult.rows[0];

      const usersQuery = `
        SELECT COUNT(*) as total_users,
               COUNT(*) FILTER (WHERE is_active = true) as active_users
        FROM users
      `;
      const usersResult = await pool.query(usersQuery);
      dashboardData.users = usersResult.rows[0];
    }

    res.json(dashboardData);
  } catch (error) {
    console.error('Erreur lors de la récupération du tableau de bord personnel:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du tableau de bord personnel' });
  }
};

// Historique des actions
const getActionHistory = async (req, res) => {
  try {
    const { campaign_id, user_id, action_type, start_date, end_date } = req.query;
    const filters = {};

    if (campaign_id) filters.campaign_id = parseInt(campaign_id);
    if (user_id) filters.user_id = parseInt(user_id);
    if (action_type) filters.action_type = action_type;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    // Si l'utilisateur n'est pas admin, il ne peut voir que ses propres actions
    if (req.user.role !== 'admin') {
      filters.user_id = req.user.id;
    }

    const logs = await ActionLog.findAll(filters);
    res.json(logs);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique' });
  }
};

// Générer un rapport de campagne
const generateCampaignReport = async (req, res) => {
  try {
    const { campaign_id } = req.params;

    const query = `
      SELECT 
        c.id as campaign_id,
        c.name as campaign_name,
        c.objective,
        c.start_date,
        c.end_date,
        p.name as project_name,
        (SELECT COUNT(*) FROM features WHERE campaign_id = c.id) as total_features,
        (SELECT COUNT(*) FROM task_assignments ta 
         JOIN features f ON ta.feature_id = f.id 
         WHERE f.campaign_id = c.id) as total_tasks,
        (SELECT COUNT(*) FROM task_assignments ta 
         JOIN features f ON ta.feature_id = f.id 
         WHERE f.campaign_id = c.id AND ta.status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM anomalies WHERE campaign_id = c.id) as total_anomalies,
        (SELECT COUNT(*) FROM anomalies WHERE campaign_id = c.id AND status = 'new') as new_anomalies,
        (SELECT COUNT(*) FROM anomalies WHERE campaign_id = c.id AND status = 'in_progress') as in_progress_anomalies,
        (SELECT COUNT(*) FROM anomalies WHERE campaign_id = c.id AND status = 'resolution_signaled') as awaiting_validation,
        (SELECT COUNT(*) FROM anomalies WHERE campaign_id = c.id AND status = 'validated') as validated_anomalies
      FROM campaigns c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1
    `;

    const result = await pool.query(query, [campaign_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    // Récupérer les détails des anomalies
    const anomaliesQuery = `
      SELECT a.*, f.name as feature_name, 
             u1.first_name || ' ' || u1.last_name as reporter_name,
             u2.first_name || ' ' || u2.last_name as assignee_name
      FROM anomalies a
      JOIN features f ON a.feature_id = f.id
      JOIN users u1 ON a.reported_by = u1.id
      LEFT JOIN users u2 ON a.assigned_to = u2.id
      WHERE a.campaign_id = $1
      ORDER BY a.created_at DESC
    `;
    const anomaliesResult = await pool.query(anomaliesQuery, [campaign_id]);

    // Récupérer les détails des fonctionnalités
    const featuresQuery = `
      SELECT f.*, 
             COUNT(DISTINCT ta.id) as total_assignments,
             COUNT(DISTINCT ta.id) FILTER (WHERE ta.status = 'completed') as completed_assignments
      FROM features f
      LEFT JOIN task_assignments ta ON f.id = ta.feature_id
      WHERE f.campaign_id = $1
      GROUP BY f.id
      ORDER BY f.priority DESC, f.created_at DESC
    `;
    const featuresResult = await pool.query(featuresQuery, [campaign_id]);

    const report = {
      summary: result.rows[0],
      anomalies: anomaliesResult.rows,
      features: featuresResult.rows,
      generated_at: new Date().toISOString()
    };

    res.json(report);
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du rapport' });
  }
};

module.exports = {
  getProjectDashboard,
  getCampaignDashboard,
  getPersonalDashboard,
  getActionHistory,
  generateCampaignReport
};
