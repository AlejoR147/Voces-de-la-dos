import './perfil.css';
import template from './perfil.html?raw';
import { $, $$, delegate, escapeHtml } from '../../core/dom.js';
import {
  AVAILABILITY_OPTIONS, ORG_TYPES, ROLES, ROLE_LABELS, SECURITY,
} from '../../config/constants.js';
import { INTERESTS } from '../../data/interests.js';
import { NEIGHBORHOODS } from '../../data/neighborhoods.js';
import { getPlace } from '../../data/places.js';
import { appStore } from '../../state/appStore.js';
import { contentStore, getContent } from '../../state/contentStore.js';
import { changePassword, deleteAccount, updateProfile } from '../../services/auth.js';
import { allEvents } from '../../services/events.js';
import { bindPasswordToggle } from '../../shared/components/passwordField.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

const SUBTITLES = {
  [ROLES.CONSUMER]: 'Actualiza tus datos e intereses: las recomendaciones se recalculan al guardar.',
  [ROLES.MANAGER]: 'Datos de tu organización. Se muestran a la administración al revisar tus eventos.',
  [ROLES.ADMIN]: 'Cuenta de administración.',
};

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

const barrioOptions = (selected) => NEIGHBORHOODS
  .map(({ name }) => `<option${name === selected ? ' selected' : ''}>${escapeHtml(name)}</option>`).join('');

const interestChips = (selected) => Object.entries(INTERESTS).map(([key, { emoji, label }]) => (
  `<button type="button" class="chip${selected.includes(key) ? ' selected' : ''}" data-interest="${key}">${emoji} ${label}</button>`
)).join('');

function input({ name, label, value = '', type = 'text', maxlength = 80, hint = '', autocomplete = 'off', span = '' }) {
  return `<div class="field ${span}"><label class="field-label" for="pf-${name}">${label}</label>
    <input class="input" id="pf-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" maxlength="${maxlength}" autocomplete="${autocomplete}">
    ${hint ? `<span class="field-hint">${hint}</span>` : ''}</div>`;
}

function consumerForm(user) {
  return `<div class="field"><label class="field-label" for="pf-name">Nombre o apodo</label>
      <input class="input" id="pf-name" name="name" maxlength="60" value="${escapeHtml(user.name)}" autocomplete="given-name"></div>
    <div class="field"><div class="field-inline"><label class="field-label" for="pf-age">Edad</label><span class="field-value" id="pfAgeValue">${Number(user.age)} años</span></div>
      <input type="range" id="pf-age" name="age" min="12" max="28" value="${Number(user.age)}"></div>
    <div class="field"><label class="field-label" for="pf-barrio">Barrio</label><select id="pf-barrio" name="barrio">${barrioOptions(user.barrio)}</select></div>
    <div class="field"><span class="field-label">Disponibilidad</span>
      <div class="chip-group" id="pfAvailability">${AVAILABILITY_OPTIONS.map((option) => `<button type="button" class="chip${user.availability.includes(option) ? ' selected' : ''}" data-availability="${option}">${option}</button>`).join('')}</div></div>
    <div class="field"><span class="field-label">Intereses</span><div class="chip-group" id="pfInterests">${interestChips(user.interests)}</div></div>`;
}

function organizationForm(user) {
  return `<div class="form-grid">
      ${input({ name: 'name', label: 'Nombre de la organización', value: user.name, maxlength: 60, autocomplete: 'organization' })}
      <div class="field"><label class="field-label" for="pf-orgType">Tipo de organización</label>
        <select id="pf-orgType" name="orgType">${ORG_TYPES.map((type) => `<option${type === user.orgType ? ' selected' : ''}>${type}</option>`).join('')}</select></div>
      ${input({ name: 'contactName', label: 'Persona responsable', value: user.contactName, maxlength: 60, autocomplete: 'name' })}
      ${input({ name: 'phone', label: 'Teléfono de contacto', value: user.phone, type: 'tel', maxlength: 20, autocomplete: 'tel' })}
      ${input({ name: 'taxId', label: 'NIT o documento', value: user.taxId, maxlength: 20 })}
      <div class="field"><label class="field-label" for="pf-barrio">Barrio sede</label><select id="pf-barrio" name="barrio">${barrioOptions(user.barrio)}</select></div>
      ${input({ name: 'website', label: 'Sitio web o red social', value: user.website, type: 'url', maxlength: 120, span: 'span-2' })}
      <div class="field span-2"><label class="field-label" for="pf-description">¿A qué se dedica?</label>
        <textarea class="input" id="pf-description" name="description" maxlength="300">${escapeHtml(user.description)}</textarea></div>
    </div>
    <div class="field"><span class="field-label">Categorías de eventos</span><div class="chip-group" id="pfInterests">${interestChips(user.interests)}</div></div>`;
}

function adminCard(user) {
  return `<div class="card"><h3 class="card-title">Cuenta</h3>
    <div class="account-line"><span>Nombre</span><b>${escapeHtml(user.name)}</b></div>
    <div class="account-line"><span>Correo</span><b>${escapeHtml(user.email)}</b></div>
    <div class="account-line"><span>Tipo de cuenta</span><b>${ROLE_LABELS[user.role]}</b></div></div>`;
}

function securityHtml(user) {
  if (user.role === ROLES.ADMIN) {
    return `<h3 class="card-title">Sesión</h3>
      <p class="note">La sesión de administración vive solo en esta pestaña: se cierra al recargar y tras ${SECURITY.adminIdleMs / 60000} minutos sin actividad. Cada acción queda en el registro de actividad.</p>`;
  }
  return `<h3 class="card-title">Seguridad</h3>
    <form class="security-form" id="pwForm" novalidate>
      <div class="field"><label class="field-label" for="pw-current">Contraseña actual</label>
        <div class="password-field"><input class="input" id="pw-current" name="current" type="password" autocomplete="current-password" maxlength="128"><button type="button" class="password-toggle" data-toggle="pw-current"></button></div></div>
      <div class="field"><label class="field-label" for="pw-next">Nueva contraseña</label>
        <div class="password-field"><input class="input" id="pw-next" name="next" type="password" autocomplete="new-password" maxlength="128"><button type="button" class="password-toggle" data-toggle="pw-next"></button></div>
        <span class="field-hint">Mínimo ${SECURITY.passwordMinLength} caracteres, con letras y números.</span></div>
      <p class="form-error" id="pwError" role="alert" hidden></p>
      <p class="form-success" id="pwOk" role="status" hidden>Contraseña actualizada.</p>
      <button class="btn btn-outline" type="submit">Cambiar contraseña</button>
    </form>
    <details class="danger-zone">
      <summary>Eliminar mi cuenta</summary>
      <p>Se borran tu cuenta${user.role === ROLES.MANAGER ? ', tus eventos' : ''} y tus inscripciones de este navegador. No se puede deshacer.</p>
      <form class="security-form" id="deleteForm" novalidate>
        <div class="field"><label class="field-label" for="del-password">Confirma tu contraseña</label>
          <div class="password-field"><input class="input" id="del-password" name="password" type="password" autocomplete="current-password" maxlength="128"><button type="button" class="password-toggle" data-toggle="del-password"></button></div></div>
        <p class="form-error" id="delError" role="alert" hidden></p>
        <button class="btn btn-danger" type="submit">Eliminar cuenta definitivamente</button>
      </form>
    </details>`;
}

function readProfile(form, user, section) {
  const interests = $$('#pfInterests .chip.selected', section).map((chip) => chip.dataset.interest);
  const base = { name: form.elements.name.value.trim(), barrio: form.elements.barrio.value, interests };

  if (user.role === ROLES.CONSUMER) {
    return {
      ...base,
      age: Number(form.elements.age.value),
      availability: $$('#pfAvailability .chip.selected', section).map((chip) => chip.dataset.availability),
    };
  }
  return {
    ...base,
    orgType: form.elements.orgType.value,
    contactName: form.elements.contactName.value.trim(),
    phone: form.elements.phone.value.trim(),
    taxId: form.elements.taxId.value.trim(),
    website: form.elements.website.value.trim(),
    description: form.elements.description.value.trim(),
  };
}

function validateProfile(profile, user) {
  if (profile.name.length < 2) return 'El nombre es demasiado corto.';
  if (profile.interests.length === 0) return user.role === ROLES.MANAGER ? 'Elige al menos una categoría.' : 'Elige al menos un interés.';
  if (user.role === ROLES.MANAGER) {
    if (profile.contactName.length < 2) return 'Indica la persona responsable.';
    if (profile.description.length < 10) return 'Describe brevemente a qué se dedica la organización.';
    if (profile.website) {
      try {
        if (!['http:', 'https:'].includes(new URL(profile.website).protocol)) throw new Error('protocol');
      } catch {
        return 'El sitio web debe empezar por http:// o https://';
      }
    }
  }
  return '';
}

function mount(section) {
  section.innerHTML = template;

  const els = {
    title: $('#pfTitle', section),
    sub: $('#pfSub', section),
    main: $('#pfMain', section),
    enrollCard: $('#pfEnrollCard', section),
    enrollments: $('#pfEnrollments', section),
    security: $('#pfSecurity', section),
  };

  function renderEnrollments() {
    const { user } = appStore.getState();
    const visible = user?.role === ROLES.CONSUMER;
    els.enrollCard.hidden = !visible;
    if (!visible) return;
    const content = getContent();
    const events = allEvents(content);
    const items = content.enrolled
      .map((id) => enrollmentLabel(id, events))
      .filter(Boolean)
      .map(({ name, kind }) => `<div class="enrollment"><b>${escapeHtml(name)}</b><span class="badge">${kind}</span></div>`);
    els.enrollments.innerHTML = items.join('')
      || `<div class="empty">${icon('calendar', 24)}<b>Aún no te has inscrito</b>Explora Para ti, Eventos o el mapa.</div>`;
  }

  function bindToggles(root) {
    $$('[data-toggle]', root).forEach((button) => {
      bindPasswordToggle($(`#${button.dataset.toggle}`, root), button);
    });
  }

  function render() {
    const { user } = appStore.getState();
    if (!user) {
      els.main.innerHTML = '';
      els.security.innerHTML = '';
      return;
    }

    els.title.textContent = user.role === ROLES.MANAGER ? 'Perfil de la organización' : 'Mi perfil';
    els.sub.textContent = SUBTITLES[user.role];

    if (user.role === ROLES.ADMIN) {
      els.main.innerHTML = adminCard(user);
    } else {
      els.main.innerHTML = `<form class="card profile-form" id="profileForm" novalidate>
        <div class="account-line"><span>Correo de acceso</span><b>${escapeHtml(user.email)}</b></div>
        ${user.role === ROLES.CONSUMER ? consumerForm(user) : organizationForm(user)}
        <p class="form-error" id="pfError" role="alert" hidden></p>
        <button class="btn btn-primary" type="submit">Guardar cambios</button>
      </form>`;
    }
    els.security.innerHTML = securityHtml(user);
    bindToggles(els.security);
    renderEnrollments();
  }

  delegate(els.main, 'click', '[data-availability], [data-interest]', (_event, chip) => chip.classList.toggle('selected'));
  els.main.addEventListener('input', (event) => {
    if (event.target.name === 'age') $('#pfAgeValue', els.main).textContent = `${event.target.value} años`;
  });

  els.main.addEventListener('submit', (event) => {
    event.preventDefault();
    const { user } = appStore.getState();
    const form = event.target;
    const error = $('#pfError', form);
    const profile = readProfile(form, user, section);
    const problem = validateProfile(profile, user);
    error.textContent = problem;
    error.hidden = !problem;
    if (problem) return;
    const result = updateProfile(profile);
    if (!result.ok) {
      error.textContent = result.error;
      error.hidden = false;
      return;
    }
    showToast('Perfil actualizado ✓');
  });

  els.security.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const button = $('button[type=submit]', form);

    if (form.id === 'pwForm') {
      const error = $('#pwError', form);
      const ok = $('#pwOk', form);
      error.hidden = true;
      ok.hidden = true;
      button.disabled = true;
      const result = await changePassword(form.elements.current.value, form.elements.next.value);
      button.disabled = false;
      if (result.ok) {
        form.reset();
        ok.hidden = false;
      } else {
        error.textContent = result.error;
        error.hidden = false;
      }
      return;
    }

    if (form.id === 'deleteForm') {
      const error = $('#delError', form);
      error.hidden = true;
      button.disabled = true;
      const result = await deleteAccount(form.elements.password.value);
      button.disabled = false;
      if (result.ok) showToast('Tu cuenta fue eliminada');
      else {
        error.textContent = result.error;
        error.hidden = false;
      }
    }
  });

  appStore.subscribe((state, previous) => {
    if (state.user !== previous.user) render();
  });
  contentStore.subscribe(renderEnrollments);
  screen.onShow = render;
  render();
}

export const screen = { id: 'perfil', label: 'Perfil', icon: icon('user'), nav: false, access: 'auth', mount };
