import './perfil.css';
import template from './perfil.html?raw';
import { $ } from '../../core/dom.js';
import { appStore } from '../../state/appStore.js';
import { INTERESTS } from '../../data/interests.js';
import { ROLE_LABELS } from '../../config/constants.js';

function renderAffinities(container, affinities) {
  container.innerHTML = '';
  affinities.forEach(({ key, score }) => {
    const { emoji, label } = INTERESTS[key];
    const row = document.createElement('div');
    row.className = 'affinity-row';
    row.innerHTML = `<div class="affinity-label"><span>${emoji} ${label}</span><span>${score}%</span></div>
      <div class="affinity-bar"><div class="affinity-fill" style="width:0%"></div></div>`;
    container.appendChild(row);
    requestAnimationFrame(() => { row.querySelector('.affinity-fill').style.width = `${score}%`; });
  });
}

function renderMiniRecommendations(container, affinities) {
  container.innerHTML = affinities.slice(0, 3).map(({ key, score }) => {
    const { title, desc } = INTERESTS[key].activity;
    return `<div class="rec-mini-card"><span class="tag">${score}% afinidad</span><div class="title">${title}</div><div class="desc">${desc}</div></div>`;
  }).join('');
}

function mount(section) {
  section.innerHTML = template;

  const els = {
    barrio: $('#profBarrio', section),
    avatar: $('#avatarInit', section),
    name: $('#profName', section),
    roleBadge: $('#profRoleBadge', section),
    affinities: $('#affinityList', section),
    miniRecs: $('#miniRecs', section),
  };

  appStore.watch((state) => state.affinities, (affinities) => {
    const { barrio } = appStore.getState();
    els.barrio.textContent = barrio;
    els.avatar.textContent = barrio.charAt(0);
    els.name.textContent = INTERESTS[affinities[0].key].profile;
    renderAffinities(els.affinities, affinities);
    renderMiniRecommendations(els.miniRecs, affinities);
  });

  appStore.watch((state) => state.role, (role) => {
    els.roleBadge.textContent = ROLE_LABELS[role];
    els.roleBadge.className = `role-badge ${role}`;
  });
}

export const screen = { id: 'perfil', label: 'Perfil IA', mount };
