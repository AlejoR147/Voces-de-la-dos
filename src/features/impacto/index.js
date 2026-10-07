import './impacto.css';
import template from './impacto.html?raw';
import { $, escapeHtml } from '../../core/dom.js';
import { NEIGHBORHOODS } from '../../data/neighborhoods.js';
import { ROLES } from '../../config/constants.js';
import {
  INTEREST_SHARE, KPIS, ROLE_SPLIT, ROLE_SPLIT_NOTE,
  TOTAL_YOUTH, YOUTH_PER_PARTICIPATION_POINT,
} from '../../data/dashboard.js';
import { contentStore, getContent } from '../../state/contentStore.js';
import { eventStats, formatEventDate, isPast, publishedEvents } from '../../services/events.js';
import { formatNumber, formatPrice, isFree } from '../../utils/format.js';
import { showToast } from '../../shared/components/toast.js';
import { icon } from '../../shared/icons.js';

function kpiCard({ id, value, label, delta }) {
  const display = typeof value === 'number' ? formatNumber(value) : value;
  return `<div class="kpi"><div class="num"${id === 'youth' ? ' id="kpiJovenes"' : ''}>${display}</div><div class="lbl">${label}</div><div class="delta">${delta}</div></div>`;
}

function donut(segments, note = '') {
  let start = 0;
  const stops = segments.map(({ color, share }) => {
    const stop = `${color} ${start}% ${start + share}%`;
    start += share;
    return stop;
  });
  const legend = segments
    .map(({ label, share, color, detail = '' }) => (
      `<div><span class="dot" style="background:${color};"></span>${label} — ${share}%${detail ? ` ${detail}` : ''}</div>`
    ))
    .join('');
  return `<div class="donut" style="background:conic-gradient(${stops.join(', ')});"></div>
    <div class="legend">${legend}${note ? `<div class="note">${note}</div>` : ''}</div>`;
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
    <td><span class="status ${isFree(price) ? 'free' : 'paid'}">${formatPrice(price)}</span></td>
    <td><span class="status ${finished ? 'fin' : 'act'}">${finished ? 'Finalizado' : 'Activo'}</span></td>
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
    barChart.innerHTML = NEIGHBORHOODS.map(({ name }, index) => (
      `<div class="bar-col"><div class="bar${index === highlightIndex ? ' highlight' : ''}" style="height:0%"></div><small>${escapeHtml(name)}</small></div>`
    )).join('');
    requestAnimationFrame(() => {
      barChart.querySelectorAll('.bar').forEach((bar, index) => {
        bar.style.height = `${NEIGHBORHOODS[index].participation}%`;
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

  screen.onShow = () => renderBars(highlighted);
  contentStore.subscribe(renderLive);
  renderLive();
  renderBars();
}

export const screen = { id: 'impacto', label: 'Impacto', icon: icon('chart'), nav: true, access: [ROLES.ADMIN], mount };
