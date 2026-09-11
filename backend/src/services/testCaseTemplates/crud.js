import { etapes } from './helpers.js';

export const CRUD = {
  id: 'crud',
  keywords: ['créer', 'creer', 'ajouter', 'liste', 'lister', 'modifier', 'éditer', 'editer', 'mettre à jour', 'supprimer', 'delete', 'create', 'update', 'enregistrer', 'sauvegarder', 'gestion', 'gérer', 'détail', 'detail', 'crud', 'entité', 'enregistrement'],
  cases: [
    {
      name: 'Création avec des données valides',
      steps: etapes([
        '1. Ouvrir la fonctionnalité « {feature} ».',
        '2. Cliquer sur « Créer / Nouveau ».',
        '3. Renseigner des données valides.',
        '4. Enregistrer.',
      ]),
      expected: 'L\'élément est créé et apparaît dans la liste.',
      priority: 'high',
    },
    {
      name: 'Création avec des données invalides',
      steps: etapes([
        '1. Ouvrir la création d\'un élément.',
        '2. Renseigner des données invalides ou incomplètes.',
        '3. Enregistrer.',
      ]),
      expected: 'Des messages d\'erreur clairs s\'affichent et aucun élément n\'est créé.',
      priority: 'high',
    },
    {
      name: 'Affichage de la liste et du détail',
      steps: etapes([
        '1. Ouvrir la liste des éléments.',
        '2. Ouvrir le détail d\'un élément.',
      ]),
      expected: 'La liste et le détail affichent des données exactes et cohérentes.',
      priority: 'medium',
    },
    {
      name: 'Modification d\'un élément',
      steps: etapes([
        '1. Ouvrir le détail d\'un élément existant.',
        '2. Modifier un champ.',
        '3. Enregistrer les modifications.',
      ]),
      expected: 'Les modifications sont enregistrées et visibles après rechargement.',
      priority: 'high',
    },
    {
      name: 'Suppression avec confirmation',
      steps: etapes([
        '1. Ouvrir le détail d\'un élément.',
        '2. Cliquer sur « Supprimer ».',
        '3. Confirmer la suppression.',
      ]),
      expected: 'Un message de confirmation est demandé puis l\'élément disparaît de la liste.',
      priority: 'medium',
    },
  ],
};
