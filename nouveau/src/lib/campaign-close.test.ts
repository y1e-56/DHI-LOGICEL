import { describe, expect, it } from "vitest";
import type { ReferentialRule, RuleMode, TestCase } from "@/lib/dhi-data";
import { campaignCloseCheck, campaignCoverageVerdicts, campaignRatesOf } from "@/lib/campaign-close";
import type { Feature } from "@/lib/dhi-data";

const tc = (verdict: TestCase["verdict"]) => ({ verdict }) as TestCase;
const rule = (id: string, value: number, mode: RuleMode): ReferentialRule => ({
  id,
  domain: "Campagne",
  label: id === "RG-4" ? "Taux d'exécution minimal avant clôture" : "Taux de succès minimal",
  threshold: "",
  active: true,
  value,
  unit: "percent",
  comparator: "gte",
  mode,
});

describe("campaignRatesOf (miroir serveur)", () => {
  it("exécution sur le total, succès sur les exécutés applicables", () => {
    const rates = campaignRatesOf(
      [tc("PASS"), tc("PASS_WITH_RESERVATION"), tc("FAIL"), tc("NOT_APPLICABLE"), tc("NOT_RUN"), tc("NOT_RUN")],
    );
    expect(rates.executionRate).toBe(66.7);
    expect(rates.successRate).toBe(66.7);
    expect(campaignRatesOf([]).executionRate).toBeNull();
  });
});

describe("campaignCloseCheck", () => {
  const list = [tc("PASS"), tc("FAIL"), tc("NOT_RUN")];

  it("règle bloquante non respectée → refus", () => {
    const check = campaignCloseCheck(list, 0, [rule("RG-4", 95, "blocking"), rule("RG-5", 90, "warning")]);
    expect(check.refused.map((v) => v.id)).toEqual(["RG-4"]);
    expect(check.warnings).toEqual(["RG-5 — Taux de succès minimal : 50 % (attendu ≥ 90 %)"]);
  });

  it("règles en avertissement + anomalies → confirmation, sans refus", () => {
    const check = campaignCloseCheck(list, 2, [rule("RG-4", 95, "warning"), rule("RG-5", 90, "warning")]);
    expect(check.refused).toEqual([]);
    expect(check.warnings).toHaveLength(3);
    expect(check.warnings[2]).toBe("2 anomalie(s) non validée(s)");
  });

  it("règles respectées ou inactives → ni refus ni confirmation", () => {
    const done = [tc("PASS"), tc("PASS")];
    expect(campaignCloseCheck(done, 0, [rule("RG-4", 95, "blocking")])).toMatchObject({
      refused: [],
      warnings: [],
    });
    const inactive = { ...rule("RG-4", 95, "blocking"), active: false };
    expect(campaignCloseCheck(list, 0, [inactive]).refused).toEqual([]);
  });
});

describe("campaignCoverageVerdicts (RG-6 / RG-7, miroir serveur)", () => {
  const cov = (id: string, value: number, mode: RuleMode, label: string): ReferentialRule => ({
    id,
    domain: "Couverture",
    label,
    threshold: "",
    active: true,
    value,
    unit: "percent",
    comparator: "gte",
    mode,
  });
  const rules = [
    cov("RG-6", 90, "warning", "Couverture fonctionnelle cible"),
    cov("RG-7", 100, "blocking", "Couverture fonctionnalité critique"),
  ];
  const auth = { id: "1", name: "Auth", criticality: "critique", coverage: { fonctionnel: true, securite: true } } as unknown as Feature;
  const exp = { id: "2", name: "Export", criticality: "moyenne", coverage: { fonctionnel: true } } as unknown as Feature;
  const t = (featureId: string, type: TestCase["type"], verdict: TestCase["verdict"]) =>
    ({ featureId, type, verdict }) as TestCase;
  const list = [t("1", "fonctionnel", "PASS"), t("1", "securite", "FAIL"), t("2", "fonctionnel", "PASS")];

  it("RG-6 global puis RG-7 par fonctionnalité critique, mêmes messages que le serveur", () => {
    const verdicts = campaignCoverageVerdicts([auth, exp], list, rules);
    expect(verdicts.map((v) => [v.id, v.ok])).toEqual([
      ["RG-6", false],
      ["RG-7", false],
    ]);
    expect(verdicts[0]!.message).toContain("66,7 %");
    expect(verdicts[1]!.message).toBe(
      "RG-7 — Couverture fonctionnalité critique « Auth » : 50 % (attendu ≥ 100 %)",
    );
  });

  it("intègre la couverture à la clôture : RG-7 bloquante refuse", () => {
    const check = campaignCloseCheck(list, 0, rules, [auth, exp]);
    expect(check.refused.map((v) => v.id)).toEqual(["RG-7"]);
    expect(check.warnings.some((w) => w.startsWith("RG-6"))).toBe(true);
  });
});

