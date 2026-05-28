const aiService = require('../services/aiService');
const pool = require('../config/database');

/**
 * GET /api/ai/health
 * Vérifie qu'Ollama est disponible
 */
const health = async (req, res) => {
  try {
    const result = await aiService.healthCheck();
    res.json(result);
  } catch (error) {
    res.status(500).json({ available: false, error: error.message });
  }
};

/**
 * POST /api/ai/suggest-priority
 * Body: { description }
 * Retourne la priorité suggérée pour une anomalie
 */
const suggestPriority = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        message: 'La description doit contenir au moins 10 caractères'
      });
    }

    const result = await aiService.suggestAnomalyPriority(description);
    res.json(result);
  } catch (error) {
    console.error('Erreur IA suggest-priority:', error.message);
    res.status(503).json({
      message: 'Service IA indisponible',
      error: error.message,
      fallback: { priority: 'medium', reason: 'Valeur par défaut (IA indisponible)' }
    });
  }
};

/**
 * POST /api/ai/suggest-developer
 * Body: { campaign_id, description }
 * Retourne le développeur recommandé basé sur l'historique
 */
const suggestDeveloper = async (req, res) => {
  try {
    const { campaign_id, description } = req.body;

    if (!campaign_id || !description) {
      return res.status(400).json({
        message: 'campaign_id et description sont obligatoires'
      });
    }

    // Récupérer les développeurs membres de la campagne avec stats
    const query = `
      SELECT
        u.id,
        u.first_name || ' ' || u.last_name AS name,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'validated') AS resolved_count,
        AVG(EXTRACT(EPOCH FROM (a.updated_at - a.created_at)) / 86400)
          FILTER (WHERE a.status = 'validated') AS avg_resolution_days
      FROM users u
      INNER JOIN campaign_members cm ON cm.user_id = u.id
      LEFT JOIN anomalies a ON a.assigned_to = u.id
      WHERE cm.campaign_id = $1
        AND cm.team_type = 'developer'
        AND u.is_active = true
      GROUP BY u.id, u.first_name, u.last_name
    `;

    const result = await pool.query(query, [campaign_id]);
    const developers = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      resolvedCount: parseInt(r.resolved_count) || 0,
      avgResolutionDays: r.avg_resolution_days ? parseFloat(r.avg_resolution_days).toFixed(1) : null
    }));

    if (developers.length === 0) {
      return res.status(404).json({
        message: 'Aucun développeur trouvé dans cette campagne'
      });
    }

    const suggestion = await aiService.suggestDeveloper(developers, description);
    res.json({
      ...suggestion,
      candidates: developers
    });
  } catch (error) {
    console.error('Erreur IA suggest-developer:', error.message);
    res.status(503).json({
      message: 'Service IA indisponible',
      error: error.message
    });
  }
};

/**
 * POST /api/ai/detect-duplicates
 * Body: { campaign_id, description }
 * Détecte les anomalies en doublon dans la campagne
 */
const detectDuplicates = async (req, res) => {
  try {
    const { campaign_id, description } = req.body;

    if (!campaign_id || !description) {
      return res.status(400).json({
        message: 'campaign_id et description sont obligatoires'
      });
    }

    const query = `
      SELECT id, description
      FROM anomalies
      WHERE campaign_id = $1
        AND status != 'validated'
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const result = await pool.query(query, [campaign_id]);
    const existing = result.rows;

    if (existing.length === 0) {
      return res.json({ duplicates: [] });
    }

    const duplicates = await aiService.detectDuplicates(description, existing);

    // Enrichir avec les descriptions pour l'affichage
    const enriched = duplicates.map(d => {
      const orig = existing.find(e => String(e.id) === String(d.id));
      return { ...d, description: orig?.description };
    });

    res.json({ duplicates: enriched });
  } catch (error) {
    console.error('Erreur IA detect-duplicates:', error.message);
    res.status(503).json({
      message: 'Service IA indisponible',
      error: error.message
    });
  }
};

module.exports = {
  health,
  suggestPriority,
  suggestDeveloper,
  detectDuplicates
};
