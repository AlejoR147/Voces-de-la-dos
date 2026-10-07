import { $, escapeHtml } from '../../core/dom.js';

export function createFormModal({ title, fields, submitLabel, onSubmit }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-bg';
  backdrop.innerHTML = `
    <form class="modal" role="dialog" aria-modal="true">
      <h3>${escapeHtml(title)}</h3>
      ${fields.map(({ name, placeholder }) => `<input type="text" name="${name}" placeholder="${escapeHtml(placeholder)}">`).join('')}
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" data-cancel>Cancelar</button>
        <button type="submit" class="btn btn-primary">${escapeHtml(submitLabel)}</button>
      </div>
    </form>`;
  $('#modal-root').appendChild(backdrop);

  const form = $('form', backdrop);

  function open() {
    backdrop.classList.add('show');
    form.elements[0]?.focus();
  }

  function close() {
    backdrop.classList.remove('show');
  }

  $('[data-cancel]', form).addEventListener('click', close);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(fields.map(({ name }) => [name, form.elements[name].value.trim()]));
    onSubmit(values);
    form.reset();
    close();
  });

  return { open, close };
}
