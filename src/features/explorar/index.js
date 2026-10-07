import './explorar.css';
import template from './explorar.html?raw';
import { $ } from '../../core/dom.js';
import { appStore, isCreator } from '../../state/appStore.js';
import { addActivity, contentStore } from '../../state/contentStore.js';
import { PRICE_FILTERS } from '../../config/constants.js';
import { buildRecommendations } from '../../services/recommendations.js';
import { matchesPriceFilter, normalizeText, parsePriceInput } from '../../utils/format.js';
import { activityCard } from '../../shared/components/activityCard.js';
import { mountChipGroup } from '../../shared/components/chipGroup.js';
import { bindEnrollment } from '../../shared/components/enrollButton.js';
import { createFormModal } from '../../shared/components/formModal.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

function mount(section) {
  section.innerHTML = template;

  const grid = $('#exploreGrid', section);
  const publishBtn = $('#publishBtn', section);
  const search = $('#exploreSearch', section);
  let priceMode = PRICE_FILTERS[0].value;

  $('#exploreSearchIcon', section).innerHTML = icon('search', 18);
  publishBtn.innerHTML = `${icon('plus', 16)} Publicar taller`;

  function render() {
    const { user, affinities } = appStore.getState();
    if (!user) return;
    const { customActivities, enrolled } = contentStore.getState();
    const query = normalizeText(search.value.trim());

    const activities = buildRecommendations({ affinities, customActivities })
      .filter(({ price }) => matchesPriceFilter(price, priceMode))
      .filter(({ title, desc }) => !query || normalizeText(`${title} ${desc}`).includes(query));

    grid.innerHTML = activities.length
      ? activities.map((activity) => activityCard(activity, enrolled.includes(activity.id))).join('')
      : `<div class="empty">${icon('search', 24)}<b>Sin resultados</b>Prueba con otro filtro o búsqueda.</div>`;
    publishBtn.hidden = !isCreator();
  }

  const publishModal = createFormModal({
    title: 'Publicar taller o convocatoria',
    submitLabel: 'Publicar',
    fields: [
      { name: 'title', placeholder: 'Nombre del taller o convocatoria' },
      { name: 'desc', placeholder: 'Descripción breve' },
      { name: 'price', placeholder: 'Precio (vacío o "Gratis", o ej. $10.000)' },
    ],
    onSubmit: ({ title, desc, price }) => {
      addActivity({
        title: title || 'Nueva actividad',
        desc: desc || 'Publicado por un Creador de la comuna.',
        price: parsePriceInput(price),
      });
      showToast('Publicado ✓ — ya aparece para otros jóvenes');
    },
  });

  bindEnrollment(grid);
  publishBtn.addEventListener('click', publishModal.open);
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

export const screen = { id: 'explorar', label: 'Para ti', icon: icon('sparkles'), nav: true, access: 'auth', mount };
