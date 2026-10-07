export const LOCALE = 'es-CO';

export const ROLES = Object.freeze({
  CONSUMER: 'consumidor',
  CREATOR: 'creador',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.CONSUMER]: 'Consumidor',
  [ROLES.CREATOR]: 'Creador',
});

export const DEFAULT_SCREEN = 'inicio';
export const DEFAULT_BARRIO = 'Santa Cruz';
export const DEFAULT_INTERESTS = Object.freeze(['rap', 'foto']);

export const PRICE_FILTERS = Object.freeze([
  { value: 'todos', label: 'Todos' },
  { value: 'free', label: '🟢 Gratis' },
  { value: 'paid', label: '🟠 De pago' },
]);

export const TOAST_DURATION_MS = 2600;
