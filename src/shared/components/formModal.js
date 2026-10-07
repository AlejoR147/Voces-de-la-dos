import { $, escapeHtml } from '../../core/dom.js';

function fieldHtml({ name, label, type = 'text', placeholder = '', options = [], min, max, required }) {
  const attrs = `name="${name}" id="fm-${name}"${required ? ' required' : ''}`;
  const control = type === 'select'
    ? `<select ${attrs}>${options.map(({ value, label: text }) => `<option value="${escapeHtml(value)}">${escapeHtml(text)}</option>`).join('')}</select>`
    : `<input class="input" ${attrs} type="${type}" placeholder="${escapeHtml(placeholder)}"${min !== undefined ? ` min="${min}"` : ''}${max !== undefined ? ` max="${max}"` : ''}>`;
  return `<div class="field"><label class="field-label" for="fm-${name}">${escapeHtml(label)}</label>${control}</div>`;
}

/**
 * Generic modal form. `fields` items: { name, label, type?, placeholder?, options?, min?, max?, required? }.
 * `onSubmit` receives trimmed string values keyed by field name.
 */
export function createFormModal({ title, fields, submitLabel, onSubmit }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-bg';
  backdrop.innerHTML = `
    <form class="modal" role="dialog" aria-modal="true">
      <h3>${escapeHtml(title)}</h3>
      ${fields.map(fieldHtml).join('')}
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" data-cancel>Cancelar</button>
        <button type="submit" class="btn btn-primary">${escapeHtml(submitLabel)}</button>
      </div>
    </form>`;
  $('#modal-root').appendChild(backdrop);

  const form = $('form', backdrop);

  function open(initial = {}) {
    form.reset();
    Object.entries(initial).forEach(([name, value]) => { form.elements[name].value = value; });
    backdrop.classList.add('show');
    form.elements[0]?.focus();
  }

  function close() {
    backdrop.classList.remove('show');
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
    onSubmit(values);
    close();
  });

  return { open, close };
}
