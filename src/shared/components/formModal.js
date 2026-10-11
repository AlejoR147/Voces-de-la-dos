import { $, escapeHtml } from '../../core/dom.js';
import { toISODate } from '../../data/events.js';
import { showToast } from './toast.js';

let modalSeq = 0;

function fieldHtml({ name, label, type = 'text', placeholder = '', options = [], min, max, required }) {
  const safeName = escapeHtml(name);
  // `min: 'today'` se resuelve en open() para no congelar la fecha al montar.
  const minAttr = min === 'today' ? '' : (min !== undefined ? ` min="${escapeHtml(min)}"` : '');
  const maxAttr = max !== undefined ? ` max="${escapeHtml(max)}"` : '';
  const attrs = `name="${safeName}" id="fm-${safeName}"${required ? ' required' : ''}`;
  const control = type === 'select'
    ? `<select ${attrs}>${options.map(({ value, label: text }) => `<option value="${escapeHtml(value)}">${escapeHtml(text)}</option>`).join('')}</select>`
    : `<input class="input" ${attrs} type="${escapeHtml(type)}" placeholder="${escapeHtml(placeholder)}"${minAttr}${maxAttr}>`;
  return `<div class="field"><label class="field-label" for="fm-${safeName}">${escapeHtml(label)}</label>${control}</div>`;
}

/**
 * Generic modal form. `fields` items: { name, label, type?, placeholder?, options?, min?, max?, required? }.
 * `onSubmit` receives trimmed string values keyed by field name.
 */
export function createFormModal({ title, fields, submitLabel, onSubmit }) {
  const titleId = `form-modal-title-${(modalSeq += 1)}`;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-bg';
  backdrop.innerHTML = `
    <form class="modal" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
      <h3 id="${titleId}">${escapeHtml(title)}</h3>
      ${fields.map(fieldHtml).join('')}
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" data-cancel>Cancelar</button>
        <button type="submit" class="btn btn-primary">${escapeHtml(submitLabel)}</button>
      </div>
    </form>`;
  $('#modal-root').appendChild(backdrop);

  const form = $('form', backdrop);
  let lastFocused = null;

  function open(initial = {}) {
    lastFocused = document.activeElement;
    form.reset();
    // Recalcula el mínimo de fechas dinámicas en cada apertura.
    fields.forEach(({ name, min }) => {
      if (min !== 'today') return;
      const control = form.elements[name];
      if (control) control.min = toISODate(new Date());
    });
    // Tolera claves inexistentes y valores no-string.
    Object.entries(initial).forEach(([name, value]) => {
      const control = form.elements[name];
      if (!control) return;
      control.value = String(value ?? '');
    });
    backdrop.classList.add('show');
    form.elements[0]?.focus();
  }

  function close() {
    backdrop.classList.remove('show');
    // Retorna el foco a quien abrió el modal.
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    lastFocused = null;
  }

  $('[data-cancel]', form).addEventListener('click', close);
  backdrop.addEventListener('mousedown', (event) => {
    if (event.target === backdrop) close();
  });
  backdrop.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(fields.map(({ name }) => [name, form.elements[name].value.trim()]));
    try {
      onSubmit(values);
    } catch (error) {
      // Validadores como "Lugar no válido" se muestran sin cerrar el modal ni romper con TypeError.
      showToast(error?.message || 'No se pudo guardar');
      return;
    }
    close();
  });

  return { open, close };
}
