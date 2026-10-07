import { toISODate } from '../../data/events.js';
import { PLACES, getPlace } from '../../data/places.js';
import { parsePriceInput } from '../../utils/format.js';
import { createFormModal } from './formModal.js';

const DEFAULT_CAPACITY = 30;

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
      { name: 'date', label: 'Fecha', type: 'date', min: toISODate(new Date()), required: true },
      { name: 'price', label: 'Precio', placeholder: 'Vacío o "Gratis", o ej. $10.000' },
      { name: 'capacity', label: 'Cupo', type: 'number', min: 1, max: 1000, placeholder: String(DEFAULT_CAPACITY) },
    ],
    onSubmit: ({ title, desc, placeId, date, price, capacity }) => onCreate({
      title,
      desc: desc || 'Evento comunitario en la Comuna 2.',
      placeId,
      barrio: getPlace(placeId).barrio,
      date,
      price: parsePriceInput(price),
      capacity: Math.max(1, parseInt(capacity, 10) || DEFAULT_CAPACITY),
    }),
  });
}
