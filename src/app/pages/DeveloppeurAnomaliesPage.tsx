import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertTriangle, Clock, CheckCircle2, Code, Play } from 'lucide-react';
import { StatutAnomalie } from '../types';

export function DeveloppeurAnomaliesPage() {
  const { currentUser, users } = useAuth();
  const { anomalies, fonctionnalites, campagnes, projets, changerStatutAnomalie } = useData();
  const navigate = useNavigate();
  const [filtreStatut, setFiltreStatut] = useState<StatutAnomalie | 'tous'>('tous');

  const handlePrendreEnCharge = (anomalieId: string) => {
    if (!currentUser) return;
    changerStatutAnomalie(anomalieId, 'en_cours', currentUser.id);
  };

  if (!currentUser || currentUser.role !== 'developpeur') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Accès réservé aux développeurs</p>
      </div>
    );
  }

  const mesAnomalies = anomalies.filter(a => a.developpeurId === currentUser.id);
  
  const anomaliesFiltrees = mesAnomalies.filter(a => {
    if (filtreStatut === 'tous') return true;
    return a.statut === filtreStatut;
  });

  const getStatutBadge = (statut: StatutAnomalie) => {
    const config = {
      nouvelle: { label: 'Nouvelle', className: 'bg-red-100 text-red-700' },
      en_cours: { label: 'En cours', className: 'bg-blue-100 text-blue-700' },
      resolution_signalee: { label: 'Résolution signalée', className: 'bg-green-100 text-green-700' },
      validee: { label: 'Validée', className: 'bg-green-200 text-green-800' },
      cloturee: { label: 'Clôturée', className: 'bg-gray-100 text-gray-700' }
    };
    return config[statut];
  };

  const getPrioriteBadge = (priorite: string) => {
    const config = {
      critique: 'bg-red-100 text-red-700',
      haute: 'bg-orange-100 text-orange-700',
      moyenne: 'bg-yellow-100 text-yellow-700',
      basse: 'bg-gray-100 text-gray-700'
    };
    return config[priorite as keyof typeof config];
  };

  const getStatutIcon = (statut: StatutAnomalie) => {
    switch (statut) {
      case 'nouvelle':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'en_cours':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'resolution_signalee':
      case 'validee':
      case 'cloturee':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      default:
        return <Code className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Mes anomalies</h2>
        <p className="text-gray-500">Anomalies qui me sont assignées</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mesAnomalies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Nouvelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mesAnomalies.filter(a => a.statut === 'nouvelle').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mesAnomalies.filter(a => a.statut === 'en_cours').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Résolues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mesAnomalies.filter(a => a.statut === 'resolution_signalee').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Clôturées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {mesAnomalies.filter(a => a.statut === 'cloturee').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filtrer par statut :</label>
        <Select value={filtreStatut} onValueChange={(value: any) => setFiltreStatut(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous</SelectItem>
            <SelectItem value="nouvelle">Nouvelle</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="resolution_signalee">Résolution signalée</SelectItem>
            <SelectItem value="cloturee">Clôturée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {anomaliesFiltrees.map((anomalie) => {
          const fonctionnalite = fonctionnalites.find(f => f.id === anomalie.fonctionnaliteId);
          const campagne = campagnes.find(c => c.id === anomalie.campagneId);
          const projet = projets.find(p => p.id === campagne?.projetId);
          const testeur = users.find(u => u.id === anomalie.testeurId);
          const statutBadge = getStatutBadge(anomalie.statut);

          return (
            <Card 
              key={anomalie.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/anomalies/${anomalie.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {getStatutIcon(anomalie.statut)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium">{anomalie.titre}</h3>
                          <Badge className={statutBadge.className}>
                            {statutBadge.label}
                          </Badge>
                          <Badge className={getPrioriteBadge(anomalie.priorite)}>
                            {anomalie.priorite}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {anomalie.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {anomalie.statut === 'nouvelle' && (
                          <Button 
                            size="sm"
                            variant="outline"
                            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrendreEnCharge(anomalie.id);
                            }}
                          >
                            <Play className="w-4 h-4" />
                            Prendre en charge
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/anomalies/${anomalie.id}`);
                          }}
                        >
                          Voir détails
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span><strong>Fonctionnalité:</strong> {fonctionnalite?.nom}</span>
                      <span><strong>Campagne:</strong> {campagne?.nom}</span>
                      <span><strong>Projet:</strong> {projet?.nom}</span>
                      <span><strong>Créée par:</strong> {testeur?.prenom} {testeur?.nom}</span>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      Créée le {new Date(anomalie.dateCreation).toLocaleString('fr-FR')}
                    </div>

                    {anomalie.statut === 'resolution_signalee' && anomalie.commentaireResolution && (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs font-medium text-green-800 mb-1">Résolution signalée :</p>
                        <p className="text-sm text-green-700">{anomalie.commentaireResolution}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {anomaliesFiltrees.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Code className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {filtreStatut === 'tous' 
                ? 'Aucune anomalie assignée' 
                : `Aucune anomalie avec le statut "${getStatutBadge(filtreStatut as StatutAnomalie).label}"`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
