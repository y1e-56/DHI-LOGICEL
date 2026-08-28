import { Anomalie, Campagne, Projet, TestCase, HistoriqueAction } from '../types';
import api from './api';

export interface DashboardKPI {
  label: string;
  valeur: number | string;
  unite?: string;
  tendance?: 'up' | 'down' | 'stable';
  color?: string;
  icon?: string;
}

export interface GraphiqueDonnee {
  label: string;
  valeur: number;
  couleur?: string;
}

export interface ActiviteRecente {
  id: string;
  type: string;
  titre: string;
  date: string;
  userId: string;
}

export const dashboardService = {
  calculerKPIs(anomalies: Anomalie[], campagnes: Campagne[], projets: Projet[], testCases: TestCase[]): DashboardKPI[] {
    const totalAnomalies = anomalies.length;
    const anomaliesOuvertes = anomalies.filter((a) => !['cloturee', 'validee'].includes(a.statut)).length;
    const anomaliesCritiques = anomalies.filter((a) => a.priorite === 'critique' && !['cloturee', 'validee'].includes(a.statut)).length;
    const anomaliesResolues = anomalies.filter((a) => ['cloturee', 'validee'].includes(a.statut)).length;
    const tauxResolution = totalAnomalies > 0 ? Math.round((anomaliesResolues / totalAnomalies) * 100) : 100;
    const totalCampagnes = campagnes.length;
    const campagnesTerminees = campagnes.filter((c) => c.statut === 'terminee').length;
    const totalProjets = projets.length;
    const totalTC = testCases.length;

    return [
      { label: 'Projets actifs', valeur: totalProjets, color: 'text-blue-600', icon: 'folder' },
      { label: 'Campagnes', valeur: `${campagnesTerminees}/${totalCampagnes}`, color: 'text-indigo-600', icon: 'clipboard' },
      { label: 'Cas de test', valeur: totalTC, color: 'text-violet-600', icon: 'test' },
      { label: 'Anomalies ouvertes', valeur: anomaliesOuvertes, color: 'text-orange-600', icon: 'bug' },
      { label: 'Anomalies critiques', valeur: anomaliesCritiques, color: 'text-red-600', icon: 'alert' },
      { label: "Taux de résolution", valeur: `${tauxResolution}%`, color: 'text-emerald-600', icon: 'check', tendance: tauxResolution >= 80 ? 'up' : 'down' },
    ];
  },

  graphiqueStatutsAnomalies(anomalies: Anomalie[]): GraphiqueDonnee[] {
    const count = new Map<string, number>();
    anomalies.forEach((a) => count.set(a.statut, (count.get(a.statut) || 0) + 1));
    const colors: Record<string, string> = { nouvelle: '#ef4444', en_cours: '#6366f1', resolution_signalee: '#10b981', validee: '#059669', cloturee: '#6b7280' };
    return Array.from(count.entries()).map(([label, valeur]) => ({ label, valeur, couleur: colors[label] || '#94a3b8' }));
  },

  graphiquePriorites(anomalies: Anomalie[]): GraphiqueDonnee[] {
    const count = new Map<string, number>();
    anomalies.forEach((a) => count.set(a.priorite, (count.get(a.priorite) || 0) + 1));
    const colors: Record<string, string> = { critique: '#dc2626', haute: '#ea580c', moyenne: '#ca8a04', basse: '#6b7280' };
    return Array.from(count.entries()).map(([label, valeur]) => ({ label, valeur, couleur: colors[label] || '#94a3b8' }));
  },

  // ─── HISTORIQUE / AUDIT ───

  mapperHistorique(row: any): HistoriqueAction {
    return {
      id: String(row.id ?? ''),
      anomalieId: row.entity_type === 'anomaly' ? String(row.entity_id ?? '') : '',
      userId: row.user_id != null ? String(row.user_id) : '',
      action: row.action_type || '',
      commentaire: row.description || undefined,
      date: row.created_at,
      entityType: row.entity_type,
      entityId: row.entity_id != null ? String(row.entity_id) : '',
      userName: [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Système',
    };
  },

  async getHistory(options: { user_id?: string | number; campaign_id?: string | number } = {}): Promise<HistoriqueAction[]> {
    const res = await api.get('/dashboard/history', { params: options });
    return (res.data || []).map((row: any) => dashboardService.mapperHistorique(row));
  },

  async getHistoryPaginated(
    filtres: {
      page?: number;
      limit?: number;
      user_id?: string | number;
      campaign_id?: string | number;
      typeAction?: string;
      typeEntite?: string;
      entityId?: string | number;
      recherche?: string;
      dateDebut?: string;
      dateFin?: string;
    } = {}
  ): Promise<{ data: HistoriqueAction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const res = await api.get('/dashboard/history', { params: filtres });
    const body = res.data || {};
    return {
      data: (body.data || []).map((row: any) => dashboardService.mapperHistorique(row)),
      pagination: body.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },
};
