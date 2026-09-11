import { etapes } from './helpers.js';

export const API = {
  id: 'api',
  keywords: ['api', 'intégration', 'integration', 'webhook', 'endpoint', 'service externe', 'service tiers', 'synchronisation', 'sync', 'interface de programmation'],
  cases: [
    {
      name: 'Appel API nominal',
      steps: etapes([
        '1. Envoyer une requête valide au service.',
        '2. Vérifier la réponse.',
      ]),
      expected: 'Le service répond avec les données attendues et le bon code de statut.',
      priority: 'high',
    },
    {
      name: 'Erreur API et délai dépassé',
      steps: etapes([
        '1. Simuler une erreur ou un dépassement de délai du service externe.',
      ]),
      expected: 'L\'erreur est gérée proprement avec un message explicite, sans interruption.',
      priority: 'high',
    },
    {
      name: 'Authentification du service',
      steps: etapes([
        '1. Appeler le service sans clé / jeton ou avec une clé invalide.',
      ]),
      expected: 'L\'accès est refusé et l\'erreur d\'authentification est signalée.',
      priority: 'critical',
    },
  ],
};
