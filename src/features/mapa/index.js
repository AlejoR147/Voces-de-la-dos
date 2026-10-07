import './mapa.css';
import template from './mapa.html?raw';
import { $, $$, delegate, escapeHtml } from '../../core/dom.js';
import { PLACES } from '../../data/places.js';
import { estimateWalk, googleMapsDirectionsUrl } from '../../services/maps.js';
import { priceBadgeInfo } from '../../shared/components/priceBadge.js';
import { mountPriceFilter, matchesPriceFilter } from '../../shared/components/priceFilter.js';
import { showToast } from '../../shared/components/toast.js';

function renderPins(container) {
  container.innerHTML = Object.entries(PLACES)
    .map(([key, { name, price, pin }]) => (
      `<button type="button" class="map-pin ${pin.tone}" data-place="${key}" aria-label="${escapeHtml(name)}" style="top:${pin.top}; left:${pin.left};"><span>${pin.icon}</span></button>`
    ))
    .join('');
}

function routePath(canvas, origin, pin) {
  const canvasRect = canvas.getBoundingClientRect();
  const originRect = origin.getBoundingClientRect();
  const pinRect = pin.getBoundingClientRect();
  const x1 = originRect.left - canvasRect.left + originRect.width / 2;
  const y1 = originRect.top - canvasRect.top + originRect.height / 2;
  const x2 = pinRect.left - canvasRect.left + pinRect.width / 2;
  const y2 = pinRect.top - canvasRect.top + pinRect.height / 2;
  const controlX = (x1 + x2) / 2;
  const controlY = Math.min(y1, y2) - 40;
  return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
}

function mount(section) {
  section.innerHTML = template;

  const els = {
    canvas: $('#mapCanvas', section),
    origin: $('#originPin', section),
    pins: $('#mapPins', section),
    route: $('#routeSvg', section),
    sheet: $('#placeSheet', section),
    thumb: $('#sheetThumb', section),
    name: $('#sheetName', section),
    price: $('#sheetPrice', section),
    meta: $('#sheetMeta', section),
    desc: $('#sheetDesc', section),
    gmaps: $('#gmapsLink', section),
    routeInfo: $('#routeInfo', section),
  };
  let selectedPin = null;

  renderPins(els.pins);

  function showPlace(key, pin) {
    const place = PLACES[key];
    const { className, label } = priceBadgeInfo(place.price);
    selectedPin = pin;
    els.name.textContent = place.name;
    els.price.className = `price-badge ${className}`;
    els.price.textContent = label;
    els.meta.textContent = place.meta;
    els.desc.textContent = place.desc;
    els.thumb.style.background = place.color;
    els.gmaps.href = googleMapsDirectionsUrl(place);
    els.routeInfo.textContent = '';
    els.route.innerHTML = '';
    els.sheet.classList.add('show');
  }

  function drawRoute() {
    if (!selectedPin) return;
    els.route.innerHTML = `<path class="route-path" d="${routePath(els.canvas, els.origin, selectedPin)}"/>`;
    const { km, minutes } = estimateWalk();
    els.routeInfo.textContent = `≈ ${km} km · ${minutes} min caminando desde tu ubicación`;
    showToast('Ruta trazada en el mapa');
  }

  function filterPins(mode) {
    $$('.map-pin', els.pins).forEach((pin) => {
      pin.classList.toggle('dim', !matchesPriceFilter(PLACES[pin.dataset.place].price, mode));
    });
  }

  delegate(els.pins, 'click', '.map-pin', (_event, pin) => showPlace(pin.dataset.place, pin));
  $('#routeBtn', section).addEventListener('click', drawRoute);
  mountPriceFilter($('#mapPriceFilter', section), filterPins);
}

export const screen = { id: 'mapa', label: 'Mapa', mount };
