/* ============================================================
   UNIMAGDALENA · Informe Saber Pro — app.js
   Implementación completa de la Etapa 5: Visualizaciones e Interactividad.
   ============================================================ */

const NUM = new Intl.NumberFormat('es-CO');
const SVG_NS = 'http://www.w3.org/2000/svg';

// Colores de la identidad visual institucional
const COLOR_UM = '#0183EF';
const COLOR_REF = '#FF9400';
const COLOR_POS = '#00A50B';
const COLOR_NEG = '#D10500';
const COLOR_PRIMARY = '#004A87';

let tooltipEl = null;

// Inicialización
async function init() {
  let d;
  try {
    const res = await fetch('data/datos_informe.json');
    d = await res.json();
  } catch (e) {
    document.getElementById('kpiGrid').innerHTML =
      '<div class="placeholder">No se pudo cargar datos_informe.json.<br>Verifica que el archivo esté en la carpeta data/.</div>';
    return;
  }

  // Elemento flotante único para tooltips
  initTooltip();

  // Renderizadores principales
  renderMeta(d);
  renderHero(d);
  renderKPIs(d);
  setLeads(d);
  initNavDrawer();
  initScrollSpy();

  // Renderizadores de Gráficos (Etapa 5)
  renderRadar(d);
  renderEvolLine(d);
  renderSueRanking(d);
  renderDeptRanking(d);
  renderCuadrantes(d);
  renderTrayectoria(d);
  renderFacultades(d);
  renderProgramExplorer(d);
  renderTop10(d);
  renderNivelesInstitucional(d);
  renderHeatmapAndDofa(d);
}

/* ---------- Tooltip Dinámico ---------- */
function initTooltip() {
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'chart-tooltip';
  document.body.appendChild(tooltipEl);
}

function showTooltip(e, html) {
  if (!tooltipEl) return;
  tooltipEl.innerHTML = html;
  tooltipEl.style.display = 'block';
  moveTooltip(e);
}

function moveTooltip(e) {
  if (!tooltipEl) return;
  tooltipEl.style.left = (e.pageX + 15) + 'px';
  tooltipEl.style.top = (e.pageY - 15) + 'px';
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.display = 'none';
}

/* ---------- Utilidades SVG ---------- */
function createSVGEl(type, attrs = {}) {
  const el = document.createElementNS(SVG_NS, type);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

/* ---------- Meta (pie de barra lateral) ---------- */
function renderMeta(d) {
  const yr = d.meta?.anio_vigente ?? '—';
  document.getElementById('footYear').textContent = yr;
  const gen = d.meta?.fecha_generacion ? new Date(d.meta.fecha_generacion) : null;
  if (gen) {
    document.getElementById('footGen').textContent =
      'Generado: ' + gen.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

/* ---------- Hero ---------- */
function renderHero(d) {
  const g = d.institucional?.global;
  if (!g) return;
  const diff = g.puntaje_unimag - g.puntaje_nacional;
  const rel = diff > 0 ? `${diff} puntos sobre el promedio nacional` : diff < 0 ? `${Math.abs(diff)} puntos por debajo del promedio nacional` : 'al nivel del promedio nacional';
  document.getElementById('heroSub').textContent =
    `Resultados ${d.meta.anio_vigente}: ${g.puntaje_unimag} puntos globales, ${rel}. Una lectura ejecutiva del desempeño, el valor agregado y la evolución de sus programas.`;

  const um = (d.sue_ranking || []).find(r => r.es_unimagdalena);
  const progs = d.programas || [];
  const sobre = progs.filter(p => p.global_2025 > p.global_nbc_nacional_2025).length;
  const pct = progs.length ? Math.round(100 * sobre / progs.length) : 0;

  set('heroScore', g.puntaje_unimag);
  set('heroRank', um ? `${um.rank}.º` : '—');
  set('heroPrograms', progs.length ? `${pct}%` : '—');
}

/* ---------- KPIs (G1) ---------- */
function renderKPIs(d) {
  const g = d.institucional.global;
  const hist = d.institucional.historico;
  const prev = hist.length > 1 ? hist[hist.length - 2] : null;
  const deltaGlobal = prev ? g.puntaje_unimag - prev.puntaje_unimag : null;

  const um = (d.sue_ranking || []).find(r => r.es_unimagdalena);
  const totalSue = (d.sue_ranking || []).length;

  const progs = d.programas || [];
  const sobre = progs.filter(p => p.global_2025 > p.global_nbc_nacional_2025).length;
  const pct = progs.length ? Math.round(100 * sobre / progs.length) : 0;

  const ICON_TROPHY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M5 4H3v3a3 3 0 0 0 3 3M19 4h2v3a3 3 0 0 1-3 3M12 15v3M9 21h6M9 21v-1a3 3 0 0 1 3-2 3 3 0 0 1 3 2v1"/></svg>`;
  const ICON_TARGET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
  const ICON_USERS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;

  const kpis = [
    {
      tone: 'brand',
      icon: ICON_TROPHY,
      tag: 'Desempeño',
      value: g.puntaje_unimag,
      label: `Puntaje global ${d.meta.anio_vigente}`
    },
    {
      tone: 'pos',
      icon: ICON_TARGET,
      tag: 'Posicionamiento',
      value: `${pct}%`,
      label: 'Programas sobre el promedio de su NBC',
      sublabel: `${sobre} de ${progs.length} programas`
    },
    {
      tone: 'ref',
      icon: ICON_USERS,
      tag: 'Cobertura',
      value: NUM.format(g.n_unimag),
      label: `Estudiantes evaluados en ${d.meta.anio_vigente}`
    }
  ];

  document.getElementById('kpiGrid').innerHTML = kpis.map(k => {
    const subHtml = k.sublabel ? `<div class="kpi__sublabel">${k.sublabel}</div>` : '';
    return `<article class="kpi kpi--${k.tone}">
      <header class="kpi__head">
        <span class="kpi__icon" aria-hidden="true">${k.icon}</span>
        <span class="kpi__tag">${k.tag}</span>
      </header>
      <div class="kpi__value">${k.value}</div>
      <div class="kpi__label">${k.label}</div>
      ${subHtml}
    </article>`;
  }).join('');
}

/* ---------- Textos Guía (Leads) ---------- */
function setLeads(d) {
  const g = d.institucional.global;
  const um = (d.sue_ranking || []).find(r => r.es_unimagdalena);
  const progs = d.programas || [];
  const sobre = progs.filter(p => p.global_2025 > p.global_nbc_nacional_2025).length;

  set('leadPanorama', `La universidad alcanzó ${g.puntaje_unimag} puntos globales frente a ${g.puntaje_nacional} del país. Aquí se detalla su perfil por competencia y su evolución 2020–${d.meta.anio_vigente}.`);
  set('leadPos', um ? `UNIMAGDALENA ocupa la posición ${um.rank} entre las ${d.sue_ranking.length} universidades del SUE evaluadas. Liderando la oferta regional junto a los pares del Caribe.` : '');
  set('leadVA', `Cruzando el perfil de ingreso (Saber 11) con el de egreso (Saber Pro), se observa cuánto aporta la formación. Datos disponibles hasta 2024.`);
  set('leadFac', `Comparativo del desempeño global de las ${d.facultades.length} facultades de la universidad.`);
  set('leadProg', `${sobre} de los ${progs.length} programas evaluados superan el promedio nacional de su grupo de referencia (NBC).`);
  set('leadComp', `Competencias genéricas fuertes y distribución porcentual por niveles de logro frente al país.`);
  set('leadSint', `Lectura integrada de fortalezas, brechas y recomendaciones estratégicas a partir de los resultados.`);
}
function set(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }


/* ============================================================
   IMPLEMENTACIÓN DE GRÁFICOS (Etapa 5)
   ============================================================ */

/* ---------- G2: Radar de competencias ---------- */
function renderRadar(d) {
  const container = document.getElementById('chartRadar');
  if (!container) return;

  const comps = d.institucional.competencias;
  if (!comps || comps.length === 0) return;

  const w = 400;
  const h = 300;
  const cx = w / 2;
  const cy = h / 2;
  const rMax = 90;
  const totalAxes = comps.length;

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  // Niveles del fondo (5 círculos/polígonos concéntricos)
  const steps = 4;
  for (let i = 1; i <= steps; i++) {
    const ratio = i / steps;
    const rCurrent = rMax * ratio;
    const pts = [];
    for (let a = 0; a < totalAxes; a++) {
      const angle = a * (2 * Math.PI / totalAxes) - Math.PI / 2;
      pts.push(`${cx + rCurrent * Math.cos(angle)},${cy + rCurrent * Math.sin(angle)}`);
    }
    const polygon = createSVGEl('polygon', {
      points: pts.join(' '),
      fill: 'none',
      stroke: 'var(--border)',
      'stroke-width': '0.7',
      'stroke-dasharray': '3,3'
    });
    svg.appendChild(polygon);

    // Escribir texto de los niveles
    const valueLabel = Math.round(200 * ratio);
    const textAngle = -Math.PI / 2;
    const text = createSVGEl('text', {
      x: cx + rCurrent * Math.cos(textAngle) + 4,
      y: cy + rCurrent * Math.sin(textAngle) - 2,
      class: 'axis-label',
      style: 'font-size: 8px; fill: var(--text-soft); opacity: 0.8;'
    });
    text.textContent = valueLabel;
    svg.appendChild(text);
  }

  // Dibujar los ejes y etiquetas de competencias
  const labelPositions = [
    { dx: 0, dy: -12 },   // Arriba
    { dx: 12, dy: -4 },   // Derecha-Arriba
    { dx: 5, dy: 15 },    // Derecha-Abajo
    { dx: -5, dy: 15 },   // Izquierda-Abajo
    { dx: -12, dy: -4 }   // Izquierda-Arriba
  ];

  const axesPts = [];
  for (let a = 0; a < totalAxes; a++) {
    const angle = a * (2 * Math.PI / totalAxes) - Math.PI / 2;
    const targetX = cx + rMax * Math.cos(angle);
    const targetY = cy + rMax * Math.sin(angle);
    axesPts.push({ x: targetX, y: targetY });

    // Eje line
    const axis = createSVGEl('line', {
      x1: cx, y1: cy,
      x2: targetX, y2: targetY,
      stroke: 'var(--border)',
      'stroke-width': '0.8'
    });
    svg.appendChild(axis);

    // Etiqueta del eje
    const textX = cx + (rMax + 12) * Math.cos(angle);
    const textY = cy + (rMax + 12) * Math.sin(angle);
    
    // Simplificar nombres largos para legibilidad
    let label = comps[a].competencia;
    if (label === 'RAZONAMIENTO CUANTITATIVO') label = 'Raz. Cuantitativo';
    if (label === 'COMPETENCIAS CIUDADANAS') label = 'Ciudadanas';
    if (label === 'COMUNICACIÓN ESCRITA') label = 'Com. Escrita';
    if (label === 'LECTURA CRÍTICA') label = 'Lectura Crítica';
    if (label === 'INGLÉS') label = 'Inglés';

    const text = createSVGEl('text', {
      x: textX,
      y: textY + 3,
      'text-anchor': Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end',
      class: 'axis-label',
      style: 'font-weight: 600; font-size: 9px; fill: var(--brand-primary-dark);'
    });
    text.textContent = label;
    svg.appendChild(text);
  }

  // Polígonos de Datos (UNIMAGDALENA vs País)
  const scoreToRadius = (score) => (Math.min(Math.max(score, 0), 200) / 200) * rMax;

  const ptsUM = [];
  const ptsNat = [];

  for (let a = 0; a < totalAxes; a++) {
    const angle = a * (2 * Math.PI / totalAxes) - Math.PI / 2;
    const rUM = scoreToRadius(comps[a].puntaje_unimag);
    const rNat = scoreToRadius(comps[a].puntaje_nacional);

    ptsUM.push(`${cx + rUM * Math.cos(angle)},${cy + rUM * Math.sin(angle)}`);
    ptsNat.push(`${cx + rNat * Math.cos(angle)},${cy + rNat * Math.sin(angle)}`);
  }

  // Polígono Nacional (Naranja)
  const polyNat = createSVGEl('polygon', {
    points: ptsNat.join(' '),
    fill: COLOR_REF,
    'fill-opacity': '0.12',
    stroke: COLOR_REF,
    'stroke-width': '2',
    class: 'chart-poly'
  });
  svg.appendChild(polyNat);

  // Polígono UNIMAGDALENA (Azul)
  const polyUM = createSVGEl('polygon', {
    points: ptsUM.join(' '),
    fill: COLOR_UM,
    'fill-opacity': '0.24',
    stroke: COLOR_UM,
    'stroke-width': '2.5',
    class: 'chart-poly'
  });
  svg.appendChild(polyUM);

  // Puntos interactivos
  const drawDots = (pts, dataKey, color, name) => {
    for (let a = 0; a < totalAxes; a++) {
      const angle = a * (2 * Math.PI / totalAxes) - Math.PI / 2;
      const score = comps[a][dataKey];
      const r = scoreToRadius(score);
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);

      const dot = createSVGEl('circle', {
        cx: px, cy: py, r: 4.5,
        fill: color,
        class: 'chart-dot'
      });

      dot.addEventListener('mouseenter', (e) => {
        showTooltip(e, `<strong>${name}</strong>${comps[a].competencia}: ${score} pts`);
      });
      dot.addEventListener('mousemove', moveTooltip);
      dot.addEventListener('mouseleave', hideTooltip);

      svg.appendChild(dot);
    }
  };

  drawDots(ptsNat, 'puntaje_nacional', COLOR_REF, 'Promedio Nacional');
  drawDots(ptsUM, 'puntaje_unimag', COLOR_UM, 'UNIMAGDALENA');

  // Leyenda
  const legend = createLegend([
    { color: COLOR_UM, text: 'UNIMAGDALENA' },
    { color: COLOR_REF, text: 'Nacional' }
  ], cx - 110, h - 20);
  svg.appendChild(legend);

  container.innerHTML = '';
  container.appendChild(svg);
}

// Leyendas dinámicas para SVGs
function createLegend(items, startX, startY) {
  const g = createSVGEl('g', { class: 'legend' });
  items.forEach((item, idx) => {
    const x = startX + idx * 110;
    const rect = createSVGEl('rect', {
      x: x, y: startY - 8, width: 14, height: 8, rx: 2,
      fill: item.color
    });
    const text = createSVGEl('text', {
      x: x + 20, y: startY - 1,
      class: 'axis-label',
      style: 'font-size: 9px; font-weight: 600;'
    });
    text.textContent = item.text;
    g.appendChild(rect);
    g.appendChild(text);
  });
  return g;
}

/* ---------- G3: Evolución histórica lineal ---------- */
function renderEvolLine(d) {
  const container = document.getElementById('chartEvol');
  if (!container) return;

  const hist = d.institucional.historico;
  if (!hist || hist.length === 0) return;

  const w = 400;
  const h = 300;
  const margin = { top: 30, right: 20, bottom: 45, left: 45 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const years = hist.map(h => h.anio);
  const minVal = 135;
  const maxVal = 155;

  const getX = (idx) => margin.left + (idx / (years.length - 1)) * (w - margin.left - margin.right);
  const getY = (val) => h - margin.bottom - ((val - minVal) / (maxVal - minVal)) * (h - margin.top - margin.bottom);

  // Líneas de rejilla Y
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = minVal + (i / yTicks) * (maxVal - minVal);
    const y = getY(val);

    const line = createSVGEl('line', {
      x1: margin.left, y1: y,
      x2: w - margin.right, y2: y,
      class: 'grid-line'
    });
    const label = createSVGEl('text', {
      x: margin.left - 8, y: y + 4,
      'text-anchor': 'end',
      class: 'axis-label'
    });
    label.textContent = Math.round(val);

    svg.appendChild(line);
    svg.appendChild(label);
  }

  // Eje X marcas
  years.forEach((yr, idx) => {
    const x = getX(idx);
    const label = createSVGEl('text', {
      x: x, y: h - margin.bottom + 18,
      'text-anchor': 'middle',
      class: 'axis-label',
      style: 'font-weight: 600;'
    });
    label.textContent = yr;
    svg.appendChild(label);

    const tick = createSVGEl('line', {
      x1: x, y1: h - margin.bottom,
      x2: x, y2: h - margin.bottom + 4,
      stroke: 'var(--border)'
    });
    svg.appendChild(tick);
  });

  // Construir caminos
  let dPathUM = '';
  let dPathNat = '';

  hist.forEach((pt, idx) => {
    const x = getX(idx);
    const yUM = getY(pt.puntaje_unimag);
    const yNat = getY(pt.puntaje_nacional);

    dPathUM += `${idx === 0 ? 'M' : 'L'} ${x} ${yUM} `;
    dPathNat += `${idx === 0 ? 'M' : 'L'} ${x} ${yNat} `;
  });

  // Dibujar caminos
  const pathNat = createSVGEl('path', {
    d: dPathNat,
    stroke: COLOR_REF,
    class: 'chart-line',
    style: 'stroke-width: 2.5; stroke-dasharray: 2,2; opacity: 0.85;'
  });
  const pathUM = createSVGEl('path', {
    d: dPathUM,
    stroke: COLOR_UM,
    class: 'chart-line',
    style: 'stroke-width: 3.5;'
  });

  svg.appendChild(pathNat);
  svg.appendChild(pathUM);

  // Dibujar círculos y tooltips
  const drawDots = (dataKey, color, name) => {
    hist.forEach((pt, idx) => {
      const x = getX(idx);
      const val = pt[dataKey];
      const y = getY(val);

      const circle = createSVGEl('circle', {
        cx: x, cy: y, r: 5,
        fill: color,
        class: 'chart-dot'
      });

      circle.addEventListener('mouseenter', (e) => {
        showTooltip(e, `<strong>${name} (${pt.anio})</strong>Puntaje: ${val} pts${dataKey === 'puntaje_unimag' && pt.n_unimag ? `<br>Evaluados: ${NUM.format(pt.n_unimag)}` : ''}`);
      });
      circle.addEventListener('mousemove', moveTooltip);
      circle.addEventListener('mouseleave', hideTooltip);

      svg.appendChild(circle);
    });
  };

  drawDots('puntaje_nacional', COLOR_REF, 'Promedio Nacional');
  drawDots('puntaje_unimag', COLOR_UM, 'UNIMAGDALENA');

  // Leyenda
  const legend = createLegend([
    { color: COLOR_UM, text: 'UNIMAGDALENA' },
    { color: COLOR_REF, text: 'Nacional' }
  ], margin.left + 50, margin.top - 12);
  svg.appendChild(legend);

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G4: Ranking SUE ---------- */
function renderSueRanking(d) {
  const container = document.getElementById('chartSue');
  if (!container) return;

  const data = d.sue_ranking;
  if (!data || data.length === 0) return;

  const w = 600;
  const h = 480;
  const margin = { top: 20, right: 60, bottom: 20, left: 180 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const totalBars = data.length;
  const barHeight = (h - margin.top - margin.bottom) / totalBars;
  const minVal = 110;
  const maxVal = 175;

  const getWidth = (val) => ((val - minVal) / (maxVal - minVal)) * (w - margin.left - margin.right);

  // Líneas verticales de referencia
  const xTicks = 4;
  for (let i = 0; i <= xTicks; i++) {
    const val = minVal + (i / xTicks) * (maxVal - minVal);
    const x = margin.left + getWidth(val);

    const line = createSVGEl('line', {
      x1: x, y1: margin.top,
      x2: x, y2: h - margin.bottom,
      class: 'grid-line'
    });
    const label = createSVGEl('text', {
      x: x, y: h - margin.bottom + 12,
      'text-anchor': 'middle',
      class: 'axis-label',
      style: 'font-size: 8px;'
    });
    label.textContent = Math.round(val);

    svg.appendChild(line);
    svg.appendChild(label);
  }

  // Dibujar barras horizontales
  data.forEach((univ, idx) => {
    const y = margin.top + idx * barHeight;
    const barW = getWidth(univ.puntaje);

    let color = '#DCE5EE'; // Gris por defecto
    let textWeight = '400';
    if (univ.es_unimagdalena) {
      color = COLOR_PRIMARY; // destacado unimagdalena
      textWeight = '700';
    } else if (univ.es_caribe) {
      color = '#87add6'; // Caribe
      textWeight = '600';
    }

    const rect = createSVGEl('rect', {
      x: margin.left, y: y + 2,
      width: Math.max(barW, 2), height: barHeight - 4,
      fill: color,
      rx: 3,
      class: 'chart-bar'
    });

    const nameText = createSVGEl('text', {
      x: margin.left - 8, y: y + barHeight / 2 + 3,
      'text-anchor': 'end',
      class: 'axis-label',
      style: `font-size: 8px; font-weight: ${textWeight}; fill: var(--text);`
    });
    // Truncar nombres muy largos
    let cleanName = univ.nombre;
    if (cleanName.length > 30) cleanName = cleanName.substring(0, 28) + '...';
    nameText.textContent = `${univ.rank}. ${cleanName}`;

    const scoreText = createSVGEl('text', {
      x: margin.left + barW + 6, y: y + barHeight / 2 + 3,
      class: 'axis-label',
      style: `font-size: 9px; font-weight: 700; fill: ${univ.es_unimagdalena ? COLOR_PRIMARY : 'var(--text-soft)'};`
    });
    scoreText.textContent = univ.puntaje.toFixed(1);

    // Eventos interactivos
    rect.addEventListener('mouseenter', (e) => {
      showTooltip(e, `<strong>${univ.nombre}</strong>Posición: ${univ.rank} de ${totalBars}<br>Puntaje: ${univ.puntaje} pts<br>Evaluados: ${NUM.format(univ.n)}`);
    });
    rect.addEventListener('mousemove', moveTooltip);
    rect.addEventListener('mouseleave', hideTooltip);

    svg.appendChild(rect);
    svg.appendChild(nameText);
    svg.appendChild(scoreText);
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G5: Comparativo departamental ---------- */
function renderDeptRanking(d) {
  const container = document.getElementById('chartDept');
  if (!container) return;

  const data = d.departamento;
  if (!data || data.length === 0) return;

  // Filtrar top 15 departamentos por rendimiento
  const topData = data.slice(0, 16);

  const w = 400;
  const h = 300;
  const margin = { top: 20, right: 40, bottom: 20, left: 100 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const totalBars = topData.length;
  const barHeight = (h - margin.top - margin.bottom) / totalBars;
  const minVal = 110;
  const maxVal = 165;

  const getWidth = (val) => ((val - minVal) / (maxVal - minVal)) * (w - margin.left - margin.right);

  // Dibujar barras
  topData.forEach((dept, idx) => {
    const y = margin.top + idx * barHeight;
    const barW = getWidth(dept.puntaje);

    let color = '#DCE5EE';
    let textWeight = '400';
    if (dept.es_magdalena) {
      color = COLOR_UM;
      textWeight = '700';
    } else if (dept.es_caribe) {
      color = '#87add6';
      textWeight = '600';
    }

    const rect = createSVGEl('rect', {
      x: margin.left, y: y + 1.5,
      width: Math.max(barW, 2), height: barHeight - 3,
      fill: color,
      rx: 2,
      class: 'chart-bar'
    });

    const nameText = createSVGEl('text', {
      x: margin.left - 6, y: y + barHeight / 2 + 3,
      'text-anchor': 'end',
      class: 'axis-label',
      style: `font-size: 8px; font-weight: ${textWeight}; text-transform: capitalize;`
    });
    nameText.textContent = dept.departamento.toLowerCase();

    const scoreText = createSVGEl('text', {
      x: margin.left + barW + 5, y: y + barHeight / 2 + 3,
      class: 'axis-label',
      style: `font-size: 8px; font-weight: 700; fill: var(--text);`
    });
    scoreText.textContent = dept.puntaje.toFixed(1);

    rect.addEventListener('mouseenter', (e) => {
      showTooltip(e, `<strong>Dpto. ${dept.departamento}</strong>Puntaje: ${dept.puntaje} pts<br>Evaluados en el departamento: ${NUM.format(dept.n)}`);
    });
    rect.addEventListener('mousemove', moveTooltip);
    rect.addEventListener('mouseleave', hideTooltip);

    svg.appendChild(rect);
    svg.appendChild(nameText);
    svg.appendChild(scoreText);
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G6: Cuadrantes de Valor Agregado ---------- */
let activeYearCuadrante = '2024';

function renderCuadrantes(d) {
  const select = document.getElementById('selAnioCuadrante');
  const container = document.getElementById('chartCuadrantes');
  if (!container) return;

  const dataYearKeys = Object.keys(d.cuadrantes_por_anio || {}).filter(yr => yr >= '2020' && yr <= '2024');
  if (dataYearKeys.length === 0) return;

  // Poblar selector de año
  if (select && select.children.length === 0) {
    dataYearKeys.forEach(yr => {
      const opt = document.createElement('option');
      opt.value = yr;
      opt.textContent = yr;
      if (yr === activeYearCuadrante) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      activeYearCuadrante = e.target.value;
      drawCuadrantePlot(d);
    });
  }

  drawCuadrantePlot(d);
}

function drawCuadrantePlot(d) {
  const container = document.getElementById('chartCuadrantes');
  const yrData = d.cuadrantes_por_anio[activeYearCuadrante];
  if (!yrData) return;

  const w = 500;
  const h = 360;
  const margin = { top: 30, right: 30, bottom: 45, left: 45 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  // Coordenadas fijas razonables de la escala nacional
  const xMin = 210, xMax = 370;
  const yMin = 110, yMax = 190;

  const getX = (val) => margin.left + ((val - xMin) / (xMax - xMin)) * (w - margin.left - margin.right);
  const getY = (val) => h - margin.bottom - ((val - yMin) / (yMax - yMin)) * (h - margin.top - margin.bottom);

  const xLimitVal = yrData.limites.x_mean;
  const yLimitVal = yrData.limites.y_mean;
  const xLimit = getX(xLimitVal);
  const yLimit = getY(yLimitVal);

  // 1. Fondos coloreados para los cuadrantes
  // Alto Aporte (Arriba-Izquierda): entrada baja, salida alta -> verde suave
  const rectAporte = createSVGEl('rect', {
    x: margin.left, y: margin.top,
    width: xLimit - margin.left, height: yLimit - margin.top,
    fill: 'rgba(0, 165, 11, 0.04)',
    class: 'quadrant-bg'
  });
  svg.appendChild(rectAporte);

  // Alto Desempeño (Arriba-Derecha): entrada alta, salida alta -> azul suave
  const rectDesempeno = createSVGEl('rect', {
    x: xLimit, y: margin.top,
    width: w - margin.right - xLimit, height: yLimit - margin.top,
    fill: 'rgba(1, 131, 239, 0.03)',
    class: 'quadrant-bg'
  });
  svg.appendChild(rectDesempeno);

  // Alerta (Abajo-Derecha): entrada alta, salida baja -> rojo suave
  const rectAlerta = createSVGEl('rect', {
    x: xLimit, y: yLimit,
    width: w - margin.right - xLimit, height: h - margin.bottom - yLimit,
    fill: 'rgba(209, 5, 0, 0.04)',
    class: 'quadrant-bg'
  });
  svg.appendChild(rectAlerta);

  // 2. Líneas cruzadas de la media
  const mediaX = createSVGEl('line', {
    x1: xLimit, y1: margin.top,
    x2: xLimit, y2: h - margin.bottom,
    stroke: 'var(--text-soft)',
    'stroke-width': '1.5',
    'stroke-dasharray': '2,2'
  });
  const mediaY = createSVGEl('line', {
    x1: margin.left, y1: yLimit,
    x2: w - margin.right, y2: yLimit,
    stroke: 'var(--text-soft)',
    'stroke-width': '1.5',
    'stroke-dasharray': '2,2'
  });
  svg.appendChild(mediaX);
  svg.appendChild(mediaY);

  // Etiquetas de los cuadrantes
  const addQuadLabel = (txt, x, y, anchor, color) => {
    const label = createSVGEl('text', {
      x: x, y: y, 'text-anchor': anchor,
      class: 'axis-label',
      style: `font-size: 8px; font-weight: 700; fill: ${color}; opacity: 0.8; letter-spacing: 0.05em;`
    });
    label.textContent = txt;
    svg.appendChild(label);
  };

  addQuadLabel('ALTO APORTE', margin.left + 10, margin.top + 15, 'start', COLOR_POS);
  addQuadLabel('ALTO DESEMPEÑO', w - margin.right - 10, margin.top + 15, 'end', COLOR_UM);
  addQuadLabel('BASE BAJA', margin.left + 10, h - margin.bottom - 10, 'start', 'var(--text-faint)');
  addQuadLabel('ALERTA', w - margin.right - 10, h - margin.bottom - 10, 'end', COLOR_NEG);

  // 3. Ejes y etiquetas
  const lineX = createSVGEl('line', {
    x1: margin.left, y1: h - margin.bottom,
    x2: w - margin.right, y2: h - margin.bottom,
    class: 'axis-line'
  });
  const lineY = createSVGEl('line', {
    x1: margin.left, y1: margin.top,
    x2: margin.left, y2: h - margin.bottom,
    class: 'axis-line'
  });
  svg.appendChild(lineX);
  svg.appendChild(lineY);

  // Nombre de los ejes
  const labelX = createSVGEl('text', {
    x: w / 2 + 10, y: h - 10, 'text-anchor': 'middle',
    class: 'axis-label', style: 'font-weight: 600;'
  });
  labelX.textContent = 'Saber 11 (Perfil de Entrada)';
  svg.appendChild(labelX);

  const labelY = createSVGEl('text', {
    x: 12, y: h / 2, 'text-anchor': 'middle',
    class: 'axis-label', style: 'font-weight: 600;',
    transform: `rotate(-90 12 ${h/2})`
  });
  labelY.textContent = 'Saber Pro (Desempeño de Salida)';
  svg.appendChild(labelY);

  // Marcas de los ejes (marcas simplificadas)
  [220, 260, 300, 340].forEach(val => {
    const x = getX(val);
    const text = createSVGEl('text', { x: x, y: h - margin.bottom + 14, 'text-anchor': 'middle', class: 'axis-label' });
    text.textContent = val;
    svg.appendChild(text);
  });
  [120, 140, 160, 180].forEach(val => {
    const y = getY(val);
    const text = createSVGEl('text', { x: margin.left - 6, y: y + 4, 'text-anchor': 'end', class: 'axis-label' });
    text.textContent = val;
    svg.appendChild(text);
  });

  // 4. Dibujar puntos de otras universidades (IES) en gris transparente
  const filterIES = yrData.instituciones.filter(ies => ies.nombre !== 'UNIVERSIDAD DEL MAGDALENA');
  filterIES.forEach(ies => {
    const circle = createSVGEl('circle', {
      cx: getX(ies.sb11), cy: getY(ies.sbpro), r: 3.5,
      fill: 'var(--text-faint)', 'fill-opacity': '0.3',
      stroke: 'var(--border)', 'stroke-width': '0.5'
    });

    circle.addEventListener('mouseenter', (e) => {
      showTooltip(e, `<strong>${ies.nombre}</strong>Saber 11: ${ies.sb11}<br>Saber Pro: ${ies.sbpro}<br>N: ${NUM.format(ies.n)}<br>Cuadrante: ${ies.cuadrante}`);
    });
    circle.addEventListener('mousemove', moveTooltip);
    circle.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(circle);
  });

  // 5. Dibujar los NBCs de UNIMAGDALENA como triángulos/puntos destacados
  yrData.nbcs_unimag.forEach(nbc => {
    const nbcX = getX(nbc.sb11);
    const nbcY = getY(nbc.sbpro);

    const point = createSVGEl('circle', {
      cx: nbcX, cy: nbcY, r: 6.5,
      fill: COLOR_REF,
      stroke: '#fff', 'stroke-width': '1.2',
      class: 'chart-dot'
    });

    point.addEventListener('mouseenter', (e) => {
      showTooltip(e, `<strong>NBC: ${nbc.nbc}</strong>Saber 11 (Entrada): ${nbc.sb11} pts<br>Saber Pro (Salida): ${nbc.sbpro} pts<br>Muestra emparejada: ${NUM.format(nbc.n)} alumnos<br>Cuadrante: ${nbc.cuadrante}`);
    });
    point.addEventListener('mousemove', moveTooltip);
    point.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(point);
  });

  // 6. Dibujar el punto global institucional de UNIMAGDALENA en azul destacado
  const umGlobal = yrData.instituciones.find(ies => ies.nombre === 'UNIVERSIDAD DEL MAGDALENA');
  if (umGlobal) {
    const umX = getX(umGlobal.sb11);
    const umY = getY(umGlobal.sbpro);

    const star = createSVGEl('circle', {
      cx: umX, cy: umY, r: 10,
      fill: COLOR_UM,
      stroke: '#ffffff', 'stroke-width': '2.5',
      class: 'chart-dot',
      style: 'filter: drop-shadow(0 2px 5px rgba(0,0,0,0.25));'
    });

    // Poner una etiqueta de texto sobre el punto
    const tag = createSVGEl('text', {
      x: umX, y: umY - 14, 'text-anchor': 'middle',
      class: 'axis-label', style: 'font-weight: 700; fill: var(--brand-primary-dark); font-size: 8px;'
    });
    tag.textContent = 'UNIMAGDALENA';
    svg.appendChild(tag);

    star.addEventListener('mouseenter', (e) => {
      showTooltip(e, `<strong>UNIVERSIDAD DEL MAGDALENA</strong>Puntaje Promedio Entrada: ${umGlobal.sb11} pts<br>Puntaje Promedio Salida: ${umGlobal.sbpro} pts<br>Población cruzada total: ${NUM.format(umGlobal.n)} alumnos<br>Ubicación: ${umGlobal.cuadrante}`);
    });
    star.addEventListener('mousemove', moveTooltip);
    star.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(star);
  }

  // Leyenda
  const legend = createLegend([
    { color: COLOR_UM, text: 'UNIMAGDALENA' },
    { color: COLOR_REF, text: 'Grupos NBC' },
    { color: 'var(--text-faint)', text: 'Otras IES' }
  ], margin.left + 20, margin.top - 18);
  svg.appendChild(legend);

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G7: Trayectoria de Valor Agregado ---------- */
function renderTrayectoria(d) {
  const container = document.getElementById('chartTrayectoria');
  if (!container) return;

  const traj = d.trayectoria_unimag;
  if (!traj || !traj.puntos || traj.puntos.length === 0) return;

  // Filtrar los puntos para solo mostrar de 2020 a 2024 en el front-end
  const filterPoints = traj.puntos.filter(pt => pt.anio >= 2020 && pt.anio <= 2024);

  const w = 400;
  const h = 300;
  const margin = { top: 30, right: 30, bottom: 45, left: 45 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  // Coordenadas fijas
  const xMin = 210, xMax = 370;
  const yMin = 110, yMax = 190;

  const getX = (val) => margin.left + ((val - xMin) / (xMax - xMin)) * (w - margin.left - margin.right);
  const getY = (val) => h - margin.bottom - ((val - yMin) / (yMax - yMin)) * (h - margin.top - margin.bottom);

  const xLimitVal = traj.limites.x_mean;
  const yLimitVal = traj.limites.y_mean;
  const xLimit = getX(xLimitVal);
  const yLimit = getY(yLimitVal);

  // Fondos coloreados simplificados
  const rectAporte = createSVGEl('rect', {
    x: margin.left, y: margin.top,
    width: xLimit - margin.left, height: yLimit - margin.top,
    fill: 'rgba(0, 165, 11, 0.04)'
  });
  const rectDesempeno = createSVGEl('rect', {
    x: xLimit, y: margin.top,
    width: w - margin.right - xLimit, height: yLimit - margin.top,
    fill: 'rgba(1, 131, 239, 0.03)'
  });
  const rectAlerta = createSVGEl('rect', {
    x: xLimit, y: yLimit,
    width: w - margin.right - xLimit, height: h - margin.bottom - yLimit,
    fill: 'rgba(209, 5, 0, 0.04)'
  });
  svg.appendChild(rectAporte);
  svg.appendChild(rectDesempeno);
  svg.appendChild(rectAlerta);

  // Ejes y medias cruzadas
  const mediaX = createSVGEl('line', {
    x1: xLimit, y1: margin.top, x2: xLimit, y2: h - margin.bottom,
    stroke: 'var(--text-soft)', 'stroke-width': '1', 'stroke-dasharray': '2,2'
  });
  const mediaY = createSVGEl('line', {
    x1: margin.left, y1: yLimit, x2: w - margin.right, y2: yLimit,
    stroke: 'var(--text-soft)', 'stroke-width': '1', 'stroke-dasharray': '2,2'
  });
  svg.appendChild(mediaX);
  svg.appendChild(mediaY);

  const lineX = createSVGEl('line', { x1: margin.left, y1: h - margin.bottom, x2: w - margin.right, y2: h - margin.bottom, class: 'axis-line' });
  const lineY = createSVGEl('line', { x1: margin.left, y1: margin.top, x2: margin.left, y2: h - margin.bottom, class: 'axis-line' });
  svg.appendChild(lineX);
  svg.appendChild(lineY);

  // Nombre de los ejes
  const labelX = createSVGEl('text', { x: w / 2 + 10, y: h - 10, 'text-anchor': 'middle', class: 'axis-label', style: 'font-size: 9px; font-weight:600;' });
  labelX.textContent = 'Saber 11 (Perfil de Entrada)';
  const labelY = createSVGEl('text', { x: 12, y: h / 2, 'text-anchor': 'middle', class: 'axis-label', style: 'font-size: 9px; font-weight:600;', transform: `rotate(-90 12 ${h/2})` });
  labelY.textContent = 'Saber Pro (Desempeño de Salida)';
  svg.appendChild(labelX);
  svg.appendChild(labelY);

  // Trazar línea de trayectoria conectora
  let dPath = '';
  filterPoints.forEach((pt, idx) => {
    const x = getX(pt.sb11);
    const y = getY(pt.sbpro);
    dPath += `${idx === 0 ? 'M' : 'L'} ${x} ${y} `;
  });

  const path = createSVGEl('path', {
    d: dPath,
    stroke: COLOR_PRIMARY,
    fill: 'none',
    'stroke-width': '2.5',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  });
  svg.appendChild(path);

  // Trazar cabezas de flechas sencillas para ilustrar dirección
  for (let i = 0; i < filterPoints.length - 1; i++) {
    const pt1 = filterPoints[i];
    const pt2 = filterPoints[i + 1];
    const x1 = getX(pt1.sb11);
    const y1 = getY(pt1.sbpro);
    const x2 = getX(pt2.sb11);
    const y2 = getY(pt2.sbpro);

    // Calcular el punto medio para poner la flecha
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Crear flecha
    const arrowLen = 6;
    const arrowPts = [
      `${mx - arrowLen * Math.cos(angle - Math.PI/6)},${my - arrowLen * Math.sin(angle - Math.PI/6)}`,
      `${mx},${my}`,
      `${mx - arrowLen * Math.cos(angle + Math.PI/6)},${my - arrowLen * Math.sin(angle + Math.PI/6)}`
    ];
    const arrow = createSVGEl('polyline', {
      points: arrowPts.join(' '),
      stroke: COLOR_PRIMARY,
      fill: 'none',
      'stroke-width': '2',
      'stroke-linecap': 'round'
    });
    svg.appendChild(arrow);
  }

  // Dibujar puntos
  filterPoints.forEach((pt, idx) => {
    const x = getX(pt.sb11);
    const y = getY(pt.sbpro);

    // Gradiente de color según antigüedad (de claro a oscuro)
    const opacityVal = 0.4 + 0.6 * (idx / (filterPoints.length - 1));

    const circle = createSVGEl('circle', {
      cx: x, cy: y, r: 6,
      fill: COLOR_UM,
      'fill-opacity': opacityVal,
      stroke: COLOR_PRIMARY,
      'stroke-width': '1.5',
      class: 'chart-dot'
    });

    const yearLabel = createSVGEl('text', {
      x: x + 8, y: y + 3,
      class: 'axis-label',
      style: 'font-weight: 700; font-size: 8px; fill: var(--brand-primary-dark);'
    });
    yearLabel.textContent = pt.anio;
    svg.appendChild(yearLabel);

    circle.addEventListener('mouseenter', (e) => {
      showTooltip(e, `<strong>Año ${pt.anio}</strong>Saber 11 (Entrada): ${pt.sb11} pts<br>Saber Pro (Salida): ${pt.sbpro} pts<br>Evaluados: ${NUM.format(pt.n)}<br>Ubicación: ${pt.cuadrante_anual}`);
    });
    circle.addEventListener('mousemove', moveTooltip);
    circle.addEventListener('mouseleave', hideTooltip);

    svg.appendChild(circle);
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G8: Desempeño por facultad ---------- */
function renderFacultades(d) {
  const container = document.getElementById('chartFacultades');
  if (!container) return;

  const data = d.facultades;
  if (!data || data.length === 0) return;

  const sortedFacs = sorted(data, key => key.puntaje_global, true);

  const w = 600;
  const h = 240;
  const margin = { top: 10, right: 50, bottom: 20, left: 220 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const totalBars = sortedFacs.length;
  const barHeight = (h - margin.top - margin.bottom) / totalBars;
  const minVal = 120;
  const maxVal = 170;

  const getWidth = (val) => ((val - minVal) / (maxVal - minVal)) * (w - margin.left - margin.right);

  // Rejilla vertical
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const val = minVal + (i / ticks) * (maxVal - minVal);
    const x = margin.left + getWidth(val);

    const line = createSVGEl('line', { x1: x, y1: margin.top, x2: x, y2: h - margin.bottom, class: 'grid-line' });
    const text = createSVGEl('text', { x: x, y: h - margin.bottom + 12, 'text-anchor': 'middle', class: 'axis-label' });
    text.textContent = Math.round(val);
    svg.appendChild(line);
    svg.appendChild(text);
  }

  // Barras
  sortedFacs.forEach((fac, idx) => {
    const y = margin.top + idx * barHeight;
    const barW = getWidth(fac.puntaje_global);

    const rect = createSVGEl('rect', {
      x: margin.left, y: y + 3,
      width: Math.max(barW, 2), height: barHeight - 6,
      fill: COLOR_UM,
      rx: 4,
      class: 'chart-bar'
    });

    const nameText = createSVGEl('text', {
      x: margin.left - 8, y: y + barHeight / 2 + 3,
      'text-anchor': 'end',
      class: 'axis-label',
      style: 'font-weight: 600; font-size: 9px; fill: var(--brand-primary-dark);'
    });
    // Truncar para adaptarlo
    let cleanName = fac.facultad.replace('Facultad de ', '');
    nameText.textContent = cleanName;

    const scoreText = createSVGEl('text', {
      x: margin.left + barW + 6, y: y + barHeight / 2 + 3,
      class: 'axis-label',
      style: 'font-weight: 700; font-size: 10px; fill: var(--brand-primary-dark);'
    });
    scoreText.textContent = fac.puntaje_global.toFixed(1);

    rect.addEventListener('mouseenter', (e) => {
      let compsHtml = fac.competencias.map(c => `<br>  • ${c.competencia}: ${c.puntaje} pts`).join('');
      showTooltip(e, `<strong>${fac.facultad}</strong>Promedio Ponderado: ${fac.puntaje_global} pts<br>Evaluados de la Facultad: ${NUM.format(fac.n)} alumnos<br><strong>Competencias:</strong>${compsHtml}`);
    });
    rect.addEventListener('mousemove', moveTooltip);
    rect.addEventListener('mouseleave', hideTooltip);

    svg.appendChild(rect);
    svg.appendChild(nameText);
    svg.appendChild(scoreText);
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G9: Componente Explorador de Programas ---------- */
let activeProgClean = '';

function renderProgramExplorer(d) {
  const selFac = document.getElementById('selFacultad');
  const selProg = document.getElementById('selPrograma');
  if (!selProg) return;

  const progs = d.programas;
  if (!progs || progs.length === 0) return;

  // Obtener lista única de facultades
  const facs = [...new Set(progs.map(p => p.facultad))].sort();

  // Poblar Facultad selector
  if (selFac && selFac.children.length === 1) { // Solo tiene "Todas las facultades"
    facs.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      selFac.appendChild(opt);
    });

    selFac.addEventListener('change', () => {
      populateProgramsList(d);
    });
  }

  // Poblar selector de programas inicial
  populateProgramsList(d);

  // Escuchar cambio de programa
  selProg.addEventListener('change', (e) => {
    activeProgClean = e.target.value;
    updateProgramExplorerData(d);
  });
}

function populateProgramsList(d) {
  const selFac = document.getElementById('selFacultad');
  const selProg = document.getElementById('selPrograma');
  const progs = d.programas;

  const selectedFac = selFac ? selFac.value : 'TODAS';

  selProg.innerHTML = '';

  const filtered = progs.filter(p => selectedFac === 'TODAS' || p.facultad === selectedFac);
  filtered.forEach((p, idx) => {
    const opt = document.createElement('option');
    opt.value = p.programa;
    opt.textContent = p.programa;
    if (idx === 0 && activeProgClean === '') {
      activeProgClean = p.programa;
    }
    if (p.programa === activeProgClean) opt.selected = true;
    selProg.appendChild(opt);
  });

  // Si el programa actual ya no está en la lista filtrada, cambiar al primero
  if (filtered.length > 0 && !filtered.some(p => p.programa === activeProgClean)) {
    activeProgClean = filtered[0].programa;
  }

  updateProgramExplorerData(d);
}

function updateProgramExplorerData(d) {
  const p = d.programas.find(prog => prog.programa === activeProgClean);
  if (!p) return;

  // Alerta bajo N
  const warn = document.getElementById('progWarnN');
  if (warn) {
    warn.style.display = p.n_bajo ? 'flex' : 'none';
  }

  // Renderizar los 4 sub-gráficos
  renderExplorerRadar(p);
  renderExplorerSpecifics(p);
  renderExplorerHistory(p);
  renderExplorerLevels(p);
}

// Sub-Gráfico 1: Radar de genéricas del programa vs NBC
function renderExplorerRadar(p) {
  const container = document.getElementById('progRadar');
  if (!container) return;

  const comps = p.competencias_2025;
  if (!comps || comps.length === 0) {
    container.innerHTML = '<div class="placeholder">Sin datos de competencias genéricas</div>';
    return;
  }

  const w = 360;
  const h = 260;
  const cx = w / 2;
  const cy = h / 2;
  const rMax = 80;
  const totalAxes = comps.length;

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  // Pentágonos concéntricos
  const steps = 4;
  for (let i = 1; i <= steps; i++) {
    const ratio = i / steps;
    const rCurrent = rMax * ratio;
    const pts = [];
    for (let a = 0; a < totalAxes; a++) {
      const angle = a * (2 * Math.PI / totalAxes) - Math.PI / 2;
      pts.push(`${cx + rCurrent * Math.cos(angle)},${cy + rCurrent * Math.sin(angle)}`);
    }
    const polygon = createSVGEl('polygon', {
      points: pts.join(' '),
      fill: 'none', stroke: 'var(--border)', 'stroke-width': '0.7', 'stroke-dasharray': '3,3'
    });
    svg.appendChild(polygon);

    const valText = createSVGEl('text', {
      x: cx + rCurrent * Math.cos(-Math.PI / 2) + 4,
      y: cy + rCurrent * Math.sin(-Math.PI / 2) - 2,
      class: 'axis-label', style: 'font-size: 7px; opacity: 0.7;'
    });
    valText.textContent = Math.round(200 * ratio);
    svg.appendChild(valText);
  }

  // Ejes y Etiquetas
  for (let a = 0; a < totalAxes; a++) {
    const angle = a * (2 * Math.PI / totalAxes) - Math.PI / 2;
    const targetX = cx + rMax * Math.cos(angle);
    const targetY = cy + rMax * Math.sin(angle);

    // Eje line
    const axis = createSVGEl('line', { x1: cx, y1: cy, x2: targetX, y2: targetY, stroke: 'var(--border)', 'stroke-width': '0.8' });
    svg.appendChild(axis);

    // Etiqueta
    let label = comps[a].prueba;
    if (label === 'RAZONAMIENTO CUANTITATIVO') label = 'Raz. Cuantitativo';
    if (label === 'COMPETENCIAS CIUDADANAS') label = 'Ciudadanas';
    if (label === 'COMUNICACIÓN ESCRITA') label = 'Com. Escrita';
    if (label === 'LECTURA CRÍTICA') label = 'Lectura Crítica';
    if (label === 'INGLÉS') label = 'Inglés';

    const textX = cx + (rMax + 10) * Math.cos(angle);
    const textY = cy + (rMax + 10) * Math.sin(angle);

    const text = createSVGEl('text', {
      x: textX, y: textY + 3,
      'text-anchor': Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end',
      class: 'axis-label', style: 'font-size: 8px; font-weight: 600;'
    });
    text.textContent = label;
    svg.appendChild(text);
  }

  // Polígonos de Datos (Programa vs NBC)
  const scoreToRadius = (score) => (Math.min(Math.max(score, 0), 200) / 200) * rMax;

  const ptsProg = [];
  const ptsNbc = [];

  for (let a = 0; a < totalAxes; a++) {
    const angle = a * (2 * Math.PI / totalAxes) - Math.PI / 2;
    const rProg = scoreToRadius(comps[a].puntaje_programa);
    const rNbc = scoreToRadius(comps[a].puntaje_nbc_nacional);

    ptsProg.push(`${cx + rProg * Math.cos(angle)},${cy + rProg * Math.sin(angle)}`);
    ptsNbc.push(`${cx + rNbc * Math.cos(angle)},${cy + rNbc * Math.sin(angle)}`);
  }

  // Polígono NBC (Naranja)
  const polyNbc = createSVGEl('polygon', {
    points: ptsNbc.join(' '),
    fill: COLOR_REF, 'fill-opacity': '0.1', stroke: COLOR_REF, 'stroke-width': '1.8', class: 'chart-poly'
  });
  svg.appendChild(polyNbc);

  // Polígono Programa (Azul)
  const polyProg = createSVGEl('polygon', {
    points: ptsProg.join(' '),
    fill: COLOR_UM, 'fill-opacity': '0.24', stroke: COLOR_UM, 'stroke-width': '2.2', class: 'chart-poly'
  });
  svg.appendChild(polyProg);

  // Círculos interactivos
  const drawDots = (dataKey, color, name) => {
    for (let a = 0; a < totalAxes; a++) {
      const angle = a * (2 * Math.PI / totalAxes) - Math.PI / 2;
      const score = comps[a][dataKey];
      const r = scoreToRadius(score);
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);

      const circle = createSVGEl('circle', {
        cx: px, cy: py, r: 4.5, fill: color, class: 'chart-dot'
      });

      circle.addEventListener('mouseenter', (e) => {
        showTooltip(e, `<strong>${name}</strong>${comps[a].prueba}: ${score} pts`);
      });
      circle.addEventListener('mousemove', moveTooltip);
      circle.addEventListener('mouseleave', hideTooltip);

      svg.appendChild(circle);
    }
  };

  drawDots('puntaje_nbc_nacional', COLOR_REF, 'Promedio NBC');
  drawDots('puntaje_programa', COLOR_UM, 'Programa');

  // Leyenda
  const legend = createLegend([
    { color: COLOR_UM, text: 'Programa' },
    { color: COLOR_REF, text: `Ref. NBC (${p.nbc_nombre})` }
  ], cx - 110, h - 15);
  svg.appendChild(legend);

  container.innerHTML = '';
  container.appendChild(svg);
}

// Sub-Gráfico 2: Barras de específicas vs NBC
function renderExplorerSpecifics(p) {
  const card = document.getElementById('progSpecCard');
  const container = document.getElementById('progSpecBar');
  if (!container || !card) return;

  const specs = p.especificas_2025;
  if (!specs || specs.length === 0) {
    card.style.display = 'none'; // Ocultar bloque si no tiene específicas
    return;
  }
  card.style.display = 'block';

  const w = 360;
  const h = 260;
  const margin = { top: 20, right: 30, bottom: 45, left: 120 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const totalBars = specs.length;
  const blockHeight = (h - margin.top - margin.bottom) / totalBars;
  const barHeight = blockHeight * 0.35; // Espacio para bar programa y bar NBC

  const minVal = 80;
  const maxVal = 200;

  const getWidth = (val) => ((val - minVal) / (maxVal - minVal)) * (w - margin.left - margin.right);

  // Rejilla vertical
  const ticks = 3;
  for (let i = 0; i <= ticks; i++) {
    const val = minVal + (i / ticks) * (maxVal - minVal);
    const x = margin.left + getWidth(val);

    const line = createSVGEl('line', { x1: x, y1: margin.top, x2: x, y2: h - margin.bottom, class: 'grid-line' });
    const text = createSVGEl('text', { x: x, y: h - margin.bottom + 14, 'text-anchor': 'middle', class: 'axis-label' });
    text.textContent = Math.round(val);
    svg.appendChild(line);
    svg.appendChild(text);
  }

  // Dibujar las barras agrupadas
  specs.forEach((spec, idx) => {
    const yBlock = margin.top + idx * blockHeight;
    
    // Alturas de barras
    const yProg = yBlock + blockHeight * 0.15;
    const yNbc = yBlock + blockHeight * 0.5;

    const wProg = getWidth(spec.puntaje_programa);
    const wNbc = getWidth(spec.puntaje_nbc_nacional);

    // Barra Programa (Azul)
    const rectProg = createSVGEl('rect', {
      x: margin.left, y: yProg, width: Math.max(wProg, 2), height: barHeight,
      fill: COLOR_UM, rx: 2, class: 'chart-bar'
    });
    // Barra NBC (Naranja)
    const rectNbc = createSVGEl('rect', {
      x: margin.left, y: yNbc, width: Math.max(wNbc, 2), height: barHeight,
      fill: COLOR_REF, rx: 2, class: 'chart-bar'
    });

    // Texto de la prueba específica
    const nameText = createSVGEl('text', {
      x: margin.left - 6, y: yBlock + blockHeight / 2 + 3,
      'text-anchor': 'end', class: 'axis-label',
      style: 'font-size: 7.5px; font-weight: 600;'
    });
    let cleanName = spec.prueba.replace('DISEÑO DE ', '').replace('ANÁLISIS DE ', '').replace('FORMULACIÓN DE ', '');
    if (cleanName.length > 22) cleanName = cleanName.substring(0, 20) + '...';
    nameText.textContent = cleanName;

    // Agregar tooltips
    rectProg.addEventListener('mouseenter', (e) => {
      showTooltip(e, `<strong>Programa - Específica</strong>${spec.prueba}: ${spec.puntaje_programa} pts`);
    });
    rectProg.addEventListener('mousemove', moveTooltip);
    rectProg.addEventListener('mouseleave', hideTooltip);

    rectNbc.addEventListener('mouseenter', (e) => {
      showTooltip(e, `<strong>NBC (${p.nbc_nombre}) - Específica</strong>${spec.prueba}: ${spec.puntaje_nbc_nacional} pts`);
    });
    rectNbc.addEventListener('mousemove', moveTooltip);
    rectNbc.addEventListener('mouseleave', hideTooltip);

    svg.appendChild(rectProg);
    svg.appendChild(rectNbc);
    svg.appendChild(nameText);
  });

  // Leyenda
  const legend = createLegend([
    { color: COLOR_UM, text: 'Programa' },
    { color: COLOR_REF, text: 'Promedio NBC' }
  ], margin.left, h - 15);
  svg.appendChild(legend);

  container.innerHTML = '';
  container.appendChild(svg);
}

// Sub-Gráfico 3: Histórico Global del Programa
function renderExplorerHistory(p) {
  const container = document.getElementById('progHist');
  if (!container) return;

  const hist = p.historico;
  if (!hist || hist.length === 0) {
    container.innerHTML = '<div class="placeholder">Sin histórico de resultados</div>';
    return;
  }

  const w = 360;
  const h = 260;
  const margin = { top: 20, right: 20, bottom: 45, left: 45 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const years = hist.map(h => h.anio);
  const minVal = 110;
  const maxVal = 190;

  const getX = (idx) => margin.left + (idx / (years.length - 1)) * (w - margin.left - margin.right);
  const getY = (val) => h - margin.bottom - ((val - minVal) / (maxVal - minVal)) * (h - margin.top - margin.bottom);

  // Rejilla Y
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const val = minVal + (i / ticks) * (maxVal - minVal);
    const y = getY(val);

    const line = createSVGEl('line', { x1: margin.left, y1: y, x2: w - margin.right, y2: y, class: 'grid-line' });
    const text = createSVGEl('text', { x: margin.left - 6, y: y + 4, 'text-anchor': 'end', class: 'axis-label' });
    text.textContent = Math.round(val);
    svg.appendChild(line);
    svg.appendChild(text);
  }

  // Eje X
  years.forEach((yr, idx) => {
    const x = getX(idx);
    const text = createSVGEl('text', { x: x, y: h - margin.bottom + 16, 'text-anchor': 'middle', class: 'axis-label', style: 'font-weight: 600;' });
    text.textContent = yr;
    svg.appendChild(text);
  });

  // Trazar camino del programa
  let dPath = '';
  hist.forEach((pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.puntaje);
    dPath += `${idx === 0 ? 'M' : 'L'} ${x} ${y} `;
  });

  const path = createSVGEl('path', {
    d: dPath, stroke: COLOR_UM, fill: 'none', class: 'chart-line', style: 'stroke-width: 3;'
  });
  svg.appendChild(path);

  // Línea del promedio de salida NBC nacional (línea horizontal actual en 2025 para comparar)
  if (p.global_nbc_nacional_2025) {
    const yNbc = getY(p.global_nbc_nacional_2025);
    const lineNbc = createSVGEl('line', {
      x1: margin.left, y1: yNbc,
      x2: w - margin.right, y2: yNbc,
      stroke: COLOR_REF,
      'stroke-width': '1.5',
      'stroke-dasharray': '4,4'
    });
    
    // Etiqueta del promedio NBC
    const tag = createSVGEl('text', {
      x: w - margin.right - 5, y: yNbc - 4,
      'text-anchor': 'end',
      class: 'axis-label',
      style: `font-size: 7px; fill: ${COLOR_REF}; font-weight: 700;`
    });
    tag.textContent = `NBC 2025: ${p.global_nbc_nacional_2025}`;

    svg.appendChild(lineNbc);
    svg.appendChild(tag);
  }

  // Puntos interactivos
  hist.forEach((pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.puntaje);

    const circle = createSVGEl('circle', {
      cx: x, cy: y, r: 4.5, fill: COLOR_UM, class: 'chart-dot'
    });

    circle.addEventListener('mouseenter', (e) => {
      showTooltip(e, `<strong>Año ${pt.anio}</strong>Puntaje Global: ${pt.puntaje} pts<br>Evaluados: ${NUM.format(pt.n)}`);
    });
    circle.addEventListener('mousemove', moveTooltip);
    circle.addEventListener('mouseleave', hideTooltip);

    svg.appendChild(circle);
  });

  // Leyenda
  const legend = createLegend([
    { color: COLOR_UM, text: 'Programa (Historial)' },
    { color: COLOR_REF, text: 'Ref. NBC (Vigente)' }
  ], margin.left, h - 15);
  svg.appendChild(legend);

  container.innerHTML = '';
  container.appendChild(svg);
}

// Sub-Gráfico 4: Niveles de desempeño del programa vs NBC
function renderExplorerLevels(p) {
  const container = document.getElementById('progNiveles');
  if (!container) return;

  const niveles = p.niveles_2025;
  if (!niveles || niveles.length === 0) {
    container.innerHTML = '<div class="placeholder">Sin datos de distribución por niveles</div>';
    return;
  }

  const w = 360;
  const h = 260;
  const margin = { top: 10, right: 20, bottom: 45, left: 100 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const totalComps = niveles.length;
  const blockHeight = (h - margin.top - margin.bottom) / totalComps;
  const barHeight = blockHeight * 0.32; // para las dos barras

  // Colores fijos de los 5 niveles (de rojo/alerta a verde/alto)
  const colorsNiv = ['#E53935', '#FB8C00', '#FDD835', '#7CB342', '#2E7D32'];

  const getXWidth = (pct) => pct * (w - margin.left - margin.right);

  niveles.forEach((niv, idx) => {
    const yBlock = margin.top + idx * blockHeight;
    const yProg = yBlock + blockHeight * 0.15;
    const yNbc = yBlock + blockHeight * 0.52;

    // Dibujar barra apilada del Programa
    let startXProg = margin.left;
    niv.distribucion_programa.forEach((pct, nIdx) => {
      const barW = getXWidth(pct);
      if (barW > 0.5) {
        const rect = createSVGEl('rect', {
          x: startXProg, y: yProg, width: barW, height: barHeight,
          fill: colorsNiv[nIdx],
          class: 'chart-bar'
        });

        rect.addEventListener('mouseenter', (e) => {
          showTooltip(e, `<strong>Programa - Nivel ${nIdx + 1}</strong>Distribución: ${(pct * 100).toFixed(1)}%`);
        });
        rect.addEventListener('mousemove', moveTooltip);
        rect.addEventListener('mouseleave', hideTooltip);

        svg.appendChild(rect);
      }
      startXProg += barW;
    });

    // Dibujar barra apilada de la referencia NBC
    let startXNbc = margin.left;
    niv.distribucion_nbc_nacional.forEach((pct, nIdx) => {
      const barW = getXWidth(pct);
      if (barW > 0.5) {
        const rect = createSVGEl('rect', {
          x: startXNbc, y: yNbc, width: barW, height: barHeight,
          fill: colorsNiv[nIdx],
          class: 'chart-bar'
        });

        rect.addEventListener('mouseenter', (e) => {
          showTooltip(e, `<strong>Ref. NBC - Nivel ${nIdx + 1}</strong>Distribución: ${(pct * 100).toFixed(1)}%`);
        });
        rect.addEventListener('mousemove', moveTooltip);
        rect.addEventListener('mouseleave', hideTooltip);

        svg.appendChild(rect);
      }
      startXNbc += barW;
    });

    // Etiqueta del bloque
    let label = niv.competencia;
    if (label === 'RAZONAMIENTO CUANTITATIVO') label = 'Raz. Cuantitativo';
    if (label === 'COMPETENCIAS CIUDADANAS') label = 'Ciudadanas';
    if (label === 'COMUNICACIÓN ESCRITA') label = 'Com. Escrita';
    if (label === 'LECTURA CRÍTICA') label = 'Lectura Crítica';
    if (label === 'INGLÉS') label = 'Inglés';

    const text = createSVGEl('text', {
      x: margin.left - 8, y: yBlock + blockHeight / 2 + 3,
      'text-anchor': 'end',
      class: 'axis-label',
      style: 'font-weight: 600; font-size: 7.5px;'
    });
    text.textContent = label;
    svg.appendChild(text);

    // Escribir badge P/N para distinguir programa vs nbc
    const textP = createSVGEl('text', { x: margin.left + 3, y: yProg + barHeight - 2, class: 'axis-label', style: 'fill: #fff; font-size: 6px; font-weight:800;' });
    textP.textContent = 'P';
    const textN = createSVGEl('text', { x: margin.left + 3, y: yNbc + barHeight - 2, class: 'axis-label', style: 'fill: #fff; font-size: 6px; font-weight:800;' });
    textN.textContent = 'N';
    svg.appendChild(textP);
    svg.appendChild(textN);
  });

  // Rejilla inferior de porcentaje
  [0, 0.25, 0.5, 0.75, 1].forEach(pct => {
    const x = margin.left + getXWidth(pct);
    const label = createSVGEl('text', { x: x, y: h - margin.bottom + 12, 'text-anchor': 'middle', class: 'axis-label', style: 'font-size: 8px;' });
    label.textContent = `${Math.round(pct * 100)}%`;
    svg.appendChild(label);
  });

  // Leyenda de colores de nivel
  const legendG = createSVGEl('g', { class: 'legend' });
  colorsNiv.forEach((col, nIdx) => {
    const x = margin.left + nIdx * 52;
    const rect = createSVGEl('rect', { x: x, y: h - 22, width: 8, height: 8, fill: col, rx: 1 });
    const txt = createSVGEl('text', { x: x + 12, y: h - 15, class: 'axis-label', style: 'font-size: 7px; font-weight:600;' });
    txt.textContent = `Niv ${nIdx + 1}`;
    legendG.appendChild(rect);
    legendG.appendChild(txt);
  });
  svg.appendChild(legendG);

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G10: Top 10 por competencia ---------- */
let activeTopCompetence = 'Global';

function renderTop10(d) {
  const tabs = document.getElementById('topTabs');
  const container = document.getElementById('chartTop10');
  if (!container) return;

  const comps = Object.keys(d.top10.por_competencia || {});
  if (comps.length === 0) return;

  // Poblar pestañas
  if (tabs && tabs.children.length === 0) {
    const allTabs = ['Global', ...comps];
    allTabs.forEach(tName => {
      const btn = document.createElement('button');
      btn.className = `tab-btn ${tName === activeTopCompetence ? 'is-active' : ''}`;
      
      let label = tName;
      if (label === 'RAZONAMIENTO CUANTITATIVO') label = 'Raz. Cuantitativo';
      if (label === 'COMPETENCIAS CIUDADANAS') label = 'Ciudadanas';
      if (label === 'COMUNICACIÓN ESCRITA') label = 'Com. Escrita';
      if (label === 'LECTURA CRÍTICA') label = 'Lectura Crítica';
      if (label === 'INGLÉS') label = 'Inglés';

      btn.textContent = label;
      btn.dataset.comp = tName;

      btn.addEventListener('click', (e) => {
        [...tabs.querySelectorAll('.tab-btn')].forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        activeTopCompetence = btn.dataset.comp;
        drawTop10Plot(d);
      });

      tabs.appendChild(btn);
    });
  }

  drawTop10Plot(d);
}

function drawTop10Plot(d) {
  const container = document.getElementById('chartTop10');
  let dataList = [];

  if (activeTopCompetence === 'Global') {
    dataList = d.top10.global;
  } else {
    dataList = d.top10.por_competencia[activeTopCompetence];
  }

  if (!dataList || dataList.length === 0) return;

  const w = 500;
  const h = 320;
  const margin = { top: 15, right: 50, bottom: 20, left: 160 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const totalBars = dataList.length;
  const barHeight = (h - margin.top - margin.bottom) / totalBars;

  // Escalar en base al tipo de puntaje (Global: max ~200, Específicas/Prueba: max ~200)
  const minVal = activeTopCompetence === 'Global' ? 120 : 100;
  const maxVal = activeTopCompetence === 'Global' ? 190 : 200;

  const getWidth = (val) => ((val - minVal) / (maxVal - minVal)) * (w - margin.left - margin.right);

  // Ejes guías verticales
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const val = minVal + (i / ticks) * (maxVal - minVal);
    const x = margin.left + getWidth(val);

    const line = createSVGEl('line', { x1: x, y1: margin.top, x2: x, y2: h - margin.bottom, class: 'grid-line' });
    const text = createSVGEl('text', { x: x, y: h - margin.bottom + 12, 'text-anchor': 'middle', class: 'axis-label' });
    text.textContent = Math.round(val);
    svg.appendChild(line);
    svg.appendChild(text);
  }

  // Dibujar barras del Top 10
  dataList.forEach((item, idx) => {
    const y = margin.top + idx * barHeight;
    const barW = getWidth(item.puntaje);

    const rect = createSVGEl('rect', {
      x: margin.left, y: y + 3,
      width: Math.max(barW, 2), height: barHeight - 6,
      fill: COLOR_PRIMARY,
      rx: 3,
      class: 'chart-bar'
    });

    const nameText = createSVGEl('text', {
      x: margin.left - 8, y: y + barHeight / 2 + 3,
      'text-anchor': 'end',
      class: 'axis-label',
      style: 'font-weight: 600; font-size: 8.5px; fill: var(--brand-primary-dark);'
    });
    let cleanName = item.programa;
    if (cleanName.length > 25) cleanName = cleanName.substring(0, 23) + '...';
    nameText.textContent = `${idx + 1}. ${cleanName}`;

    const scoreText = createSVGEl('text', {
      x: margin.left + barW + 6, y: y + barHeight / 2 + 3,
      class: 'axis-label',
      style: 'font-weight: 800; font-size: 9px; fill: var(--brand-primary-dark);'
    });
    scoreText.textContent = item.puntaje.toFixed(1);

    rect.addEventListener('mouseenter', (e) => {
      showTooltip(e, `<strong>${item.programa}</strong>Puntaje Promedio: ${item.puntaje} pts${item.n ? `<br>Evaluados: ${NUM.format(item.n)}` : ''}`);
    });
    rect.addEventListener('mousemove', moveTooltip);
    rect.addEventListener('mouseleave', hideTooltip);

    svg.appendChild(rect);
    svg.appendChild(nameText);
    svg.appendChild(scoreText);
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G11: Niveles de desempeño institucional ---------- */
function renderNivelesInstitucional(d) {
  const container = document.getElementById('chartNiveles');
  if (!container) return;

  const data = d.niveles_desempeno;
  if (!data || data.length === 0) return;

  const w = 500;
  const h = 320;
  const margin = { top: 15, right: 30, bottom: 40, left: 120 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const totalComps = data.length;
  const blockHeight = (h - margin.top - margin.bottom) / totalComps;
  const barHeight = blockHeight * 0.33;

  const colorsNiv = ['#E53935', '#FB8C00', '#FDD835', '#7CB342', '#2E7D32'];
  const getXWidth = (pct) => pct * (w - margin.left - margin.right);

  data.forEach((item, idx) => {
    const yBlock = margin.top + idx * blockHeight;
    const yUM = yBlock + blockHeight * 0.15;
    const yNat = yBlock + blockHeight * 0.52;

    // Barra apilada UNIMAGDALENA
    let startXUM = margin.left;
    item.distribucion_unimag.forEach((pct, nIdx) => {
      const barW = getXWidth(pct);
      if (barW > 0.5) {
        const rect = createSVGEl('rect', {
          x: startXUM, y: yUM, width: barW, height: barHeight,
          fill: colorsNiv[nIdx], class: 'chart-bar'
        });

        rect.addEventListener('mouseenter', (e) => {
          showTooltip(e, `<strong>UNIMAGDALENA - Nivel ${nIdx + 1}</strong>Distribución: ${(pct * 100).toFixed(1)}%`);
        });
        rect.addEventListener('mousemove', moveTooltip);
        rect.addEventListener('mouseleave', hideTooltip);

        svg.appendChild(rect);
      }
      startXUM += barW;
    });

    // Barra apilada País
    let startXNat = margin.left;
    item.distribucion_nacional.forEach((pct, nIdx) => {
      const barW = getXWidth(pct);
      if (barW > 0.5) {
        const rect = createSVGEl('rect', {
          x: startXNat, y: yNat, width: barW, height: barHeight,
          fill: colorsNiv[nIdx], class: 'chart-bar'
        });

        rect.addEventListener('mouseenter', (e) => {
          showTooltip(e, `<strong>Nacional - Nivel ${nIdx + 1}</strong>Distribución: ${(pct * 100).toFixed(1)}%`);
        });
        rect.addEventListener('mousemove', moveTooltip);
        rect.addEventListener('mouseleave', hideTooltip);

        svg.appendChild(rect);
      }
      startXNat += barW;
    });

    // Etiqueta del eje
    let label = item.competencia;
    if (label === 'RAZONAMIENTO CUANTITATIVO') label = 'Raz. Cuantitativo';
    if (label === 'COMPETENCIAS CIUDADANAS') label = 'Ciudadanas';
    if (label === 'COMUNICACIÓN ESCRITA') label = 'Com. Escrita';
    if (label === 'LECTURA CRÍTICA') label = 'Lectura Crítica';
    if (label === 'INGLÉS') label = 'Inglés';

    const text = createSVGEl('text', {
      x: margin.left - 8, y: yBlock + blockHeight / 2 + 3,
      'text-anchor': 'end', class: 'axis-label',
      style: 'font-weight: 600; font-size: 8px;'
    });
    text.textContent = label;
    svg.appendChild(text);

    // Escribir badge UM / Col
    const textU = createSVGEl('text', { x: margin.left + 3, y: yUM + barHeight - 2, class: 'axis-label', style: 'fill: #fff; font-size: 6px; font-weight:800;' });
    textU.textContent = 'UM';
    const textC = createSVGEl('text', { x: margin.left + 3, y: yNat + barHeight - 2, class: 'axis-label', style: 'fill: #fff; font-size: 6px; font-weight:800;' });
    textC.textContent = 'Col';
    svg.appendChild(textU);
    svg.appendChild(textC);
  });

  // Rejilla de porcentajes
  [0, 0.25, 0.5, 0.75, 1].forEach(pct => {
    const x = margin.left + getXWidth(pct);
    const label = createSVGEl('text', { x: x, y: h - margin.bottom + 12, 'text-anchor': 'middle', class: 'axis-label', style: 'font-size: 8px;' });
    label.textContent = `${Math.round(pct * 100)}%`;
    svg.appendChild(label);
  });

  // Leyenda de colores de nivel
  const legendG = createSVGEl('g', { class: 'legend' });
  colorsNiv.forEach((col, nIdx) => {
    const x = margin.left + nIdx * 70;
    const rect = createSVGEl('rect', { x: x, y: h - 18, width: 10, height: 10, fill: col, rx: 1.5 });
    const txt = createSVGEl('text', { x: x + 14, y: h - 10, class: 'axis-label', style: 'font-size: 8px; font-weight:600;' });
    txt.textContent = `Nivel ${nIdx + 1}`;
    legendG.appendChild(rect);
    legendG.appendChild(txt);
  });
  svg.appendChild(legendG);

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G12: Mapa de calor & Storytelling (DOFA) ---------- */
function renderHeatmapAndDofa(d) {
  const container = document.getElementById('chartHeatmap');
  if (!container) return;

  const facs = d.facultades;
  if (!facs || facs.length === 0) return;

  const comps = d.institucional.competencias.map(c => c.competencia);

  // Crear la tabla
  const table = document.createElement('table');
  table.className = 'heatmap';

  // Cabecera
  const thead = document.createElement('thead');
  const trHeader = document.createElement('tr');
  trHeader.appendChild(document.createElement('th')); // Esquina vacía
  comps.forEach(c => {
    const th = document.createElement('th');
    
    let label = c;
    if (label === 'RAZONAMIENTO CUANTITATIVO') label = 'Raz. Cuantitativo';
    if (label === 'COMPETENCIAS CIUDADANAS') label = 'Ciudadanas';
    if (label === 'COMUNICACIÓN ESCRITA') label = 'Com. Escrita';
    if (label === 'LECTURA CRÍTICA') label = 'Lectura Crítica';
    if (label === 'INGLÉS') label = 'Inglés';

    th.textContent = label;
    trHeader.appendChild(th);
  });
  thead.appendChild(trHeader);
  table.appendChild(thead);

  // Cuerpo
  const tbody = document.createElement('tbody');

  // Encontrar mínimos y máximos para la escala de color
  let minScore = 200;
  let maxScore = 0;
  facs.forEach(f => {
    f.competencias.forEach(c => {
      if (c.puntaje < minScore) minScore = c.puntaje;
      if (c.puntaje > maxScore) maxScore = c.puntaje;
    });
  });

  facs.forEach(f => {
    const tr = document.createElement('tr');

    const tdFac = document.createElement('td');
    tdFac.textContent = f.facultad.replace('Facultad de ', '');
    tr.appendChild(tdFac);

    comps.forEach(compName => {
      const tdVal = document.createElement('td');
      const compObj = f.competencias.find(c => c.competencia === compName);
      
      if (compObj && compObj.puntaje !== null) {
        tdVal.textContent = Math.round(compObj.puntaje);
        tdVal.className = 'heatmap__cell';

        // Escalar opacidad del fondo azul de acuerdo con el rendimiento
        const pct = (compObj.puntaje - minScore) / (maxScore - minScore);
        const opacityVal = 0.05 + 0.55 * pct;
        tdVal.style.background = `rgba(1, 131, 239, ${opacityVal})`;

        // Tooltip
        tdVal.addEventListener('mouseenter', (e) => {
          showTooltip(e, `<strong>${f.facultad}</strong>${compName}: ${compObj.puntaje} pts`);
        });
        tdVal.addEventListener('mousemove', moveTooltip);
        tdVal.addEventListener('mouseleave', hideTooltip);
      } else {
        tdVal.textContent = '—';
      }

      tr.appendChild(tdVal);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);

  // ---------- STORYTELLING / DOFA DINÁMICA ----------
  buildDofaDetails(d);
}

function buildDofaDetails(d) {
  const fortList = document.getElementById('dofaFortalezas');
  const debList = document.getElementById('dofaDebilidades');
  const opList = document.getElementById('dofaOportunidades');
  const amList = document.getElementById('dofaAmenazas');

  if (!fortList || !debList || !opList || !amList) return;

  const comps = d.institucional.competencias;
  const progs = d.programas || [];

  // Calcular las brechas institucionales
  const compBrechas = comps.map(c => ({
    name: c.competencia,
    brecha: c.puntaje_unimag - c.puntaje_nacional,
    score: c.puntaje_unimag,
    refScore: c.puntaje_nacional
  }));

  // Ordenar por tamaño de brecha (mejor a peor)
  const brechasOrdenadas = sorted(compBrechas, key => key.brecha, true);

  // 1. Fortalezas
  const fortalezas = [];
  const mejorBrecha = brechasOrdenadas[0];
  if (mejorBrecha.brecha > 0) {
    fortalezas.push(`Desempeño institucional destacado en <strong>${mejorBrecha.name}</strong>, superando el promedio nacional por +${mejorBrecha.brecha.toFixed(1)} puntos.`);
  } else {
    fortalezas.push(`Cercanía al promedio nacional en la competencia de <strong>${mejorBrecha.name}</strong> (brecha de solo ${mejorBrecha.brecha.toFixed(1)} puntos).`);
  }

  // Facultad líder
  const sortedFacs = sorted(d.facultades, key => key.puntaje_global, true);
  if (sortedFacs.length > 0) {
    fortalezas.push(`Liderazgo interno de la <strong>${sortedFacs[0].facultad}</strong>, registrando el promedio global más alto de la institución (${sortedFacs[0].puntaje_global} pts).`);
  }

  // Programas sobre promedio NBC
  const sobreNbcCount = progs.filter(p => p.global_2025 > p.global_nbc_nacional_2025).length;
  fortalezas.push(`Un total de <strong>${sobreNbcCount} de ${progs.length} programas</strong> (${Math.round(100 * sobreNbcCount / progs.length)}%) superan la media de su respectivo Grupo de Referencia Nacional.`);

  // 2. Debilidades
  const debilidades = [];
  const peorBrecha = brechasOrdenadas[brechasOrdenadas.length - 1];
  debilidades.push(`Brecha crítica por cerrar en la competencia de <strong>${peorBrecha.name}</strong>, donde la universidad se encuentra ${Math.abs(peorBrecha.brecha).toFixed(1)} puntos por debajo de la media nacional.`);
  
  const segundaPeor = brechasOrdenadas[brechasOrdenadas.length - 2];
  if (segundaPeor.brecha < 0) {
    debilidades.push(`Margen de mejora prioritario en <strong>${segundaPeor.name}</strong>, registrando una brecha de ${segundaPeor.brecha.toFixed(1)} puntos con el país.`);
  }

  // Facultad que requiere acompañamiento
  if (sortedFacs.length > 1) {
    const peorFac = sortedFacs[sortedFacs.length - 1];
    debilidades.push(`Necesidad de acompañamiento y plan de choque en la <strong>${peorFac.facultad}</strong>, que reporta el promedio más bajo de la universidad (${peorFac.puntaje_global} pts).`);
  }

  // 3. Oportunidades
  const oportunidades = [];
  oportunidades.push(`Aprovechar que UNIMAGDALENA ocupa el puesto <strong>${d.sue_ranking.find(r => r.es_unimagdalena)?.rank}.º en el SUE</strong> para consolidar y mercadear la posición competitiva frente a otras universidades del Caribe.`);
  
  // Programas muy cerca del promedio nacional NBC
  const cercaNBC = progs.filter(p => {
    const diff = p.global_2025 - p.global_nbc_nacional_2025;
    return diff >= -3 && diff < 0;
  });
  if (cercaNBC.length > 0) {
    oportunidades.push(`Focalizar programas con brechas mínimas (como <strong>${cercaNBC.slice(0,2).map(p => p.programa).join(', ')}</strong>) que están a menos de 3 puntos de superar su NBC, para impulsar el indicador general.`);
  }
  oportunidades.push(`Explotar el análisis de **Valor Agregado (Cuadrantes)** en procesos de autoevaluación, demostrando el impacto formador en estudiantes con perfiles de ingreso heterogéneos.`);

  // 4. Amenazas
  const amenazas = [];
  // Programas con bajo N
  const bajoN = progs.filter(p => p.n_bajo);
  if (bajoN.length > 0) {
    amenazas.push(`Alta volatilidad en indicadores por programas con cohortes pequeñas (<strong>n &lt; 5</strong>) como ${bajoN.slice(0, 3).map(p => p.programa).join(', ')}. Unos pocos evaluados distorsionan el promedio.`);
  }
  
  // Tendencia de brecha nacional
  const globalHist = d.institucional.historico;
  if (globalHist.length > 2) {
    const ult = globalHist[globalHist.length - 1];
    const pen = globalHist[globalHist.length - 2];
    const nacDiff = ult.puntaje_nacional - pen.puntaje_nacional;
    if (nacDiff > 1) {
      amenazas.push(`Aumento de la exigencia del estándar nacional (el promedio país subió +${nacDiff.toFixed(1)} pts), obligando a acelerar las mejoras para no rezagarse en rankings.`);
    }
  }
  amenazas.push(`Riesgo de estancamiento en la brecha de salida de las pruebas específicas en programas de Ingeniería por la rápida evolución de la estructura curricular de IES acreditadas.`);

  // Inyectar en el HTML
  const populateList = (el, items) => {
    el.innerHTML = items.map(it => `<li>${it}</li>`).join('');
  };
  populateList(fortList, fortalezas);
  populateList(debList, debilidades);
  populateList(opList, oportunidades);
  populateList(amList, amenazas);
}

// Utilidad simple para ordenar arrays
function sorted(arr, keySelector, desc = false) {
  return [...arr].sort((a, b) => {
    const valA = keySelector(a);
    const valB = keySelector(b);
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return desc ? 1 : -1;
    if (valB === null || valB === undefined) return desc ? -1 : 1;
    return desc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
  });
}

/* ---------- Scroll-spy ---------- */
function initScrollSpy() {
  const links = [...document.querySelectorAll('.nav__item')];
  const map = new Map(links.map(l => [l.getAttribute('href').slice(1), l]));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('is-active'));
        map.get(e.target.id)?.classList.add('is-active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('.section').forEach(s => obs.observe(s));
}

/* ---------- Menu lateral desplegable ---------- */
function initNavDrawer() {
  const toggle = document.getElementById('menuToggle');
  const backdrop = document.getElementById('sidebarBackdrop');
  const sidebar = document.getElementById('sidebar');
  const links = [...document.querySelectorAll('.nav__item')];
  if (!toggle || !sidebar) return;

  const setOpen = (open) => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menu de secciones' : 'Abrir menu de secciones');
  };

  toggle.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('nav-open'));
  });

  backdrop?.addEventListener('click', () => setOpen(false));

  links.forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}

// Ejecutar init al cargar
init();
