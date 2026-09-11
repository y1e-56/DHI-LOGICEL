import { emitNotification, emitDataChanged, emitCampaignCreated, emitCampaignUpdated, emitCampaignDeleted } from '../../socket.js';

// Abonnements du bus d'événements responsables de la diffusion des
// changements en temps réel (Socket.IO) aux clients connectés.

export function registerSocketSubscribers(bus, io) {
  bus.on('campaign:created', async ({ campaign }) => {
    if (io) { emitCampaignCreated(io, campaign); emitDataChanged(io, 'campaigns'); }
  });

  bus.on('campaign:updated', async ({ campaign }) => {
    if (io) { emitCampaignUpdated(io, campaign); emitDataChanged(io, 'campaigns'); }
  });

  bus.on('campaign:deleted', async ({ campaign_id }) => {
    if (io) { emitCampaignDeleted(io, campaign_id); emitDataChanged(io, 'campaigns'); emitDataChanged(io, 'features'); }
  });

  bus.on('project:created', async () => { if (io) emitDataChanged(io, 'projects'); });
  bus.on('project:updated', async () => { if (io) emitDataChanged(io, 'projects'); });
  bus.on('project:archived', async () => { if (io) { emitDataChanged(io, 'projects'); emitDataChanged(io, 'campaigns'); } });
  bus.on('project:deleted', async () => { if (io) emitDataChanged(io, 'projects'); });

  bus.on('feature:created', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('feature:updated', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('feature:deleted', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('feature:conforme', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('feature:status_changed', async () => { if (io) emitDataChanged(io, 'features'); });

  bus.on('anomaly:created', async () => { if (io) emitDataChanged(io, 'anomalies'); });
  bus.on('anomaly:updated', async () => { if (io) emitDataChanged(io, 'anomalies'); });
  bus.on('anomaly:deleted', async () => { if (io) emitDataChanged(io, 'anomalies'); });
  bus.on('anomaly:status_changed', async () => { if (io) emitDataChanged(io, 'anomalies'); });

  bus.on('assignment:created', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('assignment:reassigned', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('assignment:deleted', async () => { if (io) emitDataChanged(io, 'features'); });

  bus.on('campaignMember:added', async () => { if (io) emitDataChanged(io, 'campaigns'); });
  bus.on('campaignMember:removed', async () => { if (io) emitDataChanged(io, 'campaigns'); });

  bus.on('testCase:created', async () => { if (io) emitDataChanged(io, 'features'); });
  bus.on('testCase:deleted', async () => { if (io) emitDataChanged(io, 'features'); });

  bus.on('data:changed', async ({ entity }) => {
    if (io) emitDataChanged(io, entity);
  });
}
