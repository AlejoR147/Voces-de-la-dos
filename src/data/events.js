const DAY_MS = 24 * 60 * 60 * 1000;

export const toISODate = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const inDays = (days) => toISODate(new Date(Date.now() + days * DAY_MS));

export const EVENT_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const SEED_EVENTS = Object.freeze([
  {
    id: 'event-1',
    title: 'Festival de música barrial',
    desc: 'Tarde de bandas y artistas del barrio en tarima abierta.',
    placeId: 'escenario',
    barrio: 'La Frontera',
    date: inDays(6),
    price: 8000,
    capacity: 120,
    registered: 45,
    ownerId: null,
    ownerName: 'Colectivo La Frontera',
    status: EVENT_STATUS.APPROVED,
  },
  {
    id: 'event-2',
    title: 'Jornada de muralismo',
    desc: 'Pintura colectiva con materiales incluidos y artistas locales.',
    placeId: 'cancha',
    barrio: 'La Frontera',
    date: inDays(13),
    price: 0,
    capacity: 30,
    registered: 12,
    ownerId: null,
    ownerName: 'Colectivo Kuma',
    status: EVENT_STATUS.APPROVED,
  },
  {
    id: 'event-3',
    title: 'Concurso de fotografía móvil',
    desc: 'Retrata tu barrio con el celular y compite por materiales.',
    placeId: 'juvenil',
    barrio: 'Popular',
    date: inDays(-4),
    price: 0,
    capacity: 50,
    registered: 38,
    ownerId: null,
    ownerName: 'Casa Juvenil Popular',
    status: EVENT_STATUS.APPROVED,
  },
]);
