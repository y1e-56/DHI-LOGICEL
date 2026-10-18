import { describe, expect, it } from "vitest";
import type { Feature } from "@/lib/dhi-data";
import { buildRequirementTemplate, parseRequirementImport } from "@/lib/requirement-import";

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
  {
    id: "f-dash",
    productId: "p1",
    name: "Tableau de bord",
    description: "",
    criticality: "moyenne",
    coverage: {},
    module: "FCT-03",
  },
];

describe("parseRequirementImport", () => {
  it("rejoue le modèle généré sans erreur ni colonne manquante", () => {
    const result = parseRequirementImport(buildRequirementTemplate(), features);
    expect(result.missingColumns).toEqual([]);
    expect(result.rows).toHaveLength(6);
    expect(result.rows.every((r) => r.errors.length === 0)).toBe(true);

    const first = result.rows[0]!;
    expect(first.title).toBe("Connexion par mot de passe");
    expect(first.featureIds).toEqual(["f-auth"]);
    expect(first.category).toBe("securite");
    expect(first.priority).toBe("haute");
    expect(first.status).toBe("validee");

    const multi = result.rows[4]!;
    expect(multi.title).toBe("Horodatage des exports");
    expect(multi.featureIds).toEqual(["f-export", "f-dash"]);

    const noFeature = result.rows[5]!;
    expect(noFeature.title).toBe("Journalisation des accès");
    expect(noFeature.featureIds).toEqual([]);
    expect(noFeature.errors).toEqual([]);
  });

  it("accepte les en-têtes accentués et synonymes", () => {
    const text = [
      "Titre;Description;Fonctionnalités;Catégorie;Priorité;Statut",
      "Exigence X;;FCT-01;sécurité;Élevée;Validée",
    ].join("\n");
    const result = parseRequirementImport(text, features);
    expect(result.missingColumns).toEqual([]);
    const row = result.rows[0]!;
    expect(row.errors).toEqual([]);
    expect(row.title).toBe("Exigence X");
    expect(row.featureIds).toEqual(["f-auth"]);
    expect(row.category).toBe("securite");
    expect(row.priority).toBe("haute");
    expect(row.status).toBe("validee");
  });

  it("résout par code CDC, par identifiant et au format « Nom (id) »", () => {
    const text = ["titre;fonctionnalites", "A;FCT-02", "B;f-dash", "C;Export PDF (f-export)"].join(
      "\n",
    );
    const result = parseRequirementImport(text, features);
    expect(result.rows.map((r) => r.featureIds)).toEqual([["f-export"], ["f-dash"], ["f-export"]]);
    expect(result.rows.flatMap((r) => r.errors)).toEqual([]);
  });

  it("signale une fonctionnalité inconnue sans rattachement silencieux", () => {
    const result = parseRequirementImport("titre;fonctionnalites\nExigence;ZZZ-99", features);
    const row = result.rows[0]!;
    expect(row.featureIds).toEqual([]);
    expect(row.unknownFeatures).toEqual(["ZZZ-99"]);
    expect(row.errors).toContain("Fonctionnalité(s) introuvable(s) : ZZZ-99");
  });

  it("remonte la colonne titre manquante", () => {
    const result = parseRequirementImport("description;priorite\ntexte;haute", features);
    expect(result.missingColumns).toContain("titre");
    expect(result.missingColumns).not.toContain("priorite");
  });

  it("refuse catégorie, priorité et statut inconnus", () => {
    const text = ["titre;categorie;priorite;statut", "X;foo;urgente;perdu"].join("\n");
    const row = parseRequirementImport(text, features).rows[0]!;
    expect(row.category).toBe("");
    expect(row.priority).toBe("moyenne");
    expect(row.status).toBe("brouillon");
    expect(row.errors).toContain("Catégorie inconnue : foo");
    expect(row.errors).toContain("Priorité inconnue : urgente");
    expect(row.errors).toContain("Statut inconnu : perdu");
  });

  it("applique les défauts si priorité et statut sont vides", () => {
    const row = parseRequirementImport("titre;priorite\nX;", features).rows[0]!;
    expect(row.priority).toBe("moyenne");
    expect(row.status).toBe("brouillon");
    expect(row.errors).toEqual([]);
  });

  it("traite un fichier sans données", () => {
    expect(parseRequirementImport("", features)).toEqual({
      rows: [],
      missingColumns: ["titre"],
      totalLines: 0,
    });
    expect(parseRequirementImport("titre;description", features)).toEqual({
      rows: [],
      missingColumns: ["titre"],
      totalLines: 0,
    });
  });
});
