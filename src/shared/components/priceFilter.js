import { PRICE_FILTERS } from '../../config/constants.js';
import { $$, delegate } from '../../core/dom.js';

export function mountPriceFilter(container, onChange) {
  container.innerHTML = PRICE_FILTERS
    .map(({ value, label }) => `<span class="chip" data-price="${value}">${label}</span>`)
    .join('');

  function select(mode) {
    $$('.chip', container).forEach((chip) => chip.classList.toggle('selected', chip.dataset.price === mode));
  }

  delegate(container, 'click', '.chip', (_event, chip) => {
    select(chip.dataset.price);
    onChange(chip.dataset.price);
  });

  select(PRICE_FILTERS[0].value);
}

export function matchesPriceFilter(price, mode) {
  if (mode === 'free') return price === 0;
  if (mode === 'paid') return price > 0;
  return true;
}
