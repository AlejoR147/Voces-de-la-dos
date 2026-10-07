import { formatPrice, isFree } from '../../utils/format.js';

export function priceBadgeInfo(price) {
  return isFree(price)
    ? { className: 'free', label: '🟢 Gratis' }
    : { className: 'paid', label: `🟠 ${formatPrice(price)}` };
}

export function priceBadge(price) {
  const { className, label } = priceBadgeInfo(price);
  return `<span class="price-badge ${className}">${label}</span>`;
}
