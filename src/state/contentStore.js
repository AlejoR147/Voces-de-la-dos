import { createStore } from '../core/store.js';
import { STORAGE_KEYS } from '../config/constants.js';
import { EVENT_STATUS } from '../data/events.js';
import { simulatedInitialRegistrations } from '../services/events.js';

export const contentStore = createStore(
  {
    enrolled: [],
    joinedTeams: [],
    customTeams: [],
    events: [],
    decisions: {},
  },
  { persistKey: STORAGE_KEYS.content },
);

const toggle = (list, id) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

export function toggleEnrollment(id) {
  contentStore.setState(({ enrolled }) => ({ enrolled: toggle(enrolled, id) }));
  return contentStore.getState().enrolled.includes(id);
}

export function toggleTeamMembership(id) {
  contentStore.setState(({ joinedTeams }) => ({ joinedTeams: toggle(joinedTeams, id) }));
  return contentStore.getState().joinedTeams.includes(id);
}

export function addTeam(team) {
  contentStore.setState(({ customTeams }) => ({
    customTeams: [{ id: `team-${Date.now()}`, ...team }, ...customTeams],
  }));
}

/** Managers create events as pending; admins publish directly. */
export function createEvent(event, { autoApprove = false } = {}) {
  const status = autoApprove ? EVENT_STATUS.APPROVED : EVENT_STATUS.PENDING;
  contentStore.setState(({ events }) => ({
    events: [
      {
        id: `event-${Date.now()}`,
        registered: autoApprove ? simulatedInitialRegistrations(event.capacity) : 0,
        status,
        ...event,
      },
      ...events,
    ],
  }));
}

export function setEventStatus(id, status) {
  contentStore.setState(({ events }) => ({
    events: events.map((event) => {
      if (event.id !== id) return event;
      const registered = status === EVENT_STATUS.APPROVED && event.registered === 0
        ? simulatedInitialRegistrations(event.capacity)
        : event.registered;
      return { ...event, status, registered };
    }),
  }));
}

export function decideProject(id, decision) {
  contentStore.setState(({ decisions }) => ({ decisions: { ...decisions, [id]: decision } }));
}
