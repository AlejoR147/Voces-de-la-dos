// Coordenadas aproximadas dentro de la Comuna 2 Santa Cruz, Medellín.
// `pin` define la posición relativa del marcador en el mapa ilustrativo.
export const PLACES = Object.freeze({
  cultura: {
    name: 'Casa de la Cultura Santa Cruz',
    meta: 'Lun–Sáb · 8:00am – 6:00pm',
    desc: 'Talleres de danza, música y teatro para todas las edades.',
    color: 'var(--purple-soft)',
    lat: 6.2992, lng: -75.5590, price: 0,
    pin: { top: '28%', left: '18%', tone: 'purple', icon: '🏛️' },
  },
  mural: {
    name: 'Mural "Memoria Viva"',
    meta: 'Acceso libre · 24 horas',
    desc: 'Mural comunitario realizado por jóvenes del barrio en 2024.',
    color: 'var(--orange-soft)',
    lat: 6.2968, lng: -75.5565, price: 0,
    pin: { top: '50%', left: '38%', tone: 'orange', icon: '🎨' },
  },
  biblio: {
    name: 'Biblioteca Comunitaria Granizal',
    meta: 'Lun–Vie · 9:00am – 5:00pm',
    desc: 'Sala de lectura, préstamo de libros y acceso a computadores.',
    color: 'var(--blue-soft)',
    lat: 6.3042, lng: -75.5518, price: 0,
    pin: { top: '22%', left: '62%', tone: 'blue', icon: '📚' },
  },
  escenario: {
    name: 'Escenario La Frontera',
    meta: 'Fines de semana · desde 3:00pm',
    desc: 'Tarima al aire libre para conciertos y festivales barriales. Algunos eventos cobran boletería para cubrir producción.',
    color: 'var(--purple-soft)',
    lat: 6.2921, lng: -75.5542, price: 8000,
    pin: { top: '66%', left: '70%', tone: 'purple', icon: '🎶' },
  },
  taller: {
    name: 'Laboratorio Creativo Moscú',
    meta: 'Mar–Sáb · 10:00am – 4:00pm',
    desc: 'Espacio de fotografía, costura y manualidades comunitarias. Cobra solo el costo de materiales.',
    color: 'var(--orange-soft)',
    lat: 6.2958, lng: -75.5612, price: 5000,
    pin: { top: '72%', left: '22%', tone: 'orange', icon: '🧵' },
  },
});
