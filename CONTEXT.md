# CONTEXT — DHI Quality Platform

Glossaire du domaine et du code. Les revues d'architecture et les refactors
utilisent ces termes et aucun autre.

## Domaine

- **Produit** — logiciel suivi dans le portefeuille (nom, propriétaire,
  responsable QA, versions, score qualité).
- **Projet** — version livrée d'un produit (dates, statut, progression,
  leads de test).
- **Campagne** — cycle de recette rattaché à un projet ; statut
  `planifiee | encours | terminee | archivee`.
- **Cas de test** — script exécutable dans une campagne, avec criticité et
  verdict.
- **Exécution** — passage effectif d'un cas de test ; porte le verdict,
  les observations et les preuves.
- **Verdict** — `PASS | PASS_WITH_RESERVATION | FAIL | NOT_RUN`. Un cas est
  **réussi** ssi son verdict est `PASS` ou `PASS_WITH_RESERVATION`.
- **Preuve** — fichier (capture, vidéo, journal) rattaché à une exécution.
- **Anomalie** — defect ouvert sur un cas de test, sévérité
  `bloquant | majeur | mineur | mineur`.

## Formulaires d'entité

- **Formulaire d'entité** — module qui rend, valide et enregistre le
  formulaire d'une entité (produit, projet, …). Une route = chrome
  (AppShell, panneau, retour) + un appel d'`EntityForm`.
- **Schéma de formulaire** — description déclarative d'un formulaire :
  champs, validation zod, valeurs par défaut, `save`, libellés. Une entité =
  un schéma ; ajouter et modifier partagent le même schéma.
- **Moteur de formulaire** — `EntityForm` (`src/lib/forms/engine.tsx`) :
  implémentation unique qui interprète le schéma (rendu des champs, y compris
  les champs spécialisés — `files` (captures) et `members` (membres) —, champs
  conditionnels `when`, erreurs au champ, soumission). Les routes ne
  contiennent plus ni validation, ni mappage backend, ni `toast.error`.
- **Résultat d'enregistrement** — `save` retourne l'id créé (local ou backend) ;
  le moteur le transmet à `onSaved`, qui navigue vers la fiche de l'entité.
- **Mode** — `create` ou `update`. Le schéma adapte titre, valeurs par
  défaut, libellé de soumission et message de succès au mode ; les options
  de listes dérivent du contexte d'exécution. Le titre reçoit aussi
  l'entité (« Modifier le projet — Atlas »), le message de succès les
  valeurs du formulaire (interpolation du nom).
- **Chemin d'écriture** — le moteur calcule `online` (jeton présent et id
  backend valide) et le passe à `save` : le schéma ne teste jamais
  `localStorage`, la bifurcation local/backend vit en un seul endroit.
- **Contexte d'exécution** — `{ mode, t, store, values }` que le moteur
  fournit aux fonctions du schéma (`fields`, `validation`, `title`,
  `submitLabel`, `successMessage`). `values` est le formulaire suivi en
  direct : c'est lui qui permet à une liste d'adapter ses options à la
  sélection courante. `defaults` reçoit les mêmes sources sans `values`
  (`FormInitContext`), puisque le formulaire n'existe pas encore.

## Vocabulaire d'architecture

Module, interface, implémentation, depth, seam, adapter, leverage, locality :
voir `.agents/skills/improve-codebase-architecture/LANGUAGE.md`. Aucun ADR
pour l'instant.
