import './styles/main.css';
import { bootstrap } from './app/App.js';

const THEME_KEY = 'scvd-theme';

function applyTheme(theme, save) {
  document.documentElement.setAttribute('data-theme', theme);
  if (save) localStorage.setItem(THEME_KEY, theme);
  else localStorage.removeItem(THEME_KEY);
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#1A1625' : '#6C3CE0');
}

applyTheme(
  localStorage.getItem(THEME_KEY)
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  false,
);

document.getElementById('themeToggle')?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark', true);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  if (!localStorage.getItem(THEME_KEY)) {
    applyTheme(event.matches ? 'dark' : 'light', false);
  }
});

bootstrap();
