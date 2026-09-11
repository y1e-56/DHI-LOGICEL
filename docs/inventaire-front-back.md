# Inventaire front / backend

## Etat actuel

Le front `nouveau` utilise encore `DhiStoreProvider` comme source principale. Les donnees metier sont chargees depuis `dhi-data.ts` puis persistees dans `localStorage`. Le seul appel backend actuellement utilise est `POST /api/auth/login`.

## Fonctionnalites deja disponibles dans le backend

Ces domaines disposent de routes backend et doivent etre raccordes au front avec des adaptateurs de donnees :

- Produits : `/api/products`
- Projets : `/api/projects`
- Campagnes : `/api/campaigns`
- Fonctionnalites : `/api/features`
- Anomalies : `/api/anomalies`
- Cas de test : `/api/test-cases`
- Tableaux de bord : `/api/dashboard`
- Equipes et affectations : `/api/teams`, `/api/tasks`
- Exigences : `/api/requirements`
- Points a surveiller : `/api/watch-points`
- Executions : `/api/test-executions`
- Preuves : `/api/evidence`
- Scenarios : `/api/test-scenarios`
- Versions : `/api/versions`
- Incidents : `/api/incidents`
- Dependances : `/api/dependencies`

Les huit dernieres familles etaient implementees mais non montees dans `backend/src/routes/index.js`. Elles le sont maintenant.

## Fonctionnalites sans equivalent backend actuel

- Go Live et decisions Go / No-Go
- Referentiels et regles de qualite
- Matrice de couverture personnalisee du front
- Documents rattaches directement aux produits et projets
- Modele d'alertes generees par le store local
- Modele generique de notifications du front

Le backend possede toutefois des briques partielles pour les notifications, l'historique et les preuves. Elles devront etre alignees avant reutilisation.

## Ecarts de contrat a traiter

- Le front utilise des identifiants texte (`p-1`, `pr-1`) ; le backend attend des identifiants numeriques.
- Les noms de champs divergent : `productId` contre `product_id`, `targetVersion` contre `end_date` ou `release_id`, etc.
- Les statuts du front sont principalement en francais ; ceux du backend sont des valeurs anglaises et des transitions dediees.
- Les fonctionnalites du front sont rattachees a un produit ; le backend les rattache a une campagne.
- Le front modifie un `TestCase` pendant une execution ; le backend utilise une ressource separee `test-executions`.
- Les exigences du front peuvent viser plusieurs fonctionnalites ; le backend attend une seule `feature_id`.

## Ordre de migration recommande

1. Authentification JWT, deja raccordee.
2. Execution d'un cas de test avec `/api/test-executions`, puis preuves avec `/api/evidence`.
3. Chargement et mutations des campagnes, cas de test et anomalies.
4. Chargement du dashboard depuis `/api/dashboard`.
5. Projets, produits et fonctionnalites avec adaptateurs de champs et d'identifiants.
6. Exigences et points a surveiller.
7. Conception backend des modules absents : Go Live, referentiels, documents et couverture.

## Premier chantier

Le premier chantier est le flux campagne -> cas de test -> execution -> anomalie. Il evite la perte de resultats et d'historique actuellement conserves uniquement dans `localStorage`.