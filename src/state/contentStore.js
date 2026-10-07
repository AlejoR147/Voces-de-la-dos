import { createStore } from '../core/store.js';
import { STORAGE_KEYS } from '../config/constants.js';

export const contentStore = createStore(
  {
    enrolled: [],
    joinedTeams: [],
    customTeams: [],
    customActivities: [],
    customEvents: [],
    decisions: {},
  },
  { persistKey: STORAGE_KEYS.content },
);

const toggle = (list, id) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

export const isEnrolled = (id) => contentStore.getState().enrolled.includes(id);

export function toggleEnrollment(id) {
  contentStore.setState(({ enrolled }) => ({ enrolled: toggle(enrolled, id) }));
  return isEnrolled(id);
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

export function addActivity(activity) {
  contentStore.setState(({ customActivities }) => ({
    customActivities: [{ id: `activity-${Date.now()}`, ...activity }, ...customActivities],
  }));
}

export function addEvent(event) {
  contentStore.setState(({ customEvents }) => ({
    customEvents: [...customEvents, { id: `event-${Date.now()}`, ...event }],
  }));
}

export function decideProject(id, decision) {
  contentStore.setState(({ decisions }) => ({ decisions: { ...decisions, [id]: decision } }));
}
