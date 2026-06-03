import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Plus, ClipboardCheck, User } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_TESTEURS = [
  { id: '3', nom: 'Sophie Testeur' },
  { id: '5', nom: 'Julie Test' },
  { id: '6', nom: 'Marc Qualité' }
];

export function Assignation() {
  const { campagnes, fonctionnalites, ajouterFonctionnalite, modifierFonctionnalite, ajouterNotification } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    campagneId: '',
    nom: '',
    description: '',
    assigneA: '',
    priorite: 'moyenne' as 'basse' | 'moyenne' | 'haute' | 'critique'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    ajouterFonctionnalite({
      ...formData,
      assigneA: formData.assigneA || null,
      statut: 'en_attente'
    });

    // Notification automatique
    if (formData.assigneA) {
      const testeur = DEMO_TESTEURS.find(t => t.id === formData.assigneA);
      ajouterNotification({
        userId: formData.assigneA,
        type: 'assignation',
        titre: 'Nouvelle tâche assignée',
        message: `Une nouvelle fonctionnalité "${formData.nom}" vous a été assignée`,
        lue: false,
        dateCreation: new Date().toISOString(),
        lien: '/mes-taches'
      });
      toast.success(`Tâche assignée à ${testeur?.nom}`);
    } else {
      toast.success('Fonctionnalité créée');
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      campagneId: '',
      nom: '',
      description: '',
      assigneA: '',
      priorite: 'moyenne'
    });
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleAssigner = (fonctionnaliteId: string, testeurId: string) => {
    modifierFonctionnalite(fonctionnaliteId, { 
      assigneA: testeurId,
      statut: 'en_attente'
    });

    const testeur = DEMO_TESTEURS.find(t => t.id === testeurId);
    const fonc = fonctionnalites.find(f => f.id === fonctionnaliteId);
    
    ajouterNotification({
      userId: testeurId,
      type: 'assignation',
      titre: 'Nouvelle tâche assignée',
      message: `La fonctionnalité "${fonc?.nom}" vous a été assignée`,
      lue: false,
      dateCreation: new Date().toISOString(),
      lien: '/mes-taches'
    });

    toast.success(`Assigné à ${testeur?.nom}`);
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

  const campagnesActives = campagnes.filter(c => c.statut === 'en_cours' || c.statut === 'planifiée');

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignation des tâches</h1>
          <p className="text-muted-foreground mt-1">
            Créez et assignez des fonctionnalités aux testeurs
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Créer une tâche de test</DialogTitle>
                <DialogDescription>
                  Définissez la fonctionnalité et assignez-la à un testeur
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="campagneId">Campagne *</Label>
                  <Select
                    value={formData.campagneId}
                    onValueChange={(value) => setFormData({ ...formData, campagneId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une campagne" />
                    </SelectTrigger>
                    <SelectContent>
                      {campagnesActives.map((campagne) => (
                        <SelectItem key={campagne.id} value={campagne.id}>
                          {campagne.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de la fonctionnalité *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Virement SEPA"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description détaillée de la fonctionnalité à tester"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priorite">Priorité *</Label>
                  <Select
                    value={formData.priorite}
                    onValueChange={(value: any) => setFormData({ ...formData, priorite: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critique">Critique</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="moyenne">Moyenne</SelectItem>
                      <SelectItem value="basse">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigneA">Assigner à (optionnel)</Label>
                  <Select
                    value={formData.assigneA}
                    onValueChange={(value) => setFormData({ ...formData, assigneA: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un testeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMO_TESTEURS.map((testeur) => (
                        <SelectItem key={testeur.id} value={testeur.id}>
                          {testeur.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer et assigner</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {campagnesActives.map((campagne) => {
        const fonctionnalitesCampagne = fonctionnalites.filter(f => f.campagneId === campagne.id);
        
        if (fonctionnalitesCampagne.length === 0) return null;

        return (
          <Card key={campagne.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="size-5" />
                {campagne.nom}
              </CardTitle>
              <CardDescription>
                {fonctionnalitesCampagne.length} fonctionnalité(s) à tester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fonctionnalitesCampagne.map((fonc) => {
                  const testeur = DEMO_TESTEURS.find(t => t.id === fonc.assigneA);
                  
                  return (
                    <div key={fonc.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium">{fonc.nom}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {fonc.description}
                            </p>
                          </div>
                          {getPrioriteBadge(fonc.priorite)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          {fonc.assigneA ? (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="size-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Assigné à:</span>
                              <Badge variant="outline">{testeur?.nom}</Badge>
                            </div>
                          ) : (
                            <Badge variant="secondary">Non assigné</Badge>
                          )}
                          
                          <Select
                            value={fonc.assigneA || ''}
                            onValueChange={(value) => handleAssigner(fonc.id, value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Assigner à..." />
                            </SelectTrigger>
                            <SelectContent>
                              {DEMO_TESTEURS.map((testeur) => (
                                <SelectItem key={testeur.id} value={testeur.id}>
                                  {testeur.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {fonctionnalites.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <ClipboardCheck className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune tâche créée</p>
          <p className="text-sm text-muted-foreground mt-1">
            Créez votre première tâche pour commencer
          </p>
        </div>
      )}
    </div>
  );
}
