import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateCommentInput } from './anomalyCommentService.js';

describe('anomalyCommentService.validateCommentInput', () => {
  test('accepte un commentaire texte seul', () => {
    assert.equal(validateCommentInput({ message: 'J\'ai reproduit le bug', audioData: '' }), true);
  });

  test('accepte un commentaire audio seul', () => {
    assert.equal(validateCommentInput({ message: '', audioData: 'data:audio/webm;base64,AAAA' }), true);
  });

  test('accepte texte + audio', () => {
    assert.equal(validateCommentInput({ message: 'Voici la vidéo', audioData: 'AAAA' }), true);
  });

  test('refuse un commentaire vide', () => {
    assert.equal(validateCommentInput({ message: '', audioData: '' }), false);
  });

  test('refuse un message fait uniquement d\'espaces', () => {
    assert.equal(validateCommentInput({ message: '   ', audioData: '' }), false);
  });

  test('refuse des valeurs non-string', () => {
    assert.equal(validateCommentInput({ message: null, audioData: undefined }), false);
  });
});
