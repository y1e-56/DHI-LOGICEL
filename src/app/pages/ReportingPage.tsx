import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FileText, Download, BarChart3, TrendingUp, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS_STATUT = ['#EF4444', '#F59E0B', '#10B981', '#94A3B8'];
const COLORS_PRIORITE = ['#DC2626', '#F97316', '#EAB308', '#94A3B8'];

export function ReportingPage() {
  const { currentUser } = useAuth();
  const { campagnes, projets, fonctionnalites, anomalies } = useData();
  const [campagneSelectionnee, setCampagneSelectionnee] = useState<string>('');

  if (!currentUser || (currentUser.role !== 'chef_testeur' && currentUser.role !== 'admin')) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Accès réservé aux chefs testeurs et administrateurs</p>
      </div>
    );
  }

  const handleExportPDF = () => {
    if (!campagne || !stats || !projet) {
      toast.error('Veuillez sélectionner une campagne');
      return;
    }

    try {
      toast.success('Génération du rapport PDF en cours...');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      // En-tête
      doc.setFontSize(20);
      doc.text('Rapport de Campagne de Tests', pageWidth / 2, currentY, { align: 'center' });

      currentY += 10;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, pageWidth / 2, currentY, { align: 'center' });

      // Informations générales
      currentY += 15;
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Informations générales', 15, currentY);

      currentY += 8;
      autoTable(doc, {
        startY: currentY,
        head: [['Propriété', 'Valeur']],
        body: [
          ['Campagne', campagne.nom],
          ['Projet', projet.nom],
          ['Date de début', new Date(campagne.dateDebut).toLocaleDateString('fr-FR')],
          ['Date de fin', new Date(campagne.dateFin).toLocaleDateString('fr-FR')],
          ['Statut', campagne.statut.replace('_', ' ')],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;

      // Indicateurs clés
      doc.setFontSize(14);
      doc.text('Indicateurs clés', 15, currentY);

      currentY += 8;
      autoTable(doc, {
        startY: currentY,
        head: [['Indicateur', 'Valeur']],
        body: [
          ['Taux d\'avancement', `${tauxAvancement}%`],
          ['Taux de conformité', `${tauxConformite}%`],
          ['Total fonctionnalités', stats.totalFonctionnalites.toString()],
          ['Fonctionnalités testées', `${stats.conformes + stats.anomaliesDetectees}`],
          ['Total anomalies', stats.totalAnomalies.toString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;

      // Fonctionnalités par statut
      doc.setFontSize(14);
      doc.text('Répartition des fonctionnalités', 15, currentY);

      currentY += 8;
      autoTable(doc, {
        startY: currentY,
        head: [['Statut', 'Nombre']],
        body: [
          ['Non testées', stats.nonTestees.toString()],
          ['Conformes', stats.conformes.toString()],
          ['Avec anomalies', stats.anomaliesDetectees.toString()],
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;

      // Anomalies par statut
      if (stats.totalAnomalies > 0) {
        doc.setFontSize(14);
        doc.text('Anomalies par statut', 15, currentY);

        currentY += 8;
        autoTable(doc, {
          startY: currentY,
          head: [['Statut', 'Nombre']],
          body: [
            ['Nouvelles', stats.nouvelles.toString()],
            ['En cours', stats.enCours.toString()],
            ['Résolues', stats.resolues.toString()],
            ['Clôturées', stats.cloturees.toString()],
          ],
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;

        // Anomalies par priorité
        doc.setFontSize(14);
        doc.text('Anomalies par priorité', 15, currentY);

        currentY += 8;
        autoTable(doc, {
          startY: currentY,
          head: [['Priorité', 'Nombre']],
          body: [
            ['Critique', stats.critiques.toString()],
            ['Haute', stats.hautes.toString()],
            ['Moyenne', stats.moyennes.toString()],
            ['Basse', stats.basses.toString()],
          ],
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
        });
      }

      // Télécharger le PDF
      const fileName = `Rapport_${campagne.nom.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success('Rapport PDF téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleExportExcel = () => {
    if (!campagne || !stats || !projet) {
      toast.error('Veuillez sélectionner une campagne');
      return;
    }

    try {
      toast.success('Génération du rapport Excel en cours...');

      // Créer un nouveau classeur
      const workbook = XLSX.utils.book_new();

      // Feuille 1: Informations générales
      const infoData = [
        ['RAPPORT DE CAMPAGNE DE TESTS'],
        [],
        ['Campagne', campagne.nom],
        ['Projet', projet.nom],
        ['Date de début', new Date(campagne.dateDebut).toLocaleDateString('fr-FR')],
        ['Date de fin', new Date(campagne.dateFin).toLocaleDateString('fr-FR')],
        ['Statut', campagne.statut.replace('_', ' ')],
        ['Date de génération', new Date().toLocaleString('fr-FR')],
        [],
        ['INDICATEURS CLÉS'],
        ['Taux d\'avancement', `${tauxAvancement}%`],
        ['Taux de conformité', `${tauxConformite}%`],
        ['Total fonctionnalités', stats.totalFonctionnalites],
        ['Fonctionnalités testées', stats.conformes + stats.anomaliesDetectees],
        ['Total anomalies', stats.totalAnomalies],
      ];
      const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(workbook, wsInfo, 'Résumé');

      // Feuille 2: Fonctionnalités
      const fonctData = [
        ['RÉPARTITION DES FONCTIONNALITÉS'],
        [],
        ['Statut', 'Nombre'],
        ['Non testées', stats.nonTestees],
        ['Conformes', stats.conformes],
        ['Avec anomalies', stats.anomaliesDetectees],
        [],
        ['TOTAL', stats.totalFonctionnalites],
      ];
      const wsFonct = XLSX.utils.aoa_to_sheet(fonctData);
      XLSX.utils.book_append_sheet(workbook, wsFonct, 'Fonctionnalités');

      // Feuille 3: Anomalies
      if (stats.totalAnomalies > 0) {
        const anomaliesData = [
          ['ANOMALIES PAR STATUT'],
          [],
          ['Statut', 'Nombre'],
          ['Nouvelles', stats.nouvelles],
          ['En cours', stats.enCours],
          ['Résolues', stats.resolues],
          ['Clôturées', stats.cloturees],
          [],
          ['ANOMALIES PAR PRIORITÉ'],
          [],
          ['Priorité', 'Nombre'],
          ['Critique', stats.critiques],
          ['Haute', stats.hautes],
          ['Moyenne', stats.moyennes],
          ['Basse', stats.basses],
          [],
          ['TOTAL', stats.totalAnomalies],
        ];
        const wsAnomalies = XLSX.utils.aoa_to_sheet(anomaliesData);
        XLSX.utils.book_append_sheet(workbook, wsAnomalies, 'Anomalies');
      }

      // Feuille 4: Détail des anomalies
      const anomaliesCampagne = anomalies.filter(a => a.campagneId === campagneSelectionnee);
      if (anomaliesCampagne.length > 0) {
        const detailData = [
          ['Titre', 'Statut', 'Priorité', 'Date création', 'Testeur ID', 'Développeur ID'],
        ];
        anomaliesCampagne.forEach(a => {
          detailData.push([
            a.titre,
            a.statut,
            a.priorite,
            new Date(a.dateCreation).toLocaleDateString('fr-FR'),
            a.testeurId,
            a.developpeurId,
          ]);
        });
        const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
        XLSX.utils.book_append_sheet(workbook, wsDetail, 'Détail anomalies');
      }

      // Télécharger le fichier Excel
      const fileName = `Rapport_${campagne.nom.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success('Rapport Excel téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération de l\'Excel:', error);
      toast.error('Erreur lors de la génération de l\'Excel');
    }
  };

  const getCampagneStats = (campagneId: string) => {
    const fc = fonctionnalites.filter(f => f.campagneId === campagneId);
    const ac = anomalies.filter(a => a.campagneId === campagneId);
    return {
      totalFonctionnalites: fc.length,
      nonTestees: fc.filter(f => f.statut === 'non_testee').length,
      conformes: fc.filter(f => f.statut === 'conforme').length,
      anomaliesDetectees: fc.filter(f => f.statut === 'anomalie').length,
      totalAnomalies: ac.length,
      nouvelles: ac.filter(a => a.statut === 'nouvelle').length,
      enCours: ac.filter(a => a.statut === 'en_cours').length,
      resolues: ac.filter(a => a.statut === 'resolution_signalee').length,
      cloturees: ac.filter(a => a.statut === 'cloturee').length,
      critiques: ac.filter(a => a.priorite === 'critique').length,
      hautes: ac.filter(a => a.priorite === 'haute').length,
      moyennes: ac.filter(a => a.priorite === 'moyenne').length,
      basses: ac.filter(a => a.priorite === 'basse').length,
    };
  };

  const campagne = campagnes.find(c => c.id === campagneSelectionnee);
  const projet = projets.find(p => p.id === campagne?.projetId);
  const stats = campagneSelectionnee ? getCampagneStats(campagneSelectionnee) : null;

  const tauxAvancement = stats && stats.totalFonctionnalites > 0
    ? Math.round(((stats.conformes + stats.anomaliesDetectees) / stats.totalFonctionnalites) * 100)
    : 0;

  const tauxConformite = stats && stats.totalFonctionnalites > 0
    ? Math.round((stats.conformes / stats.totalFonctionnalites) * 100)
    : 0;

  const chartFonctionnalites = stats ? [
    { name: 'Non testées', value: stats.nonTestees },
    { name: 'Conformes', value: stats.conformes },
    { name: 'Anomalies', value: stats.anomaliesDetectees },
  ] : [];

  const chartAnomaliesStatut = stats ? [
    { name: 'Nouvelles', value: stats.nouvelles },
    { name: 'En cours', value: stats.enCours },
    { name: 'Résolues', value: stats.resolues },
    { name: 'Clôturées', value: stats.cloturees },
  ].filter(d => d.value > 0) : [];

  const chartAnomaliesPriorite = stats ? [
    { name: 'Critique', value: stats.critiques },
    { name: 'Haute', value: stats.hautes },
    { name: 'Moyenne', value: stats.moyennes },
    { name: 'Basse', value: stats.basses },
  ].filter(d => d.value > 0) : [];

  const chartBarFoncts = stats ? [
    { cat: 'Non testées', total: stats.nonTestees },
    { cat: 'Conformes', total: stats.conformes },
    { cat: 'Anomalies', total: stats.anomaliesDetectees },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reporting</h1>
          <p className="text-sm text-slate-500 mt-0.5">Générer des rapports et exporter l'historique des campagnes</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">
            Sélectionner une campagne
          </label>
          <Select value={campagneSelectionnee} onValueChange={setCampagneSelectionnee}>
            <SelectTrigger className="w-full max-w-lg bg-white border-slate-200">
              <SelectValue placeholder="Choisir une campagne..." />
            </SelectTrigger>
            <SelectContent>
              {campagnes.map(c => {
                const p = projets.find(proj => proj.id === c.projetId);
                return (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.nom}</span>
                      <span className="text-slate-400 text-xs">— {p?.nom}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!campagneSelectionnee && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="font-semibold text-slate-700">Sélectionnez une campagne</p>
          <p className="text-sm text-slate-400 mt-1">Les statistiques s'afficheront ici</p>
        </div>
      )}

      {campagneSelectionnee && stats && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Campagne</p>
                    <p className="font-semibold text-slate-800 text-sm">{campagne?.nom}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Projet</p>
                    <p className="font-semibold text-slate-800 text-sm">{projet?.nom}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Début</p>
                    <p className="font-semibold text-slate-800 text-sm font-mono">
                      {campagne && new Date(campagne.dateDebut).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Fin</p>
                    <p className="font-semibold text-slate-800 text-sm font-mono">
                      {campagne && new Date(campagne.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Statut</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <div className={`w-2 h-2 rounded-full ${campagne?.statut === 'en_cours' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {campagne?.statut.replace('_', ' ')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">Indicateurs clés</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      <p className="text-sm font-semibold text-slate-700">Taux d'avancement</p>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">{tauxAvancement}%</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full transition-all" style={{ width: `${tauxAvancement}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 font-mono">
                    {stats.conformes + stats.anomaliesDetectees} / {stats.totalFonctionnalites} fonctionnalités testées
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <p className="text-sm font-semibold text-slate-700">Taux de conformité</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{tauxConformite}%</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all" style={{ width: `${tauxConformite}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 font-mono">
                    {stats.conformes} fonctionnalités conformes
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-lg font-bold text-slate-800">{stats.nonTestees}</div>
                      <div className="text-[10px] text-slate-400">Non testées</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-red-50 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <div>
                      <div className="text-lg font-bold text-red-700">{stats.totalAnomalies}</div>
                      <div className="text-[10px] text-red-400">Anomalies</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">Fonctionnalités par statut</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartBarFoncts} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="cat" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                      labelStyle={{ fontWeight: 600, color: '#0F172A' }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {chartBarFoncts.map((entry, index) => (
                        <Cell key={`bar-cell-${entry.cat}`} fill={['#94A3B8', '#10B981', '#EF4444'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">Anomalies par priorité</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {chartAnomaliesPriorite.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartAnomaliesPriorite}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {chartAnomaliesPriorite.map((entry, index) => (
                          <Cell key={`pie-cell-${entry.name}`} fill={COLORS_PRIORITE[index % COLORS_PRIORITE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-sm text-slate-400">Aucune anomalie</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {stats.totalAnomalies > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">Répartition des anomalies par statut</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Nouvelles', value: stats.nouvelles, color: 'bg-red-50 border-red-100', num: 'text-red-600' },
                    { label: 'En cours', value: stats.enCours, color: 'bg-amber-50 border-amber-100', num: 'text-amber-600' },
                    { label: 'Résolues', value: stats.resolues, color: 'bg-emerald-50 border-emerald-100', num: 'text-emerald-600' },
                    { label: 'Clôturées', value: stats.cloturees, color: 'bg-slate-50 border-slate-100', num: 'text-slate-600' },
                  ].map(item => (
                    <div key={item.label} className={`border rounded-xl p-4 text-center ${item.color}`}>
                      <div className={`text-2xl font-bold ${item.num}`}>{item.value}</div>
                      <div className="text-xs text-slate-500 mt-1 font-semibold">{item.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-bold text-slate-800">Exporter le rapport</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-sm text-slate-500 mb-4">
                Téléchargez l'historique complet de la campagne <strong>{campagne?.nom}</strong> au format de votre choix.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleExportPDF} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <FileText className="w-4 h-4" />
                  Exporter en PDF
                </Button>
                <Button onClick={handleExportExcel} variant="outline" className="gap-2 border-slate-200 hover:border-indigo-300">
                  <Download className="w-4 h-4" />
                  Exporter en Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
