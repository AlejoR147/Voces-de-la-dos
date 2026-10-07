import './admin.css';
import template from './admin.html?raw';
import { $, delegate, escapeHtml } from '../../core/dom.js';
import { ROLES } from '../../config/constants.js';
import { PENDING_PROJECTS } from '../../data/admin.js';
import { UPCOMING_EVENTS } from '../../data/events.js';
import { addEvent, contentStore, decideProject } from '../../state/contentStore.js';
import { parsePriceInput } from '../../utils/format.js';
import { createFormModal } from '../../shared/components/formModal.js';
import { eventCard } from '../../shared/components/eventCard.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

const DECISIONS = {
  approved: { label: 'Aprobado', toast: 'Proyecto aprobado y notificado al colectivo.' },
  rejected: { label: 'Rechazado', toast: 'Proyecto rechazado.' },
};

function projectItem({ id, name, meta }, decision) {
  const actions = decision
    ? `<span class="decision ${decision}">${DECISIONS[decision].label}</span>`
    : `<div class="pending-actions">
        <button class="btn btn-outline btn-sm" type="button" data-decision="rejected" data-id="${id}">Rechazar</button>
        <button class="btn btn-primary btn-sm" type="button" data-decision="approved" data-id="${id}">Aprobar</button>
      </div>`;
  return `<div class="pending-item${decision ? ' done' : ''}">
    <div><div class="name">${escapeHtml(name)}</div><div class="meta">${escapeHtml(meta)}</div></div>
    ${actions}
  </div>`;
}

function mount(section) {
  section.innerHTML = template;

  const pendingList = $('#pendingList', section);
  const approvedBadge = $('#approvedBadge', section);
  const eventsMini = $('#eventsMini', section);
  $('#createEventBtn', section).innerHTML = `${icon('plus', 16)} Crear nuevo evento`;

  function render() {
    const { decisions, customEvents } = contentStore.getState();
    pendingList.innerHTML = PENDING_PROJECTS.map((project) => projectItem(project, decisions[project.id])).join('');
    const approved = Object.values(decisions).filter((value) => value === 'approved').length;
    approvedBadge.textContent = `${approved} ${approved === 1 ? 'aprobado' : 'aprobados'}`;
    eventsMini.innerHTML = [...UPCOMING_EVENTS, ...customEvents].map(eventCard).join('');
  }

  const eventModal = createFormModal({
    title: 'Crear nuevo evento',
    submitLabel: 'Crear evento',
    fields: [
      { name: 'title', placeholder: 'Nombre del evento' },
      { name: 'barrio', placeholder: 'Barrio' },
      { name: 'date', placeholder: 'Fecha (ej. 28 jul)' },
      { name: 'price', placeholder: 'Precio (vacío o "Gratis", o ej. $10.000)' },
    ],
    onSubmit: ({ title, barrio, date, price }) => {
      addEvent({
        title: title || 'Nuevo evento',
        barrio: barrio || 'Comuna 2',
        date: date || 'Próximamente',
        price: parsePriceInput(price),
      });
      showToast('Evento creado ✓');
    },
  });

  delegate(pendingList, 'click', '[data-decision]', (_event, button) => {
    decideProject(button.dataset.id, button.dataset.decision);
    showToast(DECISIONS[button.dataset.decision].toast);
  });
  $('#createEventBtn', section).addEventListener('click', eventModal.open);
  contentStore.subscribe(render);
  render();
}

export const screen = { id: 'admin', label: 'Moderación', icon: icon('shield'), nav: true, access: [ROLES.ADMIN], mount };
