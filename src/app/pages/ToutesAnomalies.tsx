import React, { useState } from 'react';
import { Link } from 'react-router';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Bug, Search, ExternalLink, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DEMO_USERS: Record<string, string> = {
  '3': 'Sophie Testeur',
  '4': 'Thomas Dev',
  '5': 'Julie Test',
  '6': 'Marc Qualité',
  '7': 'Alex Code'
};

export function ToutesAnomalies() {
  const { anomalies, fonctionnalites, campagnes } = useData();
  const [filtreStatut, setFiltreStatut] = useState<string>('toutes');
  const [filtreCampagne, setFiltreCampagne] = useState<string>('toutes');
  const [recherche, setRecherche] = useState('');

  let anomaliesFiltrees = anomalies;

  // Filtre par statut
  if (filtreStatut !== 'toutes') {
    anomaliesFiltrees = anomaliesFiltrees.filter(a => a.statut === filtreStatut);
  }

  // Filtre par campagne
  if (filtreCampagne !== 'toutes') {
    anomaliesFiltrees = anomaliesFiltrees.filter(a => a.campagneId === filtreCampagne);
  }

  // Filtre par recherche
  if (recherche) {
    anomaliesFiltrees = anomaliesFiltrees.filter(a => 
      a.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      a.description.toLowerCase().includes(recherche.toLowerCase())
    );
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'nouvelle':
        return <Badge variant="destructive">Nouvelle</Badge>;
      case 'en_cours':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">En cours</Badge>;
      case 'resolution_signalee':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Résolution signalée</Badge>;
      case 'verifiee':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Vérifiée</Badge>;
      case 'cloturee':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Clôturée</Badge>;
      default:
        return null;
    }
  };

  const statistiques = {
    total: anomalies.length,
    nouvelles: anomalies.filter(a => a.statut === 'nouvelle').length,
    enCours: anomalies.filter(a => a.statut === 'en_cours').length,
    resolutionSignalee: anomalies.filter(a => a.statut === 'resolution_signalee').length,
    cloturees: anomalies.filter(a => a.statut === 'cloturee').length
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Toutes les anomalies</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de toutes les anomalies détectées
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistiques.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nouvelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistiques.nouvelles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistiques.enCours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Résolution signalée</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistiques.resolutionSignalee}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Clôturées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistiques.cloturees}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="size-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les anomalies..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={filtreStatut} onValueChange={setFiltreStatut}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes</SelectItem>
                  <SelectItem value="nouvelle">Nouvelles</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="resolution_signalee">Résolution signalée</SelectItem>
                  <SelectItem value="cloturee">Clôturées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Campagne</label>
              <Select value={filtreCampagne} onValueChange={setFiltreCampagne}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par campagne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes les campagnes</SelectItem>
                  {campagnes.map((campagne) => (
                    <SelectItem key={campagne.id} value={campagne.id}>
                      {campagne.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {anomaliesFiltrees.length} anomalie{anomaliesFiltrees.length > 1 ? 's' : ''} trouvée{anomaliesFiltrees.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid gap-4">
          {anomaliesFiltrees.map((anomalie) => {
            const fonctionnalite = fonctionnalites.find(f => f.id === anomalie.fonctionnaliteId);
            const campagne = campagnes.find(c => c.id === anomalie.campagneId);

            return (
              <Card key={anomalie.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Bug className="size-5 text-red-600" />
                        <CardTitle className="text-lg">{anomalie.titre}</CardTitle>
                      </div>
                      <CardDescription>
                        {fonctionnalite?.nom} • {campagne?.nom}
                      </CardDescription>
                    </div>
                    {getStatutBadge(anomalie.statut)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm line-clamp-2">{anomalie.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>Testeur:</span>
                        <Badge variant="outline">{DEMO_USERS[anomalie.testeurId] || 'Inconnu'}</Badge>
                      </div>
                      {anomalie.developpeurId && (
                        <div className="flex items-center gap-2">
                          <span>Développeur:</span>
                          <Badge variant="outline">{DEMO_USERS[anomalie.developpeurId]}</Badge>
                        </div>
                      )}
                      <span>
                        Créée le {format(new Date(anomalie.dateCreation), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>

                    <Link to={`/anomalies/${anomalie.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="size-4 mr-2" />
                        Voir les détails
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {anomaliesFiltrees.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Bug className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune anomalie trouvée</p>
              <p className="text-sm text-muted-foreground mt-1">
                Essayez de modifier vos filtres de recherche
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
