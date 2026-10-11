import './impacto.css';
import template from './impacto.html?raw';
import { $, escapeHtml } from '../../core/dom.js';
import { NEIGHBORHOODS } from '../../data/neighborhoods.js';
import { ROLES } from '../../config/constants.js';
import { appStore } from '../../state/appStore.js';
import {
  INTEREST_SHARE, KPIS, ROLE_SPLIT, ROLE_SPLIT_NOTE,
  TOTAL_YOUTH, YOUTH_PER_PARTICIPATION_POINT,
} from '../../data/dashboard.js';
import { contentStore, getContent } from '../../state/contentStore.js';
import { eventStats, formatEventDate, isPast, publishedEvents } from '../../services/events.js';
import { formatNumber, formatPrice, isFree } from '../../utils/format.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

const KPI_ICONS = { youth: 'users', activities: 'sparkles', events: 'calendar', attendance: 'check' };

// `onShow` se exporta en el literal `screen`: `mount` solo registra aquí su
// manejador, sin mutar el objeto exportado.
let handleShow = () => {};

function onShow() { handleShow(); }

function kpiCard({ id, value, label, delta }) {
  const display = typeof value === 'number' ? formatNumber(value) : value;
  return `<div class="kpi"><div class="kpi-top"><div class="num"${id === 'youth' ? ' id="kpiJovenes"' : ''}>${display}</div><span class="kpi-icon" aria-hidden="true">${icon(KPI_ICONS[id] ?? 'chart', 20)}</span></div><div class="lbl">${label}</div><div class="delta">${delta}</div></div>`;
}

function donut(segments, note = '') {
  let start = 0;
  // Colores, etiquetas y notas vienen de `dashboard.js` (estático): se escapan igual por convención.
  const stops = segments.map(({ color, share }) => {
    const stop = `${escapeHtml(color)} ${start}% ${start + share}%`;
    start += share;
    return stop;
  });
  const legend = segments
    .map(({ label, share, color, detail = '' }) => (
      `<div><span class="dot" style="background:${escapeHtml(color)};"></span>${escapeHtml(label)} — ${escapeHtml(share)}%${detail ? ` ${escapeHtml(detail)}` : ''}</div>`
    ))
    .join('');
  return `<div class="donut" style="background:conic-gradient(${stops.join(', ')});"></div>
    <div class="legend">${legend}${note ? `<div class="note">${escapeHtml(note)}</div>` : ''}</div>`;
}

function reportRows() {
  const content = getContent();
  return publishedEvents(content).reverse().map((event) => ({
    name: event.title,
    organizer: event.ownerName,
    barrio: event.barrio,
    date: formatEventDate(event.date),
    enrolled: eventStats(event, content).registered,
    price: event.price,
    finished: isPast(event),
  }));
}

function eventRow({ name, organizer, barrio, date, enrolled, price, finished }) {
  return `<tr>
    <td>${escapeHtml(name)}</td><td>${escapeHtml(organizer)}</td><td>${escapeHtml(barrio)}</td><td>${date}</td><td>${enrolled}</td>
    <td><span class="status status-${isFree(price) ? 'free' : 'paid'}">${formatPrice(price)}</span></td>
    <td><span class="status ${finished ? 'status-finished' : 'status-active'}">${finished ? 'Finalizado' : 'Activo'}</span></td>
  </tr>`;
}

function downloadReport() {
  const header = ['Evento', 'Organiza', 'Barrio', 'Fecha', 'Inscritos', 'Precio', 'Estado'];
  const rows = reportRows().map(({ name, organizer, barrio, date, enrolled, price, finished }) => (
    [name, organizer, barrio, date, enrolled, formatPrice(price), finished ? 'Finalizado' : 'Activo']
  ));
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'reporte-santa-cruz-vive-digital.csv' });
  link.click();
  URL.revokeObjectURL(url);
  showToast('Reporte descargado ✓');
}

function mount(section) {
  section.innerHTML = template;

  const barChart = $('#barChart', section);
  const barrioFilter = $('#barrioFilter', section);
  const exportBtn = $('#exportBtn', section);

  exportBtn.innerHTML = `${icon('download', 16)} Exportar reporte`;
  $('#roleDonut', section).innerHTML = donut(ROLE_SPLIT, ROLE_SPLIT_NOTE);
  $('#interestDonut', section).innerHTML = donut(INTEREST_SHARE);

  function renderLive() {
    // Misma guarda que Moderación: sin sesión de admin no se pintan KPIs ni el reporte.
    if (appStore.getState().user?.role !== ROLES.ADMIN) {
      $('#kpiGrid', section).innerHTML = '';
      $('#eventsTableBody', section).innerHTML = '';
      return;
    }
    const content = getContent();
    const activeEvents = publishedEvents(content).filter((event) => !isPast(event)).length;
    $('#kpiGrid', section).innerHTML = KPIS
      .map((kpiData) => (kpiData.id === 'events' ? { ...kpiData, value: activeEvents } : kpiData))
      .map(kpiCard)
      .join('');
    $('#eventsTableBody', section).innerHTML = reportRows().map(eventRow).join('');
  }

  barrioFilter.innerHTML = '<option value="todos">Todos los barrios</option>'
    + NEIGHBORHOODS.map(({ name }, index) => `<option value="${index}">${escapeHtml(name)}</option>`).join('');

  let highlighted;

  function renderBars(highlightIndex) {
    highlighted = highlightIndex;
    const max = Math.max(...NEIGHBORHOODS.map(({ participation }) => participation), 1);
    barChart.innerHTML = NEIGHBORHOODS.map(({ name, participation }, index) => {
      const youth = formatNumber(Math.round(participation * YOUTH_PER_PARTICIPATION_POINT));
      const tip = `${name} — ${participation}% · ~${youth} jóvenes`;
      return `<div class="bar-row${index === highlightIndex ? ' highlight' : ''}" data-tip="${escapeHtml(tip)}" title="${escapeHtml(tip)}" tabindex="0" role="img" aria-label="${escapeHtml(tip)}">`
        + `<span class="bar-name">${escapeHtml(name)}</span>`
        + `<div class="bar-track"><div class="bar-fill" style="width:0%"></div></div>`
        + `<span class="bar-meta"><b>${participation}%</b><small>~${youth}</small></span></div>`;
    }).join('');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        barChart.querySelectorAll('.bar-fill').forEach((fill, index) => {
          fill.style.width = `${(NEIGHBORHOODS[index].participation / max) * 100}%`;
        });
      });
    });
  }

  barrioFilter.addEventListener('change', () => {
    const kpi = $('#kpiJovenes', section);
    if (barrioFilter.value === 'todos') {
      renderBars();
      kpi.textContent = formatNumber(TOTAL_YOUTH);
      return;
    }
    const index = Number(barrioFilter.value);
    renderBars(index);
    kpi.textContent = formatNumber(Math.round(NEIGHBORHOODS[index].participation * YOUTH_PER_PARTICIPATION_POINT));
  });
  exportBtn.addEventListener('click', downloadReport);

  handleShow = () => renderBars(highlighted);
  // Limpia lo pintado al cerrar sesión: el DOM de la pantalla persiste tras el logout.
  appStore.subscribe(renderLive);
  contentStore.subscribe(renderLive);
  renderLive();
  renderBars();
}

export const screen = { id: 'impacto', label: 'Impacto', icon: icon('chart'), nav: true, access: [ROLES.ADMIN], mount, onShow };
