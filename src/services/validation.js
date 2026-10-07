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

const PHONE_PATTERN = /^[\d\s()+-]*$/;
const TAX_ID_PATTERN = /^[\w.\- ]*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validWebsite(value) {
  if (!value) return true;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
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

export function sanitizeEvent(input = {}) {
  const title = text(input.title, 100);
  const place = getPlace(input.placeId);
  if (title.length < 3) throw new Error('El nombre del evento es demasiado corto.');
  if (!place) throw new Error('Lugar no válido.');
  if (!ISO_DATE_PATTERN.test(String(input.date))) throw new Error('Fecha no válida.');

  return {
    title,
    desc: text(input.desc, 300) || 'Evento comunitario en la Comuna 2.',
    placeId: place.id,
    barrio: place.barrio,
    date: input.date,
    price: Math.min(1000000, Math.max(0, Math.round(Number(input.price)) || 0)),
    capacity: Math.min(1000, Math.max(1, Math.round(Number(input.capacity)) || 30)),
  };
}

export function sanitizeTeam(input = {}) {
  return {
    icon: '✨',
    title: text(input.title, 80) || 'Nuevo reto comunitario',
    subtitle: `${text(input.place, 60) || 'Comuna 2'} · equipo por formar`,
    capacity: 5,
    members: [],
  };
}
