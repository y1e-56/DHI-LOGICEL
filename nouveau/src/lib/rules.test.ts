import { describe, expect, it } from "vitest";
import type { ReferentialRule } from "@/lib/dhi-data";
import { evaluateRule, formatThreshold, thresholdLabel } from "@/lib/rules";

const rule = (over: Partial<ReferentialRule> = {}): ReferentialRule => ({
  id: "RG-4",
  domain: "Campagne",
  label: "Taux d'exécution minimal avant clôture",
  threshold: "≥ 95 %",
  active: true,
  value: 95,
  unit: "percent",
  comparator: "gte",
  mode: "warning",
  ...over,
});

describe("rules (miroir du moteur serveur)", () => {
  it("formate les seuils comme le serveur", () => {
    expect(formatThreshold({ value: 95, unit: "percent", comparator: "gte" })).toBe("≥ 95 %");
    expect(formatThreshold({ value: 7, unit: "days", comparator: "lte" })).toBe("≤ 7 jours");
    expect(formatThreshold({ value: 85, unit: "score", comparator: "gte" })).toBe("≥ 85/100");
    expect(formatThreshold({ value: 0, unit: "count", comparator: "lte" })).toBe("≤ 0");
  });

  it("retombe sur le texte historique sans seuil structuré", () => {
    expect(thresholdLabel(rule({ value: null, threshold: "100 %, types obligatoires" }))).toBe(
      "100 %, types obligatoires",
    );
  });

  it("évalue une valeur mesurée et produit le même message que le serveur", () => {
    const v = evaluateRule(rule(), 67)!;
    expect(v.ok).toBe(false);
    expect(v.message).toBe("RG-4 — Taux d'exécution minimal avant clôture : 67 % (attendu ≥ 95 %)");
    expect(evaluateRule(rule(), 95)!.ok).toBe(true);
    expect(evaluateRule(rule({ comparator: "lte", value: 0, unit: "count" }), 1)!.ok).toBe(false);
  });

  it("ignore une règle inactive ou sans seuil", () => {
    expect(evaluateRule(rule({ active: false }), 1)).toBeNull();
    expect(evaluateRule(rule({ value: null }), 1)).toBeNull();
    expect(evaluateRule(undefined, 1)).toBeNull();
  });
});
