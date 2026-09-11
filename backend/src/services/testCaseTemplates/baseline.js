import { etapes } from './helpers.js';

// Cas de base toujours générés pour toute fonctionnalité.
export const BASELINE = [
  {
    name: 'Affichage de la fonctionnalité',
    steps: etapes([
      '1. Ouvrir la fonctionnalité « {feature} ».',
      '2. Vérifier que tous les éléments s\'affichent correctement (intitulés, boutons, champs).',
      '3. Vérifier qu\'aucune erreur technique n\'apparaît.',
    ]),
    expected: 'L\'écran de la fonctionnalité s\'affiche correctement, sans erreur technique.',
    priority: 'medium',
  },
  {
    name: 'Parcours nominal avec des données valides',
    steps: etapes([
      '1. Ouvrir la fonctionnalité « {feature} ».',
      '2. Exécuter le scénario principal avec des données valides.',
      '3. Valider l\'action.',
    ]),
    expected: 'L\'action se déroule sans erreur et le résultat attendu est obtenu.',
    priority: 'high',
  },
  {
    name: 'Soumission sans données (cas négatif)',
    steps: etapes([
      '1. Ouvrir la fonctionnalité « {feature} ».',
      '2. Ne saisir aucune donnée.',
      '3. Tenter de valider.',
    ]),
    expected: 'Un message d\'erreur clair est affiché et aucune donnée n\'est enregistrée.',
    priority: 'medium',
  },
];
