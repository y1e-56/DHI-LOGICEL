import React from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  FolderKanban, 
  FlaskConical, 
  Bug, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { projets, campagnes, fonctionnalites, anomalies, notifications } = useData();

  const projetsActifs = projets.filter(p => p.statut === 'actif');
  const campagnesEnCours = campagnes.filter(c => c.statut === 'en_cours');
  const anomaliesOuvertes = anomalies.filter(a => a.statut !== 'cloturee');
  const notificationsNonLues = notifications.filter(n => n.userId === user?.id && !n.lue);

  const mesTaches = user?.role === 'testeur' 
    ? fonctionnalites.filter(f => f.assigneA === user.id && f.statut !== 'conforme')
    : [];

  const mesAnomalies = user?.role === 'developpeur'
    ? anomalies.filter(a => a.developpeurId === user.id && a.statut !== 'cloturee')
    : [];

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_cours':
      case 'en_attente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">En cours</Badge>;
      case 'conforme':
      case 'cloturee':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Conforme</Badge>;
      case 'anomalie':
        return <Badge variant="destructive">Anomalie</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case 'critique':
        return <Badge variant="destructive">Critique</Badge>;
      case 'haute':
        return <Badge className="bg-orange-500">Haute</Badge>;
      case 'moyenne':
        return <Badge variant="outline">Moyenne</Badge>;
      case 'basse':
        return <Badge variant="secondary">Basse</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue, {user?.nom}
        </p>
      </div>

      {/* Indicateurs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
            <FolderKanban className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projetsActifs.length}</div>
            <p className="text-xs text-muted-foreground">
              {projets.length} projets au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campagnes en cours</CardTitle>
            <FlaskConical className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campagnesEnCours.length}</div>
            <p className="text-xs text-muted-foreground">
              {campagnes.length} campagnes au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies ouvertes</CardTitle>
            <Bug className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{anomaliesOuvertes.length}</div>
            <p className="text-xs text-muted-foreground">
              {anomalies.length} anomalies au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationsNonLues.length}</div>
            <p className="text-xs text-muted-foreground">
              {notifications.filter(n => n.userId === user?.id).length} notifications totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vue spécifique au rôle */}
      {user?.role === 'admin' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Projets actifs</CardTitle>
              <CardDescription>Projets en cours de test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projetsActifs.slice(0, 3).map((projet) => (
                  <div key={projet.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{projet.nom}</p>
                      <p className="text-sm text-muted-foreground">{projet.description}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      Actif
                    </Badge>
                  </div>
                ))}
                <Link to="/projets">
                  <Button variant="outline" className="w-full">
                    Voir tous les projets
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques globales</CardTitle>
              <CardDescription>Vue d'ensemble de la qualité</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Fonctionnalités testées</span>
                <span className="font-bold">{fonctionnalites.filter(f => f.statut === 'conforme').length}/{fonctionnalites.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Taux de conformité</span>
                <span className="font-bold text-green-600">
                  {Math.round((fonctionnalites.filter(f => f.statut === 'conforme').length / fonctionnalites.length) * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Anomalies critiques</span>
                <span className="font-bold text-red-600">
                  {anomaliesOuvertes.filter(a => {
                    const fonc = fonctionnalites.find(f => f.id === a.fonctionnaliteId);
                    return fonc?.priorite === 'critique';
                  }).length}
                </span>
              </div>
              <Link to="/reporting">
                <Button variant="outline" className="w-full mt-4">
                  Voir le reporting complet
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {user?.role === 'chef_testeur' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Campagnes en cours</CardTitle>
              <CardDescription>Campagnes de test actives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campagnesEnCours.map((campagne) => {
                  const projet = projets.find(p => p.id === campagne.projetId);
                  const fonctionnalitesCampagne = fonctionnalites.filter(f => f.campagneId === campagne.id);
                  const conformes = fonctionnalitesCampagne.filter(f => f.statut === 'conforme').length;
                  
                  return (
                    <div key={campagne.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{campagne.nom}</p>
                          <p className="text-sm text-muted-foreground">{projet?.nom}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <CheckCircle2 className="size-3 inline mr-1" />
                          {conformes}/{fonctionnalitesCampagne.length} testées
                        </span>
                        <span className="text-muted-foreground">
                          <Bug className="size-3 inline mr-1" />
                          {anomalies.filter(a => a.campagneId === campagne.id && a.statut !== 'cloturee').length} anomalies
                        </span>
                      </div>
                    </div>
                  );
                })}
                <Link to="/campagnes">
                  <Button variant="outline" className="w-full">
                    Gérer les campagnes
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Accès aux fonctions principales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/campagnes/nouvelle">
                <Button variant="outline" className="w-full justify-start">
                  <FlaskConical className="size-4 mr-2" />
                  Créer une campagne
                </Button>
              </Link>
              <Link to="/assignation">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle2 className="size-4 mr-2" />
                  Assigner des tâches
                </Button>
              </Link>
              <Link to="/reporting">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="size-4 mr-2" />
                  Générer un rapport
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {user?.role === 'testeur' && (
        <Card>
          <CardHeader>
            <CardTitle>Mes tâches assignées</CardTitle>
            <CardDescription>Fonctionnalités à tester</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mesTaches.length > 0 ? (
                <>
                  {mesTaches.slice(0, 5).map((tache) => {
                    const campagne = campagnes.find(c => c.id === tache.campagneId);
                    return (
                      <div key={tache.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{tache.nom}</p>
                          <p className="text-sm text-muted-foreground">{campagne?.nom}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPrioriteBadge(tache.priorite)}
                          {getStatutBadge(tache.statut)}
                        </div>
                      </div>
                    );
                  })}
                  <Link to="/mes-taches">
                    <Button variant="outline" className="w-full">
                      Voir toutes mes tâches ({mesTaches.length})
                      <ArrowRight className="size-4 ml-2" />
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucune tâche assignée pour le moment
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role === 'developpeur' && (
        <Card>
          <CardHeader>
            <CardTitle>Anomalies qui me sont assignées</CardTitle>
            <CardDescription>Anomalies à traiter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mesAnomalies.length > 0 ? (
                <>
                  {mesAnomalies.slice(0, 5).map((anomalie) => {
                    const fonctionnalite = fonctionnalites.find(f => f.id === anomalie.fonctionnaliteId);
                    return (
                      <div key={anomalie.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{anomalie.titre}</p>
                          <p className="text-sm text-muted-foreground">{fonctionnalite?.nom}</p>
                        </div>
                        <Badge 
                          variant={anomalie.statut === 'nouvelle' ? 'destructive' : 'outline'}
                          className={anomalie.statut === 'resolution_signalee' ? 'bg-blue-50 text-blue-700 border-blue-300' : ''}
                        >
                          {anomalie.statut === 'nouvelle' && 'Nouvelle'}
                          {anomalie.statut === 'en_cours' && 'En cours'}
                          {anomalie.statut === 'resolution_signalee' && 'Résolution signalée'}
                        </Badge>
                      </div>
                    );
                  })}
                  <Link to="/mes-anomalies">
                    <Button variant="outline" className="w-full">
                      Voir toutes mes anomalies ({mesAnomalies.length})
                      <ArrowRight className="size-4 ml-2" />
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucune anomalie assignée pour le moment
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
