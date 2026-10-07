import { INTERESTS } from '../data/interests.js';

export function buildRecommendations({ affinities }) {
  return affinities.map(({ key, score }) => ({
    id: `activity:${key}`,
    interest: key,
    emoji: INTERESTS[key].emoji,
    ...INTERESTS[key].activity,
    match: score,
  }));
}
