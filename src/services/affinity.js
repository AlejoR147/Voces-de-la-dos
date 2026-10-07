import { INTEREST_KEYS } from '../data/interests.js';

const MAX_SCORE = 97;
const SELECTED_BASE = 65;
const SELECTED_SPREAD = 30;
const LATENT_BASE = 15;
const LATENT_SPREAD = 10;

/**
 * Simulated recommendation engine: selected interests weigh heavily,
 * the rest receive a low random base to represent latent affinities.
 */
export function calculateAffinities(selectedKeys, limit = 4) {
  return INTEREST_KEYS
    .map((key) => {
      const base = selectedKeys.includes(key)
        ? SELECTED_BASE + Math.random() * SELECTED_SPREAD
        : LATENT_BASE + Math.random() * LATENT_SPREAD;
      return { key, score: Math.min(MAX_SCORE, Math.round(base)) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function orderRecommendationKeys(priorityKeys) {
  return priorityKeys.concat(INTEREST_KEYS.filter((key) => !priorityKeys.includes(key)));
}

export function scoreRecommendation(position) {
  return Math.max(35, 96 - position * 13 - Math.round(Math.random() * 6));
}
