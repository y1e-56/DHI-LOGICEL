import React from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Bug, CheckCircle2, AlertCircle, User, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const DEMO_USERS: Record<string, string> = {
  '3': 'Sophie Testeur',
  '4': 'Thomas Dev',
  '5': 'Julie Test',
  '6': 'Marc Qualité',
  '7': 'Alex Code'
};

export function AnomalieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { anomalies, fonctionnalites, campagnes, projets, signalerResolution, validerCloture, ajouterNotification } = useData();

  const anomalie = anomalies.find(a => a.id === id);
  const fonctionnalite = anomalie ? fonctionnalites.find(f => f.id === anomalie.fonctionnaliteId) : null;
  const campagne = anomalie ? campagnes.find(c => c.id === anomalie.campagneId) : null;
  const projet = campagne ? projets.find(p => p.id === campagne.projetId) : null;

  if (!anomalie || !fonctionnalite || !campagne) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Anomalie non trouvée</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const handleSignalerResolution = () => {
    if (!user) return;
    
    signalerResolution(anomalie.id, user.id);
    
    // Notifier le testeur
    ajouterNotification({
      userId: anomalie.testeurId,
      type: 'resolution',
      titre: 'Résolution signalée',
      message: `${user.nom} a signalé la résolution de "${anomalie.titre}"`,
      lue: false,
      dateCreation: new Date().toISOString(),
      lien: `/anomalies/${anomalie.id}`
    });
    
    toast.success('Résolution signalée au testeur');
  };

  const handleValiderCloture = () => {
    if (!user) return;
    
    validerCloture(anomalie.id, user.id);
    toast.success('Anomalie clôturée');
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'nouvelle':
        return <Badge variant="destructive" className="text-base px-3 py-1">Nouvelle</Badge>;
      case 'en_cours':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-base px-3 py-1">En cours</Badge>;
      case 'resolution_signalee':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-base px-3 py-1">Résolution signalée</Badge>;
      case 'verifiee':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-base px-3 py-1">Vérifiée</Badge>;
      case 'cloturee':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-base px-3 py-1">Clôturée</Badge>;
      default:
        return null;
    }
  };

  const estDeveloppeur = user?.role === 'developpeur' && anomalie.developpeurId === user.id;
  const estTesteur = user?.role === 'testeur' && anomalie.testeurId === user.id;
  const peutSignalerResolution = estDeveloppeur && (anomalie.statut === 'nouvelle' || anomalie.statut === 'en_cours');
  const peutValiderCloture = estTesteur && anomalie.statut === 'resolution_signalee';

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Détails de l'anomalie</h1>
          <p className="text-muted-foreground mt-1">
            {campagne.nom} • {projet?.nom}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug className="size-6 text-red-600" />
                    <CardTitle className="text-2xl">{anomalie.titre}</CardTitle>
                  </div>
                  <CardDescription>
                    Fonctionnalité concernée: {fonctionnalite.nom}
                  </CardDescription>
                </div>
                {getStatutBadge(anomalie.statut)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="size-4" />
                  Description de l'anomalie
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-accent/50 p-4 rounded-lg">
                  {anomalie.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Historique */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des actions</CardTitle>
              <CardDescription>
                Suivi chronologique de l'anomalie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalie.historique.map((action, index) => (
                  <div key={action.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex size-8 items-center justify-center rounded-full ${
                        index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <div className="size-2 rounded-full bg-current" />
                      </div>
                      {index < anomalie.historique.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-2" style={{ minHeight: '40px' }} />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium">{action.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(action.date), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Par {action.auteurNom}
                      </p>
                      {action.details && (
                        <p className="text-sm mt-2 bg-accent/50 p-2 rounded">
                          {action.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {(peutSignalerResolution || peutValiderCloture) && (
            <Card>
              <CardHeader>
                <CardTitle>Actions disponibles</CardTitle>
                <CardDescription>
                  {estDeveloppeur && 'En tant que développeur assigné'}
                  {estTesteur && 'En tant que testeur'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {peutSignalerResolution && (
                  <div className="p-4 border rounded-lg bg-blue-50/50">
                    <h4 className="font-semibold mb-2">Zone développeur</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Signalez la résolution de cette anomalie lorsque la correction est déployée en environnement de test.
                      Le testeur sera notifié et pourra vérifier la résolution.
                    </p>
                    <Button onClick={handleSignalerResolution} className="w-full">
                      <CheckCircle2 className="size-4 mr-2" />
                      Signaler la résolution
                    </Button>
                  </div>
                )}

                {peutValiderCloture && (
                  <div className="p-4 border rounded-lg bg-green-50/50">
                    <h4 className="font-semibold mb-2">Zone testeur - Validation</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Le développeur a signalé une résolution. Vérifiez que l'anomalie est bien corrigée
                      et validez la clôture si c'est le cas.
                    </p>
                    <Button 
                      onClick={handleValiderCloture}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="size-4 mr-2" />
                      Valider et clôturer l'anomalie
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Informations secondaires */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Statut actuel</p>
                {getStatutBadge(anomalie.statut)}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <User className="size-4" />
                  Testeur (auteur)
                </p>
                <p className="font-medium">{DEMO_USERS[anomalie.testeurId] || 'Inconnu'}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <User className="size-4" />
                  Développeur notifié
                </p>
                <p className="font-medium">
                  {anomalie.developpeurId ? DEMO_USERS[anomalie.developpeurId] : 'Non assigné'}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Calendar className="size-4" />
                  Date de création
                </p>
                <p className="font-medium">
                  {format(new Date(anomalie.dateCreation), 'dd MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(anomalie.dateCreation), 'HH:mm', { locale: fr })}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Priorité</p>
                {fonctionnalite.priorite === 'critique' && <Badge variant="destructive">Critique</Badge>}
                {fonctionnalite.priorite === 'haute' && <Badge className="bg-orange-500">Haute</Badge>}
                {fonctionnalite.priorite === 'moyenne' && <Badge variant="outline">Moyenne</Badge>}
                {fonctionnalite.priorite === 'basse' && <Badge variant="secondary">Basse</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contexte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Projet</p>
                <p className="font-medium">{projet?.nom}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Campagne</p>
                <p className="font-medium">{campagne.nom}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Fonctionnalité</p>
                <p className="font-medium">{fonctionnalite.nom}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
