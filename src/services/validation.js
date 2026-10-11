import { AVAILABILITY_OPTIONS, ORG_TYPES, ROLES } from '../config/constants.js';
import { INTERESTS } from '../data/interests.js';
import { NEIGHBORHOODS } from '../data/neighborhoods.js';
import { getPlace } from '../data/places.js';

/**
 * Trust boundary for data coming from forms (or from the devtools console): every value is whitelisted,
 * clamped and trimmed here before it is stored. Until a backend exists this is the last line of defense.
 */
const text = (value, max) => String(value ?? '').trim().slice(0, max);
const fail = (error) => ({ ok: false, error });

// Nota ReDoS: los tres patrones son clases fijas de longitud acotada, sin cuantificadores
// anidados ni alternancias ambiguas: el motor avanza linealmente, sin backtracking catastrófico.
// Además toda entrada se recorta (text/slice) ANTES de testear, para que un string gigante
// inyectado por consola/devtools no llegue jamás a una regex.
const PHONE_PATTERN = /^[\d\s()+-]*$/;
const TAX_ID_PATTERN = /^[\w.\- ]*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const EVENT_PRICE_MAX = 1000000;
const EVENT_CAPACITY_MIN = 1;
const EVENT_CAPACITY_MAX = 1000;
const EVENT_DEFAULT_CAPACITY = 30;

function validWebsite(value) {
  if (!value) return true;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** La regex solo fija la forma; aquí se verifica que el día exista de verdad (calendario UTC). */
export function isRealIsoDate(iso) {
  const parts = String(iso ?? '').slice(0, 10).split('-');
  if (parts.length !== 3) return false;
  const [year, month, day] = parts.map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function todayISODate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function sanitizeProfile(role, input = {}) {
  const name = text(input.name, 60);
  if (name.length < 2) return fail('El nombre es demasiado corto.');

  const interests = [...new Set((Array.isArray(input.interests) ? input.interests : [])
    .filter((key) => Object.hasOwn(INTERESTS, key)))];
  if (interests.length === 0) return fail('Elige al menos una opción de interés.');

  if (!NEIGHBORHOODS.some(({ name: barrio }) => barrio === input.barrio)) return fail('Barrio no válido.');
  const profile = { name, barrio: input.barrio, interests };

  if (role === ROLES.CONSUMER) {
    return {
      ok: true,
      profile: {
        ...profile,
        age: Math.min(28, Math.max(12, Math.round(Number(input.age)) || 16)),
        availability: (Array.isArray(input.availability) ? input.availability : [])
          .filter((option) => AVAILABILITY_OPTIONS.includes(option)),
      },
    };
  }

  const contactName = text(input.contactName, 60);
  const description = text(input.description, 300);
  const phone = text(input.phone, 20);
  const taxId = text(input.taxId, 20);
  const website = text(input.website, 120);

  if (!ORG_TYPES.includes(input.orgType)) return fail('Tipo de organización no válido.');
  if (contactName.length < 2) return fail('Indica la persona responsable.');
  if (description.length < 10) return fail('Describe brevemente a qué se dedica la organización.');
  if (!PHONE_PATTERN.test(phone)) return fail('El teléfono solo puede contener números y + - ( ).');
  if (!TAX_ID_PATTERN.test(taxId)) return fail('El NIT o documento contiene caracteres no válidos.');
  if (!validWebsite(website)) return fail('El sitio web debe empezar por http:// o https://');

  return {
    ok: true,
    profile: { ...profile, orgType: input.orgType, contactName, phone, taxId, website, description },
  };
}

export function sanitizeEvent(input = {}, { allowPast = false } = {}) {
  const title = text(input.title, 100);
  const place = getPlace(input.placeId);
  if (title.length < 3) throw new Error('El nombre del evento es demasiado corto.');
  if (!place) throw new Error('Lugar no válido.');
  // Entrada acotada ANTES de la regex (nunca llega un string gigante al test).
  const rawDate = String(input.date ?? '').slice(0, 10);
  if (!ISO_DATE_PATTERN.test(rawDate) || !isRealIsoDate(rawDate)) throw new Error('Fecha no válida.');
  // Solo la publicación directa de admin (`autoApprove`) puede fechar en pasado.
  if (!allowPast && rawDate < todayISODate()) throw new Error('La fecha no puede ser pasada.');

  // Precio/capacidad con Number + isFinite + clamp: sin regex, sin máscara de NaN con `||`.
  // Un negativo nunca se absuelve: precio < 0 lanza, no se convierte a 0 ni a positivo.
  const priceRaw = input.price === undefined || input.price === null || input.price === ''
    ? 0
    : Number(input.price);
  if (!Number.isFinite(priceRaw) || priceRaw < 0) throw new Error('Precio no válido.');
  const capacityRaw = input.capacity === undefined || input.capacity === null || input.capacity === ''
    ? EVENT_DEFAULT_CAPACITY
    : Number(input.capacity);
  if (!Number.isFinite(capacityRaw)) throw new Error('Cupo no válido.');
  const capacity = Math.round(capacityRaw);
  if (capacity < EVENT_CAPACITY_MIN || capacity > EVENT_CAPACITY_MAX) {
    throw new Error(`El cupo debe estar entre ${EVENT_CAPACITY_MIN} y ${EVENT_CAPACITY_MAX}.`);
  }

  return {
    title,
    desc: text(input.desc, 300) || 'Evento comunitario en la Comuna 2.',
    placeId: place.id,
    barrio: place.barrio,
    date: rawDate,
    price: Math.min(EVENT_PRICE_MAX, Math.round(priceRaw)),
    capacity,
  };
}

export function sanitizeSuggestion(input = {}) {
  const title = text(input.title, 80);
  if (title.length < 3) throw new Error('El título de la propuesta es demasiado corto.');
  if (!Object.hasOwn(INTERESTS, input.interestKey)) throw new Error('Categoría no válida.');
  if (!NEIGHBORHOODS.some(({ name }) => name === input.barrio)) throw new Error('Barrio no válido.');
  return {
    title,
    desc: text(input.desc, 200) || 'Propuesta de la comunidad.',
    interestKey: input.interestKey,
    barrio: input.barrio,
  };
}

export function sanitizeTeam(input = {}) {
  // Capacidad fija 5 para retos creados desde la UI; las semillas `data/teams.js`
  // usan 6 (team-1) y 5 (team-2) de forma documentada. `members: []` son los
  // miembros reales (joins locales); los avatares iniciales de las semillas son
  // demostrativos y se suman al total con `min(fakes + joins, capacity)`.
  return {
    icon: '✨',
    title: text(input.title, 80) || 'Nuevo reto comunitario',
    subtitle: `${text(input.place, 60) || 'Comuna 2'} · equipo por formar`,
    capacity: 5,
    members: [],
  };
}
