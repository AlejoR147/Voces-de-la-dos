import { $, delegate, escapeHtml } from '../../core/dom.js';
import { getUser } from '../../state/appStore.js';
import { contentStore, getContent } from '../../state/contentStore.js';
import { ROLES } from '../../config/constants.js';
import { EVENT_STATUS } from '../../data/events.js';
import {
  STATUS_LABELS, allEvents, eventStats, formatEventDate, isPast,
} from '../../services/events.js';
import { getPlace } from '../../data/places.js';
import { priceBadge } from './priceBadge.js';
import { enrollButton, bindEnrollment } from './enrollButton.js';
import { showToast } from './toast.js';
import { icon } from '../icons.js';

let backdrop = null;
let unsub = null;

function icsDate(iso) {
  return String(iso).replaceAll('-', '');
}

function icsEscape(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function downloadIcs(event, placeName) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Voces de la dos//ES',
    'BEGIN:VEVENT',
    `UID:${event.id}@vocesdelados`,
    `DTSTAMP:${stamp}Z`,
    `DTSTART;VALUE=DATE:${icsDate(event.date)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.desc)}`,
    `LOCATION:${icsEscape(`${placeName} · ${event.barrio}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: `evento-${event.id}.ics` });
  link.click();
  URL.revokeObjectURL(url);
  showToast('Archivo de calendario descargado ✓');
}

function shareEvent(event) {
  const url = `${location.origin}${location.pathname}#eventos`;
  if (navigator.share) {
    navigator.share({ title: event.title, text: `${event.title} — Voces de la dos`, url }).catch(() => {});
    return;
  }
  if (!navigator.clipboard) {
    showToast('No se pudo copiar el enlace');
    return;
  }
  navigator.clipboard.writeText(url).then(
    () => showToast('Enlace copiado ✓'),
    () => showToast('No se pudo copiar el enlace'),
  );
}

function bodyHtml(event, content, canEnroll) {
  const stats = eventStats(event, content);
  const { registered } = stats;
  const place = getPlace(event.placeId);
  const where = place ? place.name : event.barrio;
  const enrolled = content.enrolled.includes(`event:${event.id}`);
  const canShowEnroll = canEnroll && event.status === EVENT_STATUS.APPROVED && !isPast(event);
  let control;
  if (canShowEnroll) {
    control = (!enrolled && stats.spotsLeft === 0)
      ? '<button class="btn btn-outline" type="button" disabled>Cupo lleno</button>'
      : enrollButton(`event:${event.id}`, enrolled, { small: false });
  } else {
    control = `<span class="status ${isPast(event) ? 'status-finished' : `status-${event.status}`}">${isPast(event) ? 'Finalizado' : STATUS_LABELS[event.status]}</span>`;
  }

  return `
    <h3>${escapeHtml(event.title)}</h3>
    <div class="detail-badges">${priceBadge(event.price)}</div>
    <p class="detail-desc">${escapeHtml(event.desc)}</p>
    <div class="event-detail-lines">
      <div class="event-detail-line"><b>Fecha</b><span>${formatEventDate(event.date)}</span></div>
      <div class="event-detail-line"><b>Lugar</b><span>${escapeHtml(where)} · ${escapeHtml(event.barrio)}</span></div>
      <div class="event-detail-line"><b>Cupo</b><span>${registered}/${event.capacity} inscritos</span></div>
    </div>
    <div class="modal-actions">
      ${control}
      <button type="button" class="icon-btn" data-share aria-label="Compartir evento" title="Compartir">${icon('external', 18)}</button>
      <button type="button" class="icon-btn" data-calendar aria-label="Agregar al calendario" title="Agregar al calendario">${icon('calendar', 18)}</button>
      <button type="button" class="btn btn-outline" data-close>Cerrar</button>
    </div>
    <a class="detail-link" href="#mapa">Cómo llegar →</a>`;
}

function close() {
  backdrop?.classList.remove('show');
  unsub?.();
  unsub = null;
}

export function openEventDetail(eventId) {
  const content = getContent();
  const event = allEvents(content).find((item) => item.id === eventId);
  if (!event) {
    showToast('Evento no disponible');
    return;
  }
  const canEnroll = getUser()?.role === ROLES.CONSUMER;

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'modal-bg';
    backdrop.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="Detalle del evento"></div>';
    $('#modal-root').appendChild(backdrop);
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
    backdrop.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    delegate(backdrop, 'click', '[data-close]', close);
    delegate(backdrop, 'click', '[data-share]', () => {
      const current = allEvents(getContent()).find((item) => item.id === eventId);
      if (current) shareEvent(current);
    });
    delegate(backdrop, 'click', '[data-calendar]', () => {
      const current = allEvents(getContent()).find((item) => item.id === eventId);
      if (!current) return;
      const place = getPlace(current.placeId);
      downloadIcs(current, place ? place.name : current.barrio);
    });
    bindEnrollment(backdrop);
  }

  const paint = () => {
    const fresh = getContent();
    const current = allEvents(fresh).find((item) => item.id === eventId) ?? event;
    const dialog = $('div.modal', backdrop);
    dialog.innerHTML = bodyHtml(current, fresh, canEnroll);
  };

  unsub?.();
  unsub = contentStore.subscribe(paint);
  paint();
  backdrop.classList.add('show');
  $('[data-close]', backdrop)?.focus();
}

export function bindEventDetail(container) {
  const openFrom = (element) => {
    if (element?.dataset?.eventDetail) openEventDetail(element.dataset.eventDetail);
  };
  delegate(container, 'click', '[data-event-detail]', (event, element) => {
    if (event.target.closest('button, a, input, select, textarea')) return;
    openFrom(element);
  });
  container.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const element = event.target.closest?.('[data-event-detail]');
    if (!element || element.closest('button, a')) return;
    event.preventDefault();
    openFrom(element);
  });
}
