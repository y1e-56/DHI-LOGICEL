import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { UserPlus, CheckCircle, Clock, AlertTriangle, ArrowRight, Search, Filter } from 'lucide-react';

export function AdminAssignationPage() {
  const { currentUser, users } = useAuth();
  const { fonctionnalites, campagnes, projets, changerStatutFonctionnalite } = useData();
  const navigate = useNavigate();
  
  const [filterCampagne, setFilterCampagne] = useState<string>('tous');
  const [filterTesteur, setFilterTesteur] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  const testeurs = users.filter((u: any) => u.role === 'testeur');
  const fonctionnalitesNonAssignees = fonctionnalites.filter(f => !f.testeurAssigneId);
  const fonctionnalitesAssignees = fonctionnalites.filter(f => f.testeurAssigneId);

  const fonctionnalitesFiltrees = fonctionnalites.filter(fonct => {
    const matchCampagne = filterCampagne === 'tous' || fonct.campagneId === filterCampagne;
    const matchTesteur = filterTesteur === 'tous' || fonct.testeurAssigneId === filterTesteur;
    const matchSearch = !searchTerm || 
      fonct.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fonct.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCampagne && matchTesteur && matchSearch;
  });

  const handleAssigner = (fonctionnaliteId: string, testeurId: string) => {
    changerStatutFonctionnalite(fonctionnaliteId, 'non_testee', testeurId);
  };

  const handleDesassigner = (fonctionnaliteId: string) => {
    changerStatutFonctionnalite(fonctionnaliteId, 'non_testee', '');
  };

  const getStatutBadge = (statut: string) => {
    const config = {
      non_testee: { label: 'Non assignée', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      conforme: { label: 'Conforme', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      anomalie: { label: 'Anomalie', className: 'bg-red-100 text-red-700 border-red-200' }
    };
    return config[statut as keyof typeof config] || config.non_testee;
  };

  const stats = {
    total: fonctionnalites.length,
    nonAssignees: fonctionnalitesNonAssignees.length,
    assignees: fonctionnalitesAssignees.length,
    testees: fonctionnalites.filter(f => f.statut === 'conforme').length,
    anomalies: fonctionnalites.filter(f => f.statut === 'anomalie').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assignation des tâches</h1>
        <p className="text-sm text-slate-500 mt-0.5">Assigner des fonctionnalités aux testeurs</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-indigo-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-gray-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Non assignées</p>
            <p className="text-3xl font-bold text-gray-600 mt-1">{stats.nonAssignees}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-blue-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assignées</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.assignees}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-emerald-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Testées</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.testees}</p>
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
                placeholder="Rechercher par nom ou description..."
                className="pl-9 bg-white border-slate-200 h-9"
              />
            </div>
            <Select value={filterCampagne} onValueChange={setFilterCampagne}>
              <SelectTrigger className="w-48 bg-white border-slate-200 h-9">
                <SelectValue placeholder="Filtrer par campagne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes campagnes</SelectItem>
                {campagnes.map(campagne => {
                  const projet = projets.find(p => p.id === campagne.projetId);
                  return (
                    <SelectItem key={campagne.id} value={campagne.id}>
                      {campagne.nom} ({projet?.nom})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={filterTesteur} onValueChange={setFilterTesteur}>
              <SelectTrigger className="w-48 bg-white border-slate-200 h-9">
                <SelectValue placeholder="Filtrer par testeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous testeurs</SelectItem>
                {testeurs.map(testeur => (
                  <SelectItem key={testeur.id} value={testeur.id}>
                    {testeur.prenom} {testeur.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="space-y-2">
            {fonctionnalitesFiltrees.length === 0 && (
              <div className="py-10 text-center">
                <UserPlus className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucune fonctionnalité trouvée</p>
              </div>
            )}
            {fonctionnalitesFiltrees.map(fonct => {
              const campagne = campagnes.find(c => c.id === fonct.campagneId);
              const projet = projets.find(p => p.id === campagne?.projetId);
              const testeur = users.find((u: any) => u.id === fonct.testeurAssigneId);
              const statutBadge = getStatutBadge(fonct.statut);

              return (
                <div
                  key={fonct.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium text-slate-800">{fonct.nom}</h3>
                          <Badge className={statutBadge.className}>
                            {statutBadge.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {fonct.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span><strong>Module:</strong> {fonct.module}</span>
                      <span><strong>Campagne:</strong> {campagne?.nom}</span>
                      <span><strong>Projet:</strong> {projet?.nom}</span>
                      <span><strong>Priorité:</strong> {fonct.priorite}</span>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      {fonct.testeurAssigneId ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-700">
                              {testeur?.prenom[0]}{testeur?.nom[0]}
                            </span>
                          </div>
                          <span className="text-sm text-slate-700">
                            Assigné à {testeur?.prenom} {testeur?.nom}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDesassigner(fonct.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                          >
                            Désassigner
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">Non assignée</span>
                          <Select value="" onValueChange={(value) => handleAssigner(fonct.id, value)}>
                            <SelectTrigger className="w-48 h-8 text-xs">
                              <SelectValue placeholder="Assigner à..." />
                            </SelectTrigger>
                            <SelectContent>
                              {testeurs.map(testeur => (
                                <SelectItem key={testeur.id} value={testeur.id}>
                                  {testeur.prenom} {testeur.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
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
