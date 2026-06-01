import { Server } from 'socket.io';

let io;

export function initializeWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connecté: ${socket.id}`);

    // Rejoindre une salle de campagne
    socket.on('join-campaign', (campaignId) => {
      socket.join(`campaign-${campaignId}`);
      console.log(`Client ${socket.id} a rejoint la campagne ${campaignId}`);
    });

    // Quitter une salle de campagne
    socket.on('leave-campaign', (campaignId) => {
      socket.leave(`campaign-${campaignId}`);
      console.log(`Client ${socket.id} a quitté la campagne ${campaignId}`);
    });

    // Rejoindre la salle personnelle (pour les notifications)
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`Client ${socket.id} a rejoint la salle utilisateur ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client déconnecté: ${socket.id}`);
    });
  });

  return io;
}

export function getWebSocket() {
  return io;
}

// Événements pour les notifications en temps réel
export function emitNotification(userId, notification) {
  if (io) {
    io.to(`user-${userId}`).emit('notification', notification);
  }
}

// Événements pour les mises à jour de campagne
export function emitCampaignUpdate(campaignId, update) {
  if (io) {
    io.to(`campaign-${campaignId}`).emit('campaign-update', update);
  }
}

// Événements pour les nouvelles anomalies
export function emitAnomalyCreated(campaignId, anomaly) {
  if (io) {
    io.to(`campaign-${campaignId}`).emit('anomaly-created', anomaly);
  }
}

// Événements pour les mises à jour d'anomalie
export function emitAnomalyUpdated(campaignId, anomaly) {
  if (io) {
    io.to(`campaign-${campaignId}`).emit('anomaly-updated', anomaly);
  }
}

// Événements pour les changements de statut de fonctionnalité
export function emitFeatureStatusChanged(campaignId, feature) {
  if (io) {
    io.to(`campaign-${campaignId}`).emit('feature-status-changed', feature);
  }
}

// Événements pour les nouvelles tâches assignées
export function emitTaskAssigned(userId, task) {
  if (io) {
    io.to(`user-${userId}`).emit('task-assigned', task);
  }
}
