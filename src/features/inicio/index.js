import './inicio.css';
import template from './inicio.html?raw';
import { $, escapeHtml } from '../../core/dom.js';
import { appStore } from '../../state/appStore.js';
import { contentStore } from '../../state/contentStore.js';
import { INTERESTS } from '../../data/interests.js';
import { EVENT_STATUS } from '../../data/events.js';
import { ROLES, ROLE_LABELS } from '../../config/constants.js';
import { profileTitle } from '../../services/affinity.js';
import { buildRecommendations } from '../../services/recommendations.js';
import {
  allEvents, eventStats, eventsOwnedBy, isPast, publishedEvents,
} from '../../services/events.js';
import { formatNumber, initialOf } from '../../utils/format.js';
import { activityCard } from '../../shared/components/activityCard.js';
import { bindEnrollment } from '../../shared/components/enrollButton.js';
import { eventCard } from '../../shared/components/eventCard.js';
import { icon } from '../../shared/icons.js';

const TOP_AFFINITIES = 4;
const TOP_RECOMMENDATIONS = 3;
const TOP_EVENTS = 4;

function profileCardHtml(user, affinities) {
  const bars = affinities.slice(0, TOP_AFFINITIES).map(({ key, score }) => `
    <div class="affinity-row">
      <div class="affinity-label"><span>${INTERESTS[key].emoji} ${INTERESTS[key].label}</span><span>${score}%</span></div>
      <div class="affinity-bar"><div class="affinity-fill" style="width:${score}%"></div></div>
    </div>`).join('');

  return `<div class="profile-head">
      <span class="avatar">${escapeHtml(initialOf(user.name))}</span>
      <div>
        <div class="profile-name">${escapeHtml(user.name)} <span class="badge badge-blue">${ROLE_LABELS[user.role]}</span></div>
        <div class="profile-title">Perfil creativo: <b>${profileTitle(affinities)}</b> · ${escapeHtml(user.barrio)}</div>
      </div>
    </div>
    <div class="affinity">${bars}</div>`;
}

function roleSummary(user, content) {
  const pending = allEvents(content).filter(({ status }) => status === EVENT_STATUS.PENDING).length;

  if (user.role === ROLES.MANAGER) {
    const owned = eventsOwnedBy(content, user.id);
    const registered = owned.reduce((sum, event) => sum + eventStats(event, content).registered, 0);
    return {
      sub: `Gestiona tus eventos y mira cómo responde ${user.barrio}.`,
      cta: { title: 'Gestiona tus eventos', text: 'Crea un evento nuevo y sigue sus inscripciones, ocupación e ingresos.', href: '#gestion', label: 'Ir a Mis eventos' },
      stats: [
        [owned.length, 'Mis eventos'],
        [formatNumber(registered), 'Inscritos'],
        [owned.filter(({ status }) => status === EVENT_STATUS.PENDING).length, 'En revisión'],
      ],
    };
  }

  if (user.role === ROLES.ADMIN) {
    return {
      sub: 'Resumen de la plataforma y tareas pendientes de moderación.',
      cta: { title: 'Moderación pendiente', text: `${pending} ${pending === 1 ? 'evento espera' : 'eventos esperan'} tu revisión.`, href: '#admin', label: 'Revisar ahora' },
      stats: [
        [pending, 'Por aprobar'],
        [publishedEvents(content).length, 'Publicados'],
        [content.events.length, 'Creados por gestores'],
      ],
    };
  }

  return {
    sub: `Esto es lo que está pasando en ${user.barrio} y en toda la Comuna 2.`,
    cta: { title: 'Explora el mapa cultural', text: 'Espacios, horarios y precios de tu comuna, con ruta a pie desde donde estás.', href: '#mapa', label: 'Abrir mapa' },
    stats: [
      [content.enrolled.length, 'Inscripciones'],
      [content.joinedTeams.length, 'Equipos'],
      [publishedEvents(content).filter((event) => !isPast(event)).length, 'Eventos próximos'],
    ],
  };
}

function mount(section) {
  section.innerHTML = template;

  const els = {
    greeting: $('#homeGreeting', section),
    sub: $('#homeSub', section),
    profile: $('#profileCard', section),
    cta: $('#homeCta', section),
    stats: $('#homeStats', section),
    recsSection: $('#homeRecsSection', section),
    recs: $('#homeRecs', section),
    events: $('#homeEvents', section),
  };

  function render() {
    const { user, affinities } = appStore.getState();
    if (!user) return;
    const content = contentStore.getState();
    const summary = roleSummary(user, content);

    els.greeting.textContent = `Hola, ${user.name} 👋`;
    els.sub.textContent = summary.sub;
    els.profile.innerHTML = profileCardHtml(user, affinities);
    els.cta.innerHTML = `<h3>${summary.cta.title}</h3><p>${summary.cta.text}</p><a class="btn btn-light" href="${summary.cta.href}">${summary.cta.label}</a>`;
    els.stats.innerHTML = summary.stats.map(([value, label]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`).join('');

    els.recsSection.hidden = user.role === ROLES.ADMIN;
    els.recs.innerHTML = buildRecommendations({ affinities })
      .slice(0, TOP_RECOMMENDATIONS)
      .map((activity) => activityCard(activity, content.enrolled.includes(activity.id)))
      .join('');

    const upcoming = publishedEvents(content).filter((event) => !isPast(event)).slice(0, TOP_EVENTS);
    els.events.innerHTML = upcoming.length
      ? upcoming.map((event) => eventCard(event, content, { enroll: true })).join('')
      : `<div class="empty">${icon('calendar', 24)}<b>Sin eventos próximos</b>Vuelve pronto.</div>`;
  }

  bindEnrollment(els.recs);
  bindEnrollment(els.events);
  appStore.subscribe(render);
  contentStore.subscribe(render);
  render();
}

export const screen = { id: 'inicio', label: 'Inicio', icon: icon('home'), nav: true, access: 'auth', mount };
