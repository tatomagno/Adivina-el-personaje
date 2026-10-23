/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CharacterRef {
  id: string;
  name: string;
  aliases?: string[];
  difficulty: 'facil' | 'medio' | 'dificil';
  category: string;
}

export interface ScoreInput {
  timeRemaining: number;
  totalTime: number;
  cluesUsed: number; // 0 to 5
  difficulty: 'facil' | 'medio' | 'dificil';
  streak: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  cluePenalty: number;
  timeBonus: number;
  streakBonus: number;
  multiplier: number;
  totalScore: number;
}

/**
 * Calculates competitive score for a round.
 * Base score: 1000 pts
 * Clue penalty: -150 pts per clue requested (rewards knowledge with fewer clues)
 * Time bonus: proportional to seconds remaining
 * Streak multiplier: builds momentum for consecutive correct answers
 */
export function calculateRoundScore(input: ScoreInput): ScoreBreakdown {
  const baseScore = 1000;
  
  // Clues penalty: 0 clues = 0 penalty; 1 = -160; 2 = -320; 3 = -480; 4 = -640; 5 = -800
  const clampedClues = Math.max(0, Math.min(5, input.cluesUsed));
  const cluePenalty = clampedClues * 160;
  const netBase = Math.max(100, baseScore - cluePenalty);

  // Time bonus (e.g. 30s remaining * difficulty weight)
  const safeTime = Math.max(0, input.timeRemaining);
  const timeWeight = input.difficulty === 'dificil' ? 15 : input.difficulty === 'medio' ? 12 : 8;
  const timeBonus = Math.round(safeTime * timeWeight);

  // Streak multiplier: 1.0 at 0 streak, +0.1 per streak up to 1.8x
  const safeStreak = Math.max(0, input.streak);
  const multiplier = Math.min(1.8, 1 + safeStreak * 0.1);

  const rawTotal = (netBase + timeBonus) * multiplier;
  const totalScore = Math.round(rawTotal);

  return {
    baseScore: netBase,
    cluePenalty,
    timeBonus,
    streakBonus: Math.round(rawTotal - (netBase + timeBonus)),
    multiplier: Number(multiplier.toFixed(2)),
    totalScore,
  };
}

/**
 * Normalizes strings by removing diacritics, lowercase, removing punctuation.
 */
export function normalizeString(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Evaluates whether a player's guess matches the character name or any aliases.
 */
export function checkGuess(rawGuess: string, character: CharacterRef): boolean {
  if (!rawGuess || !character) return false;
  const normalizedGuess = normalizeString(rawGuess);
  if (!normalizedGuess) return false;

  const validNames = [character.name, ...(character.aliases || [])];

  for (const valid of validNames) {
    const normalizedValid = normalizeString(valid);
    if (normalizedGuess === normalizedValid) return true;

    // Also match if guess is a substantial exact substring (e.g. "David" for "Rey David", or "Pablo" for "Apostol Pablo")
    if (normalizedValid.length >= 4 && (normalizedValid.includes(normalizedGuess) || normalizedGuess.includes(normalizedValid))) {
      // Avoid accidental false positives like "dan" matching "daniel" unless intended
      if (Math.abs(normalizedValid.length - normalizedGuess.length) <= 5) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Pseudo-random generator using a string seed for reproducible challenge games
 */
export function createSeededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Shuffles and filters characters reproducibly with an optional seed.
 */
export function selectCharactersForRound<T extends CharacterRef>(
  allCharacters: T[],
  options: {
    difficulty?: 'todas' | 'facil' | 'medio' | 'dificil';
    category?: string;
    count?: number;
    seed?: string;
  }
): T[] {
  let filtered = [...allCharacters];

  if (options.difficulty && options.difficulty !== 'todas') {
    filtered = filtered.filter((c) => c.difficulty === options.difficulty);
  }

  if (options.category && options.category !== 'Todos') {
    filtered = filtered.filter((c) => c.category === options.category);
  }

  // Fallback to all if too few matched
  if (filtered.length < (options.count || 5)) {
    filtered = [...allCharacters];
  }

  const rng = options.seed ? createSeededRandom(options.seed) : Math.random;

  // Fisher-Yates shuffle
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  return filtered.slice(0, options.count || 5);
}
