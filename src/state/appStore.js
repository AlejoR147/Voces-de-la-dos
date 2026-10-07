import { createStore } from '../core/store.js';
import { removeKey } from '../core/storage.js';
import { ROLES, STORAGE_KEYS } from '../config/constants.js';
import { calculateAffinities } from '../services/affinity.js';

export const appStore = createStore(
  { user: null, affinities: [] },
  { persistKey: STORAGE_KEYS.session },
);

export function getUser() {
  return appStore.getState().user;
}

export function registerUser({ name, role, age, barrio, availability, interests }) {
  appStore.setState({
    user: { name, role, age, barrio, availability, interests },
    affinities: calculateAffinities(interests),
  });
}

export function updateUser(patch) {
  const { user, affinities } = appStore.getState();
  appStore.setState({
    user: { ...user, ...patch },
    affinities: patch.interests ? calculateAffinities(patch.interests) : affinities,
  });
}

export function hasRole(...roles) {
  const user = getUser();
  return Boolean(user) && roles.includes(user.role);
}

export function isCreator() {
  return hasRole(ROLES.CREATOR, ROLES.ADMIN);
}

export function resetApp() {
  Object.values(STORAGE_KEYS).forEach(removeKey);
  window.location.hash = '';
  window.location.reload();
}
