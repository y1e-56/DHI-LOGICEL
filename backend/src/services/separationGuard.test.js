import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../middleware/errorHandler.js';
import {
  assertCanJudgeAnomaly,
  assertCanRecordVerdict,
  assertCanReexecute,
} from './separationGuard.js';

describe('separationGuard — séparation des responsabilités (CDC §5)', () => {
  describe('assertCanJudgeAnomaly', () => {
    test('autorise un autre membre à valider la résolution', () => {
      assert.doesNotThrow(() =>
        assertCanJudgeAnomaly({ resolvedBy: 1, actorId: 2, status: 'validated' })
      );
    });

    test('bloque l\'auteur qui valide sa propre résolution (403)', () => {
      assert.throws(
        () => assertCanJudgeAnomaly({ resolvedBy: 1, actorId: 1, status: 'validated' }),
        (err) => err instanceof AppError && err.statusCode === 403
      );
    });

    test('bloque l\'auteur qui rejette sa propre résolution (403)', () => {
      assert.throws(
        () => assertCanJudgeAnomaly({ resolvedBy: 1, actorId: 1, status: 'rejected' }),
        (err) => err instanceof AppError && err.statusCode === 403
      );
    });

    test('autorise l\'auteur quand aucune résolution n\'est signalée', () => {
      assert.doesNotThrow(() =>
        assertCanJudgeAnomaly({ resolvedBy: 0, actorId: 1, status: 'validated' })
      );
    });

    test('autorise l\'acteur anonyme (userId absent) — pas de séparation à appliquer', () => {
      assert.doesNotThrow(() =>
        assertCanJudgeAnomaly({ resolvedBy: 1, actorId: null, status: 'validated' })
      );
    });
  });

  describe('assertCanRecordVerdict', () => {
    test('autorise un autre membre à enregistrer le verdict', () => {
      assert.doesNotThrow(() =>
        assertCanRecordVerdict({ executedBy: 1, actorId: 2, currentResult: 'passed' })
      );
    });

    test('bloque l\'exécuteur qui saisit un verdict déjà renseigné (403)', () => {
      assert.throws(
        () => assertCanRecordVerdict({ executedBy: 1, actorId: 1, currentResult: 'passed' }),
        (err) => err instanceof AppError && err.statusCode === 403
      );
    });

    test('autorise l\'exécuteur tant que le résultat n\'a pas été saisi (not_run)', () => {
      assert.doesNotThrow(() =>
        assertCanRecordVerdict({ executedBy: 1, actorId: 1, currentResult: 'not_run' })
      );
    });

    test('autorise l\'exécuteur quand aucun résultat n\'existe encore (null)', () => {
      assert.doesNotThrow(() =>
        assertCanRecordVerdict({ executedBy: 1, actorId: 1, currentResult: null })
      );
    });
  });

  describe('assertCanReexecute', () => {
    const forbidden = (err) => err instanceof AppError && err.statusCode === 403;

    test('autorise un testeur sur une exécution pas encore jugée', () => {
      assert.doesNotThrow(() =>
        assertCanReexecute({ actorRoles: ['tester'], currentResult: 'not_run' })
      );
      assert.doesNotThrow(() =>
        assertCanReexecute({ actorRoles: ['tester'], currentResult: null })
      );
    });

    test('bloque un testeur sur une exécution terminée (403)', () => {
      for (const currentResult of ['passed', 'failed', 'blocked', 'skipped']) {
        assert.throws(
          () => assertCanReexecute({ actorRoles: ['tester'], currentResult }),
          forbidden
        );
      }
    });

    test('autorise les responsables de campagne à réviser une exécution terminée', () => {
      for (const role of ['admin', 'chef_testeur', 'quality_manager', 'qa_lead', 'chef_projet']) {
        assert.doesNotThrow(() =>
          assertCanReexecute({ actorRoles: [role], currentResult: 'passed' })
        );
      }
    });

    test('un testeur qui a aussi un rôle de pilotage garde la main', () => {
      assert.doesNotThrow(() =>
        assertCanReexecute({ actorRoles: ['tester', 'chef_testeur'], currentResult: 'failed' })
      );
    });
  });
});
