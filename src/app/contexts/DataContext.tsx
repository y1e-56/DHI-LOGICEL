import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  Projet, 
  Campagne, 
  Fonctionnalite, 
  Anomalie, 
  Notification, 
  HistoriqueAction,
  StatutFonctionnalite,
  StatutAnomalie
} from '../types';
import { projectService } from '../services/projectService';
import { campaignService } from '../services/campaignService';
import { anomalyService } from '../services/anomalyService';
import { taskService } from '../services/taskService';
import api, { getErrorMessage } from '../services/api';
import { mapFonctionnaliteToBackend, mapAnomalyStatusToBackend, mapAnomalieFromBackend } from '../utils/mappers';
import { useAuth } from './AuthContext';

interface DataContextType {
  projets: Projet[];
  campagnes: Campagne[];
  fonctionnalites: Fonctionnalite[];
  anomalies: Anomalie[];
  notifications: Notification[];
  historiqueActions: HistoriqueAction[];
  
  // Projets
  ajouterProjet: (projet: Projet) => void;
  modifierProjet: (id: string, projet: Partial<Projet>) => void;
  archiverProjet: (id: string) => void;
  supprimerProjet: (id: string) => void;
  
  // Campagnes
  ajouterCampagne: (campagne: Campagne) => void;
  modifierCampagne: (id: string, campagne: Partial<Campagne>) => void;
  
  // Fonctionnalités
  ajouterFonctionnalite: (fonctionnalite: Fonctionnalite) => void;
  modifierFonctionnalite: (id: string, fonctionnalite: Partial<Fonctionnalite>) => void;
  changerStatutFonctionnalite: (id: string, statut: StatutFonctionnalite, testeurId: string) => void;
  
  // Anomalies
  ajouterAnomalie: (anomalie: Anomalie) => void;
  changerStatutAnomalie: (id: string, statut: StatutAnomalie, userId: string, commentaire?: string) => void;
  signalerResolution: (id: string, developpeurId: string, commentaire: string) => void;
  validerCloture: (id: string, testeurId: string) => void;
  
  // Notifications
  ajouterNotification: (notification: Notification) => void;
  marquerNotificationLue: (id: string) => void;
  getNotificationsNonLues: (userId: string) => number;
  
  // Historique
  ajouterHistorique: (action: HistoriqueAction) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [fonctionnalites, setFonctionnalites] = useState<Fonctionnalite[]>([]);
  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [historiqueActions, setHistoriqueActions] = useState<HistoriqueAction[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const refreshAllRef = useRef<(() => Promise<void>) | null>(null);

  // Charger les projets depuis l'API
  const refreshProjets = useCallback(async () => {
    try {
      const data = await projectService.getAll();
      setProjets(data);
    } catch (e) {
      toast.error('Erreur refreshProjets : ' + getErrorMessage(e as any));
    }
  }, []);

  // Charger les campagnes depuis l'API
  const refreshCampagnes = useCallback(async () => {
    try {
      const data = await campaignService.getAll();
      setCampagnes(data);
    } catch (e) {
      toast.error('Erreur refreshCampagnes : ' + getErrorMessage(e as any));
    }
  }, []);

  // Charger les fonctionnalités depuis l'API
  const refreshFonctionnalites = useCallback(async () => {
    try {
      const allCampagnes = await campaignService.getAll();
      const results = await Promise.all(
        allCampagnes.map(c => taskService.getCampaignFeatures(c.id).catch(() => []))
      );
      setFonctionnalites(results.flat());
    } catch (e) {
      toast.error('Erreur refreshFonctionnalites : ' + getErrorMessage(e as any));
    }
  }, []);

  // Charger les anomalies depuis l'API
  const refreshAnomalies = useCallback(async () => {
    if (!currentUser) return;
    try {
      let data: Anomalie[] = [];
      if (currentUser.role === 'developpeur') {
        data = await anomalyService.getMyAnomalies();
      } else if (currentUser.role === 'testeur') {
        data = await anomalyService.getReported();
      } else {
        const allCampagnes = await campaignService.getAll();
        const results = await Promise.all(
          allCampagnes.map(c => anomalyService.getByCampaign(c.id).catch(() => []))
        );
        data = results.flat();
      }
      setAnomalies(data);
    } catch (e) {
      toast.error('Erreur refreshAnomalies : ' + getErrorMessage(e as any));
    }
  }, [currentUser]);

  // Charger les notifications depuis l'API
  const refreshNotifications = useCallback(async () => {
    try {
      const data = await anomalyService.getNotifications();
      setNotifications(data);
    } catch (e) {
      toast.error('Erreur refreshNotifications : ' + getErrorMessage(e as any));
    }
  }, []);

  // Fonction pour rafraîchir toutes les données
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshProjets(),
      refreshCampagnes(),
      refreshFonctionnalites(),
      refreshAnomalies(),
      refreshNotifications()
    ]);
  }, [refreshProjets, refreshCampagnes, refreshFonctionnalites, refreshAnomalies, refreshNotifications]);

  // Stocker la référence pour utilisation dans les callbacks
  useEffect(() => {
    refreshAllRef.current = refreshAll;
  }, [refreshAll]);

  // Charger les données au montage et quand l'utilisateur change
  useEffect(() => {
    if (currentUser && !dataLoaded) {
      refreshAll();
      setDataLoaded(true);
    }
  }, [currentUser]);

  // Projets
  const ajouterProjet = async (projet: Projet) => {
    try {
      const created = await projectService.create(projet);
      setProjets(prev => [...prev, created]);
      toast.success('Projet créé avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const modifierProjet = async (id: string, projetPartiel: Partial<Projet>) => {
    try {
      const updated = await projectService.update(id, projetPartiel);
      setProjets(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      toast.success('Projet modifié avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const archiverProjet = async (id: string) => {
    try {
      const updated = await projectService.archive(id);
      setProjets(prev => prev.map(p => p.id === id ? { ...p, ...updated, statut: 'archive' as const } : p));
      toast.success('Projet archivé avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const supprimerProjet = async (id: string) => {
    try {
      await projectService.delete(id);
      setProjets(prev => prev.filter(p => p.id !== id));
      toast.success('Projet supprimé avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  // Campagnes
  const ajouterCampagne = async (campagne: Campagne) => {
    try {
      const created = await campaignService.create(campagne);
      setCampagnes(prev => [...prev, created]);
      toast.success('Campagne créée avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const modifierCampagne = async (id: string, campagnePartielle: Partial<Campagne>) => {
    try {
      const updated = await campaignService.update(id, campagnePartielle);
      setCampagnes(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      toast.success('Campagne modifiée avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  // Fonctionnalités
  const ajouterFonctionnalite = async (fonctionnalite: Fonctionnalite) => {
    try {
      const created = await taskService.createFeature(fonctionnalite);

      // Si un testeur est déjà choisi, on crée aussi l'assignation côté backend
      let createdWithAssign = created;
      if (fonctionnalite.testeurAssigneId) {
        await taskService.assignTask(created.id, fonctionnalite.testeurAssigneId);
        createdWithAssign = { ...created, testeurAssigneId: fonctionnalite.testeurAssigneId };
      }

      setFonctionnalites(prev => [...prev, createdWithAssign]);
      toast.success('Fonctionnalité ajoutée avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const modifierFonctionnalite = async (id: string, fonctionnalitePartielle: Partial<Fonctionnalite>) => {
    try {
      // Gestion de l'assignation séparément via le service dédié
      if (fonctionnalitePartielle.testeurAssigneId) {
        const userId = fonctionnalitePartielle.testeurAssigneId;
        await taskService.assignTask(id, userId);
      }

      // Mapper les champs français → anglais pour les champs de la feature
      const featurePayload = mapFonctionnaliteToBackend(fonctionnalitePartielle);
      const allowedKeys = ['name', 'description', 'priority', 'status'];
      const filtered: Record<string, unknown> = {};
      for (const key of allowedKeys) {
        if (featurePayload[key as keyof typeof featurePayload] !== undefined) {
          filtered[key] = featurePayload[key as keyof typeof featurePayload];
        }
      }

      if (Object.keys(filtered).length > 0) {
        const response = await api.put(`/features/${id}`, filtered);
        setFonctionnalites(prev => prev.map(f => f.id === id ? { ...f, ...response.data } : f));
      }
      toast.success('Fonctionnalité modifiée avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const changerStatutFonctionnalite = async (id: string, statut: StatutFonctionnalite, testeurId: string) => {
    try {
      const backendStatut = statut === 'conforme' ? 'conforme' : statut === 'anomalie' ? 'anomaly_detected' : 'pending';
      const updated = await taskService.updateFeatureStatus(id, backendStatut as 'conforme' | 'anomaly_detected');
      setFonctionnalites(prev => prev.map(f => {
        if (f.id !== id) return f;
        // Le backend ne renvoie pas l'assignation : on la conserve si absente dans la réponse
        const merged = { ...f, ...updated } as Fonctionnalite;
        if (!merged.testeurAssigneId && f.testeurAssigneId) {
          merged.testeurAssigneId = f.testeurAssigneId;
        }
        return merged;
      }));
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  // Anomalies
  const ajouterAnomalie = async (anomalie: Anomalie) => {
    try {
      const created = await anomalyService.create(anomalie);
      setAnomalies(prev => [...prev, created]);
      toast.success('Anomalie signalée avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const changerStatutAnomalie = async (id: string, statut: StatutAnomalie, userId: string, commentaire?: string) => {
    try {
      const backendStatus = mapAnomalyStatusToBackend(statut);
      const payload: Record<string, unknown> = { status: backendStatus };
      if (backendStatus === 'resolution_signaled' && commentaire) {
        payload.resolution_description = commentaire;
      }

      const response = await api.put(`/anomalies/${id}`, payload);
      const updated = mapAnomalieFromBackend(response.data.anomaly);
      setAnomalies(prev => prev.map(a => a.id === id ? updated : a));
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const signalerResolution = async (id: string, developpeurId: string, commentaire: string) => {
    try {
      const updated = await anomalyService.signalResolution(id, commentaire);

      // Mettre à jour l'anomalie en local
      setAnomalies(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));

      // Notifier le testeur qui a créé l'anomalie
      const anomalie = anomalies.find(a => a.id === id);
      const testeurId = anomalie?.testeurId;
      if (testeurId) {
        setNotifications(prev => [
          {
            id: `n${Date.now()}`,
            userId: testeurId,
            type: 'resolution',
            titre: 'Résolution signalée',
            message: `La résolution de l'anomalie "${anomalie?.titre || ''}" a été signalée`,
            lue: false,
            dateCreation: new Date().toISOString(),
            lienUrl: `/anomalies/${id}`
          },
          ...prev
        ]);
      }

      toast.success('Résolution signalée avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const validerCloture = async (id: string, testeurId: string) => {
    try {
      const updated = await anomalyService.validate(id);
      setAnomalies(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
      toast.success('Anomalie clôturée avec succès');
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  // Notifications
  const ajouterNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const marquerNotificationLue = async (id: string) => {
    // Certaines notifications locales (ex: ajout immédiat côté front) ont des ids non numériques
    const numericId = Number(id);
    const isNumeric = Number.isInteger(numericId);
    try {
      if (isNumeric) {
        await anomalyService.markNotificationRead(id);
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
    } catch (e) {
      toast.error(getErrorMessage(e as any));
    }
  };

  const getNotificationsNonLues = (userId: string): number => {
    return notifications.filter(n => n.userId === userId && !n.lue).length;
  };

  // Historique
  const ajouterHistorique = (action: HistoriqueAction) => {
    setHistoriqueActions(prev => [action, ...prev]);
  };

  const value: DataContextType = {
    projets,
    campagnes,
    fonctionnalites,
    anomalies,
    notifications,
    historiqueActions,
    
    ajouterProjet,
    modifierProjet,
    archiverProjet,
    supprimerProjet,
    
    ajouterCampagne,
    modifierCampagne,
    
    ajouterFonctionnalite,
    modifierFonctionnalite,
    changerStatutFonctionnalite,
    
    ajouterAnomalie,
    changerStatutAnomalie,
    signalerResolution,
    validerCloture,
    
    ajouterNotification,
    marquerNotificationLue,
    getNotificationsNonLues,
    
    ajouterHistorique
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
