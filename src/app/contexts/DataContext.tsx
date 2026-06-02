import { createContext, useContext, useState, ReactNode } from 'react';
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
import {
  projets as initialProjets,
  campagnes as initialCampagnes,
  fonctionnalites as initialFonctionnalites,
  anomalies as initialAnomalies,
  notifications as initialNotifications,
  historiqueActions as initialHistorique
} from '../data/mockData';

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
  const [projets, setProjets] = useState<Projet[]>(initialProjets);
  const [campagnes, setCampagnes] = useState<Campagne[]>(initialCampagnes);
  const [fonctionnalites, setFonctionnalites] = useState<Fonctionnalite[]>(initialFonctionnalites);
  const [anomalies, setAnomalies] = useState<Anomalie[]>(initialAnomalies);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [historiqueActions, setHistoriqueActions] = useState<HistoriqueAction[]>(initialHistorique);

  // Projets
  const ajouterProjet = (projet: Projet) => {
    setProjets(prev => [...prev, projet]);
  };

  const modifierProjet = (id: string, projetPartiel: Partial<Projet>) => {
    setProjets(prev => prev.map(p => p.id === id ? { ...p, ...projetPartiel } : p));
  };

  const archiverProjet = (id: string) => {
    modifierProjet(id, { statut: 'archive' });
  };

  const supprimerProjet = (id: string) => {
    setProjets(prev => prev.filter(p => p.id !== id));
  };

  // Campagnes
  const ajouterCampagne = (campagne: Campagne) => {
    setCampagnes(prev => [...prev, campagne]);
  };

  const modifierCampagne = (id: string, campagnePartielle: Partial<Campagne>) => {
    setCampagnes(prev => prev.map(c => c.id === id ? { ...c, ...campagnePartielle } : c));
  };

  // Fonctionnalités
  const ajouterFonctionnalite = (fonctionnalite: Fonctionnalite) => {
    setFonctionnalites(prev => [...prev, fonctionnalite]);
  };

  const modifierFonctionnalite = (id: string, fonctionnalitePartielle: Partial<Fonctionnalite>) => {
    setFonctionnalites(prev => prev.map(f => f.id === id ? { ...f, ...fonctionnalitePartielle } : f));
  };

  const changerStatutFonctionnalite = (id: string, statut: StatutFonctionnalite, testeurId: string) => {
    const fonctionnalite = fonctionnalites.find(f => f.id === id);
    if (!fonctionnalite) return;

    modifierFonctionnalite(id, { 
      statut, 
      dateTest: new Date().toISOString() 
    });
  };

  // Anomalies
  const ajouterAnomalie = (anomalie: Anomalie) => {
    setAnomalies(prev => [...prev, anomalie]);
  };

  const changerStatutAnomalie = (id: string, statut: StatutAnomalie, userId: string, commentaire?: string) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, statut } : a));
    
    ajouterHistorique({
      id: `h${Date.now()}`,
      anomalieId: id,
      userId,
      action: `Statut changé : ${statut}`,
      commentaire,
      date: new Date().toISOString()
    });
  };

  const signalerResolution = (id: string, developpeurId: string, commentaire: string) => {
    const anomalie = anomalies.find(a => a.id === id);
    if (!anomalie) return;

    setAnomalies(prev => prev.map(a => 
      a.id === id 
        ? { 
            ...a, 
            statut: 'resolution_signalee', 
            dateResolution: new Date().toISOString(),
            commentaireResolution: commentaire 
          } 
        : a
    ));

    ajouterHistorique({
      id: `h${Date.now()}`,
      anomalieId: id,
      userId: developpeurId,
      action: 'Résolution signalée',
      commentaire,
      date: new Date().toISOString()
    });

    // Notifier le testeur
    ajouterNotification({
      id: `n${Date.now()}`,
      userId: anomalie.testeurId,
      type: 'resolution',
      titre: 'Résolution signalée',
      message: `Une résolution a été signalée pour "${anomalie.titre}"`,
      lue: false,
      dateCreation: new Date().toISOString(),
      lienUrl: `/anomalies/${id}`
    });
  };

  const validerCloture = (id: string, testeurId: string) => {
    setAnomalies(prev => prev.map(a => 
      a.id === id 
        ? { 
            ...a, 
            statut: 'cloturee', 
            dateValidation: new Date().toISOString() 
          } 
        : a
    ));

    ajouterHistorique({
      id: `h${Date.now()}`,
      anomalieId: id,
      userId: testeurId,
      action: 'Anomalie clôturée',
      commentaire: 'Résolution validée par le testeur',
      date: new Date().toISOString()
    });
  };

  // Notifications
  const ajouterNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const marquerNotificationLue = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
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
