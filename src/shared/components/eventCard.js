import { escapeHtml } from '../../core/dom.js';
import { getPlace } from '../../data/places.js';
import {
  STATUS_LABELS, dateParts, eventEnrollmentId, eventStats, isPast,
} from '../../services/events.js';
import { priceBadge } from './priceBadge.js';
import { enrollButton } from './enrollButton.js';

function sideControl(event, content, { enroll, status }) {
  if (status) return `<span class="status ${event.status}">${STATUS_LABELS[event.status]}</span>`;
  if (!enroll) return '';
  if (isPast(event)) return '<span class="status status-finished">Finalizado</span>';
  const enrolled = content.enrolled.includes(eventEnrollmentId(event));
  if (!enrolled && eventStats(event, content).spotsLeft === 0) {
    return '<button class="btn btn-outline btn-sm" type="button" disabled>Cupo lleno</button>';
  }
  return enrollButton(eventEnrollmentId(event), enrolled);
}

/**
 * Event row. Options: `enroll` shows the enrollment control, `status` shows the moderation status instead.
 */
export function eventCard(event, content, { enroll = false, status = false } = {}) {
  const { day, month } = dateParts(event.date);
  const { registered, spotsLeft, occupancy } = eventStats(event, content);
  const place = getPlace(event.placeId);
  const where = place ? place.name : event.barrio;
  const isPastEvent = isPast(event);
  const spots = event.status === 'approved' ? ` ${registered}/${event.capacity} (${occupancy}%)` : ` Cupo ${event.capacity}`;

  return `<div class="event${isPastEvent ? ' event--past' : ''}" data-event-id="${escapeHtml(event.id)}">
    <div class="event-date"><b>${day}</b><span>${month}</span></div>
    <div class="event-body">
      <b>${escapeHtml(event.title)}</b>
      <span>${escapeHtml(where)} · ${escapeHtml(event.barrio)}${spots}</span>
    </div>
    <div class="event-side">${priceBadge(event.price)}${sideControl(event, content, { enroll, status })}</div>
  </div>`;
}