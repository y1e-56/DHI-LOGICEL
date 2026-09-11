import { etapes } from './helpers.js';

export const PERMISSIONS = {
  id: 'permissions',
  keywords: ['rôle', 'role', 'roles', 'permission', 'permissions', 'droit', 'droits', 'accès', 'acces', 'access', 'sécurité', 'securite', 'security', 'autorisation', 'autoriser', 'privilege', 'privilège'],
  cases: [
    {
      name: 'Accès autorisé pour le rôle concerné',
      steps: etapes([
        '1. Se connecter avec un utilisateur disposant du rôle requis.',
        '2. Ouvrir la fonctionnalité « {feature} ».',
      ]),
      expected: 'L\'utilisateur accède aux fonctionnalités autorisées pour son rôle.',
      priority: 'critical',
    },
    {
      name: 'Accès refusé sans permission',
      steps: etapes([
        '1. Se connecter avec un utilisateur sans le rôle requis.',
        '2. Tenter d\'accéder à la fonctionnalité « {feature} ».',
      ]),
      expected: 'L\'accès est refusé avec un message approprié.',
      priority: 'critical',
    },
    {
      name: 'Protection des données sensibles',
      steps: etapes([
        '1. Vérifier que les données sensibles ne sont visibles que par les rôles autorisés.',
      ]),
      expected: 'Aucune donnée sensible n\'est exposée à un rôle non autorisé.',
      priority: 'high',
    },
  ],
};
