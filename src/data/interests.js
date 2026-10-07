export const INTERESTS = Object.freeze({
  rap: {
    label: 'Rap', emoji: '🎤', profile: 'Explorador Urbano',
    activity: { title: 'Taller de rap barrial', desc: 'Escritura de letras y grabación básica en estudio comunitario.', price: 0 },
  },
  dibujo: {
    label: 'Dibujo', emoji: '✏️', profile: 'Trazo Libre',
    activity: { title: 'Club de ilustración', desc: 'Sesiones semanales de dibujo narrativo y cómic.', price: 0 },
  },
  foto: {
    label: 'Fotografía', emoji: '📷', profile: 'Ojo de Barrio',
    activity: { title: 'Concurso de foto móvil', desc: 'Retrata tu barrio con tu celular y compite por materiales.', price: 0 },
  },
  danza: {
    label: 'Danza', emoji: '🕺', profile: 'Ritmo Colectivo',
    activity: { title: 'Colectivo de danza urbana', desc: 'Ensayos abiertos los sábados en la casa de cultura.', price: 0 },
  },
  videojuegos: {
    label: 'Videojuegos', emoji: '🎮', profile: 'Constructor Digital',
    activity: { title: 'Laboratorio de videojuegos', desc: 'Diseña tu primer juego con mentores del sector tech.', price: 10000 },
  },
  teatro: {
    label: 'Teatro', emoji: '🎭', profile: 'Voz en Escena',
    activity: { title: 'Semillero de teatro comunitario', desc: 'Monta una obra corta con tu barrio como escenario.', price: 0 },
  },
  mural: {
    label: 'Muralismo', emoji: '🎨', profile: 'Pincel Comunitario',
    activity: { title: 'Jornada de muralismo colectivo', desc: 'Interviene un muro junto a artistas locales. Incluye materiales e insumos.', price: 6000 },
  },
});

export const INTEREST_KEYS = Object.freeze(Object.keys(INTERESTS));
