/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRoundScore,
  normalizeString,
  checkGuess,
  selectCharactersForRound,
  createSeededRandom,
} from './scoring';

test('calculateRoundScore rewards quick guesses with fewer clues', () => {
  const zeroCluesQuick = calculateRoundScore({
    timeRemaining: 30,
    totalTime: 45,
    cluesUsed: 0,
    difficulty: 'medio',
    streak: 0,
  });

  const fourCluesSlow = calculateRoundScore({
    timeRemaining: 5,
    totalTime: 45,
    cluesUsed: 4,
    difficulty: 'medio',
    streak: 0,
  });

  assert.ok(zeroCluesQuick.totalScore > fourCluesSlow.totalScore, 'Score with 0 clues and high time must be higher');
  assert.equal(zeroCluesQuick.cluePenalty, 0);
  assert.equal(fourCluesSlow.cluePenalty, 640);
});

test('calculateRoundScore applies streak bonus multiplier', () => {
  const noStreak = calculateRoundScore({
    timeRemaining: 20,
    totalTime: 45,
    cluesUsed: 1,
    difficulty: 'facil',
    streak: 0,
  });

  const streak3 = calculateRoundScore({
    timeRemaining: 20,
    totalTime: 45,
    cluesUsed: 1,
    difficulty: 'facil',
    streak: 3,
  });

  assert.ok(streak3.totalScore > noStreak.totalScore, 'Streak should increase total score');
  assert.equal(streak3.multiplier, 1.3);
});

test('normalizeString cleans accents, punctuation, and casing', () => {
  assert.equal(normalizeString('Moisés'), 'moises');
  assert.equal(normalizeString('  Rey DAVID!  '), 'rey david');
  assert.equal(normalizeString('Elías, Profeta'), 'elias profeta');
});

test('checkGuess matches names, variations and aliases correctly', () => {
  const pablo = {
    id: 'pablo',
    name: 'Pablo',
    aliases: ['Saulo', 'Saulo de Tarso', 'San Pablo'],
    difficulty: 'medio' as const,
    category: 'Jesús y Discípulos',
  };

  assert.equal(checkGuess('Pablo', pablo), true);
  assert.equal(checkGuess('pablo', pablo), true);
  assert.equal(checkGuess('Saulo', pablo), true);
  assert.equal(checkGuess('saulo de tarso', pablo), true);
  assert.equal(checkGuess('Pedro', pablo), false);
  assert.equal(checkGuess('', pablo), false);
});

test('selectCharactersForRound creates reproducible results with seed', () => {
  const sample = [
    { id: '1', name: 'David', difficulty: 'facil' as const, category: 'Reyes' },
    { id: '2', name: 'Moisés', difficulty: 'facil' as const, category: 'Líderes' },
    { id: '3', name: 'Noé', difficulty: 'facil' as const, category: 'Patriarcas' },
    { id: '4', name: 'Ester', difficulty: 'medio' as const, category: 'Mujeres' },
    { id: '5', name: 'Elías', difficulty: 'medio' as const, category: 'Profetas' },
    { id: '6', name: 'Daniel', difficulty: 'medio' as const, category: 'Profetas' },
  ];

  const round1 = selectCharactersForRound(sample, { count: 3, seed: 'SALA-123' });
  const round2 = selectCharactersForRound(sample, { count: 3, seed: 'SALA-123' });
  const roundDifferent = selectCharactersForRound(sample, { count: 3, seed: 'OTRA-SALA' });

  assert.deepEqual(round1.map(c => c.id), round2.map(c => c.id), 'Same seed must produce identical character order');
  assert.equal(round1.length, 3);
});
