import './explorar.css';
import template from './explorar.html?raw';
import { $, escapeHtml } from '../../core/dom.js';
import { appStore } from '../../state/appStore.js';
import { contentStore, getContent, suggestActivity } from '../../state/contentStore.js';
import { PRICE_FILTERS, ROLES } from '../../config/constants.js';
import { INTERESTS } from '../../data/interests.js';
import { NEIGHBORHOODS } from '../../data/neighborhoods.js';
import { STATUS_LABELS } from '../../services/events.js';
import { buildRecommendations } from '../../services/recommendations.js';
import { matchesPriceFilter, normalizeText } from '../../utils/format.js';
import { activityCard } from '../../shared/components/activityCard.js';
import { createFormModal } from '../../shared/components/formModal.js';
import { mountChipGroup } from '../../shared/components/chipGroup.js';
import { bindEnrollment } from '../../shared/components/enrollButton.js';
import { bindEventDetail } from '../../shared/components/eventDetail.js';
import { eventCard } from '../../shared/components/eventCard.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

const interestName = (key) => INTERESTS[key] ? `${INTERESTS[key].emoji} ${INTERESTS[key].label}` : key;

function suggestionRow(item) {
  return `<div class="suggest-row">
    <div class="suggest-main">
      <b>${escapeHtml(item.title)}</b>
      <p>${escapeHtml(item.desc)}</p>
      <span class="suggest-meta">${escapeHtml(interestName(item.interestKey))} · ${escapeHtml(item.barrio)}</span>
    </div>
    <div class="suggest-side"><span class="status status-${item.status}">${STATUS_LABELS[item.status]}</span></div>
  </div>`;
}

function mount(section) {
  section.innerHTML = template;

  const grid = $('#exploreGrid', section);
  const search = $('#exploreSearch', section);
  const communitySection = $('#communitySection', section);
  const communityGrid = $('#communityGrid', section);
  const suggestList = $('#suggestList', section);
  const badge = $('#mySugBadge', section);
  const suggestBtn = $('#suggestBtn', section);
  suggestBtn.innerHTML = `${icon('plus', 16)} Proponer actividad`;
  let priceMode = PRICE_FILTERS[0].value;
  let interestMode = 'todas';

  $('#exploreSearchIcon', section).innerHTML = icon('search', 18);

  function render() {
    const { user, affinities } = appStore.getState();
    if (!user) return;
    const content = getContent();
    const { enrolled } = content;
    const query = normalizeText(search.value.trim());

    const activities = buildRecommendations({ affinities })
      .filter(({ price }) => matchesPriceFilter(price, priceMode))
      .filter(({ interest }) => interestMode === 'todas' || interest === interestMode)
      .filter(({ title, desc }) => !query || normalizeText(`${title} ${desc}`).includes(query));

    grid.innerHTML = activities.length
      ? activities.map((activity) => activityCard(activity, enrolled.includes(activity.id))).join('')
      : `<div class="empty">${icon('search', 24)}<b>Sin resultados</b>Prueba con otro filtro o búsqueda.</div>`;

    const approved = content.suggestions
      .filter((item) => item.status === 'approved')
      .filter(({ title, desc }) => !query || normalizeText(`${title} ${desc}`).includes(query));
    communitySection.hidden = approved.length === 0;
    communityGrid.innerHTML = approved.map((item) => activityCard({
      id: `suggestion:${item.id}`,
      interest: item.interestKey,
      emoji: INTERESTS[item.interestKey]?.emoji ?? '✨',
      title: item.title,
      desc: `${item.desc} — Propuesta de ${item.authorName} · ${item.barrio}.`,
      price: item.price ?? 0,
      match: null,
    }, enrolled.includes(`suggestion:${item.id}`))).join('');

    const mine = content.suggestions.filter((item) => item.createdBy === user.id);
    const pending = mine.filter((item) => item.status === 'pending').length;
    badge.textContent = pending ? `${pending} en revisión` : `${mine.length} enviadas`;
    suggestList.innerHTML = mine.length
      ? mine.map(suggestionRow).join('')
      : `<div class="empty">${icon('sparkles', 24)}<b>Aún no propones actividades</b>Cuéntanos qué te gustaría hacer en tu barrio.</div>`;
  }

  const suggestModal = createFormModal({
    title: 'Proponer una actividad',
    submitLabel: 'Enviar a revisión',
    fields: [
      { name: 'title', label: 'Título de la actividad', placeholder: 'Ej. Taller de fotografía nocturna', required: true },
      { name: 'desc', label: 'Descripción', placeholder: 'Cuenta de qué trataría' },
      {
        name: 'interest', label: 'Categoría', type: 'select',
        options: Object.entries(INTERESTS).map(([value, { emoji, label }]) => ({ value, label: `${emoji} ${label}` })),
      },
      {
        name: 'barrio', label: 'Barrio', type: 'select',
        options: NEIGHBORHOODS.map(({ name }) => ({ value: name, label: name })),
      },
    ],
    onSubmit: ({ title, desc, interest, barrio }) => {
      try {
        suggestActivity({ title, desc, interestKey: interest, barrio });
        showToast('Propuesta enviada ✓ — un administrador la revisará');
      } catch (error) {
        showToast(error.message);
      }
    },
  });

  suggestBtn.addEventListener('click', () => {
    const { user } = appStore.getState();
    suggestModal.open({ barrio: user?.barrio ?? NEIGHBORHOODS[0].name });
  });

  bindEnrollment(grid);
  bindEnrollment(communityGrid);
  bindEventDetail(grid);
  search.addEventListener('input', render);
  mountChipGroup($('#explorePriceFilter', section), PRICE_FILTERS, {
    onChange: (mode) => {
      priceMode = mode;
      render();
    },
  });
  mountChipGroup($('#exploreInterestFilter', section), [
    { value: 'todas', label: 'Todas' },
    ...Object.entries(INTERESTS).map(([value, { emoji, label }]) => ({ value, label: `${emoji} ${label}` })),
  ], {
    onChange: (mode) => {
      interestMode = mode;
      render();
    },
  });
  appStore.subscribe(render);
  contentStore.subscribe(render);
  render();
}

export const screen = { id: 'explorar', label: 'Para ti', icon: icon('sparkles'), nav: true, access: [ROLES.CONSUMER], mount };
