import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { History, Clock, User, Filter, Search, CheckCircle, AlertTriangle, XCircle, FileText } from 'lucide-react';

interface AuditEntry {
  id: string;
  type: 'creation' | 'modification' | 'suppression' | 'statut' | 'assignation';
  entity: 'utilisateur' | 'projet' | 'campagne' | 'fonctionnalite' | 'anomalie';
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export function AdminHistoryPage() {
  const { currentUser, users } = useAuth();
  const { projets, campagnes, fonctionnalites, anomalies, notifications } = useData();
  const [filterType, setFilterType] = useState<'tous' | 'creation' | 'modification' | 'suppression' | 'statut' | 'assignation'>('tous');
  const [filterEntity, setFilterEntity] = useState<'tous' | 'utilisateur' | 'projet' | 'campagne' | 'fonctionnalite' | 'anomalie'>('tous');
  const [searchTerm, setSearchTerm] = useState('');

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  // Générer des entrées d'audit à partir des données existantes
  const generateAuditEntries = (): AuditEntry[] => {
    const entries: AuditEntry[] = [];

    // Entrées pour les utilisateurs
    users.forEach((user: any) => {
      entries.push({
        id: `u-${user.id}`,
        type: 'creation',
        entity: 'utilisateur',
        entityId: user.id,
        entityName: `${user.prenom} ${user.nom}`,
        userId: user.id,
        userName: `${user.prenom} ${user.nom}`,
        action: 'Création utilisateur',
        details: `Rôle: ${user.role}`,
        timestamp: new Date().toISOString()
      });

      if (user.bloqueJusqua) {
        entries.push({
          id: `ub-${user.id}`,
          type: 'statut',
          entity: 'utilisateur',
          entityId: user.id,
          entityName: `${user.prenom} ${user.nom}`,
          userId: user.id,
          userName: `${user.prenom} ${user.nom}`,
          action: 'Blocage utilisateur',
          details: `Bloqué jusqu'au: ${new Date(user.bloqueJusqua).toLocaleDateString('fr-FR')}`,
          timestamp: user.bloqueJusqua.toISOString()
        });
      }
    });

    // Entrées pour les projets
    projets.forEach((projet: any) => {
      entries.push({
        id: `p-${projet.id}`,
        type: 'creation',
        entity: 'projet',
        entityId: projet.id,
        entityName: projet.nom,
        userId: projet.creePar,
        userName: users.find((u: any) => u.id === projet.creePar)?.prenom + ' ' + users.find((u: any) => u.id === projet.creePar)?.nom || 'Inconnu',
        action: 'Création projet',
        details: `Statut: ${projet.statut}`,
        timestamp: projet.dateCreation
      });

      if (projet.statut === 'archive') {
        entries.push({
          id: `pa-${projet.id}`,
          type: 'statut',
          entity: 'projet',
          entityId: projet.id,
          entityName: projet.nom,
          userId: projet.creePar,
          userName: users.find((u: any) => u.id === projet.creePar)?.prenom + ' ' + users.find((u: any) => u.id === projet.creePar)?.nom || 'Inconnu',
          action: 'Archivage projet',
          details: 'Projet archivé',
          timestamp: projet.dateCreation
        });
      }
    });

    // Entrées pour les campagnes
    campagnes.forEach((campagne: any) => {
      entries.push({
        id: `c-${campagne.id}`,
        type: 'creation',
        entity: 'campagne',
        entityId: campagne.id,
        entityName: campagne.nom,
        userId: campagne.chefTesteurId || '',
        userName: users.find((u: any) => u.id === campagne.chefTesteurId)?.prenom + ' ' + users.find((u: any) => u.id === campagne.chefTesteurId)?.nom || 'Inconnu',
        action: 'Création campagne',
        details: `Statut: ${campagne.statut}`,
        timestamp: campagne.dateCreation
      });
    });

    // Entrées pour les fonctionnalités
    fonctionnalites.forEach((fonct: any) => {
      if (fonct.dateAssignation) {
        entries.push({
          id: `fa-${fonct.id}`,
          type: 'assignation',
          entity: 'fonctionnalite',
          entityId: fonct.id,
          entityName: fonct.nom,
          userId: fonct.testeurAssigneId || '',
          userName: users.find((u: any) => u.id === fonct.testeurAssigneId)?.prenom + ' ' + users.find((u: any) => u.id === fonct.testeurAssigneId)?.nom || 'Inconnu',
          action: 'Assignation fonctionnalité',
          details: `Assignée à: ${users.find((u: any) => u.id === fonct.testeurAssigneId)?.prenom || 'Inconnu'}`,
          timestamp: fonct.dateAssignation
        });
      }

      if (fonct.statut !== 'non_testee') {
        entries.push({
          id: `fs-${fonct.id}`,
          type: 'statut',
          entity: 'fonctionnalite',
          entityId: fonct.id,
          entityName: fonct.nom,
          userId: fonct.testeurAssigneId || '',
          userName: users.find((u: any) => u.id === fonct.testeurAssigneId)?.prenom + ' ' + users.find((u: any) => u.id === fonct.testeurAssigneId)?.nom || 'Inconnu',
          action: 'Changement statut fonctionnalité',
          details: `Statut: ${fonct.statut}`,
          timestamp: fonct.dateAssignation || new Date().toISOString()
        });
      }
    });

    // Entrées pour les anomalies
    anomalies.forEach((anomalie: any) => {
      entries.push({
        id: `a-${anomalie.id}`,
        type: 'creation',
        entity: 'anomalie',
        entityId: anomalie.id,
        entityName: anomalie.titre,
        userId: anomalie.testeurId,
        userName: users.find((u: any) => u.id === anomalie.testeurId)?.prenom + ' ' + users.find((u: any) => u.id === anomalie.testeurId)?.nom || 'Inconnu',
        action: 'Création anomalie',
        details: `Priorité: ${anomalie.priorite}, Développeur: ${users.find((u: any) => u.id === anomalie.developpeurId)?.prenom || 'Inconnu'}`,
        timestamp: anomalie.dateCreation
      });

      if (anomalie.statut !== 'nouvelle') {
        entries.push({
          id: `as-${anomalie.id}`,
          type: 'statut',
          entity: 'anomalie',
          entityId: anomalie.id,
          entityName: anomalie.titre,
          userId: anomalie.developpeurId || anomalie.testeurId,
          userName: users.find((u: any) => u.id === (anomalie.developpeurId || anomalie.testeurId))?.prenom + ' ' + users.find((u: any) => u.id === (anomalie.developpeurId || anomalie.testeurId))?.nom || 'Inconnu',
          action: 'Changement statut anomalie',
          details: `Statut: ${anomalie.statut}`,
          timestamp: anomalie.dateCreation
        });
      }
    });

    // Entrées pour les notifications
    notifications.forEach((notif: any) => {
      entries.push({
        id: `n-${notif.id}`,
        type: 'creation',
        entity: 'anomalie',
        entityId: notif.id,
        entityName: notif.titre,
        userId: notif.userId,
        userName: users.find((u: any) => u.id === notif.userId)?.prenom + ' ' + users.find((u: any) => u.id === notif.userId)?.nom || 'Inconnu',
        action: 'Notification envoyée',
        details: notif.message,
        timestamp: notif.dateCreation
      });
    });

    // Trier par date décroissante
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const auditEntries = generateAuditEntries();

  const filteredEntries = auditEntries.filter(entry => {
    const matchType = filterType === 'tous' || entry.type === filterType;
    const matchEntity = filterEntity === 'tous' || entry.entity === filterEntity;
    const matchSearch = !searchTerm || 
      entry.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchEntity && matchSearch;
  });

  const getTypeBadge = (type: string) => {
    const config = {
      creation: { label: 'Création', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      modification: { label: 'Modification', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      suppression: { label: 'Suppression', className: 'bg-red-100 text-red-700 border-red-200' },
      statut: { label: 'Statut', className: 'bg-amber-100 text-amber-700 border-amber-200' },
      assignation: { label: 'Assignation', className: 'bg-purple-100 text-purple-700 border-purple-200' }
    };
    return config[type as keyof typeof config] || { label: type, className: 'bg-gray-100 text-gray-700' };
  };

  const getEntityIcon = (entity: string) => {
    const icons = {
      utilisateur: User,
      projet: FileText,
      campagne: Clock,
      fonctionnalite: CheckCircle,
      anomalie: AlertTriangle
    };
    return icons[entity as keyof typeof icons] || FileText;
  };

  const stats = {
    total: auditEntries.length,
    creations: auditEntries.filter(e => e.type === 'creation').length,
    modifications: auditEntries.filter(e => e.type === 'modification').length,
    statuts: auditEntries.filter(e => e.type === 'statut').length,
    assignations: auditEntries.filter(e => e.type === 'assignation').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Historique & Audit</h1>
        <p className="text-sm text-slate-500 mt-0.5">Trail complet des actions sur la plateforme</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-indigo-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total actions</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-emerald-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Créations</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.creations}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-blue-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Modifications</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.modifications}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-amber-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Statuts</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{stats.statuts}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-purple-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assignations</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{stats.assignations}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher par action, entité ou utilisateur..."
                className="pl-9 bg-white border-slate-200 h-9"
              />
            </div>
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="w-40 bg-white border-slate-200 h-9">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous types</SelectItem>
                <SelectItem value="creation">Créations</SelectItem>
                <SelectItem value="modification">Modifications</SelectItem>
                <SelectItem value="statut">Statuts</SelectItem>
                <SelectItem value="assignation">Assignations</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEntity} onValueChange={(v: any) => setFilterEntity(v)}>
              <SelectTrigger className="w-40 bg-white border-slate-200 h-9">
                <SelectValue placeholder="Filtrer par entité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes entités</SelectItem>
                <SelectItem value="utilisateur">Utilisateurs</SelectItem>
                <SelectItem value="projet">Projets</SelectItem>
                <SelectItem value="campagne">Campagnes</SelectItem>
                <SelectItem value="fonctionnalite">Fonctionnalités</SelectItem>
                <SelectItem value="anomalie">Anomalies</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="space-y-2">
            {filteredEntries.length === 0 && (
              <div className="py-10 text-center">
                <History className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucune entrée trouvée</p>
              </div>
            )}
            {filteredEntries.map(entry => {
              const typeBadge = getTypeBadge(entry.type);
              const EntityIcon = getEntityIcon(entry.entity);

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <EntityIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{entry.action}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 border ${typeBadge.className}`}>
                        {typeBadge.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{entry.entityName}</p>
                    <p className="text-xs text-slate-400">{entry.details}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {entry.userName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(entry.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
