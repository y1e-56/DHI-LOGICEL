import { etapes } from './helpers.js';

export const INTERFACE = {
  id: 'interface',
  keywords: ['navigation', 'affichage', 'display', 'interface', 'ui', 'ux', 'responsive', 'mobile', 'écran', 'ecran', 'menu', 'layout', 'page', 'fenêtre', 'fenetre', 'titre', 'bouton', 'icône', 'icone'],
  cases: [
    {
      name: 'Navigation dans l\'interface',
      steps: etapes([
        '1. Naviguer entre les différentes sections de la fonctionnalité.',
        '2. Vérifier la cohérence des menus et des boutons.',
      ]),
      expected: 'La navigation est fluide et sans lien mort.',
      priority: 'medium',
    },
    {
      name: 'Affichage responsive',
      steps: etapes([
        '1. Ouvrir la fonctionnalité sur différentes tailles d\'écran (mobile, tablette, ordinateur).',
      ]),
      expected: 'Le contenu s\'adapte correctement à toutes les tailles d\'écran.',
      priority: 'medium',
    },
    {
      name: 'États vide et de chargement',
      steps: etapes([
        '1. Afficher la fonctionnalité sans données.',
        '2. Vérifier l\'état pendant le chargement.',
      ]),
      expected: 'Un état vide et un indicateur de chargement clairs sont affichés.',
      priority: 'low',
    },
    {
      name: 'Retour en arrière',
      steps: etapes([
        '1. Naviguer vers un écran puis revenir en arrière.',
      ]),
      expected: 'Le retour en arrière préserve l\'état et l\'historique de navigation.',
      priority: 'low',
    },
  ],
};
