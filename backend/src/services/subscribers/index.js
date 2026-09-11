import bus from '../../lib/eventBus.js';
import { registerNotificationSubscribers } from './notifications.js';
import { registerEmailSubscribers } from './emails.js';
import { registerSocketSubscribers } from './socketChanges.js';
import { registerHistorySubscribers } from './history.js';

// Point d'entrée unique d'enregistrement des abonnés aux événements
// du bus. Répartit les responsabilités par canal de sortie :
// notifications in-app, emails, diffusion socket et audit historique.

export function setupEventSubscribers(io) {
  registerNotificationSubscribers(bus, io);
  registerEmailSubscribers(bus);
  registerSocketSubscribers(bus, io);
  registerHistorySubscribers(bus);
}
