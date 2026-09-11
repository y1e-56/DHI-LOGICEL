import { etapes } from './helpers.js';

export const FORMULAIRE = {
  id: 'formulaire',
  keywords: ['formulaire', 'form', 'champ', 'champs', 'input', 'saisie', 'validation', 'valider', 'envoi', 'soumettre', 'submit', 'questionnaire'],
  cases: [
    {
      name: 'Saisie valide et soumission',
      steps: etapes([
        '1. Ouvrir le formulaire.',
        '2. Renseigner correctement tous les champs.',
        '3. Soumettre.',
      ]),
      expected: 'Le formulaire est soumis et un message de confirmation s\'affiche.',
      priority: 'high',
    },
    {
      name: 'Champs obligatoires manquants',
      steps: etapes([
        '1. Laisser un champ obligatoire vide.',
        '2. Soumettre le formulaire.',
      ]),
      expected: 'Les champs obligatoires sont mis en évidence et l\'envoi est bloqué.',
      priority: 'high',
    },
    {
      name: 'Formats invalides',
      steps: etapes([
        '1. Saisir des valeurs au format invalide (email, téléphone, nombre, date).',
        '2. Soumettre.',
      ]),
      expected: 'Des messages d\'erreur précis indiquent le format attendu.',
      priority: 'medium',
    },
    {
      name: 'Longueur maximale et caractères spéciaux',
      steps: etapes([
        '1. Saisir un texte dépassant la longueur maximale ou contenant des caractères spéciaux.',
        '2. Soumettre.',
      ]),
      expected: 'La saisie est limitée ou signalée sans provoquer d\'erreur technique.',
      priority: 'low',
    },
  ],
};
