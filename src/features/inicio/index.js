import './inicio.css';
import template from './inicio.html?raw';

function mount(section) {
  section.innerHTML = template;
}

export const screen = { id: 'inicio', label: 'Inicio', mount };
