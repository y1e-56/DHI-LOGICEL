import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles, UserCheck } from 'lucide-react';
import { StatutFonctionnalite, Anomalie } from '../types';
import { suggerePriorite, suggereDeveloppeur } from '../services/aiService';

export function TesteurTachesPage() {
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
  const [titreAnomalie, setTitreAnomalie] = useState('');
  const [developpeurSelectionne, setDeveloppeurSelectionne] = useState('');
  const [priorite, setPriorite] = useState<'basse' | 'moyenne' | 'haute' | 'critique'>('moyenne');
  
  // États pour les suggestions IA
  const [suggestionPriorite, setSuggestionPriorite] = useState<'basse' | 'moyenne' | 'haute' | 'critique' | null>(null);
  const [suggestionDeveloppeur, setSuggestionDeveloppeur] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  if (!currentUser || (currentUser.role !== 'testeur' && currentUser.role !== 'admin')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Accès réservé aux testeurs et administrateurs</p>
      </div>
    );
  }

  // Pour l'admin, voir toutes les tâches. Pour le testeur, voir seulement les siennes
  const mesTaches = isAdmin
    ? fonctionnalites
    : fonctionnalites.filter(f => f.testeurAssigneId === currentUser.id);
  const developpeurs = users.filter(u => u.role === 'developpeur');

  // Effet pour suggérer la priorité quand le titre ou la description changent
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

  // Effet pour suggérer le développeur quand le titre ou la description changent
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
    setFonctionnaliteSelectionnee(fonctionnaliteId);
    setNouveauStatut(statut);
    setDescriptionAnomalie('');
    setTitreAnomalie('');
    setDeveloppeurSelectionne('');
    setPriorite('moyenne');
    setSuggestionPriorite(null);
    setSuggestionDeveloppeur(null);
    setShowSuggestions(false);
    setDialogStatutOpen(true);
  };

  const handleChangerStatut = () => {
    if (!fonctionnaliteSelectionnee) return;

    const fonctionnalite = fonctionnalites.find(f => f.id === fonctionnaliteSelectionnee);
    if (!fonctionnalite) return;

    if (nouveauStatut === 'anomalie') {
      if (!titreAnomalie || !descriptionAnomalie || !developpeurSelectionne) {
        return;
      }

      // Créer l'anomalie
      const nouvelleAnomalie: Anomalie = {
        id: `a${Date.now()}`,
        fonctionnaliteId: fonctionnalite.id,
        campagneId: fonctionnalite.campagneId,
        titre: titreAnomalie,
        description: descriptionAnomalie,
        testeurId: currentUser.id,
        developpeurId: developpeurSelectionne,
        statut: 'nouvelle',
        priorite,
        dateCreation: new Date().toISOString()
      };

      ajouterAnomalie(nouvelleAnomalie);

      // Notifier le développeur
      ajouterNotification({
        id: `n${Date.now()}`,
        userId: developpeurSelectionne,
        type: 'anomalie',
        titre: 'Nouvelle anomalie',
        message: `Une anomalie "${titreAnomalie}" vous a été notifiée`,
        lue: false,
        dateCreation: new Date().toISOString(),
        lienUrl: `/anomalies/${nouvelleAnomalie.id}`
      });
    }

    changerStatutFonctionnalite(fonctionnalite.id, nouveauStatut, currentUser.id);
    setDialogStatutOpen(false);
  };

  const getStatutIcon = (statut: StatutFonctionnalite) => {
    switch (statut) {
      case 'conforme':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'anomalie':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatutBadge = (statut: StatutFonctionnalite) => {
    const config = {
      non_testee: { label: 'Non testée', className: 'bg-gray-100 text-gray-700' },
      conforme: { label: 'Conforme', className: 'bg-green-100 text-green-700' },
      anomalie: { label: 'Anomalie', className: 'bg-red-100 text-red-700' }
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Mes tâches de test</h2>
        <p className="text-gray-500">Fonctionnalités qui me sont assignées</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mesTaches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Non testées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {mesTaches.filter(t => t.statut === 'non_testee').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Conformes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mesTaches.filter(t => t.statut === 'conforme').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mesTaches.filter(t => t.statut === 'anomalie').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {mesTaches.map((fonctionnalite) => {
          const campagne = campagnes.find(c => c.id === fonctionnalite.campagneId);
          const projet = projets.find(p => p.id === campagne?.projetId);
          const statutBadge = getStatutBadge(fonctionnalite.statut);

          return (
            <Card key={fonctionnalite.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      {getStatutIcon(fonctionnalite.statut)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{fonctionnalite.nom}</h3>
                          <Badge className={statutBadge.className}>
                            {statutBadge.label}
                          </Badge>
                          <Badge className={getPrioriteBadge(fonctionnalite.priorite)}>
                            {fonctionnalite.priorite}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{fonctionnalite.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span><strong>Module:</strong> {fonctionnalite.module}</span>
                          <span><strong>Campagne:</strong> {campagne?.nom}</span>
                          <span><strong>Projet:</strong> {projet?.nom}</span>
                        </div>
                        {fonctionnalite.dateAssignation && (
                          <p className="text-xs text-gray-500 mt-1">
                            Assignée le {new Date(fonctionnalite.dateAssignation).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleOpenDialogStatut(fonctionnalite.id, 'conforme')}
                      disabled={fonctionnalite.statut === 'conforme' || isAdmin}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Conforme
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleOpenDialogStatut(fonctionnalite.id, 'anomalie')}
                      disabled={isAdmin}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Anomalie
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {mesTaches.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune tâche assignée</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogStatutOpen} onOpenChange={setDialogStatutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {nouveauStatut === 'conforme' ? 'Marquer comme conforme' : 'Signaler une anomalie'}
            </DialogTitle>
            <DialogDescription>
              {nouveauStatut === 'conforme'
                ? 'Confirmez que cette fonctionnalité est conforme aux spécifications'
                : 'Décrivez l\'anomalie détectée et notifiez un développeur'}
            </DialogDescription>
          </DialogHeader>
          
          {nouveauStatut === 'anomalie' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre de l'anomalie *</Label>
                <Input
                  id="titre"
                  value={titreAnomalie}
                  onChange={(e) => setTitreAnomalie(e.target.value)}
                  placeholder="Ex: Email de réinitialisation non reçu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priorite">Priorité *</Label>
                <Select value={priorite} onValueChange={(value: any) => setPriorite(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critique">Critique</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="basse">Basse</SelectItem>
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
                    IA suggère : {suggestionPriorite}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description détaillée *</Label>
                <Textarea
                  id="description"
                  value={descriptionAnomalie}
                  onChange={(e) => setDescriptionAnomalie(e.target.value)}
                  placeholder="Décrivez l'anomalie en détail : étapes de reproduction, comportement attendu vs réel..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="developpeur">Notifier le développeur *</Label>
                <Select value={developpeurSelectionne} onValueChange={setDeveloppeurSelectionne}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un développeur" />
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
                    IA suggère : {developpeurs.find(d => d.id === suggestionDeveloppeur)?.prenom} {developpeurs.find(d => d.id === suggestionDeveloppeur)?.nom}
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogStatutOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleChangerStatut}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}