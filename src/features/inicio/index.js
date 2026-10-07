import './inicio.css';
import template from './inicio.html?raw';
import { $, escapeHtml } from '../../core/dom.js';
import { appStore } from '../../state/appStore.js';
import { contentStore } from '../../state/contentStore.js';
import { INTERESTS } from '../../data/interests.js';
import { UPCOMING_EVENTS } from '../../data/events.js';
import { ROLE_LABELS } from '../../config/constants.js';
import { profileTitle } from '../../services/affinity.js';
import { buildRecommendations } from '../../services/recommendations.js';
import { initialOf } from '../../utils/format.js';
import { activityCard } from '../../shared/components/activityCard.js';
import { bindEnrollment } from '../../shared/components/enrollButton.js';
import { eventCard } from '../../shared/components/eventCard.js';
import { icon } from '../../shared/icons.js';

const TOP_AFFINITIES = 4;
const TOP_RECOMMENDATIONS = 3;

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

function statsHtml({ enrolled, joinedTeams }) {
  const stats = [
    [enrolled.length, 'Inscripciones'],
    [joinedTeams.length, 'Equipos'],
    [UPCOMING_EVENTS.length, 'Eventos próximos'],
  ];
  return stats.map(([value, label]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`).join('');
}

function mount(section) {
  section.innerHTML = template;

  const els = {
    greeting: $('#homeGreeting', section),
    sub: $('#homeSub', section),
    profile: $('#profileCard', section),
    stats: $('#homeStats', section),
    recs: $('#homeRecs', section),
    events: $('#homeEvents', section),
  };

  function render() {
    const { user, affinities } = appStore.getState();
    if (!user) return;
    const content = contentStore.getState();

    els.greeting.textContent = `Hola, ${user.name} 👋`;
    els.sub.textContent = `Esto es lo que está pasando en ${user.barrio} y en toda la Comuna 2.`;
    els.profile.innerHTML = profileCardHtml(user, affinities);
    els.stats.innerHTML = statsHtml(content);

    els.recs.innerHTML = buildRecommendations({ affinities, customActivities: content.customActivities })
      .slice(0, TOP_RECOMMENDATIONS)
      .map((activity) => activityCard(activity, content.enrolled.includes(activity.id)))
      .join('');

    els.events.innerHTML = [...UPCOMING_EVENTS, ...content.customEvents].map(eventCard).join('')
      || `<div class="empty">${icon('calendar', 24)}<b>Sin eventos próximos</b>Vuelve pronto.</div>`;
  }

  bindEnrollment(els.recs);
  appStore.subscribe(render);
  contentStore.subscribe(render);
  render();
}

export const screen = { id: 'inicio', label: 'Inicio', icon: icon('home'), nav: true, access: 'auth', mount };
