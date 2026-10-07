export const LOCALE = 'es-CO';

export const ROLES = Object.freeze({
  CONSUMER: 'consumidor',
  MANAGER: 'gestor',
  ADMIN: 'admin',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.CONSUMER]: 'Persona',
  [ROLES.MANAGER]: 'Organización',
  [ROLES.ADMIN]: 'Administrador',
});

export const ACCOUNT_TYPE_OPTIONS = Object.freeze([
  { value: ROLES.CONSUMER, icon: '🙋', title: 'Soy una persona', desc: 'Descubre talleres, eventos y equipos en tu barrio e inscríbete en un toque.' },
  { value: ROLES.MANAGER, icon: '🏛️', title: 'Soy una organización', desc: 'Colectivo, institución o emprendimiento que crea eventos y sigue sus inscripciones.' },
]);

export const ORG_TYPES = Object.freeze([
  'Colectivo juvenil',
  'Organización comunitaria',
  'Institución pública',
  'Emprendimiento cultural',
  'Institución educativa',
  'Otro',
]);

export const AVAILABILITY_OPTIONS = Object.freeze(['Tardes', 'Fines de semana', 'Noches']);

export const DEFAULT_SCREEN = 'inicio';
export const PUBLIC_SCREEN = 'bienvenida';

export const STORAGE_KEYS = Object.freeze({
  session: 'scvd:session:v3',
  accounts: 'scvd:accounts:v1',
  content: 'scvd:content:v3',
  audit: 'scvd:audit:v1',
});

export const SECURITY = Object.freeze({
  passwordMinLength: 8,
  pbkdf2Iterations: 150000,
  maxFailedAttempts: 5,
  lockoutMs: 60 * 1000,
  userSessionTtlMs: 7 * 24 * 60 * 60 * 1000,
  adminIdleMs: 15 * 60 * 1000,
  auditLogLimit: 200,
});

export const PRICE_FILTERS = Object.freeze([
  { value: 'todos', label: 'Todos' },
  { value: 'free', label: 'Gratis' },
  { value: 'paid', label: 'De pago' },
]);

export const MAP_CONFIG = Object.freeze({
  center: [6.2985, -75.5568],
  zoom: 15,
  minZoom: 13,
  maxZoom: 19,
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  routingUrl: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  routingTimeoutMs: 7000,
});

export const TOAST_DURATION_MS = 2600;
