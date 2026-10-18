import { describe, expect, it } from "vitest";
import type { Feature, TestCase } from "@/lib/dhi-data";
import { cellState, requiredTypes, summarizeCoverage } from "@/lib/coverage";

const feature = (id: string, coverage: Feature["coverage"]) =>
  ({ id, productId: "p1", name: id, coverage }) as Feature;
const test = (featureId: string, type: TestCase["type"], verdict: TestCase["verdict"]) =>
  ({ id: `${featureId}-${type}-${verdict}`, featureId, type, verdict }) as TestCase;

const auth = feature("auth", { fonctionnel: true, securite: true, performance: true });
const tests = [
  test("auth", "fonctionnel", "FAIL"),
  test("auth", "fonctionnel", "PASS"),
  test("auth", "securite", "NOT_RUN"),
  test("auth", "regression", "PASS"),
];

describe("cellState", () => {
  it("requis + un cas réussi = couvert", () => {
    expect(cellState(auth, "fonctionnel", tests)).toBe("covered");
  });
  it("requis + cas sans réussite = à risque", () => {
    expect(cellState(auth, "securite", tests)).toBe("at_risk");
  });
  it("requis sans aucun cas = manquant", () => {
    expect(cellState(auth, "performance", tests)).toBe("missing");
  });
  it("non requis : jamais un trou, même sans cas", () => {
    expect(cellState(auth, "endurance", tests)).toBe("not_required");
    expect(cellState(auth, "regression", tests)).toBe("extra");
  });
  it("ignore les cas d'une autre fonctionnalité", () => {
    expect(cellState(auth, "performance", [test("export", "performance", "PASS")])).toBe("missing");
  });
});

describe("summarizeCoverage", () => {
  it("ne compte que les types requis, manquants avant à risque", () => {
    const summary = summarizeCoverage([auth], tests);
    expect(summary.required).toBe(3);
    expect(summary.covered).toBe(1);
    expect(summary.rate).toBe(33);
    expect(summary.gaps.map((g) => `${g.type}:${g.state}`)).toEqual([
      "performance:missing",
      "securite:at_risk",
    ]);
  });

  it("taux nul (null) quand aucun type n'est requis", () => {
    expect(summarizeCoverage([feature("vide", {})], tests).rate).toBeNull();
  });
});

describe("requiredTypes", () => {
  it("ne garde que les types requis par au moins une fonctionnalité, dans l'ordre", () => {
    expect(requiredTypes([auth, feature("export", { regression: true })])).toEqual([
      "fonctionnel",
      "regression",
      "securite",
      "performance",
    ]);
  });
});
