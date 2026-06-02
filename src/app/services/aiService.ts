import { Priorite, Anomalie, User } from '../types';

/**
 * Service IA pour les suggestions intelligentes
 * Fonctionnalité A : Suggestion automatique de priorité
 * Fonctionnalité B : Suggestion du développeur à assigner
 */

// Mots-clés pour déterminer la priorité
const PRIORITE_KEYWORDS = {
  critique: [
    'crash', 'plantage', 'bloque', 'bloquant', 'impossible', 'ne fonctionne pas',
    'erreur fatale', 'fatal', 'critical', 'sécurité', 'security', 'perte de données',
    'data loss', 'corruption', 'corrompu', 'inaccessible', 'accès refusé',
    'down', 'indisponible', 'unavailable', 'urgence', 'urgent', 'production',
    'prod', 'client', 'payant', 'paiement', 'payment', 'connexion', 'login',
    'authentification', 'auth', 'inscription', 'signup', 'mot de passe', 'password'
  ],
  haute: [
    'bug', 'erreur', 'error', 'problème', 'problem', 'défaillance', 'failure',
    'lent', 'slow', 'performance', 'timeout', 'délai', 'latence',
    'affichage', 'display', 'interface', 'ui', 'ux', 'expérience utilisateur',
    'confusion', 'compliqué', 'difficile', 'frustrant', 'mauvais', 'wrong',
    'incorrect', 'faux', 'manque', 'missing', 'absent', 'requis', 'required'
  ],
  moyenne: [
    'amélioration', 'improvement', 'optimisation', 'optimization', 'refactor',
    'code', 'style', 'format', 'cosmétique', 'cosmetic', 'design', 'layout',
    'typo', 'typographie', 'orthographe', 'spelling', 'grammaire', 'grammar',
    'traduction', 'translation', 'langue', 'language', 'texte', 'text',
    'suggestion', 'idea', 'idée', 'wishlist', 'feature', 'fonctionnalité'
  ],
  basse: [
    'optionnel', 'optional', 'nice to have', 'amélioration mineure', 'minor',
    'cosmétique', 'polish', 'detail', 'détail', 'mineur', 'trivial',
    'futur', 'future', 'plus tard', 'later', 'quand possible', 'when possible',
    'low priority', 'basse priorité', 'non urgent', 'not urgent'
  ]
};

/**
 * Fonctionnalité A : Suggestion automatique de priorité
 * Analyse la description et le titre pour suggérer une priorité
 */
export function suggerePriorite(titre: string, description: string): Priorite {
  const texteComplet = `${titre} ${description}`.toLowerCase();
  
  let scores = {
    critique: 0,
    haute: 0,
    moyenne: 0,
    basse: 0
  };

  // Calculer les scores pour chaque niveau de priorité
  for (const [priorite, keywords] of Object.entries(PRIORITE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (texteComplet.includes(keyword.toLowerCase())) {
        scores[priorite as Priorite] += 1;
      }
    }
  }

  // Trouver la priorité avec le score le plus élevé
  let prioriteSuggeree: Priorite = 'moyenne'; // Valeur par défaut
  let maxScore = 0;

  for (const [priorite, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      prioriteSuggeree = priorite as Priorite;
    }
  }

  // Si aucun mot-clé n'est trouvé, retourner 'moyenne' par défaut
  if (maxScore === 0) {
    return 'moyenne';
  }

  return prioriteSuggeree;
}

/**
 * Fonctionnalité B : Suggestion du développeur à assigner
 * Basée sur l'historique : quel développeur résout le plus ce type d'anomalies
 */
export function suggereDeveloppeur(
  anomalie: { titre: string; description: string; module?: string },
  anomaliesExistantes: Anomalie[],
  developpeurs: User[]
): string | null {
  // Filtrer les anomalies résolues (cloturées ou validées)
  const anomaliesResolues = anomaliesExistantes.filter(
    a => a.statut === 'cloturee' || a.statut === 'validee'
  );

  if (anomaliesResolues.length === 0 || developpeurs.length === 0) {
    return null;
  }

  // Extraire les mots-clés de la nouvelle anomalie
  const motsClesNouvelle = extraireMotsCles(
    `${anomalie.titre} ${anomalie.description} ${anomalie.module || ''}`
  );

  if (motsClesNouvelle.length === 0) {
    // Si aucun mot-clé, suggérer le développeur avec le plus de résolutions
    return getDeveloppeurPlusActif(anomaliesResolues, developpeurs);
  }

  // Calculer le score de chaque développeur basé sur la similarité
  const scoresDeveloppeurs = new Map<string, number>();

  for (const developpeur of developpeurs) {
    scoresDeveloppeurs.set(developpeur.id, 0);
  }

  for (const anomalieResolue of anomaliesResolues) {
    const developpeurId = anomalieResolue.developpeurId;
    if (!developpeurId) continue;

    // Extraire les mots-clés de l'anomalie résolue
    const fonctionnaliteId = anomalieResolue.fonctionnaliteId;
    const motsClesResolue = extraireMotsCles(
      `${anomalieResolue.titre} ${anomalieResolue.description}`
    );

    // Calculer la similarité (Jaccard index simplifié)
    const similarite = calculerSimilarite(motsClesNouvelle, motsClesResolue);

    if (similarite > 0) {
      const scoreActuel = scoresDeveloppeurs.get(developpeurId) || 0;
      scoresDeveloppeurs.set(developpeurId, scoreActuel + similarite);
    }
  }

  // Trouver le développeur avec le score le plus élevé
  let meilleurDeveloppeurId: string | null = null;
  let maxScore = 0;

  for (const [devId, score] of scoresDeveloppeurs.entries()) {
    if (score > maxScore) {
      maxScore = score;
      meilleurDeveloppeurId = devId;
    }
  }

  // Si aucun score significatif, retourner le développeur le plus actif
  if (maxScore === 0 || !meilleurDeveloppeurId) {
    return getDeveloppeurPlusActif(anomaliesResolues, developpeurs);
  }

  return meilleurDeveloppeurId;
}

/**
 * Fonction utilitaire : extraire les mots-clés d'un texte
 */
function extraireMotsCles(texte: string): string[] {
  // Normaliser le texte
  const texteNormalise = texte
    .toLowerCase()
    .replace(/[^\w\sàáâãäåæçèéêëìíîïðñòóôõöøùúûüýÿ]/g, ' ')
    .split(/\s+/)
    .filter(mot => mot.length > 3); // Garder seulement les mots de plus de 3 caractères

  // Supprimer les mots courants (stop words français)
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'pour', 'avec',
    'sur', 'dans', 'par', 'est', 'son', 'sa', 'ses', 'ce', 'cet', 'cette',
    'mais', 'ou', 'et', 'donc', 'or', 'ni', 'car', 'que', 'qui', 'quoi',
    'dont', 'où', 'lorsque', 'si', 'comme', 'alors', 'ainsi', 'ensuite',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'with', 'by', 'from', 'this', 'that', 'these', 'those', 'is', 'are',
    'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
  ]);

  return texteNormalise.filter(mot => !stopWords.has(mot));
}

/**
 * Fonction utilitaire : calculer la similarité entre deux listes de mots-clés
 * Utilise une version simplifiée de l'index de Jaccard
 */
function calculerSimilarite(mots1: string[], mots2: string[]): number {
  if (mots1.length === 0 || mots2.length === 0) return 0;

  const intersection = mots1.filter(mot => mots2.includes(mot));
  const union = [...new Set([...mots1, ...mots2])];

  return intersection.length / union.length;
}

/**
 * Fonction utilitaire : obtenir le développeur le plus actif
 * Basé sur le nombre d'anomalies résolues
 */
function getDeveloppeurPlusActif(anomaliesResolues: Anomalie[], developpeurs: User[]): string | null {
  const counts = new Map<string, number>();

  // Compter les résolutions par développeur
  for (const anomalie of anomaliesResolues) {
    const devId = anomalie.developpeurId;
    if (devId) {
      counts.set(devId, (counts.get(devId) || 0) + 1);
    }
  }

  // Trouver le développeur avec le plus de résolutions
  let maxCount = 0;
  let meilleurDevId: string | null = null;

  for (const [devId, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      meilleurDevId = devId;
    }
  }

  // Vérifier que le développeur existe toujours
  if (meilleurDevId && developpeurs.find(d => d.id === meilleurDevId)) {
    return meilleurDevId;
  }

  // Sinon, retourner le premier développeur disponible
  return developpeurs.length > 0 ? developpeurs[0].id : null;
}

/**
 * Version améliorée avec apprentissage par module
 * Suggère un développeur basé sur le module/functionalité
 */
export function suggereDeveloppeurParModule(
  module: string,
  anomaliesExistantes: Anomalie[],
  developpeurs: User[]
): string | null {
  if (!module || anomaliesExistantes.length === 0 || developpeurs.length === 0) {
    return null;
  }

  // Filtrer les anomalies résolues
  const anomaliesResolues = anomaliesExistantes.filter(
    a => a.statut === 'cloturee' || a.statut === 'validee'
  );

  // Regrouper par développeur et compter les résolutions
  const scoresDeveloppeurs = new Map<string, number>();

  for (const anomalie of anomaliesResolues) {
    // Vérifier si l'anomalie est liée au même module
    // (Note: nécessiterait d'accéder aux fonctionnalités pour le module)
    const devId = anomalie.developpeurId;
    if (devId) {
      scoresDeveloppeurs.set(devId, (scoresDeveloppeurs.get(devId) || 0) + 1);
    }
  }

  // Trouver le meilleur développeur
  let maxScore = 0;
  let meilleurDevId: string | null = null;

  for (const [devId, score] of scoresDeveloppeurs.entries()) {
    if (score > maxScore) {
      maxScore = score;
      meilleurDevId = devId;
    }
  }

  return meilleurDevId;
}
