export const TOTAL_YOUTH = 2340;
export const YOUTH_PER_PARTICIPATION_POINT = 12.4;

export const KPIS = Object.freeze([
  { id: 'youth', value: TOTAL_YOUTH, label: 'Jóvenes registrados', delta: '▲ 12% este mes' },
  { id: 'activities', value: 186, label: 'Actividades realizadas', delta: '▲ 8% este mes' },
  { id: 'events', value: 24, label: 'Eventos activos', delta: '▲ 3 nuevos' },
  { id: 'attendance', value: '78%', label: '% asistencia promedio', delta: '▲ 5 pts' },
]);

export const ROLE_SPLIT = Object.freeze([
  { label: 'Consumidores', share: 80, color: 'var(--blue)', detail: '(1.872)' },
  { label: 'Creadores', share: 20, color: 'var(--orange)', detail: '(468)' },
]);

export const ROLE_SPLIT_NOTE = '468 jóvenes ya publican talleres, retos o proyectos propios';

export const INTEREST_SHARE = Object.freeze([
  { label: 'Rap', share: 30, color: 'var(--purple)' },
  { label: 'Fotografía', share: 25, color: 'var(--blue)' },
  { label: 'Muralismo', share: 20, color: 'var(--orange)' },
  { label: 'Danza', share: 15, color: '#B39DDB' },
  { label: 'Videojuegos', share: 10, color: '#90CAF9' },
]);
