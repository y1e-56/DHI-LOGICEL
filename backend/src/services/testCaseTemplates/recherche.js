import { etapes } from './helpers.js';

export const RECHERCHE = {
  id: 'recherche',
  keywords: ['recherche', 'rechercher', 'search', 'filtre', 'filtrer', 'filter', 'tri', 'trier', 'sort', 'filtres'],
  cases: [
    {
      name: 'Recherche par mot-clé',
      steps: etapes([
        '1. Ouvrir la fonctionnalité « {feature} ».',
        '2. Saisir un mot-clé existant.',
        '3. Lancer la recherche.',
      ]),
      expected: 'Les résultats correspondants s\'affichent correctement.',
      priority: 'high',
    },
    {
      name: 'Recherche sans résultat',
      steps: etapes([
        '1. Saisir un mot-clé sans correspondance.',
        '2. Lancer la recherche.',
      ]),
      expected: 'Un message « aucun résultat » clair s\'affiche.',
      priority: 'medium',
    },
    {
      name: 'Recherche avec caractères spéciaux ou espaces',
      steps: etapes([
        '1. Saisir une recherche avec des espaces multiples ou caractères spéciaux.',
        '2. Lancer la recherche.',
      ]),
      expected: 'La recherche ne provoque aucune erreur technique.',
      priority: 'low',
    },
    {
      name: 'Combinaison de filtres',
      steps: etapes([
        '1. Activer plusieurs filtres simultanément.',
        '2. Vérifier la liste des résultats.',
      ]),
      expected: 'Les filtres se combinent correctement et les résultats sont cohérents.',
      priority: 'medium',
    },
  ],
};
