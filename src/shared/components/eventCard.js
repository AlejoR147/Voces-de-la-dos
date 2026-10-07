import { escapeHtml } from '../../core/dom.js';
import { priceBadge } from './priceBadge.js';

function dateBlock(date) {
  const match = /^(\d{1,2})\s+(\S+)/.exec(date);
  return match
    ? `<div class="event-date"><b>${escapeHtml(match[1])}</b>${escapeHtml(match[2])}</div>`
    : '<div class="event-date">📅</div>';
}

export function eventCard({ title, barrio, date, price }) {
  return `<div class="event">
    ${dateBlock(date)}
    <div class="event-body"><b>${escapeHtml(title)}</b><span>${escapeHtml(barrio)} · ${escapeHtml(date)}</span></div>
    ${priceBadge(price)}
  </div>`;
}
