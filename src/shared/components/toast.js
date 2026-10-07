import { $ } from '../../core/dom.js';
import { TOAST_DURATION_MS } from '../../config/constants.js';

let timer;

export function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('show'), TOAST_DURATION_MS);
}
