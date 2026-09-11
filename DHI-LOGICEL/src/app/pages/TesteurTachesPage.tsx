import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles, UserCheck, Search, FileText, ClipboardList, Loader2 } from 'lucide-react';
import { StatutFonctionnalite, Anomalie, TestCase, DescriptionAudio } from '../types';
import { suggerePriorite, suggereDeveloppeur } from '../services/aiService';
import { testCaseService } from '../services/testCaseService';
import { featureService } from '../services/featureService';
import { useDebounce } from '../hooks/useDebounce';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { VoiceDescriptionInput } from '../components/VoiceDescriptionInput';
import { VoiceDescriptionDisplay } from '../components/VoiceDescriptionDisplay';

function joursRestants(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

export function TesteurTachesPage() {
  const { t } = useTranslation();
  const { currentUser, users } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const { 
    fonctionnalites, 
    campagnes, 
    projets,
    anomalies,
    changerStatutFonctionnalite,
    ajouterAnomalie,
    ajouterNotification
  } = useData();
  const navigate = useNavigate();
  
  const [dialogStatutOpen, setDialogStatutOpen] = useState(false);
  const [fonctionnaliteSelectionnee, setFonctionnaliteSelectionnee] = useState<string | null>(null);
  const [nouveauStatut, setNouveauStatut] = useState<StatutFonctionnalite>('conforme');
  const [descriptionAnomalie, setDescriptionAnomalie] = useState('');
  const [descriptionAudioAnomalie, setDescriptionAudioAnomalie] = useState<DescriptionAudio | undefined>(undefined);
  const [titreAnomalie, setTitreAnomalie] = useState('');
  const [developpeurSelectionne, setDeveloppeurSelectionne] = useState('');
  const [testCaseSelectionne, setTestCaseSelectionne] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [priorite, setPriorite] = useState<'basse' | 'moyenne' | 'haute' | 'critique'>('moyenne');
  const [dateLimiteCorrection, setDateLimiteCorrection] = useState('');
  
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [filtreCampagne, setFiltreCampagne] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const [suggestionPriorite, setSuggestionPriorite] = useState<'basse' | 'moyenne' | 'haute' | 'critique' | null>(null);
  const [suggestionDeveloppeur, setSuggestionDeveloppeur] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [tachesOuvertes, setTachesOuvertes] = useState<Set<string>>(new Set());
  const toggleTache = (id: string) =>
    setTachesOuvertes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Gestion de la modale des Cas de Test
  const [modalTestCasesId, setModalTestCasesId] = useState<string | null>(null);
  const [testCasesParFonctionnalite, setTestCasesParFonctionnalite] = useState<Record<string, TestCase[]>>({});
  const [testCasesChargement, setTestCasesChargement] = useState<Record<string, boolean>>({});

  const chargerTestCases = async (featureId: string) => {
    if (testCasesParFonctionnalite[featureId] || testCasesChargement[featureId]) return;
    setTestCasesChargement(prev => ({ ...prev, [featureId]: true }));
    try {
      const cases = await testCaseService.list({ featureId });
      setTestCasesParFonctionnalite(prev => ({ ...prev, [featureId]: cases }));
    } catch (e) {
      console.error('Erreur chargement cas de test', e);
    } finally {
      setTestCasesChargement(prev => ({ ...prev, [featureId]: false }));
    }
  };

  const ouvrirModalTestCases = (featureId: string) => {
    setModalTestCasesId(featureId);
    chargerTestCases(featureId);
  };

  const handleTelechargerDocument = async (featureId: string) => {
    try {
      const { blob, name } = await featureService.downloadAttachment(featureId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erreur téléchargement document', e);
    }
  };

  const isFormAnomalieValide =
    nouveauStatut !== 'anomalie' ||
    (!!titreAnomalie && !!descriptionAudioAnomalie && !!developpeurSelectionne) ||
    (!!titreAnomalie && !!descriptionAnomalie.trim() && !!developpeurSelectionne);

  if (!currentUser || (currentUser.role !== 'testeur' && currentUser.role !== 'admin')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('testeur.tasks.access_denied')}</p>
      </div>
    );
  }

  const mesTaches = isAdmin
    ? fonctionnalites
    : fonctionnalites.filter(f => f.testeurAssigneId === currentUser.id);
  const developpeurs = users.filter(u => u.role === 'developpeur');

  const mesTachesBase = mesTaches.filter(f => {
    if (filtreCampagne !== 'tous' && f.campagneId !== filtreCampagne) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      if (!f.nom?.toLowerCase().includes(q) && !f.description?.toLowerCase().includes(q) && !f.module?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const mesTachesFiltrees = mesTachesBase.filter(f => {
    if (filtreStatut !== 'tous' && f.statut !== filtreStatut) return false;
    return true;
  });

  const tachesParCampagne = mesTachesFiltrees.reduce((acc, f) => {
    const campagneId = f.campagneId;
    if (!acc[campagneId]) acc[campagneId] = [];
    acc[campagneId].push(f);
    return acc;
  }, {} as Record<string, typeof mesTachesFiltrees>);

  const campagnesOrdonnees = Object.keys(tachesParCampagne).sort();

  useEffect(() => {
    if (titreAnomalie || descriptionAnomalie) {
      const prioriteSuggeree = suggerePriorite(titreAnomalie, descriptionAnomalie);
      setSuggestionPriorite(prioriteSuggeree);
      setShowSuggestions(true);
    } else {
      setSuggestionPriorite(null);
      setShowSuggestions(false);
    }
  }, [titreAnomalie, descriptionAnomalie]);

  useEffect(() => {
    if (titreAnomalie || descriptionAnomalie) {
      const fonctionnalite = fonctionnalites.find(f => f.id === fonctionnaliteSelectionnee);
      const devSuggere = suggereDeveloppeur(
        { titre: titreAnomalie, description: descriptionAnomalie, module: fonctionnalite?.module },
        anomalies,
        developpeurs
      );
      setSuggestionDeveloppeur(devSuggere);
    } else {
      setSuggestionDeveloppeur(null);
    }
  }, [titreAnomalie, descriptionAnomalie, fonctionnaliteSelectionnee, anomalies, developpeurs]);

  const handleOpenDialogStatut = (fonctionnaliteId: string, statut: StatutFonctionnalite) => {
    const fonctionnalite = fonctionnalites.find(f => f.id === fonctionnaliteId);
    setFonctionnaliteSelectionnee(fonctionnaliteId);
    setNouveauStatut(statut);
    setDescriptionAnomalie('');
    setDescriptionAudioAnomalie(undefined);
    setTitreAnomalie('');
    setDeveloppeurSelectionne('');
    setTestCaseSelectionne('');
    setTestCases([]);
    setPriorite('moyenne');
    setDateLimiteCorrection(statut === 'anomalie' && fonctionnalite?.dateEcheance ? toDateInput(fonctionnalite.dateEcheance) : '');
    setSuggestionPriorite(null);
    setSuggestionDeveloppeur(null);
    setShowSuggestions(false);
    setDialogStatutOpen(true);
  };

  useEffect(() => {
    const loadTestCases = async () => {
      if (!fonctionnaliteSelectionnee) return;
      try {
        const cases = await testCaseService.list({ featureId: fonctionnaliteSelectionnee });
        setTestCases(cases);
      } catch (e) {
        console.error('Erreur chargement cas de test', e);
      }
    };
    loadTestCases();
  }, [fonctionnaliteSelectionnee]);

  const fonctionnaliteForm = fonctionnalites.find(f => f.id === fonctionnaliteSelectionnee);
  const echeanceMax = fonctionnaliteForm?.dateEcheance ? toDateInput(fonctionnaliteForm.dateEcheance) : '';
  const delaiDepasse = !!dateLimiteCorrection && !!echeanceMax && dateLimiteCorrection > echeanceMax;

  const handleChangerStatut = async () => {
    if (!fonctionnaliteSelectionnee) return;

    const fonctionnalite = fonctionnalites.find(f => f.id === fonctionnaliteSelectionnee);
    if (!fonctionnalite) return;

    if (nouveauStatut === 'anomalie') {
      if (fonctionnalite.statut === 'conforme') return;
      if (delaiDepasse) return;
      if (!titreAnomalie || (!descriptionAnomalie.trim() && !descriptionAudioAnomalie) || !developpeurSelectionne) {
        return;
      }

      const nouvelleAnomalie: Anomalie = {
        id: `a${Date.now()}`,
        testCaseId: testCaseSelectionne || undefined,
        fonctionnaliteId: fonctionnalite.id,
        campagneId: fonctionnalite.campagneId,
        titre: titreAnomalie,
        description: descriptionAnomalie,
        testeurId: currentUser.id,
        developpeurId: developpeurSelectionne,
        statut: 'nouvelle',
        priorite,
        dateCreation: new Date().toISOString(),
        dateLimiteCorrection: dateLimiteCorrection || undefined,
        descriptionAudio: descriptionAudioAnomalie,
      };

      await ajouterAnomalie(nouvelleAnomalie);

      ajouterNotification({
        id: `n${Date.now()}`,
        userId: developpeurSelectionne,
        type: 'anomalie',
        titre: t('testeur.tasks.report_anomaly_title'),
        message: t('testeur.tasks.notification_message', { titre: titreAnomalie }),
        lue: false,
        dateCreation: new Date().toISOString(),
        lienUrl: `/anomalies/${nouvelleAnomalie.id}`
      });

      const campagne = campagnes.find((c: any) => c.id === fonctionnalite.campagneId);
      if (campagne?.chefTesteurIds) {
        campagne.chefTesteurIds.forEach((chefId: string) => {
          if (chefId !== currentUser.id) {
            ajouterNotification({
              id: `n_${Date.now()}_${chefId}`,
              userId: chefId,
              type: 'anomalie',
              titre: 'Nouvelle anomalie dans votre campagne',
              message: `Une anomalie "${titreAnomalie}" a été créée dans la campagne "${campagne.nom}"`,
              lue: false,
              dateCreation: new Date().toISOString(),
              lienUrl: `/anomalies/${nouvelleAnomalie.id}`
            });
          }
        });
      }
    }

    await changerStatutFonctionnalite(fonctionnalite.id, nouveauStatut, currentUser.id);
    setDialogStatutOpen(false);
  };

  const { pending: changementPending, run: changerStatut } = useAsyncAction(handleChangerStatut);

  const getStatutIcon = (statut: StatutFonctionnalite) => {
    switch (statut) {
      case 'conforme':
        return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />;
      case 'anomalie':
        return <XCircle className="w-4 h-4 text-red-600 shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400 shrink-0" />;
    }
  };

  const statutBadgeConfigTester: Record<StatutFonctionnalite, { labelKey: string; className: string }> = {
    non_testee: { labelKey: 'testeur.tasks.not_tested', className: 'bg-gray-100 text-gray-700' },
    en_cours: { labelKey: 'statut.en_cours', className: 'bg-yellow-100 text-yellow-700' },
    conforme: { labelKey: 'testeur.tasks.mark_compliant', className: 'bg-green-100 text-green-700' },
    anomalie: { labelKey: 'testeur.tasks.report_anomaly', className: 'bg-red-100 text-red-700' }
  };

  const getStatutBadge = (statut: StatutFonctionnalite) => {
    const found = statutBadgeConfigTester[statut];
    return found ? { label: t(found.labelKey), className: found.className } : { label: statut, className: 'bg-gray-100 text-gray-700' };
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

  const selectedFeatureForModal = fonctionnalites.find(f => f.id === modalTestCasesId);
  const casesForModal = modalTestCasesId ? testCasesParFonctionnalite[modalTestCasesId] || [] : [];
  const loadingForModal = modalTestCasesId ? !!testCasesChargement[modalTestCasesId] : false;

  return (
    <TooltipProvider>
      <div className="space-y-6 w-full px-4 py-2">
        <div>
          <h2 className="text-2xl font-semibold mb-1">{t('testeur.tasks.title')}</h2>
          <p className="text-gray-500">{t('testeur.tasks.subtitle')}</p>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('tous')}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">{t('testeur.tasks.total')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <div className="text-xl font-bold">{mesTachesBase.length}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('non_testee')}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">{t('testeur.tasks.not_tested')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <div className="text-xl font-bold text-orange-600">
                {mesTachesBase.filter(t => t.statut === 'non_testee').length}
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('conforme')}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">{t('testeur.tasks.compliant')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <div className="text-xl font-bold text-green-600">
                {mesTachesBase.filter(t => t.statut === 'conforme').length}
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltreStatut('anomalie')}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">{t('testeur.tasks.anomalies')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <div className="text-xl font-bold text-red-600">
                {mesTachesBase.filter(t => t.statut === 'anomalie').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres de recherche */}
        <div className="flex flex-wrap gap-3 items-center w-full">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm w-full"
            />
          </div>
          <Select value={filtreStatut} onValueChange={setFiltreStatut}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder={t('campagne.detail.filter_status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">{t('common.all')}</SelectItem>
              <SelectItem value="non_testee">{t('testeur.tasks.not_tested')}</SelectItem>
              <SelectItem value="conforme">{t('testeur.tasks.compliant')}</SelectItem>
              <SelectItem value="anomalie">{t('testeur.tasks.anomalies')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtreCampagne} onValueChange={setFiltreCampagne}>
            <SelectTrigger className="w-[220px] h-9 text-sm">
              <SelectValue placeholder={t('testeur.tasks.campagne')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">{t('common.all')}</SelectItem>
              {campagnes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Liste des tâches */}
        <div className="space-y-8 w-full">
          {campagnesOrdonnees.map(campagneId => {
            const campagne = campagnes.find(c => c.id === campagneId);
            const taches = tachesParCampagne[campagneId];
            return (
              <div key={campagneId} className="w-full">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {campagne?.nom || campagneId}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                    {taches.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                  {taches.map((fonctionnalite) => {
                    const projet = projets.find(p => p.id === campagne?.projetId);
                    const statutBadge = getStatutBadge(fonctionnalite.statut);
                    const derniereAnomalie = anomalies
                      .filter(a => a.fonctionnaliteId === fonctionnalite.id)
                      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())[0];
                    const isOpen = tachesOuvertes.has(fonctionnalite.id);

                    return (
                      <Card key={fonctionnalite.id} className="p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl border border-slate-200 w-full">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {getStatutIcon(fonctionnalite.statut)}
                              <h4 
                                onClick={() => toggleTache(fonctionnalite.id)}
                                className="font-semibold text-sm text-slate-900 truncate hover:text-indigo-600 cursor-pointer"
                              >
                                {fonctionnalite.nom}
                              </h4>
                            </div>
                            <Badge className={`text-[10px] px-2 py-0.5 shrink-0 ${getPrioriteBadge(fonctionnalite.priorite)}`}>
                              {fonctionnalite.priorite}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                            <span>Module: <strong className="text-slate-700">{fonctionnalite.module}</strong></span>
                            <Badge className={`text-[10px] ${statutBadge.className}`}>
                              {statutBadge.label}
                            </Badge>
                          </div>

                          {isOpen && (
                            <div className="mt-3 space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                              <p>{fonctionnalite.description || 'Aucune description disponible.'}</p>
                              <VoiceDescriptionDisplay audio={fonctionnalite.descriptionAudio} />
                              
                              <div className="space-y-1 text-[11px] text-slate-500 pt-1">
                                <div><strong>Projet:</strong> {projet?.nom}</div>
                                {fonctionnalite.dateEcheance && (
                                  <div className={joursRestants(fonctionnalite.dateEcheance) < 0 ? 'text-red-500 font-medium' : 'text-slate-500'}>
                                    <strong>Échéance:</strong> {new Date(fonctionnalite.dateEcheance).toLocaleDateString('fr-FR')}
                                    {' ('}
                                    {(() => {
                                      const jr = joursRestants(fonctionnalite.dateEcheance);
                                      return jr < 0
                                        ? t('testeur.tasks.overdue', { count: Math.abs(jr) })
                                        : jr === 0
                                          ? t('testeur.tasks.today')
                                          : t('testeur.tasks.days_left', { count: jr });
                                    })()}
                                    {')'}
                                  </div>
                                )}
                              </div>

                              {derniereAnomalie && (
                                <button
                                  onClick={() => navigate(`/anomalies/${derniereAnomalie.id}`)}
                                  className="text-[11px] text-indigo-600 hover:underline font-medium block pt-1 cursor-pointer"
                                >
                                  {t('testeur.tasks.view_anomaly_history')}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                          <button
                            onClick={() => toggleTache(fonctionnalite.id)}
                            className="text-xs text-slate-500 hover:text-indigo-600 font-medium cursor-pointer"
                          >
                            {isOpen ? 'Masquer' : 'Détails'}
                          </button>

                          <div className="flex items-center gap-1">
                            {fonctionnalite.attachment && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => handleTelechargerDocument(fonctionnalite.id)}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('testeur.tasks.download_document')}</TooltipContent>
                              </Tooltip>
                            )}

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-slate-600 hover:bg-slate-100"
                                  onClick={() => ouvrirModalTestCases(fonctionnalite.id)}
                                >
                                  <ClipboardList className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('testeur.tasks.view_test_cases')}</TooltipContent>
                            </Tooltip>

                            {fonctionnalite.statut !== 'conforme' && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-green-600 hover:bg-green-50"
                                      onClick={() => handleOpenDialogStatut(fonctionnalite.id, 'conforme')}
                                      disabled={isAdmin}
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('testeur.tasks.mark_compliant')}</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                                      onClick={() => handleOpenDialogStatut(fonctionnalite.id, 'anomalie')}
                                      disabled={isAdmin}
                                    >
                                      <AlertTriangle className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('testeur.tasks.report_anomaly')}</TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {mesTachesFiltrees.length === 0 && (
          <Card className="w-full">
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('testeur.tasks.no_tasks')}</p>
            </CardContent>
          </Card>
        )}

        {/* Modal de visualisation des cas de test */}
        <Dialog open={!!modalTestCasesId} onOpenChange={(open) => !open && setModalTestCasesId(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <span>Cas de test : {selectedFeatureForModal?.nom}</span>
              </DialogTitle>
              <DialogDescription>
                Liste des tests associés à cette fonctionnalité.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {loadingForModal ? (
                <div className="flex items-center justify-center py-8 text-slate-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Chargement des cas de test...</span>
                </div>
              ) : casesForModal.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Aucun cas de test disponible pour cette fonctionnalité.
                </div>
              ) : (
                casesForModal.map((tc, idx) => (
                  <div key={tc.id || idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-sm text-slate-800">{tc.titre || tc.nom}</h5>
                      {tc.statut && (
                        <Badge className="text-[10px]" variant="outline">
                          {tc.statut}
                        </Badge>
                      )}
                    </div>
                    {tc.description && (
                      <p className="text-xs text-slate-600">{tc.description}</p>
                    )}
                    {tc.etapes && (
                      <div className="text-xs text-slate-500 pt-1">
                        <strong>Étapes:</strong> {tc.etapes}
                      </div>
                    )}
                    {tc.resultatAttendu && (
                      <div className="text-xs text-slate-500">
                        <strong>Résultat attendu:</strong> {tc.resultatAttendu}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalTestCasesId(null)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de changement de statut */}
        <Dialog open={dialogStatutOpen} onOpenChange={setDialogStatutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {nouveauStatut === 'conforme' ? t('testeur.tasks.mark_compliant_title') : t('testeur.tasks.report_anomaly_title')}
              </DialogTitle>
              <DialogDescription>
                {nouveauStatut === 'conforme'
                  ? t('testeur.tasks.mark_compliant_desc')
                  : t('testeur.tasks.report_anomaly_desc')}
              </DialogDescription>
            </DialogHeader>
            
            {nouveauStatut === 'anomalie' && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="titre">{t('testeur.tasks.anomaly_title')}</Label>
                  <Input
                    id="titre"
                    value={titreAnomalie}
                    onChange={(e) => setTitreAnomalie(e.target.value)}
                    placeholder={t('testeur.tasks.anomaly_title_placeholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priorite">{t('testeur.tasks.priority')}</Label>
                  <Select value={priorite} onValueChange={(value: any) => setPriorite(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('testeur.tasks.select_priority')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critique">{t('priorite.critique')}</SelectItem>
                      <SelectItem value="haute">{t('priorite.haute')}</SelectItem>
                      <SelectItem value="moyenne">{t('priorite.moyenne')}</SelectItem>
                      <SelectItem value="basse">{t('priorite.basse')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {suggestionPriorite && suggestionPriorite !== priorite && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      onClick={() => setPriorite(suggestionPriorite)}
                    >
                      <Sparkles className="w-3 h-3" />
                      {t('testeur.tasks.ia_suggests')} {t(`priorite.${suggestionPriorite}`)}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('testeur.tasks.description')}</Label>
                  <Textarea
                    id="description"
                    value={descriptionAnomalie}
                    onChange={(e) => setDescriptionAnomalie(e.target.value)}
                    placeholder={t('testeur.tasks.description_placeholder')}
                    rows={4}
                  />
                  <VoiceDescriptionInput
                    value={descriptionAudioAnomalie}
                    onChange={setDescriptionAudioAnomalie}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateLimiteCorrection">{t('testeur.tasks.correction_due')}</Label>
                  <Input
                    id="dateLimiteCorrection"
                    type="date"
                    value={dateLimiteCorrection}
                    max={echeanceMax || undefined}
                    onChange={(e) => setDateLimiteCorrection(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">{t('testeur.tasks.correction_due_hint')}</p>
                  {delaiDepasse && (
                    <p className="text-xs text-red-500">{t('testeur.tasks.correction_due_exceeds', { date: echeanceMax })}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="developpeur">{t('testeur.tasks.notify_developer')}</Label>
                  <Select value={developpeurSelectionne} onValueChange={setDeveloppeurSelectionne}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('testeur.tasks.select_developer')} />
                    </SelectTrigger>
                    <SelectContent>
                      {developpeurs.map(dev => (
                        <SelectItem key={dev.id} value={dev.id}>
                          {dev.prenom} {dev.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {suggestionDeveloppeur && suggestionDeveloppeur !== developpeurSelectionne && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      onClick={() => setDeveloppeurSelectionne(suggestionDeveloppeur)}
                    >
                      <UserCheck className="w-3 h-3" />
                      {t('testeur.tasks.ia_suggests')} {developpeurs.find(d => d.id === suggestionDeveloppeur)?.prenom} {developpeurs.find(d => d.id === suggestionDeveloppeur)?.nom}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogStatutOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={changerStatut}
                disabled={changementPending || !isFormAnomalieValide}
              >
                {changementPending ? t('common.loading') : t('common.confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default TesteurTachesPage;