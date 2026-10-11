import './styles/main.css';
import { bootstrap } from './app/App.js';
import { readString, removeKey, writeString } from './core/storage.js';

const THEME_KEY = 'scvd-theme';

function applyTheme(theme, save) {
  document.documentElement.setAttribute('data-theme', theme);
  if (save) writeString(THEME_KEY, theme);
  else removeKey(THEME_KEY);
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#1A1625' : '#6C3CE0');
}

applyTheme(
  readString(THEME_KEY)
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  false,
);

document.getElementById('themeToggle')?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark', true);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  if (!readString(THEME_KEY)) {
    applyTheme(event.matches ? 'dark' : 'light', false);
  }
});

bootstrap();
