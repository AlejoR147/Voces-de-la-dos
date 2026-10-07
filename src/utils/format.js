import { LOCALE } from '../config/constants.js';

export function formatNumber(value) {
  return value.toLocaleString(LOCALE);
}

export function isFree(price) {
  return price === 0;
}

export function formatPrice(price) {
  return isFree(price) ? 'Gratis' : `$${formatNumber(price)}`;
}

export function parsePriceInput(raw) {
  if (!raw || /grat/i.test(raw)) return 0;
  const amount = parseInt(raw.replace(/[^\d]/g, ''), 10);
  return Number.isNaN(amount) ? 0 : amount;
}

export function matchesPriceFilter(price, mode) {
  if (mode === 'free') return price === 0;
  if (mode === 'paid') return price > 0;
  return true;
}

export function initialOf(name) {
  return (name ?? '?').trim().charAt(0).toUpperCase() || '?';
}

export function normalizeText(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
