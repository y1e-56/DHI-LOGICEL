import React from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Bell, BellOff, CheckCheck, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export function Notifications() {
  const { user } = useAuth();
  const { notifications, marquerNotificationLue } = useData();

  const mesNotifications = notifications.filter(n => n.userId === user?.id);
  const nonLues = mesNotifications.filter(n => !n.lue);
  const lues = mesNotifications.filter(n => n.lue);

  const handleMarquerLue = (id: string) => {
    marquerNotificationLue(id);
    toast.success('Notification marquée comme lue');
  };

  const handleMarquerToutesLues = () => {
    nonLues.forEach(n => marquerNotificationLue(n.id));
    toast.success('Toutes les notifications marquées comme lues');
  };

  const getIconeType = (type: string) => {
    switch (type) {
      case 'assignation':
        return '📋';
      case 'anomalie':
        return '🐛';
      case 'resolution':
        return '✅';
      case 'validation':
        return '🎯';
      default:
        return '📢';
    }
  };

  const renderNotification = (notification: any, estLue: boolean) => (
    <Card 
      key={notification.id} 
      className={`${!estLue ? 'border-primary/50 bg-primary/5' : 'opacity-75'}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="text-3xl">{getIconeType(notification.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <h3 className="font-semibold">{notification.titre}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              </div>
              {!estLue && (
                <Badge variant="destructive" className="shrink-0">
                  Nouveau
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="text-xs text-muted-foreground">
                {format(new Date(notification.dateCreation), 'dd MMM yyyy à HH:mm', { locale: fr })}
              </span>
              {notification.lien && (
                <Link to={notification.lien}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="size-3 mr-2" />
                    Voir
                  </Button>
                </Link>
              )}
              {!estLue && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleMarquerLue(notification.id)}
                >
                  <CheckCheck className="size-3 mr-2" />
                  Marquer comme lue
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {nonLues.length} notification{nonLues.length > 1 ? 's' : ''} non lue{nonLues.length > 1 ? 's' : ''}
          </p>
        </div>

        {nonLues.length > 0 && (
          <Button onClick={handleMarquerToutesLues}>
            <CheckCheck className="size-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-red-100">
                <Bell className="size-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Non lues</p>
                <p className="text-2xl font-bold">{nonLues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
                <CheckCheck className="size-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lues</p>
                <p className="text-2xl font-bold">{lues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-blue-100">
                <Bell className="size-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{mesNotifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications non lues */}
      {nonLues.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Non lues ({nonLues.length})
          </h2>
          <div className="space-y-3">
            {nonLues.map(n => renderNotification(n, false))}
          </div>
        </div>
      )}

      {/* Notifications lues */}
      {lues.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            Lues ({lues.length})
          </h2>
          <div className="space-y-3">
            {lues.map(n => renderNotification(n, true))}
          </div>
        </div>
      )}

      {/* Aucune notification */}
      {mesNotifications.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <BellOff className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune notification</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vous recevrez des notifications pour les assignations et anomalies
          </p>
        </div>
      )}
    </div>
  );
}
