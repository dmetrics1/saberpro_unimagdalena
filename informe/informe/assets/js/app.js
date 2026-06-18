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
  initRadarYearPicker(d);
  renderRadar(d);
  renderEvolLine(d);
  renderSueRanking(d);
  initUnivDeptYearPicker(d);
  renderUnivDept(d);
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
const PANORAMA_UM = '#0F4FA8';     // azul institucional para UM en Panorama
const PANORAMA_NAT = '#2BA85E';    // verde para Nacional

// Inicializa el selector de año del radar y conecta el cambio con un re-render
function initRadarYearPicker(d) {
  const sel = document.getElementById('selAnioRadar');
  if (!sel) return;
  const hist = (d.institucional.historico || []).filter(h => Array.isArray(h.competencias) && h.competencias.length > 0);
  if (hist.length === 0) return;

  sel.innerHTML = hist
    .map(h => h.anio)
    .sort((a, b) => b - a)
    .map(y => `<option value="${y}">${y}</option>`)
    .join('');

  const defaultYear = String(d.meta?.anio_vigente ?? hist[hist.length - 1].anio);
  sel.value = defaultYear;

  sel.addEventListener('change', () => renderRadar(d, parseInt(sel.value, 10)));
}

function renderRadar(d, yearOverride) {
  const container = document.getElementById('chartRadar');
  if (!container) return;

  const g = d.institucional.global;
  const hist = d.institucional.historico || [];
  const currentYear = d.meta?.anio_vigente ?? (hist.length ? hist[hist.length - 1].anio : null);
  const targetYear = yearOverride ?? currentYear;
  const yearEntry = hist.find(h => h.anio === targetYear);

  // Si el año seleccionado tiene competencias en el histórico, las usamos.
  // Si no, fallback al bloque institucional.competencias (año vigente).
  const comps = (yearEntry && Array.isArray(yearEntry.competencias) && yearEntry.competencias.length > 0)
    ? yearEntry.competencias
    : d.institucional.competencias;
  if (!comps || comps.length === 0 || !g) return;

  // Para el eje "Puntaje Global" usamos el valor del año seleccionado
  const yearGlobal = yearEntry ? {
    puntaje_unimag: yearEntry.puntaje_unimag,
    puntaje_nacional: yearEntry.puntaje_nacional
  } : { puntaje_unimag: g.puntaje_unimag, puntaje_nacional: g.puntaje_nacional };

  // Actualizar etiqueta del título
  const lbl = document.getElementById('radarYearLbl');
  if (lbl) lbl.textContent = targetYear;

  // 6 ejes = 5 competencias + Puntaje Global
  const shortLabel = (name) => ({
    'RAZONAMIENTO CUANTITATIVO': 'Razonamiento\nCuantitativo',
    'COMPETENCIAS CIUDADANAS': 'Competencias\nCiudadanas',
    'COMUNICACIÓN ESCRITA': 'Comunicación\nEscrita',
    'LECTURA CRÍTICA': 'Lectura Crítica',
    'INGLÉS': 'Inglés'
  })[name] || name;

  const axes = [
    ...comps.map(c => ({
      full: c.competencia,
      label: shortLabel(c.competencia),
      um: c.puntaje_unimag,
      nat: c.puntaje_nacional
    })),
    {
      full: 'Puntaje Global',
      label: 'Puntaje Global',
      um: yearGlobal.puntaje_unimag,
      nat: yearGlobal.puntaje_nacional
    }
  ];

  const w = 640;
  const h = 440;
  const cx = w / 2;
  const cy = h / 2 - 14;
  const rMax = 125;
  const n = axes.length;

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  // Niveles concéntricos (polígonos de fondo, escala 100-160)
  const minScale = 100;
  const maxScale = 160;
  const scoreToRadius = (s) => Math.max(0, Math.min(1, (s - minScale) / (maxScale - minScale))) * rMax;
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    const ratio = i / steps;
    const r = rMax * ratio;
    const pts = [];
    for (let a = 0; a < n; a++) {
      const angle = a * (2 * Math.PI / n) - Math.PI / 2;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    svg.appendChild(createSVGEl('polygon', {
      points: pts.join(' '),
      fill: 'none',
      stroke: 'var(--border)',
      'stroke-width': '0.6',
      'stroke-dasharray': i === steps ? '0' : '2,3',
      opacity: i === steps ? '0.55' : '0.4'
    }));
  }

  // Ejes radiales (líneas finas desde el centro)
  for (let a = 0; a < n; a++) {
    const angle = a * (2 * Math.PI / n) - Math.PI / 2;
    svg.appendChild(createSVGEl('line', {
      x1: cx, y1: cy,
      x2: cx + rMax * Math.cos(angle),
      y2: cy + rMax * Math.sin(angle),
      stroke: 'var(--border)',
      'stroke-width': '0.6',
      opacity: '0.5'
    }));
  }

  // Etiquetas de los ejes (nombres de competencias) — empujadas afuera para no chocar con los valores
  for (let a = 0; a < n; a++) {
    const angle = a * (2 * Math.PI / n) - Math.PI / 2;
    const labelDist = rMax + 42;
    const lx = cx + labelDist * Math.cos(angle);
    const ly = cy + labelDist * Math.sin(angle);
    const anchor = Math.abs(Math.cos(angle)) < 0.15 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end');

    const lines = axes[a].label.split('\n');
    const lineHeight = 14;
    const startY = ly - ((lines.length - 1) * lineHeight) / 2 + 4;
    lines.forEach((line, idx) => {
      const t = createSVGEl('text', {
        x: lx,
        y: startY + idx * lineHeight,
        'text-anchor': anchor,
        style: 'font-family: var(--font-display); font-weight: 700; font-size: 12px; fill: var(--brand-primary-dark);'
      });
      t.textContent = line;
      svg.appendChild(t);
    });
  }

  // Polígonos de datos
  const buildPts = (key) => {
    const pts = [];
    for (let a = 0; a < n; a++) {
      const angle = a * (2 * Math.PI / n) - Math.PI / 2;
      const r = scoreToRadius(axes[a][key]);
      pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
    }
    return pts;
  };
  const ptsNat = buildPts('nat');
  const ptsUM = buildPts('um');

  // Polígono Nacional (relleno muy tenue + borde verde)
  svg.appendChild(createSVGEl('polygon', {
    points: ptsNat.map(p => p.join(',')).join(' '),
    fill: PANORAMA_NAT,
    'fill-opacity': '0.06',
    stroke: PANORAMA_NAT,
    'stroke-width': '2.5',
    'stroke-linejoin': 'round'
  }));

  // Polígono UM (relleno muy tenue + borde azul institucional)
  svg.appendChild(createSVGEl('polygon', {
    points: ptsUM.map(p => p.join(',')).join(' '),
    fill: PANORAMA_UM,
    'fill-opacity': '0.08',
    stroke: PANORAMA_UM,
    'stroke-width': '2.9',
    'stroke-linejoin': 'round'
  }));

  // Puntos y etiquetas numéricas
  // Estrategia: los puntos van en su vértice real del polígono; las etiquetas
  // se posicionan a una distancia FIJA del centro (justo afuera del polígono)
  // y se separan perpendicularmente al eje, una a cada lado. Esto garantiza que
  // UM y Nacional nunca se peguen aunque sus valores coincidan.
  for (let a = 0; a < n; a++) {
    const angle = a * (2 * Math.PI / n) - Math.PI / 2;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const perpX = -sinA;
    const perpY = cosA;

    const [umX, umY] = ptsUM[a];
    const [natX, natY] = ptsNat[a];

    // Marcadores sólidos en los vértices reales del polígono
    const dotNat = createSVGEl('circle', {
      cx: natX, cy: natY, r: 5,
      fill: PANORAMA_NAT,
      stroke: '#fff', 'stroke-width': '1.4',
      class: 'chart-dot'
    });
    dotNat.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>Nacional</strong>${axes[a].full}: ${axes[a].nat} pts`));
    dotNat.addEventListener('mousemove', moveTooltip);
    dotNat.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(dotNat);

    const dotUM = createSVGEl('circle', {
      cx: umX, cy: umY, r: 5.5,
      fill: PANORAMA_UM,
      stroke: '#fff', 'stroke-width': '1.6',
      class: 'chart-dot'
    });
    dotUM.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>Unimagdalena</strong>${axes[a].full}: ${axes[a].um} pts`));
    dotUM.addEventListener('mousemove', moveTooltip);
    dotUM.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(dotUM);

    // Posición base de las etiquetas: a una distancia fija del centro
    const valueLabelDist = rMax + 16;
    const baseX = cx + valueLabelDist * cosA;
    const baseY = cy + valueLabelDist * sinA;
    const tangentSep = 22;

    // UM a un lado, Nacional al otro — separados ~44 px perpendicularmente
    const umLx = baseX + tangentSep * perpX;
    const umLy = baseY + tangentSep * perpY;
    const umLabel = createSVGEl('text', {
      x: umLx, y: umLy + 5,
      'text-anchor': 'middle',
      style: `font-family: var(--font-display); font-weight: 800; font-size: 14px; fill: ${PANORAMA_UM};`
    });
    umLabel.textContent = axes[a].um;
    svg.appendChild(umLabel);

    const natLx = baseX - tangentSep * perpX;
    const natLy = baseY - tangentSep * perpY;
    const natLabel = createSVGEl('text', {
      x: natLx, y: natLy + 5,
      'text-anchor': 'middle',
      style: `font-family: var(--font-display); font-weight: 800; font-size: 14px; fill: ${PANORAMA_NAT};`
    });
    natLabel.textContent = axes[a].nat;
    svg.appendChild(natLabel);
  }

  // Leyenda inferior unificada (con buena separación entre series)
  svg.appendChild(createLegend([
    { color: PANORAMA_UM, text: 'Unimagdalena' },
    { color: PANORAMA_NAT, text: 'Nacional' }
  ], cx - 160, h - 16, { fontSize: 13, rectW: 20, rectH: 10, gap: 230, textGap: 30, fontWeight: 700 }));

  container.innerHTML = '';
  container.appendChild(svg);
}

// Leyendas dinámicas para SVGs (con tamaño configurable)
function createLegend(items, startX, startY, opts = {}) {
  const fontSize = opts.fontSize || 9;
  const rectW = opts.rectW || 14;
  const rectH = opts.rectH || 8;
  const gap = opts.gap || 110;
  const textGap = opts.textGap || 20;
  const fontWeight = opts.fontWeight || 600;

  const g = createSVGEl('g', { class: 'legend' });
  items.forEach((item, idx) => {
    const x = startX + idx * gap;
    const rect = createSVGEl('rect', {
      x: x, y: startY - rectH, width: rectW, height: rectH, rx: 2,
      fill: item.color
    });
    const text = createSVGEl('text', {
      x: x + textGap, y: startY - 1,
      style: `font-family: var(--font-display); font-size: ${fontSize}px; font-weight: ${fontWeight}; fill: var(--brand-primary-dark);`
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

  const w = 720;
  const h = 400;
  const margin = { top: 24, right: 32, bottom: 64, left: 52 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const years = hist.map(p => p.anio);
  // Calcular rango Y a partir de los datos con un padding
  const allVals = hist.flatMap(p => [p.puntaje_unimag, p.puntaje_nacional]);
  const dataMin = Math.min(...allVals);
  const dataMax = Math.max(...allVals);
  const span = dataMax - dataMin;
  const pad = Math.max(4, Math.ceil(span * 0.35));
  let minVal = Math.floor((dataMin - pad) / 5) * 5;
  let maxVal = Math.ceil((dataMax + pad) / 5) * 5;
  if (maxVal - minVal < 20) maxVal = minVal + 20;

  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;
  const getX = (idx) => margin.left + (idx / (years.length - 1)) * innerW;
  const getY = (val) => h - margin.bottom - ((val - minVal) / (maxVal - minVal)) * innerH;

  // Rejilla horizontal con tickValues múltiplos de 5
  const tickStep = 5;
  for (let v = minVal; v <= maxVal; v += tickStep) {
    const y = getY(v);
    svg.appendChild(createSVGEl('line', {
      x1: margin.left, y1: y,
      x2: w - margin.right, y2: y,
      stroke: 'var(--border)',
      'stroke-width': '0.6',
      'stroke-dasharray': '2,4',
      opacity: '0.7'
    }));
    const lbl = createSVGEl('text', {
      x: margin.left - 10, y: y + 4,
      'text-anchor': 'end',
      style: 'font-family: var(--font-display); font-size: 11.5px; font-weight: 500; fill: var(--text-soft);'
    });
    lbl.textContent = v;
    svg.appendChild(lbl);
  }

  // Línea base del eje X
  svg.appendChild(createSVGEl('line', {
    x1: margin.left, y1: h - margin.bottom,
    x2: w - margin.right, y2: h - margin.bottom,
    stroke: 'var(--border)',
    'stroke-width': '1'
  }));

  // Etiquetas eje X
  years.forEach((yr, idx) => {
    const x = getX(idx);
    const lbl = createSVGEl('text', {
      x: x, y: h - margin.bottom + 22,
      'text-anchor': 'middle',
      style: 'font-family: var(--font-display); font-size: 12.5px; font-weight: 600; fill: var(--brand-primary-dark);'
    });
    lbl.textContent = yr;
    svg.appendChild(lbl);
  });

  // Path con curvas suaves (Catmull-Rom → Bézier)
  const smoothPath = (points) => {
    if (points.length < 2) return '';
    const tension = 0.35;
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension / 2;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension / 2;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension / 2;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension / 2;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
    }
    return d;
  };

  const ptsUM = hist.map((p, i) => [getX(i), getY(p.puntaje_unimag)]);
  const ptsNat = hist.map((p, i) => [getX(i), getY(p.puntaje_nacional)]);

  // Trayectoria Nacional
  svg.appendChild(createSVGEl('path', {
    d: smoothPath(ptsNat),
    fill: 'none',
    stroke: PANORAMA_NAT,
    'stroke-width': '2.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    opacity: '0.95'
  }));

  // Trayectoria UM (línea verde institucional, más gruesa)
  svg.appendChild(createSVGEl('path', {
    d: smoothPath(ptsUM),
    fill: 'none',
    stroke: PANORAMA_UM,
    'stroke-width': '3.4',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }));

  // Puntos + etiquetas numéricas (UM arriba/abajo según comparativo)
  hist.forEach((pt, idx) => {
    const x = getX(idx);
    const yUM = getY(pt.puntaje_unimag);
    const yNat = getY(pt.puntaje_nacional);
    const umAbove = pt.puntaje_unimag >= pt.puntaje_nacional;

    const cNat = createSVGEl('circle', {
      cx: x, cy: yNat, r: 5,
      fill: PANORAMA_NAT, stroke: '#fff', 'stroke-width': '1.4',
      class: 'chart-dot'
    });
    cNat.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>Nacional (${pt.anio})</strong>${pt.puntaje_nacional} pts`));
    cNat.addEventListener('mousemove', moveTooltip);
    cNat.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(cNat);

    const cUM = createSVGEl('circle', {
      cx: x, cy: yUM, r: 5.5,
      fill: PANORAMA_UM, stroke: '#fff', 'stroke-width': '1.6',
      class: 'chart-dot'
    });
    cUM.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>Unimagdalena (${pt.anio})</strong>${pt.puntaje_unimag} pts${pt.n_unimag ? `<br>Evaluados: ${NUM.format(pt.n_unimag)}` : ''}`));
    cUM.addEventListener('mousemove', moveTooltip);
    cUM.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(cUM);

    // Etiqueta UM
    const lblUM = createSVGEl('text', {
      x: x, y: yUM + (umAbove ? -11 : 19),
      'text-anchor': 'middle',
      style: `font-family: var(--font-display); font-weight: 800; font-size: 13.5px; fill: ${PANORAMA_UM};`
    });
    lblUM.textContent = pt.puntaje_unimag;
    svg.appendChild(lblUM);

    // Etiqueta Nacional
    const lblNat = createSVGEl('text', {
      x: x, y: yNat + (umAbove ? 19 : -11),
      'text-anchor': 'middle',
      style: `font-family: var(--font-display); font-weight: 800; font-size: 13.5px; fill: ${PANORAMA_NAT};`
    });
    lblNat.textContent = pt.puntaje_nacional;
    svg.appendChild(lblNat);
  });

  // Leyenda inferior unificada (con buena separación entre series)
  svg.appendChild(createLegend([
    { color: PANORAMA_UM, text: 'Unimagdalena' },
    { color: PANORAMA_NAT, text: 'Nacional' }
  ], (w / 2) - 160, h - 14, { fontSize: 13, rectW: 20, rectH: 10, gap: 230, textGap: 30, fontWeight: 700 }));

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

/* ---------- G5 NUEVO: Comparativo con universidades del Departamento ---------- */
// Paleta consistente con Panorama: UM en azul institucional, comparativos en verde y naranja
const UNIV_DEPT_COLORS = [
  '#0F4FA8',   // UNIMAGDALENA — azul institucional (igual que en Panorama)
  '#2BA85E',   // U. Sergio Arboleda — verde
  '#FF9400'    // U. Cooperativa de Colombia — naranja
];

function initUnivDeptYearPicker(d) {
  const sel = document.getElementById('selAnioUnivDept');
  if (!sel) return;
  const data = d.universidades_dept_historico || {};
  const years = Object.keys(data).filter(y => Array.isArray(data[y]) && data[y].length > 0);
  if (years.length === 0) return;

  sel.innerHTML = years
    .map(y => parseInt(y, 10))
    .sort((a, b) => b - a)
    .map(y => `<option value="${y}">${y}</option>`)
    .join('');

  const defaultYear = String(d.meta?.anio_vigente ?? years[years.length - 1]);
  sel.value = defaultYear;

  sel.addEventListener('change', () => renderUnivDept(d, parseInt(sel.value, 10)));
}

function renderUnivDept(d, yearOverride) {
  const container = document.getElementById('chartUnivDept');
  if (!container) return;

  const data = d.universidades_dept_historico || {};
  const currentYear = d.meta?.anio_vigente ?? null;
  const targetYear = yearOverride ?? currentYear;
  const univs = data[String(targetYear)] || [];
  if (univs.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Actualizar etiqueta del título
  const lbl = document.getElementById('univDeptYearLbl');
  if (lbl) lbl.textContent = targetYear;

  // Etiquetas amigables de las competencias (mismo mapping del radar)
  const shortComp = (name) => ({
    'RAZONAMIENTO CUANTITATIVO': 'Raz. Cuantitativo',
    'COMPETENCIAS CIUDADANAS': 'Comp. Ciudadanas',
    'COMUNICACIÓN ESCRITA': 'Com. Escrita',
    'LECTURA CRÍTICA': 'Lectura Crítica',
    'INGLÉS': 'Inglés'
  })[name] || name;

  // Construir lista de categorías (5 competencias + Puntaje Global)
  const compNames = (univs[0].competencias || []).map(c => c.competencia);
  const groups = [
    ...compNames.map(n => ({ key: n, label: shortComp(n) })),
    { key: 'GLOBAL', label: 'Puntaje Global' }
  ];

  // Obtener valor de una universidad para una categoría
  const getVal = (univ, groupKey) => {
    if (groupKey === 'GLOBAL') return univ.puntaje_global;
    const c = (univ.competencias || []).find(x => x.competencia === groupKey);
    return c ? c.puntaje : null;
  };

  // Cálculo de rangos
  const allVals = univs.flatMap(u => groups.map(g => getVal(u, g.key))).filter(v => v != null);
  const dataMin = Math.min(...allVals);
  const dataMax = Math.max(...allVals);
  let minVal = Math.floor((dataMin - 10) / 10) * 10;
  let maxVal = Math.ceil((dataMax + 10) / 10) * 10;
  if (minVal < 0) minVal = 0;
  if (maxVal - minVal < 30) maxVal = minVal + 30;

  const w = 900;
  const h = 460;
  const margin = { top: 36, right: 28, bottom: 110, left: 56 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  // Rejilla horizontal con valores múltiplos de 10
  const tickStep = 10;
  const yToPx = v => margin.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;
  for (let v = minVal; v <= maxVal; v += tickStep) {
    const y = yToPx(v);
    svg.appendChild(createSVGEl('line', {
      x1: margin.left, y1: y,
      x2: w - margin.right, y2: y,
      stroke: 'var(--border)',
      'stroke-width': '0.6',
      'stroke-dasharray': '2,4',
      opacity: '0.7'
    }));
    const lbl = createSVGEl('text', {
      x: margin.left - 10, y: y + 4,
      'text-anchor': 'end',
      style: 'font-family: var(--font-display); font-size: 11px; font-weight: 500; fill: var(--text-soft);'
    });
    lbl.textContent = v;
    svg.appendChild(lbl);
  }

  // Línea base
  svg.appendChild(createSVGEl('line', {
    x1: margin.left, y1: margin.top + innerH,
    x2: w - margin.right, y2: margin.top + innerH,
    stroke: 'var(--border)', 'stroke-width': '1'
  }));

  // Geometría de barras agrupadas
  const groupCount = groups.length;
  const groupSlot = innerW / groupCount;
  const barsPerGroup = univs.length;
  const groupPadding = 0.22;
  const barGap = 4;
  const usableWidth = groupSlot * (1 - groupPadding);
  const barW = (usableWidth - (barsPerGroup - 1) * barGap) / barsPerGroup;

  groups.forEach((g, gi) => {
    const groupCenterX = margin.left + groupSlot * (gi + 0.5);
    const groupStartX = groupCenterX - usableWidth / 2;

    univs.forEach((univ, ui) => {
      const val = getVal(univ, g.key);
      if (val == null) return;
      const x = groupStartX + ui * (barW + barGap);
      const y = yToPx(val);
      const barH = (margin.top + innerH) - y;
      const color = UNIV_DEPT_COLORS[ui % UNIV_DEPT_COLORS.length];

      const bar = createSVGEl('rect', {
        x, y, width: barW, height: barH,
        fill: color, rx: 3,
        class: 'chart-bar'
      });
      bar.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>${univ.nombre} (${targetYear})</strong>${g.label}: ${val} pts${univ.n ? `<br>Evaluados: ${NUM.format(univ.n)}` : ''}`));
      bar.addEventListener('mousemove', moveTooltip);
      bar.addEventListener('mouseleave', hideTooltip);
      svg.appendChild(bar);

      // Etiqueta del valor encima de la barra
      const valLbl = createSVGEl('text', {
        x: x + barW / 2, y: y - 4,
        'text-anchor': 'middle',
        style: `font-family: var(--font-display); font-weight: 700; font-size: 11.5px; fill: ${color};`
      });
      valLbl.textContent = val;
      svg.appendChild(valLbl);
    });

    // Etiqueta de la categoría (eje X)
    const groupLabel = g.label;
    const labelLines = groupLabel.split(' ');
    // Si tiene 2 palabras y es largo, partir en 2 líneas
    let lines = [groupLabel];
    if (groupLabel.length > 14 && labelLines.length >= 2) {
      const mid = Math.ceil(labelLines.length / 2);
      lines = [labelLines.slice(0, mid).join(' '), labelLines.slice(mid).join(' ')];
    }
    lines.forEach((line, idx) => {
      const t = createSVGEl('text', {
        x: groupCenterX, y: margin.top + innerH + 20 + idx * 14,
        'text-anchor': 'middle',
        style: 'font-family: var(--font-display); font-size: 11.5px; font-weight: 600; fill: var(--brand-primary-dark);'
      });
      t.textContent = line;
      svg.appendChild(t);
    });
  });

  // Leyenda al pie con las 3 universidades (nombres acortados para que quepan)
  const shortenName = (n) => n
    .replace(/ - Santa Marta\b/i, '')
    .replace(/^Universidad /i, 'U. ')
    .trim();
  const legendItems = univs.map((u, i) => ({
    color: UNIV_DEPT_COLORS[i % UNIV_DEPT_COLORS.length],
    text: shortenName(u.nombre)
  }));
  const gap = 230;
  const legendStartX = (w - (legendItems.length - 1) * gap) / 2 - 50;
  svg.appendChild(createLegend(legendItems, legendStartX, h - 8, {
    fontSize: 12, rectW: 18, rectH: 10, gap, textGap: 24, fontWeight: 700
  }));

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G5 LEGACY (no se renderiza): Comparativo por Departamentos ---------- */
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
