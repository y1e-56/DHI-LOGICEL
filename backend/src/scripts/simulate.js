import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

/**
 * Simulation de donnees de demonstration.
 *
 * Repart de zero (TRUNCATE ... RESTART IDENTITY CASCADE) puis recharge un jeu
 * complet et coherent couvrant toutes les entites du domaine : utilisateurs,
 * produits, environnements, versions, projets, campagnes, fonctionnalites,
 * exigences, scenarios, cas de test, affectations, dependances, executions,
 * preuves, anomalies, incidents, points a surveiller, decisions go-live,
 * regles referentielles, historique et notifications.
 *
 * Usage : npm run simulate (depuis /backend)
 */

const TABLES = [
  'notifications',
  'history_actions',
  'incidents',
  'anomaly_comments',
  'anomalies',
  'evidence',
  'test_executions',
  'assignments',
  'feature_dependencies',
  'test_cases',
  'test_scenarios',
  'requirement_features',
  'requirements',
  'features',
  'campaign_members',
  'campaign_test_leads',
  'campaigns',
  'project_test_leads',
  'projects',
  'releases',
  'environments',
  'products',
  'watch_points',
  'go_live_checklist',
  'go_live_decisions',
  'software_versions',
  'referential_rules',
  'users',
];

async function simulate() {
  const client = await pool.connect();

  /**
   * Insere un lot de lignes et retourne les ids generes, dans l'ordre.
   * Les objets jsonb et tableaux texte sont serialises par node-postgres.
   */
  const insertMany = async (table, columns, rows) => {
    const values = [];
    const chunks = rows.map(
      (row) =>
        `(${columns
          .map((col) => {
            values.push(row[col]);
            return `$${values.length}`;
          })
          .join(', ')})`
    );
    const text = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${chunks.join(', ')} RETURNING id`;
    const result = await client.query(text, values);
    return result.rows.map((r) => r.id);
  };

  try {
    await client.query('BEGIN');
    await client.query(`TRUNCATE TABLE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
    console.log('Base reinitialisee');

    const hash = (pwd) => bcrypt.hashSync(pwd, 10);

    // ── Utilisateurs ────────────────────────────────────────
    const [adminId, chefId, chef2Id, testeurId, devId, ryanId] = await insertMany(
      'users',
      ['email', 'password_hash', 'first_name', 'last_name', 'role', 'roles'],
      [
        { email: 'admin@test.fr', password_hash: hash('Admin@DHI2026'), first_name: 'Admin', last_name: 'Principal', role: 'admin', roles: ['admin'] },
        { email: 'chef@test.fr', password_hash: hash('Chef@DHI2026'), first_name: 'Chef', last_name: 'Projet', role: 'chef_projet', roles: ['chef_projet'] },
        { email: 'chef2@test.fr', password_hash: hash('Chef@DHI2026'), first_name: 'Second', last_name: 'Chef', role: 'chef_testeur', roles: ['chef_testeur'] },
        { email: 'testeur@test.fr', password_hash: hash('Testeur@DHI2026'), first_name: 'Testeur', last_name: 'Principal', role: 'tester', roles: ['tester'] },
        { email: 'dev@test.fr', password_hash: hash('Dev@DHI2026'), first_name: 'Developpeur', last_name: 'Senior', role: 'developer', roles: ['developer'] },
        { email: 'jipnangryan237@gmail.com', password_hash: hash('Ryan@DHI2026'), first_name: 'Ryan', last_name: 'Jipnang', role: 'tester', roles: ['tester', 'product_owner'] },
      ]
    );

    // ── Produits ────────────────────────────────────────────
    const [atlasId, boutiqueId] = await insertMany(
      'products',
      ['name', 'description', 'owner_id', 'owner_name', 'quality_manager_id', 'created_by'],
      [
        { name: 'Atlas Qualite', description: 'Plateforme de gestion de la qualite logicielle', owner_id: chefId, owner_name: 'Chef Projet', quality_manager_id: chef2Id, created_by: adminId },
        { name: 'Boutique Mobile', description: 'Application mobile de vente et paiement', owner_id: chef2Id, owner_name: 'Second Chef', quality_manager_id: adminId, created_by: adminId },
      ]
    );

    // ── Environnements ──────────────────────────────────────
    const env = await insertMany(
      'environments',
      ['product_id', 'name', 'type', 'description', 'created_by'],
      [
        { product_id: atlasId, name: 'ATLAS-DEV', type: 'development', description: 'Environnement de developpement Atlas', created_by: adminId },
        { product_id: atlasId, name: 'ATLAS-RECETTE', type: 'staging', description: 'Environnement de recette Atlas', created_by: adminId },
        { product_id: atlasId, name: 'ATLAS-PROD', type: 'production', description: 'Environnement de production Atlas', created_by: adminId },
        { product_id: boutiqueId, name: 'BOUTIQUE-DEV', type: 'development', description: 'Environnement de developpement Boutique', created_by: adminId },
        { product_id: boutiqueId, name: 'BOUTIQUE-RECETTE', type: 'integration', description: 'Environnement de recette Boutique', created_by: adminId },
      ]
    );
    const atlasDevId = env[0];
    const atlasRecetteId = env[1];
    const atlasProdId = env[2];
    const boutiqueRecetteId = env[4];

    // ── Versions ────────────────────────────────────────────
    const rel = await insertMany(
      'releases',
      ['product_id', 'version', 'description', 'status', 'planned_date', 'released_at', 'created_by'],
      [
        { product_id: atlasId, version: '1.0.0', description: 'Premiere version stable Atlas', status: 'released', planned_date: '2026-01-15', released_at: '2026-01-20T10:00:00Z', created_by: adminId },
        { product_id: atlasId, version: '1.1.0', description: 'Refonte du socle et authentification', status: 'in_progress', planned_date: '2026-04-30', released_at: null, created_by: adminId },
        { product_id: atlasId, version: '1.2.0', description: 'Tableaux de bord avances', status: 'planned', planned_date: '2026-07-15', released_at: null, created_by: adminId },
        { product_id: boutiqueId, version: '2.0.0', description: 'Nouveau parcours de paiement', status: 'in_progress', planned_date: '2026-05-20', released_at: null, created_by: adminId },
      ]
    );
    const rel100 = rel[0];
    const rel110 = rel[1];
    const rel200 = rel[3];

    // ── Projets ─────────────────────────────────────────────
    const [projSocleId, projMobileId, projPaiementId] = await insertMany(
      'projects',
      ['product_id', 'name', 'description', 'start_date', 'end_date', 'created_by'],
      [
        { product_id: atlasId, name: 'Refonte Atlas - Socle', description: 'Modernisation du socle applicatif Atlas', start_date: '2026-01-01', end_date: '2026-06-30', created_by: adminId },
        { product_id: atlasId, name: 'Atlas - Application mobile', description: 'Declinaison mobile de la plateforme Atlas', start_date: '2026-02-01', end_date: '2026-08-31', created_by: adminId },
        { product_id: boutiqueId, name: 'Boutique - Parcours paiement', description: 'Refonte du tunnel de paiement', start_date: '2026-03-01', end_date: '2026-06-15', created_by: adminId },
      ]
    );

    await insertMany('project_test_leads', ['project_id', 'user_id'], [
      { project_id: projSocleId, user_id: chefId },
      { project_id: projSocleId, user_id: chef2Id },
      { project_id: projMobileId, user_id: chef2Id },
      { project_id: projPaiementId, user_id: chef2Id },
    ]);

    // ── Campagnes ───────────────────────────────────────────
    const [campSocleId, campMobileId, campRegressionId, campPaiementId] = await insertMany(
      'campaigns',
      ['project_id', 'release_id', 'environment_id', 'name', 'objective', 'organization_mode', 'start_date', 'end_date', 'test_lead_id', 'status'],
      [
        { project_id: projSocleId, release_id: rel110, environment_id: atlasRecetteId, name: 'Recette v1.1 - Socle Atlas', objective: "Valider la refonte du socle et l'authentification", organization_mode: 'scenario', start_date: '2026-04-01', end_date: '2026-05-15', test_lead_id: chefId, status: 'in_progress' },
        { project_id: projMobileId, release_id: null, environment_id: atlasDevId, name: 'Exploratoire - Application mobile Atlas', objective: 'Explorer les parcours mobiles et la synchronisation', organization_mode: 'exploratory', start_date: '2026-05-01', end_date: '2026-06-15', test_lead_id: chef2Id, status: 'planning' },
        { project_id: projSocleId, release_id: rel100, environment_id: atlasProdId, name: 'Regression v1.0 - Atlas', objective: 'Non-regression de la version 1.0.0', organization_mode: 'combination', start_date: '2026-01-21', end_date: '2026-02-10', test_lead_id: chefId, status: 'completed' },
        { project_id: projPaiementId, release_id: rel200, environment_id: boutiqueRecetteId, name: 'Recette paiement v2.0 - Boutique', objective: 'Valider le nouveau parcours de paiement', organization_mode: 'scenario', start_date: '2026-04-15', end_date: '2026-05-30', test_lead_id: chef2Id, status: 'in_progress' },
      ]
    );
    const campSocle = campSocleId;
    const campMobile = campMobileId;
    const campRegression = campRegressionId;
    const campPaiement = campPaiementId;

    await client.query(
      `INSERT INTO campaign_test_leads (campaign_id, user_id) VALUES ($1,$2),($1,$3),($4,$3),($5,$2),($6,$3)`,
      [campSocle, chefId, chef2Id, campMobile, campRegression, campPaiement]
    );

    await client.query(
      `INSERT INTO campaign_members (campaign_id, user_id, team_type) VALUES
        ($1,$2,'tester'),($1,$3,'developer'),($1,$4,'tester'),
        ($5,$2,'tester'),($5,$3,'developer'),
        ($6,$2,'tester'),($6,$3,'developer'),
        ($7,$2,'tester'),($7,$8,'tester'),($7,$3,'developer')`,
      [campSocle, testeurId, devId, chef2Id, campMobile, campRegression, campPaiement, ryanId]
    );

    // ── Fonctionnalites ─────────────────────────────────────
    const feat = await insertMany(
        'features',
        ['campaign_id', 'name', 'description', 'priority', 'status', 'module', 'coverage'],
        [
          { campaign_id: campSocle, name: 'Authentification', description: 'Connexion et gestion des sessions', priority: 'high', status: 'conforme', module: 'Securite', coverage: { fonctionnel: true, securite: true, regression: true } },
          { campaign_id: campSocle, name: 'Gestion des utilisateurs', description: 'CRUD des comptes et roles', priority: 'high', status: 'pending', module: 'Administration', coverage: { fonctionnel: true, regression: false } },
          { campaign_id: campSocle, name: 'Tableau de bord', description: 'Indicateurs et statistiques', priority: 'critical', status: 'anomaly_detected', module: 'Reporting', coverage: { integration: true, performance: false } },
          { campaign_id: campSocle, name: 'Notifications', description: 'Alertes applicatives', priority: 'medium', status: 'pending', module: 'Communication', coverage: { fonctionnel: false } },
          { campaign_id: campSocle, name: 'Export CSV', description: 'Export des donnees en CSV', priority: 'low', status: 'pending', module: 'Reporting', coverage: {} },
          { campaign_id: campMobile, name: 'Navigation mobile', description: 'Navigation entre les ecrans', priority: 'high', status: 'conforme', module: 'Mobile', coverage: { interface: true } },
          { campaign_id: campMobile, name: 'Synchronisation hors-ligne', description: 'Synchronisation differee des saisies', priority: 'critical', status: 'anomaly_detected', module: 'Mobile', coverage: { end_to_end: true, resilience: false } },
          { campaign_id: campMobile, name: 'Notifications push', description: 'Notifications poussees', priority: 'medium', status: 'pending', module: 'Communication', coverage: {} },
          { campaign_id: campRegression, name: 'Authentification', description: 'Authentification version 1.0', priority: 'high', status: 'conforme', module: 'Securite', coverage: { regression: true } },
          { campaign_id: campRegression, name: 'Rapports', description: 'Generation des rapports de recette', priority: 'medium', status: 'conforme', module: 'Reporting', coverage: { fonctionnel: true } },
          { campaign_id: campPaiement, name: 'Paiement CB', description: 'Paiement par carte bancaire', priority: 'critical', status: 'anomaly_detected', module: 'Paiement', coverage: { end_to_end: true, securite: false } },
          { campaign_id: campPaiement, name: 'Remboursement', description: 'Remboursement total ou partiel', priority: 'high', status: 'pending', module: 'Paiement', coverage: { fonctionnel: true } },
          { campaign_id: campPaiement, name: 'Facturation', description: 'Edition des factures', priority: 'medium', status: 'pending', module: 'Facturation', coverage: {} },
        ]
      );

    const fAuth = feat[0];
    const fUsers = feat[1];
    const fDash = feat[2];
    const fNotif = feat[3];
    const fNav = feat[5];
    const fSync = feat[6];
    const fAuthV1 = feat[8];
    const fPay = feat[10];
    const fRefund = feat[11];
    const fBill = feat[12];

    // ── Exigences ───────────────────────────────────────────
    const req = await insertMany(
      'requirements',
      ['product_id', 'feature_id', 'title', 'description', 'category', 'status', 'priority', 'created_by'],
      [
        { product_id: atlasId, feature_id: fAuth, title: 'Authentification multi-facteur', description: 'Double facteur obligatoire pour les comptes admin', category: 'securite', status: 'approved', priority: 'high', created_by: adminId },
        { product_id: atlasId, feature_id: fUsers, title: 'Gestion fine des roles', description: 'Permissions par role sur chaque action', category: 'securite', status: 'validated', priority: 'high', created_by: adminId },
        { product_id: atlasId, feature_id: fDash, title: 'Temps de reponse du tableau de bord', description: 'Affichage en moins de 2 secondes', category: 'performance', status: 'proposed', priority: 'medium', created_by: adminId },
        { product_id: atlasId, feature_id: fNotif, title: 'Notifications non intrusives', description: 'Les alertes ne doivent pas bloquer le travail', category: 'ergonomie', status: 'proposed', priority: 'low', created_by: adminId },
        { product_id: atlasId, feature_id: null, title: 'Conformite RGAA AA', description: 'Accessibilite des interfaces grand public', category: 'accessibilite', status: 'approved', priority: 'high', created_by: adminId },
        { product_id: atlasId, feature_id: fSync, title: 'Reprise apres perte de connexion', description: 'Aucune perte de donnee en cas de coupure', category: 'resilience', status: 'proposed', priority: 'high', created_by: adminId },
        { product_id: boutiqueId, feature_id: fPay, title: 'Paiement conforme PCI-DSS', description: 'Aucune donnee carte stockee cote serveur', category: 'securite', status: 'validated', priority: 'high', created_by: adminId },
        { product_id: boutiqueId, feature_id: fBill, title: 'Facturation automatique mensuelle', description: 'Edition automatique des factures', category: 'fonctionnelle', status: 'proposed', priority: 'medium', created_by: adminId },
      ]
    );

    const rAuth = req[0];
    const rRoles = req[1];
    const rNotif = req[3];
    const rResil = req[5];
    const rPci = req[6];
    const rBill = req[7];

    await client.query(
      `INSERT INTO requirement_features (requirement_id, feature_id) VALUES
        ($1,$2),($3,$4),($5,$6),($7,$8),($9,$10),($11,$12),($13,$14)`,
      [rAuth, fAuth, rRoles, fUsers, rResil, fSync, rPci, fPay, rBill, fBill, rAuth, fUsers, rNotif, fDash]
    );

    // ── Scenarios ───────────────────────────────────────────
    const [sConn, sAccount, sDash, sNav, sSync, sReg, sPay, sRefund] = await insertMany(
      'test_scenarios',
      ['campaign_id', 'feature_id', 'title', 'description', 'category', 'created_by'],
      [
        { campaign_id: campSocle, feature_id: fAuth, title: 'Parcours de connexion', description: 'Connexion et gestion de session', category: 'fonctionnel', created_by: adminId },
        { campaign_id: campSocle, feature_id: fUsers, title: "Cycle de vie d'un compte", description: 'Creation, modification, desactivation', category: 'fonctionnel', created_by: adminId },
        { campaign_id: campSocle, feature_id: fDash, title: 'Consultation du tableau de bord', description: 'Lecture des indicateurs', category: 'integration', created_by: adminId },
        { campaign_id: campMobile, feature_id: fNav, title: 'Navigation entre ecrans', description: 'Parcours de navigation mobile', category: 'interface', created_by: adminId },
        { campaign_id: campMobile, feature_id: fSync, title: 'Synchronisation apres reconnexion', description: 'Reprise des saisies hors-ligne', category: 'end_to_end', created_by: adminId },
        { campaign_id: campRegression, feature_id: fAuthV1, title: 'Non-regression authentification', description: 'Verification de la version 1.0', category: 'regression', created_by: adminId },
        { campaign_id: campPaiement, feature_id: fPay, title: 'Paiement par carte bancaire', description: 'Parcours de paiement complet', category: 'end_to_end', created_by: adminId },
        { campaign_id: campPaiement, feature_id: fRefund, title: 'Demande de remboursement', description: 'Remboursement total et partiel', category: 'fonctionnel', created_by: adminId },
      ]
    );

    // ── Cas de test ─────────────────────────────────────────
    const tc = await insertMany(
      'test_cases',
      ['feature_id', 'campaign_id', 'name', 'description', 'steps', 'expected_result', 'priority', 'type', 'criticality', 'scenario_id', 'assigned_to', 'version'],
      [
        { feature_id: fAuth, campaign_id: campSocle, name: 'Connexion avec identifiants valides', description: 'Verifier la connexion nominale', steps: 'Ouvrir la page de connexion\nSaisir un email valide\nSaisir le mot de passe\nCliquer sur Se connecter', expected_result: "L'utilisateur accede a son tableau de bord", priority: 'critical', type: 'fonctionnel', criticality: 'critical', scenario_id: sConn, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fAuth, campaign_id: campSocle, name: 'Connexion avec mot de passe invalide', description: 'Verifier le rejet', steps: 'Ouvrir la page de connexion\nSaisir un mot de passe invalide\nValider', expected_result: "Un message d'erreur explicite est affiche", priority: 'high', type: 'fonctionnel', criticality: 'high', scenario_id: sConn, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fAuth, campaign_id: campSocle, name: 'Verrouillage apres 5 echecs', description: 'Verifier la protection anti-bruteforce', steps: 'Saisir 5 mots de passe errones', expected_result: 'Le compte est verrouille temporairement', priority: 'medium', type: 'securite', criticality: 'medium', scenario_id: sConn, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fUsers, campaign_id: campSocle, name: "Creation d'un utilisateur", description: 'Verifier la creation de compte', steps: 'Ouvrir administration\nCliquer sur Nouvel utilisateur\nRenseigner les champs\nValider', expected_result: 'Le compte apparait dans la liste', priority: 'high', type: 'fonctionnel', criticality: 'high', scenario_id: sAccount, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fUsers, campaign_id: campSocle, name: "Desactivation d'un compte", description: 'Verifier la desactivation', steps: 'Ouvrir un compte\nCliquer sur Desactiver\nConfirmer', expected_result: 'Le compte est marque inactif', priority: 'medium', type: 'fonctionnel', criticality: 'medium', scenario_id: sAccount, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fUsers, campaign_id: campSocle, name: "Recherche d'un utilisateur", description: 'Verifier la recherche', steps: 'Ouvrir administration\nSaisir un nom', expected_result: 'La liste se filtre en direct', priority: 'low', type: 'fonctionnel', criticality: 'low', scenario_id: sAccount, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fDash, campaign_id: campSocle, name: 'Affichage des KPI du tableau de bord', description: 'Verifier les indicateurs', steps: 'Ouvrir le tableau de bord\nAttendre le chargement', expected_result: 'Les KPI saffichent en moins de 2 secondes', priority: 'critical', type: 'integration', criticality: 'critical', scenario_id: sDash, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fDash, campaign_id: campSocle, name: 'Filtrage par periode', description: 'Verifier le filtre de periode', steps: 'Choisir une periode\nValider', expected_result: 'Les KPI correspondent a la periode', priority: 'medium', type: 'integration', criticality: 'medium', scenario_id: sDash, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fNotif, campaign_id: campSocle, name: "Reception d'une notification d'anomalie", description: 'Verifier les alertes', steps: "Declarer une anomalie", expected_result: 'Le responsable recoit une notification', priority: 'medium', type: 'fonctionnel', criticality: 'medium', scenario_id: null, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fNav, campaign_id: campMobile, name: 'Navigation Accueil vers Detail', description: 'Verifier la navigation', steps: "Ouvrir l'application\nToucher un element", expected_result: "L'ecran de detail saffiche", priority: 'high', type: 'interface', criticality: 'high', scenario_id: sNav, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fNav, campaign_id: campMobile, name: "Rotation de l'ecran", description: 'Verifier le responsive', steps: "Tourner l'appareil", expected_result: 'La mise en page sadapter', priority: 'low', type: 'interface', criticality: 'low', scenario_id: sNav, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fSync, campaign_id: campMobile, name: "Envoi d'observations hors-ligne", description: 'Verifier la saisie sans reseau', steps: 'Couper le reseau\nSaisir une observation', expected_result: 'Lobservation est conservee localement', priority: 'critical', type: 'end_to_end', criticality: 'critical', scenario_id: sSync, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fSync, campaign_id: campMobile, name: 'Reprise de la synchronisation', description: 'Verifier la synchro differee', steps: "Retablir le reseau\nRelancer l'application", expected_result: 'Les observations sont synchronisees', priority: 'high', type: 'end_to_end', criticality: 'high', scenario_id: sSync, assigned_to: testeurId, version: '1.1.0' },
        { feature_id: fAuthV1, campaign_id: campRegression, name: 'Non-regression - connexion', description: 'Verifier la connexion v1.0', steps: 'Se connecter avec un compte de test', expected_result: 'La connexion fonctionne comme avant', priority: 'high', type: 'regression', criticality: 'high', scenario_id: sReg, assigned_to: testeurId, version: '1.0.0' },
        { feature_id: fAuthV1, campaign_id: campRegression, name: 'Non-regression - deconnexion', description: 'Verifier la deconnexion', steps: 'Se deconnecter', expected_result: 'La session est fermee', priority: 'medium', type: 'regression', criticality: 'medium', scenario_id: sReg, assigned_to: testeurId, version: '1.0.0' },
        { feature_id: fPay, campaign_id: campPaiement, name: 'Paiement CB valide', description: 'Verifier le paiement nominal', steps: 'Ajouter un article\nRenseigner une carte valide\nValider', expected_result: 'Le paiement est accepte', priority: 'critical', type: 'end_to_end', criticality: 'critical', scenario_id: sPay, assigned_to: testeurId, version: '2.0.0' },
        { feature_id: fPay, campaign_id: campPaiement, name: 'Paiement CB refuse (3-D Secure)', description: 'Verifier le 3-D Secure', steps: 'Saisir une carte valide\nEchouer le 3-D Secure', expected_result: 'Un message explicite est affiche', priority: 'high', type: 'securite', criticality: 'high', scenario_id: sPay, assigned_to: ryanId, version: '2.0.0' },
        { feature_id: fRefund, campaign_id: campPaiement, name: 'Remboursement total', description: 'Verifier le remboursement total', steps: 'Ouvrir une commande payee\nDemander un remboursement', expected_result: 'Le montant est rembourse integralement', priority: 'high', type: 'fonctionnel', criticality: 'high', scenario_id: sRefund, assigned_to: ryanId, version: '2.0.0' },
        { feature_id: fRefund, campaign_id: campPaiement, name: 'Remboursement partiel', description: 'Verifier le remboursement partiel', steps: 'Saisir un montant partiel\nValider', expected_result: 'Le montant partiel est rembourse', priority: 'medium', type: 'fonctionnel', criticality: 'medium', scenario_id: sRefund, assigned_to: ryanId, version: '2.0.0' },
        { feature_id: fBill, campaign_id: campPaiement, name: 'Generation de facture mensuelle', description: 'Verifier la facturation', steps: 'Cloturer le mois\nLancer la facturation', expected_result: 'Les factures sont generees', priority: 'medium', type: 'fonctionnel', criticality: 'medium', scenario_id: null, assigned_to: testeurId, version: '2.0.0' },
      ]
    );
    const t1 = tc[0];
    const t2 = tc[1];
    const t3 = tc[2];
    const t4 = tc[3];
    const t5 = tc[4];
    const t6 = tc[5];
    const t7 = tc[6];
    const t8 = tc[7];
    const t12 = tc[11];
    const t14 = tc[13];
    const t15 = tc[14];
    const t16 = tc[15];
    const t17 = tc[16];
    const t18 = tc[17];

    // ── Affectations ────────────────────────────────────────
    await insertMany(
      'assignments',
      ['feature_id', 'assigned_to', 'status', 'duration_days', 'due_date'],
      [
        { feature_id: fAuth, assigned_to: testeurId, status: 'completed', duration_days: 2, due_date: '2026-04-10T00:00:00Z' },
        { feature_id: fUsers, assigned_to: testeurId, status: 'in_progress', duration_days: 3, due_date: '2026-04-20T00:00:00Z' },
        { feature_id: fDash, assigned_to: testeurId, status: 'in_progress', duration_days: 4, due_date: '2026-04-25T00:00:00Z' },
        { feature_id: fSync, assigned_to: testeurId, status: 'completed', duration_days: 3, due_date: '2026-05-20T00:00:00Z' },
        { feature_id: fPay, assigned_to: testeurId, status: 'in_progress', duration_days: 5, due_date: '2026-05-05T00:00:00Z' },
        { feature_id: fRefund, assigned_to: ryanId, status: 'pending', duration_days: 2, due_date: '2026-05-12T00:00:00Z' },
      ]
    );

    // ── Dependances entre fonctionnalites ───────────────────
    await insertMany(
      'feature_dependencies',
      ['feature_id', 'depends_on_feature_id', 'dependency_type', 'description', 'created_by'],
      [
        { feature_id: fUsers, depends_on_feature_id: fAuth, dependency_type: 'blocks', description: "La gestion des utilisateurs suppose l'authentification", created_by: chefId },
        { feature_id: fDash, depends_on_feature_id: fUsers, dependency_type: 'relates_to', description: 'Le tableau de bord agrege les comptes', created_by: chefId },
        { feature_id: fSync, depends_on_feature_id: fNav, dependency_type: 'blocks', description: 'La synchro suppose la navigation mobile', created_by: chef2Id },
        { feature_id: fRefund, depends_on_feature_id: fPay, dependency_type: 'blocks', description: 'Le remboursement suppose le paiement', created_by: chef2Id },
      ]
    );

    // ── Executions ──────────────────────────────────────────
    const ex = await insertMany(
      'test_executions',
      ['test_case_id', 'campaign_id', 'executed_by', 'result', 'execution_date', 'duration_seconds', 'environment', 'notes', 'expected_behavior', 'actual_behavior'],
      [
        { test_case_id: t1, campaign_id: campSocle, executed_by: testeurId, result: 'passed', execution_date: '2026-04-05T09:15:00Z', duration_seconds: 90, environment: 'ATLAS-RECETTE', notes: 'Connexion nominale OK', expected_behavior: 'Acces au tableau de bord', actual_behavior: 'Acces conforme' },
        { test_case_id: t2, campaign_id: campSocle, executed_by: testeurId, result: 'passed', execution_date: '2026-04-05T09:25:00Z', duration_seconds: 45, environment: 'ATLAS-RECETTE', notes: 'Message clair', expected_behavior: "Message d'erreur", actual_behavior: 'Message affiche' },
        { test_case_id: t3, campaign_id: campSocle, executed_by: testeurId, result: 'passed', execution_date: '2026-04-05T09:35:00Z', duration_seconds: 60, environment: 'ATLAS-RECETTE', notes: 'Verrouillage effectif', expected_behavior: 'Compte verrouille', actual_behavior: 'Compte verrouille' },
        { test_case_id: t4, campaign_id: campSocle, executed_by: testeurId, result: 'passed', execution_date: '2026-04-11T09:00:00Z', duration_seconds: 180, environment: 'ATLAS-RECETTE', notes: 'Creation OK', expected_behavior: 'Compte cree', actual_behavior: 'Compte cree' },
        { test_case_id: t5, campaign_id: campSocle, executed_by: testeurId, result: 'failed', execution_date: '2026-04-11T09:30:00Z', duration_seconds: 120, environment: 'ATLAS-RECETTE', notes: 'Le compte reste actif apres desactivation', expected_behavior: 'Compte inactive', actual_behavior: 'Session encore active' },
        { test_case_id: t6, campaign_id: campSocle, executed_by: testeurId, result: 'blocked', execution_date: '2026-04-11T10:00:00Z', duration_seconds: 60, environment: 'ATLAS-RECETTE', notes: 'Bloque par anomalie liee au filtre', expected_behavior: 'Liste filtree', actual_behavior: 'Filtre inactif' },
        { test_case_id: t7, campaign_id: campSocle, executed_by: testeurId, result: 'passed', execution_date: '2026-04-12T14:00:00Z', duration_seconds: 90, environment: 'ATLAS-RECETTE', notes: 'KPI affiches en 1,4 s', expected_behavior: 'Affichage < 2 s', actual_behavior: 'Affichage en 1,4 s' },
        { test_case_id: t8, campaign_id: campSocle, executed_by: testeurId, result: 'passed', execution_date: '2026-04-12T14:20:00Z', duration_seconds: 75, environment: 'ATLAS-RECETTE', notes: 'Filtre OK', expected_behavior: 'KPI filtres', actual_behavior: 'KPI filtres' },
        { test_case_id: t14, campaign_id: campRegression, executed_by: testeurId, result: 'passed', execution_date: '2026-01-25T09:00:00Z', duration_seconds: 60, environment: 'ATLAS-PROD', notes: 'Aucune regression', expected_behavior: 'Connexion OK', actual_behavior: 'Connexion OK' },
        { test_case_id: t15, campaign_id: campRegression, executed_by: testeurId, result: 'passed', execution_date: '2026-01-25T09:15:00Z', duration_seconds: 45, environment: 'ATLAS-PROD', notes: 'Deconnexion OK', expected_behavior: 'Session fermee', actual_behavior: 'Session fermee' },
        { test_case_id: t16, campaign_id: campPaiement, executed_by: testeurId, result: 'passed', execution_date: '2026-04-20T10:00:00Z', duration_seconds: 150, environment: 'BOUTIQUE-RECETTE', notes: 'Paiement accepte', expected_behavior: 'Paiement accepte', actual_behavior: 'Paiement accepte' },
        { test_case_id: t17, campaign_id: campPaiement, executed_by: ryanId, result: 'failed', execution_date: '2026-04-20T10:30:00Z', duration_seconds: 140, environment: 'BOUTIQUE-RECETTE', notes: 'Message derreur generique au refus 3-D Secure', expected_behavior: 'Message explicite', actual_behavior: 'Erreur generique' },
        { test_case_id: t18, campaign_id: campPaiement, executed_by: ryanId, result: 'passed', execution_date: '2026-04-22T11:00:00Z', duration_seconds: 180, environment: 'BOUTIQUE-RECETTE', notes: 'Remboursement OK', expected_behavior: 'Rembourse', actual_behavior: 'Rembourse' },
      ]
    );

    // ── Preuves ─────────────────────────────────────────────
    await insertMany(
      'evidence',
      ['entity_type', 'entity_id', 'file_path', 'file_name', 'file_type', 'file_size', 'description', 'uploaded_by'],
      [
        { entity_type: 'test_execution', entity_id: ex[0], file_path: 'demo/executions/t1-capture.png', file_name: 't1-connexion.png', file_type: 'image/png', file_size: '184320', description: JSON.stringify({ name: 'Capture connexion', type: 'capture' }), uploaded_by: testeurId },
        { entity_type: 'test_execution', entity_id: ex[4], file_path: 'demo/executions/t5-capture.png', file_name: 't5-desactivation.png', file_type: 'image/png', file_size: '204800', description: JSON.stringify({ name: 'Capture anomalie desactivation', type: 'capture' }), uploaded_by: testeurId },
        { entity_type: 'test_execution', entity_id: ex[10], file_path: 'demo/executions/t16-capture.png', file_name: 't16-paiement.png', file_type: 'image/png', file_size: '223104', description: JSON.stringify({ name: 'Capture paiement CB', type: 'capture' }), uploaded_by: testeurId },
        { entity_type: 'feature', entity_id: fAuth, file_path: 'demo/features/auth-spec.pdf', file_name: 'spec-authentification.pdf', file_type: 'application/pdf', file_size: '524288', description: JSON.stringify({ name: 'Cahier de recette authentification', type: 'cahier_de_recette' }), uploaded_by: chefId },
        { entity_type: 'campaign', entity_id: campSocle, file_path: 'demo/campaigns/plan-recette.pdf', file_name: 'plan-recette-v1.1.pdf', file_type: 'application/pdf', file_size: '312320', description: JSON.stringify({ name: 'Plan de recette v1.1', type: 'plan' }), uploaded_by: chefId },
        { entity_type: 'product', entity_id: atlasId, file_path: 'demo/products/atlas-doc.pdf', file_name: 'atlas-documentation.pdf', file_type: 'application/pdf', file_size: '512000', description: JSON.stringify({ name: 'Documentation produit Atlas', type: 'documentation' }), uploaded_by: adminId },
        { entity_type: 'project', entity_id: projSocleId, file_path: 'demo/projects/socle-plan.pdf', file_name: 'plan-projet-socle.pdf', file_type: 'application/pdf', file_size: '256000', description: JSON.stringify({ name: 'Plan projet Socle', type: 'plan' }), uploaded_by: adminId },
        { entity_type: 'requirement', entity_id: rPci, file_path: 'demo/requirements/pci.pdf', file_name: 'exigence-pci-dss.pdf', file_type: 'application/pdf', file_size: '128000', description: JSON.stringify({ name: 'Exigence PCI-DSS', type: 'exigence' }), uploaded_by: adminId },
        { entity_type: 'feature', entity_id: fSync, file_path: 'demo/features/sync-capture.mp4', file_name: 'sync-demo.mp4', file_type: 'video/mp4', file_size: '10485760', description: JSON.stringify({ name: 'Video demonstration synchro', type: 'video' }), uploaded_by: testeurId },
      ]
    );

    // ── Anomalies ───────────────────────────────────────────
    const an = await insertMany(
      'anomalies',
      ['feature_id', 'campaign_id', 'test_case_id', 'description', 'reported_by', 'assigned_to', 'status', 'resolution_description', 'correction_due_date'],
      [
        { feature_id: fUsers, campaign_id: campSocle, test_case_id: t5, description: 'Le compte desactive reste connecte jusqu a expiration du jeton', reported_by: testeurId, assigned_to: devId, status: 'resolution_signaled', resolution_description: 'Invalidation des jetons a la desactivation', correction_due_date: '2026-04-30T00:00:00Z' },
        { feature_id: fPay, campaign_id: campPaiement, test_case_id: t17, description: 'Le refus 3-D Secure affiche une erreur generique non explicite', reported_by: ryanId, assigned_to: devId, status: 'in_progress', resolution_description: null, correction_due_date: '2026-05-10T00:00:00Z' },
        { feature_id: fDash, campaign_id: campSocle, test_case_id: t7, description: 'Les KPI ne se rafraichissent pas apres changement de periode', reported_by: testeurId, assigned_to: devId, status: 'new', resolution_description: null, correction_due_date: null },
        { feature_id: fSync, campaign_id: campMobile, test_case_id: t12, description: 'Des observations sont perdues en cas de fermeture brutale de l application', reported_by: testeurId, assigned_to: null, status: 'new', resolution_description: null, correction_due_date: null },
        { feature_id: fUsers, campaign_id: campSocle, test_case_id: null, description: 'Le filtre de recherche est sensible a la casse', reported_by: testeurId, assigned_to: devId, status: 'validated', resolution_description: 'Comparaison insensible a la casse', correction_due_date: null },
        { feature_id: fAuth, campaign_id: campSocle, test_case_id: t2, description: 'Le message derreur de connexion saffiche en anglais', reported_by: chef2Id, assigned_to: devId, status: 'rejected', resolution_description: 'Comportement conforme au jeu de donnees de test', correction_due_date: null },
      ]
    );
    const aDesact = an[0];
    const a3ds = an[1];
    const aSync = an[3];

    // ── Commentaires d'anomalie ─────────────────────────────
    await insertMany(
      'anomaly_comments',
      ['anomaly_id', 'user_id', 'message'],
      [
        { anomaly_id: aDesact, user_id: testeurId, message: 'Reproduit sur ATLAS-RECETTE avec un compte admin' },
        { anomaly_id: aDesact, user_id: devId, message: 'Correction deployee, en attente de validation' },
        { anomaly_id: a3ds, user_id: ryanId, message: 'Le refus affiche une erreur 500 cote interface' },
        { anomaly_id: a3ds, user_id: devId, message: 'Analyse en cours avec le prestataire bancaire' },
        { anomaly_id: aSync, user_id: testeurId, message: 'Reproduit sur Android 11 uniquement' },
      ]
    );

    // ── Incidents ───────────────────────────────────────────
    await insertMany(
      'incidents',
      ['title', 'description', 'steps_to_reproduce', 'expected_behavior', 'actual_behavior', 'severity', 'status', 'feature_id', 'campaign_id', 'anomaly_id', 'test_execution_id', 'reported_by', 'assigned_to', 'environment', 'version_affected', 'fix_version', 'resolution_notes'],
      [
        { title: 'Fuite memoire a la deconnexion', description: 'La session n est pas correctement liberee apres deconnexion', steps_to_reproduce: 'Se connecter puis se deconnecter plusieurs fois', expected_behavior: 'La memoire est liberee', actual_behavior: 'La memoire augmente a chaque cycle', severity: 'majeur', status: 'corrige', feature_id: fAuth, campaign_id: campSocle, anomaly_id: null, test_execution_id: ex[0], reported_by: testeurId, assigned_to: devId, environment: 'ATLAS-RECETTE', version_affected: '1.1.0', fix_version: '1.1.1', resolution_notes: 'Correction du cycle de vie de la session' },
        { title: 'Indisponibilite de l environnement de recette', description: 'Environnement indisponible pendant 2 heures', steps_to_reproduce: 'Ouvrir ATLAS-RECETTE', expected_behavior: 'Environnement disponible', actual_behavior: 'Erreur 502', severity: 'bloquant', status: 'ferme', feature_id: null, campaign_id: campSocle, anomaly_id: null, test_execution_id: null, reported_by: chefId, assigned_to: devId, environment: 'ATLAS-RECETTE', version_affected: 'N/A', fix_version: 'N/A', resolution_notes: 'Redemarrage de l infrastructure' },
        { title: 'Regression sur le calcul des remboursements', description: 'Le remboursement partiel calcule un montant errone', steps_to_reproduce: 'Demander un remboursement partiel de 10 EUR', expected_behavior: '10 EUR rembourses', actual_behavior: 'Le montant total est rembourse', severity: 'critique', status: 'en_cours', feature_id: fRefund, campaign_id: campPaiement, anomaly_id: null, test_execution_id: ex[12], reported_by: ryanId, assigned_to: devId, environment: 'BOUTIQUE-RECETTE', version_affected: '2.0.0', fix_version: null, resolution_notes: null },
      ]
    );

    // ── Points a surveiller ─────────────────────────────────
    await insertMany(
      'watch_points',
      ['campaign_id', 'feature_id', 'title', 'description', 'criticality', 'status', 'owner_id', 'created_by'],
      [
        { campaign_id: campSocle, feature_id: fSync, title: 'Fiabilite de la synchronisation hors-ligne', description: 'Aucune perte de donnee ne doit survenir lors des coupures reseau', criticality: 'high', status: 'open', owner_id: testeurId, created_by: chefId },
        { campaign_id: campPaiement, feature_id: fPay, title: 'Securite du paiement', description: 'Verifier l absence de stockage de donnees carte et le bon fonctionnement du 3-D Secure', criticality: 'critical', status: 'validated', owner_id: ryanId, created_by: chef2Id },
        { campaign_id: campSocle, feature_id: fDash, title: 'Performance du tableau de bord', description: 'Surveiller le temps de reponse sous charge', criticality: 'medium', status: 'open', owner_id: chef2Id, created_by: chefId },
        { campaign_id: campMobile, feature_id: fNav, title: 'Compatibilite anciens Android', description: 'Verifier le rendu sur Android 8 et 9', criticality: 'high', status: 'failed', owner_id: ryanId, created_by: chef2Id },
      ]
    );

    // ── Decisions go-live ───────────────────────────────────
    await insertMany(
      'go_live_decisions',
      ['release_ref', 'verdict', 'decider', 'justification', 'checklist_completion', 'decided_at', 'created_by'],
      [
        { release_ref: String(rel100), verdict: 'GO', decider: 'Comite Qualite', justification: 'Toutes les exigences critiques validees', checklist_completion: 100, decided_at: '2026-01-19', created_by: adminId },
        { release_ref: String(rel110), verdict: 'GO_CONDITIONNEL', decider: 'Comite Qualite', justification: 'Deux anomalies mineures a corriger avant mise en production', checklist_completion: 80, decided_at: '2026-05-14', created_by: adminId },
        { release_ref: String(rel200), verdict: 'AJOURNE', decider: 'Comite Qualite', justification: 'Regression sur le calcul des remboursements', checklist_completion: 55, decided_at: '2026-05-28', created_by: adminId },
      ]
    );

    // ── Checklist go-live (template standard gl-1..gl-9) ────
    const CHECKLIST_TEMPLATE = [
      { key: 'gl-1', label: "Taux d'exécution des campagnes ≥ 95 %", weight: 15 },
      { key: 'gl-2', label: 'Taux de succès global ≥ 90 %', weight: 15 },
      { key: 'gl-3', label: 'Aucun test critique en échec', weight: 20 },
      { key: 'gl-4', label: 'Aucune anomalie de gravité haute ouverte', weight: 15 },
      { key: 'gl-5', label: 'Couverture fonctionnelle ≥ 90 %', weight: 10 },
      { key: 'gl-6', label: 'Tests de sécurité exécutés et validés', weight: 10 },
      { key: 'gl-7', label: 'Tests de performance conformes aux seuils', weight: 5 },
      { key: 'gl-8', label: 'Plan de rollback documenté', weight: 5 },
      { key: 'gl-9', label: 'Points à surveiller critiques tous clos', weight: 5 },
    ];
    const checklistRows = [];
    const buildChecklist = (releaseRef, checkedKeys) =>
      CHECKLIST_TEMPLATE.forEach((item, index) => {
        checklistRows.push({
          release_ref: String(releaseRef),
          template_key: item.key,
          label: item.label,
          weight: item.weight,
          is_checked: checkedKeys.includes(item.key),
          sort_order: index + 1,
          created_by: adminId,
        });
      });
    buildChecklist(rel100, CHECKLIST_TEMPLATE.map((i) => i.key));
    buildChecklist(rel110, ['gl-1', 'gl-2', 'gl-3', 'gl-5', 'gl-6', 'gl-7', 'gl-8', 'gl-9']);
    buildChecklist(rel200, ['gl-1', 'gl-2', 'gl-5', 'gl-6']);
    await insertMany(
      'go_live_checklist',
      ['release_ref', 'template_key', 'label', 'weight', 'is_checked', 'sort_order', 'created_by'],
      checklistRows
    );

    // ── Regles referentielles ───────────────────────────────
    await insertMany(
      'referential_rules',
      ['id', 'domain', 'label', 'threshold', 'active'],
      [
        { id: 'RG-1', domain: 'Sante', label: 'Produit sain', threshold: '≥ 85/100', active: true },
        { id: 'RG-2', domain: 'Sante', label: 'Produit a surveiller', threshold: '≥ 75/100', active: true },
        { id: 'RG-3', domain: 'Sante', label: 'Produit a risque', threshold: '≥ 60/100', active: true },
        { id: 'RG-4', domain: 'Campagne', label: 'Taux de reussite cible', threshold: '≥ 95 %', active: true },
        { id: 'RG-5', domain: 'Campagne', label: 'Taux de reussite minimal', threshold: '≥ 90 %', active: true },
        { id: 'RG-6', domain: 'Anomalies', label: 'Aucune anomalie bloquante', threshold: '= 0', active: true },
      ]
    );

    // ── Historique ──────────────────────────────────────────
    await insertMany(
      'history_actions',
      ['entity_type', 'entity_id', 'user_id', 'action_type', 'description'],
      [
        { entity_type: 'product', entity_id: atlasId, user_id: adminId, action_type: 'created', description: 'Creation du produit Atlas Qualite' },
        { entity_type: 'project', entity_id: projSocleId, user_id: adminId, action_type: 'created', description: 'Creation du projet Refonte Atlas - Socle' },
        { entity_type: 'campaign', entity_id: campSocle, user_id: chefId, action_type: 'created', description: 'Creation de la campagne Recette v1.1 - Socle Atlas' },
        { entity_type: 'campaign', entity_id: campSocle, user_id: chefId, action_type: 'status_changed', description: 'Passage au statut en cours' },
        { entity_type: 'feature', entity_id: fAuth, user_id: testeurId, action_type: 'updated', description: 'Declaration de la fonctionnalite Authentification conforme' },
        { entity_type: 'anomaly', entity_id: aDesact, user_id: testeurId, action_type: 'created', description: 'Declaration d une anomalie sur la desactivation de compte' },
        { entity_type: 'anomaly', entity_id: a3ds, user_id: devId, action_type: 'status_changed', description: 'Passage de l anomalie 3-D Secure en cours de resolution' },
        { entity_type: 'campaign', entity_id: campRegression, user_id: chefId, action_type: 'status_changed', description: 'Cloture de la campagne de regression v1.0' },
        { entity_type: 'go_live_decision', entity_id: rel100, user_id: adminId, action_type: 'created', description: 'Decision GO pour la version 1.0.0' },
      ]
    );

    // ── Notifications ───────────────────────────────────────
    await insertMany(
      'notifications',
      ['notified_user_id', 'anomaly_id', 'notification_type', 'is_read', 'description', 'link_url'],
      [
        { notified_user_id: devId, anomaly_id: aDesact, notification_type: 'anomaly_reported', is_read: false, description: 'Nouvelle anomalie sur la desactivation de compte', link_url: '/anomalies' },
        { notified_user_id: testeurId, anomaly_id: aDesact, notification_type: 'anomaly_resolved', is_read: false, description: 'Resolution signalee pour l anomalie de desactivation', link_url: '/anomalies' },
        { notified_user_id: devId, anomaly_id: a3ds, notification_type: 'anomaly_reported', is_read: true, description: 'Nouvelle anomalie 3-D Secure', link_url: '/anomalies' },
        { notified_user_id: testeurId, anomaly_id: null, notification_type: 'test_case_assigned', is_read: false, description: 'Un cas de test vous a ete affecte', link_url: '/execution' },
        { notified_user_id: chefId, anomaly_id: null, notification_type: 'campaign_completed', is_read: true, description: 'La campagne Regression v1.0 - Atlas est terminee', link_url: '/campagnes' },
        { notified_user_id: adminId, anomaly_id: null, notification_type: 'go_live_decision', is_read: false, description: 'Decision go-live enregistree pour la version 1.1.0', link_url: '/go-live' },
        { notified_user_id: ryanId, anomaly_id: null, notification_type: 'member_added', is_read: false, description: 'Vous avez ete ajoute a la campagne Recette paiement v2.0', link_url: '/campagnes' },
      ]
    );

    // ── Versions logicielles ────────────────────────────────
    await insertMany(
      'software_versions',
      ['version_number', 'name', 'description', 'campaign_id', 'feature_id', 'status', 'release_date', 'created_by'],
      [
        { version_number: '1.1.0-rc1', name: 'Atlas 1.1.0 RC1', description: 'Version candidate 1 de la refonte du socle', campaign_id: campSocle, feature_id: null, status: 'en_cours_de_test', release_date: '2026-04-01', created_by: adminId },
        { version_number: '1.0.0', name: 'Atlas 1.0.0', description: 'Version 1.0.0 stable', campaign_id: campRegression, feature_id: null, status: 'archivee', release_date: '2026-01-20', created_by: adminId },
        { version_number: '2.0.0-rc1', name: 'Boutique 2.0.0 RC1', description: 'Version candidate paiement', campaign_id: campPaiement, feature_id: fPay, status: 'en_cours_de_test', release_date: '2026-04-15', created_by: adminId },
      ]
    );

    await client.query('COMMIT');
    console.log('Simulation terminee');
    console.log('Comptes de demonstration :');
    console.log('  admin@test.fr    / Admin@DHI2026');
    console.log('  chef@test.fr     / Chef@DHI2026');
    console.log('  chef2@test.fr    / Chef@DHI2026');
    console.log('  testeur@test.fr  / Testeur@DHI2026');
    console.log('  dev@test.fr      / Dev@DHI2026');
    console.log('  jipnangryan237@gmail.com / Ryan@DHI2026');  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Simulation echouee:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

simulate();
