import { createStore } from '../core/store.js';
import { DEFAULT_BARRIO, DEFAULT_INTERESTS, ROLES } from '../config/constants.js';
import { calculateAffinities } from '../services/affinity.js';

export const appStore = createStore({
  role: ROLES.CONSUMER,
  barrio: DEFAULT_BARRIO,
  interests: [...DEFAULT_INTERESTS],
  affinities: calculateAffinities(DEFAULT_INTERESTS),
});

export function setRole(role) {
  appStore.setState({ role });
}

export function submitProfile({ interests, barrio }) {
  appStore.setState({ interests, barrio, affinities: calculateAffinities(interests) });
}
