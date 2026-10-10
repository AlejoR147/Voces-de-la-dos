import './gestion.css';
import template from './gestion.html?raw';
import { $, escapeHtml } from '../../core/dom.js';
import { ROLES } from '../../config/constants.js';
import { EVENT_STATUS } from '../../data/events.js';
import { appStore } from '../../state/appStore.js';
import { contentStore, getContent, createEvent } from '../../state/contentStore.js';
import { STATUS_LABELS, eventStats, eventsOwnedBy, formatEventDate } from '../../services/events.js';
import { formatNumber, formatPrice } from '../../utils/format.js';
import { createEventModal } from '../../shared/components/eventModal.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

function kpi(value, label, note, ic) {
  return `<div class="kpi"><div class="kpi-top"><div class="num">${value}</div><span class="kpi-icon" aria-hidden="true">${icon(ic, 20)}</span></div><div class="lbl">${label}</div><div class="delta">${note}</div></div>`;
}

function summarize(events, content) {
  const published = events.filter(({ status }) => status === EVENT_STATUS.APPROVED);
  const stats = published.map((event) => eventStats(event, content));
  const registered = stats.reduce((sum, { registered: count }) => sum + count, 0);
  const revenue = stats.reduce((sum, { revenue: amount }) => sum + amount, 0);
  const occupancy = stats.length ? Math.round(stats.reduce((sum, { occupancy: value }) => sum + value, 0) / stats.length) : null;
  const pending = events.filter(({ status }) => status === EVENT_STATUS.PENDING).length;
  return { published: published.length, registered, revenue, occupancy, pending };
}

function occupancyRow(event, content) {
  const { registered, occupancy } = eventStats(event, content);
  return `<div class="occ-row">
    <div class="occ-label"><b>${escapeHtml(event.title)}</b><span>${registered}/${event.capacity} · ${occupancy}%</span></div>
    <div class="meter"><span style="width:${occupancy}%"></span></div>
  </div>`;
}

function statusSummary(events) {
  return Object.values(EVENT_STATUS).map((status) => {
    const count = events.filter((event) => event.status === status).length;
    return `<div class="status-row"><span class="status status-${status}">${STATUS_LABELS[status]}</span><b>${count}</b></div>`;
  }).join('');
}

function eventRow(event, content) {
  const { registered, revenue } = eventStats(event, content);
  const published = event.status === EVENT_STATUS.APPROVED;
  return `<tr>
    <td>${escapeHtml(event.title)}</td>
    <td>${formatEventDate(event.date)}</td>
    <td><span class="status status-${event.status}">${STATUS_LABELS[event.status]}</span></td>
    <td>${published ? `${registered}/${event.capacity}` : '—'}</td>
    <td>${formatPrice(event.price)}</td>
    <td>${published ? `$${formatNumber(revenue)}` : '—'}</td>
  </tr>`;
}

function mount(section) {
  section.innerHTML = template;

  const els = {
    kpis: $('#mgKpis', section),
    occupancy: $('#mgOccupancy', section),
    status: $('#mgStatus', section),
    rows: $('#mgRows', section),
    create: $('#createEventBtn', section),
  };
  els.create.innerHTML = `${icon('plus', 16)} Crear evento`;

  const empty = (message) => `<div class="empty mg-empty">${icon('calendar', 24)}<b>Aún no hay eventos</b>${message}</div>`;

  function render() {
    const { user } = appStore.getState();
    if (!user) return;
    const content = getContent();
    const events = eventsOwnedBy(content, user.id);
    const summary = summarize(events, content);

    els.kpis.innerHTML = [
      kpi(events.length, 'Eventos creados', `${summary.published} publicados · ${summary.pending} en revisión`, 'calendar'),
      kpi(formatNumber(summary.registered), 'Inscritos totales', 'En eventos publicados', 'users'),
      kpi(summary.occupancy === null ? '—' : `${summary.occupancy}%`, 'Ocupación media', 'Inscritos sobre cupo', 'chart'),
      kpi(`$${formatNumber(summary.revenue)}`, 'Ingresos estimados', 'Inscritos × precio', 'money'),
    ].join('');

    const published = events.filter(({ status }) => status === EVENT_STATUS.APPROVED);
    els.occupancy.innerHTML = published.length
      ? published.map((event) => occupancyRow(event, content)).join('')
      : empty('Cuando un administrador apruebe tus eventos verás aquí su ocupación.');
    els.status.innerHTML = statusSummary(events);
    els.rows.innerHTML = events.length
      ? events.map((event) => eventRow(event, content)).join('')
      : `<tr><td colspan="6">${empty('Crea tu primer evento para empezar a recibir inscripciones.')}</td></tr>`;
  }

  const eventModal = createEventModal({
    submitLabel: 'Enviar a revisión',
    onCreate: (event) => {
      createEvent(event);
      showToast('Evento enviado a revisión ✓ — un administrador lo publicará');
    },
  });

  els.create.addEventListener('click', () => eventModal.open());
  appStore.subscribe(render);
  contentStore.subscribe(render);
  render();
}

export const screen = {
  id: 'gestion', label: 'Mis eventos', icon: icon('list'), nav: true, access: [ROLES.MANAGER], mount,
};
