import { describe, it, expect } from "vitest";
import { decodeText, fileExtension, rowsToCsv, textToRows } from "@/lib/import-file";

describe("fileExtension", () => {
  it("renvoie l'extension en minuscules", () => {
    expect(fileExtension("Modele.XLSX")).toBe("xlsx");
    expect(fileExtension("plan de recette.pdf")).toBe("pdf");
    expect(fileExtension("tests-nor.txt")).toBe("txt");
  });

  it("renvoie une chaîne vide sans extension", () => {
    expect(fileExtension("sans-extension")).toBe("");
  });
});

describe("rowsToCsv", () => {
  it("joint les cellules avec le séparateur attendu", () => {
    expect(
      rowsToCsv([
        ["a", "b"],
        ["c", "d"],
      ]),
    ).toBe("a;b\nc;d");
  });

  it("échappe les cellules contenant le séparateur, un guillemet ou un saut de ligne", () => {
    expect(rowsToCsv([["a;b", 'il a dit "oui"', "l1\nl2"]])).toBe(
      '"a;b";"il a dit ""oui""";"l1\nl2"',
    );
  });
});

describe("textToRows", () => {
  it("coupe sur les tabulations", () => {
    expect(textToRows("code\tnom\nF1\tConnexion")).toEqual([
      ["code", "nom"],
      ["F1", "Connexion"],
    ]);
  });

  it("coupe sur les groupes de deux espaces et plus", () => {
    expect(textToRows("titre   priorite\nConnexion   haute")).toEqual([
      ["titre", "priorite"],
      ["Connexion", "haute"],
    ]);
  });

  it("renvoie un tableau vide si aucune colonne n'est détectable", () => {
    expect(textToRows("Préconditions:\n- utilisateur enregistré")).toEqual([]);
  });
});

describe("decodeText", () => {
  it("lit l'UTF-8 tel quel", () => {
    const buffer = new TextEncoder().encode("Criticité;Étapes").buffer;
    expect(decodeText(buffer)).toBe("Criticité;Étapes");
  });

  it("relit en Windows-1252 un CSV Excel ANSI (accents conservés)", () => {
    // « Criticité » en Windows-1252 : é = 0xE9, invalide seul en UTF-8.
    const bytes = new Uint8Array([0x43, 0x72, 0x69, 0x74, 0x69, 0x63, 0x69, 0x74, 0xe9]);
    expect(decodeText(bytes.buffer)).toBe("Criticité");
  });
});
