import './admin.css';
import template from './admin.html?raw';
import { $, delegate, escapeHtml } from '../../core/dom.js';
import { INITIAL_PROJECTS, INITIAL_UPCOMING_EVENTS } from '../../data/admin.js';
import { parsePriceInput } from '../../utils/format.js';
import { priceBadge } from '../../shared/components/priceBadge.js';
import { createFormModal } from '../../shared/components/formModal.js';
import { showToast } from '../../shared/components/toast.js';

const DECISIONS = {
  approved: { label: 'Aprobado ✓', toast: 'Proyecto aprobado y notificado al colectivo.' },
  rejected: { label: 'Rechazado', toast: 'Proyecto rechazado.' },
};

function projectItem({ id, name, meta, decision }) {
  const resolved = Boolean(decision);
  const outcome = resolved ? ` <span class="decision ${decision}">— ${DECISIONS[decision].label}</span>` : '';
  return `<div class="pending-item${resolved ? ' done' : ''}">
    <div><div class="name">${escapeHtml(name)}${outcome}</div><div class="meta">${escapeHtml(meta)}</div></div>
    <div class="pending-actions">
      <button class="btn btn-outline btn-sm" type="button" data-decision="rejected" data-id="${id}"${resolved ? ' disabled' : ''}>Rechazar</button>
      <button class="btn btn-primary btn-sm" type="button" data-decision="approved" data-id="${id}"${resolved ? ' disabled' : ''}>Aprobar</button>
    </div>
  </div>`;
}

function eventCard({ title, barrio, date, price }) {
  return `<div class="event-mini-card"><b>${escapeHtml(title)}</b>${escapeHtml(barrio)} · ${escapeHtml(date)} &nbsp; ${priceBadge(price)}</div>`;
}

function mount(section) {
  section.innerHTML = template;

  const pendingList = $('#pendingList', section);
  const approvedCount = $('#approvedCount', section);
  const eventsMini = $('#eventsMini', section);

  const projects = INITIAL_PROJECTS.map((project) => ({ ...project, decision: null }));
  const events = [...INITIAL_UPCOMING_EVENTS];

  function renderProjects() {
    pendingList.innerHTML = projects.map(projectItem).join('');
    approvedCount.textContent = projects.filter(({ decision }) => decision === 'approved').length;
  }

  function renderEvents() {
    eventsMini.innerHTML = events.map(eventCard).join('');
  }

  const eventModal = createFormModal({
    title: 'Crear nuevo evento',
    submitLabel: 'Crear evento',
    fields: [
      { name: 'title', placeholder: 'Nombre del evento' },
      { name: 'barrio', placeholder: 'Barrio' },
      { name: 'date', placeholder: 'Fecha (ej. 28 jul)' },
      { name: 'price', placeholder: 'Precio (deja vacío o escribe Gratis, o ej. $10.000)' },
    ],
    onSubmit: ({ title, barrio, date, price }) => {
      events.push({
        title: title || 'Nuevo evento',
        barrio: barrio || 'Comuna 2',
        date: date || 'Próximamente',
        price: parsePriceInput(price),
      });
      renderEvents();
      showToast('Evento creado ✓');
    },
  });

  delegate(pendingList, 'click', '[data-decision]', (_event, button) => {
    const project = projects.find(({ id }) => id === button.dataset.id);
    if (!project || project.decision) return;
    project.decision = button.dataset.decision;
    renderProjects();
    showToast(DECISIONS[project.decision].toast);
  });

  $('#createEventBtn', section).addEventListener('click', eventModal.open);
  renderProjects();
  renderEvents();
}

export const screen = { id: 'admin', label: 'Admin', mount };
