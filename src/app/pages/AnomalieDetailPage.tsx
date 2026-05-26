import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Bug, User, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { StatutAnomalie } from '../types';

const prioriteConfig: Record<string, { label: string; cls: string; dot: string }> = {
  critique: { label: 'Critique', cls: 'bg-red-100 text-red-700 border border-red-200', dot: 'bg-red-500' },
  haute: { label: 'Haute', cls: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
  moyenne: { label: 'Moyenne', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-500' },
  basse: { label: 'Basse', cls: 'bg-slate-100 text-slate-600 border border-slate-200', dot: 'bg-slate-400' },
};

const statutConfig: Record<StatutAnomalie, { label: string; cls: string; icon: React.ElementType }> = {
  nouvelle: { label: 'Nouvelle', cls: 'bg-red-100 text-red-700 border border-red-200', icon: AlertTriangle },
  en_cours: { label: 'En cours', cls: 'bg-indigo-100 text-indigo-700 border border-indigo-200', icon: Clock },
  resolution_signalee: { label: 'Résolution signalée', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: CheckCircle2 },
  validee: { label: 'Validée', cls: 'bg-emerald-200 text-emerald-800 border border-emerald-300', icon: CheckCircle2 },
  cloturee: { label: 'Clôturée', cls: 'bg-slate-100 text-slate-600 border border-slate-200', icon: CheckCircle2 },
};

export function AnomalieDetailPage() {
  const { anomalieId } = useParams<{ anomalieId: string }>();
  const { currentUser, users } = useAuth();
  const {
    anomalies, fonctionnalites, campagnes, projets, historiqueActions,
    changerStatutAnomalie, signalerResolution, validerCloture
  } = useData();
  const navigate = useNavigate();
  const [commentaireResolution, setCommentaireResolution] = useState('');

  const anomalie = anomalies.find(a => a.id === anomalieId);
  const fonctionnalite = fonctionnalites.find(f => f.id === anomalie?.fonctionnaliteId);
  const campagne = campagnes.find(c => c.id === anomalie?.campagneId);
  const projet = projets.find(p => p.id === campagne?.projetId);
  const testeur = users.find(u => u.id === anomalie?.testeurId);
  const developpeur = users.find(u => u.id === anomalie?.developpeurId);
  const historique = historiqueActions
    .filter(h => h.anomalieId === anomalieId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!anomalie || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Bug className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-slate-500">Anomalie introuvable</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>Retour</Button>
      </div>
    );
  }

  const estDeveloppeurAssigne = currentUser.id === anomalie.developpeurId;
  const estTesteurCreateur = currentUser.id === anomalie.testeurId;
  const peutSignalerResolution = estDeveloppeurAssigne && (anomalie.statut === 'nouvelle' || anomalie.statut === 'en_cours');
  const peutValiderCloture = estTesteurCreateur && anomalie.statut === 'resolution_signalee';
  const peutPrendreEnCharge = estDeveloppeurAssigne && anomalie.statut === 'nouvelle';

  const statutInfo = statutConfig[anomalie.statut];
  const StatutIcon = statutInfo.icon;
  const prioriteInfo = prioriteConfig[anomalie.priorite];

  const handleSignalerResolution = () => {
    if (!currentUser || !commentaireResolution.trim()) return;
    signalerResolution(anomalie.id, currentUser.id, commentaireResolution);
    setCommentaireResolution('');
  };

  const handleValiderCloture = () => {
    if (!currentUser) return;
    validerCloture(anomalie.id, currentUser.id);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-slate-600 transition-colors border border-transparent hover:border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fiche anomalie</h1>
          <p className="text-sm text-slate-500">Détails et historique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5 px-5">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bug className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">{anomalie.titre}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={`${statutInfo.cls} gap-1.5 text-xs`}>
                      <StatutIcon className="w-3 h-3" />
                      {statutInfo.label}
                    </Badge>
                    <Badge className={`${prioriteInfo.cls} gap-1.5 text-xs`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${prioriteInfo.dot}`} />
                      Priorité {prioriteInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-lg p-4">
                  {anomalie.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                {[
                  { label: 'Fonctionnalité', value: fonctionnalite?.nom },
                  { label: 'Module', value: fonctionnalite?.module },
                  { label: 'Campagne', value: campagne?.nom },
                  { label: 'Projet', value: projet?.nom },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-700">{item.value || '—'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {peutPrendreEnCharge && (
            <Card className="border-0 shadow-sm border-l-4 border-l-indigo-500">
              <CardContent className="pt-5 pb-5 px-5">
                <p className="text-sm font-semibold text-slate-800 mb-3">Prendre en charge cette anomalie</p>
                <p className="text-sm text-slate-500 mb-4">Signalez que vous commencez à travailler sur cette anomalie.</p>
                <Button
                  onClick={() => changerStatutAnomalie(anomalie.id, 'en_cours', currentUser.id)}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Clock className="w-4 h-4" />
                  Passer en cours
                </Button>
              </CardContent>
            </Card>
          )}

          {peutSignalerResolution && (
            <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">Signaler une résolution</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Commentaire de résolution *
                  </Label>
                  <Textarea
                    value={commentaireResolution}
                    onChange={e => setCommentaireResolution(e.target.value)}
                    placeholder="Décrivez la correction apportée, les fichiers modifiés..."
                    rows={4}
                    className="bg-white border-slate-200 text-sm resize-none"
                  />
                </div>
                <Button
                  onClick={handleSignalerResolution}
                  disabled={!commentaireResolution.trim()}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Signaler la résolution
                </Button>
              </CardContent>
            </Card>
          )}

          {peutValiderCloture && (
            <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">Valider la clôture</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                {anomalie.commentaireResolution && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1.5">
                      Résolution signalée par le développeur
                    </p>
                    <p className="text-sm text-indigo-800">{anomalie.commentaireResolution}</p>
                    {anomalie.dateResolution && (
                      <p className="text-[10px] font-mono text-indigo-500 mt-2">
                        {new Date(anomalie.dateResolution).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                )}
                <p className="text-sm text-slate-500">
                  Vérifiez que l'anomalie a bien été corrigée avant de valider.
                </p>
                <Button
                  onClick={handleValiderCloture}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Valider et clôturer
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Personnes impliquées</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-emerald-700">
                    {testeur?.prenom?.[0]}{testeur?.nom?.[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Testeur</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{testeur?.prenom} {testeur?.nom}</p>
                  <p className="text-xs text-slate-400 truncate">{testeur?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-amber-700">
                    {developpeur?.prenom?.[0]}{developpeur?.nom?.[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Développeur</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{developpeur?.prenom} {developpeur?.nom}</p>
                  <p className="text-xs text-slate-400 truncate">{developpeur?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Dates</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400">Création</p>
                  <p className="text-sm font-semibold text-slate-700 font-mono">
                    {new Date(anomalie.dateCreation).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {new Date(anomalie.dateCreation).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>
              {anomalie.dateResolution && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400">Résolution</p>
                    <p className="text-sm font-semibold text-slate-700 font-mono">
                      {new Date(anomalie.dateResolution).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {new Date(anomalie.dateResolution).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
              {anomalie.dateValidation && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-400">Clôture</p>
                    <p className="text-sm font-semibold text-slate-700 font-mono">
                      {new Date(anomalie.dateValidation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Historique ({historique.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {historique.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Aucune action enregistrée</p>
              ) : (
                <div className="space-y-3">
                  {historique.map((action, idx) => {
                    const auteur = users.find(u => u.id === action.userId);
                    return (
                      <div key={action.id} className="relative pl-5">
                        {idx < historique.length - 1 && (
                          <div className="absolute left-[7px] top-4 bottom-0 w-px bg-slate-200" />
                        )}
                        <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-indigo-400 shadow-sm" />
                        <p className="text-sm font-semibold text-slate-800">{action.action}</p>
                        {action.commentaire && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{action.commentaire}</p>
                        )}
                        <p className="text-[10px] font-mono text-slate-400 mt-1">
                          {auteur?.prenom} {auteur?.nom} · {new Date(action.date).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
