import { PLACES, getPlace } from '../../data/places.js';
import { parsePriceInput } from '../../utils/format.js';
import { createFormModal } from './formModal.js';

const DEFAULT_CAPACITY = 30;
const CAPACITY_MIN = 1;
const CAPACITY_MAX = 1000;

/** Cupo con Number + isFinite + clamp (sin `parseInt(x) || default`, que enmascara NaN). */
function parseCapacityInput(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return DEFAULT_CAPACITY;
  const value = Number(text);
  if (!Number.isFinite(value)) return DEFAULT_CAPACITY;
  return Math.min(CAPACITY_MAX, Math.max(CAPACITY_MIN, Math.round(value)));
}

export function createEventModal({ submitLabel, onCreate }) {
  return createFormModal({
    title: 'Crear evento',
    submitLabel,
    fields: [
      { name: 'title', label: 'Nombre del evento', placeholder: 'Ej. Festival de rap de Santa Cruz', required: true },
      { name: 'desc', label: 'Descripción', placeholder: 'Cuenta de qué trata' },
      {
        name: 'placeId',
        label: 'Lugar',
        type: 'select',
        options: PLACES.map(({ id, name, barrio }) => ({ value: id, label: `${name} · ${barrio}` })),
      },
      { name: 'date', label: 'Fecha', type: 'date', min: 'today', required: true },
      { name: 'price', label: 'Precio', placeholder: 'Vacío o "Gratis", o ej. $10.000' },
      { name: 'capacity', label: 'Cupo', type: 'number', min: 1, max: 1000, placeholder: String(DEFAULT_CAPACITY) },
    ],
    onSubmit: ({ title, desc, placeId, date, price, capacity }) => {
      const place = getPlace(placeId);
      if (!place) throw new Error('Lugar no válido');
      return onCreate({
        title,
        desc: desc || 'Evento comunitario en la Comuna 2.',
        placeId,
        barrio: place.barrio,
        date,
        price: parsePriceInput(price),
        capacity: parseCapacityInput(capacity),
      });
    },
  });
}
