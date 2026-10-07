import { $$, delegate } from '../core/dom.js';
import { DEFAULT_SCREEN } from '../config/constants.js';

let tabsRoot;
let screensRoot;

function screenExists(id) {
  return $$('.screen', screensRoot).some((screen) => screen.id === id);
}

export function navigate(id, { scroll = true } = {}) {
  if (!screenExists(id)) return;
  $$('.screen', screensRoot).forEach((screen) => screen.classList.toggle('active', screen.id === id));
  $$('.tab', tabsRoot).forEach((tab) => tab.classList.toggle('active', tab.dataset.screen === id));
  history.replaceState(null, '', `#${id}`);
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function setupRouter({ tabs, screens }) {
  tabsRoot = tabs;
  screensRoot = screens;

  delegate(tabsRoot, 'click', '.tab', (_event, tab) => navigate(tab.dataset.screen));
  delegate(document, 'click', '[data-navigate]', (_event, element) => navigate(element.dataset.navigate));
  window.addEventListener('hashchange', () => navigate(location.hash.slice(1), { scroll: false }));

  const initial = location.hash.slice(1);
  navigate(screenExists(initial) ? initial : DEFAULT_SCREEN, { scroll: false });
}
