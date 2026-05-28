# DHI Test Tracking - Backend API

Backend API pour le logiciel de suivi des tests et de la qualité logiciel de DHI (Digital House International).

## Technologies utilisées

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de données relationnelle
- **JWT (JSON Web Tokens)** - Authentification
- **bcryptjs** - Hashage des mots de passe
- **Helmet** - Sécurité HTTP headers
- **express-rate-limit** - Limitation du taux de requêtes
- **express-validator** - Validation des données

## Structure du projet

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Configuration de la base de données
│   │   └── init-db.sql       # Script d'initialisation de la BDD
│   ├── controllers/
│   │   ├── authController.js        # Authentification
│   │   ├── projectController.js     # Gestion des projets
│   │   ├── campaignController.js    # Gestion des campagnes
│   │   ├── teamController.js        # Gestion des équipes
│   │   ├── taskController.js        # Gestion des tâches
│   │   ├── anomalyController.js     # Gestion des anomalies
│   │   └── dashboardController.js   # Tableau de bord et rapports
│   ├── middleware/
│   │   └── auth.js           # Middleware d'authentification
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Campaign.js
│   │   ├── CampaignMember.js
│   │   ├── Feature.js
│   │   ├── TaskAssignment.js
│   │   ├── Anomaly.js
│   │   ├── AnomalyNotification.js
│   │   └── ActionLog.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── campaignRoutes.js
│   │   ├── teamRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── anomalyRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   └── jwt.js            # Utilitaires JWT
│   └── server.js             # Point d'entrée de l'application
├── .env                      # Variables d'environnement
├── package.json
└── README.md
```

## Installation

### Prérequis

- Node.js (v14 ou supérieur)
- PostgreSQL (v12 ou supérieur)
- npm ou yarn

### Étapes d'installation

1. Cloner le projet et naviguer vers le dossier backend :
```bash
cd backend
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement dans le fichier `.env` :
```env
PORT=5000
NODE_ENV=development

# Configuration de la base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dhi_test_tracking
DB_USER=postgres
DB_PASSWORD=your_password

# Configuration JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# Configuration de sécurité
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. Créer la base de données PostgreSQL :
```bash
createdb dhi_test_tracking
```

5. Exécuter le script d'initialisation de la base de données :
```bash
psql -U postgres -d dhi_test_tracking -f src/config/init-db.sql
```

## Démarrage du serveur

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarrera sur le port 5000 (par défaut).

## API Endpoints

### Authentification (`/api/auth`)

- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion d'un utilisateur
- `GET /api/auth/profile` - Obtenir le profil de l'utilisateur connecté

### Projets (`/api/projects`)

- `POST /api/projects` - Créer un nouveau projet (admin, test_lead)
- `GET /api/projects` - Lister tous les projets
- `GET /api/projects/:id` - Obtenir un projet par ID
- `PUT /api/projects/:id` - Mettre à jour un projet (admin, test_lead)
- `PATCH /api/projects/:id/archive` - Archiver un projet (admin, test_lead)
- `DELETE /api/projects/:id` - Supprimer un projet (admin)

### Campagnes (`/api/campaigns`)

- `POST /api/campaigns` - Créer une nouvelle campagne (admin, test_lead)
- `GET /api/campaigns` - Lister toutes les campagnes
- `GET /api/campaigns/:id` - Obtenir une campagne par ID
- `GET /api/campaigns/:id/statistics` - Obtenir les statistiques d'une campagne
- `PUT /api/campaigns/:id` - Mettre à jour une campagne (admin, test_lead)
- `DELETE /api/campaigns/:id` - Supprimer une campagne (admin, test_lead)

### Équipes (`/api/teams`)

- `POST /api/teams/members` - Ajouter un membre à une campagne (admin, test_lead)
- `DELETE /api/teams/members/:campaign_id/:user_id` - Retirer un membre (admin, test_lead)
- `GET /api/teams/campaigns/:campaign_id/members` - Lister les membres d'une campagne
- `GET /api/teams/users/:user_id/campaigns` - Lister les campagnes d'un utilisateur
- `GET /api/teams/campaigns/:campaign_id/users/:user_id/check` - Vérifier le membership

### Tâches (`/api/tasks`)

- `POST /api/tasks/features` - Créer une fonctionnalité (admin, test_lead)
- `POST /api/tasks/assignments` - Assigner une tâche (admin, test_lead)
- `GET /api/tasks/my-tasks` - Lister mes tâches assignées
- `GET /api/tasks/campaigns/:campaign_id/tasks` - Lister les tâches d'une campagne
- `GET /api/tasks/campaigns/:campaign_id/features` - Lister les fonctionnalités d'une campagne
- `PATCH /api/tasks/assignments/:id/status` - Mettre à jour le statut d'une tâche
- `PATCH /api/tasks/assignments/:id/reassign` - Réassigner une tâche (admin, test_lead)
- `DELETE /api/tasks/assignments/:id` - Supprimer une assignation (admin, test_lead)

### Statut des fonctionnalités (`/api/features`) - RG-01

- `PATCH /api/features/:id/status` - Mettre à jour le statut d'une fonctionnalité (admin, test_lead, tester) - **RG-01: Seuls les testeurs peuvent modifier le statut**
- `GET /api/features/:id/status` - Obtenir le statut d'une fonctionnalité

### Anomalies (`/api/anomalies`)

- `POST /api/anomalies` - Signaler une anomalie (admin, test_lead, tester)
- `GET /api/anomalies/campaigns/:campaign_id` - Lister les anomalies d'une campagne
- `GET /api/anomalies/my-anomalies` - Lister mes anomalies assignées (admin, developer)
- `GET /api/anomalies/reported` - Lister les anomalies signalées (admin, test_lead, tester)
- `GET /api/anomalies/:id` - Obtenir une anomalie par ID
- `PATCH /api/anomalies/:id/signal-resolution` - Signaler la résolution (admin, developer)
- `PATCH /api/anomalies/:id/validate` - Valider une anomalie (admin, test_lead, tester)
- `PATCH /api/anomalies/:id/reject` - Rejeter une résolution (admin, test_lead, tester)

### Notifications (`/api/anomalies/notifications`)

- `GET /api/anomalies/notifications/my` - Lister mes notifications
- `GET /api/anomalies/notifications/unread-count` - Compter les notifications non lues
- `PATCH /api/anomalies/notifications/:id/read` - Marquer une notification comme lue
- `PATCH /api/anomalies/notifications/mark-all-read` - Marquer toutes comme lues

### Tableau de bord (`/api/dashboard`)

- `GET /api/dashboard/personal` - Tableau de bord personnel
- `GET /api/dashboard/projects/:project_id` - Tableau de bord par projet
- `GET /api/dashboard/campaigns/:campaign_id` - Tableau de bord par campagne
- `GET /api/dashboard/history` - Historique des actions
- `GET /api/dashboard/campaigns/:campaign_id/report` - Générer un rapport de campagne

## Rôles utilisateurs

- **admin** - Accès complet à toutes les fonctionnalités
- **test_lead** - Chef de l'équipe testeur, peut créer et gérer campagnes, équipes, tâches
- **tester** - Membre de l'équipe testeur, peut signaler et valider les anomalies
- **developer** - Membre de l'équipe développeur, peut signaler les résolutions d'anomalies

## Sécurité

- Authentification JWT
- Hashage des mots de passe avec bcrypt
- Rate limiting pour prévenir les attaques par force brute
- Verrouillage temporaire après 5 tentatives de connexion échouées
- Helmet pour sécuriser les headers HTTP
- Validation des données avec express-validator

## Règles métier

- Seuls les testeurs peuvent modifier le statut d'une fonctionnalité
- Un testeur peut notifier directement un développeur d'une anomalie
- Un développeur peut uniquement signaler la résolution d'une anomalie
- Seul un testeur peut valider qu'une anomalie est corrigée
- Chaque campagne est indépendante avec ses propres données
- Toutes les actions sont journalisées pour la traçabilité

## Développement

### Scripts disponibles

- `npm start` - Démarrer le serveur en production
- `npm run dev` - Démarrer le serveur en mode développement avec nodemon
- `npm test` - Exécuter les tests

## Auteurs

- JIPNANG RYAN
- NGOUNOU PHAREL

## Licence

ISC
