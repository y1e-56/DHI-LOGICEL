import { etapes } from './helpers.js';

export const FICHIER = {
  id: 'fichier',
  keywords: ['fichier', 'file', 'import', 'exporter', 'export', 'télécharger', 'telecharger', 'download', 'upload', 'téléverser', 'pièce jointe', 'piece jointe', 'attachment', 'image', 'photo', 'document', 'csv', 'excel', 'pdf'],
  cases: [
    {
      name: 'Téléversement d\'un fichier valide',
      steps: etapes([
        '1. Ouvrir la zone de téléversement.',
        '2. Choisir un fichier au format autorisé.',
        '3. Valider le téléversement.',
      ]),
      expected: 'Le fichier est téléversé et disponible.',
      priority: 'high',
    },
    {
      name: 'Format de fichier non autorisé',
      steps: etapes([
        '1. Tenter de téléverser un fichier dont le format n\'est pas autorisé.',
      ]),
      expected: 'Un message d\'erreur clair signale le format et le fichier est refusé.',
      priority: 'medium',
    },
    {
      name: 'Fichier trop volumineux',
      steps: etapes([
        '1. Tenter de téléverser un fichier dépassant la taille maximale.',
      ]),
      expected: 'Un message signale la taille limite et le fichier est refusé proprement.',
      priority: 'medium',
    },
    {
      name: 'Export / téléchargement',
      steps: etapes([
        '1. Cliquer sur le bouton d\'export.',
        '2. Vérifier le fichier téléchargé.',
      ]),
      expected: 'Le fichier exporté contient les bonnes données et s\'ouvre correctement.',
      priority: 'high',
    },
  ],
};
