import { INTEREST_KEYS, INTERESTS } from '../data/interests.js';

const MAX_SCORE = 97;
const SELECTED_BASE = 65;
const SELECTED_SPREAD = 30;
const LATENT_BASE = 15;
const LATENT_SPREAD = 10;

/**
 * Simulated recommendation engine: selected interests weigh heavily, the rest
 * receive a low random base (latent affinities). Scores are computed once when
 * the profile changes and then persisted, so the UI stays stable between renders.
 */
export function calculateAffinities(selectedKeys) {
  return INTEREST_KEYS
    .map((key) => {
      const base = selectedKeys.includes(key)
        ? SELECTED_BASE + Math.random() * SELECTED_SPREAD
        : LATENT_BASE + Math.random() * LATENT_SPREAD;
      return { key, score: Math.min(MAX_SCORE, Math.round(base)) };
    })
    .sort((a, b) => b.score - a.score);
}

export function affinityScore(affinities, key) {
  return affinities.find((item) => item.key === key)?.score ?? 0;
}

export function profileTitle(affinities) {
  const top = affinities[0];
  return top ? INTERESTS[top.key].profile : 'Explorador';
}
