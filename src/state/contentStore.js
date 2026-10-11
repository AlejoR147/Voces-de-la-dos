import { createStore } from '../core/store.js';
import { ROLES, STORAGE_KEYS } from '../config/constants.js';
import { EVENT_STATUS, SEED_EVENTS } from '../data/events.js';
import { INITIAL_TEAMS } from '../data/teams.js';
import { PENDING_PROJECTS } from '../data/admin.js';
import { logEvent } from '../services/audit.js';
import { eventStats, isPast, pruneOrphanEventEnrollments, simulatedInitialRegistrations } from '../services/events.js';
import { sanitizeEvent, sanitizeSuggestion, sanitizeTeam } from '../services/validation.js';
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
    suggestions: [],
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

const ENROLL_ID_MAX = 128;

function assertToggleId(id) {
  if (typeof id !== 'string' || id.length === 0 || id.length > ENROLL_ID_MAX) {
    throw new Error('Identificador no válido.');
  }
}

export function toggleEnrollment(id) {
  const user = requireRole('toggle:enrollments', ROLES.CONSUMER);
  assertToggleId(id);
  const state = contentStore.getState();
  const current = state.enrollments[user.id] ?? [];
  if (current.includes(id)) {
    contentStore.setState((prev) => ({ enrollments: { ...prev.enrollments, [user.id]: toggle(prev.enrollments[user.id], id) } }));
    logEvent('enrollment_changed', { email: user.email, role: user.role, detail: `- ${id.slice(0, 80)}` });
    return false;
  }
  if (id.startsWith('event:')) {
    const eventId = id.slice('event:'.length);
    const event = [...state.events, ...SEED_EVENTS].find((item) => item.id === eventId);
    if (!event) throw new Error('Evento no disponible');
    if (event.status !== EVENT_STATUS.APPROVED) throw new Error('Evento en revisión');
    if (isPast(event)) throw new Error('Evento finalizado');
    if (eventStats(event, state).spotsLeft <= 0) throw new Error('Cupo lleno');
  }
  contentStore.setState((prev) => ({ enrollments: { ...prev.enrollments, [user.id]: toggle(prev.enrollments[user.id], id) } }));
  logEvent('enrollment_changed', { email: user.email, role: user.role, detail: `+ ${id.slice(0, 80)}` });
  return true;
}

export function toggleTeamMembership(id) {
  const user = requireRole('toggle:teamMembers', ROLES.CONSUMER);
  assertToggleId(id);
  const state = contentStore.getState();
  const current = state.teamMembers[user.id] ?? [];
  if (current.includes(id)) {
    contentStore.setState((prev) => ({ teamMembers: { ...prev.teamMembers, [user.id]: toggle(prev.teamMembers[user.id], id) } }));
    logEvent('enrollment_changed', { email: user.email, role: user.role, detail: `- ${id.slice(0, 80)}` });
    return false;
  }
  const teamId = id.startsWith('team:') ? id.slice('team:'.length) : id;
  const team = [...state.customTeams, ...INITIAL_TEAMS].find((item) => item.id === teamId);
  if (!team) throw new Error('Equipo no disponible');
  const joinCount = Object.values(state.teamMembers).filter((ids) => ids.includes(id)).length;
  const fakes = team.members?.length ?? 0;
  if (fakes + joinCount >= team.capacity) throw new Error('Equipo completo');
  contentStore.setState((prev) => ({ teamMembers: { ...prev.teamMembers, [user.id]: toggle(prev.teamMembers[user.id], id) } }));
  logEvent('enrollment_changed', { email: user.email, role: user.role, detail: `+ ${id.slice(0, 80)}` });
  return true;
}

export function addTeam(team) {
  const user = requireRole('addTeam', ROLES.MANAGER, ROLES.ADMIN);
  const clean = sanitizeTeam(team);
  contentStore.setState(({ customTeams }) => ({
    customTeams: [{ id: `team-${Date.now()}`, ...clean }, ...customTeams],
  }));
  logEvent('team_created', { email: user.email, role: user.role, detail: clean.title.slice(0, 80) });
}

/** Organizations create events as pending; administrators publish directly. */
export function createEvent(event, { autoApprove = false } = {}) {
  const user = requireRole('createEvent', autoApprove ? ROLES.ADMIN : ROLES.MANAGER);
  // Solo la publicación directa de admin admite fecha pasada (p. ej. registro histórico).
  const clean = sanitizeEvent(event, { allowPast: autoApprove });
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
  else logEvent('event_created', { email: user.email, role: user.role, detail: clean.title.slice(0, 80) });
}

const EVENT_STATUSES = Object.freeze(Object.values(EVENT_STATUS));

export function setEventStatus(id, status) {
  const user = requireRole('setEventStatus', ROLES.ADMIN);
  // Whitelist de estados + el id debe existir: sin esto un typo crearía estados fantasma.
  if (!EVENT_STATUSES.includes(status)) throw new Error('Estado no válido.');
  const target = contentStore.getState().events.find((event) => event.id === id);
  if (!target) throw new Error('Evento no disponible.');
  contentStore.setState(({ events }) => ({
    events: events.map((event) => {
      if (event.id !== id) return event;
      const registered = status === EVENT_STATUS.APPROVED && event.registered === 0
        ? simulatedInitialRegistrations(event.capacity)
        : event.registered;
      return { ...event, status, registered };
    }),
  }));
  logEvent('admin_action', { email: user.email, role: user.role, detail: `${status === EVENT_STATUS.APPROVED ? 'Aprobó' : 'Rechazó'} evento: ${target.title}` });
}

const PROJECT_DECISIONS = Object.freeze(['approved', 'rejected']);

export function decideProject(id, decision) {
  const user = requireRole('decideProject', ROLES.ADMIN);
  if (!PROJECT_DECISIONS.includes(decision)) throw new Error('Decisión no válida.');
  if (!PENDING_PROJECTS.some((project) => project.id === id)) throw new Error('Proyecto no disponible.');
  contentStore.setState(({ decisions }) => ({ decisions: { ...decisions, [id]: decision } }));
  logEvent('admin_action', { email: user.email, role: user.role, detail: `${decision === 'approved' ? 'Aprobó' : 'Rechazó'} proyecto ${id}` });
}

/** Consumers propose activities; administrators approve them before they go public. */
export function suggestActivity(input) {
  const user = requireRole('suggestActivity', ROLES.CONSUMER);
  const clean = sanitizeSuggestion(input);
  contentStore.setState(({ suggestions }) => ({
    suggestions: [{
      id: `sug-${Date.now()}`,
      status: EVENT_STATUS.PENDING,
      createdBy: user.id,
      authorName: user.name,
      createdAt: new Date().toISOString(),
      ...clean,
    }, ...suggestions],
  }));
  logEvent('suggestion_created', { email: user.email, role: user.role, detail: clean.title.slice(0, 80) });
}

export function decideSuggestion(id, decision) {
  const user = requireRole('decideSuggestion', ROLES.ADMIN);
  if (!EVENT_STATUSES.includes(decision)) throw new Error('Decisión no válida.');
  const target = contentStore.getState().suggestions.find((item) => item.id === id);
  if (!target) throw new Error('Propuesta no disponible.');
  contentStore.setState(({ suggestions }) => ({
    suggestions: suggestions.map((item) => (item.id === id ? { ...item, status: decision } : item)),
  }));
  logEvent('admin_action', { email: user.email, role: user.role, detail: `${decision === 'approved' ? 'Aprobó' : 'Rechazó'} propuesta: ${target.title}` });
}

export function purgeUserContent(userId) {
  contentStore.setState((state) => {
    const { [userId]: _enrolled, ...restEnrollments } = state.enrollments;
    const { [userId]: _teams, ...restTeamMembers } = state.teamMembers;
    const events = state.events.filter((event) => event.ownerId !== userId);
    const suggestions = state.suggestions.filter((item) => item.createdBy !== userId);
    const validSuggestionIds = new Set(suggestions.map((item) => item.id));
    const validTeamIds = new Set([...state.customTeams, ...INITIAL_TEAMS].map((team) => team.id));
    const validProjectIds = new Set(PENDING_PROJECTS.map((project) => project.id));
    // Limpia `event:<id>` huerfanos (eventos borrados del usuario o semillas removidas).
    const withoutOrphanEvents = pruneOrphanEventEnrollments(
      restEnrollments,
      { ...state, events, suggestions },
    );
    // Limpia `suggestion:<id>` de propuestas borradas.
    const enrollments = Object.fromEntries(
      Object.entries(withoutOrphanEvents).map(([uid, list]) => [uid, list.filter((enrollId) => {
        if (typeof enrollId !== 'string' || !enrollId.startsWith('suggestion:')) return true;
        return validSuggestionIds.has(enrollId.slice('suggestion:'.length));
      })]),
    );
    // Limpia membresias `team:<id>` o ids de equipos inexistentes.
    const teamMembers = Object.fromEntries(
      Object.entries(restTeamMembers).map(([uid, list]) => [uid, list.filter((teamId) => {
        const raw = typeof teamId === 'string' && teamId.startsWith('team:') ? teamId.slice('team:'.length) : teamId;
        return validTeamIds.has(raw);
      })]),
    );
    // Limpia decisiones sobre proyectos inexistentes.
    const decisions = Object.fromEntries(
      Object.entries(state.decisions).filter(([id]) => validProjectIds.has(id)),
    );
    return {
      enrollments,
      teamMembers,
      events,
      suggestions,
      decisions,
    };
  });
}
