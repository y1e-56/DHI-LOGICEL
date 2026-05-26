import React from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, CheckCircle2, Bug, AlertCircle, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DEMO_USERS: Record<string, string> = {
  '3': 'Sophie Testeur',
  '4': 'Thomas Dev',
  '5': 'Julie Test',
  '6': 'Marc Qualité',
  '7': 'Alex Code'
};

export function CampagneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { campagnes, projets, fonctionnalites, anomalies } = useData();

  const campagne = campagnes.find(c => c.id === id);
  const projet = campagne ? projets.find(p => p.id === campagne.projetId) : null;
  const fonctionnalitesCampagne = campagne ? fonctionnalites.filter(f => f.campagneId === campagne.id) : [];
  const anomaliesCampagne = campagne ? anomalies.filter(a => a.campagneId === campagne.id) : [];

  if (!campagne || !projet) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Campagne non trouvée</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const conformes = fonctionnalitesCampagne.filter(f => f.statut === 'conforme').length;
  const enCours = fonctionnalitesCampagne.filter(f => f.statut === 'en_cours').length;
  const enAttente = fonctionnalitesCampagne.filter(f => f.statut === 'en_attente').length;
  const avecAnomalies = fonctionnalitesCampagne.filter(f => f.statut === 'anomalie').length;

  const progression = fonctionnalitesCampagne.length > 0 
    ? Math.round((conformes / fonctionnalitesCampagne.length) * 100)
    : 0;

  const anomaliesOuvertes = anomaliesCampagne.filter(a => a.statut !== 'cloturee');
  const anomaliesNouv = anomaliesCampagne.filter(a => a.statut === 'nouvelle').length;
  const anomaliesEnCours = anomaliesCampagne.filter(a => a.statut === 'en_cours').length;
  const anomaliesResolues = anomaliesCampagne.filter(a => a.statut === 'resolution_signalee').length;

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'planifiée':
        return <Badge variant="outline">Planifiée</Badge>;
      case 'en_cours':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">En cours</Badge>;
      case 'terminée':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Terminée</Badge>;
      default:
        return null;
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

  const getStatutAnomaliBadge = (statut: string) => {
    switch (statut) {
      case 'nouvelle':
        return <Badge variant="destructive">Nouvelle</Badge>;
      case 'en_cours':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">En cours</Badge>;
      case 'resolution_signalee':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Résolution signalée</Badge>;
      case 'cloturee':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Clôturée</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{campagne.nom}</h1>
            {getStatutBadge(campagne.statut)}
          </div>
          <p className="text-muted-foreground">
            {projet.nom} • {campagne.description}
          </p>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600" />
              Conformes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{conformes}</div>
            <p className="text-xs text-muted-foreground">
              {fonctionnalitesCampagne.length > 0 
                ? `${Math.round((conformes / fonctionnalitesCampagne.length) * 100)}% du total`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="size-4 text-blue-600" />
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{enCours}</div>
            <p className="text-xs text-muted-foreground">Tests en cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="size-4 text-orange-600" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{enAttente}</div>
            <p className="text-xs text-muted-foreground">Non testés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bug className="size-4 text-red-600" />
              Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{anomaliesOuvertes.length}</div>
            <p className="text-xs text-muted-foreground">Ouvertes</p>
          </CardContent>
        </Card>
      </div>

      {/* Progression */}
      <Card>
        <CardHeader>
          <CardTitle>Progression de la campagne</CardTitle>
          <CardDescription>
            {conformes} sur {fonctionnalitesCampagne.length} fonctionnalités testées conformes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progression globale</span>
              <span className="font-bold">{progression}%</span>
            </div>
            <Progress value={progression} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fonctionnalités testées */}
        <Card>
          <CardHeader>
            <CardTitle>Fonctionnalités à tester ({fonctionnalitesCampagne.length})</CardTitle>
            <CardDescription>État des tests par fonctionnalité</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fonctionnalitesCampagne.length > 0 ? (
                fonctionnalitesCampagne.map((fonc) => {
                  const testeur = DEMO_USERS[fonc.assigneA || ''];
                  return (
                    <div key={fonc.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{fonc.nom}</p>
                          {testeur && (
                            <p className="text-sm text-muted-foreground">
                              Assigné à {testeur}
                            </p>
                          )}
                        </div>
                        {getPrioriteBadge(fonc.priorite)}
                      </div>
                      <div className="flex items-center gap-2">
                        {fonc.statut === 'en_attente' && (
                          <Badge variant="secondary">En attente</Badge>
                        )}
                        {fonc.statut === 'en_cours' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            En cours de test
                          </Badge>
                        )}
                        {fonc.statut === 'conforme' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            <CheckCircle2 className="size-3 mr-1" />
                            Conforme
                          </Badge>
                        )}
                        {fonc.statut === 'anomalie' && (
                          <Badge variant="destructive">
                            <Bug className="size-3 mr-1" />
                            Anomalie détectée
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucune fonctionnalité à tester
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Anomalies */}
        <Card>
          <CardHeader>
            <CardTitle>Anomalies ({anomaliesCampagne.length})</CardTitle>
            <CardDescription>
              {anomaliesNouv} nouvelles • {anomaliesEnCours} en cours • {anomaliesResolues} résolues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomaliesCampagne.length > 0 ? (
                anomaliesCampagne.map((anomalie) => {
                  const testeur = DEMO_USERS[anomalie.testeurId];
                  const dev = anomalie.developpeurId ? DEMO_USERS[anomalie.developpeurId] : null;
                  
                  return (
                    <div key={anomalie.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{anomalie.titre}</p>
                          <div className="text-sm text-muted-foreground mt-1">
                            <p>Par {testeur}</p>
                            {dev && <p>Assigné à {dev}</p>}
                          </div>
                        </div>
                        {getStatutAnomaliBadge(anomalie.statut)}
                      </div>
                      <Link to={`/anomalies/${anomalie.id}`}>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          Voir les détails
                        </Button>
                      </Link>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucune anomalie détectée
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Équipe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Équipe de la campagne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3">Testeurs ({campagne.testeurs.length})</h3>
              <div className="space-y-2">
                {campagne.testeurs.map((testeurId) => (
                  <div key={testeurId} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex size-8 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                      {DEMO_USERS[testeurId]?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <span>{DEMO_USERS[testeurId] || 'Inconnu'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Développeurs ({campagne.developpeurs.length})</h3>
              <div className="space-y-2">
                {campagne.developpeurs.map((devId) => (
                  <div key={devId} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-semibold text-sm">
                      {DEMO_USERS[devId]?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <span>{DEMO_USERS[devId] || 'Inconnu'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
