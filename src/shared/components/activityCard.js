import { escapeHtml } from '../../core/dom.js';
import { priceBadge } from './priceBadge.js';
import { enrollButton } from './enrollButton.js';

export function activityCard(activity, enrolled) {
  return `<article class="card card-hover activity-card">
    <div class="activity-top"><span class="activity-emoji">${activity.emoji}</span><span class="badge">${activity.match}% afinidad</span></div>
    <h4>${escapeHtml(activity.title)}</h4>
    <p>${escapeHtml(activity.desc)}</p>
    <div class="activity-foot">${priceBadge(activity.price)}${enrollButton(activity.id, enrolled)}</div>
  </article>`;
}
