import React, { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Bug, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function MesAnomalies() {
  const { user } = useAuth();
  const { anomalies, fonctionnalites, campagnes } = useData();
  const [filtreStatut, setFiltreStatut] = useState<string>('toutes');

  const mesAnomalies = anomalies.filter(a => a.developpeurId === user?.id);
  
  const anomaliesFiltrees = filtreStatut === 'toutes' 
    ? mesAnomalies
    : mesAnomalies.filter(a => a.statut === filtreStatut);

  const nouvelles = mesAnomalies.filter(a => a.statut === 'nouvelle').length;
  const enCours = mesAnomalies.filter(a => a.statut === 'en_cours').length;
  const resolutionSignalee = mesAnomalies.filter(a => a.statut === 'resolution_signalee').length;

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

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes anomalies</h1>
        <p className="text-muted-foreground mt-1">
          Anomalies qui me sont assignées
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nouvelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{nouvelles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{enCours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Résolution signalée</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{resolutionSignalee}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mesAnomalies.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium">Filtrer par statut:</Label>
        <Select value={filtreStatut} onValueChange={setFiltreStatut}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
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

      {/* Liste des anomalies */}
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
                  <p className="text-sm">{anomalie.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      Créée le {format(new Date(anomalie.dateCreation), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/anomalies/${anomalie.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="size-4 mr-2" />
                        Voir les détails
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {anomaliesFiltrees.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Bug className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filtreStatut === 'toutes' 
                ? 'Aucune anomalie assignée' 
                : `Aucune anomalie avec le statut "${filtreStatut}"`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Les anomalies vous seront notifiées directement par les testeurs
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
