import { etapes } from './helpers.js';

export const PAIEMENT = {
  id: 'paiement',
  keywords: ['paiement', 'payer', 'payment', 'panier', 'cart', 'commande', 'order', 'facture', 'facturation', 'billing', 'checkout', 'caisse', 'transaction', 'carte bancaire', 'cb', 'paiement en ligne', 'abonnement'],
  cases: [
    {
      name: 'Paiement réussi',
      steps: etapes([
        '1. Préparer une commande avec des articles valides.',
        '2. Saisir des coordonnées bancaires valides.',
        '3. Confirmer le paiement.',
      ]),
      expected: 'Le paiement aboutit et un reçu / accusé de réception s\'affiche.',
      priority: 'critical',
    },
    {
      name: 'Paiement refusé',
      steps: etapes([
        '1. Préparer une commande.',
        '2. Saisir des coordonnées bancaires invalides ou un montant non autorisé.',
        '3. Confirmer le paiement.',
      ]),
      expected: 'Le paiement est refusé avec un message clair, sans débit.',
      priority: 'critical',
    },
    {
      name: 'Éviter les paiements en double',
      steps: etapes([
        '1. Confirmer le paiement puis cliquer plusieurs fois sur « Payer ».',
      ]),
      expected: 'Une seule transaction est débitée, les clics multiples sont ignorés.',
      priority: 'high',
    },
    {
      name: 'Annulation de la commande',
      steps: etapes([
        '1. Préparer une commande.',
        '2. Annuler avant la confirmation du paiement.',
      ]),
      expected: 'La commande est annulée proprement et aucun débit n\'est effectué.',
      priority: 'medium',
    },
  ],
};
