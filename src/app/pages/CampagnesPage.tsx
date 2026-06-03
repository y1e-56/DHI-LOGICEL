import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, TestTube, Users, Calendar } from 'lucide-react';
import { Campagne } from '../types';
import { campaignService } from '../services/campaignService';
import { toast } from 'sonner';

export function CampagnesPage() {
  const { currentUser, users } = useAuth();
  const { projets, campagnes, ajouterCampagne, modifierCampagne } = useData();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampagne, setEditingCampagne] = useState<Campagne | null>(null);

  const [formData, setFormData] = useState({
    nom: '',
    projetId: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    equipeTesteurs: [] as string[],
    equipeDeveloppeurs: [] as string[]
  });
  const [errors, setErrors] = useState({
    nom: '',
    projetId: '',
    dateDebut: '',
    dateFin: ''
  });

  const isAdmin = currentUser?.role === 'admin';
  const canEdit = currentUser?.role === 'chef_testeur';

  if (!currentUser || (currentUser.role !== 'chef_testeur' && currentUser.role !== 'admin')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Accès réservé aux chefs testeurs et administrateurs</p>
      </div>
    );
  }

  const testeurs = users.filter(u => u.role === 'testeur');
  const developpeurs = users.filter(u => u.role === 'developpeur');
  const projetsActifs = projets.filter(p => p.statut === 'actif');

  const handleOpenDialog = (campagne?: Campagne) => {
    if (campagne) {
      setEditingCampagne(campagne);
      setFormData({
        nom: campagne.nom,
        projetId: campagne.projetId,
        description: campagne.description,
        dateDebut: campagne.dateDebut,
        dateFin: campagne.dateFin,
        equipeTesteurs: campagne.equipeTesteurs,
        equipeDeveloppeurs: campagne.equipeDeveloppeurs
      });
    } else {
      setEditingCampagne(null);
      setFormData({
        nom: '',
        projetId: '',
        description: '',
        dateDebut: '',
        dateFin: '',
        equipeTesteurs: [],
        equipeDeveloppeurs: []
      });
    }
    setErrors({ nom: '', projetId: '', dateDebut: '', dateFin: '' });
    setDialogOpen(true);
  };

  const validateForm = () => {
    const newErrors = {
      nom: '',
      projetId: '',
      dateDebut: '',
      dateFin: ''
    };

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom de la campagne est requis';
    }
    if (!formData.projetId) {
      newErrors.projetId = 'Le projet est requis';
    }
    if (!formData.dateDebut) {
      newErrors.dateDebut = 'La date de début est requise';
    }
    if (!formData.dateFin) {
      newErrors.dateFin = 'La date de fin est requise';
    } else if (formData.dateDebut && formData.dateFin < formData.dateDebut) {
      newErrors.dateFin = 'La date de fin doit être après la date de début';
    }

    setErrors(newErrors);
    return !newErrors.nom && !newErrors.projetId && !newErrors.dateDebut && !newErrors.dateFin;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (editingCampagne) {
        await campaignService.update(editingCampagne.id, formData);
        modifierCampagne(editingCampagne.id, formData);
        toast.success('Campagne modifiée avec succès');
      } else {
        const nouvelleCampagne = await campaignService.create({
          ...formData,
          chefTesteurId: currentUser.id,
          statut: 'en_preparation'
        });
        ajouterCampagne(nouvelleCampagne);
        toast.success('Campagne créée avec succès');
      }

      setDialogOpen(false);
      setErrors({ nom: '', projetId: '', dateDebut: '', dateFin: '' });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la sauvegarde de la campagne');
    }
  };

  const toggleMembre = (userId: string, type: 'testeur' | 'developpeur') => {
    if (type === 'testeur') {
      setFormData(prev => ({
        ...prev,
        equipeTesteurs: prev.equipeTesteurs.includes(userId)
          ? prev.equipeTesteurs.filter(id => id !== userId)
          : [...prev.equipeTesteurs, userId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        equipeDeveloppeurs: prev.equipeDeveloppeurs.includes(userId)
          ? prev.equipeDeveloppeurs.filter(id => id !== userId)
          : [...prev.equipeDeveloppeurs, userId]
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Gestion des campagnes</h2>
          <p className="text-gray-500">Créer et gérer les campagnes de tests</p>
        </div>
        {!isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle campagne
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampagne ? 'Modifier la campagne' : 'Créer une nouvelle campagne'}
              </DialogTitle>
              <DialogDescription>
                Définissez les paramètres de la campagne de tests
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de la campagne *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => {
                    setFormData({ ...formData, nom: e.target.value });
                    if (errors.nom) setErrors({ ...errors, nom: '' });
                  }}
                  placeholder="Ex: Sprint 1 - Authentification"
                  className={errors.nom ? 'border-red-500 focus:border-red-500' : ''}
                />
                {errors.nom && <p className="text-sm text-red-500">{errors.nom}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="projetId">Projet *</Label>
                <Select value={formData.projetId} onValueChange={(value) => {
                  setFormData({ ...formData, projetId: value });
                  if (errors.projetId) setErrors({ ...errors, projetId: '' });
                }}>
                  <SelectTrigger className={errors.projetId ? 'border-red-500 focus:border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projetsActifs.map(projet => (
                      <SelectItem key={projet.id} value={projet.id}>
                        {projet.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.projetId && <p className="text-sm text-red-500">{errors.projetId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la campagne..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date de début *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="dateDebut"
                      type="date"
                      value={formData.dateDebut}
                      onChange={(e) => {
                        setFormData({ ...formData, dateDebut: e.target.value });
                        if (errors.dateDebut) setErrors({ ...errors, dateDebut: '' });
                      }}
                      className={`pl-10 ${errors.dateDebut ? 'border-red-500 focus:border-red-500' : 'border-indigo-200 focus:border-indigo-400'}`}
                    />
                  </div>
                  {errors.dateDebut && <p className="text-sm text-red-500">{errors.dateDebut}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFin">Date de fin *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="dateFin"
                      type="date"
                      value={formData.dateFin}
                      onChange={(e) => {
                        setFormData({ ...formData, dateFin: e.target.value });
                        if (errors.dateFin) setErrors({ ...errors, dateFin: '' });
                      }}
                      className={`pl-10 ${errors.dateFin ? 'border-red-500 focus:border-red-500' : 'border-indigo-200 focus:border-indigo-400'}`}
                    />
                  </div>
                  {errors.dateFin && <p className="text-sm text-red-500">{errors.dateFin}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Équipe de testeurs</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {testeurs.map(testeur => (
                    <div key={testeur.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`testeur-${testeur.id}`}
                        checked={formData.equipeTesteurs.includes(testeur.id)}
                        onCheckedChange={() => toggleMembre(testeur.id, 'testeur')}
                      />
                      <label
                        htmlFor={`testeur-${testeur.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {testeur.prenom} {testeur.nom}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Équipe de développeurs</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {developpeurs.map(dev => (
                    <div key={dev.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dev-${dev.id}`}
                        checked={formData.equipeDeveloppeurs.includes(dev.id)}
                        onCheckedChange={() => toggleMembre(dev.id, 'developpeur')}
                      />
                      <label
                        htmlFor={`dev-${dev.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {dev.prenom} {dev.nom}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit}>
                {editingCampagne ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campagnes.map((campagne) => {
          const projet = projets.find(p => p.id === campagne.projetId);
          const statutColors: { [key: string]: string } = {
            en_preparation: 'bg-yellow-100 text-yellow-700',
            en_cours: 'bg-blue-100 text-blue-700',
            terminee: 'bg-green-100 text-green-700'
          };
          const statutLabels: { [key: string]: string } = {
            en_preparation: 'En préparation',
            en_cours: 'En cours',
            terminee: 'Terminée'
          };

          return (
            <Card key={campagne.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/campagnes/${campagne.id}`)}>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <TestTube className="w-5 h-5 text-blue-600" />
                  <Badge className={statutColors[campagne.statut]}>
                    {statutLabels[campagne.statut]}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{campagne.nom}</CardTitle>
                <CardDescription>{projet?.nom}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 min-h-[2.5rem]">
                  {campagne.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{campagne.equipeTesteurs.length} testeurs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{campagne.equipeDeveloppeurs.length} devs</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(campagne.dateDebut).toLocaleDateString('fr-FR')} - {new Date(campagne.dateFin).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {campagnes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TestTube className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune campagne créée</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
