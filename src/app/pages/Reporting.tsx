import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { FileDown, FileSpreadsheet, FileText, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Reporting() {
  const { projets, campagnes, fonctionnalites, anomalies } = useData();
  const [selectedCampagne, setSelectedCampagne] = useState<string>('');

  const handleExportPDF = () => {
    toast.success('Export PDF en cours de génération...');
    // Simulation export
    setTimeout(() => {
      toast.success('Rapport PDF généré avec succès');
    }, 1500);
  };

  const handleExportExcel = () => {
    toast.success('Export Excel en cours de génération...');
    // Simulation export
    setTimeout(() => {
      toast.success('Rapport Excel généré avec succès');
    }, 1500);
  };

  const campagneSelectionnee = campagnes.find(c => c.id === selectedCampagne);
  const fonctionnalitesCampagne = selectedCampagne 
    ? fonctionnalites.filter(f => f.campagneId === selectedCampagne)
    : fonctionnalites;
  const anomaliesCampagne = selectedCampagne
    ? anomalies.filter(a => a.campagneId === selectedCampagne)
    : anomalies;

  const conformes = fonctionnalitesCampagne.filter(f => f.statut === 'conforme').length;
  const avecAnomalies = fonctionnalitesCampagne.filter(f => f.statut === 'anomalie').length;
  const enCours = fonctionnalitesCampagne.filter(f => f.statut === 'en_cours').length;
  const enAttente = fonctionnalitesCampagne.filter(f => f.statut === 'en_attente').length;

  const anomaliesOuvertes = anomaliesCampagne.filter(a => a.statut !== 'cloturee').length;
  const anomaliesCritiques = anomaliesCampagne.filter(a => {
    const fonc = fonctionnalites.find(f => f.id === a.fonctionnaliteId);
    return fonc?.priorite === 'critique' && a.statut !== 'cloturee';
  }).length;

  const tauxConformite = fonctionnalitesCampagne.length > 0
    ? Math.round((conformes / fonctionnalitesCampagne.length) * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reporting</h1>
        <p className="text-muted-foreground mt-1">
          Génération et export de rapports de qualité
        </p>
      </div>

      {/* Sélection de la campagne */}
      <Card>
        <CardHeader>
          <CardTitle>Sélection du périmètre</CardTitle>
          <CardDescription>
            Choisissez une campagne ou générez un rapport global
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campagne</label>
              <Select value={selectedCampagne} onValueChange={setSelectedCampagne}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les campagnes (rapport global)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les campagnes</SelectItem>
                  {campagnes.map((campagne) => (
                    <SelectItem key={campagne.id} value={campagne.id}>
                      {campagne.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleExportPDF} className="flex-1">
                <FileText className="size-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={handleExportExcel} variant="outline" className="flex-1">
                <FileSpreadsheet className="size-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aperçu du rapport */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          {campagneSelectionnee ? `Rapport - ${campagneSelectionnee.nom}` : 'Rapport global'}
        </h2>
        
        {/* Indicateurs clés */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="size-4" />
                Taux de conformité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{tauxConformite}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {conformes} / {fonctionnalitesCampagne.length} conformes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="size-4" />
                Anomalies ouvertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{anomaliesOuvertes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                dont {anomaliesCritiques} critiques
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tests en cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{enCours}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Fonctionnalités testées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{enAttente}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Non testées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Détails par statut */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Répartition des tests</CardTitle>
              <CardDescription>État des fonctionnalités testées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-green-600 text-white font-bold">
                      {conformes}
                    </div>
                    <div>
                      <p className="font-medium">Conformes</p>
                      <p className="text-sm text-muted-foreground">
                        Tests réussis sans anomalie
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    {fonctionnalitesCampagne.length > 0 
                      ? Math.round((conformes / fonctionnalitesCampagne.length) * 100)
                      : 0}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-red-600 text-white font-bold">
                      {avecAnomalies}
                    </div>
                    <div>
                      <p className="font-medium">Avec anomalies</p>
                      <p className="text-sm text-muted-foreground">
                        Fonctionnalités avec défauts
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {fonctionnalitesCampagne.length > 0 
                      ? Math.round((avecAnomalies / fonctionnalitesCampagne.length) * 100)
                      : 0}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                      {enCours}
                    </div>
                    <div>
                      <p className="font-medium">En cours de test</p>
                      <p className="text-sm text-muted-foreground">
                        Tests en progression
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                    {fonctionnalitesCampagne.length > 0 
                      ? Math.round((enCours / fonctionnalitesCampagne.length) * 100)
                      : 0}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-orange-600 text-white font-bold">
                      {enAttente}
                    </div>
                    <div>
                      <p className="font-medium">En attente</p>
                      <p className="text-sm text-muted-foreground">
                        Non testées
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                    {fonctionnalitesCampagne.length > 0 
                      ? Math.round((enAttente / fonctionnalitesCampagne.length) * 100)
                      : 0}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anomalies détectées</CardTitle>
              <CardDescription>Répartition par statut</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Nouvelles</p>
                    <p className="text-sm text-muted-foreground">Non prises en charge</p>
                  </div>
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                    {anomaliesCampagne.filter(a => a.statut === 'nouvelle').length}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">En cours</p>
                    <p className="text-sm text-muted-foreground">En cours de résolution</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-lg px-3 py-1">
                    {anomaliesCampagne.filter(a => a.statut === 'en_cours').length}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Résolution signalée</p>
                    <p className="text-sm text-muted-foreground">En attente de validation</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-lg px-3 py-1">
                    {anomaliesCampagne.filter(a => a.statut === 'resolution_signalee').length}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Clôturées</p>
                    <p className="text-sm text-muted-foreground">Résolues et validées</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-lg px-3 py-1">
                    {anomaliesCampagne.filter(a => a.statut === 'cloturee').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informations de la campagne */}
        {campagneSelectionnee && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Informations de la campagne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nom de la campagne</p>
                  <p className="font-medium">{campagneSelectionnee.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="font-medium">{campagneSelectionnee.description}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Période</p>
                  <p className="font-medium">
                    Du {format(new Date(campagneSelectionnee.dateDebut), 'dd MMM yyyy', { locale: fr })} au {format(new Date(campagneSelectionnee.dateFin), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Statut</p>
                  <p className="font-medium">
                    {campagneSelectionnee.statut === 'en_cours' && 'En cours'}
                    {campagneSelectionnee.statut === 'planifiée' && 'Planifiée'}
                    {campagneSelectionnee.statut === 'terminée' && 'Terminée'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Équipe testeurs</p>
                  <p className="font-medium">{campagneSelectionnee.testeurs.length} testeur(s)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Équipe développeurs</p>
                  <p className="font-medium">{campagneSelectionnee.developpeurs.length} développeur(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
