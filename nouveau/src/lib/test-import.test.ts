import { describe, expect, it } from "vitest";
import type { Feature } from "@/lib/dhi-data";
import {
  buildNorTemplate,
  buildTestCsvTemplate,
  detectSeparator,
  parseCsvLine,
  parseCsvRecords,
  parseImportText,
} from "@/lib/test-import";
import { findTesterOption } from "@/lib/access";

const features: Feature[] = [
  {
    id: "f-auth",
    productId: "p1",
    name: "Authentification",
    description: "",
    criticality: "moyenne",
    coverage: {},
    module: "FCT-01",
  },
  {
    id: "f-export",
    productId: "p1",
    name: "Export PDF",
    description: "",
    criticality: "moyenne",
    coverage: {},
    module: "FCT-02",
  },
];

const parse = (text: string) => parseImportText(text, features, "tests.csv");

describe("parseCsvLine", () => {
  it("respecte les guillemets autour du séparateur", () => {
    expect(parseCsvLine('a;"b;c";d')).toEqual(["a", "b;c", "d"]);
  });

  it("double les guillemets échappés", () => {
    expect(parseCsvLine('"a""b";c')).toEqual(['a"b', "c"]);
  });
});

describe("parseImportText — CSV", () => {
  it("parse le modèle canonique sans erreur (guillemets et ||| inclus)", () => {
    const text = [
      "nom;fonctionnalite;criticite;type;testeur;preconditions;steps;resultat_attendu;resultat_obtenu;commentaires",
      '"Test; avec point-virgule";FCT-01;critique;api;Alice;Pré requis 1|||Pré requis 2;Étape 1|||Étape 2;Attendu;Observé;ok',
    ].join("\n");
    const rows = parse(text);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.errors).toEqual([]);
    expect(row.name).toBe("Test; avec point-virgule");
    expect(row.featureId).toBe("f-auth");
    expect(row.criticality).toBe("critique");
    expect(row.type).toBe("api");
    expect(row.tester).toBe("Alice");
    expect(row.preconditions).toEqual(["Pré requis 1", "Pré requis 2"]);
    expect(row.steps).toEqual(["Étape 1", "Étape 2"]);
    expect(row.expected).toEqual(["Attendu"]);
    expect(row.observed).toEqual(["Observé"]);
    expect(row.comment).toBe("ok");
  });

  it("accepte les en-têtes accentués et synonymes (Excel)", () => {
    const text = [
      "Nom;Fonctionnalité;Criticité;Type;Testeur;Préconditions;Étapes;Résultat attendu;Résultat obtenu;Commentaires",
      "Connexion;Export PDF;moyenne;fonctionnel;Bob;;;;;;",
    ].join("\n");
    const rows = parse(text);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.errors).toEqual([]);
    expect(row.name).toBe("Connexion");
    expect(row.featureId).toBe("f-export");
    expect(row.criticality).toBe("moyenne");
    expect(row.tester).toBe("Bob");
  });

  it("signale chaque ligne si la colonne fonctionnalite est absente (aucun repli)", () => {
    const text = ["nom;criticite", "Test 1;haute", "Test 2;basse"].join("\n");
    const rows = parse(text);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.featureId).toBe("");
      expect(row.errors).toContain("Colonne « fonctionnalite » absente de l'en-tête");
    }
    expect(rows[0]!.criticality).toBe("haute");
  });

  it("signale une cellule fonctionnalite vide au lieu de rattacher à la première", () => {
    const text = ["nom;fonctionnalite", "Test;"].join("\n");
    const rows = parse(text);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.featureId).toBe("");
    expect(rows[0]!.errors).toContain("Fonctionnalité vide : renseignez son nom ou son code");
  });

  it("signale une fonctionnalité inconnue sans repli silencieux sur features[0]", () => {
    const text = ["nom;fonctionnalite", "Test;FCT-99"].join("\n");
    const rows = parse(text);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.featureId).toBe("");
    expect(rows[0]!.errors).toContain("Fonctionnalité introuvable : FCT-99");
  });

  it("résout la fonctionnalité par code, par nom et sans tenir de la casse", () => {
    const text = [
      "nom;fonctionnalite",
      "A;FCT-02",
      "B;authentification",
      "C;Export PDF (f-export)",
    ].join("\n");
    const rows = parse(text);
    expect(rows.map((r) => r.featureId)).toEqual(["f-export", "f-auth", "f-export"]);
    expect(rows.flatMap((r) => r.errors)).toEqual([]);
  });

  it("retourne une liste vide sans colonne nom", () => {
    expect(parse("criticite;type\nhaute;api")).toEqual([]);
  });

  it("applique les valeurs par défaut et refuse les valeurs inconnues", () => {
    const defaults = parse(["nom;fonctionnalite", "T;FCT-01"].join("\n"));
    expect(defaults[0]!.criticality).toBe("moyenne");
    expect(defaults[0]!.type).toBe("fonctionnel");
    expect(defaults[0]!.errors).toEqual([]);

    const invalid = parse(
      ["nom;fonctionnalite;criticite;type", "T;FCT-01;urgente;vite"].join("\n"),
    );
    expect(invalid[0]!.criticality).toBe("moyenne");
    expect(invalid[0]!.type).toBe("fonctionnel");
    expect(invalid[0]!.errors).toContain("Criticité invalide: urgente");
    expect(invalid[0]!.errors).toContain("Type invalide: vite");
  });
});

describe("parseImportText — NOR (.txt)", () => {
  it("parse un bloc NOR et résout la fonctionnalité entre parenthèses", () => {
    const nor = [
      "Connexion (f-auth)",
      "",
      "Étapes:",
      "1. Saisir email",
      "2. Cliquer sur Se connecter",
      "",
      "Résultats attendus:",
      "- Redirection OK",
    ].join("\n");
    const rows = parseImportText(nor, features, "cas.txt");
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.errors).toEqual([]);
    expect(row.name).toBe("Connexion (f-auth)");
    expect(row.featureId).toBe("f-auth");
    expect(row.steps).toEqual(["Saisir email", "Cliquer sur Se connecter"]);
    expect(row.expected).toEqual(["Redirection OK"]);
  });
});

describe("parseCsvRecords", () => {
  it("garde une cellule entre guillemets sur plusieurs lignes (Excel Alt+Entrée)", () => {
    const text = 'nom;steps\n"Connexion";"Saisir email\nSaisir mdp"\nExport;Cliquer';
    expect(parseCsvRecords(text)).toEqual([
      ["nom", "steps"],
      ["Connexion", "Saisir email\nSaisir mdp"],
      ["Export", "Cliquer"],
    ]);
  });

  it("détecte le séparateur depuis l'en-tête (; , tabulation)", () => {
    expect(detectSeparator("nom;fonctionnalite")).toBe(";");
    expect(detectSeparator("nom,fonctionnalite")).toBe(",");
    expect(detectSeparator("nom\tfonctionnalite")).toBe("\t");
    expect(detectSeparator("nom")).toBe(";");
  });

  it("ignore les lignes vides et les CRLF", () => {
    expect(parseCsvRecords("a;b\r\n\r\n1;2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseImportText — CSV robuste", () => {
  it("une cellule d'étapes multi-ligne reste un seul test", () => {
    const text = 'nom;fonctionnalite;steps\nConnexion;FCT-01;"Saisir email\nSaisir mdp\nValider"\nExport;FCT-02;Cliquer';
    const rows = parse(text);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.steps).toEqual(["Saisir email", "Saisir mdp", "Valider"]);
    expect(rows.every((r) => r.errors.length === 0)).toBe(true);
  });

  it("accepte un CSV séparé par des virgules", () => {
    const rows = parse("nom,fonctionnalite\nConnexion OK,FCT-01");
    expect(rows).toHaveLength(1);
    expect(rows[0]!.featureId).toBe("f-auth");
  });
});

describe("parseImportText — NOR (.txt) robuste", () => {
  const nor = (text: string) => parseImportText(text, features, "cas.txt");

  it("lit le modèle NOR complet comme un seul test, champs compris", () => {
    const rows = nor(
      [
        "Connexion avec mot de passe valide (FCT-01)",
        "Criticité: critique",
        "Type: fonctionnel",
        "Testeur: Marie Martin",
        "",
        "Préconditions:",
        "- Utilisateur enregistré",
        "",
        "Étapes:",
        "1. Saisir email",
        "2. Valider",
        "",
        "Résultats attendus:",
        "- Redirection",
        "",
        "Résultat obtenu:",
        "- Redirection constatée",
        "",
        "Commentaire:",
        "(optionnel)",
      ].join("\n"),
    );
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.errors).toEqual([]);
    expect(row.featureId).toBe("f-auth");
    expect(row.criticality).toBe("critique");
    expect(row.type).toBe("fonctionnel");
    expect(row.tester).toBe("Marie Martin");
    expect(row.preconditions).toEqual(["Utilisateur enregistré"]);
    expect(row.steps).toEqual(["Saisir email", "Valider"]);
    expect(row.expected).toEqual(["Redirection"]);
    expect(row.observed).toEqual(["Redirection constatée"]);
    expect(row.comment).toBe("(optionnel)");
  });

  it("sépare deux tests consécutifs", () => {
    const rows = nor(
      ["Test un (FCT-01)", "Étapes:", "1. A", "Commentaire:", "rien", "", "Test deux (FCT-02)", "Étapes:", "1. B"].join("\n"),
    );
    expect(rows.map((r) => r.name)).toEqual(["Test un (FCT-01)", "Test deux (FCT-02)"]);
    expect(rows[0]!.steps).toEqual(["A"]);
    expect(rows[0]!.comment).toBe("rien");
    expect(rows[1]!.steps).toEqual(["B"]);
    expect(rows[1]!.featureId).toBe("f-export");
  });

  it("résout une référence imbriquée « Nom (id) » en fin de titre", () => {
    const rows = nor("Connexion (Authentification (f-auth))\nÉtapes:\n1. A");
    expect(rows[0]!.featureId).toBe("f-auth");
    expect(rows[0]!.errors).toEqual([]);
  });

  it("signale une fonctionnalité inconnue ou absente au lieu de la deviner", () => {
    expect(nor("Test X (FCT-99)\nÉtapes:\n1. A")[0]!.errors).toEqual([
      "Fonctionnalité introuvable : FCT-99",
    ]);
    expect(nor("Test sans référence\nÉtapes:\n1. A")[0]!.errors[0]).toMatch(/non indiquée/);
  });
});

describe("modèles d'import des cas de test", () => {
  it("le modèle CSV se réimporte sans erreur, avec les codes de fonctionnalité", () => {
    const rows = parse(buildTestCsvTemplate(features, "testeur@test.fr"));
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.errors.length === 0)).toBe(true);
    expect(rows.map((r) => r.featureId)).toEqual(["f-auth", "f-auth", "f-export"]);
    expect(rows[0]!.steps).toEqual([
      "Saisir l'e-mail",
      "Saisir le mot de passe",
      "Cliquer sur Se connecter",
    ]);
    expect(rows[1]!.steps).toHaveLength(3);
    expect(rows[1]!.type).toBe("securite");
    expect(rows[0]!.tester).toBe("testeur@test.fr");
  });

  it("le modèle CSV n'a plus de colonnes d'exécution", () => {
    const header = buildTestCsvTemplate(features).split("\n")[0]!;
    expect(header).toBe(
      "nom;fonctionnalite;type;criticite;preconditions;etapes;resultat_attendu;testeur",
    );
  });

  it("le modèle TXT se réimporte en deux tests sans erreur", () => {
    const rows = parseImportText(buildNorTemplate(features), features, "modele.txt");
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.errors.length === 0)).toBe(true);
    expect(rows[1]!.criticality).toBe("haute");
  });

  it("accepte encore l'ancien format (||| et « Nom (id) »)", () => {
    const old =
      "nom;fonctionnalite;criticite;type;testeur;preconditions;steps;resultat_attendu;resultat_obtenu;commentaires\n" +
      "Connexion;Authentification (f-auth);critique;fonctionnel;;A|||B;Saisir|||Valider;OK;Conforme;Note";
    const [row] = parse(old);
    expect(row!.errors).toEqual([]);
    expect(row!.featureId).toBe("f-auth");
    expect(row!.steps).toEqual(["Saisir", "Valider"]);
    expect(row!.observed).toEqual(["Conforme"]);
  });
});

describe("findTesterOption", () => {
  const options = [{ id: "4", name: "Testeur Principal" }];
  const users = [
    { id: "4", name: "Testeur Principal", email: "testeur@test.fr", role: "testeur", active: true },
    { id: "9", name: "Autre", email: "autre@test.fr", role: "testeur", active: true },
  ] as never;
  it("retrouve un testeur de la campagne par e-mail ou par nom", () => {
    expect(findTesterOption(options, users, "TESTEUR@test.fr")?.id).toBe("4");
    expect(findTesterOption(options, users, "testeur principal")?.id).toBe("4");
  });
  it("refuse un e-mail hors de la campagne", () => {
    expect(findTesterOption(options, users, "autre@test.fr")).toBeUndefined();
  });
});
