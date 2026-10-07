import template from './eventos.html?raw';
import { $ } from '../../core/dom.js';
import { PRICE_FILTERS, ROLES } from '../../config/constants.js';
import { getPlace } from '../../data/places.js';
import { appStore } from '../../state/appStore.js';
import { contentStore, getContent } from '../../state/contentStore.js';
import { isPast, publishedEvents } from '../../services/events.js';
import { matchesPriceFilter, normalizeText } from '../../utils/format.js';
import { mountChipGroup } from '../../shared/components/chipGroup.js';
import { bindEnrollment } from '../../shared/components/enrollButton.js';
import { eventCard } from '../../shared/components/eventCard.js';
import { icon } from '../../shared/icons.js';

function mount(section) {
  section.innerHTML = template;

  const list = $('#eventList', section);
  const search = $('#eventSearch', section);
  let priceMode = PRICE_FILTERS[0].value;

  $('#eventSearchIcon', section).innerHTML = icon('search', 18);

  function render() {
    const { user } = appStore.getState();
    if (!user) return;
    const content = getContent();
    const query = normalizeText(search.value.trim());

    const events = publishedEvents(content)
      .filter(({ price }) => matchesPriceFilter(price, priceMode))
      .filter((event) => !query || normalizeText(
        `${event.title} ${event.desc} ${event.barrio} ${getPlace(event.placeId)?.name ?? ''}`,
      ).includes(query))
      .sort((a, b) => Number(isPast(a)) - Number(isPast(b)) || (isPast(a) ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));

    list.innerHTML = events.length
      ? events.map((event) => eventCard(event, content, { enroll: user.role === ROLES.CONSUMER })).join('')
      : `<div class="empty">${icon('calendar', 24)}<b>Sin eventos</b>Prueba con otro filtro o búsqueda.</div>`;
  }

  bindEnrollment(list);
  search.addEventListener('input', render);
  mountChipGroup($('#eventPriceFilter', section), PRICE_FILTERS, {
    onChange: (mode) => {
      priceMode = mode;
      render();
    },
  });
  appStore.subscribe(render);
  contentStore.subscribe(render);
  render();
}

export const screen = {
  id: 'eventos', label: 'Eventos', icon: icon('calendar'), nav: true, access: 'auth', mount,
};
