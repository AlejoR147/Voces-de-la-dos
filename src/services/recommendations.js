import { INTERESTS } from '../data/interests.js';

export function buildRecommendations({ affinities, customActivities }) {
  const published = customActivities.map((activity) => ({ ...activity, emoji: '🎨', match: null, isNew: true }));
  const ranked = affinities.map(({ key, score }) => ({
    id: `activity:${key}`,
    interest: key,
    emoji: INTERESTS[key].emoji,
    ...INTERESTS[key].activity,
    match: score,
    isNew: false,
  }));
  return [...published, ...ranked];
}
