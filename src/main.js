import './styles/main.css';
import { bootstrap } from './app/App.js';

bootstrap();

document.getElementById('themeToggle')?.addEventListener('click', () => {
  window.__scvdToggleTheme?.();
});
