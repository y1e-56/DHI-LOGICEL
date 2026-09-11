import { etapes } from './helpers.js';

export const RAPPORT = {
  id: 'rapport',
  keywords: ['statistique', 'stats', 'rapport', 'report', 'graphique', 'chart', 'tableau de bord', 'dashboard', 'kpi', 'indicateur', 'analyse', 'métrique', 'metrique', 'tendance'],
  cases: [
    {
      name: 'Exactitude des données affichées',
      steps: etapes([
        '1. Ouvrir les statistiques / le rapport.',
        '2. Comparer les chiffres affichés avec les données sources.',
      ]),
      expected: 'Les données affichées sont exactes et à jour.',
      priority: 'high',
    },
    {
      name: 'Filtres de période',
      steps: etapes([
        '1. Appliquer différents filtres de période (jour, semaine, mois, année).',
      ]),
      expected: 'Les résultats et graphiques se mettent à jour selon la période choisie.',
      priority: 'medium',
    },
    {
      name: 'Export du rapport',
      steps: etapes([
        '1. Cliquer sur « Exporter » le rapport.',
        '2. Vérifier le fichier généré.',
      ]),
      expected: 'Le rapport exporté contient les données et graphiques attendus.',
      priority: 'high',
    },
    {
      name: 'Rapport sans données',
      steps: etapes([
        '1. Ouvrir le rapport sur une période sans données.',
      ]),
      expected: 'Un état vide explicite s\'affiche, sans erreur technique.',
      priority: 'low',
    },
  ],
};
