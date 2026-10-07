import { LOCALE } from '../config/constants.js';
import { EVENT_STATUS, SEED_EVENTS, toISODate } from '../data/events.js';

export const eventEnrollmentId = (event) => `event:${event.id}`;

export const STATUS_LABELS = Object.freeze({
  [EVENT_STATUS.PENDING]: 'En revisión',
  [EVENT_STATUS.APPROVED]: 'Publicado',
  [EVENT_STATUS.REJECTED]: 'Rechazado',
});

export function allEvents(content) {
  return [...content.events, ...SEED_EVENTS];
}

export function publishedEvents(content) {
  return allEvents(content)
    .filter(({ status }) => status === EVENT_STATUS.APPROVED)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const eventsOwnedBy = (content, userId) => content.events.filter((event) => event.ownerId === userId);

export const isPast = (event) => event.date < toISODate(new Date());

export function eventStats(event, content) {
  const mine = content.enrolled.includes(eventEnrollmentId(event)) ? 1 : 0;
  const registered = event.status === EVENT_STATUS.APPROVED ? event.registered + mine : 0;
  return {
    registered,
    spotsLeft: Math.max(0, event.capacity - registered),
    occupancy: event.capacity ? Math.min(100, Math.round((registered / event.capacity) * 100)) : 0,
    revenue: registered * event.price,
  };
}

export function formatEventDate(iso, options = { day: 'numeric', month: 'short' }) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(LOCALE, options).replace('.', '').replace(' de ', ' ');
}

export function dateParts(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return {
    day: String(day),
    month: date.toLocaleDateString(LOCALE, { month: 'short' }).replace('.', ''),
  };
}

export function simulatedInitialRegistrations(capacity) {
  return Math.round(capacity * (0.15 + Math.random() * 0.35));
}
