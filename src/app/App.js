import { $, escapeHtml } from '../core/dom.js';
import { SCREENS } from '../features/index.js';
import { appStore } from '../state/appStore.js';
import { ROLE_LABELS } from '../config/constants.js';
import { initialOf } from '../utils/format.js';
import { setupRouter } from './router.js';

function mountUserChip() {
  const chip = $('#userChip');
  appStore.watch((state) => state.user, (user) => {
    chip.hidden = !user;
    if (!user) return;
    chip.innerHTML = `<span class="avatar avatar-sm">${escapeHtml(initialOf(user.name))}</span>
      <span class="user-chip-text"><b>${escapeHtml(user.name)}</b><small>${ROLE_LABELS[user.role]}</small></span>`;
  });
}

export function bootstrap() {
  const screens = $('#screens');

  SCREENS.forEach(({ id, mount }) => {
    const section = document.createElement('section');
    section.className = 'screen';
    section.id = `screen-${id}`;
    section.dataset.screen = id;
    screens.appendChild(section);
    mount(section);
  });

  mountUserChip();
  setupRouter({ nav: $('#nav'), screens, screenDefinitions: SCREENS });
}
