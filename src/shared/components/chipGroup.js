import { $$, delegate, escapeHtml } from '../../core/dom.js';

export function mountChipGroup(container, options, { value = options[0]?.value, onChange }) {
  container.classList.add('chip-group');
  container.innerHTML = options
    .map((option) => `<button type="button" class="chip" data-value="${escapeHtml(option.value)}">${option.label}</button>`)
    .join('');

  function select(next) {
    $$('.chip', container).forEach((chip) => chip.classList.toggle('selected', chip.dataset.value === next));
  }

  delegate(container, 'click', '.chip', (_event, chip) => {
    select(chip.dataset.value);
    onChange(chip.dataset.value);
  });

  select(value);
  return { select };
}
