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
    // cache-bust con timestamp para que cada visita lea la última versión del JSON
    const res = await fetch(`data/datos_informe.json?v=${Date.now()}`, { cache: 'no-store' });
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
  initSidebarToggle();
  initSidebarNavTooltip();
  initScrollSpy();
  initSectionReveal();

  // Renderizadores de Gráficos (Etapa 5)
  initRadarYearPicker(d);
  renderRadar(d);
  renderEvolLine(d);
  initSueYearPicker(d);
  renderSueRanking(d);
  initUnivDeptYearPicker(d);
  renderUnivDept(d);
  renderCuadrantes(d);
  renderTrayectoria(d);
  initFacultadYearPicker(d);
  renderFacultades(d);
  renderProgramExplorer(d);
  renderTop10(d);
  initHeatmapYearPicker(d);
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
  const tW = tooltipEl.offsetWidth;
  const tH = tooltipEl.offsetHeight;
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const sx = window.pageXOffset || 0;
  const sy = window.pageYOffset || 0;
  const pad = 12;

  // Por defecto a la derecha del cursor
  let left = e.pageX + 15;
  // Si se sale por la derecha, voltearlo a la izquierda del cursor
  if (left + tW > sx + winW - pad) {
    left = e.pageX - tW - 15;
  }
  // Si todavía se sale por la izquierda, anclar al borde
  if (left < sx + pad) {
    left = sx + pad;
  }

  // Por defecto un poco arriba del cursor
  let top = e.pageY - 15;
  // Si se sale por arriba, bajarlo
  if (top < sy + pad) {
    top = e.pageY + 18;
  }
  // Si se sale por abajo, subirlo
  if (top + tH > sy + winH - pad) {
    top = e.pageY - tH - 15;
  }

  tooltipEl.style.left = left + 'px';
  tooltipEl.style.top = top + 'px';
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
  set('leadPos', um ? `Unimagdalena ocupa la posición ${um.rank} entre las ${d.sue_ranking.length} universidades del SUE evaluadas. Liderando la oferta regional junto a los pares del Caribe.` : '');
  set('leadVA', `Cruzando el perfil de ingreso (Saber 11) con el de egreso (Saber Pro), se observa cuánto aporta la formación. Datos disponibles hasta 2024.`);
  set('leadFac', `Comparativo del desempeño global de las ${d.facultades.length} facultades de la universidad.`);
  set('leadProg', `${sobre} de los ${progs.length} programas evaluados superan el promedio nacional de su grupo de referencia (NBC).`);
  set('leadComp', `Competencias genéricas fuertes y distribución porcentual por niveles de logro frente al país.`);
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
    const lineHeight = 16;
    const startY = ly - ((lines.length - 1) * lineHeight) / 2 + 5;
    lines.forEach((line, idx) => {
      const t = createSVGEl('text', {
        x: lx,
        y: startY + idx * lineHeight,
        'text-anchor': anchor,
        style: 'font-family: var(--font-display); font-weight: 700; font-size: 14px; fill: var(--brand-primary-dark);'
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
  const direction = opts.direction || 'horizontal';   // 'horizontal' | 'vertical'
  const lineHeight = opts.lineHeight || (fontSize + 6);

  const g = createSVGEl('g', { class: 'legend' });
  items.forEach((item, idx) => {
    // En modo vertical apilamos en y; en horizontal distribuimos en x con gap.
    const x = direction === 'vertical' ? startX : startX + idx * gap;
    const y = direction === 'vertical' ? startY + idx * lineHeight : startY;

    // Si item.hollow es true, el marcador se dibuja como contorno discontinuo
    // (mismo estilo que el anillo NBC Nacional en el grafico).
    const rectAttrs = {
      x: x, y: y - rectH, width: rectW, height: rectH, rx: 2,
      fill: item.hollow ? '#fff' : item.color
    };
    if (item.hollow) {
      rectAttrs.stroke = item.color;
      rectAttrs['stroke-width'] = '1.8';
      rectAttrs['stroke-dasharray'] = '2,1.5';
    }
    const rect = createSVGEl('rect', rectAttrs);
    const text = createSVGEl('text', {
      x: x + textGap, y: y - 1,
      style: `font-family: var(--font-display); font-size: ${fontSize}px; font-weight: ${fontWeight}; fill: var(--brand-primary-dark);`
    });
    text.textContent = item.text;
    g.appendChild(rect);
    g.appendChild(text);
  });
  return g;
}

/* ---------- G3: Evolución histórica lineal (Global o por competencia) ---------- */
let activeEvolComp = 'Global';   // 'Global' (default) o nombre canónico de competencia

function initEvolPicker(d) {
  const sel = document.getElementById('selEvolComp');
  if (!sel || sel.options.length > 0) return;

  const hist = d.institucional.historico;
  if (!hist || hist.length === 0) return;
  const comps = (hist[0].competencias || []).map(c => c.competencia);

  // Opciones: Global por defecto, luego las 5 competencias con nombre en title-case
  const options = [{ value: 'Global', label: 'Puntaje global' }];
  comps.forEach(c => options.push({ value: c, label: titleCase(c) }));

  sel.innerHTML = options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
  sel.value = activeEvolComp;

  sel.addEventListener('change', () => {
    activeEvolComp = sel.value;
    renderEvolLine(d);
  });
}

function renderEvolLine(d) {
  const container = document.getElementById('chartEvol');
  if (!container) return;

  const histRaw = d.institucional.historico;
  if (!histRaw || histRaw.length === 0) return;

  // Inicializar selector (idempotente) y derivar la serie según la competencia activa
  initEvolPicker(d);

  let hist;
  if (activeEvolComp === 'Global') {
    hist = histRaw.map(p => ({
      anio: p.anio,
      puntaje_unimag: p.puntaje_unimag,
      puntaje_nacional: p.puntaje_nacional,
      n_unimag: p.n_unimag
    }));
  } else {
    hist = histRaw.map(p => {
      const c = (p.competencias || []).find(x => x.competencia === activeEvolComp);
      return {
        anio: p.anio,
        puntaje_unimag: c?.puntaje_unimag,
        puntaje_nacional: c?.puntaje_nacional,
        n_unimag: c?.n_unimag ?? p.n_unimag
      };
    }).filter(p => p.puntaje_unimag != null && p.puntaje_nacional != null);
  }

  if (hist.length === 0) {
    container.innerHTML = '<div class="placeholder">Sin datos para esta competencia</div>';
    return;
  }

  // Actualizar etiqueta del título (mantenida en sincronía con la tab activa)
  const lbl = document.getElementById('evolCompLbl');
  if (lbl) {
    lbl.textContent = activeEvolComp === 'Global' ? 'Puntaje global' : titleCase(activeEvolComp);
  }

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

/* ---------- G4: Ranking SUE (columnas verticales, filtrable por año) ---------- */
// Paleta SUE: UNIMAGDALENA azul institucional (consistente con todos los otros
// graficos), las demas en verde. SUE_COLOR_CARIBE se conserva como constante por
// si se vuelve a usar pero ya no se aplica (decision del equipo en v2.x).
const SUE_COLOR_UM = '#0F4FA8';
const SUE_COLOR_CARIBE = '#FF9400';
const SUE_COLOR_OTHERS = '#2BA85E';

function initSueYearPicker(d) {
  const sel = document.getElementById('selAnioSue');
  if (!sel) return;
  const hist = d.sue_ranking_historico || {};
  const years = Object.keys(hist).filter(y => Array.isArray(hist[y]) && hist[y].length > 0);
  if (years.length === 0) return;

  sel.innerHTML = years
    .map(y => parseInt(y, 10))
    .sort((a, b) => b - a)
    .map(y => `<option value="${y}">${y}</option>`)
    .join('');

  const defaultYear = String(d.meta?.anio_vigente ?? years[years.length - 1]);
  sel.value = defaultYear;
  sel.addEventListener('change', () => renderSueRanking(d, parseInt(sel.value, 10)));
}

function renderSueRanking(d, yearOverride) {
  const container = document.getElementById('chartSue');
  if (!container) return;

  const hist = d.sue_ranking_historico || {};
  const currentYear = d.meta?.anio_vigente ?? null;
  const targetYear = yearOverride ?? currentYear;
  const data = hist[String(targetYear)] || d.sue_ranking || [];
  if (data.length === 0) return;

  // Actualizar título dinámico
  const lbl = document.getElementById('sueYearLbl');
  if (lbl) lbl.textContent = targetYear;

  // Ordenar por puntaje descendente (ya viene ordenado, pero por seguridad)
  const sorted = [...data].sort((a, b) => b.puntaje - a.puntaje);
  const totalBars = sorted.length;

  const w = 1000;
  const h = 360;
  const margin = { top: 20, right: 24, bottom: 110, left: 50 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const allVals = sorted.map(u => u.puntaje);
  const dataMin = Math.min(...allVals);
  const dataMax = Math.max(...allVals);
  let minVal = Math.floor((dataMin - 8) / 10) * 10;
  let maxVal = Math.ceil((dataMax + 8) / 10) * 10;
  if (minVal < 0) minVal = 0;

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const yToPx = v => margin.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;
  const xToPx = i => {
    const slot = innerW / totalBars;
    return margin.left + slot * (i + 0.5);
  };

  // Rejilla horizontal cada 10 puntos
  const tickStep = 10;
  for (let v = minVal; v <= maxVal; v += tickStep) {
    const y = yToPx(v);
    svg.appendChild(createSVGEl('line', {
      x1: margin.left, y1: y,
      x2: w - margin.right, y2: y,
      stroke: 'var(--border)', 'stroke-width': '0.6',
      'stroke-dasharray': '2,4', opacity: '0.7'
    }));
    const yl = createSVGEl('text', {
      x: margin.left - 10, y: y + 4,
      'text-anchor': 'end',
      style: 'font-family: var(--font-display); font-size: 11px; font-weight: 500; fill: var(--text-soft);'
    });
    yl.textContent = v;
    svg.appendChild(yl);
  }

  // Línea base
  svg.appendChild(createSVGEl('line', {
    x1: margin.left, y1: margin.top + innerH,
    x2: w - margin.right, y2: margin.top + innerH,
    stroke: 'var(--border)', 'stroke-width': '1'
  }));

  // Geometría de barras
  const slot = innerW / totalBars;
  const barW = Math.max(8, slot * 0.7);

  sorted.forEach((univ, i) => {
    const x = xToPx(i) - barW / 2;
    const y = yToPx(univ.puntaje);
    const barH = (margin.top + innerH) - y;

    // Solo Unimagdalena se resalta (verde). El resto, incluyendo las del Caribe,
    // van con el azul institucional. (Decision del equipo: ya no se destacan las
    // del Caribe porque no aportan al analisis institucional.)
    let color = SUE_COLOR_OTHERS;
    if (univ.es_unimagdalena) color = SUE_COLOR_UM;

    const rect = createSVGEl('rect', {
      x, y, width: barW, height: barH,
      fill: color, rx: 3,
      class: 'chart-bar'
    });
    rect.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>${univ.nombre}</strong>Posición: ${univ.rank} de ${totalBars}<br>Puntaje global: ${univ.puntaje} pts<br>Evaluados: ${NUM.format(univ.n)}`));
    rect.addEventListener('mousemove', moveTooltip);
    rect.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(rect);

    // Etiqueta del puntaje encima de la barra
    const vlbl = createSVGEl('text', {
      x: x + barW / 2, y: y - 5,
      'text-anchor': 'middle',
      style: `font-family: var(--font-display); font-weight: 700; font-size: ${univ.es_unimagdalena ? '12.5px' : '11px'}; fill: ${univ.es_unimagdalena ? color : 'var(--brand-primary-dark)'};`
    });
    vlbl.textContent = Math.round(univ.puntaje);
    svg.appendChild(vlbl);

    // Etiqueta debajo (abreviatura), rotada 45° para que quepan todas
    const xlbl = createSVGEl('text', {
      x: xToPx(i),
      y: margin.top + innerH + 14,
      'text-anchor': 'end',
      transform: `rotate(-45, ${xToPx(i)}, ${margin.top + innerH + 14})`,
      style: `font-family: var(--font-display); font-size: 10.5px; font-weight: ${univ.es_unimagdalena ? '700' : '500'}; fill: ${univ.es_unimagdalena ? color : 'var(--brand-primary-dark)'};`
    });
    xlbl.textContent = univ.abrev || univ.nombre;
    svg.appendChild(xlbl);
  });

  // Leyenda inferior con 2 categorías (sin Region Caribe).
  svg.appendChild(createLegend([
    { color: SUE_COLOR_UM, text: 'Unimagdalena' },
    { color: SUE_COLOR_OTHERS, text: 'Otras del SUE' }
  ], (w / 2) - 140, h - 10, {
    fontSize: 11.5, rectW: 18, rectH: 9, gap: 180, textGap: 24, fontWeight: 700
  }));

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

  // Cálculo de rangos: padding pequeño para que las barras llenen el chart
  const allVals = univs.flatMap(u => groups.map(g => getVal(u, g.key))).filter(v => v != null);
  const dataMin = Math.min(...allVals);
  const dataMax = Math.max(...allVals);
  let minVal = Math.floor((dataMin - 4) / 5) * 5;
  let maxVal = Math.ceil((dataMax + 4) / 5) * 5;
  if (minVal < 0) minVal = 0;
  if (maxVal - minVal < 25) maxVal = minVal + 25;

  const w = 900;
  const h = 360;
  const margin = { top: 20, right: 24, bottom: 90, left: 50 };
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

let activeNbcCuadrante = 'TODOS';  // 'TODOS' o nombre clean del NBC

function renderCuadrantes(d) {
  const select = document.getElementById('selAnioCuadrante');
  const selectNbc = document.getElementById('selNbcCuadrante');
  const container = document.getElementById('chartCuadrantes');
  if (!container) return;

  const dataYearKeys = Object.keys(d.cuadrantes_por_anio || {}).filter(yr => yr >= '2020' && yr <= '2024').sort();
  if (dataYearKeys.length === 0) return;

  // Poblar selector de año (más recientes primero)
  if (select && select.children.length === 0) {
    [...dataYearKeys].reverse().forEach(yr => {
      const opt = document.createElement('option');
      opt.value = yr;
      opt.textContent = yr;
      if (yr === activeYearCuadrante) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      activeYearCuadrante = e.target.value;
      populateNbcCuadrantePicker(d);   // refrescar NBCs disponibles para ese año
      drawCuadrantePlot(d);
    });
  }

  // Poblar selector de NBC para el año vigente
  populateNbcCuadrantePicker(d);

  drawCuadrantePlot(d);
}

function populateNbcCuadrantePicker(d) {
  const sel = document.getElementById('selNbcCuadrante');
  if (!sel) return;
  const yrData = d.cuadrantes_por_anio?.[activeYearCuadrante];
  const nbcs = (yrData?.nbcs_unimag || []).map(n => n.nbc).sort();

  // Mantener la selección si todavía está disponible en el año nuevo
  const prevValue = sel.value || activeNbcCuadrante;

  sel.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = 'TODOS';
  optAll.textContent = 'Todos los NBC';
  sel.appendChild(optAll);
  nbcs.forEach(nbc => {
    const opt = document.createElement('option');
    opt.value = nbc;
    // Mostrar nombre en title-case para mejor lectura
    opt.textContent = titleCase(nbc);
    sel.appendChild(opt);
  });

  if (prevValue && [...sel.options].some(o => o.value === prevValue)) {
    sel.value = prevValue;
    activeNbcCuadrante = prevValue;
  } else {
    sel.value = 'TODOS';
    activeNbcCuadrante = 'TODOS';
  }

  // Evento (idempotente: clonar para evitar listeners duplicados)
  const fresh = sel.cloneNode(true);
  sel.parentNode.replaceChild(fresh, sel);
  fresh.addEventListener('change', () => {
    activeNbcCuadrante = fresh.value;
    drawCuadrantePlot(d);
  });
}

function drawCuadrantePlot(d) {
  const container = document.getElementById('chartCuadrantes');
  const yrData = d.cuadrantes_por_anio[activeYearCuadrante];
  if (!yrData) return;

  // Actualizar etiqueta del año en el título
  const lbl = document.getElementById('cuadranteYearLbl');
  if (lbl) lbl.textContent = activeYearCuadrante;

  const w = 1000;
  const h = 440;
  const margin = { top: 28, right: 28, bottom: 100, left: 68 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  // Rango basado en datos reales del año
  const allInst = yrData.instituciones || [];
  const allSb11 = allInst.map(i => i.sb11);
  const allSbpro = allInst.map(i => i.sbpro);
  const xMean = yrData.limites.x_mean;
  const yMean = yrData.limites.y_mean;

  const xMin = Math.floor((Math.min(...allSb11, xMean) - 5) / 20) * 20;
  const xMax = Math.ceil((Math.max(...allSb11, xMean) + 5) / 20) * 20;
  const yMin = Math.floor((Math.min(...allSbpro, yMean) - 5) / 25) * 25;
  const yMax = Math.ceil((Math.max(...allSbpro, yMean) + 5) / 25) * 25;

  const getX = v => margin.left + ((v - xMin) / (xMax - xMin)) * innerW;
  const getY = v => margin.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const xMid = getX(xMean);
  const yMid = getY(yMean);

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  // Fondos coloreados de los 4 cuadrantes
  const fillQ = (x, y, ww, hh, color, opacity) => svg.appendChild(createSVGEl('rect', {
    x, y, width: ww, height: hh, fill: color, opacity
  }));
  fillQ(margin.left, margin.top, xMid - margin.left, yMid - margin.top, VA_COLORS.aporte, 0.10);
  fillQ(xMid, margin.top, w - margin.right - xMid, yMid - margin.top, VA_COLORS.desempeno, 0.08);
  fillQ(margin.left, yMid, xMid - margin.left, margin.top + innerH - yMid, VA_COLORS.base, 0.06);
  fillQ(xMid, yMid, w - margin.right - xMid, margin.top + innerH - yMid, VA_COLORS.alerta, 0.10);

  // Rejilla
  const xStep = 20, yStep = 25;
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
    const y = getY(v);
    svg.appendChild(createSVGEl('line', {
      x1: margin.left, y1: y, x2: w - margin.right, y2: y,
      stroke: 'var(--border)', 'stroke-width': '0.5',
      'stroke-dasharray': '2,4', opacity: '0.5'
    }));
    const lbl = createSVGEl('text', {
      x: margin.left - 10, y: y + 4, 'text-anchor': 'end',
      style: 'font-family: var(--font-display); font-size: 11px; font-weight: 500; fill: var(--text-soft);'
    });
    lbl.textContent = v;
    svg.appendChild(lbl);
  }
  for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax; v += xStep) {
    const x = getX(v);
    svg.appendChild(createSVGEl('line', {
      x1: x, y1: margin.top, x2: x, y2: margin.top + innerH,
      stroke: 'var(--border)', 'stroke-width': '0.5',
      'stroke-dasharray': '2,4', opacity: '0.5'
    }));
    const lbl = createSVGEl('text', {
      x, y: margin.top + innerH + 20, 'text-anchor': 'middle',
      style: 'font-family: var(--font-display); font-size: 11px; font-weight: 500; fill: var(--text-soft);'
    });
    lbl.textContent = v;
    svg.appendChild(lbl);
  }

  // Líneas de media (cruz)
  svg.appendChild(createSVGEl('line', {
    x1: xMid, y1: margin.top, x2: xMid, y2: margin.top + innerH,
    stroke: VA_COLORS.desempeno, 'stroke-width': '1.2', 'stroke-dasharray': '5,4', opacity: '0.55'
  }));
  svg.appendChild(createSVGEl('line', {
    x1: margin.left, y1: yMid, x2: w - margin.right, y2: yMid,
    stroke: VA_COLORS.desempeno, 'stroke-width': '1.2', 'stroke-dasharray': '5,4', opacity: '0.55'
  }));

  // Etiquetas de cuadrante en las esquinas
  const quadLabel = (txt, x, y, color, anchor) => {
    const t = createSVGEl('text', {
      x, y, 'text-anchor': anchor,
      style: `font-family: var(--font-display); font-weight: 700; font-size: 13px; fill: ${color};`
    });
    t.textContent = txt;
    svg.appendChild(t);
  };
  quadLabel('Alto aporte',    margin.left + 10, margin.top + 18, VA_COLORS.aporte, 'start');
  quadLabel('Alto desempeño', w - margin.right - 10, margin.top + 18, VA_COLORS.desempeno, 'end');
  quadLabel('Base baja',      margin.left + 10, margin.top + innerH - 10, VA_COLORS.base, 'start');
  quadLabel('Alerta',         w - margin.right - 10, margin.top + innerH - 10, VA_COLORS.alerta, 'end');

  // Título del eje X (entre los números y la leyenda)
  const axTitleX = createSVGEl('text', {
    x: margin.left + innerW / 2, y: h - 50, 'text-anchor': 'middle',
    style: 'font-family: var(--font-display); font-weight: 700; font-size: 12.5px; fill: var(--brand-primary-dark);'
  });
  axTitleX.textContent = 'Saber 11 (Perfil de Entrada)';
  svg.appendChild(axTitleX);
  const axTitleY = createSVGEl('text', {
    x: 22, y: margin.top + innerH / 2, 'text-anchor': 'middle',
    transform: `rotate(-90, 22, ${margin.top + innerH / 2})`,
    style: 'font-family: var(--font-display); font-weight: 700; font-size: 12.5px; fill: var(--brand-primary-dark);'
  });
  axTitleY.textContent = 'Saber Pro (Desempeño de Salida)';
  svg.appendChild(axTitleY);

  // Filtro NBC activo: si esta seleccionado un NBC especifico, ocultamos TODO
  // lo demas (otras IES, universidades del depto, otros NBCs). Solo dejamos
  // visibles el NBC seleccionado + el punto de Unimagdalena + la referencia
  // nacional (cruz de medias + cuadrantes de fondo + grid).
  const filtroNbc = activeNbcCuadrante && activeNbcCuadrante !== 'TODOS' ? activeNbcCuadrante : null;

  // Otras IES — TODAS las instituciones distintas de Unimagdalena (incluyendo
  // Sergio Arboleda y Cooperativa de Santa Marta) se dibujan en gris suave como
  // contexto. Decision del equipo: ya no se resaltan las universidades del depto
  // del Magdalena con color naranja porque no aportan al analisis institucional.
  // Si hay filtro NBC activo, NO se dibujan (vista limpia: solo NBC + UM + nacional).
  const otrasIES = filtroNbc ? [] : (yrData.instituciones || []).filter(ies =>
    ies.nombre !== 'UNIVERSIDAD DEL MAGDALENA'
  );
  otrasIES.forEach(ies => {
    const c = createSVGEl('circle', {
      cx: getX(ies.sb11), cy: getY(ies.sbpro), r: 4,
      fill: VA_COLORS.base, 'fill-opacity': '0.32',
      stroke: 'var(--border)', 'stroke-width': '0.4'
    });
    c.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>${ies.nombre}</strong>Saber 11: ${ies.sb11}<br>Saber Pro: ${ies.sbpro}<br>n: ${NUM.format(ies.n)}<br>Cuadrante: ${ies.cuadrante}`));
    c.addEventListener('mousemove', moveTooltip);
    c.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(c);
  });

  // NBCs de Unimagdalena (verde solido). Con filtro activo solo se dibuja el
  // NBC seleccionado; los demas no aparecen (vista limpia).
  (yrData.nbcs_unimag || []).forEach(nbc => {
    const seleccionado = !filtroNbc || nbc.nbc === filtroNbc;
    if (filtroNbc && !seleccionado) return;
    const c = createSVGEl('circle', {
      cx: getX(nbc.sb11), cy: getY(nbc.sbpro),
      r: 7,
      fill: VA_COLORS.aporte,
      'fill-opacity': '1',
      stroke: '#fff', 'stroke-width': '1.6',
      class: 'chart-dot'
    });
    c.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>NBC Unimagdalena: ${nbc.nbc}</strong>Saber 11: ${nbc.sb11}<br>Saber Pro: ${nbc.sbpro}<br>n: ${NUM.format(nbc.n)}<br>Cuadrante: ${nbc.cuadrante}`));
    c.addEventListener('mousemove', moveTooltip);
    c.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(c);

    // Si hay filtro activo y este es el NBC seleccionado, mostrar etiqueta con su nombre
    if (filtroNbc && seleccionado) {
      const lbl = createSVGEl('text', {
        x: getX(nbc.sb11), y: getY(nbc.sbpro) - 14, 'text-anchor': 'middle',
        style: `font-family: var(--font-display); font-weight: 800; font-size: 12px; fill: ${VA_COLORS.aporte};`
      });
      lbl.textContent = titleCase(nbc.nbc);
      svg.appendChild(lbl);
    }
  });

  // NBC nacional (referencia): mismo NBC pero promediado a nivel pais. Se dibuja
  // SOLIDO en naranja (VA_COLORS.alerta) para que tenga maxima visibilidad y
  // contraste contra el verde de Unimag NBC y el azul de Unimagdalena. Solo
  // aparece cuando hay un filtro NBC activo (para hacer la comparacion 1 a 1).
  if (filtroNbc) {
    const nbcNac = (yrData.nbcs_nacional || []).find(n => n.nbc === filtroNbc);
    if (nbcNac && nbcNac.sb11 != null && nbcNac.sbpro != null) {
      const nacX = getX(nbcNac.sb11);
      const nacY = getY(nbcNac.sbpro);
      const nacDot = createSVGEl('circle', {
        cx: nacX, cy: nacY, r: 8,
        fill: VA_COLORS.alerta,
        stroke: '#fff', 'stroke-width': '2',
        class: 'chart-dot',
        style: 'filter: drop-shadow(0 1.5px 3px rgba(0,0,0,0.18));'
      });
      nacDot.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>NBC Nacional: ${nbcNac.nbc}</strong>(Promedio nacional de IES que ofrecen este NBC)<br>Saber 11: ${nbcNac.sb11}<br>Saber Pro: ${nbcNac.sbpro}<br>n: ${NUM.format(nbcNac.n)}<br>Cuadrante: ${nbcNac.cuadrante}`));
      nacDot.addEventListener('mousemove', moveTooltip);
      nacDot.addEventListener('mouseleave', hideTooltip);
      svg.appendChild(nacDot);

      // Etiqueta "Nacional" para identificar el punto
      const nacLbl = createSVGEl('text', {
        x: nacX, y: nacY + 22, 'text-anchor': 'middle',
        style: `font-family: var(--font-display); font-weight: 700; font-size: 11px; fill: ${VA_COLORS.alerta}; letter-spacing: .05em;`
      });
      nacLbl.textContent = 'Nacional';
      svg.appendChild(nacLbl);
    }
  }

  // Unimagdalena (azul institucional, destacado)
  const umGlobal = (yrData.instituciones || []).find(ies => ies.nombre === 'UNIVERSIDAD DEL MAGDALENA');
  if (umGlobal) {
    const umX = getX(umGlobal.sb11);
    const umY = getY(umGlobal.sbpro);

    const star = createSVGEl('circle', {
      cx: umX, cy: umY, r: 11,
      fill: VA_COLORS.desempeno, stroke: '#fff', 'stroke-width': '2.5',
      class: 'chart-dot',
      style: 'filter: drop-shadow(0 2px 5px rgba(0,0,0,0.22));'
    });

    // Decidir si mostrar la etiqueta "Unimagdalena":
    // Cuando hay un NBC seleccionado y su punto está muy cerca del de Unimagdalena
    // ocultamos esta etiqueta para no estorbar al nombre del NBC (que es la prioridad
    // del filtro). Umbral: 35px (en coordenadas del viewBox del SVG).
    let mostrarEtiquetaUM = true;
    if (filtroNbc) {
      const nbcSel = (yrData.nbcs_unimag || []).find(n => n.nbc === filtroNbc);
      if (nbcSel) {
        const dx = getX(nbcSel.sb11) - umX;
        const dy = getY(nbcSel.sbpro) - umY;
        if (Math.hypot(dx, dy) < 35) mostrarEtiquetaUM = false;
      }
    }
    if (mostrarEtiquetaUM) {
      const tag = createSVGEl('text', {
        x: umX, y: umY - 18, 'text-anchor': 'middle',
        style: `font-family: var(--font-display); font-weight: 800; font-size: 13px; fill: ${VA_COLORS.desempeno};`
      });
      tag.textContent = 'Unimagdalena';
      svg.appendChild(tag);
    }
    star.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>Unimagdalena</strong>Saber 11 (Entrada): ${umGlobal.sb11} pts<br>Saber Pro (Salida): ${umGlobal.sbpro} pts<br>Muestra cruzada: ${NUM.format(umGlobal.n)}<br>Cuadrante: ${umGlobal.cuadrante}`));
    star.addEventListener('mousemove', moveTooltip);
    star.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(star);
  }

  // Leyenda al pie del card. Cuando hay un filtro NBC activo agregamos el item
  // 'NBC Nacional' (naranja solido) para que el lector entienda que ese punto
  // es el promedio del mismo NBC a nivel pais (referencia comparativa).
  const legendItems = filtroNbc
    ? [
        { color: VA_COLORS.desempeno, text: 'Unimagdalena' },
        { color: VA_COLORS.aporte, text: 'NBC Unimagdalena' },
        { color: VA_COLORS.alerta, text: 'NBC Nacional' }
      ]
    : [
        { color: VA_COLORS.desempeno, text: 'Unimagdalena' },
        { color: VA_COLORS.aporte, text: 'NBC Unimagdalena' },
        { color: VA_COLORS.base, text: 'Otras IES' }
      ];
  svg.appendChild(createLegend(legendItems, (w / 2) - 240, h - 14, {
    fontSize: 11.5, rectW: 16, rectH: 9, gap: 188, textGap: 22, fontWeight: 700
  }));

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G7: Trayectoria de Valor Agregado (rediseñada) ---------- */
const VA_COLORS = {
  desempeno: '#0F4FA8',   // azul institucional
  aporte:    '#2BA85E',   // verde
  base:      '#8295AB',   // gris
  alerta:    '#D17900',   // naranja oscuro
  arrow:     '#D17900',   // flechas y línea de trayectoria UM
  point:     '#D17900'    // punto UM en la trayectoria
};

function renderTrayectoria(d) {
  const container = document.getElementById('chartTrayectoria');
  if (!container) return;

  const traj = d.trayectoria_unimag;
  if (!traj || !traj.puntos || traj.puntos.length === 0) return;

  // Filtrar a 2020-2024
  const points = traj.puntos.filter(pt => pt.anio >= 2020 && pt.anio <= 2024).sort((a,b) => a.anio - b.anio);
  if (points.length === 0) return;

  const w = 900;
  const h = 420;
  const margin = { top: 40, right: 70, bottom: 60, left: 70 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  // Rangos auto a partir de los datos + medias, con padding
  const xMean = traj.limites.x_mean;
  const yMean = traj.limites.y_mean;
  const xs = points.map(p => p.sb11).concat([xMean]);
  const ys = points.map(p => p.sbpro).concat([yMean]);
  const xPadL = Math.max(6, Math.ceil((Math.max(...xs) - Math.min(...xs)) * 0.4));
  const yPadL = Math.max(3, Math.ceil((Math.max(...ys) - Math.min(...ys)) * 0.6));
  const xMin = Math.floor((Math.min(...xs) - xPadL) / 5) * 5;
  const xMax = Math.ceil((Math.max(...xs) + xPadL) / 5) * 5;
  const yMin = Math.floor((Math.min(...ys) - yPadL) / 2.5) * 2.5;
  const yMax = Math.ceil((Math.max(...ys) + yPadL) / 2.5) * 2.5;

  const getX = v => margin.left + ((v - xMin) / (xMax - xMin)) * innerW;
  const getY = v => margin.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  // Fondos coloreados por cuadrante
  const xMid = getX(xMean);
  const yMid = getY(yMean);
  const fillQ = (x, y, ww, hh, color, opacity) => svg.appendChild(createSVGEl('rect', {
    x, y, width: ww, height: hh, fill: color, opacity
  }));
  fillQ(margin.left, margin.top, xMid - margin.left, yMid - margin.top, VA_COLORS.aporte, 0.10);     // top-left: Alto aporte
  fillQ(xMid, margin.top, w - margin.right - xMid, yMid - margin.top, VA_COLORS.desempeno, 0.08);    // top-right: Alto desempeño
  fillQ(margin.left, yMid, xMid - margin.left, margin.top + innerH - yMid, VA_COLORS.base, 0.06);    // bottom-left: Base baja
  fillQ(xMid, yMid, w - margin.right - xMid, margin.top + innerH - yMid, VA_COLORS.alerta, 0.10);    // bottom-right: Alerta

  // Rejilla suave
  for (let v = Math.ceil(yMin / 2.5) * 2.5; v <= yMax; v += 2.5) {
    const y = getY(v);
    svg.appendChild(createSVGEl('line', {
      x1: margin.left, y1: y, x2: w - margin.right, y2: y,
      stroke: 'var(--border)', 'stroke-width': '0.5',
      'stroke-dasharray': '2,4', opacity: '0.6'
    }));
  }
  for (let v = Math.ceil(xMin / 5) * 5; v <= xMax; v += 5) {
    const x = getX(v);
    svg.appendChild(createSVGEl('line', {
      x1: x, y1: margin.top, x2: x, y2: margin.top + innerH,
      stroke: 'var(--border)', 'stroke-width': '0.5',
      'stroke-dasharray': '2,4', opacity: '0.6'
    }));
  }

  // Líneas de la media (dasheadas, color institucional)
  svg.appendChild(createSVGEl('line', {
    x1: xMid, y1: margin.top, x2: xMid, y2: margin.top + innerH,
    stroke: VA_COLORS.desempeno, 'stroke-width': '1.2', 'stroke-dasharray': '5,4', opacity: '0.65'
  }));
  svg.appendChild(createSVGEl('line', {
    x1: margin.left, y1: yMid, x2: w - margin.right, y2: yMid,
    stroke: VA_COLORS.desempeno, 'stroke-width': '1.2', 'stroke-dasharray': '5,4', opacity: '0.65'
  }));

  // Etiquetas con el valor de la media
  svg.appendChild((() => {
    const t = createSVGEl('text', {
      x: xMid, y: margin.top - 12, 'text-anchor': 'middle',
      style: `font-family: var(--font-display); font-weight: 700; font-size: 11px; fill: ${VA_COLORS.desempeno};`
    });
    t.textContent = xMean.toFixed(1);
    return t;
  })());
  svg.appendChild((() => {
    const t = createSVGEl('text', {
      x: w - margin.right + 8, y: yMid + 4, 'text-anchor': 'start',
      style: `font-family: var(--font-display); font-weight: 700; font-size: 11px; fill: ${VA_COLORS.desempeno};`
    });
    t.textContent = yMean.toFixed(1);
    return t;
  })());

  // Etiquetas de cuadrante (esquinas)
  const quadLabel = (txt, x, y, color, anchor) => {
    const t = createSVGEl('text', {
      x, y, 'text-anchor': anchor,
      style: `font-family: var(--font-display); font-weight: 700; font-size: 13px; fill: ${color};`
    });
    t.textContent = txt;
    svg.appendChild(t);
  };
  quadLabel('Alto aporte',    margin.left + 8, margin.top + 14, VA_COLORS.aporte, 'start');
  quadLabel('Alto desempeño', w - margin.right - 8, margin.top + 14, VA_COLORS.desempeno, 'end');
  quadLabel('Base baja',      margin.left + 8, margin.top + innerH - 8, VA_COLORS.base, 'start');
  quadLabel('Alerta',         w - margin.right - 8, margin.top + innerH - 8, VA_COLORS.alerta, 'end');

  // Ejes X e Y con sus números
  for (let v = Math.ceil(xMin / 5) * 5; v <= xMax; v += 5) {
    const x = getX(v);
    const tl = createSVGEl('text', {
      x, y: margin.top + innerH + 20, 'text-anchor': 'middle',
      style: 'font-family: var(--font-display); font-size: 11px; font-weight: 500; fill: var(--text-soft);'
    });
    tl.textContent = v;
    svg.appendChild(tl);
  }
  for (let v = Math.ceil(yMin / 2.5) * 2.5; v <= yMax; v += 2.5) {
    const y = getY(v);
    const tl = createSVGEl('text', {
      x: margin.left - 10, y: y + 4, 'text-anchor': 'end',
      style: 'font-family: var(--font-display); font-size: 11px; font-weight: 500; fill: var(--text-soft);'
    });
    tl.textContent = (v % 1 === 0) ? v.toFixed(0) : v.toFixed(1);
    svg.appendChild(tl);
  }

  // Títulos de ejes
  const axTitleX = createSVGEl('text', {
    x: margin.left + innerW / 2, y: h - 16, 'text-anchor': 'middle',
    style: 'font-family: var(--font-display); font-weight: 700; font-size: 12.5px; fill: var(--brand-primary-dark);'
  });
  axTitleX.textContent = 'Promedio Saber 11 (Entrada)';
  svg.appendChild(axTitleX);
  const axTitleY = createSVGEl('text', {
    x: 20, y: margin.top + innerH / 2, 'text-anchor': 'middle',
    transform: `rotate(-90, 20, ${margin.top + innerH / 2})`,
    style: 'font-family: var(--font-display); font-weight: 700; font-size: 12.5px; fill: var(--brand-primary-dark);'
  });
  axTitleY.textContent = 'Promedio Saber Pro (Salida)';
  svg.appendChild(axTitleY);

  // Definir marker para las flechas
  const defs = createSVGEl('defs');
  const marker = createSVGEl('marker', {
    id: 'arrowHead', viewBox: '0 0 10 10', refX: '8', refY: '5',
    markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse'
  });
  const arrowPath = createSVGEl('path', {
    d: 'M 0 0 L 10 5 L 0 10 z', fill: VA_COLORS.arrow
  });
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // Trayectoria: segmentos dasheados con flecha entre puntos consecutivos
  for (let i = 0; i < points.length - 1; i++) {
    const x1 = getX(points[i].sb11);
    const y1 = getY(points[i].sbpro);
    const x2 = getX(points[i + 1].sb11);
    const y2 = getY(points[i + 1].sbpro);
    // Recortamos el segmento para que no toque los círculos
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len, uy = dy / len;
    const r = 10; // radio del círculo
    const sx = x1 + ux * r, sy = y1 + uy * r;
    const ex = x2 - ux * r, ey = y2 - uy * r;

    svg.appendChild(createSVGEl('line', {
      x1: sx, y1: sy, x2: ex, y2: ey,
      stroke: VA_COLORS.arrow, 'stroke-width': '2.2',
      'stroke-dasharray': '6,4',
      'marker-end': 'url(#arrowHead)'
    }));
  }

  // Pre-calcular coordenadas en píxeles de cada punto (para anti-colisión)
  const ptPx = points.map(pt => ({ x: getX(pt.sb11), y: getY(pt.sbpro) }));

  // Puntos con etiquetas posicionadas en la dirección opuesta al vecino más cercano
  points.forEach((pt, idx) => {
    const { x, y } = ptPx[idx];

    // Encontrar el vecino más cercano en píxeles
    let minDist = Infinity;
    let neighborAngle = Math.PI / 2; // por defecto: vecino imaginario abajo → label irá arriba
    for (let j = 0; j < ptPx.length; j++) {
      if (j === idx) continue;
      const dx = ptPx[j].x - x;
      const dy = ptPx[j].y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        neighborAngle = Math.atan2(dy, dx);
      }
    }
    // Dirección de la etiqueta: opuesta al vecino
    const labelAngle = neighborAngle + Math.PI;
    const cosA = Math.cos(labelAngle);
    const sinA = Math.sin(labelAngle);

    // Posición de la etiqueta del año (alejada del vecino más cercano)
    const yearDist = 22;
    const yx = x + cosA * yearDist;
    const yy = y + sinA * yearDist + 4;   // +4 = corrección visual para baseline del texto

    // Círculo del punto
    const circle = createSVGEl('circle', {
      cx: x, cy: y, r: 9,
      fill: VA_COLORS.point, stroke: '#fff', 'stroke-width': '2.2',
      class: 'chart-dot'
    });
    circle.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>Año ${pt.anio}</strong>Saber 11: ${pt.sb11.toFixed(1)} pts<br>Saber Pro: ${pt.sbpro.toFixed(1)} pts<br>Evaluados: ${NUM.format(pt.n)}<br>Cuadrante: ${pt.cuadrante_anual}`));
    circle.addEventListener('mousemove', moveTooltip);
    circle.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(circle);

    // Solo el año (las coordenadas se muestran al hover)
    const yrLbl = createSVGEl('text', {
      x: yx, y: yy, 'text-anchor': 'middle',
      style: `font-family: var(--font-display); font-weight: 800; font-size: 14px; fill: ${VA_COLORS.aporte};`
    });
    yrLbl.textContent = pt.anio;
    svg.appendChild(yrLbl);
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G8: Desempeño por facultad (filtrable por año, color por barra) ---------- */
// Paleta de 6 colores distintos, ordenados de forma que destaquen barras adyacentes
const FAC_PALETTE = [
  '#0F4FA8',   // azul institucional
  '#2BA85E',   // verde
  '#D17900',   // naranja oscuro
  '#FF9400',   // naranja vivo
  '#5C8AC3',   // azul medio
  '#8295AB'    // gris azulado
];

// Selector de competencia: 'global' o el nombre canónico de una competencia genérica
let activeFacultadComp = 'global';

// Etiquetas cortas para los tabs (caben mejor)
const COMP_SHORT_LABEL = {
  'LECTURA CRÍTICA': 'Lectura Crítica',
  'RAZONAMIENTO CUANTITATIVO': 'Raz. Cuantitativo',
  'COMPETENCIAS CIUDADANAS': 'Ciudadanas',
  'COMUNICACIÓN ESCRITA': 'Com. Escrita',
  'INGLÉS': 'Inglés'
};

function initFacultadYearPicker(d) {
  const selY = document.getElementById('selAnioFacultad');
  const tabsEl = document.getElementById('facultadCompTabs');

  // Selector de año
  if (selY) {
    const hist = d.facultades_historico || {};
    const years = Object.keys(hist).filter(y => Array.isArray(hist[y]) && hist[y].length > 0);
    if (years.length > 0) {
      selY.innerHTML = years
        .map(y => parseInt(y, 10))
        .sort((a, b) => b - a)
        .map(y => `<option value="${y}">${y}</option>`)
        .join('');
      const defaultYear = String(d.meta?.anio_vigente ?? years[years.length - 1]);
      selY.value = defaultYear;
      selY.addEventListener('change', () => renderFacultades(d, parseInt(selY.value, 10)));
    }
  }

  // Tabs de competencia (Global + las 5 genéricas)
  if (tabsEl) {
    const facsSample = (d.facultades && d.facultades.length > 0) ? d.facultades[0] : null;
    const comps = facsSample && Array.isArray(facsSample.competencias)
      ? facsSample.competencias.map(c => c.competencia)
      : [];
    const opciones = [
      { value: 'global', label: 'Global' },
      ...comps.map(c => ({ value: c, label: COMP_SHORT_LABEL[c] || titleCase(c) }))
    ];

    tabsEl.innerHTML = opciones.map(o => {
      const isActive = o.value === activeFacultadComp;
      return `<button type="button" class="tab-btn ${isActive ? 'is-active' : ''}" data-comp="${o.value}">${o.label}</button>`;
    }).join('');

    tabsEl.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFacultadComp = btn.dataset.comp;
        tabsEl.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('is-active', b === btn));
        const yr = selY ? parseInt(selY.value, 10) : (d.meta?.anio_vigente ?? null);
        renderFacultades(d, yr);
      });
    });
  }
}

function titleCase(s) {
  if (!s) return '';
  // Convertir a minúsculas y capitalizar solo la primera letra de cada palabra,
  // preservando los acentos que ya vienen en el dato fuente.
  return s.toLowerCase()
    .split(' ')
    .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(' ');
}

function renderFacultades(d, yearOverride) {
  const container = document.getElementById('chartFacultades');
  if (!container) return;

  const currentYear = d.meta?.anio_vigente ?? null;
  const targetYear = yearOverride ?? currentYear;
  const hist = d.facultades_historico || {};
  const yearData = hist[String(targetYear)] || [];

  // Para el año vigente preferimos d.facultades (más fiable, ya validado)
  let dataset = yearData;
  if (targetYear === currentYear && Array.isArray(d.facultades) && d.facultades.length > 0) {
    dataset = d.facultades;
  }
  if (!dataset || dataset.length === 0) return;

  // Extraer el valor según la competencia activa
  const compKey = activeFacultadComp || 'global';
  const valueOf = (fac) => {
    if (compKey === 'global') return fac.puntaje_global;
    const c = (fac.competencias || []).find(c => c.competencia === compKey);
    return c ? c.puntaje : null;
  };
  // Filtrar facultades que no tienen valor para esa competencia (n=0)
  const dataWithValue = dataset.filter(f => valueOf(f) != null);
  if (dataWithValue.length === 0) return;

  // Actualizar etiquetas del título
  const lbl = document.getElementById('facultadYearLbl');
  if (lbl) lbl.textContent = targetYear;
  const lblComp = document.getElementById('facultadCompLbl');
  if (lblComp) lblComp.textContent = compKey === 'global' ? 'Puntaje global' : titleCase(compKey);

  const sortedFacs = [...dataWithValue].sort((a, b) => valueOf(b) - valueOf(a));

  const w = 1000;
  const h = 400;
  const margin = { top: 14, right: 60, bottom: 32, left: 240 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  // Escala dinamica: el eje X empieza con un margen amplio debajo del valor
  // minimo para que la facultad con menor puntaje no aparezca con una barra
  // diminuta. Floor en 100 (limite inferior de la escala Saber Pro).
  const vals = sortedFacs.map(f => valueOf(f));
  const dataMin = Math.min(...vals);
  const dataMax = Math.max(...vals);
  let minVal = Math.floor((dataMin - 35) / 10) * 10;
  if (minVal < 100) minVal = 100;
  let maxVal = Math.ceil((dataMax + 6) / 5) * 5;
  if (maxVal - minVal < 20) maxVal = minVal + 20;

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const totalBars = sortedFacs.length;
  const slot = innerH / totalBars;
  const barH = slot * 0.62;

  const xOf = v => margin.left + ((v - minVal) / (maxVal - minVal)) * innerW;

  // Rejilla vertical: tics de 5 cuando el rango es pequeño, 10 cuando es amplio
  const tickStep = (maxVal - minVal) > 40 ? 10 : 5;
  for (let v = minVal; v <= maxVal; v += tickStep) {
    const x = xOf(v);
    svg.appendChild(createSVGEl('line', {
      x1: x, y1: margin.top, x2: x, y2: margin.top + innerH,
      stroke: 'var(--border)', 'stroke-width': '0.6',
      'stroke-dasharray': '2,4', opacity: '0.65'
    }));
    const tlbl = createSVGEl('text', {
      x, y: margin.top + innerH + 18, 'text-anchor': 'middle',
      style: 'font-family: var(--font-display); font-size: 11.5px; font-weight: 500; fill: var(--text-soft);'
    });
    tlbl.textContent = v;
    svg.appendChild(tlbl);
  }

  // Línea base del eje X
  svg.appendChild(createSVGEl('line', {
    x1: margin.left, y1: margin.top + innerH,
    x2: w - margin.right, y2: margin.top + innerH,
    stroke: 'var(--border)', 'stroke-width': '1'
  }));

  // Barras
  sortedFacs.forEach((fac, idx) => {
    const v = valueOf(fac);
    const y = margin.top + slot * idx + (slot - barH) / 2;
    const barW = xOf(v) - margin.left;
    const color = FAC_PALETTE[idx % FAC_PALETTE.length];

    const rect = createSVGEl('rect', {
      x: margin.left, y,
      width: Math.max(barW, 2), height: barH,
      fill: color, rx: 5,
      class: 'chart-bar'
    });

    // Tooltip: aclara que es promedio ponderado
    rect.addEventListener('mouseenter', (e) => {
      const compTitle = compKey === 'global' ? 'Puntaje global' : titleCase(compKey);
      showTooltip(e, `<strong>${fac.facultad}</strong>${compTitle} (promedio ponderado por evaluados): <strong>${v} pts</strong><br>Evaluados en ${targetYear}: ${NUM.format(fac.n)}`);
    });
    rect.addEventListener('mousemove', moveTooltip);
    rect.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(rect);

    // Nombre de la facultad (a la izquierda) con wrap multi-linea para los nombres
    // largos como 'Ciencias Empresariales y Económicas'. Font aumentado a 15px.
    const facName = fac.facultad.replace(/^Facultad de /, '');
    const wrapFac = (name, maxChars = 22) => {
      const words = name.split(/\s+/);
      const out = []; let cur = '';
      for (const w of words) {
        if (!cur) { cur = w; continue; }
        if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
        else { out.push(cur); cur = w; }
      }
      if (cur) out.push(cur);
      return out;
    };
    const facLines = wrapFac(facName, 22);
    const facLineH = 17;
    const facCenterY = y + barH / 2 + 6;
    const facStartY = facCenterY - ((facLines.length - 1) * facLineH) / 2;
    facLines.forEach((ln, li) => {
      const t = createSVGEl('text', {
        x: margin.left - 12, y: facStartY + li * facLineH,
        'text-anchor': 'end',
        style: `font-family: var(--font-display); font-weight: 700; font-size: 15px; fill: ${color};`
      });
      t.textContent = ln;
      svg.appendChild(t);
    });

    // Puntaje (al final de la barra)
    const scoreText = createSVGEl('text', {
      x: margin.left + barW + 8, y: y + barH / 2 + 6,
      style: `font-family: var(--font-display); font-weight: 800; font-size: 15px; fill: ${color};`
    });
    scoreText.textContent = v.toFixed(1);
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

// Año activo único para el explorador (radar + específicas comparten el mismo año)
let activeProgYear = null;

function updateProgramExplorerData(d) {
  const p = d.programas.find(prog => prog.programa === activeProgClean);
  if (!p) return;

  // Alerta bajo N
  const warn = document.getElementById('progWarnN');
  if (warn) {
    warn.style.display = p.n_bajo ? 'flex' : 'none';
  }

  // Indicador de estado del programa según las convenciones
  updateProgramStatus(p);

  // Etiqueta del programa activo SOLO en el grafico 'Competencias genericas
  // evolucion 2020-2025' porque su leyenda es de años y no muestra el nombre del
  // programa. Los otros 3 (radar, especificas, historico) lo tienen en su leyenda
  // inferior y no necesitan badge adicional.
  const lblEl = document.getElementById('progNivelesProgLbl');
  if (lblEl) lblEl.textContent = titleCase(p.programa);

  // Selector único de año (unión de años con data en radar o específicas)
  initProgYearPicker(d, p);

  // Renderizar los 4 sub-gráficos
  renderExplorerRadar(p, activeProgYear);
  renderExplorerSpecifics(p, activeProgYear);
  renderExplorerHistory(p);
  renderExplorerLevels(p);
}

/* Calcula los indicadores del programa según las convenciones.
   Un programa puede tener varios estados simultáneos: acreditado + arriba/abajo + estrella. */
function updateProgramStatus(p) {
  const row = document.getElementById('progStatus');
  if (!row) return;

  const prog = p.global_2025;
  const ref = p.global_nbc_nacional_2025;
  const comps = p.competencias_2025 || [];

  const SVG_ACRED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="m9 12 2 2 4-4"/></svg>';
  const SVG_UP    = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4 4 14h5v6h6v-6h5z"/></svg>';
  const SVG_DOWN  = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20 4 10h5V4h6v6h5z"/></svg>';
  const SVG_STAR  = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9"/></svg>';

  const badges = [];

  // 1. Acreditación (campo opcional del JSON; se llenará desde parametros.yml)
  if (p.acreditado) {
    badges.push({ state: 'acred', icon: SVG_ACRED, text: 'Programa acreditado' });
  }

  // 2. Posición frente al NBC nacional + estrella si supera en TODAS las competencias
  const allAbove = comps.length > 0 && comps.every(c =>
    c.puntaje_programa != null && c.puntaje_nbc_nacional != null && c.puntaje_programa > c.puntaje_nbc_nacional
  );
  const globalAbove = prog != null && ref != null && prog > ref;
  const globalBelow = prog != null && ref != null && prog < ref;

  if (allAbove && globalAbove) {
    badges.push({ state: 'star', icon: SVG_STAR, text: 'Por encima del promedio en TODAS las competencias' });
  } else if (globalAbove) {
    badges.push({ state: 'up', icon: SVG_UP, text: `Por encima del promedio del NBC (+${(prog - ref).toFixed(1)} pts)` });
  } else if (globalBelow) {
    badges.push({ state: 'down', icon: SVG_DOWN, text: `Por debajo del promedio del NBC (${(prog - ref).toFixed(1)} pts)` });
  }

  if (badges.length === 0) {
    row.hidden = true;
    row.innerHTML = '';
    return;
  }

  row.hidden = false;
  row.innerHTML = badges.map(b =>
    `<span class="prog-status-icon" data-state="${b.state}" data-label="${b.text}" title="${b.text}">${b.icon}</span>`
  ).join('');
}

function initProgYearPicker(d, p) {
  const sel = document.getElementById('selAnioProg');
  if (!sel) return;

  // Union de años con data en radar o específicas
  const radarYears = Object.keys(p.radar_historico || {})
    .filter(y => Array.isArray(p.radar_historico[y]?.competencias) && p.radar_historico[y].competencias.some(c => c.puntaje_programa != null))
    .map(y => parseInt(y, 10));
  const specYears = Object.keys(p.especificas_historico || {})
    .filter(y => Array.isArray(p.especificas_historico[y]) && p.especificas_historico[y].length > 0)
    .map(y => parseInt(y, 10));
  const allYears = [...new Set([...radarYears, ...specYears])].sort((a, b) => b - a);

  const opciones = allYears.length > 0 ? allYears : [d.meta?.anio_vigente ?? 2025];
  sel.innerHTML = opciones.map(y => `<option value="${y}">${y}</option>`).join('');

  // Mantener año si aplica al programa actual, sino default al vigente o el más reciente
  const currentYear = d.meta?.anio_vigente ?? opciones[0];
  if (!activeProgYear || !opciones.includes(activeProgYear)) {
    activeProgYear = opciones.includes(currentYear) ? currentYear : opciones[0];
  }
  sel.value = String(activeProgYear);

  // Re-bind del listener
  const newSel = sel.cloneNode(true);
  sel.parentNode.replaceChild(newSel, sel);
  newSel.addEventListener('change', () => {
    activeProgYear = parseInt(newSel.value, 10);
    const prog = d.programas.find(prog => prog.programa === activeProgClean);
    if (!prog) return;
    renderExplorerRadar(prog, activeProgYear);
    renderExplorerSpecifics(prog, activeProgYear);
  });
}

// Sub-Gráfico 1: Radar genéricas del programa vs NBC nacional (filtrable por año)
function renderExplorerRadar(p, yearOverride) {
  const container = document.getElementById('progRadar');
  if (!container) return;

  // Determinar el año a usar y los datos de competencias / globales
  const targetYear = yearOverride ?? (parseInt(document.getElementById('selAnioProgRadar')?.value, 10) || 2025);
  const histYear = (p.radar_historico || {})[String(targetYear)];

  // Si el año seleccionado tiene historial, lo usamos; si no, fallback a competencias_2025
  let comps, globalProg, globalNbc, nProg, nNbc;
  if (histYear && Array.isArray(histYear.competencias) && histYear.competencias.length > 0) {
    comps = histYear.competencias.map(c => ({
      prueba: c.competencia,
      puntaje_programa: c.puntaje_programa,
      puntaje_nbc_nacional: c.puntaje_nbc_nacional
    }));
    globalProg = histYear.global_programa;
    globalNbc = histYear.global_nbc_nacional;
    nProg = histYear.n_programa || 0;
    nNbc = histYear.n_nbc_nacional || 0;
  } else {
    comps = p.competencias_2025 || [];
    globalProg = p.global_2025;
    globalNbc = p.global_nbc_nacional_2025;
    nProg = p.n_2025 || 0;
    nNbc = p.n_nbc_nacional_2025 || 0;
  }

  if (!comps || comps.length === 0) {
    container.innerHTML = '<div class="placeholder">Sin datos de competencias para este año</div>';
    return;
  }

  // Actualizar la etiqueta del año en el título del card
  const yrLbl = document.getElementById('progRadarYearLbl');
  if (yrLbl) yrLbl.textContent = targetYear;

  // 6 ejes = 5 competencias + Puntaje Global del programa
  const shortLabel = (name) => ({
    'RAZONAMIENTO CUANTITATIVO': 'Razonamiento\nCuantitativo',
    'COMPETENCIAS CIUDADANAS': 'Competencias\nCiudadanas',
    'COMUNICACIÓN ESCRITA': 'Comunicación\nEscrita',
    'LECTURA CRÍTICA': 'Lectura Crítica',
    'INGLÉS': 'Inglés'
  })[name] || name;

  const axes = [
    ...comps.map(c => ({
      full: c.prueba,
      label: shortLabel(c.prueba),
      prog: c.puntaje_programa,
      nbc: c.puntaje_nbc_nacional
    })),
    {
      full: 'Puntaje Global',
      label: 'Puntaje Global',
      prog: globalProg,
      nbc: globalNbc
    }
  ];

  // viewBox cuadrado generoso para que el radar tenga la misma presencia que la referencia
  const w = 600;
  const h = 600;
  const cx = w / 2;
  const cy = h / 2 + 6;
  const rMax = 195;
  const n = axes.length;

  // Si el nombre del programa es largo, extendemos el viewBox abajo para
  // acomodar la leyenda vertical sin que pise las etiquetas del radar.
  const progNameTitled = titleCase(p.programa);
  const isLongProgName = progNameTitled.length > 22;
  const extraBottom = isLongProgName ? 60 : 0;
  const vbH = h + extraBottom;

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${vbH}`, class: 'svg-chart' });

  // Colores: azul para programa, verde para NBC (igual que Panorama)
  const COLOR_PROG = PANORAMA_UM;
  const COLOR_NBC = PANORAMA_NAT;

  // Escala fija 100-160 (como el institucional)
  const minScale = 100;
  const maxScale = 160;
  const scoreToRadius = (s) => Math.max(0, Math.min(1, (s - minScale) / (maxScale - minScale))) * rMax;

  // Polígonos concéntricos
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

  // Ejes radiales
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

  // Nombres de competencias (afuera de los valores). Font-size aumentado de 11
  // a 14px para que se lean bien en screenshots y al imprimir.
  for (let a = 0; a < n; a++) {
    const angle = a * (2 * Math.PI / n) - Math.PI / 2;
    const labelDist = rMax + 48;
    const lx = cx + labelDist * Math.cos(angle);
    const ly = cy + labelDist * Math.sin(angle);
    const anchor = Math.abs(Math.cos(angle)) < 0.15 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end');

    const lines = axes[a].label.split('\n');
    const lineHeight = 16;
    const startY = ly - ((lines.length - 1) * lineHeight) / 2 + 5;
    lines.forEach((line, idx) => {
      const t = createSVGEl('text', {
        x: lx,
        y: startY + idx * lineHeight,
        'text-anchor': anchor,
        style: 'font-family: var(--font-display); font-weight: 700; font-size: 14px; fill: var(--brand-primary-dark);'
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
  const ptsNbc = buildPts('nbc');
  const ptsProg = buildPts('prog');

  // Polígono NBC nacional (verde tenue)
  svg.appendChild(createSVGEl('polygon', {
    points: ptsNbc.map(p => p.join(',')).join(' '),
    fill: COLOR_NBC,
    'fill-opacity': '0.06',
    stroke: COLOR_NBC,
    'stroke-width': '2.4',
    'stroke-linejoin': 'round'
  }));

  // Polígono Programa (azul institucional)
  svg.appendChild(createSVGEl('polygon', {
    points: ptsProg.map(p => p.join(',')).join(' '),
    fill: COLOR_PROG,
    'fill-opacity': '0.08',
    stroke: COLOR_PROG,
    'stroke-width': '2.8',
    'stroke-linejoin': 'round'
  }));

  // Puntos y etiquetas numéricas separadas perpendicularmente al eje
  for (let a = 0; a < n; a++) {
    const angle = a * (2 * Math.PI / n) - Math.PI / 2;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const perpX = -sinA;
    const perpY = cosA;

    const [progX, progY] = ptsProg[a];
    const [nbcX, nbcY] = ptsNbc[a];

    // Tooltips por línea: cada uno muestra la info de la serie que el usuario apunta
    const nbcName = p.nbc_nombre ? titleCase(p.nbc_nombre) : 'su NBC';
    const progName = p.programa ? titleCase(p.programa) : 'Programa';
    const compLabel = titleCase(axes[a].full);
    const nProgFmt = NUM.format(nProg);
    const nNbcFmt = NUM.format(nNbc);

    // Punto del Programa (azul) — muestra info de Unimagdalena
    const dotProg = createSVGEl('circle', {
      cx: progX, cy: progY, r: 4.8,
      fill: COLOR_PROG, stroke: '#fff', 'stroke-width': '1.6',
      class: 'chart-dot'
    });
    dotProg.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>${progName} · Unimagdalena</strong>${compLabel}: <strong>${axes[a].prog} pts</strong><br><span style="opacity:.78">Evaluados del programa: ${nProgFmt}</span>`));
    dotProg.addEventListener('mousemove', moveTooltip);
    dotProg.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(dotProg);

    // Punto NBC Nacional (verde) — muestra info del NBC del programa
    const dotNbc = createSVGEl('circle', {
      cx: nbcX, cy: nbcY, r: 4.2,
      fill: COLOR_NBC, stroke: '#fff', 'stroke-width': '1.4',
      class: 'chart-dot'
    });
    dotNbc.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>NBC ${nbcName} · Nacional</strong>${compLabel}: <strong>${axes[a].nbc} pts</strong><br><span style="opacity:.78">Evaluados a nivel nacional del NBC: ${nNbcFmt}</span>`));
    dotNbc.addEventListener('mousemove', moveTooltip);
    dotNbc.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(dotNbc);

    // Etiquetas a distancia fija del centro, separadas perpendicularmente
    const valueLabelDist = rMax + 16;
    const baseX = cx + valueLabelDist * cosA;
    const baseY = cy + valueLabelDist * sinA;
    const tangentSep = 22;

    const progLbl = createSVGEl('text', {
      x: baseX + tangentSep * perpX,
      y: baseY + tangentSep * perpY + 4,
      'text-anchor': 'middle',
      style: `font-family: var(--font-display); font-weight: 800; font-size: 13px; fill: ${COLOR_PROG};`
    });
    progLbl.textContent = axes[a].prog;
    svg.appendChild(progLbl);

    const nbcLbl = createSVGEl('text', {
      x: baseX - tangentSep * perpX,
      y: baseY - tangentSep * perpY + 4,
      'text-anchor': 'middle',
      style: `font-family: var(--font-display); font-weight: 800; font-size: 13px; fill: ${COLOR_NBC};`
    });
    nbcLbl.textContent = axes[a].nbc;
    svg.appendChild(nbcLbl);
  }

  // Leyenda inferior. Si el nombre del programa es largo apilamos vertical en
  // la zona extra del viewBox (mas abajo del radar) para evitar overlap con las
  // etiquetas 'Comunicacion Escrita' y demas.
  const legendItems = [
    { color: COLOR_PROG, text: progNameTitled },
    { color: COLOR_NBC, text: 'NBC nacional' }
  ];
  if (isLongProgName) {
    svg.appendChild(createLegend(legendItems, cx - 180, h + 20, {
      fontSize: 14, rectW: 22, rectH: 12, textGap: 32, fontWeight: 700,
      direction: 'vertical', lineHeight: 22
    }));
  } else {
    svg.appendChild(createLegend(legendItems, cx - 200, h - 22, {
      fontSize: 14, rectW: 22, rectH: 12, gap: 280, textGap: 32, fontWeight: 700
    }));
  }

  container.innerHTML = '';
  container.appendChild(svg);
}

// Sub-Gráfico 2: Barras de específicas vs NBC (paleta azul/verde, filtrable por año)
function renderExplorerSpecifics(p, yearOverride) {
  const card = document.getElementById('progSpecCard');
  const container = document.getElementById('progSpecBar');
  if (!container || !card) return;

  // El card siempre es visible; si no hay datos mostramos un placeholder, no lo ocultamos
  card.style.display = '';

  // Determinar año a usar y datos correspondientes
  const targetYear = yearOverride ?? (parseInt(document.getElementById('selAnioProgSpec')?.value, 10) || 2025);
  const histYear = (p.especificas_historico || {})[String(targetYear)];
  // Solo caemos a 2025 si NINGÚN año ha sido pedido explícitamente
  const hasHistData = Array.isArray(histYear) && histYear.length > 0;
  const specs = hasHistData ? histYear : (yearOverride == null ? (p.especificas_2025 || []) : []);

  // Actualizar etiqueta del año en el título (siempre, aunque no haya datos)
  const yrLbl = document.getElementById('progSpecYearLbl');
  if (yrLbl) yrLbl.textContent = targetYear;

  // Sin específicas para este año/programa: mostrar mensaje en lugar de gráfica
  if (!specs || specs.length === 0) {
    container.innerHTML = `
      <div class="chart-empty">
        <div class="chart-empty__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>
        </div>
        <div class="chart-empty__title">No presentó Competencias Específicas</div>
        <div class="chart-empty__sub">El programa no rindió pruebas específicas en ${targetYear}.</div>
      </div>
    `;
    return;
  }

  const COLOR_PROG = PANORAMA_UM;   // azul institucional
  const COLOR_NBC = PANORAMA_NAT;   // verde
  const nbcName = p.nbc_nombre ? titleCase(p.nbc_nombre) : 'su NBC';
  const progName = p.programa ? titleCase(p.programa) : 'Programa';

  // n del programa para el año seleccionado (del histórico global)
  const histGlobal = (p.historico || []).find(h => h.anio === targetYear);
  const nProgYear = histGlobal?.n ?? p.n_2025 ?? 0;
  // n nacional NBC: usa el dato más completo disponible (el del año, sino el 2025)
  const nNbcYear = specs[0]?.n_nbc_nacional ?? p.n_nbc_nacional_2025 ?? 0;
  const nProgFmt = NUM.format(nProgYear);
  const nNbcFmt = NUM.format(nNbcYear);

  // Rango Y a partir de los datos con padding (con guardas si no hay datos válidos)
  const allVals = specs.flatMap(s => [s.puntaje_programa, s.puntaje_nbc_nacional]).filter(v => v != null && isFinite(v));
  if (allVals.length === 0) {
    container.innerHTML = '<div class="placeholder">Sin datos suficientes</div>';
    return;
  }
  const dMin = Math.min(...allVals);
  const dMax = Math.max(...allVals);
  let minVal = Math.floor((dMin - 8) / 10) * 10;
  let maxVal = Math.ceil((dMax + 8) / 10) * 10;
  if (maxVal - minVal < 30) maxVal = minVal + 30;   // rango mínimo para que las barras no colapsen

  // viewBox cuadrado para encajar en la columna del card combinado (mismo aspecto que el radar).
  // margin.left mas generoso para que los nombres largos quepan en 2-3 lineas sin truncar.
  const w = 600;
  const h = 600;
  const margin = { top: 30, right: 56, bottom: 86, left: 230 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  // Si el nombre del programa es largo, extendemos el viewBox abajo para
  // acomodar la leyenda vertical.
  const progNameTitled = titleCase(p.programa);
  const isLongProgName = progNameTitled.length > 22;
  const vbH = h + (isLongProgName ? 60 : 0);

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${vbH}`, class: 'svg-chart' });

  const getX = v => margin.left + ((v - minVal) / (maxVal - minVal)) * innerW;
  const totalGroups = specs.length;
  const groupSlot = innerH / totalGroups;
  // Barras más gruesas; cuando hay 1 o 2 específicas, llenan el espacio sin verse "perdidas"
  const barH = Math.min(64, groupSlot * 0.38);
  const barGap = Math.min(10, groupSlot * 0.06);

  // Rejilla vertical + ticks múltiplos de 10
  for (let v = minVal; v <= maxVal; v += 10) {
    const x = getX(v);
    svg.appendChild(createSVGEl('line', {
      x1: x, y1: margin.top, x2: x, y2: margin.top + innerH,
      stroke: 'var(--border)', 'stroke-width': '0.6',
      'stroke-dasharray': '2,4', opacity: '0.6'
    }));
    const lbl = createSVGEl('text', {
      x, y: margin.top + innerH + 18, 'text-anchor': 'middle',
      style: 'font-family: var(--font-display); font-size: 11px; font-weight: 500; fill: var(--text-soft);'
    });
    lbl.textContent = v;
    svg.appendChild(lbl);
  }

  // Línea base del eje X
  svg.appendChild(createSVGEl('line', {
    x1: margin.left, y1: margin.top + innerH,
    x2: w - margin.right, y2: margin.top + innerH,
    stroke: 'var(--border)', 'stroke-width': '1'
  }));

  // Wrap del nombre de la prueba en lineas de hasta MAX_CHARS caracteres sin
  // partir palabras. Asi nombres largos como 'Investigacion En Ciencias Sociales'
  // se ven completos en 2-3 lineas en lugar de truncarse con '...'.
  const wrapSpec = (name, maxChars = 22) => {
    if (!name) return [];
    const words = titleCase(name).split(/\s+/);
    const lines = [];
    let current = '';
    for (const w of words) {
      if (!current) { current = w; continue; }
      if ((current + ' ' + w).length <= maxChars) current += ' ' + w;
      else { lines.push(current); current = w; }
    }
    if (current) lines.push(current);
    return lines;
  };

  // Dibujar grupos
  specs.forEach((spec, idx) => {
    const groupCenterY = margin.top + groupSlot * (idx + 0.5);
    const yProg = groupCenterY - barH - barGap / 2;
    const yNbc  = groupCenterY + barGap / 2;
    const xZero = margin.left;
    const wProg = getX(spec.puntaje_programa) - xZero;
    const wNbc  = getX(spec.puntaje_nbc_nacional) - xZero;

    // Etiqueta de la prueba (izquierda) — wrap a multiples lineas si el nombre
    // es largo. Font aumentado a 14px para mejor legibilidad.
    const lines = wrapSpec(spec.prueba, 22);
    const lineHeight = 17;
    const startY = groupCenterY - ((lines.length - 1) * lineHeight) / 2 + 5;
    lines.forEach((ln, li) => {
      const t = createSVGEl('text', {
        x: margin.left - 14, y: startY + li * lineHeight,
        'text-anchor': 'end',
        style: 'font-family: var(--font-display); font-size: 14px; font-weight: 700; fill: var(--brand-primary-dark);'
      });
      t.textContent = ln;
      t.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>${titleCase(spec.prueba)}</strong>Programa: ${spec.puntaje_programa} pts<br>NBC nacional: ${spec.puntaje_nbc_nacional} pts`));
      t.addEventListener('mousemove', moveTooltip);
      t.addEventListener('mouseleave', hideTooltip);
      svg.appendChild(t);
    });

    // Barra Programa (azul) — encima
    const rectProg = createSVGEl('rect', {
      x: xZero, y: yProg, width: Math.max(wProg, 2), height: barH,
      fill: COLOR_PROG, rx: 4, class: 'chart-bar'
    });
    rectProg.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>${progName} · Unimagdalena</strong>${titleCase(spec.prueba)}: <strong>${spec.puntaje_programa} pts</strong><br><span style="opacity:.78">Evaluados del programa: ${nProgFmt}</span>`));
    rectProg.addEventListener('mousemove', moveTooltip);
    rectProg.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(rectProg);

    // Etiqueta numérica al final de la barra Programa
    const lblProg = createSVGEl('text', {
      x: xZero + wProg + 7, y: yProg + barH / 2 + 4,
      style: `font-family: var(--font-display); font-weight: 800; font-size: 12px; fill: ${COLOR_PROG};`
    });
    lblProg.textContent = spec.puntaje_programa;
    svg.appendChild(lblProg);

    // Barra NBC (verde) — debajo
    const rectNbc = createSVGEl('rect', {
      x: xZero, y: yNbc, width: Math.max(wNbc, 2), height: barH,
      fill: COLOR_NBC, rx: 4, class: 'chart-bar'
    });
    rectNbc.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>NBC ${nbcName} · Nacional</strong>${titleCase(spec.prueba)}: <strong>${spec.puntaje_nbc_nacional} pts</strong><br><span style="opacity:.78">Evaluados a nivel nacional del NBC: ${nNbcFmt}</span>`));
    rectNbc.addEventListener('mousemove', moveTooltip);
    rectNbc.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(rectNbc);

    const lblNbc = createSVGEl('text', {
      x: xZero + wNbc + 7, y: yNbc + barH / 2 + 4,
      style: `font-family: var(--font-display); font-weight: 700; font-size: 12px; fill: ${COLOR_NBC};`
    });
    lblNbc.textContent = spec.puntaje_nbc_nacional;
    svg.appendChild(lblNbc);
  });

  // Leyenda inferior. Si el nombre del programa es largo apilamos vertical
  // en la zona extra del viewBox (debajo del eje X) para evitar overlap.
  const legendItems = [
    { color: COLOR_PROG, text: progNameTitled },
    { color: COLOR_NBC, text: 'NBC nacional' }
  ];
  if (isLongProgName) {
    svg.appendChild(createLegend(legendItems, (w / 2) - 180, h + 20, {
      fontSize: 14, rectW: 22, rectH: 12, textGap: 32, fontWeight: 700,
      direction: 'vertical', lineHeight: 22
    }));
  } else {
    svg.appendChild(createLegend(legendItems, (w / 2) - 200, h - 22, {
      fontSize: 14, rectW: 22, rectH: 12, gap: 280, textGap: 32, fontWeight: 700
    }));
  }

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

  // Cruzar histórico del programa con el histórico del NBC nacional (radar_historico)
  // Solo dejamos años donde el programa tiene puntaje (los del array historico)
  const radarHist = p.radar_historico || {};
  const series = hist.map(pt => ({
    anio: pt.anio,
    prog: pt.puntaje,
    nbc: radarHist[String(pt.anio)]?.global_nbc_nacional ?? null,
    nProg: pt.n,
    nNbc: radarHist[String(pt.anio)]?.n_nbc_nacional ?? null
  })).filter(s => s.prog != null);

  // viewBox para columna de 2-pares (más cuadrado: aspecto ~1.3)
  const w = 580;
  const h = 440;
  const margin = { top: 24, right: 28, bottom: 70, left: 54 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  // Si el nombre del programa es largo, extendemos el viewBox abajo para
  // acomodar la leyenda vertical.
  const progNameTitled = titleCase(p.programa);
  const isLongProgName = progNameTitled.length > 22;
  const vbH = h + (isLongProgName ? 36 : 0);

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${vbH}`, class: 'svg-chart' });

  // Escala Y: usa el rango real con padding
  const allVals = series.flatMap(s => [s.prog, s.nbc]).filter(v => v != null && isFinite(v));
  const dataMin = Math.min(...allVals);
  const dataMax = Math.max(...allVals);
  const padding = Math.max(6, (dataMax - dataMin) * 0.25);
  const minVal = Math.floor((dataMin - padding) / 5) * 5;
  const maxVal = Math.ceil((dataMax + padding) / 5) * 5;

  const getX = (idx) => margin.left + (idx / Math.max(1, series.length - 1)) * innerW;
  const getY = (val) => margin.top + innerH - ((val - minVal) / (maxVal - minVal)) * innerH;

  // Rejilla Y horizontal (5 niveles)
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const val = minVal + (i / ticks) * (maxVal - minVal);
    const y = getY(val);
    const line = createSVGEl('line', {
      x1: margin.left, y1: y, x2: w - margin.right, y2: y,
      stroke: 'var(--border)', 'stroke-width': '1',
      'stroke-dasharray': i === ticks ? '0' : '3,3',
      opacity: '0.55'
    });
    svg.appendChild(line);
    const text = createSVGEl('text', {
      x: margin.left - 10, y: y + 4, 'text-anchor': 'end',
      style: 'font-family: var(--font-display); font-size: 12px; fill: var(--muted); font-weight: 600;'
    });
    text.textContent = Math.round(val);
    svg.appendChild(text);
  }

  // Eje X (años)
  series.forEach((s, idx) => {
    const x = getX(idx);
    const text = createSVGEl('text', {
      x, y: margin.top + innerH + 22, 'text-anchor': 'middle',
      style: 'font-family: var(--font-display); font-size: 13px; fill: var(--text); font-weight: 700;'
    });
    text.textContent = s.anio;
    svg.appendChild(text);
  });

  const COLOR_PROG = PANORAMA_UM;   // azul institucional
  const COLOR_NBC = PANORAMA_NAT;   // verde

  // Helper para trazar una línea con puntos + labels arriba
  const drawLine = (key, color, labelOffset, isDashed) => {
    const pts = series.map((s, i) => ({ x: getX(i), y: s[key] != null ? getY(s[key]) : null, val: s[key], anio: s.anio, n: key === 'prog' ? s.nProg : s.nNbc }));
    const validPts = pts.filter(pt => pt.y != null);
    if (validPts.length < 2) return;

    // Path
    let d = '';
    validPts.forEach((pt, i) => { d += `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y} `; });
    const pathEl = createSVGEl('path', {
      d, stroke: color, fill: 'none',
      'stroke-width': '2.6',
      'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      ...(isDashed ? { 'stroke-dasharray': '6,4' } : {})
    });
    svg.appendChild(pathEl);

    // Puntos + labels
    validPts.forEach(pt => {
      const c = createSVGEl('circle', {
        cx: pt.x, cy: pt.y, r: 4.5, fill: color, stroke: '#fff', 'stroke-width': '1.5'
      });
      const progLbl = p.programa ? titleCase(p.programa) : 'Programa';
      const labelKey = key === 'prog' ? progLbl : `NBC ${p.nbc_nombre ? titleCase(p.nbc_nombre) : 'nacional'}`;
      c.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>${labelKey} · ${pt.anio}</strong>Puntaje Global: <strong>${pt.val} pts</strong>${pt.n != null ? `<br><span style="opacity:.78">Evaluados: ${NUM.format(pt.n)}</span>` : ''}`));
      c.addEventListener('mousemove', moveTooltip);
      c.addEventListener('mouseleave', hideTooltip);
      svg.appendChild(c);

      // Etiqueta del valor (arriba o abajo según labelOffset)
      const lbl = createSVGEl('text', {
        x: pt.x, y: pt.y + labelOffset, 'text-anchor': 'middle',
        style: `font-family: var(--font-display); font-size: 12px; fill: ${color}; font-weight: 800;`
      });
      lbl.textContent = pt.val;
      svg.appendChild(lbl);
    });
  };

  // Línea NBC (verde, abajo) primero para que el azul del programa quede encima
  drawLine('nbc', COLOR_NBC, 16, false);
  // Línea programa (azul, etiqueta arriba)
  drawLine('prog', COLOR_PROG, -10, false);

  // Leyenda inferior. Si el nombre del programa es largo apilamos vertical en
  // la zona extra del viewBox (debajo del grafico) para evitar overlap.
  const legendItems = [
    { color: COLOR_PROG, text: progNameTitled },
    { color: COLOR_NBC, text: 'NBC nacional' }
  ];
  if (isLongProgName) {
    svg.appendChild(createLegend(legendItems, (w / 2) - 140, h + 14, {
      fontSize: 12, rectW: 18, rectH: 10, textGap: 26, fontWeight: 700,
      direction: 'vertical', lineHeight: 18
    }));
  } else {
    svg.appendChild(createLegend(legendItems, (w / 2) - 160, h - 16, {
      fontSize: 12, rectW: 18, rectH: 10, gap: 210, textGap: 26, fontWeight: 700
    }));
  }

  container.innerHTML = '';
  container.appendChild(svg);
}

// Sub-Gráfico 4: Niveles de desempeño del programa vs NBC
// Sub-Gráfico 4: Evolución de competencias genéricas por año (barras agrupadas)
// Reemplaza al gráfico anterior de distribución por niveles.
function renderExplorerLevels(p) {
  const container = document.getElementById('progNiveles');
  if (!container) return;

  const radarHist = p.radar_historico || {};
  const yearsAll = Object.keys(radarHist)
    .map(y => parseInt(y, 10))
    .filter(y => !isNaN(y))
    .sort((a, b) => a - b);

  if (yearsAll.length === 0) {
    container.innerHTML = '<div class="placeholder">Sin histórico de competencias</div>';
    return;
  }

  // Lista canónica de competencias y etiquetas cortas
  const COMP_ORDER = ['LECTURA CRÍTICA', 'RAZONAMIENTO CUANTITATIVO', 'COMPETENCIAS CIUDADANAS', 'COMUNICACIÓN ESCRITA', 'INGLÉS'];
  const COMP_SHORT = {
    'LECTURA CRÍTICA': 'Lectura Crítica',
    'RAZONAMIENTO CUANTITATIVO': 'Raz. Cuantitativo',
    'COMPETENCIAS CIUDADANAS': 'Ciudadanas',
    'COMUNICACIÓN ESCRITA': 'Com. Escrita',
    'INGLÉS': 'Inglés'
  };

  // Construir matriz: [{competencia, label, valores: {year: puntaje}}]
  const matrix = COMP_ORDER.map(comp => {
    const valores = {};
    yearsAll.forEach(y => {
      const yearObj = radarHist[String(y)];
      if (!yearObj || !Array.isArray(yearObj.competencias)) return;
      const found = yearObj.competencias.find(c => c.competencia === comp);
      if (found && found.puntaje_programa != null) {
        valores[y] = found.puntaje_programa;
      }
    });
    return { competencia: comp, label: COMP_SHORT[comp] || comp, valores };
  }).filter(m => Object.keys(m.valores).length > 0);

  if (matrix.length === 0) {
    container.innerHTML = '<div class="placeholder">Sin histórico de competencias</div>';
    return;
  }

  // Paleta por año (similar a la referencia institucional)
  const YEAR_COLORS = {
    2020: '#4472C4',  // azul
    2021: '#ED7D31',  // naranja
    2022: '#A5A5A5',  // gris
    2023: '#FFC000',  // amarillo
    2024: '#5B9BD5',  // azul claro
    2025: '#70AD47'   // verde
  };

  // Escala Y adaptativa basada en min/max reales
  const allScores = matrix.flatMap(m => Object.values(m.valores));
  const dataMin = Math.min(...allScores);
  const dataMax = Math.max(...allScores);
  const pad = Math.max(8, (dataMax - dataMin) * 0.18);
  const minVal = Math.floor((dataMin - pad) / 10) * 10;
  const maxVal = Math.ceil((dataMax + pad) / 10) * 10;

  // viewBox para columna de 2-pares (mismo aspecto que el histórico global)
  const w = 580;
  const h = 440;
  const margin = { top: 20, right: 20, bottom: 86, left: 48 };
  const innerW = w - margin.left - margin.right;
  const innerH = h - margin.top - margin.bottom;

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  // Rejilla Y
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const val = minVal + (i / ticks) * (maxVal - minVal);
    const y = margin.top + innerH - ((val - minVal) / (maxVal - minVal)) * innerH;
    const line = createSVGEl('line', {
      x1: margin.left, y1: y, x2: w - margin.right, y2: y,
      stroke: 'var(--border)', 'stroke-width': '1',
      'stroke-dasharray': i === 0 ? '0' : '3,3',
      opacity: '0.55'
    });
    svg.appendChild(line);
    const text = createSVGEl('text', {
      x: margin.left - 8, y: y + 4, 'text-anchor': 'end',
      style: 'font-family: var(--font-display); font-size: 12px; fill: var(--muted); font-weight: 600;'
    });
    text.textContent = Math.round(val);
    svg.appendChild(text);
  }

  // Anchos por grupo y por barra
  const nGroups = matrix.length;
  const groupSlot = innerW / nGroups;
  const groupPad = groupSlot * 0.18;
  const groupW = groupSlot - groupPad * 2;
  const nYears = yearsAll.length;
  const barW = groupW / nYears;

  matrix.forEach((m, gi) => {
    const groupX0 = margin.left + gi * groupSlot + groupPad;

    yearsAll.forEach((yr, yi) => {
      const val = m.valores[yr];
      if (val == null) return;
      const x = groupX0 + yi * barW;
      const yBar = margin.top + innerH - ((val - minVal) / (maxVal - minVal)) * innerH;
      const barH = (margin.top + innerH) - yBar;
      const color = YEAR_COLORS[yr] || PANORAMA_UM;

      const rect = createSVGEl('rect', {
        x, y: yBar, width: Math.max(0, barW - 1), height: barH,
        fill: color,
        rx: '1'
      });
      const progLbl = p.programa ? titleCase(p.programa) : 'Programa';
      rect.addEventListener('mouseenter', (e) => showTooltip(e, `<strong>${progLbl} · ${yr}</strong>${m.label}: <strong>${val} pts</strong>`));
      rect.addEventListener('mousemove', moveTooltip);
      rect.addEventListener('mouseleave', hideTooltip);
      svg.appendChild(rect);

      // Valor encima de la barra
      const valTxt = createSVGEl('text', {
        x: x + (barW - 1) / 2, y: yBar - 4, 'text-anchor': 'middle',
        style: `font-family: var(--font-display); font-size: 10px; fill: ${color}; font-weight: 800;`
      });
      valTxt.textContent = val;
      svg.appendChild(valTxt);
    });

    // Etiqueta del grupo (competencia)
    const gx = margin.left + gi * groupSlot + groupSlot / 2;
    const gText = createSVGEl('text', {
      x: gx, y: margin.top + innerH + 18, 'text-anchor': 'middle',
      style: 'font-family: var(--font-display); font-size: 12px; fill: var(--text); font-weight: 700;'
    });
    gText.textContent = m.label;
    svg.appendChild(gText);
  });

  // Leyenda inferior: una píldora por año (centrada bajo el eje X de la columna estrecha)
  const legendItems = yearsAll.map(yr => ({ color: YEAR_COLORS[yr] || PANORAMA_UM, text: String(yr) }));
  const itemW = 60;
  const totalLegendW = legendItems.length * itemW;
  const legendStartX = (w - totalLegendW) / 2;
  legendItems.forEach((item, i) => {
    const x = legendStartX + i * itemW;
    const lr = createSVGEl('rect', { x, y: h - 28, width: 12, height: 9, fill: item.color, rx: 1 });
    const lt = createSVGEl('text', {
      x: x + 17, y: h - 19,
      style: 'font-family: var(--font-display); font-size: 12px; fill: var(--text); font-weight: 700;'
    });
    lt.textContent = item.text;
    svg.appendChild(lr);
    svg.appendChild(lt);
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G10: Top 10 por competencia ---------- */
let activeTopCompetence = 'Global';
let activeTopYear = null;

function renderTop10(d) {
  const tabs = document.getElementById('topTabs');
  const container = document.getElementById('chartTop10');
  if (!container) return;

  const comps = Object.keys(d.top10.por_competencia || {});
  if (comps.length === 0) return;

  // Selector de año (años disponibles = los que tenga al menos un programa en su historico)
  initTopYearPicker(d);

  // Tabs de competencia (Global + 5 genéricas)
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
      btn.addEventListener('click', () => {
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

function initTopYearPicker(d) {
  const sel = document.getElementById('selAnioTop');
  if (!sel) return;

  // Años disponibles: unión de años en histórico de cualquier programa
  const yearSet = new Set();
  (d.programas || []).forEach(p => {
    (p.historico || []).forEach(h => yearSet.add(h.anio));
  });
  const years = [...yearSet].sort((a, b) => b - a);
  if (years.length === 0) return;

  sel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
  const currentYear = d.meta?.anio_vigente ?? years[0];
  activeTopYear = years.includes(currentYear) ? currentYear : years[0];
  sel.value = String(activeTopYear);

  const newSel = sel.cloneNode(true);
  sel.parentNode.replaceChild(newSel, sel);
  newSel.addEventListener('change', () => {
    activeTopYear = parseInt(newSel.value, 10);
    drawTop10Plot(d);
  });
}

// Calcula el top 10 dinámicamente para el año + competencia seleccionados
function computeTop10ForYearComp(d, year, comp) {
  const items = [];
  (d.programas || []).forEach(p => {
    if (comp === 'Global') {
      const histYear = (p.historico || []).find(h => h.anio === year);
      if (histYear && histYear.puntaje != null) {
        items.push({ programa: p.programa, puntaje: histYear.puntaje, n: histYear.n });
      }
    } else {
      const radarY = (p.radar_historico || {})[String(year)];
      if (radarY && Array.isArray(radarY.competencias)) {
        const found = radarY.competencias.find(c => c.competencia === comp);
        if (found && found.puntaje_programa != null) {
          items.push({ programa: p.programa, puntaje: found.puntaje_programa, n: radarY.n_programa });
        }
      }
    }
  });
  items.sort((a, b) => b.puntaje - a.puntaje);
  return items.slice(0, 10);
}

function drawTop10Plot(d) {
  const container = document.getElementById('chartTop10');
  if (!container) return;

  // Actualizar etiqueta del año
  const yrLbl = document.getElementById('topYearLbl');
  if (yrLbl) yrLbl.textContent = activeTopYear ?? '';

  const dataList = computeTop10ForYearComp(d, activeTopYear, activeTopCompetence);

  if (!dataList || dataList.length === 0) {
    container.innerHTML = '<div class="placeholder">Sin datos para este año / competencia</div>';
    return;
  }

  const w = 500;
  const h = 420;
  // margin.left amplio para que los nombres de programa usen mas espacio
  // horizontal y se vean a 1-2 lineas en lugar de 3 cuando el contenedor
  // tiene espacio sobrante en desktop. height incrementado para barras mas
  // gruesas (aspecto similar al grafico Facultades).
  const margin = { top: 15, right: 50, bottom: 22, left: 250 };

  const svg = createSVGEl('svg', { viewBox: `0 0 ${w} ${h}`, class: 'svg-chart' });

  const totalBars = dataList.length;
  const barHeight = (h - margin.top - margin.bottom) / totalBars;

  // Helper de wrap: divide un nombre en lineas de hasta maxChars sin partir
  // palabras. Usado en los labels izquierdos.
  const wrapName = (name, maxChars = 24) => {
    const words = name.split(/\s+/);
    const lines = [];
    let current = '';
    for (const w of words) {
      if (!current) { current = w; continue; }
      if ((current + ' ' + w).length <= maxChars) current += ' ' + w;
      else { lines.push(current); current = w; }
    }
    if (current) lines.push(current);
    return lines;
  };

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

  // Dibujar barras del Top 10 con paleta rotativa (mismo estilo que Facultades).
  // Cada barra tiene color distinto para que el grafico aproveche el espacio
  // visualmente sin sentirse monotono.
  dataList.forEach((item, idx) => {
    const y = margin.top + idx * barHeight;
    const barW = getWidth(item.puntaje);
    const color = FAC_PALETTE[idx % FAC_PALETTE.length];

    // Barras mas gruesas: ocupan 75% del slot vertical (antes ~82% pero con
    // margenes pequeños). Sigue habiendo separacion entre barras.
    const thickBarH = barHeight * 0.72;
    const barY = y + (barHeight - thickBarH) / 2;

    const rect = createSVGEl('rect', {
      x: margin.left, y: barY,
      width: Math.max(barW, 2), height: thickBarH,
      fill: color,
      rx: 4,
      class: 'chart-bar'
    });

    // Wrap del nombre del programa: lineas de hasta 36 chars sin truncar
    // (aprovecha el margin.left ampliado a 250). Prefijo '1. ' va en la primera linea.
    const prog = titleCase(item.programa);
    const lines = wrapName(prog, 36);
    if (lines.length > 0) lines[0] = `${idx + 1}. ${lines[0]}`;
    const lineH = 13;
    const centerY = y + barHeight / 2 + 4;
    const startY = centerY - ((lines.length - 1) * lineH) / 2;
    lines.forEach((ln, li) => {
      const nt = createSVGEl('text', {
        x: margin.left - 8, y: startY + li * lineH,
        'text-anchor': 'end',
        class: 'axis-label',
        style: `font-weight: 700; font-size: 11.5px; fill: ${color};`
      });
      nt.textContent = ln;
      svg.appendChild(nt);
    });

    const scoreText = createSVGEl('text', {
      x: margin.left + barW + 6, y: centerY,
      class: 'axis-label',
      style: `font-weight: 800; font-size: 12px; fill: ${color};`
    });
    scoreText.textContent = item.puntaje.toFixed(1);

    rect.addEventListener('mouseenter', (e) => {
      showTooltip(e, `<strong>${item.programa}</strong>Puntaje Promedio: ${item.puntaje} pts${item.n ? `<br>Evaluados: ${NUM.format(item.n)}` : ''}`);
    });
    rect.addEventListener('mousemove', moveTooltip);
    rect.addEventListener('mouseleave', hideTooltip);

    svg.appendChild(rect);
    svg.appendChild(scoreText);
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

/* ---------- G12: Mapa de calor (filtrable por año) ---------- */
function initHeatmapYearPicker(d) {
  const sel = document.getElementById('selAnioHeatmap');
  if (!sel) return;
  const hist = d.facultades_historico || {};
  const years = Object.keys(hist).filter(y => Array.isArray(hist[y]) && hist[y].length > 0);
  if (years.length === 0) return;

  sel.innerHTML = years
    .map(y => parseInt(y, 10))
    .sort((a, b) => b - a)
    .map(y => `<option value="${y}">${y}</option>`)
    .join('');
  const defaultYear = String(d.meta?.anio_vigente ?? years[years.length - 1]);
  sel.value = defaultYear;
  sel.addEventListener('change', () => renderHeatmap(d, parseInt(sel.value, 10)));
}

function renderHeatmapAndDofa(d) {
  renderHeatmap(d);
}

function renderHeatmap(d, yearOverride) {
  const container = document.getElementById('chartHeatmap');
  if (!container) return;

  const currentYear = d.meta?.anio_vigente ?? null;
  const targetYear = yearOverride ?? currentYear;

  // Para el año vigente preferimos d.facultades (verificado en línea)
  let facs;
  if (targetYear === currentYear && Array.isArray(d.facultades) && d.facultades.length > 0) {
    facs = d.facultades;
  } else {
    facs = (d.facultades_historico || {})[String(targetYear)] || [];
  }
  if (!facs || facs.length === 0) return;

  // Etiqueta del año en el título
  const lbl = document.getElementById('heatmapYearLbl');
  if (lbl) lbl.textContent = targetYear;

  // Competencias del modelo institucional (orden consistente)
  const comps = d.institucional.competencias.map(c => c.competencia);

  // Etiquetas cortas reutilizando el mapping de los tabs de Facultades
  // En mobile usamos labels todavia mas cortos con line-break controlado para
  // que wrappen limpio en 2 lineas (sin partir palabras mid-sylaba).
  const isMobileHM = window.matchMedia('(max-width: 900px)').matches;
  const COMP_MOBILE_LABEL = {
    'LECTURA CRÍTICA': 'Lect.\nCrít.',
    'RAZONAMIENTO CUANTITATIVO': 'Raz.\nCuant.',
    'COMPETENCIAS CIUDADANAS': 'Ciudad.',
    'COMUNICACIÓN ESCRITA': 'Com.\nEscr.',
    'INGLÉS': 'Inglés'
  };
  const labelOf = (name) => {
    if (isMobileHM && COMP_MOBILE_LABEL[name]) return COMP_MOBILE_LABEL[name];
    return COMP_SHORT_LABEL[name] || titleCase(name);
  };

  // Crear la tabla
  const table = document.createElement('table');
  table.className = 'heatmap';

  // Cabecera
  const thead = document.createElement('thead');
  const trHeader = document.createElement('tr');
  const thCorner = document.createElement('th');
  thCorner.textContent = 'Facultad';
  thCorner.className = 'heatmap__corner';
  trHeader.appendChild(thCorner);
  comps.forEach(c => {
    const th = document.createElement('th');
    th.textContent = labelOf(c);
    trHeader.appendChild(th);
  });
  thead.appendChild(trHeader);
  table.appendChild(thead);

  // Cuerpo
  const tbody = document.createElement('tbody');

  // Mín y máx globales para escalar el color
  let minScore = Infinity;
  let maxScore = -Infinity;
  facs.forEach(f => {
    (f.competencias || []).forEach(c => {
      if (c.puntaje == null) return;
      if (c.puntaje < minScore) minScore = c.puntaje;
      if (c.puntaje > maxScore) maxScore = c.puntaje;
    });
  });

  // Función de color: del azul claro al azul institucional
  // Devuelve background + color de texto contrastado para celdas oscuras
  const colorFor = (val) => {
    const pct = (maxScore === minScore) ? 0.5 : (val - minScore) / (maxScore - minScore);
    // Gradiente azul: claro #E8F1FB → oscuro #0F4FA8
    const start = [232, 241, 251];
    const end = [15, 79, 168];
    const rgb = start.map((s, i) => Math.round(s + (end[i] - s) * pct));
    const bg = `rgb(${rgb.join(',')})`;
    const textColor = pct > 0.55 ? '#fff' : 'var(--brand-primary-dark)';
    return { bg, textColor, pct };
  };

  // En mobile abreviamos "Ciencias" -> "C." para que los nombres de facultad caben
  // en menos lineas en el heatmap. En desktop usamos el nombre completo.
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const fmtFac = (nombre) => {
    let s = nombre.replace('Facultad de ', '');
    if (isMobile) {
      s = s.replace(/^Ciencias\b/, 'C.');
    }
    return s;
  };

  facs.forEach(f => {
    const tr = document.createElement('tr');
    const tdFac = document.createElement('td');
    tdFac.textContent = fmtFac(f.facultad);
    tr.appendChild(tdFac);

    comps.forEach(compName => {
      const tdVal = document.createElement('td');
      const compObj = (f.competencias || []).find(c => c.competencia === compName);

      if (compObj && compObj.puntaje !== null) {
        tdVal.textContent = Math.round(compObj.puntaje);
        tdVal.className = 'heatmap__cell';
        const { bg, textColor, pct } = colorFor(compObj.puntaje);
        tdVal.style.background = bg;
        tdVal.style.color = textColor;
        // Marca leve a los extremos
        if (compObj.puntaje === maxScore) tdVal.classList.add('heatmap__cell--top');
        if (compObj.puntaje === minScore) tdVal.classList.add('heatmap__cell--bottom');

        tdVal.addEventListener('mouseenter', (e) => {
          showTooltip(e, `<strong>${f.facultad}</strong>${compName}: <strong>${compObj.puntaje} pts</strong> · año ${targetYear}`);
        });
        tdVal.addEventListener('mousemove', moveTooltip);
        tdVal.addEventListener('mouseleave', hideTooltip);
      } else {
        tdVal.textContent = '—';
        tdVal.className = 'heatmap__cell heatmap__cell--empty';
      }

      tr.appendChild(tdVal);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);

  // Pie con leyenda min/max
  const tfoot = document.createElement('div');
  tfoot.className = 'heatmap__legend';
  tfoot.innerHTML = `
    <span class="heatmap__legend-label">Bajo</span>
    <span class="heatmap__legend-min">${Math.round(minScore)}</span>
    <span class="heatmap__legend-bar" aria-hidden="true"></span>
    <span class="heatmap__legend-max">${Math.round(maxScore)}</span>
    <span class="heatmap__legend-label">Alto</span>
  `;

  container.innerHTML = '';
  container.appendChild(table);
  container.appendChild(tfoot);
}

/* ---------- Aparición progresiva de secciones al hacer scroll ---------- */
function initSectionReveal() {
  const sections = [...document.querySelectorAll('.section')];
  if (sections.length === 0) return;

  // Si el navegador no soporta IntersectionObserver, mostramos todo de una vez
  if (!('IntersectionObserver' in window)) {
    sections.forEach(s => s.classList.add('is-revealed'));
    return;
  }

  // 1) Las secciones que NO estan en el viewport al cargar la pagina se quedan
  //    armadas (opacity 0). El observer las animara cuando el usuario scroll
  //    hasta ellas. La primera seccion siempre se anima un instante despues
  //    del load (efecto 'entrada' de pagina).

  // 2) IntersectionObserver TOGGLE: anima la seccion CADA vez que entra al
  //    viewport — sea scroleando hacia abajo o hacia arriba. La animacion no
  //    es 'one-shot', se re-dispara cada vez para que el dashboard se sienta
  //    vivo durante toda la sesion de scroll.
  //    threshold 0 = dispara con cualquier pixel visible.
  //    rootMargin 0px = la seccion entra/sale cuando cualquier parte de ella
  //    toca el viewport — sin offsets que retrasen el trigger.
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        // Entrando al viewport — animar in
        e.target.classList.add('is-revealed');
      } else {
        // Completamente fuera del viewport — re-armar para proxima entrada
        e.target.classList.remove('is-revealed');
      }
    });
  }, {
    threshold: 0,
    rootMargin: '0px 0px 0px 0px'
  });

  sections.forEach(s => obs.observe(s));

  // 3) Cuando el usuario hace click en un item del nav que apunta a una seccion
  //    lejana, pre-revelamos el destino para evitar el flash 'en blanco' mientras
  //    el smooth-scroll esta en transito. El observer se encarga del resto.
  document.querySelectorAll('.nav__item, .hero__button').forEach(link => {
    link.addEventListener('click', () => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      const target = document.getElementById(href.slice(1));
      if (target && target.classList.contains('section')) {
        target.classList.add('is-revealed');
      }
    });
  });
}

/* ---------- Scroll-spy ----------
   Observa secciones del informe y el bloque #panorama. Tambien observa #portada
   (el hero) para que el item 'Panorama' del nav siga activo cuando el usuario
   esta en la portada (arriba del informe). */
function initScrollSpy() {
  const links = [...document.querySelectorAll('.nav__item')];
  const map = new Map(links.map(l => [l.getAttribute('href').slice(1), l]));
  // El item 'Panorama' apunta a #portada (hero) pero conceptualmente cubre tambien
  // la seccion #panorama. Lo activamos para ambos ids.
  const panoramaLink = map.get('portada');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('is-active'));
        if (e.target.id === 'portada' || e.target.id === 'panorama') {
          panoramaLink?.classList.add('is-active');
        } else {
          map.get(e.target.id)?.classList.add('is-active');
        }
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  // Observamos hero + todas las .section
  const portada = document.getElementById('portada');
  if (portada) obs.observe(portada);
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

/* ---------- Tooltip de hover para los items del menú lateral ----------
   Renderizado en <body> con position: fixed para escapar del overflow del sidebar.
   Funciona en cualquier estado (sidebar expandido o colapsado). */
function initSidebarNavTooltip() {
  const items = [...document.querySelectorAll('.nav__item[data-label]')];
  if (items.length === 0) return;

  const tip = document.createElement('div');
  tip.className = 'nav-tooltip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);

  const show = (item) => {
    const label = item.dataset.label || '';
    tip.textContent = label;
    const r = item.getBoundingClientRect();
    tip.style.left = `${r.right + 14}px`;
    tip.style.top = `${r.top + r.height / 2}px`;
    tip.style.transform = 'translateY(-50%) translateX(-4px)';
    // Forzamos reflow para que la transición se aplique al añadir la clase
    void tip.offsetWidth;
    tip.classList.add('is-visible');
    tip.style.transform = 'translateY(-50%) translateX(0)';
  };
  const hide = () => tip.classList.remove('is-visible');

  items.forEach(item => {
    item.addEventListener('mouseenter', () => show(item));
    item.addEventListener('mouseleave', hide);
    item.addEventListener('focus', () => show(item));
    item.addEventListener('blur', hide);
  });
}

/* ---------- Sidebar colapsable (persistido en localStorage) ---------- */
function initSidebarToggle() {
  const btn = document.getElementById('sidebarToggle');
  if (!btn) return;

  const STORAGE_KEY = 'sidebar-collapsed';
  const setCollapsed = (collapsed) => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.setAttribute('aria-label', collapsed ? 'Expandir menú' : 'Colapsar menú');
    try { localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0'); } catch (_) {}
  };

  // Restaurar preferencia previa
  let initiallyCollapsed = false;
  try { initiallyCollapsed = localStorage.getItem(STORAGE_KEY) === '1'; } catch (_) {}
  setCollapsed(initiallyCollapsed);

  btn.addEventListener('click', () => {
    setCollapsed(!document.body.classList.contains('sidebar-collapsed'));
  });
}

// Ejecutar init al cargar
init();
