import './bienvenida.css';
import template from './bienvenida.html?raw';
import { $, delegate, escapeHtml } from '../../core/dom.js';
import { AVAILABILITY_OPTIONS, PUBLIC_SCREEN, ROLES, ROLE_OPTIONS } from '../../config/constants.js';
import { INTERESTS } from '../../data/interests.js';
import { NEIGHBORHOODS } from '../../data/neighborhoods.js';
import { registerUser } from '../../state/appStore.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

const STEPS = [
  { title: '¿Qué quieres hacer?', sub: 'Elige cómo quieres vivir la cultura de tu barrio. Podrás cambiarlo después.' },
  { title: 'Cuéntanos sobre ti', sub: 'Solo lo esencial para construir tu perfil.' },
  { title: '¿Qué te apasiona?', sub: 'Elige uno o varios intereses. Con eso ordenamos las actividades para ti.' },
];

const initialDraft = () => ({
  role: ROLES.CONSUMER,
  name: '',
  age: 16,
  barrio: NEIGHBORHOODS[1].name,
  availability: [AVAILABILITY_OPTIONS[0]],
  interests: [],
});

const toggleItem = (list, item) => (list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);

function stepBody(step, draft) {
  if (step === 0) {
    return `<div class="role-options">${ROLE_OPTIONS.map(({ value, icon: emoji, title, desc }) => `
      <button type="button" class="role-option${draft.role === value ? ' active' : ''}" data-role="${value}">
        <span class="role-icon">${emoji}</span><b>${title}</b><span>${desc}</span>
      </button>`).join('')}</div>`;
  }

  if (step === 1) {
    return `
      <div class="field"><label class="field-label" for="wzName">¿Cómo te llamas?</label>
        <input class="input" id="wzName" type="text" maxlength="40" autocomplete="given-name" placeholder="Tu nombre o apodo" value="${escapeHtml(draft.name)}"></div>
      <div class="field"><div class="field-inline"><label class="field-label" for="wzAge">Edad</label><span class="field-value" id="wzAgeValue">${draft.age} años</span></div>
        <input type="range" id="wzAge" min="12" max="28" value="${draft.age}"></div>
      <div class="field"><label class="field-label" for="wzBarrio">Barrio</label>
        <select id="wzBarrio">${NEIGHBORHOODS.map(({ name }) => `<option${name === draft.barrio ? ' selected' : ''}>${escapeHtml(name)}</option>`).join('')}</select></div>
      <div class="field"><span class="field-label">Disponibilidad</span>
        <div class="chip-group">${AVAILABILITY_OPTIONS.map((option) => `<button type="button" class="chip${draft.availability.includes(option) ? ' selected' : ''}" data-availability="${option}">${option}</button>`).join('')}</div></div>`;
  }

  return `<div class="chip-group">${Object.entries(INTERESTS).map(([key, { emoji, label }]) => (
    `<button type="button" class="chip${draft.interests.includes(key) ? ' selected' : ''}" data-interest="${key}">${emoji} ${label}</button>`
  )).join('')}</div>`;
}

function wizardHtml(step, draft) {
  const last = step === STEPS.length - 1;
  return `<div class="card wizard">
    <div class="wizard-top"><span class="wizard-step">Paso ${step + 1} de ${STEPS.length}</span></div>
    <div class="progress"><span style="width:${((step + 1) / STEPS.length) * 100}%"></span></div>
    <h2>${STEPS[step].title}</h2>
    <p class="wizard-sub">${STEPS[step].sub}</p>
    <div class="wizard-body">${stepBody(step, draft)}</div>
    <div class="wizard-footer">
      <button type="button" class="btn btn-outline" data-back>${icon('back', 16)} ${step === 0 ? 'Inicio' : 'Atrás'}</button>
      <button type="button" class="btn btn-primary" data-next>${last ? 'Crear mi perfil' : 'Continuar'} ${icon(last ? 'check' : 'arrow', 16)}</button>
    </div>
  </div>`;
}

function mount(section) {
  section.innerHTML = template;

  const landing = $('#landing', section);
  const onboarding = $('#onboarding', section);
  let step = 0;
  let draft = initialDraft();

  function render() {
    onboarding.innerHTML = wizardHtml(step, draft);
  }

  function open() {
    step = 0;
    draft = initialDraft();
    landing.hidden = true;
    onboarding.hidden = false;
    render();
    window.scrollTo({ top: 0 });
  }

  function close() {
    onboarding.hidden = true;
    landing.hidden = false;
  }

  function next() {
    if (step === 1 && !draft.name.trim()) {
      showToast('Cuéntanos cómo te llamas para continuar');
      $('#wzName', onboarding)?.focus();
      return;
    }
    if (step === STEPS.length - 1) {
      if (draft.interests.length === 0) {
        showToast('Elige al menos un interés');
        return;
      }
      registerUser({ ...draft, name: draft.name.trim() });
      showToast(`¡Bienvenido, ${draft.name.trim()}!`);
      close();
      return;
    }
    step += 1;
    render();
  }

  function back() {
    if (step === 0) {
      close();
      return;
    }
    step -= 1;
    render();
  }

  $('[data-start]', section).addEventListener('click', open);
  delegate(onboarding, 'click', '[data-next]', next);
  delegate(onboarding, 'click', '[data-back]', back);
  delegate(onboarding, 'click', '[data-role]', (_event, button) => {
    draft.role = button.dataset.role;
    render();
  });
  delegate(onboarding, 'click', '[data-availability]', (_event, chip) => {
    draft.availability = toggleItem(draft.availability, chip.dataset.availability);
    chip.classList.toggle('selected');
  });
  delegate(onboarding, 'click', '[data-interest]', (_event, chip) => {
    draft.interests = toggleItem(draft.interests, chip.dataset.interest);
    chip.classList.toggle('selected');
  });
  onboarding.addEventListener('input', (event) => {
    if (event.target.id === 'wzName') draft.name = event.target.value;
    if (event.target.id === 'wzAge') {
      draft.age = Number(event.target.value);
      $('#wzAgeValue', onboarding).textContent = `${draft.age} años`;
    }
  });
  onboarding.addEventListener('change', (event) => {
    if (event.target.id === 'wzBarrio') draft.barrio = event.target.value;
  });
  onboarding.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.id === 'wzName') next();
  });
}

export const screen = {
  id: PUBLIC_SCREEN,
  label: 'Bienvenida',
  icon: icon('home'),
  nav: false,
  access: 'public',
  mount,
};
