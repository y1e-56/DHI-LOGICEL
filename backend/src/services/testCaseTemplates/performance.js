import { etapes } from './helpers.js';

export const PERFORMANCE = {
  id: 'performance',
  keywords: ['performance', 'vitesse', 'rapide', 'rapidité', 'rapidite', 'temps de chargement', 'chargement', 'latence', 'lent', 'slow', 'fluidité', 'fluidite'],
  cases: [
    {
      name: 'Temps de chargement initial',
      steps: etapes([
        '1. Ouvrir la fonctionnalité « {feature} ».',
        '2. Mesurer le temps avant l\'affichage complet.',
      ]),
      expected: 'La page se charge dans un délai acceptable et les indicateurs de chargement s\'affichent.',
      priority: 'high',
    },
    {
      name: 'Comportement avec un grand volume de données',
      steps: etapes([
        '1. Ouvrir la fonctionnalité avec un volume important de données.',
        '2. Parcourir et filtrer les données.',
      ]),
      expected: 'L\'affichage reste fluide et la pagination / virtualisation fonctionne.',
      priority: 'medium',
    },
    {
      name: 'Réactivité des actions',
      steps: etapes([
        '1. Exécuter plusieurs actions successives (navigation, enregistrement).',
      ]),
      expected: 'Chaque action répond sans blocage ni ralentissement perceptible.',
      priority: 'medium',
    },
  ],
};
