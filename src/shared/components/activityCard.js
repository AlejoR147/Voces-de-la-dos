import { escapeHtml } from '../../core/dom.js';
import { priceBadge } from './priceBadge.js';
import { enrollButton } from './enrollButton.js';

export function activityCard(activity, enrolled) {
  return `<article class="card card-hover activity-card" data-activity-id="${escapeHtml(activity.id)}">
    <div class="activity-top">
      <span class="activity-icon" aria-hidden="true">${activity.emoji}</span>
      <span class="badge badge-magenta">${activity.match}% afinidad</span>
    </div>
    <h4>${escapeHtml(activity.title)}</h4>
    <p>${escapeHtml(activity.desc)}</p>
    <div class="activity-foot">${priceBadge(activity.price)}${enrollButton(activity.id, enrolled)}</div>
  </article>`;
}