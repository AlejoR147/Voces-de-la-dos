import { $, escapeHtml } from '../core/dom.js';
import { SCREENS } from '../features/index.js';
import { appStore } from '../state/appStore.js';
import { initAuth, logout } from '../services/auth.js';
import { ROLE_LABELS } from '../config/constants.js';
import { initialOf } from '../utils/format.js';
import { showToast } from '../shared/components/toast.js';
import { icon } from '../shared/icons.js';
import { setupRouter } from './router.js';

function mountHeaderControls() {
  const chip = $('#userChip');
  const logoutBtn = $('#logoutBtn');
  const loginLink = $('#loginLink');
  logoutBtn.innerHTML = icon('logout', 18);

  appStore.watch((state) => state.user, (user) => {
    chip.hidden = !user;
    logoutBtn.hidden = !user;
    loginLink.hidden = Boolean(user);
    if (!user) return;
    chip.innerHTML = `<span class="avatar avatar-sm">${escapeHtml(initialOf(user.name))}</span>
      <span class="user-chip-text"><b>${escapeHtml(user.name)}</b><small>${ROLE_LABELS[user.role]}</small></span>`;
  });

  logoutBtn.addEventListener('click', () => {
    logout();
    showToast('Cerraste sesión');
  });
}

export function bootstrap() {
  initAuth({ onSessionExpired: () => showToast('Tu sesión expiró por inactividad. Vuelve a iniciar sesión.') });

  const screens = $('#screens');
  SCREENS.forEach(({ id, mount }) => {
    const section = document.createElement('section');
    section.className = 'screen';
    section.id = `screen-${id}`;
    section.dataset.screen = id;
    screens.appendChild(section);
    try {
      mount(section);
    } catch (error) {
      console.error(`No se pudo montar la pantalla "${id}"`, error);
      section.innerHTML = '<div class="card"><h2>Algo salió mal</h2><p>No pudimos cargar esta sección. Prueba recargando la página.</p></div>';
      showToast(`No pudimos cargar la sección ${id}`);
    }
  });

  mountHeaderControls();
  setupRouter({ nav: $('#nav'), screens, screenDefinitions: SCREENS });
}
