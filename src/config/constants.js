export const LOCALE = 'es-CO';

export const ROLES = Object.freeze({
  CONSUMER: 'consumidor',
  CREATOR: 'creador',
  ADMIN: 'admin',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.CONSUMER]: 'Consumidor',
  [ROLES.CREATOR]: 'Creador',
  [ROLES.ADMIN]: 'Administrador',
});

export const ROLE_OPTIONS = Object.freeze([
  { value: ROLES.CONSUMER, icon: '🙋', title: 'Quiero descubrir', desc: 'Encuentra talleres, eventos y equipos en tu barrio.' },
  { value: ROLES.CREATOR, icon: '🎨', title: 'Quiero crear', desc: 'Publica talleres, lanza retos y convoca a tu comunidad.' },
]);

export const AVAILABILITY_OPTIONS = Object.freeze(['Tardes', 'Fines de semana', 'Noches']);

export const DEFAULT_SCREEN = 'inicio';
export const PUBLIC_SCREEN = 'bienvenida';

export const STORAGE_KEYS = Object.freeze({
  session: 'scvd:session:v1',
  content: 'scvd:content:v1',
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
