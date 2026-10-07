import './retos.css';
import template from './retos.html?raw';
import { $, delegate, escapeHtml } from '../../core/dom.js';
import { appStore, isCreator } from '../../state/appStore.js';
import { addTeam, contentStore, toggleTeamMembership } from '../../state/contentStore.js';
import { INITIAL_TEAMS } from '../../data/teams.js';
import { initialOf } from '../../utils/format.js';
import { createFormModal } from '../../shared/components/formModal.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

function teamCard(team, { joined, user }) {
  const total = team.members.length + (joined ? 1 : 0);
  const full = total >= team.capacity && !joined;
  const members = team.members.map(({ initial, tone }) => `<div class="a ${tone}">${initial}</div>`).join('')
    + (joined ? `<div class="a me" title="Tú">${escapeHtml(initialOf(user.name))}</div>` : '');
  const empty = total === 0
    ? '<p class="team-note">La IA empezará a sugerir jóvenes afines en las próximas horas.</p>'
    : `<div class="avatars">${members}</div>`;

  const action = joined
    ? `<button class="btn btn-soft btn-sm" type="button" data-team="${team.id}">${icon('check', 16)} Te uniste · Salir</button>`
    : `<button class="btn btn-primary btn-sm" type="button" data-team="${team.id}"${full ? ' disabled' : ''}>${full ? 'Equipo completo' : 'Unirme al equipo'}</button>`;

  return `<article class="card card-hover team-card">
    <div class="team-head">
      <span class="team-icon">${team.icon}</span>
      <div class="team-info"><h4>${escapeHtml(team.title)}</h4><div class="team-sub">${escapeHtml(team.subtitle)}</div></div>
    </div>
    ${empty}
    <div class="team-foot"><span class="team-spots">${total}/${team.capacity} integrantes</span>${action}</div>
  </article>`;
}

function mount(section) {
  section.innerHTML = template;

  const list = $('#teamsList', section);
  const createBtn = $('#createChallengeBtn', section);
  createBtn.innerHTML = `${icon('plus', 16)} Crear reto`;

  function render() {
    const { user } = appStore.getState();
    if (!user) return;
    const { customTeams, joinedTeams } = contentStore.getState();
    list.innerHTML = [...customTeams, ...INITIAL_TEAMS]
      .map((team) => teamCard({ members: [], icon: '✨', ...team }, { joined: joinedTeams.includes(team.id), user }))
      .join('');
    createBtn.hidden = !isCreator();
  }

  const challengeModal = createFormModal({
    title: 'Crear nuevo reto comunitario',
    submitLabel: 'Crear reto',
    fields: [
      { name: 'title', placeholder: 'Nombre del reto (ej. Festival de música)' },
      { name: 'place', placeholder: 'Lugar o barrio' },
    ],
    onSubmit: ({ title, place }) => {
      addTeam({
        icon: '✨',
        title: title || 'Nuevo reto comunitario',
        subtitle: `${place || 'Comuna 2'} · equipo por formar`,
        capacity: 5,
        members: [],
      });
      showToast('Reto creado ✓ — la IA empezará a armar tu equipo');
    },
  });

  delegate(list, 'click', '[data-team]', (_event, button) => {
    const joined = toggleTeamMembership(button.dataset.team);
    showToast(joined ? 'Te uniste al equipo. La IA reajustará el reparto de roles.' : 'Saliste del equipo');
  });
  createBtn.addEventListener('click', challengeModal.open);
  appStore.subscribe(render);
  contentStore.subscribe(render);
  render();
}

export const screen = { id: 'retos', label: 'Retos', icon: icon('flag'), nav: true, access: 'auth', mount };
