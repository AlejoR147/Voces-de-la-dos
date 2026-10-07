import { createStore } from '../core/store.js';
import { ROLES, STORAGE_KEYS } from '../config/constants.js';
import { EVENT_STATUS } from '../data/events.js';
import { logEvent } from '../services/audit.js';
import { simulatedInitialRegistrations } from '../services/events.js';
import { sanitizeEvent, sanitizeTeam } from '../services/validation.js';
import { getUser } from './appStore.js';

/**
 * `enrollments` and `teamMembers` are keyed by user id so several local accounts can coexist.
 * Use `getContent()` to read the state with the current user's `enrolled` / `joinedTeams` resolved.
 */
export const contentStore = createStore(
  {
    enrollments: {},
    teamMembers: {},
    customTeams: [],
    events: [],
    decisions: {},
  },
  { persistKey: STORAGE_KEYS.content },
);

export function getContent() {
  const state = contentStore.getState();
  const userId = getUser()?.id;
  return {
    ...state,
    enrolled: state.enrollments[userId] ?? [],
    joinedTeams: state.teamMembers[userId] ?? [],
  };
}

function requireRole(action, ...roles) {
  const user = getUser();
  if (!user || !roles.includes(user.role)) {
    logEvent('denied', { email: user?.email, role: user?.role, detail: action });
    throw new Error('No autorizado');
  }
  return user;
}

const toggle = (list = [], id) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

function toggleForUser(field, id) {
  const user = requireRole(`toggle:${field}`, ROLES.CONSUMER);
  contentStore.setState((state) => ({ [field]: { ...state[field], [user.id]: toggle(state[field][user.id], id) } }));
  return contentStore.getState()[field][user.id].includes(id);
}

export const toggleEnrollment = (id) => toggleForUser('enrollments', id);
export const toggleTeamMembership = (id) => toggleForUser('teamMembers', id);

export function addTeam(team) {
  requireRole('addTeam', ROLES.MANAGER, ROLES.ADMIN);
  contentStore.setState(({ customTeams }) => ({
    customTeams: [{ id: `team-${Date.now()}`, ...sanitizeTeam(team) }, ...customTeams],
  }));
}

/** Organizations create events as pending; administrators publish directly. */
export function createEvent(event, { autoApprove = false } = {}) {
  const user = requireRole('createEvent', autoApprove ? ROLES.ADMIN : ROLES.MANAGER);
  const clean = sanitizeEvent(event);
  contentStore.setState(({ events }) => ({
    events: [
      {
        id: `event-${Date.now()}`,
        registered: autoApprove ? simulatedInitialRegistrations(clean.capacity) : 0,
        status: autoApprove ? EVENT_STATUS.APPROVED : EVENT_STATUS.PENDING,
        ...clean,
        ownerId: autoApprove ? null : user.id,
        ownerName: user.name,
      },
      ...events,
    ],
  }));
  if (autoApprove) logEvent('admin_action', { email: user.email, role: user.role, detail: `Evento publicado: ${clean.title}` });
}

export function setEventStatus(id, status) {
  const user = requireRole('setEventStatus', ROLES.ADMIN);
  const target = contentStore.getState().events.find((event) => event.id === id);
  contentStore.setState(({ events }) => ({
    events: events.map((event) => {
      if (event.id !== id) return event;
      const registered = status === EVENT_STATUS.APPROVED && event.registered === 0
        ? simulatedInitialRegistrations(event.capacity)
        : event.registered;
      return { ...event, status, registered };
    }),
  }));
  logEvent('admin_action', { email: user.email, role: user.role, detail: `${status === EVENT_STATUS.APPROVED ? 'Aprobó' : 'Rechazó'} evento: ${target?.title ?? id}` });
}

export function decideProject(id, decision) {
  const user = requireRole('decideProject', ROLES.ADMIN);
  contentStore.setState(({ decisions }) => ({ decisions: { ...decisions, [id]: decision } }));
  logEvent('admin_action', { email: user.email, role: user.role, detail: `${decision === 'approved' ? 'Aprobó' : 'Rechazó'} proyecto ${id}` });
}

export function purgeUserContent(userId) {
  contentStore.setState((state) => {
    const { [userId]: _enrolled, ...enrollments } = state.enrollments;
    const { [userId]: _teams, ...teamMembers } = state.teamMembers;
    return { enrollments, teamMembers, events: state.events.filter((event) => event.ownerId !== userId) };
  });
}
