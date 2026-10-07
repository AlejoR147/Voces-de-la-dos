import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapa.css';
import template from './mapa.html?raw';
import { $, escapeHtml } from '../../core/dom.js';
import { MAP_CONFIG, PRICE_FILTERS } from '../../config/constants.js';
import { PLACES, PLACE_CATEGORIES, getPlace } from '../../data/places.js';
import { isConsumer } from '../../state/appStore.js';
import { contentStore, getContent } from '../../state/contentStore.js';
import {
  distanceMeters, formatDistance, getCurrentPosition, googleMapsDirectionsUrl,
} from '../../services/geo.js';
import { getWalkingRoute } from '../../services/routing.js';
import { isPast, publishedEvents } from '../../services/events.js';
import { matchesPriceFilter, normalizeText } from '../../utils/format.js';
import { mountChipGroup } from '../../shared/components/chipGroup.js';
import { priceBadge } from '../../shared/components/priceBadge.js';
import { bindEnrollment, enrollButton } from '../../shared/components/enrollButton.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

const REFERENCE = { lat: MAP_CONFIG.center[0], lng: MAP_CONFIG.center[1], label: 'Parque de Santa Cruz (referencia)', live: false };
const MAX_DISTANCE_FROM_COMMUNE_M = 20000;
const MAP_BOUNDS = L.latLngBounds([6.2, -75.66], [6.4, -75.45]);

const CATEGORY_OPTIONS = [
  { value: 'todas', label: 'Todas' },
  ...Object.entries(PLACE_CATEGORIES).map(([value, { icon: emoji, label }]) => ({ value, label: `${emoji} ${label}` })),
];

const pinIcon = (place, selected) => {
  const { tone, icon: emoji } = PLACE_CATEGORIES[place.category];
  return L.divIcon({
    className: 'map-marker',
    html: `<div class="pin pin--${tone}${selected ? ' is-selected' : ''}"><span>${emoji}</span></div>`,
    iconSize: [40, 48],
    iconAnchor: [20, 42],
  });
};

const originIcon = (live) => L.divIcon({
  className: 'map-marker',
  html: `<div class="origin-dot${live ? '' : ' origin-dot--ref'}"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function placeItemHtml(place, origin, active) {
  const { tone, icon: emoji } = PLACE_CATEGORIES[place.category];
  const distance = formatDistance(distanceMeters(origin, place));
  return `<button type="button" class="place-item${active ? ' active' : ''}" data-place="${place.id}">
    <span class="place-item-icon place-item-icon--${tone}">${emoji}</span>
    <span class="place-item-body"><b>${escapeHtml(place.name)}</b><span>${escapeHtml(place.barrio)} · a ${distance}</span></span>
    ${priceBadge(place.price)}
  </button>`;
}

function detailHtml(place, { origin, route, routing, enrolled, upcoming, canEnroll }) {
  const eventsLine = upcoming
    ? `<a class="detail-line detail-link" href="#eventos">${icon('calendar', 16)}<span>${upcoming} ${upcoming === 1 ? 'evento próximo' : 'eventos próximos'} aquí</span></a>`
    : '';
  const category = PLACE_CATEGORIES[place.category];
  const distance = formatDistance(distanceMeters(origin, place));
  const routeInfo = route
    ? `<div class="route-info">${icon('route', 16)}<span><b>${formatDistance(route.meters)} · ${route.minutes} min a pie</b>${route.approximate ? ' <small>(estimado)</small>' : ''}</span></div>`
    : '';

  return `<div class="detail-top">
      <div>
        <div class="detail-badges"><span class="badge">${category.icon} ${category.label}</span>${priceBadge(place.price)}</div>
        <h3>${escapeHtml(place.name)}</h3>
      </div>
      <button type="button" class="icon-btn detail-close" data-close aria-label="Cerrar">${icon('x', 16)}</button>
    </div>
    <div class="detail-line">${icon('clock', 16)}<span>${escapeHtml(place.meta)}</span></div>
    <div class="detail-line">${icon('pin', 16)}<span>${escapeHtml(place.barrio)} · a ${distance} de ${escapeHtml(origin.live ? 'tu ubicación' : origin.label)}</span></div>
    ${eventsLine}
    <p class="detail-desc">${escapeHtml(place.desc)}</p>
    ${routeInfo}
    <div class="detail-actions">
      <button type="button" class="btn btn-accent btn-sm" data-route${routing ? ' disabled' : ''}>${icon('route', 16)} ${routing ? 'Calculando…' : route ? 'Quitar ruta' : 'Cómo llegar'}</button>
      <a class="btn btn-outline btn-sm" href="${googleMapsDirectionsUrl(place)}" target="_blank" rel="noopener">${icon('external', 16)} Google Maps</a>
      ${canEnroll ? enrollButton(`place:${place.id}`, enrolled) : ''}
    </div>`;
}

function mount(section) {
  section.innerHTML = template;

  const els = {
    map: $('#map', section),
    search: $('#mapSearch', section),
    list: $('#placeList', section),
    count: $('#placeCount', section),
    detail: $('#placeDetail', section),
    locate: $('#locateBtn', section),
  };

  const state = {
    map: null,
    markers: new Map(),
    markerLayer: null,
    routeLayer: null,
    originMarker: null,
    origin: REFERENCE,
    selectedId: null,
    route: null,
    routing: false,
    category: CATEGORY_OPTIONS[0].value,
    price: PRICE_FILTERS[0].value,
  };

  $('#mapSearchIcon', section).innerHTML = icon('search', 18);
  els.locate.innerHTML = icon('locate', 22);

  function visiblePlaces() {
    const query = normalizeText(els.search.value.trim());
    return PLACES
      .filter((place) => state.category === 'todas' || place.category === state.category)
      .filter((place) => matchesPriceFilter(place.price, state.price))
      .filter((place) => !query || normalizeText(`${place.name} ${place.barrio} ${place.desc}`).includes(query))
      .sort((a, b) => distanceMeters(state.origin, a) - distanceMeters(state.origin, b));
  }

  function clearRoute() {
    state.route = null;
    state.routeLayer?.clearLayers();
  }

  function renderDetail() {
    const place = getPlace(state.selectedId);
    els.detail.hidden = !place;
    if (!place) return;
    els.detail.innerHTML = detailHtml(place, {
      origin: state.origin,
      route: state.route,
      routing: state.routing,
      enrolled: getContent().enrolled.includes(`place:${place.id}`),
      canEnroll: isConsumer(),
      upcoming: publishedEvents(getContent())
        .filter((event) => event.placeId === place.id && !isPast(event)).length,
    });
  }

  function refreshMarkers() {
    if (!state.map) return;
    const visible = visiblePlaces();
    state.markerLayer.clearLayers();
    visible.forEach((place) => {
      const marker = state.markers.get(place.id);
      marker.setIcon(pinIcon(place, place.id === state.selectedId));
      marker.setZIndexOffset(place.id === state.selectedId ? 1000 : 0);
      state.markerLayer.addLayer(marker);
    });
  }

  function refreshList() {
    const visible = visiblePlaces();
    els.count.textContent = `${visible.length} ${visible.length === 1 ? 'lugar' : 'lugares'}`;
    els.list.innerHTML = visible.length
      ? visible.map((place) => placeItemHtml(place, state.origin, place.id === state.selectedId)).join('')
      : `<div class="empty">${icon('search', 24)}<b>Sin resultados</b>Prueba con otro filtro o búsqueda.</div>`;
  }

  function refresh() {
    if (state.selectedId && !visiblePlaces().some(({ id }) => id === state.selectedId)) {
      state.selectedId = null;
      clearRoute();
    }
    refreshList();
    refreshMarkers();
    renderDetail();
  }

  function select(id) {
    const place = getPlace(id);
    if (!place) return;
    state.selectedId = id;
    clearRoute();
    refresh();
    state.map?.flyTo([place.lat, place.lng], Math.max(state.map.getZoom(), 16), { duration: 0.6 });
  }

  function clearSelection() {
    state.selectedId = null;
    clearRoute();
    refresh();
  }

  async function toggleRoute() {
    const place = getPlace(state.selectedId);
    if (!place || state.routing) return;

    if (state.route) {
      clearRoute();
      renderDetail();
      return;
    }

    state.routing = true;
    renderDetail();
    const route = await getWalkingRoute(state.origin, place);
    state.routing = false;
    if (state.selectedId !== place.id) return;

    state.route = route;
    state.routeLayer.clearLayers();
    const line = L.polyline(route.points, {
      color: '#FF7A45', weight: 6, opacity: 0.92, lineCap: 'round', lineJoin: 'round',
      dashArray: route.approximate ? '4 10' : null,
    });
    state.routeLayer.addLayer(line);
    state.map.fitBounds(line.getBounds(), {
      paddingTopLeft: [70, 70],
      paddingBottomRight: [70, els.detail.offsetHeight + 50],
      maxZoom: 17,
    });
    renderDetail();
    if (route.approximate) showToast('Sin conexión al servicio de rutas: mostramos una línea aproximada');
  }

  function setOrigin(origin) {
    state.origin = origin;
    state.originMarker.setLatLng([origin.lat, origin.lng]);
    state.originMarker.setIcon(originIcon(origin.live));
    state.originMarker.setTooltipContent(origin.live ? 'Tu ubicación' : origin.label);
    clearRoute();
    refresh();
  }

  async function locate() {
    els.locate.classList.add('loading');
    try {
      const position = await getCurrentPosition();
      if (distanceMeters(position, REFERENCE) > MAX_DISTANCE_FROM_COMMUNE_M) {
        setOrigin(REFERENCE);
        showToast('Estás lejos de la comuna: usamos un punto de referencia en Santa Cruz');
        return;
      }
      setOrigin({ ...position, label: 'Tu ubicación', live: true });
      state.map.flyTo([position.lat, position.lng], 16, { duration: 0.6 });
      showToast('Ubicación actualizada');
    } catch {
      showToast('No pudimos obtener tu ubicación. Usamos un punto de referencia en Santa Cruz');
    } finally {
      els.locate.classList.remove('loading');
    }
  }

  function createMap() {
    state.map = L.map(els.map, {
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      maxBounds: MAP_BOUNDS,
      maxBoundsViscosity: 0.7,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(state.map);
    L.tileLayer(MAP_CONFIG.tileUrl, {
      attribution: MAP_CONFIG.attribution, maxZoom: MAP_CONFIG.maxZoom,
    }).addTo(state.map);

    state.routeLayer = L.layerGroup().addTo(state.map);
    state.markerLayer = L.layerGroup().addTo(state.map);
    state.originMarker = L.marker([REFERENCE.lat, REFERENCE.lng], { icon: originIcon(false), interactive: true, keyboard: false })
      .bindTooltip(REFERENCE.label, { direction: 'top', offset: [0, -8] })
      .addTo(state.map);

    PLACES.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], { icon: pinIcon(place, false), title: place.name })
        .bindTooltip(place.name, { direction: 'top', offset: [0, -40] });
      marker.on('click', () => select(place.id));
      state.markers.set(place.id, marker);
    });

    state.map.on('click', clearSelection);
    state.map.fitBounds(L.latLngBounds(PLACES.map(({ lat, lng }) => [lat, lng])), { padding: [60, 60] });
    refresh();
  }

  function activate() {
    if (!state.map) createMap();
    requestAnimationFrame(() => state.map.invalidateSize());
    renderDetail();
  }

  els.list.addEventListener('click', (event) => {
    const item = event.target.closest('[data-place]');
    if (!item) return;
    select(item.dataset.place);
    if (window.matchMedia('(max-width: 960px)').matches) {
      $('.map-stage', section).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  els.detail.addEventListener('click', (event) => {
    if (event.target.closest('[data-close]')) clearSelection();
    if (event.target.closest('[data-route]')) toggleRoute();
  });
  bindEnrollment(els.detail);
  els.locate.addEventListener('click', locate);
  els.search.addEventListener('input', refresh);
  mountChipGroup($('#mapCategoryFilter', section), CATEGORY_OPTIONS, {
    onChange: (value) => {
      state.category = value;
      refresh();
    },
  });
  mountChipGroup($('#mapPriceFilter', section), PRICE_FILTERS, {
    onChange: (value) => {
      state.price = value;
      refresh();
    },
  });
  contentStore.subscribe(() => state.selectedId && renderDetail());

  screen.onShow = activate;
  refreshList();
}

export const screen = { id: 'mapa', label: 'Mapa', icon: icon('map'), nav: true, access: 'auth', mount };
