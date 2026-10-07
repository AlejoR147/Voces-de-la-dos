export const INITIAL_TEAMS = Object.freeze([
  {
    id: 1,
    title: '🧱 Mural memoria histórica',
    subtitle: 'Cancha La Frontera · equipo sugerido por IA',
    capacity: 6,
    members: [
      { initial: 'M', tone: 'purple' },
      { initial: 'L', tone: 'blue' },
      { initial: 'J', tone: 'orange' },
      { initial: 'S', tone: 'purple' },
      { initial: 'D', tone: 'blue' },
    ],
    joinable: true,
    joined: false,
  },
  {
    id: 2,
    title: '🎬 Cortometraje "Mi barrio, mi historia"',
    subtitle: 'Buscan guionista y camarógrafo',
    capacity: 5,
    members: [
      { initial: 'A', tone: 'orange' },
      { initial: 'P', tone: 'purple' },
      { initial: 'R', tone: 'blue' },
    ],
    joinable: true,
    joined: false,
  },
]);
