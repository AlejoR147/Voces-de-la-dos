import './personas.css';
import template from './personas.html?raw';

function mount(section) {
  section.innerHTML = template;
}

export const screen = { id: 'personas', label: 'Personas', mount };
