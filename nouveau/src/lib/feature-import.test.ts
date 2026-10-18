import { describe, expect, it } from "vitest";
import { buildFeatureTemplate, parseFeatureImport } from "@/lib/feature-import";

describe("parseFeatureImport", () => {
  it("rejoue le modèle généré sans erreur ni colonne manquante", () => {
    const result = parseFeatureImport(buildFeatureTemplate());
    expect(result.missingColumns).toEqual([]);
    expect(result.totalLines).toBe(4);
    expect(result.rows).toHaveLength(4);
    expect(result.rows.every((r) => r.errors.length === 0)).toBe(true);
    expect(result.duplicatedCodes).toEqual([]);
    expect(result.rows[0]!.code).toBe("FCT-01");
    expect(result.rows[0]!.priority).toBe("haute");
    expect(result.rows[3]!.priority).toBe("basse");
  });

  it("accepte des en-têtes accentués et synonymes", () => {
    const text = ["Référence;Libellé;Détail;Importance", "FCT-09;Upload;Téléversement;Élevée"].join(
      "\n",
    );
    const result = parseFeatureImport(text);
    expect(result.missingColumns).toEqual([]);
    expect(result.rows).toHaveLength(1);
    const row = result.rows[0]!;
    expect(row.errors).toEqual([]);
    expect(row.code).toBe("FCT-09");
    expect(row.name).toBe("Upload");
    expect(row.description).toBe("Téléversement");
    expect(row.priority).toBe("haute");
  });

  it("remonte les colonnes manquantes", () => {
    const result = parseFeatureImport("nom;description\nX;Y");
    expect(result.missingColumns).toContain("code");
    expect(result.missingColumns).toContain("priorite");
    expect(result.missingColumns).not.toContain("nom");
  });

  it("détecte les codes en double", () => {
    const text = ["code;nom", "FCT-01;A", "fct-01;B"].join("\n");
    const result = parseFeatureImport(text);
    expect(result.duplicatedCodes).toEqual(["fct-01"]);
    expect(result.rows[0]!.errors).toContain("Code en double : FCT-01");
    expect(result.rows[1]!.errors).toContain("Code en double : fct-01");
  });

  it("refuse une priorité inconnue mais accepte une priorité vide", () => {
    const unknown = parseFeatureImport(["code;nom;priorite", "F1;X;urgente"].join("\n"));
    expect(unknown.rows[0]!.priority).toBe("moyenne");
    expect(unknown.rows[0]!.errors).toContain("Priorité inconnue : urgente");

    const empty = parseFeatureImport(["code;nom;priorite", "F1;X;"].join("\n"));
    expect(empty.rows[0]!.priority).toBe("moyenne");
    expect(empty.rows[0]!.errors).toEqual([]);
  });

  it("traite un fichier sans données", () => {
    const result = parseFeatureImport("code;nom");
    expect(result.rows).toEqual([]);
    expect(result.missingColumns).toEqual(["nom"]);
    expect(result.totalLines).toBe(0);
  });

  it("une description Excel sur plusieurs lignes reste une seule fonctionnalité", () => {
    const result = parseFeatureImport(
      'code;nom;description;priorite\nFCT-01;Auth;"Ligne 1\nLigne 2";haute\nFCT-02;Export;x;basse',
    );
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]!.description).toBe("Ligne 1\nLigne 2");
    expect(result.rows.every((r) => r.errors.length === 0)).toBe(true);
  });
});
