import './inicio.css';
import template from './inicio.html?raw';
import { $, escapeHtml } from '../../core/dom.js';
import { appStore } from '../../state/appStore.js';
import { contentStore, getContent } from '../../state/contentStore.js';
import { INTERESTS } from '../../data/interests.js';
import { EVENT_STATUS } from '../../data/events.js';
import { ROLES, ROLE_LABELS } from '../../config/constants.js';
import { profileTitle } from '../../services/affinity.js';
import { buildRecommendations } from '../../services/recommendations.js';
import {
  allEvents, eventEnrollmentId, eventStats, eventsOwnedBy, isPast, publishedEvents,
} from '../../services/events.js';
import { toISODate } from '../../data/events.js';
import { formatNumber, initialOf } from '../../utils/format.js';
import { activityCard } from '../../shared/components/activityCard.js';
import { bindEnrollment } from '../../shared/components/enrollButton.js';
import { bindEventDetail } from '../../shared/components/eventDetail.js';
import { eventCard } from '../../shared/components/eventCard.js';
import { icon } from '../../shared/icons.js';

const TOP_AFFINITIES = 4;
const TOP_RECOMMENDATIONS = 3;
const TOP_EVENTS = 4;

function organizationCardHtml(user) {
  const categories = user.interests.map((key) => {
    const info = INTERESTS[key] ?? { emoji: '✨', label: 'Exploración' };
    return `<span class="badge">${escapeHtml(info.emoji)} ${escapeHtml(info.label)}</span>`;
  }).join('');
  return `<div class="profile-head">
      <span class="avatar">${escapeHtml(initialOf(user.name))}</span>
      <div>
        <div class="profile-name">${escapeHtml(user.name)} <span class="badge badge-blue">${ROLE_LABELS[user.role]}</span></div>
        <div class="profile-title">${escapeHtml(user.orgType)} · ${escapeHtml(user.barrio)}</div>
      </div>
    </div>
    <p class="profile-about">${escapeHtml(user.description)}</p>
    <div class="badge-row">${categories}</div>`;
}

function adminCardHtml(user) {
  return `<div class="profile-head">
      <span class="avatar">${escapeHtml(initialOf(user.name))}</span>
      <div>
        <div class="profile-name">${escapeHtml(user.name)} <span class="badge badge-blue">${ROLE_LABELS[user.role]}</span></div>
        <div class="profile-title">${escapeHtml(user.email)}</div>
      </div>
    </div>
    <p class="profile-about">Desde Moderación revisas los eventos de las organizaciones. En Impacto ves el panorama global y en el registro de actividad, los accesos y acciones recientes.</p>`;
}

function profileCardHtml(user, affinities) {
  if (user.role === ROLES.MANAGER) return organizationCardHtml(user);
  if (user.role === ROLES.ADMIN) return adminCardHtml(user);
  const bars = affinities.slice(0, TOP_AFFINITIES).map(({ key, score }) => {
    const info = INTERESTS[key] ?? { emoji: '✨', label: 'Exploración' };
    return `
    <div class="affinity-row">
      <div class="affinity-label"><span>${escapeHtml(info.emoji)} ${escapeHtml(info.label)}</span><span>${escapeHtml(score)}%</span></div>
      <div class="affinity-bar"><div class="affinity-fill" style="width:${Number(score)}%"></div></div>
    </div>`;
  }).join('');

  return `<div class="profile-head">
      <span class="avatar">${escapeHtml(initialOf(user.name))}</span>
      <div>
        <div class="profile-name">${escapeHtml(user.name)} <span class="badge badge-blue">${ROLE_LABELS[user.role]}</span></div>
        <div class="profile-title">Perfil creativo: <b>${escapeHtml(profileTitle(affinities))}</b> · ${escapeHtml(user.barrio)}</div>
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
    soonSection: $('#homeSoonSection', section),
    soon: $('#homeSoon', section),
  };

  function render() {
    const { user, affinities } = appStore.getState();
    if (!user) return;
    const content = getContent();
    const summary = roleSummary(user, content);

    els.greeting.textContent = `Hola, ${user.name} 👋`;
    els.sub.textContent = summary.sub;
    els.profile.innerHTML = profileCardHtml(user, affinities);
    // Títulos, textos y hrefs del resumen son literales estáticos: se escapan igual por convención.
    els.cta.innerHTML = `<h3>${escapeHtml(summary.cta.title)}</h3><p>${escapeHtml(summary.cta.text)}</p><a class="btn btn-light" href="${escapeHtml(summary.cta.href)}">${escapeHtml(summary.cta.label)}</a>`;
    els.stats.innerHTML = summary.stats.map(([value, label]) => `<div class="stat-card"><b>${escapeHtml(value)}</b><span>${escapeHtml(label)}</span></div>`).join('');

    els.recsSection.hidden = user.role !== ROLES.CONSUMER;
    els.recs.innerHTML = buildRecommendations({ affinities })
      .slice(0, TOP_RECOMMENDATIONS)
      .map((activity) => activityCard(activity, content.enrolled.includes(activity.id)))
      .join('');

    const upcoming = publishedEvents(content).filter((event) => !isPast(event)).slice(0, TOP_EVENTS);
    els.events.innerHTML = upcoming.length
      ? upcoming.map((event) => eventCard(event, content, { enroll: user.role === ROLES.CONSUMER })).join('')
      : `<div class="empty">${icon('calendar', 24)}<b>Sin eventos próximos</b>Vuelve pronto.</div>`;

    const isConsumer = user.role === ROLES.CONSUMER;
    const today = toISODate(new Date());
    const soon = isConsumer ? publishedEvents(content).filter((event) => {
      if (isPast(event) || !content.enrolled.includes(eventEnrollmentId(event))) return false;
      const days = Math.round((new Date(event.date) - new Date(`${today}T00:00:00`)) / 86400000);
      return days >= 0 && days <= 7;
    }) : [];
    els.soonSection.hidden = soon.length === 0;
    els.soon.innerHTML = soon.map((event) => eventCard(event, content, { enroll: isConsumer })).join('');
  }

  bindEnrollment(els.recs);
  bindEnrollment(els.events);
  bindEnrollment(els.soon);
  bindEventDetail(els.events);
  bindEventDetail(els.soon);
  appStore.subscribe(render);
  contentStore.subscribe(render);
  render();
}

export const screen = { id: 'inicio', label: 'Inicio', icon: icon('home'), nav: true, access: 'auth', mount };
