import './bienvenida.css';
import template from './bienvenida.html?raw';
import { $, $$, delegate, escapeHtml } from '../../core/dom.js';
import {
  ACCOUNT_TYPE_OPTIONS, AVAILABILITY_OPTIONS, ORG_TYPES, PUBLIC_SCREEN, ROLES, SECURITY,
} from '../../config/constants.js';
import { INTERESTS } from '../../data/interests.js';
import { NEIGHBORHOODS } from '../../data/neighborhoods.js';
import { registerAccount, validateEmail, validatePassword } from '../../services/auth.js';
import { showToast } from '../../shared/components/toast.js';
import { bindPasswordToggle } from '../../shared/components/passwordField.js';
import { icon } from '../../shared/icons.js';
import { contentStore, getContent } from '../../state/contentStore.js';
import { publishedEvents, isPast } from '../../services/events.js';
import { eventCard } from '../../shared/components/eventCard.js';
import { bindEnrollment } from '../../shared/components/enrollButton.js';

const STEP_COUNT = 4;

const initialDraft = () => ({
  role: ROLES.CONSUMER,
  name: '',
  email: '',
  password: '',
  age: 16,
  barrio: NEIGHBORHOODS[1].name,
  availability: [AVAILABILITY_OPTIONS[0]],
  interests: [],
  orgType: ORG_TYPES[0],
  contactName: '',
  phone: '',
  taxId: '',
  website: '',
  description: '',
});

const isOrg = (draft) => draft.role === ROLES.MANAGER;
const toggleItem = (list, item) => (list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);

function stepCopy(step, draft) {
  const org = isOrg(draft);
  return [
    { title: '¿Cómo vas a usar la plataforma?', sub: 'Elige el tipo de cuenta. No se puede cambiar después.' },
    org
      ? { title: 'Cuenta de la organización', sub: 'Con este correo y contraseña ingresará el equipo responsable de la organización.' }
      : { title: 'Crea tu cuenta', sub: 'Tu correo y una contraseña para volver a entrar.' },
    org
      ? { title: 'Cuéntanos sobre la organización', sub: 'Esta información ayuda a la administración a revisar tus eventos.' }
      : { title: 'Cuéntanos sobre ti', sub: 'Solo lo esencial para construir tu perfil.' },
    org
      ? { title: '¿Qué tipo de eventos organizan?', sub: 'Elige una o varias categorías.' }
      : { title: '¿Qué te apasiona?', sub: 'Elige uno o varios intereses. Con eso ordenamos las actividades para ti.' },
  ][step];
}

function textField({ field, label, value, type = 'text', placeholder = '', autocomplete = 'off', maxlength = 80, hint = '', extra = '', className = '' }) {
  return `<div class="field ${className}"><label class="field-label" for="wz-${field}">${label}</label>
    <input class="input" id="wz-${field}" data-field="${field}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" autocomplete="${autocomplete}" maxlength="${maxlength}"${extra}>
    ${hint ? `<span class="field-hint">${hint}</span>` : ''}</div>`;
}

function barrioSelect(draft) {
  return `<div class="field"><label class="field-label" for="wz-barrio">${isOrg(draft) ? 'Barrio sede' : 'Barrio'}</label>
    <select id="wz-barrio" data-field="barrio">${NEIGHBORHOODS.map(({ name }) => `<option${name === draft.barrio ? ' selected' : ''}>${escapeHtml(name)}</option>`).join('')}</select></div>`;
}

function stepBody(step, draft) {
  const org = isOrg(draft);

  if (step === 0) {
    return `<div class="role-options">${ACCOUNT_TYPE_OPTIONS.map(({ value, icon: emoji, title, desc }) => `
      <button type="button" class="role-option${draft.role === value ? ' active' : ''}" data-role="${value}">
        <span class="role-icon">${emoji}</span><b>${title}</b><span>${desc}</span>
      </button>`).join('')}</div>`;
  }

  if (step === 1) {
    return `${textField({ field: 'name', label: org ? 'Nombre de la organización' : 'Tu nombre o apodo', value: draft.name, autocomplete: org ? 'organization' : 'given-name', maxlength: 60 })}
      ${textField({ field: 'email', label: org ? 'Correo de la organización' : 'Correo electrónico', value: draft.email, type: 'email', autocomplete: 'email', maxlength: 120 })}
      <div class="field"><label class="field-label" for="wz-password">Contraseña</label>
        <div class="password-field"><input class="input" id="wz-password" data-field="password" type="password" autocomplete="new-password" maxlength="128" value="${escapeHtml(draft.password)}">
        <button type="button" class="password-toggle" id="wzToggle"></button></div>
        <span class="field-hint">Mínimo ${SECURITY.passwordMinLength} caracteres, con letras y números.</span></div>`;
  }

  if (step === 2 && org) {
    return `<div class="form-grid">
      <div class="field"><label class="field-label" for="wz-orgType">Tipo de organización</label>
        <select id="wz-orgType" data-field="orgType">${ORG_TYPES.map((type) => `<option${type === draft.orgType ? ' selected' : ''}>${type}</option>`).join('')}</select></div>
      ${barrioSelect(draft)}
      ${textField({ field: 'contactName', label: 'Persona responsable', value: draft.contactName, autocomplete: 'name', maxlength: 60 })}
      ${textField({ field: 'phone', label: 'Teléfono de contacto', value: draft.phone, type: 'tel', autocomplete: 'tel', maxlength: 20, hint: 'Opcional' })}
      ${textField({ field: 'taxId', label: 'NIT o documento', value: draft.taxId, maxlength: 20, hint: 'Opcional', className: '' })}
      ${textField({ field: 'website', label: 'Sitio web o red social', value: draft.website, type: 'url', placeholder: 'https://', maxlength: 120, hint: 'Opcional' })}
      <div class="field span-2"><label class="field-label" for="wz-description">¿A qué se dedica?</label>
        <textarea class="input" id="wz-description" data-field="description" maxlength="300" placeholder="Describe brevemente la organización y sus actividades">${escapeHtml(draft.description)}</textarea></div>
    </div>`;
  }

  if (step === 2) {
    return `<div class="field"><div class="field-inline"><label class="field-label" for="wz-age">Edad</label><span class="field-value" id="wzAgeValue">${draft.age} años</span></div>
        <input type="range" id="wz-age" data-field="age" min="12" max="28" value="${draft.age}"></div>
      ${barrioSelect(draft)}
      <div class="field"><span class="field-label">Disponibilidad</span>
        <div class="chip-group">${AVAILABILITY_OPTIONS.map((option) => `<button type="button" class="chip${draft.availability.includes(option) ? ' selected' : ''}" data-availability="${option}">${option}</button>`).join('')}</div></div>`;
  }

  return `<div class="chip-group">${Object.entries(INTERESTS).map(([key, { emoji, label }]) => (
    `<button type="button" class="chip${draft.interests.includes(key) ? ' selected' : ''}" data-interest="${key}">${emoji} ${label}</button>`
  )).join('')}</div>`;
}

function validate(step, draft) {
  if (step === 1) {
    if (draft.name.trim().length < 2) return { error: isOrg(draft) ? 'Escribe el nombre de la organización.' : 'Cuéntanos cómo te llamas.', field: 'name' };
    const emailError = validateEmail(draft.email);
    if (emailError) return { error: emailError, field: 'email' };
    const passwordError = validatePassword(draft.password);
    if (passwordError) return { error: passwordError, field: 'password' };
  }
  if (step === 2 && isOrg(draft)) {
    if (draft.contactName.trim().length < 2) return { error: 'Indica la persona responsable.', field: 'contactName' };
    if (draft.description.trim().length < 10) return { error: 'Describe brevemente a qué se dedica la organización.', field: 'description' };
    if (draft.website.trim()) {
      try {
        if (!['http:', 'https:'].includes(new URL(draft.website.trim()).protocol)) throw new Error('protocol');
      } catch {
        return { error: 'El sitio web debe empezar por http:// o https://', field: 'website' };
      }
    }
  }
  if (step === STEP_COUNT - 1 && draft.interests.length === 0) {
    return { error: isOrg(draft) ? 'Elige al menos una categoría.' : 'Elige al menos un interés.' };
  }
  return null;
}

function buildProfile(draft) {
  if (isOrg(draft)) {
    return {
      name: draft.name.trim(),
      orgType: draft.orgType,
      contactName: draft.contactName.trim(),
      phone: draft.phone.trim(),
      taxId: draft.taxId.trim(),
      barrio: draft.barrio,
      website: draft.website.trim(),
      description: draft.description.trim(),
      interests: draft.interests,
    };
  }
  return {
    name: draft.name.trim(),
    age: draft.age,
    barrio: draft.barrio,
    availability: draft.availability,
    interests: draft.interests,
  };
}

function wizardHtml(step, draft, { error, busy }) {
  const last = step === STEP_COUNT - 1;
  const { title, sub } = stepCopy(step, draft);
  return `<div class="card wizard">
    <div class="wizard-top"><span class="wizard-step">Paso ${step + 1} de ${STEP_COUNT}</span></div>
    <div class="progress"><span style="width:${((step + 1) / STEP_COUNT) * 100}%"></span></div>
    <h2>${title}</h2>
    <p class="wizard-sub">${sub}</p>
    <div class="wizard-body">${stepBody(step, draft)}</div>
    <p class="form-error wizard-error" role="alert"${error ? '' : ' hidden'}>${escapeHtml(error)}</p>
    <div class="wizard-footer">
      <button type="button" class="btn btn-outline" data-back>${icon('back', 16)} ${step === 0 ? 'Inicio' : 'Atrás'}</button>
      <button type="button" class="btn btn-primary" data-next${busy ? ' disabled' : ''}>${last ? (busy ? 'Creando…' : 'Crear cuenta') : 'Continuar'} ${icon(last ? 'check' : 'arrow', 16)}</button>
    </div>
  </div>`;
}

function mount(section) {
  section.innerHTML = template;

  const landing = $('#landing', section);
  const onboarding = $('#onboarding', section);
  const eventsList = $('#homeEvents', section);
  let step = 0;
  let draft = initialDraft();
  let error = '';
  let busy = false;

  function render() {
    onboarding.innerHTML = wizardHtml(step, draft, { error, busy });
    const toggle = $('#wzToggle', onboarding);
    if (toggle) bindPasswordToggle($('#wz-password', onboarding), toggle);
  }

  function setError(message, field) {
    error = message;
    render();
    if (field) $(`[data-field="${field}"]`, onboarding)?.focus();
  }

  function open() {
    step = 0;
    draft = initialDraft();
    error = '';
    busy = false;
    landing.hidden = true;
    onboarding.hidden = false;
    render();
    window.scrollTo({ top: 0 });
  }

  function close() {
    onboarding.hidden = true;
    landing.hidden = false;
    draft = initialDraft();
  }

  async function next() {
    if (busy) return;
    const problem = validate(step, draft);
    if (problem) {
      setError(problem.error, problem.field);
      return;
    }
    error = '';

    if (step < STEP_COUNT - 1) {
      step += 1;
      render();
      return;
    }

    busy = true;
    render();
    const result = await registerAccount({
      email: draft.email,
      password: draft.password,
      role: draft.role,
      profile: buildProfile(draft),
    });
    busy = false;
    if (!result.ok) {
      step = 1;
      setError(result.error, result.field);
      return;
    }
    showToast(`¡Bienvenido, ${draft.name.trim()}!`);
    close();
  }

  function back() {
    error = '';
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

  const readField = (event) => {
    const { field } = event.target.dataset;
    if (!field) return;
    draft[field] = field === 'age' ? Number(event.target.value) : event.target.value;
    if (field === 'age') $('#wzAgeValue', onboarding).textContent = `${draft.age} años`;
  };
  onboarding.addEventListener('input', readField);
  onboarding.addEventListener('change', readField);
  onboarding.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.tagName === 'INPUT' && event.target.type !== 'range') {
      event.preventDefault();
      next();
    }
  });

  // === STATS COUNTERS ===
  function animateCounters() {
    const counters = $$('.stat-number', landing);
    counters.forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      if (isNaN(target)) return;
      let current = 0;
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        current = Math.floor(target * eased);
        el.textContent = `+${current.toLocaleString('es-CO')}`;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = `+${target.toLocaleString('es-CO')}`;
      }
      requestAnimationFrame(tick);
    });
  }

  let countersAnimated = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !countersAnimated) {
        countersAnimated = true;
        setTimeout(animateCounters, 600);
      }
    });
  }, { threshold: 0.3 });
  observer.observe(landing);

  // === EVENTS PREVIEW ===
  function renderEvents() {
    if (!eventsList) return;
    const content = getContent();
    const user = content;
    const upcoming = publishedEvents(content)
      .filter((event) => !isPast(event))
      .slice(0, 3);
    eventsList.innerHTML = upcoming.length
      ? upcoming.map((event) => eventCard(event, content, { enroll: false })).join('')
      : '<p class="empty-events">No hay eventos próximos. ¡Vuelve pronto!</p>';
    bindEnrollment(eventsList);
  }

  // === INFINITE MARQUEE CAROUSELS ===
  function initCarousels() {
    document.querySelectorAll('.carousel-track').forEach((track) => {
      const slides = $$('.carousel-slide', track);
      slides.forEach((slide) => {
        const clone = slide.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    });

    const ltrRoot = $('[data-carousel]', section);
    if (ltrRoot) {
      const track = $('[data-carousel-track]', ltrRoot);
      const prevBtn = $('[data-carousel-prev]', ltrRoot);
      const nextBtn = $('[data-carousel-next]', ltrRoot);
      let page = 0;

      function perView() { return window.innerWidth <= 860 ? 1 : 3; }

      function jump(dir) {
        const pv = perView();
        const allSlides = $$('.carousel-slide', track);
        const half = allSlides.length / 2;
        page = (page + dir + half) % half;
        const slideWidth = allSlides[0].getBoundingClientRect().width + 16;
        track.style.animation = 'none';
        track.style.transform = `translateX(-${page * pv * slideWidth}px)`;
        clearTimeout(jump._t);
        jump._t = setTimeout(() => { track.style.animation = ''; track.style.transform = ''; }, 600);
      }

      prevBtn?.addEventListener('click', () => jump(-1));
      nextBtn?.addEventListener('click', () => jump(1));
    }
  }

  screen.onShow = () => {
    if (location.hash === '#bienvenida' && sessionStorage.getItem('scvd:open-signup')) {
      sessionStorage.removeItem('scvd:open-signup');
      open();
    }
    countersAnimated = false;
    renderEvents();
  };

  renderEvents();
  initCarousels();
}

export const screen = {
  id: PUBLIC_SCREEN,
  label: 'Bienvenida',
  icon: icon('home'),
  nav: false,
  access: 'public',
  mount,
};
