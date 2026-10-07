import template from './explorar.html?raw';
import { $ } from '../../core/dom.js';
import { appStore } from '../../state/appStore.js';
import { contentStore, getContent } from '../../state/contentStore.js';
import { PRICE_FILTERS, ROLES } from '../../config/constants.js';
import { buildRecommendations } from '../../services/recommendations.js';
import { matchesPriceFilter, normalizeText } from '../../utils/format.js';
import { activityCard } from '../../shared/components/activityCard.js';
import { mountChipGroup } from '../../shared/components/chipGroup.js';
import { bindEnrollment } from '../../shared/components/enrollButton.js';
import { icon } from '../../shared/icons.js';

function mount(section) {
  section.innerHTML = template;

  const grid = $('#exploreGrid', section);
  const search = $('#exploreSearch', section);
  let priceMode = PRICE_FILTERS[0].value;

  $('#exploreSearchIcon', section).innerHTML = icon('search', 18);

  function render() {
    const { user, affinities } = appStore.getState();
    if (!user) return;
    const { enrolled } = getContent();
    const query = normalizeText(search.value.trim());

    const activities = buildRecommendations({ affinities })
      .filter(({ price }) => matchesPriceFilter(price, priceMode))
      .filter(({ title, desc }) => !query || normalizeText(`${title} ${desc}`).includes(query));

    grid.innerHTML = activities.length
      ? activities.map((activity) => activityCard(activity, enrolled.includes(activity.id))).join('')
      : `<div class="empty">${icon('search', 24)}<b>Sin resultados</b>Prueba con otro filtro o búsqueda.</div>`;
  }

  bindEnrollment(grid);
  search.addEventListener('input', render);
  mountChipGroup($('#explorePriceFilter', section), PRICE_FILTERS, {
    onChange: (mode) => {
      priceMode = mode;
      render();
    },
  });
  appStore.subscribe(render);
  contentStore.subscribe(render);
  render();
}

export const screen = { id: 'explorar', label: 'Para ti', icon: icon('sparkles'), nav: true, access: [ROLES.CONSUMER], mount };
