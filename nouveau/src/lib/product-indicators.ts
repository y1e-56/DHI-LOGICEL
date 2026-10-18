import {
  SCORE_WEIGHTS,
  type Campaign,
  type Defect,
  type Feature,
  type Product,
  type Project,
  type ScoreBreakdown,
  type TestCase,
} from "@/lib/dhi-data";

/** Tranches du store nécessaires au calcul des indicateurs d'un produit. */
export interface ProductIndicatorSources {
  projects: Project[];
  features: Feature[];
  campaigns: Campaign[];
  tests: TestCase[];
  defects: Defect[];
}

/** Indicateurs clés agrégés pour un produit (aperçu rapide / fiche). */
export interface ProductIndicators {
  /** Score pondéré CDC Q = f(R,C,K,I,NF,T,CQ). */
  score: number;
  /** Tests échoués sur les campagnes du produit. */
  failedTests: number;
  /** Anomalies ouvertes (toutes sévérités), hors fermées. */
  openDefects: number;
  /** Anomalies ouvertes de sévérité haute. */
  highSeverityIncidents: number;
  /** Nombre de projets associés au produit (non archivés). */
  associatedProjects: number;
  /** Projets actifs (non archivés), les plus récents d'abord. */
  activeProjects: Project[];
}

function weightedScore(b: ScoreBreakdown): number {
  return Math.round(
    b.results * SCORE_WEIGHTS.results +
      b.coverage * SCORE_WEIGHTS.coverage +
      b.critical * SCORE_WEIGHTS.critical +
      b.incidents * SCORE_WEIGHTS.incidents +
      b.nonFunctional * SCORE_WEIGHTS.nonFunctional +
      b.testability * SCORE_WEIGHTS.testability +
      b.qualityControl * SCORE_WEIGHTS.qualityControl,
  );
}

/** Calcule les indicateurs d'un produit à partir des sources du store. */
export function productIndicators(
  product: Product,
  sources: ProductIndicatorSources,
): ProductIndicators {
  const { projects, features, campaigns, tests, defects } = sources;
  const campaignIds = new Set(campaigns.filter((c) => c.productId === product.id).map((c) => c.id));
  const prodTests = tests.filter((t) => campaignIds.has(t.campaignId));
  const openDefects = defects.filter((d) => d.productId === product.id && d.status !== "fermee");
  const activeProjects = projects
    .filter((p) => p.productId === product.id && !p.isArchived)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return {
    score: weightedScore(product.breakdown),
    failedTests: prodTests.filter((t) => t.verdict === "FAIL").length,
    openDefects: openDefects.length,
    highSeverityIncidents: openDefects.filter((d) => d.severity === "haute").length,
    associatedProjects: activeProjects.length,
    activeProjects,
  };
}
