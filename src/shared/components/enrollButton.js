import { delegate } from '../../core/dom.js';
import { toggleEnrollment } from '../../state/contentStore.js';
import { icon } from '../icons.js';
import { showToast } from './toast.js';

export function enrollButton(id, enrolled, { small = true } = {}) {
  const size = small ? ' btn-sm' : '';
  return enrolled
    ? `<button class="btn btn-soft${size}" type="button" data-enroll="${id}">${icon('check', 16)} Inscrito</button>`
    : `<button class="btn btn-primary${size}" type="button" data-enroll="${id}">Inscribirme</button>`;
}

export function bindEnrollment(container) {
  delegate(container, 'click', '[data-enroll]', (_event, button) => {
    const enrolled = toggleEnrollment(button.dataset.enroll);
    showToast(enrolled ? 'Inscripción confirmada ✓' : 'Inscripción cancelada');
  });
}
