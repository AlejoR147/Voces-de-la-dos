import { delegate, escapeHtml } from '../../core/dom.js';
import { toggleEnrollment } from '../../state/contentStore.js';
import { icon } from '../icons.js';
import { showToast } from './toast.js';

export function enrollButton(id, enrolled, { small = true } = {}) {
  const size = small ? ' btn-sm' : '';
  // `id` puede venir de contenido local (event:<id> / place:<id> / activity:<id>): se escapa por convención.
  const safeId = escapeHtml(id);
  return enrolled
    ? `<button class="btn btn-soft${size}" type="button" data-enroll="${safeId}">${icon('check', 16)} Inscrito</button>`
    : `<button class="btn btn-primary${size}" type="button" data-enroll="${safeId}">Inscribirme</button>`;
}

export function bindEnrollment(container) {
  delegate(container, 'click', '[data-enroll]', (_event, button) => {
    try {
      const enrolled = toggleEnrollment(button.dataset.enroll);
      showToast(enrolled ? 'Inscripción confirmada ✓' : 'Inscripción cancelada');
    } catch (error) {
      showToast(error?.message || 'No se pudo completar la inscripción');
    }
  });
}
