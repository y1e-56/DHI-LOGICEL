import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Plus, TestTube, AlertTriangle, CheckCircle2, Clock, User, Play, Flag, X, Users } from 'lucide-react';
import { Fonctionnalite, Priorite, StatutFonctionnalite } from '../types';

export function CampagneDetailPage() {
  const { campagneId } = useParams<{ campagneId: string }>();
  const { currentUser, users } = useAuth();
  const {
    campagnes,
    projets,
    fonctionnalites,
    anomalies,
    ajouterFonctionnalite,
    modifierFonctionnalite,
    modifierCampagne,
    ajouterNotification
  } = useData();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'admin';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [ajoutMembreDialogOpen, setAjoutMembreDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('fonctionnalites');
  const [filtreStatut, setFiltreStatut] = useState<StatutFonctionnalite | 'tous'>('tous');
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    module: '',
    testeurAssigneId: '',
    priorite: 'moyenne' as Priorite
  });
  const [assignData, setAssignData] = useState({
    fonctionnaliteId: '',
    testeurAssigneId: '',
    priorite: 'moyenne' as Priorite
  });
  const [nouveauMembre, setNouveauMembre] = useState({
    userId: '',
    type: 'testeur' as 'testeur' | 'developpeur'
  });

  const campagne = campagnes.find((c: any) => c.id === campagneId);
  const projet = projets.find((p: any) => p.id === campagne?.projetId);

  const handleChangerStatutCampagne = (statut: 'en_cours' | 'terminee') => {
    if (!campagneId) return;
  
    modifierCampagne(campagneId, { statut });
  };

  const handleAjouterMembre = async () => {
    if (!campagneId || !nouveauMembre.userId || !campagne) return;

    try {
      if (nouveauMembre.type === 'testeur') {
        const updatedTesteurs = [...campagne.equipeTesteurs, nouveauMembre.userId];
        await modifierCampagne(campagneId, { equipeTesteurs: updatedTesteurs });
      } else {
        const updatedDeveloppeurs = [...campagne.equipeDeveloppeurs, nouveauMembre.userId];
        await modifierCampagne(campagneId, { equipeDeveloppeurs: updatedDeveloppeurs });
      }

      setNouveauMembre({ userId: '', type: 'testeur' });
      setAjoutMembreDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
    }
  };

  const handleRetirerMembre = async (userId: string, type: 'testeur' | 'developpeur') => {
    if (!campagneId || !campagne) return;

    try {
      if (type === 'testeur') {
        const updatedTesteurs = campagne.equipeTesteurs.filter((id: string) => id !== userId);
        await modifierCampagne(campagneId, { equipeTesteurs: updatedTesteurs });
      } else {
        const updatedDeveloppeurs = campagne.equipeDeveloppeurs.filter((id: string) => id !== userId);
        await modifierCampagne(campagneId, { equipeDeveloppeurs: updatedDeveloppeurs });
      }
    } catch (error) {
      console.error('Erreur lors du retrait du membre:', error);
    }
  };

  const handleOpenAssignDialog = (fonctionnaliteId: string) => {
    setAssignData({
      fonctionnaliteId,
      testeurAssigneId: '',
      priorite: 'moyenne'
    });
    setAssignDialogOpen(true);
  };

  const handleAssignerFonctionnalite = async () => {
    if (!assignData.fonctionnaliteId || !assignData.testeurAssigneId) return;

    try {
      await modifierFonctionnalite(assignData.fonctionnaliteId, {
        testeurAssigneId: assignData.testeurAssigneId,
        priorite: assignData.priorite,
        dateAssignation: new Date().toISOString()
      });

      // Notifier le testeur
      ajouterNotification({
        id: `n${Date.now()}`,
        userId: assignData.testeurAssigneId,
        type: 'assignation',
        titre: 'Nouvelle tâche assignée',
        message: 'Une fonctionnalité vous a été assignée',
        lue: false,
        dateCreation: new Date().toISOString(),
        lienUrl: '/testeur/taches'
      });

      setAssignDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    }
  };
  const fonctionnalitesCampagne = fonctionnalites.filter((f: any) => f.campagneId === campagneId);
  const anomaliesCampagne = anomalies.filter((a: any) => a.campagneId === campagneId);

  if (!campagne || !currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Campagne introuvable</p>
      </div>
    );
  }

  // Vérifier les droits d'accès
  const canEdit = currentUser.role === 'chef_testeur' && campagne.chefTesteurId === currentUser.id;
  const canView = canEdit || currentUser.role === 'admin';

  if (!canView) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Accès non autorisé</p>
      </div>
    );
  }

  // Filtrer les testeurs et développeurs de l'équipe
  const testeurs = users.filter((u: any) => campagne.equipeTesteurs.includes(u.id));
  const developpeurs = users.filter((u: any) => campagne.equipeDeveloppeurs.includes(u.id));

  const fonctionnalitesFiltrees = fonctionnalitesCampagne.filter((f: any) => {
    if (filtreStatut === 'tous') return true;
    return f.statut === filtreStatut;
  });

  const stats = {
    total: fonctionnalitesCampagne.length,
    nonTestees: fonctionnalitesCampagne.filter((f: any) => f.statut === 'non_testee').length,
    conformes: fonctionnalitesCampagne.filter((f: any) => f.statut === 'conforme').length,
    anomalies: fonctionnalitesCampagne.filter((f: any) => f.statut === 'anomalie').length,
    anomaliesOuvertes: anomaliesCampagne.filter((a: any) => a.statut !== 'cloturee').length
  };

  const handleOpenDialog = () => {
    setFormData({
      nom: '',
      description: '',
      module: '',
      testeurAssigneId: '',
      priorite: 'moyenne'
    });
    setDialogOpen(true);
  };

  const handleAjouterFonctionnalite = async () => {
    if (!formData.nom || !formData.testeurAssigneId || !campagneId) return;

    try {
      const nouvelleFonctionnalite: Fonctionnalite = {
        id: `f${Date.now()}`,
        campagneId,
        nom: formData.nom,
        description: formData.description,
        module: formData.module,
        testeurAssigneId: formData.testeurAssigneId,
        statut: 'non_testee',
        priorite: formData.priorite,
        dateAssignation: new Date().toISOString()
      };

      await ajouterFonctionnalite(nouvelleFonctionnalite);

      // Notifier le testeur
      ajouterNotification({
        id: `n${Date.now()}`,
        userId: formData.testeurAssigneId,
        type: 'assignation',
        titre: 'Nouvelle tâche assignée',
        message: `La fonctionnalité "${formData.nom}" vous a été assignée`,
        lue: false,
        dateCreation: new Date().toISOString(),
        lienUrl: '/testeur/taches'
      });

      setDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la fonctionnalité:', error);
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

  const peutGerer = canEdit;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/campagnes')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold mb-1">{campagne.nom}</h2>
          <p className="text-gray-500">{projet?.nom}</p>
        </div>
        {peutGerer && campagne.statut === 'en_preparation' && (
          <Button
            variant="outline"
            className="gap-2 border-sky-300 text-sky-700 hover:bg-sky-50"
            onClick={() => handleChangerStatutCampagne('en_cours')}
          >
            <Play className="w-4 h-4" />
            Démarrer
          </Button>
        )}
        {peutGerer && campagne.statut === 'en_cours' && (
          <Button
            variant="outline"
            className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={() => handleChangerStatutCampagne('terminee')}
          >
            <Flag className="w-4 h-4" />
            Terminer
          </Button>
        )}
        {peutGerer && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Assigner une tâche
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner une fonctionnalité</DialogTitle>
                <DialogDescription>
                  Créer et assigner une nouvelle tâche de test
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de la fonctionnalité *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Connexion utilisateur"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="module">Module</Label>
                  <Input
                    id="module"
                    value={formData.module}
                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                    placeholder="Ex: Authentification"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de la fonctionnalité à tester..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priorite">Priorité *</Label>
                  <Select value={formData.priorite} onValueChange={(value: Priorite) => setFormData({ ...formData, priorite: value })}>
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
                  <Label htmlFor="testeur">Assigner à *</Label>
                  <Select value={formData.testeurAssigneId} onValueChange={(value) => setFormData({ ...formData, testeurAssigneId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un testeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {testeurs.map(testeur => (
                        <SelectItem key={testeur.id} value={testeur.id}>
                          {testeur.prenom} {testeur.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAjouterFonctionnalite}>
                  Assigner
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Non testées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.nonTestees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Conformes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.conformes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Anomalies détectées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.anomalies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Anomalies ouvertes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.anomaliesOuvertes}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fonctionnalites">Fonctionnalités</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="equipe">Équipe</TabsTrigger>
        </TabsList>

        <TabsContent value="fonctionnalites" className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold">Fonctionnalités</h3>
            <Select value={filtreStatut} onValueChange={(value: StatutFonctionnalite | 'tous') => setFiltreStatut(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes</SelectItem>
                <SelectItem value="non_testee">Non testées</SelectItem>
                <SelectItem value="conforme">Conformes</SelectItem>
                <SelectItem value="anomalie">Anomalies</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {fonctionnalitesFiltrees.map((fonctionnalite: any) => {
              const testeur = users.find((u: any) => u.id === fonctionnalite.testeurAssigneId);
              const statutBadge = getStatutBadge(fonctionnalite.statut);

              return (
                <Card key={fonctionnalite.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium">{fonctionnalite.nom}</h4>
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
                          <span><strong>Testeur:</strong> {testeur?.prenom} {testeur?.nom || 'Non assigné'}</span>
                        </div>
                      </div>
                      {peutGerer && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAssignDialog(fonctionnalite.id)}
                        >
                          Assigner
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {fonctionnalitesFiltrees.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <TestTube className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune fonctionnalité</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <div className="space-y-3">
            {anomaliesCampagne.map((anomalie: any) => {
              const fonctionnalite = fonctionnalites.find((f: any) => f.id === anomalie.fonctionnaliteId);
              const testeur = users.find((u: any) => u.id === anomalie.testeurId);
              const developpeur = users.find((u: any) => u.id === anomalie.developpeurId);
              
              const statutBadge: Record<string, string> = {
                nouvelle: 'bg-red-100 text-red-700',
                en_cours: 'bg-blue-100 text-blue-700',
                resolution_signalee: 'bg-green-100 text-green-700',
                cloturee: 'bg-gray-100 text-gray-700'
              };
              const badgeClass = statutBadge[anomalie.statut] || 'bg-gray-100 text-gray-700';

              return (
                <Card 
                  key={anomalie.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/anomalies/${anomalie.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium">{anomalie.titre}</h4>
                          <Badge className={badgeClass}>
                            {anomalie.statut.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPrioriteBadge(anomalie.priorite)}>
                            {anomalie.priorite}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{anomalie.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span><strong>Fonctionnalité:</strong> {fonctionnalite?.nom}</span>
                          <span><strong>Testeur:</strong> {testeur?.prenom} {testeur?.nom}</span>
                          <span><strong>Développeur:</strong> {developpeur?.prenom} {developpeur?.nom}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {anomaliesCampagne.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune anomalie</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="equipe" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Équipe de testeurs</CardTitle>
                {peutGerer && (
                  <Button size="sm" variant="outline" onClick={() => setAjoutMembreDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testeurs.map((testeur: any) => (
                    <div key={testeur.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{testeur.prenom} {testeur.nom}</p>
                          <p className="text-xs text-gray-500">{testeur.email}</p>
                        </div>
                      </div>
                      {peutGerer && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRetirerMembre(testeur.id, 'testeur')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {testeurs.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Aucun testeur</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Équipe de développeurs</CardTitle>
                {peutGerer && (
                  <Button size="sm" variant="outline" onClick={() => setAjoutMembreDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {developpeurs.map((dev: any) => (
                    <div key={dev.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{dev.prenom} {dev.nom}</p>
                          <p className="text-xs text-gray-500">{dev.email}</p>
                        </div>
                      </div>
                      {peutGerer && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRetirerMembre(dev.id, 'developpeur')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {developpeurs.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Aucun développeur</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog d'assignation de fonctionnalité existante */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner une fonctionnalité</DialogTitle>
            <DialogDescription>
              Assigner une fonctionnalité existante à un testeur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="testeur">Assigner à *</Label>
              <Select value={assignData.testeurAssigneId} onValueChange={(value) => setAssignData({ ...assignData, testeurAssigneId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un testeur" />
                </SelectTrigger>
                <SelectContent>
                  {testeurs.map((testeur: any) => (
                    <SelectItem key={testeur.id} value={testeur.id}>
                      {testeur.prenom} {testeur.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priorite">Priorité *</Label>
              <Select value={assignData.priorite} onValueChange={(value: Priorite) => setAssignData({ ...assignData, priorite: value })}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAssignerFonctionnalite}>
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'ajout de membre */}
      <Dialog open={ajoutMembreDialogOpen} onOpenChange={setAjoutMembreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>
              Ajouter un testeur ou un développeur à l'équipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de membre *</Label>
              <Select value={nouveauMembre.type} onValueChange={(value: 'testeur' | 'developpeur') => setNouveauMembre({ ...nouveauMembre, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="testeur">Testeur</SelectItem>
                  <SelectItem value="developpeur">Développeur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Membre *</Label>
              <Select value={nouveauMembre.userId} onValueChange={(value) => setNouveauMembre({ ...nouveauMembre, userId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {(nouveauMembre.type === 'testeur' ? users.filter((u: any) => u.role === 'testeur') : users.filter((u: any) => u.role === 'developpeur'))
                    .filter((u: any) => !(nouveauMembre.type === 'testeur' ? campagne.equipeTesteurs : campagne.equipeDeveloppeurs).includes(u.id))
                    .map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.prenom} {user.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAjoutMembreDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAjouterMembre}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
