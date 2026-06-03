import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { AlertTriangle, Clock, CheckCircle2, Bug, Search, Filter, ArrowRight } from 'lucide-react';
import { StatutAnomalie, Priorite } from '../types';

export function AdminAllAnomaliesPage() {
  const { currentUser, users } = useAuth();
  const { anomalies, fonctionnalites, campagnes, projets } = useData();
  const navigate = useNavigate();
  
  const [filterStatut, setFilterStatut] = useState<StatutAnomalie | 'tous'>('tous');
  const [filterPriorite, setFilterPriorite] = useState<Priorite | 'toutes'>('toutes');
  const [filterProjet, setFilterProjet] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <Bug className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  const anomaliesFiltrees = anomalies.filter(anomalie => {
    const matchStatut = filterStatut === 'tous' || anomalie.statut === filterStatut;
    const matchPriorite = filterPriorite === 'toutes' || anomalie.priorite === filterPriorite;
    
    const fonctionnalite = fonctionnalites.find(f => f.id === anomalie.fonctionnaliteId);
    const campagne = campagnes.find(c => c.id === anomalie.campagneId);
    const projet = projets.find(p => p.id === campagne?.projetId);
    
    const matchProjet = filterProjet === 'tous' || projet?.id === filterProjet;
    
    const matchSearch = !searchTerm || 
      anomalie.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anomalie.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchStatut && matchPriorite && matchProjet && matchSearch;
  });

  const getStatutBadge = (statut: StatutAnomalie) => {
    const config = {
      nouvelle: { label: 'Nouvelle', className: 'bg-red-100 text-red-700 border-red-200' },
      en_cours: { label: 'En cours', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      resolution_signalee: { label: 'Résolution signalée', className: 'bg-green-100 text-green-700 border-green-200' },
      validee: { label: 'Validée', className: 'bg-green-200 text-green-800 border-green-300' },
      cloturee: { label: 'Clôturée', className: 'bg-gray-100 text-gray-700 border-gray-200' }
    };
    return config[statut];
  };

  const getPrioriteBadge = (priorite: Priorite) => {
    const config = {
      critique: 'bg-red-100 text-red-700 border-red-200',
      haute: 'bg-orange-100 text-orange-700 border-orange-200',
      moyenne: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      basse: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return config[priorite];
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
        return <Bug className="w-5 h-5 text-gray-400" />;
    }
  };

  const stats = {
    total: anomalies.length,
    nouvelles: anomalies.filter(a => a.statut === 'nouvelle').length,
    enCours: anomalies.filter(a => a.statut === 'en_cours').length,
    resolues: anomalies.filter(a => a.statut === 'resolution_signalee' || a.statut === 'validee').length,
    cloturees: anomalies.filter(a => a.statut === 'cloturee').length,
    critiques: anomalies.filter(a => a.priorite === 'critique').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Toutes les anomalies</h1>
        <p className="text-sm text-slate-500 mt-0.5">Vue globale et filtrée de toutes les anomalies</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-indigo-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-red-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nouvelles</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{stats.nouvelles}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-blue-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">En cours</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.enCours}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-emerald-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Résolues</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.resolues}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-gray-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Clôturées</p>
            <p className="text-3xl font-bold text-gray-600 mt-1">{stats.cloturees}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-red-600" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Critiques</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{stats.critiques}</p>
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
                placeholder="Rechercher par titre ou description..."
                className="pl-9 bg-white border-slate-200 h-9"
              />
            </div>
            <Select value={filterStatut} onValueChange={(v: any) => setFilterStatut(v)}>
              <SelectTrigger className="w-40 bg-white border-slate-200 h-9">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous statuts</SelectItem>
                <SelectItem value="nouvelle">Nouvelles</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="resolution_signalee">Résolution signalée</SelectItem>
                <SelectItem value="validee">Validées</SelectItem>
                <SelectItem value="cloturee">Clôturées</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriorite} onValueChange={(v: any) => setFilterPriorite(v)}>
              <SelectTrigger className="w-40 bg-white border-slate-200 h-9">
                <SelectValue placeholder="Filtrer par priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes priorités</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProjet} onValueChange={setFilterProjet}>
              <SelectTrigger className="w-48 bg-white border-slate-200 h-9">
                <SelectValue placeholder="Filtrer par projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous projets</SelectItem>
                {projets.map(projet => (
                  <SelectItem key={projet.id} value={projet.id}>
                    {projet.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="space-y-2">
            {anomaliesFiltrees.length === 0 && (
              <div className="py-10 text-center">
                <Bug className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucune anomalie trouvée</p>
              </div>
            )}
            {anomaliesFiltrees.map(anomalie => {
              const fonctionnalite = fonctionnalites.find(f => f.id === anomalie.fonctionnaliteId);
              const campagne = campagnes.find(c => c.id === anomalie.campagneId);
              const projet = projets.find(p => p.id === campagne?.projetId);
              const testeur = users.find((u: any) => u.id === anomalie.testeurId);
              const developpeur = users.find((u: any) => u.id === anomalie.developpeurId);
              const statutBadge = getStatutBadge(anomalie.statut);

              return (
                <div
                  key={anomalie.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/anomalies/${anomalie.id}`)}
                >
                  <div className="flex-shrink-0">
                    {getStatutIcon(anomalie.statut)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium text-slate-800">{anomalie.titre}</h3>
                          <Badge className={statutBadge.className}>
                            {statutBadge.label}
                          </Badge>
                          <Badge className={getPrioriteBadge(anomalie.priorite)}>
                            {anomalie.priorite}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {anomalie.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span><strong>Fonctionnalité:</strong> {fonctionnalite?.nom}</span>
                      <span><strong>Campagne:</strong> {campagne?.nom}</span>
                      <span><strong>Projet:</strong> {projet?.nom}</span>
                      <span><strong>Testeur:</strong> {testeur?.prenom} {testeur?.nom}</span>
                      <span><strong>Développeur:</strong> {developpeur?.prenom} {developpeur?.nom}</span>
                    </div>
                    
                    <div className="text-xs text-slate-400">
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
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
