// Comuna 2 Santa Cruz — real. Fuentes: DANE 2020 (población), beneficiario_red_formacion.csv (781),
// itinerante_cultural.csv (67), infraestructura_cultural.csv (3), convocatoria C2 n=40 (intereses, NaN excluidos).
export const TOTAL_YOUTH = 26912;
export const YOUTH_PER_PARTICIPATION_POINT = 269.12;

export const KPIS = Object.freeze([
  { id: 'youth', value: TOTAL_YOUTH, label: 'Jóvenes 15-29 Comuna 2 (DANE 2020)', delta: 'Base real: 114.007 hab' },
  { id: 'activities', value: 781, label: 'Registros formación C2', delta: 'Conteos, no personas únicas' },
  { id: 'events', value: 0, label: 'Eventos activos', delta: 'Conteo en vivo de la app' },
  { id: 'attendance', value: '3', label: 'Infraestructura oficial C2', delta: 'Solo 3 registros' },
]);

export const ROLE_SPLIT = Object.freeze([
  { label: 'Consumidores', share: 80, color: 'var(--blue)', detail: '(1.872)' },
  { label: 'Creadores', share: 20, color: 'var(--orange)', detail: '(468)' },
]);

// ROLE_SPLIT es ilustrativo/demo, sin fuente en los CSVs verificados: reparte una base
// hipotetica de 2.340 jovenes (1.872 + 468) en 80/20 para comunicar el rol creador.
// No usar como KPI oficial; la suma da 100.
export const ROLE_SPLIT_NOTE = '468 jóvenes ya publican talleres, retos o proyectos propios (dato ilustrativo, sin fuente en CSVs)';

// NOTA de taxonomia: INTEREST_SHARE usa las categorias tal cual vienen de la convocatoria C2
// (n=40, NaN excluidos) y son distintas de las claves de `data/interests.js`
// (rap, dibujo, foto, danza, videojuegos, teatro, mural). No mezclar ambas taxonomias aqui.
// Trazabilidad n=40 (cada persona = 2.5 %): Teatro 16/40 = 40.0 %, Musica 15/40 = 37.5 %,
// Artes visuales 8/40 = 20.0 %, Literatura 1/40 = 2.5 %. La suma da 100.
export const INTEREST_SHARE = Object.freeze([
  { label: 'Teatro', share: 40.0, color: 'var(--purple)' },
  { label: 'Música', share: 37.5, color: 'var(--blue)' },
  { label: 'Artes visuales', share: 20.0, color: 'var(--orange)' },
  { label: 'Literatura', share: 2.5, color: '#B39DDB' },
]);
