import { INTERESTS } from '../data/interests.js';

const FALLBACK_ACTIVITY = Object.freeze({
  title: 'Actividad comunitaria',
  desc: 'Esta recomendacion corresponde a un interes anterior; explorala como propuesta vecinal.',
  price: 0,
});

export function buildRecommendations({ affinities }) {
  return (affinities ?? []).map(({ key, score }) => {
    const info = INTERESTS[key];
    if (!info) {
      return {
        id: `activity:${key}`,
        interest: key,
        emoji: '✨',
        ...FALLBACK_ACTIVITY,
        match: score,
      };
    }
    return {
      id: `activity:${key}`,
      interest: key,
      emoji: info.emoji,
      ...info.activity,
      match: score,
    };
  });
}
