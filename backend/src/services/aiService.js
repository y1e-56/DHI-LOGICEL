/**
 * Service IA - Intégration avec Ollama (Mistral)
 *
 * Ce service communique avec Ollama qui tourne en local sur http://localhost:11434
 * Modèle utilisé : mistral (open-source, 7B paramètres, français)
 *
 * Prérequis :
 *   1. Installer Ollama : https://ollama.com/download
 *   2. Télécharger le modèle : ollama pull mistral
 *   3. Ollama doit tourner en arrière-plan (service automatique sur Windows)
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

/**
 * Appel générique à Ollama (génération de texte)
 * @param {string} prompt - Le prompt à envoyer au modèle
 * @param {object} options - Options : temperature, format
 * @returns {Promise<string>} La réponse du modèle
 */
const generate = async (prompt, options = {}) => {
  const { temperature = 0.3, format = null } = options;

  try {
    const body = {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature }
    };
    if (format) body.format = format;

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Ollama a répondu avec le code ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED') {
      throw new Error('Ollama n\'est pas démarré. Lancez Ollama puis réessayez.');
    }
    throw error;
  }
};

/**
 * Vérifier qu'Ollama est disponible
 */
const healthCheck = async () => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) return { available: false };
    const data = await response.json();
    const models = (data.models || []).map(m => m.name);
    return {
      available: true,
      models,
      modelLoaded: models.some(m => m.startsWith(OLLAMA_MODEL))
    };
  } catch (error) {
    return { available: false, error: error.message };
  }
};

/**
 * Suggérer la priorité d'une anomalie à partir de sa description
 * @param {string} description
 * @returns {Promise<{priority: string, reason: string}>}
 */
const suggestAnomalyPriority = async (description) => {
  const prompt = `Tu es un expert en qualité logicielle. Analyse la description suivante d'une anomalie et détermine sa priorité.

Description de l'anomalie :
"${description}"

Choisis UNE seule priorité parmi : low, medium, high, critical

Règles :
- "critical" : bloque totalement l'utilisation, perte de données, faille de sécurité majeure
- "high" : fonctionnalité importante cassée, contournement difficile
- "medium" : bug visible mais contournable, fonctionnalité secondaire
- "low" : problème cosmétique, faute de frappe, amélioration mineure

Réponds UNIQUEMENT au format JSON suivant, sans aucun texte autour :
{"priority": "low|medium|high|critical", "reason": "explication courte en français"}`;

  const raw = await generate(prompt, { temperature: 0.2, format: 'json' });

  try {
    const parsed = JSON.parse(raw);
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(parsed.priority)) {
      parsed.priority = 'medium';
    }
    return {
      priority: parsed.priority,
      reason: parsed.reason || 'Analyse automatique'
    };
  } catch (e) {
    // Si le parsing échoue, retour par défaut
    return { priority: 'medium', reason: 'Impossible d\'analyser la réponse de l\'IA' };
  }
};

/**
 * Suggérer un développeur à assigner basé sur l'historique
 * Analyse : qui a résolu le plus d'anomalies similaires
 * @param {Array} developers - Liste des développeurs candidats [{id, name, resolvedCount, avgResolutionDays}]
 * @param {string} anomalyDescription
 * @returns {Promise<{developerId, reason}>}
 */
const suggestDeveloper = async (developers, anomalyDescription) => {
  if (!developers || developers.length === 0) {
    return { developerId: null, reason: 'Aucun développeur disponible' };
  }

  // Si un seul candidat, retour direct
  if (developers.length === 1) {
    return {
      developerId: developers[0].id,
      reason: 'Seul développeur disponible dans la campagne'
    };
  }

  const devList = developers
    .map((d, i) => `${i + 1}. ID=${d.id} | ${d.name} | ${d.resolvedCount} anomalies résolues | ${d.avgResolutionDays || 'N/A'} jours moyens`)
    .join('\n');

  const prompt = `Tu es un assistant pour l'assignation de tâches en qualité logicielle.

Voici une nouvelle anomalie à assigner :
"${anomalyDescription}"

Voici les développeurs disponibles avec leur historique :
${devList}

Choisis le meilleur développeur en privilégiant :
- Celui qui a résolu le plus d'anomalies (charge équilibrée + expérience)
- Celui qui résout le plus rapidement (jours moyens faibles)

Réponds UNIQUEMENT au format JSON, sans texte autour :
{"developerId": <ID numérique du développeur choisi>, "reason": "explication courte en français"}`;

  const raw = await generate(prompt, { temperature: 0.2, format: 'json' });

  try {
    const parsed = JSON.parse(raw);
    const exists = developers.some(d => String(d.id) === String(parsed.developerId));
    if (!exists) {
      // Fallback : prendre celui avec le plus d'anomalies résolues
      const best = developers.sort((a, b) => b.resolvedCount - a.resolvedCount)[0];
      return { developerId: best.id, reason: 'Sélection automatique par historique' };
    }
    return {
      developerId: parsed.developerId,
      reason: parsed.reason || 'Recommandation IA'
    };
  } catch (e) {
    const best = developers.sort((a, b) => b.resolvedCount - a.resolvedCount)[0];
    return { developerId: best.id, reason: 'Sélection automatique par historique' };
  }
};

/**
 * Détecter les doublons potentiels d'anomalies (par similarité textuelle simple)
 * @param {string} newDescription - Description de la nouvelle anomalie
 * @param {Array} existingAnomalies - [{id, description}]
 * @returns {Promise<Array>} Liste des doublons potentiels avec score
 */
const detectDuplicates = async (newDescription, existingAnomalies) => {
  if (!existingAnomalies || existingAnomalies.length === 0) return [];

  // Limite : on n'envoie que les 20 dernières pour éviter de surcharger le LLM
  const candidates = existingAnomalies.slice(0, 20);
  const list = candidates
    .map((a, i) => `${i + 1}. ID=${a.id} : "${a.description?.substring(0, 200)}"`)
    .join('\n');

  const prompt = `Tu détectes les doublons d'anomalies.

Nouvelle anomalie : "${newDescription}"

Anomalies existantes :
${list}

Identifie les anomalies existantes qui décrivent le MÊME problème (similarité sémantique forte, pas juste quelques mots en commun).

Réponds UNIQUEMENT au format JSON, sans texte autour :
{"duplicates": [{"id": <id>, "similarity": <0-100>, "reason": "explication courte"}]}

Si aucun doublon : {"duplicates": []}`;

  const raw = await generate(prompt, { temperature: 0.1, format: 'json' });

  try {
    const parsed = JSON.parse(raw);
    return (parsed.duplicates || []).filter(d => d.similarity >= 70);
  } catch (e) {
    return [];
  }
};

module.exports = {
  generate,
  healthCheck,
  suggestAnomalyPriority,
  suggestDeveloper,
  detectDuplicates
};
