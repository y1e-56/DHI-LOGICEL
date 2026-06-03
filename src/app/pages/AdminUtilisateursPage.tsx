import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Users, ShieldOff, ShieldCheck, Plus, Search, UserCog, Trash2, RotateCcw, Archive } from 'lucide-react';
import { User, UserRole } from '../types';
import { toast } from 'sonner';

const roleConfig: Record<UserRole, { label: string; color: string; bg: string }> = {
  admin: { label: 'Administrateur', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200' },
  chef_testeur: { label: 'Chef Testeur', color: 'text-sky-700', bg: 'bg-sky-100 border-sky-200' },
  testeur: { label: 'Testeur', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200' },
  developpeur: { label: 'Développeur', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200' },
};

const roleAccent: Record<UserRole, string> = {
  admin: 'bg-purple-500',
  chef_testeur: 'bg-sky-500',
  testeur: 'bg-emerald-500',
  developpeur: 'bg-amber-500',
};

export function AdminUtilisateursPage() {
  const { currentUser, users, bloquerUtilisateur, debloquerUtilisateur, creerUtilisateur, supprimerUtilisateur, restaurerUtilisateur } = useAuth();
  const [recherche, setRecherche] = useState('');
  const [filtreRole, setFiltreRole] = useState<UserRole | 'tous'>('tous');
  const [filtreStatut, setFiltreStatut] = useState<'actifs' | 'supprimes'>('actifs');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<{ prenom: string; nom: string; email: string; role: UserRole | ''; password: string }>({ prenom: '', nom: '', email: '', role: '', password: '' });
  const [errors, setErrors] = useState({ prenom: '', nom: '', email: '', password: '', role: '' });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  const estBloque = (user: User) =>
    !!(user.bloqueJusqua && new Date(user.bloqueJusqua) > new Date());

  const estSupprime = (user: User) => !!user.dateSuppression;

  const utilisateursFiltres = users.filter(u => {
    const matchRecherche =
      !recherche ||
      `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(recherche.toLowerCase());
    const matchRole = filtreRole === 'tous' || u.role === filtreRole;
    const matchStatut = filtreStatut === 'actifs' ? !estSupprime(u) : estSupprime(u);
    return matchRecherche && matchRole && matchStatut;
  });

  const handleCreateUser = () => {
    const newErrors = {
      prenom: '',
      nom: '',
      email: '',
      password: '',
      role: ''
    };

    if (!newUser.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    if (!newUser.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    if (!newUser.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!newUser.email.includes('@')) {
      newErrors.email = 'L\'email doit être valide';
    }
    if (!newUser.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (newUser.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (!newUser.role) {
      newErrors.role = 'Le rôle est requis';
    }

    setErrors(newErrors);

    if (newErrors.prenom || newErrors.nom || newErrors.email || newErrors.password || newErrors.role) {
      return;
    }

    creerUtilisateur({
      prenom: newUser.prenom,
      nom: newUser.nom,
      email: newUser.email,
      role: newUser.role as UserRole,
      password: newUser.password,
    });

    toast.success(`Compte créé pour ${newUser.prenom} ${newUser.nom}`);
    setNewUser({ prenom: '', nom: '', email: '', role: '', password: '' });
    setErrors({ prenom: '', nom: '', email: '', password: '', role: '' });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestion des utilisateurs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Administrer les comptes et les accès</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
              <Plus className="w-4 h-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un compte utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Prénom *</Label>
                  <Input
                    value={newUser.prenom}
                    onChange={e => {
                      setNewUser({ ...newUser, prenom: e.target.value });
                      if (errors.prenom) setErrors({ ...errors, prenom: '' });
                    }}
                    placeholder="Prénom"
                    className={`bg-white ${errors.prenom ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.prenom && <p className="text-xs text-red-500">{errors.prenom}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nom *</Label>
                  <Input
                    value={newUser.nom}
                    onChange={e => {
                      setNewUser({ ...newUser, nom: e.target.value });
                      if (errors.nom) setErrors({ ...errors, nom: '' });
                    }}
                    placeholder="Nom"
                    className={`bg-white ${errors.nom ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
                  />
                  {errors.nom && <p className="text-xs text-red-500">{errors.nom}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email *</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={e => {
                    setNewUser({ ...newUser, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="nom@exemple.fr"
                  className={`bg-white ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mot de passe *</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={e => {
                    setNewUser({ ...newUser, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  placeholder="••••••••"
                  className={`bg-white ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Rôle *</Label>
                <Select value={newUser.role} onValueChange={(v: UserRole) => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="chef_testeur">Chef Testeur</SelectItem>
                    <SelectItem value="testeur">Testeur</SelectItem>
                    <SelectItem value="developpeur">Développeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                Le compte sera actif immédiatement après création. L'utilisateur peut se connecter avec les identifiants fournis.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!newUser.prenom || !newUser.nom || !newUser.email || !newUser.password || !newUser.role}
                onClick={handleCreateUser}
              >
                Créer le compte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-indigo-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total comptes</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-emerald-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Actifs</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{users.filter(u => !estSupprime(u)).length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-red-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bloqués</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{users.filter(u => estBloque(u) && !estSupprime(u)).length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-gray-500" />
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Supprimés</p>
            <p className="text-3xl font-bold text-gray-600 mt-1">{users.filter(u => estSupprime(u)).length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Par rôle</p>
            <div className="space-y-1">
              {(['admin', 'chef_testeur', 'testeur', 'developpeur'] as UserRole[]).map(role => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${roleAccent[role]}`} />
                    <span className="text-xs text-slate-500">{roleConfig[role].label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{users.filter(u => u.role === role).length}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                placeholder="Rechercher par nom ou email..."
                className="pl-9 bg-white border-slate-200 h-9"
              />
            </div>
            <Select value={filtreRole} onValueChange={(v: any) => setFiltreRole(v)}>
              <SelectTrigger className="w-44 bg-white border-slate-200 h-9">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les rôles</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="chef_testeur">Chef Testeur</SelectItem>
                <SelectItem value="testeur">Testeur</SelectItem>
                <SelectItem value="developpeur">Développeur</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtreStatut} onValueChange={(v: 'actifs' | 'supprimes') => setFiltreStatut(v)}>
              <SelectTrigger className="w-44 bg-white border-slate-200 h-9">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actifs">Actifs</SelectItem>
                <SelectItem value="supprimes">Supprimés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="space-y-2">
            {utilisateursFiltres.length === 0 && (
              <div className="py-10 text-center">
                <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucun utilisateur trouvé</p>
              </div>
            )}
            {utilisateursFiltres.map(user => {
              const bloque = estBloque(user);
              const supprime = estSupprime(user);
              const rc = roleConfig[user.role];
              const isCurrentUser = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${
                    supprime ? 'bg-gray-50/50 border-gray-200' : bloque ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-9 h-9 ${roleAccent[user.role]} rounded-full flex items-center justify-center flex-shrink-0 ${supprime ? 'opacity-50' : ''}`}>
                    <span className="text-xs font-bold text-white">
                      {user.prenom[0]}{user.nom[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${supprime ? 'text-gray-500' : 'text-slate-800'}`}>
                        {user.prenom} {user.nom}
                      </span>
                      {isCurrentUser && (
                        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px] px-1.5 py-0 border">
                          Moi
                        </Badge>
                      )}
                      {supprime && (
                        <Badge className="bg-gray-200 text-gray-700 border-gray-300 text-[10px] px-1.5 py-0 border">
                          Supprimé
                        </Badge>
                      )}
                      {bloque && !supprime && (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0 border">
                          Bloqué
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400 font-mono truncate">{user.email}</span>
                      {supprime && user.dateSuppression && (
                        <span className="text-xs text-gray-400">
                          Supprimé le {new Date(user.dateSuppression).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge className={`${rc.bg} ${rc.color} border text-xs px-2 py-0.5 hidden sm:flex ${supprime ? 'opacity-50' : ''}`}>
                      {rc.label}
                    </Badge>

                    {!isCurrentUser && (
                      <div className="flex items-center gap-2">
                        {supprime ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              restaurerUtilisateur(user.id);
                              toast.success('Utilisateur restauré');
                            }}
                            className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8 text-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restaurer
                          </Button>
                        ) : (
                          <>
                            {bloque ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => debloquerUtilisateur(user.id)}
                                className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8 text-xs"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Débloquer
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => bloquerUtilisateur(user.id)}
                                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs"
                              >
                                <ShieldOff className="w-3.5 h-3.5" />
                                Bloquer
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.prenom} ${user.nom} ?`)) {
                                  supprimerUtilisateur(user.id);
                                  toast.success('Utilisateur supprimé');
                                }
                              }}
                              className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
