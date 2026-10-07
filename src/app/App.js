import { $, escapeHtml } from '../core/dom.js';
import { SCREENS } from '../features/index.js';
import { setupRouter } from './router.js';

export function bootstrap() {
  const tabs = $('#tabs');
  const screens = $('#screens');

  SCREENS.forEach(({ id, label, mount }) => {
    tabs.insertAdjacentHTML('beforeend', `<button class="tab" type="button" data-screen="${id}">${escapeHtml(label)}</button>`);

    const section = document.createElement('section');
    section.className = 'screen';
    section.id = id;
    screens.appendChild(section);
    mount(section);
  });

  setupRouter({ tabs, screens });
}
