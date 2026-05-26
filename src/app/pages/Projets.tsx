import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, Archive, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Projets() {
  const { projets, ajouterProjet, modifierProjet, archiverProjet } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProjet, setEditingProjet] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    dateDebut: '',
    dateFin: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProjet) {
      modifierProjet(editingProjet, formData);
    } else {
      ajouterProjet({ ...formData, statut: 'actif' });
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      dateDebut: '',
      dateFin: ''
    });
    setEditingProjet(null);
  };

  const handleEdit = (projet: any) => {
    setFormData({
      nom: projet.nom,
      description: projet.description,
      dateDebut: projet.dateDebut,
      dateFin: projet.dateFin
    });
    setEditingProjet(projet.id);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const projetsActifs = projets.filter(p => p.statut === 'actif');
  const projetsArchives = projets.filter(p => p.statut === 'archivé');

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des projets</h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez vos projets de test
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Nouveau projet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingProjet ? 'Modifier le projet' : 'Nouveau projet'}
                </DialogTitle>
                <DialogDescription>
                  Renseignez les informations du projet
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom du projet *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Application Mobile Banking"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du projet"
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingProjet ? 'Enregistrer' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Projets actifs ({projetsActifs.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {projetsActifs.map((projet) => (
              <Card key={projet.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{projet.nom}</CardTitle>
                      <CardDescription className="mt-2">
                        {projet.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      Actif
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      <span>
                        {format(new Date(projet.dateDebut), 'dd MMM yyyy', { locale: fr })} - {format(new Date(projet.dateFin), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(projet)}
                      >
                        <Edit className="size-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => archiverProjet(projet.id)}
                      >
                        <Archive className="size-4 mr-2" />
                        Archiver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {projetsActifs.length === 0 && (
              <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Aucun projet actif</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Créez votre premier projet pour commencer
                </p>
              </div>
            )}
          </div>
        </div>

        {projetsArchives.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Projets archivés ({projetsArchives.length})</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {projetsArchives.map((projet) => (
                <Card key={projet.id} className="opacity-60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{projet.nom}</CardTitle>
                        <CardDescription className="mt-2">
                          {projet.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        Archivé
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      <span>
                        {format(new Date(projet.dateDebut), 'dd MMM yyyy', { locale: fr })} - {format(new Date(projet.dateFin), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
