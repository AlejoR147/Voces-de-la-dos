import './recomendaciones.css';
import template from './recomendaciones.html?raw';
import { $, escapeHtml } from '../../core/dom.js';
import { appStore } from '../../state/appStore.js';
import { INTERESTS } from '../../data/interests.js';
import { ROLES } from '../../config/constants.js';
import { orderRecommendationKeys, scoreRecommendation } from '../../services/affinity.js';
import { parsePriceInput } from '../../utils/format.js';
import { priceBadge } from '../../shared/components/priceBadge.js';
import { mountPriceFilter, matchesPriceFilter } from '../../shared/components/priceFilter.js';
import { createFormModal } from '../../shared/components/formModal.js';
import { showToast } from '../../shared/components/toast.js';

function recommendationCard({ badge, title, desc, price }) {
  return `<div class="rec-card">
    <div class="top"><h4>${title}</h4>${badge}</div>
    ${priceBadge(price)}
    <p>${desc}</p>
    <button class="btn btn-ghost btn-sm" type="button">Ver detalle</button>
  </div>`;
}

function mount(section) {
  section.innerHTML = template;

  const grid = $('#recGrid', section);
  const banner = $('#creatorBannerRec', section);
  let priceMode = 'todos';
  const publishedActivities = [];

  function render() {
    const priorityKeys = appStore.getState().affinities.map(({ key }) => key);

    const published = publishedActivities
      .filter(({ price }) => matchesPriceFilter(price, priceMode))
      .map(({ title, desc, price }) => recommendationCard({
        title: `🎨 ${escapeHtml(title)}`,
        desc: escapeHtml(desc),
        price,
        badge: '<span class="aff-badge aff-badge--new">Nuevo</span>',
      }));

    const recommended = orderRecommendationKeys(priorityKeys)
      .map((key, position) => ({ key, position, activity: INTERESTS[key].activity }))
      .filter(({ activity }) => matchesPriceFilter(activity.price, priceMode))
      .map(({ key, position, activity }) => recommendationCard({
        title: `${INTERESTS[key].emoji} ${activity.title}`,
        desc: activity.desc,
        price: activity.price,
        badge: `<span class="aff-badge">${scoreRecommendation(position)}%</span>`,
      }));

    grid.innerHTML = published.concat(recommended).join('');
  }

  const publishModal = createFormModal({
    title: 'Publicar taller o convocatoria',
    submitLabel: 'Publicar',
    fields: [
      { name: 'title', placeholder: 'Nombre del taller/convocatoria' },
      { name: 'desc', placeholder: 'Descripción breve' },
      { name: 'price', placeholder: 'Precio (deja vacío o escribe Gratis, o ej. $10.000)' },
    ],
    onSubmit: ({ title, desc, price }) => {
      publishedActivities.unshift({
        title: title || 'Nueva actividad',
        desc: desc || 'Publicado por un Creador de la comuna.',
        price: parsePriceInput(price),
      });
      render();
      showToast('Publicado ✓ — ya aparece en Recomendaciones de otros jóvenes');
    },
  });

  $('#publishBtn', section).addEventListener('click', publishModal.open);
  mountPriceFilter($('#recPriceFilter', section), (mode) => {
    priceMode = mode;
    render();
  });
  appStore.watch((state) => state.role, (role) => banner.classList.toggle('show', role === ROLES.CREATOR));
  appStore.watch((state) => state.affinities, render);
}

export const screen = { id: 'recomendaciones', label: 'Recomendaciones', mount };
