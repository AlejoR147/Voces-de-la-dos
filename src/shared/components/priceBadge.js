import { formatPrice, isFree } from '../../utils/format.js';

export function priceBadgeInfo(price) {
  return { className: isFree(price) ? 'free' : 'paid', label: formatPrice(price) };
}

export function priceBadge(price) {
  const { className, label } = priceBadgeInfo(price);
  return `<span class="price-badge ${className}">${label}</span>`;
}
