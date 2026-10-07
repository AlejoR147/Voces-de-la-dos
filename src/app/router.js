import { $$, delegate } from '../core/dom.js';
import { DEFAULT_SCREEN, PUBLIC_SCREEN } from '../config/constants.js';
import { appStore } from '../state/appStore.js';

let definitions = [];
let navRoot;
let screensRoot;

function canAccess({ access = 'auth' }, user) {
  if (access === 'public') return !user;
  if (!user) return false;
  return access === 'auth' || access.includes(user.role);
}

function resolve(id, user) {
  const definition = definitions.find((item) => item.id === id);
  if (definition && canAccess(definition, user)) return definition;
  const homeId = user ? DEFAULT_SCREEN : PUBLIC_SCREEN;
  return definitions.find((item) => item.id === homeId);
}

function renderNav(user, activeId) {
  $$('.nav-item', navRoot).forEach((item) => {
    const definition = definitions.find(({ id }) => id === item.dataset.screen);
    const active = item.dataset.screen === activeId;
    item.hidden = !canAccess(definition, user);
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  navRoot.hidden = !user;
}

function show() {
  const { user } = appStore.getState();
  const requested = location.hash.replace(/^#\/?/, '');
  const definition = resolve(requested, user);

  if (definition.id !== requested) history.replaceState(null, '', `#${definition.id}`);

  $$('.screen', screensRoot).forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === definition.id));
  renderNav(user, definition.id);
  document.title = `${definition.label} · Santa Cruz Vive Digital`;
  window.scrollTo({ top: 0 });
  definition.onShow?.();
}

export function navigate(id) {
  if (location.hash.slice(1) === id) show();
  else location.hash = id;
}

export function setupRouter({ nav, screens, screenDefinitions }) {
  definitions = screenDefinitions;
  navRoot = nav;
  screensRoot = screens;

  nav.innerHTML = definitions
    .filter(({ nav: inNav }) => inNav)
    .map(({ id, label, icon }) => `<a class="nav-item" href="#${id}" data-screen="${id}" hidden>${icon}<span>${label}</span></a>`)
    .join('');

  delegate(document, 'click', '[data-navigate]', (_event, element) => navigate(element.dataset.navigate));
  window.addEventListener('hashchange', show);
  appStore.watch((state) => state.user, show);
}
