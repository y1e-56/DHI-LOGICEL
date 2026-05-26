import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CheckCircle2, XCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_DEVELOPPEURS = [
  { id: '4', nom: 'Thomas Dev' },
  { id: '7', nom: 'Alex Code' }
];

export function MesTaches() {
  const { user } = useAuth();
  const { campagnes, fonctionnalites, modifierFonctionnalite, ajouterAnomalie, ajouterNotification } = useData();
  const [selectedTache, setSelectedTache] = useState<string | null>(null);
  const [anomalieDialog, setAnomalieDialog] = useState(false);
  const [anomalieData, setAnomalieData] = useState({
    titre: '',
    description: '',
    developpeurId: ''
  });

  const mesTaches = fonctionnalites.filter(f => f.assigneA === user?.id);
  const tachesEnAttente = mesTaches.filter(f => f.statut === 'en_attente');
  const tachesEnCours = mesTaches.filter(f => f.statut === 'en_cours');
  const tachesConformes = mesTaches.filter(f => f.statut === 'conforme');
  const tachesAnomalies = mesTaches.filter(f => f.statut === 'anomalie');

  const handleCommencerTest = (tacheId: string) => {
    modifierFonctionnalite(tacheId, { statut: 'en_cours' });
    toast.success('Test commencé');
  };

  const handleMarquerConforme = (tacheId: string) => {
    modifierFonctionnalite(tacheId, { statut: 'conforme' });
    toast.success('Fonctionnalité marquée comme conforme');
  };

  const handleSignalerAnomalie = (tacheId: string) => {
    setSelectedTache(tacheId);
    const tache = fonctionnalites.find(f => f.id === tacheId);
    setAnomalieData({
      titre: `Anomalie - ${tache?.nom}`,
      description: '',
      developpeurId: ''
    });
    setAnomalieDialog(true);
  };

  const handleSoumettreAnomalie = () => {
    if (!selectedTache || !user) return;

    const tache = fonctionnalites.find(f => f.id === selectedTache);
    if (!tache) return;

    // Créer l'anomalie
    ajouterAnomalie({
      fonctionnaliteId: selectedTache,
      campagneId: tache.campagneId,
      titre: anomalieData.titre,
      description: anomalieData.description,
      testeurId: user.id,
      developpeurId: anomalieData.developpeurId || null,
      statut: 'nouvelle'
    });

    // Modifier le statut de la fonctionnalité
    modifierFonctionnalite(selectedTache, { statut: 'anomalie' });

    // Notifier le développeur
    if (anomalieData.developpeurId) {
      const dev = DEMO_DEVELOPPEURS.find(d => d.id === anomalieData.developpeurId);
      ajouterNotification({
        userId: anomalieData.developpeurId,
        type: 'anomalie',
        titre: 'Nouvelle anomalie',
        message: `${user.nom} vous a notifié pour "${anomalieData.titre}"`,
        lue: false,
        dateCreation: new Date().toISOString(),
        lien: '/mes-anomalies'
      });
      toast.success(`Anomalie signalée à ${dev?.nom}`);
    } else {
      toast.success('Anomalie créée');
    }

    setAnomalieDialog(false);
    setSelectedTache(null);
    setAnomalieData({ titre: '', description: '', developpeurId: '' });
  };

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case 'critique':
        return <Badge variant="destructive">Critique</Badge>;
      case 'haute':
        return <Badge className="bg-orange-500">Haute</Badge>;
      case 'moyenne':
        return <Badge variant="outline">Moyenne</Badge>;
      case 'basse':
        return <Badge variant="secondary">Basse</Badge>;
      default:
        return null;
    }
  };

  const renderTache = (tache: any) => {
    const campagne = campagnes.find(c => c.id === tache.campagneId);
    
    return (
      <Card key={tache.id}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{tache.nom}</CardTitle>
              <CardDescription className="mt-2">
                {campagne?.nom}
              </CardDescription>
            </div>
            {getPrioriteBadge(tache.priorite)}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">{tache.description}</p>
          
          <div className="flex flex-wrap gap-2">
            {tache.statut === 'en_attente' && (
              <Button
                size="sm"
                onClick={() => handleCommencerTest(tache.id)}
              >
                <PlayCircle className="size-4 mr-2" />
                Commencer le test
              </Button>
            )}
            
            {tache.statut === 'en_cours' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                  onClick={() => handleMarquerConforme(tache.id)}
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  Marquer conforme
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                  onClick={() => handleSignalerAnomalie(tache.id)}
                >
                  <XCircle className="size-4 mr-2" />
                  Signaler anomalie
                </Button>
              </>
            )}

            {tache.statut === 'conforme' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <CheckCircle2 className="size-4 mr-1" />
                Conforme
              </Badge>
            )}

            {tache.statut === 'anomalie' && (
              <Badge variant="destructive">
                <AlertCircle className="size-4 mr-1" />
                Anomalie détectée
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes tâches</h1>
        <p className="text-muted-foreground mt-1">
          Fonctionnalités qui me sont assignées
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tachesEnAttente.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{tachesEnCours.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Conformes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{tachesConformes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{tachesAnomalies.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tâches en cours */}
      {tachesEnCours.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">En cours de test ({tachesEnCours.length})</h2>
          <div className="grid gap-4">
            {tachesEnCours.map(renderTache)}
          </div>
        </div>
      )}

      {/* Tâches en attente */}
      {tachesEnAttente.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">À tester ({tachesEnAttente.length})</h2>
          <div className="grid gap-4">
            {tachesEnAttente.map(renderTache)}
          </div>
        </div>
      )}

      {/* Tâches avec anomalies */}
      {tachesAnomalies.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Anomalies détectées ({tachesAnomalies.length})</h2>
          <div className="grid gap-4">
            {tachesAnomalies.map(renderTache)}
          </div>
        </div>
      )}

      {/* Tâches conformes */}
      {tachesConformes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Conformes ({tachesConformes.length})</h2>
          <div className="grid gap-4">
            {tachesConformes.map(renderTache)}
          </div>
        </div>
      )}

      {mesTaches.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune tâche assignée</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vous n'avez pas de fonctionnalités à tester pour le moment
          </p>
        </div>
      )}

      {/* Dialog pour signaler une anomalie */}
      <Dialog open={anomalieDialog} onOpenChange={setAnomalieDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler une anomalie</DialogTitle>
            <DialogDescription>
              Décrivez l'anomalie détectée et notifiez un développeur
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre de l'anomalie *</Label>
              <input
                id="titre"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={anomalieData.titre}
                onChange={(e) => setAnomalieData({ ...anomalieData, titre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description détaillée *</Label>
              <Textarea
                id="description"
                value={anomalieData.description}
                onChange={(e) => setAnomalieData({ ...anomalieData, description: e.target.value })}
                placeholder="Décrivez précisément l'anomalie, les étapes pour la reproduire, le résultat attendu et le résultat obtenu"
                rows={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="developpeur">Notifier un développeur *</Label>
              <Select
                value={anomalieData.developpeurId}
                onValueChange={(value) => setAnomalieData({ ...anomalieData, developpeurId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un développeur" />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_DEVELOPPEURS.map((dev) => (
                    <SelectItem key={dev.id} value={dev.id}>
                      {dev.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnomalieDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSoumettreAnomalie}
              disabled={!anomalieData.titre || !anomalieData.description || !anomalieData.developpeurId}
            >
              Signaler l'anomalie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
