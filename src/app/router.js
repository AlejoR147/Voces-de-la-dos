import { $$, delegate } from '../core/dom.js';
import { DEFAULT_SCREEN, PUBLIC_SCREEN } from '../config/constants.js';
import { appStore } from '../state/appStore.js';
import { showToast } from '../shared/components/toast.js';

let definitions = [];
let navRoot;
let screensRoot;
let activeId = null;
let switchTimer = null;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function normalizeHash(value) {
  return String(value ?? '').replace(/^#\/?/, '');
}

function canAccess(definition, user) {
  if (!definition) return false;
  const access = definition.access ?? 'auth';
  if (access === 'public') return !user;
  if (!user) return false;
  if (access === 'auth') return true;
  return Array.isArray(access) && access.includes(user.role);
}

function resolve(id, user) {
  const clean = normalizeHash(id);
  const definition = definitions.find((item) => item.id === clean);
  if (definition && canAccess(definition, user)) return definition;
  const homeId = user ? DEFAULT_SCREEN : PUBLIC_SCREEN;
  return definitions.find((item) => item.id === homeId);
}

function renderNav(user, current) {
  if (!navRoot) return;
  $$('.nav-item', navRoot).forEach((item) => {
    const definition = definitions.find(({ id }) => id === item.dataset.screen);
    const active = item.dataset.screen === current;
    item.hidden = !canAccess(definition, user);
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  navRoot.hidden = !user;
}

function show() {
  const { user } = appStore.getState();
  const requested = normalizeHash(location.hash);
  const definition = resolve(requested, user);
  if (!definition) return;

  if (definition.id !== requested) {
    history.replaceState(null, '', `#${definition.id}`);
    const wanted = definitions.find((item) => item.id === requested);
    if (wanted && !canAccess(wanted, user) && !user) {
      showToast('Inicia sesión o crea tu cuenta para ver esa sección.');
    }
  }

  // Misma pantalla: solo refresca nav sin transición ni scroll.
  if (definition.id === activeId) {
    renderNav(user, definition.id);
    document.title = `${definition.label} · Voces de la dos`;
    definition.onShow?.();
    return;
  }

  const previous = definitions.find((item) => item.id === activeId);
  const swap = () => {
    if (previous && previous.id !== definition.id) previous.onHide?.();
    activeId = definition.id;

    $$('.screen', screensRoot).forEach((screen) => {
      const isTarget = screen.dataset.screen === definition.id;
      screen.classList.toggle('active', isTarget);
      screen.classList.toggle('is-entering', isTarget);
      screen.classList.remove('is-leaving');
    });
    screensRoot?.classList.remove('is-switching');
    renderNav(user, definition.id);
    document.title = `${definition.label} · Voces de la dos`;
    // Salto instantáneo a top enmascarado por el fade de entrada.
    window.scrollTo({ top: 0, behavior: 'auto' });
    definition.onShow?.();
    // Limpia la clase de entrada tras la animación para no acumularla.
    window.setTimeout(() => {
      screensRoot?.querySelector?.('.screen.is-entering')?.classList.remove('is-entering');
    }, 350);
  };

  // Primera carga o reduced-motion: cambio directo sin fundido de salida.
  if (!previous || reduceMotion()) {
    if (switchTimer) window.clearTimeout(switchTimer);
    screensRoot?.classList.remove('is-switching');
    swap();
    return;
  }

  // Crossfade: mantiene la anterior 180ms con .is-leaving y luego canjea.
  if (switchTimer) window.clearTimeout(switchTimer);
  const oldEl = screensRoot?.querySelector?.(`.screen[data-screen="${previous.id}"]`);
  screensRoot?.classList.add('is-switching');
  oldEl?.classList.add('is-leaving');
  switchTimer = window.setTimeout(swap, 180);
}

export function navigate(id) {
  const clean = normalizeHash(id);
  if (normalizeHash(location.hash) === clean) show();
  else location.hash = clean;
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
  delegate(document, 'click', '[data-requires-auth]', (event, element) => {
    const { user } = appStore.getState();
    if (user) return;
    event.preventDefault();
    showToast('Inicia sesión o crea tu cuenta para ver esa sección.');
    navigate(element.dataset.requiresAuth || 'acceso');
  });
  window.addEventListener('hashchange', show);
  // Solo re-render completo si cambió la pantalla visible: una actualización
  // de perfil crea un objeto `user` nuevo sin cambiar de pantalla, y no debe
  // disparar `show()` (con su scroll) de nuevo.
  appStore.watch((state) => state.user, (user) => {
    const definition = resolve(normalizeHash(location.hash), user);
    if (definition && definition.id === activeId) {
      renderNav(user, definition.id);
      return;
    }
    show();
  });
}
