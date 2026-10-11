import { LOCALE } from '../config/constants.js';

const PRICE_MAX = 1000000;
const PRICE_INPUT_MAX = 32;
const NORMALIZE_MAX = 500;

export function formatNumber(value) {
  return value.toLocaleString(LOCALE);
}

export function isFree(price) {
  return price === 0;
}

export function formatPrice(price) {
  return isFree(price) ? 'Gratis' : `$${formatNumber(price)}`;
}

/**
 * Parsea un precio tecleado sin regex ambigua: extracción lineal de dígitos + Number/clamp.
 * Rechaza cualquier signo (`-500` o `+500` devuelven 0, nunca se convierten a positivo):
 * un negativo jamás debe transformarse en cobro. Entrada acotada a PRICE_INPUT_MAX.
 */
export function parsePriceInput(raw) {
  if (raw === null || raw === undefined) return 0;
  const input = String(raw).slice(0, PRICE_INPUT_MAX);
  if (!input.trim()) return 0;
  // "Gratis"/"gratuitous"/"grat" (búsqueda lineal, sin regex).
  if (input.toLowerCase().includes('grat')) return 0;
  // Signo explícito: se rechaza, no se absuelve.
  if (input.includes('-') || input.includes('+')) return 0;
  let digits = '';
  for (const char of input) {
    if (char >= '0' && char <= '9') digits += char;
    if (digits.length > 7) break;
  }
  if (!digits) return 0;
  const amount = Number(digits);
  if (!Number.isFinite(amount)) return 0;
  return Math.min(PRICE_MAX, Math.max(0, amount));
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
  // Entrada acotada antes de normalizar (evita strings gigantes desde consola).
  // El rango [\u0300-\u036f] es una clase fija sin cuantificadores anidados: lineal, sin ReDoS.
  return String(value).slice(0, NORMALIZE_MAX).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
