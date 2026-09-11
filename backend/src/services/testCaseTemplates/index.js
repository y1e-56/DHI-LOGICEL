import { BASELINE } from './baseline.js';
import { AUTHENTIFICATION } from './authentification.js';
import { CRUD } from './crud.js';
import { RECHERCHE } from './recherche.js';
import { FORMULAIRE } from './formulaire.js';
import { PAIEMENT } from './paiement.js';
import { NOTIFICATION } from './notification.js';
import { FICHIER } from './fichier.js';
import { API } from './api.js';
import { PERMISSIONS } from './permissions.js';
import { PERFORMANCE } from './performance.js';
import { INTERFACE } from './interface.js';
import { RAPPORT } from './rapport.js';
import { GENERIQUE } from './generique.js';

const SCENARIOS = [
  AUTHENTIFICATION,
  CRUD,
  RECHERCHE,
  FORMULAIRE,
  PAIEMENT,
  NOTIFICATION,
  FICHIER,
  API,
  PERMISSIONS,
  PERFORMANCE,
  INTERFACE,
  RAPPORT,
];

const MAX_CASES = 12;

/**
 * Génère les cas de test pour une fonctionnalité.
 * @param {{ name: string, description?: string, module?: string }} feature
 * @returns {Array<{ name: string, steps: string, expected_result: string, priority: string }>}
 */
export function generateTestCasesForFeature({ name, description = '', module = '' }) {
  const texte = `${module} ${name} ${description}`.toLowerCase();

  const groupes = [];
  for (const scenario of SCENARIOS) {
    const correspond = scenario.keywords.some(kw => texte.includes(kw));
    if (correspond) {
      groupes.push(scenario);
      if (groupes.length >= 2) break;
    }
  }
  if (groupes.length === 0) {
    groupes.push(GENERIQUE);
  }

  const cases = [];
  const seen = new Set();

  const ajouter = (tc) => {
    if (cases.length >= MAX_CASES) return;
    const libelle = tc.name;
    if (seen.has(libelle)) return;
    seen.add(libelle);
    cases.push({
      name: libelle.replace('{feature}', name),
      steps: tc.steps.replace(/\{feature\}/g, name),
      expected_result: tc.expected.replace('{feature}', name),
      priority: tc.priority,
    });
  };

  for (const tc of BASELINE) ajouter(tc);
  for (const groupe of groupes) {
    for (const tc of groupe.cases) ajouter(tc);
  }

  return cases;
}

export default { generateTestCasesForFeature };
