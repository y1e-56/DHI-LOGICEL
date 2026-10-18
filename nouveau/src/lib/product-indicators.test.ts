import { describe, expect, it } from "vitest";
import type { Campaign, Defect, Feature, Product, Project, TestCase } from "@/lib/dhi-data";
import { productIndicators } from "@/lib/product-indicators";

const product: Product = {
  id: "p1",
  name: "Atlas",
  description: "",
  owner: "A",
  qaLead: "B",
  qaTeam: [],
  versions: ["1.0"],
  score: 0,
  breakdown: {
    results: 80,
    coverage: 80,
    critical: 80,
    incidents: 80,
    nonFunctional: 80,
    testability: 80,
    qualityControl: 80,
  },
  lastUpdate: "2024-01-01",
};

const projects: Project[] = [
  {
    id: "pr-1",
    productId: "p1",
    name: "Projet récent",
    objective: "",
    targetVersion: "1.0",
    status: "encours",
    startDate: "2024-01-15",
    endDate: "2024-06-01",
    manager: "",
    qaLead: "",
  },
  {
    id: "pr-2",
    productId: "p1",
    name: "Projet ancien",
    objective: "",
    targetVersion: "1.0",
    status: "termine",
    startDate: "2023-01-15",
    endDate: "2023-06-01",
    manager: "",
    qaLead: "",
  },
  {
    id: "pr-3",
    productId: "p1",
    name: "Projet archivé",
    objective: "",
    targetVersion: "2.0",
    status: "encours",
    startDate: "2024-02-01",
    endDate: "2024-08-01",
    manager: "",
    qaLead: "",
    isArchived: true,
  },
  {
    id: "pr-x",
    productId: "p-other",
    name: "Autre",
    objective: "",
    targetVersion: "",
    status: "encours",
    startDate: "",
    endDate: "",
    manager: "",
    qaLead: "",
  },
];

const campaigns: Campaign[] = [
  {
    id: "c1",
    productId: "p1",
    projectId: "pr-1",
    name: "Recette 1.0",
    type: "regression",
    version: "1.0",
    environment: "test",
    owner: "",
    status: "encours",
    startDate: "2024-02-01",
    endDate: "2024-05-01",
    testers: [],
  },
  {
    id: "c-other",
    productId: "p-other",
    projectId: "pr-x",
    name: "X",
    type: "",
    version: "",
    environment: "",
    owner: "",
    status: "planifiee",
    startDate: "",
    endDate: "",
    testers: [],
  },
];

const tests: TestCase[] = [
  {
    id: "t1",
    campaignId: "c1",
    featureId: "f1",
    name: "Echec",
    criticality: "haute",
    type: "fonctionnel",
    preconditions: [],
    steps: [],
    expected: [],
    verdict: "FAIL",
    observed: "",
    comment: "",
    evidence: [],
  },
  {
    id: "t2",
    campaignId: "c1",
    featureId: "f1",
    name: "OK",
    criticality: "haute",
    type: "fonctionnel",
    preconditions: [],
    steps: [],
    expected: [],
    verdict: "PASS",
    observed: "",
    comment: "",
    evidence: [],
  },
  {
    id: "t3",
    campaignId: "c-other",
    featureId: "f2",
    name: "Echec autre",
    criticality: "haute",
    type: "fonctionnel",
    preconditions: [],
    steps: [],
    expected: [],
    verdict: "FAIL",
    observed: "",
    comment: "",
    evidence: [],
  },
];

const defects: Defect[] = [
  {
    id: "d1",
    productId: "p1",
    campaignId: "c1",
    title: "Ouvert haute",
    description: "",
    severity: "haute",
    priority: "haute",
    status: "nouvelle",
    featureId: "f1",
    version: "1.0",
    reporter: "",
    assignee: "",
    createdAt: "",
    targetDate: "",
  },
  {
    id: "d2",
    productId: "p1",
    campaignId: "c1",
    title: "Ouvert moyenne",
    description: "",
    severity: "moyenne",
    priority: "moyenne",
    status: "nouvelle",
    featureId: "f1",
    version: "1.0",
    reporter: "",
    assignee: "",
    createdAt: "",
    targetDate: "",
  },
  {
    id: "d3",
    productId: "p1",
    campaignId: "c1",
    title: "Fermé haute",
    description: "",
    severity: "haute",
    priority: "haute",
    status: "fermee",
    featureId: "f1",
    version: "1.0",
    reporter: "",
    assignee: "",
    createdAt: "",
    targetDate: "",
  },
];

describe("productIndicators", () => {
  const ind = productIndicators(product, {
    projects,
    features: [],
    campaigns,
    tests,
    defects,
  });

  it("calcule le score pondéré", () => {
    expect(ind.score).toBe(80);
  });

  it("compte les tests échoués des campagnes du produit uniquement", () => {
    expect(ind.failedTests).toBe(1);
  });

  it("compte les anomalies ouvertes et les incidents haute sévérité", () => {
    expect(ind.openDefects).toBe(2);
    expect(ind.highSeverityIncidents).toBe(1);
  });

  it("exclut les projets archivés et trie par début de projet décroissant", () => {
    expect(ind.associatedProjects).toBe(2);
    expect(ind.activeProjects.map((p) => p.id)).toEqual(["pr-1", "pr-2"]);
  });
});
