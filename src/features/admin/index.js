import './admin.css';
import template from './admin.html?raw';
import { $, delegate, escapeHtml } from '../../core/dom.js';
import { ROLES } from '../../config/constants.js';
import { PENDING_PROJECTS } from '../../data/admin.js';
import { EVENT_STATUS } from '../../data/events.js';
import { getPlace } from '../../data/places.js';
import { contentStore, createEvent, decideProject, setEventStatus } from '../../state/contentStore.js';
import { allEvents, formatEventDate } from '../../services/events.js';
import { formatPrice } from '../../utils/format.js';
import { createEventModal } from '../../shared/components/eventModal.js';
import { eventCard } from '../../shared/components/eventCard.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

const PROJECT_DECISIONS = {
  approved: { label: 'Aprobado', toast: 'Proyecto aprobado y notificado al colectivo.' },
  rejected: { label: 'Rechazado', toast: 'Proyecto rechazado.' },
};

const EVENT_DECISIONS = {
  [EVENT_STATUS.APPROVED]: 'Evento publicado ✓ — ya aparece para todos los jóvenes',
  [EVENT_STATUS.REJECTED]: 'Evento rechazado. El gestor verá el nuevo estado.',
};

function actionButtons(attribute, id) {
  return `<div class="pending-actions">
    <button class="btn btn-outline btn-sm" type="button" data-${attribute}="rejected" data-id="${id}">Rechazar</button>
    <button class="btn btn-primary btn-sm" type="button" data-${attribute}="approved" data-id="${id}">Aprobar</button>
  </div>`;
}

function projectItem({ id, name, meta }, decision) {
  const actions = decision
    ? `<span class="decision ${decision}">${PROJECT_DECISIONS[decision].label}</span>`
    : actionButtons('project', id);
  return `<div class="pending-item${decision ? ' done' : ''}">
    <div class="pending-main"><div class="name">${escapeHtml(name)}</div><div class="meta">${escapeHtml(meta)}</div></div>
    ${actions}
  </div>`;
}

function pendingEventItem(event) {
  const place = getPlace(event.placeId);
  const meta = `${event.ownerName} · ${formatEventDate(event.date)} · ${place ? place.name : event.barrio} · ${formatPrice(event.price)} · cupo ${event.capacity}`;
  return `<div class="pending-item">
    <div class="pending-main"><div class="name">${escapeHtml(event.title)}</div><div class="meta">${escapeHtml(meta)}</div></div>
    <div class="pending-actions">
      <button class="btn btn-outline btn-sm" type="button" data-event="${EVENT_STATUS.REJECTED}" data-id="${event.id}">Rechazar</button>
      <button class="btn btn-primary btn-sm" type="button" data-event="${EVENT_STATUS.APPROVED}" data-id="${event.id}">Publicar</button>
    </div>
  </div>`;
}

function mount(section) {
  section.innerHTML = template;

  const els = {
    pendingEvents: $('#pendingEvents', section),
    pendingEventsBadge: $('#pendingEventsBadge', section),
    projects: $('#pendingList', section),
    approvedBadge: $('#approvedBadge', section),
    allEvents: $('#allEvents', section),
    create: $('#createEventBtn', section),
  };
  els.create.innerHTML = `${icon('plus', 16)} Crear evento`;

  function render() {
    const content = contentStore.getState();
    const events = allEvents(content);
    const pending = events.filter(({ status }) => status === EVENT_STATUS.PENDING);

    els.pendingEventsBadge.textContent = `${pending.length} ${pending.length === 1 ? 'pendiente' : 'pendientes'}`;
    els.pendingEvents.innerHTML = pending.length
      ? pending.map(pendingEventItem).join('')
      : `<div class="empty">${icon('check', 24)}<b>Todo al día</b>No hay eventos esperando revisión.</div>`;

    els.projects.innerHTML = PENDING_PROJECTS.map((project) => projectItem(project, content.decisions[project.id])).join('');
    const approved = Object.values(content.decisions).filter((value) => value === 'approved').length;
    els.approvedBadge.textContent = `${approved} ${approved === 1 ? 'aprobado' : 'aprobados'}`;

    els.allEvents.innerHTML = [...events]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((event) => eventCard(event, content, { status: true }))
      .join('');
  }

  const eventModal = createEventModal({
    submitLabel: 'Publicar evento',
    onCreate: (event) => {
      createEvent({ ...event, ownerId: null, ownerName: 'Administración' }, { autoApprove: true });
      showToast('Evento publicado ✓');
    },
  });

  delegate(els.pendingEvents, 'click', '[data-event]', (_event, button) => {
    setEventStatus(button.dataset.id, button.dataset.event);
    showToast(EVENT_DECISIONS[button.dataset.event]);
  });
  delegate(els.projects, 'click', '[data-project]', (_event, button) => {
    decideProject(button.dataset.id, button.dataset.project);
    showToast(PROJECT_DECISIONS[button.dataset.project].toast);
  });
  els.create.addEventListener('click', () => eventModal.open());
  contentStore.subscribe(render);
  render();
}

export const screen = { id: 'admin', label: 'Moderación', icon: icon('shield'), nav: true, access: [ROLES.ADMIN], mount };
