import { describe, expect, it } from "vitest";
import type { Campaign, TestCase, Verdict } from "@/lib/dhi-data";
import { projectProgress } from "./progress";

const campaigns: Campaign[] = [
  { id: "c1", projectId: "p1" },
  { id: "c2", projectId: "p1" },
  { id: "c3", projectId: "other" },
] as unknown as Campaign[];

const test = (campaignId: string, verdict: Verdict) =>
  ({ campaignId, verdict }) as unknown as TestCase;

describe("projectProgress", () => {
  it("retourne 0 sans campagne ni test", () => {
    expect(projectProgress([], [], "p1")).toBe(0);
    expect(projectProgress([], campaigns, "p1")).toBe(0);
    expect(projectProgress([test("c1", "PASS")], [], "p1")).toBe(0);
  });

  it("calcule le taux d'exécution des tests applicables", () => {
    const tests = [test("c1", "PASS"), test("c1", "NOT_RUN"), test("c2", "NOT_APPLICABLE")];
    // applicable = PASS + NOT_RUN (hors NOT_APPLICABLE), exécuté = 1/2
    expect(projectProgress(tests, campaigns, "p1")).toBe(50);
  });

  it("compte BLOCKED et FAIL comme exécutés", () => {
    const tests = [test("c1", "FAIL"), test("c2", "BLOCKED")];
    expect(projectProgress(tests, campaigns, "p1")).toBe(100);
  });

  it("ignore les tests des campagnes d'un autre projet", () => {
    const tests = [test("c3", "NOT_RUN"), test("c1", "PASS")];
    expect(projectProgress(tests, campaigns, "p1")).toBe(100);
  });

  it("arrondit à l'entier le plus proche", () => {
    const tests = [test("c1", "PASS"), test("c1", "PASS"), test("c1", "NOT_RUN")];
    expect(projectProgress(tests, campaigns, "p1")).toBe(67);
  });
});
