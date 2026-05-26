import React, { useState } from 'react';
import { Link } from 'react-router';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Edit, FlaskConical, Users, Calendar, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Utilisateurs de démonstration pour assignation
const DEMO_USERS = [
  { id: '3', nom: 'Sophie Testeur', role: 'testeur' },
  { id: '5', nom: 'Julie Test', role: 'testeur' },
  { id: '6', nom: 'Marc Qualité', role: 'testeur' },
  { id: '4', nom: 'Thomas Dev', role: 'developpeur' },
  { id: '7', nom: 'Alex Code', role: 'developpeur' }
];

export function Campagnes() {
  const { projets, campagnes, fonctionnalites, anomalies, ajouterCampagne, modifierCampagne } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampagne, setEditingCampagne] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    projetId: '',
    nom: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    testeurs: [] as string[],
    developpeurs: [] as string[],
    statut: 'planifiée' as 'planifiée' | 'en_cours' | 'terminée'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCampagne) {
      modifierCampagne(editingCampagne, formData);
    } else {
      ajouterCampagne(formData);
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      projetId: '',
      nom: '',
      description: '',
      dateDebut: '',
      dateFin: '',
      testeurs: [],
      developpeurs: [],
      statut: 'planifiée'
    });
    setEditingCampagne(null);
  };

  const handleEdit = (campagne: any) => {
    setFormData({
      projetId: campagne.projetId,
      nom: campagne.nom,
      description: campagne.description,
      dateDebut: campagne.dateDebut,
      dateFin: campagne.dateFin,
      testeurs: campagne.testeurs,
      developpeurs: campagne.developpeurs,
      statut: campagne.statut
    });
    setEditingCampagne(campagne.id);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const toggleUser = (userId: string, type: 'testeurs' | 'developpeurs') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].includes(userId)
        ? prev[type].filter(id => id !== userId)
        : [...prev[type], userId]
    }));
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'planifiée':
        return <Badge variant="outline">Planifiée</Badge>;
      case 'en_cours':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">En cours</Badge>;
      case 'terminée':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Terminée</Badge>;
      default:
        return null;
    }
  };

  const projetsActifs = projets.filter(p => p.statut === 'actif');

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des campagnes</h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez vos campagnes de test
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Nouvelle campagne
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCampagne ? 'Modifier la campagne' : 'Nouvelle campagne'}
                </DialogTitle>
                <DialogDescription>
                  Configuration de la campagne de test
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="projetId">Projet *</Label>
                  <Select
                    value={formData.projetId}
                    onValueChange={(value) => setFormData({ ...formData, projetId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projetsActifs.map((projet) => (
                        <SelectItem key={projet.id} value={projet.id}>
                          {projet.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de la campagne *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Test Sprint 3 - Paiements"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de la campagne"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateDebut">Date de début *</Label>
                    <Input
                      id="dateDebut"
                      type="date"
                      value={formData.dateDebut}
                      onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFin">Date de fin *</Label>
                    <Input
                      id="dateFin"
                      type="date"
                      value={formData.dateFin}
                      onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value: any) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planifiée">Planifiée</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="terminée">Terminée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Équipe testeurs</Label>
                  <div className="space-y-2 border rounded-lg p-3">
                    {DEMO_USERS.filter(u => u.role === 'testeur').map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`testeur-${user.id}`}
                          checked={formData.testeurs.includes(user.id)}
                          onCheckedChange={() => toggleUser(user.id, 'testeurs')}
                        />
                        <label
                          htmlFor={`testeur-${user.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {user.nom}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Équipe développeurs</Label>
                  <div className="space-y-2 border rounded-lg p-3">
                    {DEMO_USERS.filter(u => u.role === 'developpeur').map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dev-${user.id}`}
                          checked={formData.developpeurs.includes(user.id)}
                          onCheckedChange={() => toggleUser(user.id, 'developpeurs')}
                        />
                        <label
                          htmlFor={`dev-${user.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {user.nom}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingCampagne ? 'Enregistrer' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {campagnes.map((campagne) => {
          const projet = projets.find(p => p.id === campagne.projetId);
          const fonctionnalitesCampagne = fonctionnalites.filter(f => f.campagneId === campagne.id);
          const conformes = fonctionnalitesCampagne.filter(f => f.statut === 'conforme').length;
          const anomaliesCampagne = anomalies.filter(a => a.campagneId === campagne.id && a.statut !== 'cloturee');

          return (
            <Card key={campagne.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FlaskConical className="size-5 text-primary" />
                      <CardTitle>{campagne.nom}</CardTitle>
                    </div>
                    <CardDescription>
                      {projet?.nom} • {campagne.description}
                    </CardDescription>
                  </div>
                  {getStatutBadge(campagne.statut)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-4" />
                      <span>
                        {format(new Date(campagne.dateDebut), 'dd MMM', { locale: fr })} - {format(new Date(campagne.dateFin), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="size-4" />
                      <span>{campagne.testeurs.length} testeurs, {campagne.developpeurs.length} développeurs</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Progression tests</p>
                      <p className="text-2xl font-bold">
                        {fonctionnalitesCampagne.length > 0 
                          ? Math.round((conformes / fonctionnalitesCampagne.length) * 100)
                          : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conformes}/{fonctionnalitesCampagne.length} conformes
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Anomalies ouvertes</p>
                      <p className="text-2xl font-bold text-red-600">
                        {anomaliesCampagne.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        À résoudre
                      </p>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Fonctionnalités</p>
                      <p className="text-2xl font-bold">
                        {fonctionnalitesCampagne.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total à tester
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(campagne)}
                    >
                      <Edit className="size-4 mr-2" />
                      Modifier
                    </Button>
                    <Link to={`/campagnes/${campagne.id}`}>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="size-4 mr-2" />
                        Voir le tableau de bord
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {campagnes.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FlaskConical className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune campagne créée</p>
            <p className="text-sm text-muted-foreground mt-1">
              Créez votre première campagne pour commencer les tests
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
