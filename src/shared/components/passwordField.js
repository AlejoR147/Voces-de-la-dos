import { icon } from '../icons.js';

export function bindPasswordToggle(input, button) {
  const render = () => {
    const visible = input.type === 'text';
    button.innerHTML = icon(visible ? 'eye-off' : 'eye', 18);
    button.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
  };
  button.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
    render();
  });
  render();
}
