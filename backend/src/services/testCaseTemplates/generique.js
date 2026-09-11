import { etapes } from './helpers.js';

// Scénario de repli utilisé lorsqu'aucun scénario spécifique ne
// correspond aux mots-clés de la fonctionnalité.
export const GENERIQUE = {
  id: 'generique',
  cases: [
    {
      name: 'Scénario principal attendu',
      steps: etapes([
        '1. Ouvrir la fonctionnalité « {feature} ».',
        '2. Réaliser le parcours principal décrit.',
      ]),
      expected: 'Le parcours principal fonctionne comme décrit.',
      priority: 'high',
    },
    {
      name: 'Test avec des données limites',
      steps: etapes([
        '1. Tester la fonctionnalité avec des valeurs minimales, maximales et vides.',
      ]),
      expected: 'Les cas limites sont gérés sans erreur technique.',
      priority: 'medium',
    },
    {
      name: 'Vérification des messages d\'erreur',
      steps: etapes([
        '1. Provoquer volontairement des erreurs de saisie.',
        '2. Vérifier les messages affichés.',
      ]),
      expected: 'Des messages d\'erreur clairs et compréhensibles s\'affichent.',
      priority: 'medium',
    },
  ],
};
