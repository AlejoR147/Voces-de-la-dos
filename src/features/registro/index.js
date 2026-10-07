import './registro.css';
import template from './registro.html?raw';
import { $, $$, delegate, escapeHtml } from '../../core/dom.js';
import { navigate } from '../../app/router.js';
import { appStore, setRole, submitProfile } from '../../state/appStore.js';
import { INTERESTS } from '../../data/interests.js';
import { NEIGHBORHOODS } from '../../data/neighborhoods.js';

function mount(section) {
  section.innerHTML = template;

  const picker = $('#interestPicker', section);
  const barrioSelect = $('#barrioSelect', section);
  const typeToggle = $('#typeToggle', section);
  const ageRange = $('#edadRange', section);
  const ageValue = $('#edadVal', section);

  const { interests, barrio } = appStore.getState();

  picker.innerHTML = Object.entries(INTERESTS)
    .map(([key, { emoji, label }]) => (
      `<span class="chip${interests.includes(key) ? ' selected' : ''}" data-interest="${key}">${emoji} ${label}</span>`
    ))
    .join('');

  barrioSelect.innerHTML = NEIGHBORHOODS
    .map(({ name }) => `<option${name === barrio ? ' selected' : ''}>${escapeHtml(name)}</option>`)
    .join('');

  delegate(picker, 'click', '.chip', (_event, chip) => chip.classList.toggle('selected'));
  delegate(typeToggle, 'click', '.type-card', (_event, card) => setRole(card.dataset.type));
  ageRange.addEventListener('input', () => { ageValue.textContent = ageRange.value; });

  appStore.watch((state) => state.role, (role) => {
    $$('.type-card', typeToggle).forEach((card) => card.classList.toggle('active', card.dataset.type === role));
  });

  $('#continueBtn', section).addEventListener('click', () => {
    submitProfile({
      interests: $$('.chip.selected', picker).map((chip) => chip.dataset.interest),
      barrio: barrioSelect.value,
    });
    navigate('perfil');
  });
}

export const screen = { id: 'registro', label: 'Registro', mount };
