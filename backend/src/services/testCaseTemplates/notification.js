import { etapes } from './helpers.js';

export const NOTIFICATION = {
  id: 'notification',
  keywords: ['notification', 'notifier', 'alerte', 'alert', 'email', 'e-mail', 'message', 'rappel', 'reminder', 'relance', 'signal', 'push'],
  cases: [
    {
      name: 'Envoi de la notification',
      steps: etapes([
        '1. Déclencher l\'événement à l\'origine de la notification.',
        '2. Vérifier la réception de la notification.',
      ]),
      expected: 'La notification est envoyée au bon destinataire avec le bon contenu.',
      priority: 'high',
    },
    {
      name: 'Lecture et marquage de la notification',
      steps: etapes([
        '1. Ouvrir la liste des notifications.',
        '2. Ouvrir une notification.',
      ]),
      expected: 'La notification s\'ouvre, est marquée comme lue et le compteur se met à jour.',
      priority: 'medium',
    },
    {
      name: 'Échec d\'envoi de la notification',
      steps: etapes([
        '1. Simuler une erreur lors de l\'envoi (destinataire invalide, service indisponible).',
      ]),
      expected: 'L\'échec est géré sans bloquer l\'application et sans erreur technique visible.',
      priority: 'medium',
    },
    {
      name: 'Lien depuis la notification',
      steps: etapes([
        '1. Ouvrir une notification contenant un lien.',
        '2. Cliquer sur le lien.',
      ]),
      expected: 'La navigation redirige vers la page concernée.',
      priority: 'low',
    },
  ],
};
