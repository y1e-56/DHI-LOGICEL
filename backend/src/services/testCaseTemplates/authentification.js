import { etapes } from './helpers.js';

export const AUTHENTIFICATION = {
  id: 'authentification',
  keywords: ['connexion', 'connecter', 'login', 'log in', 'authentification', 'authentifier', 'mot de passe', 'password', 'session', 'compte', 'inscription', 'register', 's\'inscrire', 'déconnexion', 'logout', 'identifiant', 'email', 'e-mail', 'oauth', 'sso', 'token', 'jwt'],
  cases: [
    {
      name: 'Connexion avec des identifiants valides',
      steps: etapes([
        '1. Ouvrir l\'écran de connexion.',
        '2. Saisir un identifiant et un mot de passe valides.',
        '3. Cliquer sur « Se connecter ».',
      ]),
      expected: 'L\'utilisateur est connecté et redirigé vers son espace.',
      priority: 'critical',
    },
    {
      name: 'Connexion avec un mot de passe incorrect',
      steps: etapes([
        '1. Saisir un identifiant valide et un mot de passe incorrect.',
        '2. Cliquer sur « Se connecter ».',
      ]),
      expected: 'Un message d\'erreur explicite est affiché et l\'accès est refusé.',
      priority: 'high',
    },
    {
      name: 'Connexion avec des identifiants vides',
      steps: etapes([
        '1. Laisser les champs identifiant et mot de passe vides.',
        '2. Cliquer sur « Se connecter ».',
      ]),
      expected: 'Les champs obligatoires sont signalés et la connexion est refusée.',
      priority: 'medium',
    },
    {
      name: 'Déconnexion',
      steps: etapes([
        '1. Être connecté.',
        '2. Cliquer sur le bouton « Se déconnecter ».',
      ]),
      expected: 'La session est fermée et l\'utilisateur est ramené à l\'écran de connexion.',
      priority: 'medium',
    },
    {
      name: 'Mot de passe oublié',
      steps: etapes([
        '1. Cliquer sur « Mot de passe oublié ».',
        '2. Saisir l\'adresse email du compte.',
        '3. Valider.',
      ]),
      expected: 'Un email de réinitialisation est envoyé et un message de confirmation s\'affiche.',
      priority: 'medium',
    },
  ],
};
