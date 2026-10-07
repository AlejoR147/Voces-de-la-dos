import './perfil.css';
import template from './perfil.html?raw';
import { $, delegate, escapeHtml } from '../../core/dom.js';
import { AVAILABILITY_OPTIONS, ROLES, ROLE_LABELS } from '../../config/constants.js';
import { INTERESTS } from '../../data/interests.js';
import { NEIGHBORHOODS } from '../../data/neighborhoods.js';
import { getPlace } from '../../data/places.js';
import { appStore, resetApp, updateUser } from '../../state/appStore.js';
import { contentStore } from '../../state/contentStore.js';
import { allEvents } from '../../services/events.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

const ROLE_HINTS = {
  [ROLES.CONSUMER]: 'Descubre actividades, inscríbete y únete a equipos.',
  [ROLES.MANAGER]: 'Crea eventos, recibe inscripciones y sigue el dashboard de cada uno. Tus eventos pasan por revisión.',
  [ROLES.ADMIN]: 'Aprueba eventos y proyectos, publica eventos y ve el dashboard global de la comuna.',
};

const toggleItem = (list, item) => (list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);

function enrollmentLabel(id, events) {
  if (id.startsWith('place:')) {
    const place = getPlace(id.slice('place:'.length));
    return place ? { name: place.name, kind: 'Lugar' } : null;
  }
  if (id.startsWith('event:')) {
    const event = events.find((item) => item.id === id.slice('event:'.length));
    return event ? { name: event.title, kind: 'Evento' } : null;
  }
  const interestKey = id.startsWith('activity:') ? id.slice('activity:'.length) : null;
  return interestKey && INTERESTS[interestKey]
    ? { name: INTERESTS[interestKey].activity.title, kind: 'Actividad' }
    : null;
}

function chips(options, selected, attribute) {
  return options.map(({ value, label }) => (
    `<button type="button" class="chip${selected.includes(value) ? ' selected' : ''}" data-${attribute}="${escapeHtml(value)}">${label}</button>`
  )).join('');
}

function mount(section) {
  section.innerHTML = template;

  const els = {
    form: $('#profileForm', section),
    name: $('#pfName', section),
    age: $('#pfAge', section),
    ageValue: $('#pfAgeValue', section),
    barrio: $('#pfBarrio', section),
    availability: $('#pfAvailability', section),
    interests: $('#pfInterests', section),
    role: $('#pfRole', section),
    roleHint: $('#pfRoleHint', section),
    enrollments: $('#pfEnrollments', section),
  };
  let draft = null;

  $('#signOutBtn', section).innerHTML = `${icon('logout', 16)} Cerrar sesión y borrar datos`;
  els.barrio.innerHTML = NEIGHBORHOODS.map(({ name }) => `<option>${escapeHtml(name)}</option>`).join('');

  function renderDraft() {
    els.name.value = draft.name;
    els.age.value = draft.age;
    els.ageValue.textContent = `${draft.age} años`;
    els.barrio.value = draft.barrio;
    els.availability.innerHTML = chips(AVAILABILITY_OPTIONS.map((value) => ({ value, label: value })), draft.availability, 'availability');
    els.interests.innerHTML = chips(
      Object.entries(INTERESTS).map(([value, { emoji, label }]) => ({ value, label: `${emoji} ${label}` })),
      draft.interests,
      'interest',
    );
    els.role.innerHTML = chips(Object.values(ROLES).map((value) => ({ value, label: ROLE_LABELS[value] })), [draft.role], 'role');
    els.roleHint.textContent = ROLE_HINTS[draft.role];
  }

  function loadDraft() {
    const { user } = appStore.getState();
    if (!user) return;
    draft = { ...user, availability: [...user.availability], interests: [...user.interests] };
    renderDraft();
  }

  function renderEnrollments() {
    const content = contentStore.getState();
    const events = allEvents(content);
    const items = content.enrolled
      .map((id) => enrollmentLabel(id, events))
      .filter(Boolean)
      .map(({ name, kind }) => `<div class="enrollment"><b>${escapeHtml(name)}</b><span class="badge">${kind}</span></div>`);
    els.enrollments.innerHTML = items.join('')
      || `<div class="empty">${icon('calendar', 24)}<b>Aún no te has inscrito</b>Explora Para ti o el mapa.</div>`;
  }

  els.name.addEventListener('input', () => { draft.name = els.name.value; });
  els.age.addEventListener('input', () => {
    draft.age = Number(els.age.value);
    els.ageValue.textContent = `${draft.age} años`;
  });
  els.barrio.addEventListener('change', () => { draft.barrio = els.barrio.value; });
  delegate(els.availability, 'click', '[data-availability]', (_event, chip) => {
    draft.availability = toggleItem(draft.availability, chip.dataset.availability);
    chip.classList.toggle('selected');
  });
  delegate(els.interests, 'click', '[data-interest]', (_event, chip) => {
    draft.interests = toggleItem(draft.interests, chip.dataset.interest);
    chip.classList.toggle('selected');
  });
  delegate(els.role, 'click', '[data-role]', (_event, chip) => {
    draft.role = chip.dataset.role;
    els.role.querySelectorAll('.chip').forEach((item) => item.classList.toggle('selected', item === chip));
    els.roleHint.textContent = ROLE_HINTS[draft.role];
  });

  els.form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      showToast('El nombre no puede estar vacío');
      return;
    }
    if (draft.interests.length === 0) {
      showToast('Elige al menos un interés');
      return;
    }
    const { user } = appStore.getState();
    const sameInterests = [...draft.interests].sort().join() === [...user.interests].sort().join();
    const patch = { ...draft, name: draft.name.trim() };
    if (sameInterests) delete patch.interests;
    updateUser(patch);
    showToast('Perfil actualizado ✓');
  });

  $('#signOutBtn', section).addEventListener('click', () => {
    if (window.confirm('Se borrarán tu perfil y tus inscripciones de este navegador. ¿Continuar?')) resetApp();
  });

  contentStore.subscribe(renderEnrollments);
  screen.onShow = () => {
    loadDraft();
    renderEnrollments();
  };
  loadDraft();
  renderEnrollments();
}

export const screen = { id: 'perfil', label: 'Perfil', icon: icon('user'), nav: false, access: 'auth', mount };
