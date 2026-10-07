import './retos.css';
import template from './retos.html?raw';
import { $, delegate, escapeHtml } from '../../core/dom.js';
import { appStore } from '../../state/appStore.js';
import { INITIAL_TEAMS } from '../../data/teams.js';
import { ROLES } from '../../config/constants.js';
import { createFormModal } from '../../shared/components/formModal.js';
import { showToast } from '../../shared/components/toast.js';

function joinButton({ id, joined }) {
  return joined
    ? `<button class="btn btn-outline btn-sm" type="button" disabled>Te uniste ✓</button>`
    : `<button class="btn btn-primary btn-sm" type="button" data-join="${id}">Unirme al equipo</button>`;
}

function teamCard(team) {
  const members = team.members
    .map(({ initial, tone }) => `<div class="a ${tone}">${initial}</div>`)
    .join('');
  const footer = team.joinable
    ? joinButton(team)
    : '<p class="team-note">La IA empezará a sugerir jóvenes afines en las próximas horas.</p>';

  return `<div class="team-card">
    <div class="team-head">
      <div><b>${team.title}</b><div class="team-sub">${team.subtitle}</div></div>
      <span class="aff-badge">${team.members.length}/${team.capacity}</span>
    </div>
    <div class="avatars">${members}</div>
    ${footer}
  </div>`;
}

function mount(section) {
  section.innerHTML = template;

  const list = $('#teamsList', section);
  const teams = INITIAL_TEAMS.map((team) => ({ ...team }));

  function render() {
    list.innerHTML = teams.map(teamCard).join('');
  }

  const challengeModal = createFormModal({
    title: 'Crear nuevo reto comunitario',
    submitLabel: 'Crear reto',
    fields: [
      { name: 'title', placeholder: 'Nombre del reto (ej. Festival de música)' },
      { name: 'place', placeholder: 'Lugar o barrio' },
    ],
    onSubmit: ({ title, place }) => {
      teams.unshift({
        id: Date.now(),
        title: `✨ ${escapeHtml(title || 'Nuevo reto comunitario')}`,
        subtitle: `${escapeHtml(place || 'Comuna 2')} · equipo por formar`,
        capacity: 5,
        members: [],
        joinable: false,
        joined: false,
      });
      render();
      showToast('Reto creado ✓ — la IA empezará a armar tu equipo');
    },
  });

  delegate(list, 'click', '[data-join]', (_event, button) => {
    const team = teams.find(({ id }) => String(id) === button.dataset.join);
    if (!team) return;
    team.joined = true;
    render();
    showToast('Te uniste al equipo. La IA reajustará el reparto de roles.');
  });

  $('#createChallengeBtn', section).addEventListener('click', challengeModal.open);
  appStore.watch((state) => state.role, (role) => {
    $('#creatorBannerRetos', section).classList.toggle('show', role === ROLES.CREATOR);
  });
  render();
}

export const screen = { id: 'retos', label: 'Retos', mount };
