import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class WebSocketService {
  private socket: Socket | null = null;
  private userId: number | null = null;

  connect(userId: number) {
    if (this.socket?.connected) {
      console.log('WebSocket déjà connecté');
      return;
    }

    this.userId = userId;
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connecté:', this.socket?.id);
      if (this.userId) {
        this.socket?.emit('join-user', this.userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket déconnecté');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  joinCampaign(campaignId: number) {
    if (this.socket) {
      this.socket.emit('join-campaign', campaignId);
    }
  }

  leaveCampaign(campaignId: number) {
    if (this.socket) {
      this.socket.emit('leave-campaign', campaignId);
    }
  }

  onNotification(callback: (notification: any) => void) {
    this.socket?.on('notification', callback);
  }

  onCampaignUpdate(callback: (update: any) => void) {
    this.socket?.on('campaign-update', callback);
  }

  onAnomalyCreated(callback: (anomaly: any) => void) {
    this.socket?.on('anomaly-created', callback);
  }

  onAnomalyUpdated(callback: (anomaly: any) => void) {
    this.socket?.on('anomaly-updated', callback);
  }

  onFeatureStatusChanged(callback: (feature: any) => void) {
    this.socket?.on('feature-status-changed', callback);
  }

  onTaskAssigned(callback: (task: any) => void) {
    this.socket?.on('task-assigned', callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const websocketService = new WebSocketService();
