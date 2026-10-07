import { createStore } from '../core/store.js';
import { removeKey, writeJSON } from '../core/storage.js';
import { ROLES, STORAGE_KEYS } from '../config/constants.js';

/**
 * Runtime session. It is deliberately NOT persisted as a whole: only a pointer (`userId` + expiry) is stored
 * for regular accounts, and administrator sessions live in memory only.
 */
export const appStore = createStore({ user: null, affinities: [] });

export const getUser = () => appStore.getState().user;

export function startSession(user, { affinities = [], expiresAt = null } = {}) {
  if (user.role === ROLES.ADMIN || !expiresAt) removeKey(STORAGE_KEYS.session);
  else writeJSON(STORAGE_KEYS.session, { userId: user.id, expiresAt });
  appStore.setState({ user, affinities });
}

export function endSession() {
  removeKey(STORAGE_KEYS.session);
  appStore.setState({ user: null, affinities: [] });
}

export function hasRole(...roles) {
  const user = getUser();
  return Boolean(user) && roles.includes(user.role);
}

export const isConsumer = () => hasRole(ROLES.CONSUMER);
export const isManager = () => hasRole(ROLES.MANAGER);
export const isAdmin = () => hasRole(ROLES.ADMIN);
export const canCreateChallenges = () => hasRole(ROLES.MANAGER, ROLES.ADMIN);
