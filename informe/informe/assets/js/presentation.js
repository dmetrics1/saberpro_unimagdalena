/* ============================================================================
   PRESENTATION MODE — controlador.

   Capa modular que transforma el informe en una experiencia tipo Keynote.
   NO modifica el HTML del informe en su DOM original; mueve temporalmente
   los nodos al .slides-track al entrar y los devuelve al salir.

   Funcionalidades:
   - 7 slides full-viewport agrupando hero, kpi-grid y las 7 secciones del
     informe.
   - Navegacion: flechas, espacio, PageUp/Down, rueda del mouse, swipe,
     botones flotantes y toolbar.
   - Pantalla completa via Fullscreen API.
   - Barra de progreso en la parte superior.
   - Modal de ayuda la primera vez (recordado con localStorage).
   - prefers-reduced-motion respetado por el CSS.
   - Reanima el contenido al activar cada slide (clase .is-active dispara
     transiciones del CSS).

   Arquitectura: clase PresentationMode con metodos publicos
   .init(), .enter(), .exit(), .goto(n), .next(), .prev().
   Toda la UI auxiliar se crea on-demand al entrar y se destruye al salir.
   ============================================================================ */

(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     Definicion del storytelling de la presentacion. Cada entrada agrupa una o
     mas secciones del informe en una slide unica. Los selectors son los
     elementos del DOM original que seran movidos al slide__content.
     ------------------------------------------------------------------------- */
  const SLIDE_GROUPS = [
    {
      id: 'portada',
      title: 'Portada',
      subtitle: 'Informe Saber Pro 2025',
      eyebrow: 'Slide 01',
      selectors: ['.hero', '.kpi-grid'],   // KPIs viven en la portada (impacto inicial)
      hideHead: true   // La portada NO muestra slide__head — el hero ES el head
    },
    {
      id: 'panorama',
      title: 'Panorama Institucional',
      subtitle: 'Resultados Saber Pro 2025 · UNIMAGDALENA',
      eyebrow: 'Slide 02',
      selectors: ['#panorama']   // KPIs movidos a portada; aqui solo radar + evolucion
    },
    {
      id: 'posicionamiento',
      title: 'Posicionamiento Externo',
      subtitle: '¿Cómo nos comparamos con las demás universidades del país?',
      eyebrow: 'Slide 03',
      selectors: ['#posicionamiento']
    },
    {
      id: 'facultades',
      title: 'Facultades',
      subtitle: 'Desempeño promedio por facultad y competencia',
      eyebrow: 'Slide 04',
      selectors: ['#facultades']
    },
    {
      id: 'programas-a',
      title: 'Programas — Competencias 2025',
      subtitle: 'Genéricas y específicas del programa vs. promedio nacional del NBC',
      eyebrow: 'Slide 05',
      // Splitteamos Programas en 2 slides para no comprimir los charts.
      // Slide A: convenciones + filtros + card con radar + barras
      selectors: ['#programas .convenciones', '#programas .explorer-controls', '#programas .prog-genspec-card']
    },
    {
      id: 'programas-b',
      title: 'Programas — Histórico',
      subtitle: 'Evolución temporal del programa seleccionado',
      eyebrow: 'Slide 06',
      // Slide B: card con histórico de competencias + histórico de puntaje global
      selectors: ['#programas .prog-history-card']
    },
    {
      id: 'competencias',
      title: 'Competencias',
      subtitle: 'Top 10 programas líderes por competencia genérica',
      eyebrow: 'Slide 07',
      selectors: ['#competencias']
    },
    {
      id: 'valor-agregado',
      title: 'Valor Agregado',
      subtitle: 'Trayectoria y cuadrantes de aporte formativo',
      eyebrow: 'Slide 08',
      selectors: ['#valor-agregado']
    },
    {
      id: 'metodologia',
      title: 'Metodología',
      subtitle: 'Fuentes oficiales, flujo de procesamiento y glosario',
      eyebrow: 'Slide 09',
      selectors: ['#metodologia']
    }
  ];

  const TOTAL = SLIDE_GROUPS.length;
  const HELP_STORAGE_KEY = 'presentation-help-dismissed-v1';
  const SWIPE_THRESHOLD = 60;
  const WHEEL_DEBOUNCE_MS = 600;


  /* -------------------------------------------------------------------------
     Helper para crear elementos con atributos. Reusa el patron del informe.
     ------------------------------------------------------------------------- */
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v == null) return;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v);
    });
    children.flat().forEach(c => {
      if (c == null) return;
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  }

  /* -------------------------------------------------------------------------
     Iconos SVG inline para los botones (consistentes con el resto del informe).
     ------------------------------------------------------------------------- */
  const ICONS = {
    play:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    prev:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    next:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
    fullshrink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>',
    exit:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
  };


  /* -------------------------------------------------------------------------
     PresentationMode — clase controladora.
     ------------------------------------------------------------------------- */
  class PresentationMode {
    constructor() {
      this.active = false;
      this.currentSlide = 0;
      this.slides = [];                 // array de {wrapper, originals: [{node, parent, nextSibling}]}
      this.frame = null;                // .presentation-frame
      this.track = null;                // .slides-track
      this.progress = null;             // .presentation-progress__fill
      this.counter = null;              // .presentation-toolbar__counter
      this.prevBtn = null;
      this.nextBtn = null;
      this.fullBtn = null;
      this.help = null;
      this.touch = { x0: 0, y0: 0, active: false };
      this.lastWheelTs = 0;

      // Bind para poder removerlos despues
      this._onKey = this._onKey.bind(this);
      this._onWheel = this._onWheel.bind(this);
      this._onTouchStart = this._onTouchStart.bind(this);
      this._onTouchMove = this._onTouchMove.bind(this);
      this._onTouchEnd = this._onTouchEnd.bind(this);
      this._onFullscreenChange = this._onFullscreenChange.bind(this);
    }

    /* ---------- Bootstrap publico ---------- */
    init() {
      const trigger = document.getElementById('presentationTrigger');
      if (trigger) trigger.addEventListener('click', () => this.enter());
    }

    /* ---------- API publica ---------- */
    enter() {
      if (this.active) return;
      this.active = true;
      this._createFrame();
      this._moveSectionsIntoSlides();
      document.body.classList.add('is-presentation-mode');
      this._attachListeners();
      this._hookNavToSlides();
      // Pequeño delay para que el body se reflowee antes de activar la slide.
      requestAnimationFrame(() => {
        this.goto(0, { animate: false });
        if (!localStorage.getItem(HELP_STORAGE_KEY)) {
          setTimeout(() => this._showHelp(), 400);
        }
      });
    }

    exit() {
      if (!this.active) return;
      this.active = false;
      this._detachListeners();
      this._unhookNavFromSlides();
      // Cerrar el drawer si estaba abierto
      document.body.classList.remove('nav-open');
      if (document.fullscreenElement) {
        try { document.exitFullscreen(); } catch (e) { /* ignore */ }
      }
      this._restoreSections();
      this._destroyFrame();
      document.body.classList.remove('is-presentation-mode');
    }

    goto(idx, { animate = true } = {}) {
      if (!this.active) return;
      const clamped = Math.max(0, Math.min(TOTAL - 1, idx));
      this.currentSlide = clamped;

      if (this.track) {
        this.track.style.transition = animate ? '' : 'none';
        this.track.style.transform = `translateX(-${clamped * 100}vw)`;
        if (!animate) {
          // Forzar reflow para que la siguiente transicion vuelva a funcionar
          // eslint-disable-next-line no-unused-expressions
          this.track.offsetWidth;
          this.track.style.transition = '';
        }
      }
      // Marcar slide activa para disparar las animaciones internas
      this.slides.forEach((s, i) => s.wrapper.classList.toggle('is-active', i === clamped));

      // Mostrar/ocultar filtros compartidos de programas segun el slide activo
      this._updateProgramasTools(this.slides[clamped]?.group.id);

      // Actualizar UI
      if (this.progress) this.progress.style.width = `${((clamped + 1) / TOTAL) * 100}%`;
      if (this.counter) this.counter.textContent = `${clamped + 1} / ${TOTAL}`;
      if (this.prevBtn) this.prevBtn.disabled = clamped === 0;
      if (this.nextBtn) this.nextBtn.disabled = clamped === TOTAL - 1;
    }

    next() { this.goto(this.currentSlide + 1); }
    prev() { this.goto(this.currentSlide - 1); }


    /* ---------- Privados: DOM ---------- */
    _createFrame() {
      // Barra de progreso
      const progressFill = el('div', { class: 'presentation-progress__fill' });
      const progress = el('div', { class: 'presentation-progress' }, progressFill);
      this.progress = progressFill;

      // Track con 7 slides (los wrappers se llenan en _moveSectionsIntoSlides)
      const track = el('div', { class: 'slides-track' });
      this.slides = SLIDE_GROUPS.map((g, i) => {
        const content = el('div', { class: 'slide__content', 'data-slide-content': g.id });
        const wrapperClasses = 'slide' + (g.hideHead ? ' slide--cover' : '');
        // Slides marcados con hideHead (portada) no muestran el slide__head:
        // su contenido (.hero) actua como portada de impacto.
        if (g.hideHead) {
          const wrapper = el('div', { class: wrapperClasses, 'data-slide': g.id, 'data-index': String(i) }, content);
          return { wrapper, content, group: g, originals: [] };
        }
        const head = el('div', { class: 'slide__head' },
          el('div', { class: 'slide__head-text' },
            el('h2', { class: 'slide__title' }, g.title),
            el('p',  { class: 'slide__subtitle' }, g.subtitle)
          ),
          el('div', { class: 'slide__number' }, g.eyebrow)
        );
        const wrapper = el('div', { class: wrapperClasses, 'data-slide': g.id, 'data-index': String(i) }, head, content);
        return { wrapper, content, group: g, originals: [] };
      });
      this.slides.forEach(s => track.appendChild(s.wrapper));
      this.track = track;

      // Boton flecha izquierda
      this.prevBtn = el('button', {
        class: 'presentation-nav presentation-nav--prev',
        type: 'button',
        'aria-label': 'Slide anterior',
        html: ICONS.prev,
        onclick: () => this.prev()
      });

      // Boton flecha derecha
      this.nextBtn = el('button', {
        class: 'presentation-nav presentation-nav--next',
        type: 'button',
        'aria-label': 'Slide siguiente',
        html: ICONS.next,
        onclick: () => this.next()
      });

      // Toolbar inferior
      const counter = el('div', { class: 'presentation-toolbar__counter' }, `1 / ${TOTAL}`);
      this.counter = counter;
      const btnPrev = el('button', {
        class: 'presentation-toolbar__btn', type: 'button', 'aria-label': 'Anterior',
        html: ICONS.prev + '<span>Anterior</span>',
        onclick: () => this.prev()
      });
      const btnNext = el('button', {
        class: 'presentation-toolbar__btn', type: 'button', 'aria-label': 'Siguiente',
        html: '<span>Siguiente</span>' + ICONS.next,
        onclick: () => this.next()
      });
      this.fullBtn = el('button', {
        class: 'presentation-toolbar__btn presentation-toolbar__btn--icon',
        type: 'button', 'aria-label': 'Pantalla completa',
        html: ICONS.fullscreen,
        onclick: () => this._toggleFullscreen()
      });
      const btnExit = el('button', {
        class: 'presentation-toolbar__btn presentation-toolbar__btn--exit', type: 'button',
        'aria-label': 'Volver al informe',
        html: ICONS.exit + '<span>Volver al informe</span>',
        onclick: () => this.exit()
      });
      const toolbar = el('div', { class: 'presentation-toolbar', role: 'toolbar', 'aria-label': 'Controles de presentación' },
        btnPrev, counter, btnNext,
        el('div', { class: 'presentation-toolbar__divider' }),
        this.fullBtn,
        el('div', { class: 'presentation-toolbar__divider' }),
        btnExit
      );

      // Frame principal
      const frame = el('div', { class: 'presentation-frame', role: 'region', 'aria-label': 'Modo presentación' },
        progress, track, this.prevBtn, this.nextBtn, toolbar
      );
      this.frame = frame;
      document.body.appendChild(frame);
    }

    _destroyFrame() {
      if (this.frame && this.frame.parentNode) {
        this.frame.parentNode.removeChild(this.frame);
      }
      if (this.help && this.help.parentNode) {
        this.help.parentNode.removeChild(this.help);
      }
      this.frame = this.track = this.progress = this.counter = null;
      this.prevBtn = this.nextBtn = this.fullBtn = this.help = null;
      this.slides = [];
    }

    /* Mueve los nodos del DOM original (hero, kpi-grid, secciones) al
       .slide__content correspondiente. Memoriza padre + nextSibling para
       restaurar al salir. */
    _moveSectionsIntoSlides() {
      this.slides.forEach(s => {
        s.group.selectors.forEach(sel => {
          const node = document.querySelector(sel);
          if (!node) return;
          s.originals.push({ node, parent: node.parentNode, nextSibling: node.nextSibling });
          s.content.appendChild(node);
        });
      });
      // Caso especial: en Slide 04 Facultades, convertir las tabs--facultad
      // en un <select> dropdown para liberar espacio vertical para el bar chart.
      const facultades = this.slides.find(s => s.group.id === 'facultades');
      if (facultades) {
        const tabs = facultades.content.querySelector('.tabs--facultad');
        if (tabs && tabs.children.length > 0) {
          // Crear select
          const select = document.createElement('select');
          select.className = 'control-select facultad-comp-select';
          select.id = 'facultadCompSelect';
          [...tabs.children].forEach((tab, i) => {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = tab.textContent.trim();
            if (tab.classList.contains('is-active')) opt.selected = true;
            select.appendChild(opt);
          });
          // Sync: al cambiar el select, disparar click del tab equivalente
          select.addEventListener('change', (e) => {
            const idx = parseInt(e.target.value, 10);
            const targetTab = tabs.children[idx];
            if (targetTab) targetTab.click();
          });
          // Sync inverso: si una tab cambia de active (por algun otro flujo),
          // actualizar el select
          const observer = new MutationObserver(() => {
            const activeIdx = [...tabs.children].findIndex(t => t.classList.contains('is-active'));
            if (activeIdx >= 0 && select.selectedIndex !== activeIdx) {
              select.selectedIndex = activeIdx;
            }
          });
          [...tabs.children].forEach(t => observer.observe(t, { attributes: true, attributeFilter: ['class'] }));
          this._facultadesTabObserver = observer;
          // Wrapper para el select — insertarlo dentro del card__header-flex
          // (junto al filtro de año) para que ambos queden en la misma fila
          const wrap = document.createElement('div');
          wrap.className = 'select-wrapper facultad-comp-wrapper';
          wrap.appendChild(select);
          const card = tabs.closest('.card');
          const header = card?.querySelector('.card__header-flex');
          const yearWrapper = header?.querySelector('.card__controls, .select-wrapper');
          if (header && yearWrapper) {
            header.insertBefore(wrap, yearWrapper);
          } else if (header) {
            header.appendChild(wrap);
          } else {
            tabs.parentNode.insertBefore(wrap, tabs);
          }
          this._facultadesSelectWrap = wrap;
        }
      }

      // Caso especial: convenciones en slide programas-a se mueven al slide__head
      // (chip compacto al lado del badge SLIDE 05 con tooltip por icono).
      const programasA = this.slides.find(s => s.group.id === 'programas-a');
      if (programasA) {
        const conv = programasA.content.querySelector('.convenciones');
        const head = programasA.wrapper.querySelector('.slide__head');
        if (conv && head) {
          // Insertarlo ANTES del slide__number para que quede a la izquierda del badge
          const number = head.querySelector('.slide__number');
          if (number) head.insertBefore(conv, number);
          else head.appendChild(conv);
        }
      }

      // Caso especial: filtros de programa son COMPARTIDOS entre slide 5 y 6.
      // Los movemos a un container fixed posicionado encima del slide-area; asi
      // siguen visibles cuando navegas entre programas-a (Competencias) y
      // programas-b (Histórico) sin necesidad de duplicarlos.
      if (programasA) {
        const filters = programasA.content.querySelector('.explorer-controls');
        if (filters && this.frame) {
          this._programasFiltersOriginal = {
            node: filters,
            parent: filters.parentNode,
            nextSibling: filters.nextSibling
          };
          this.frame.appendChild(filters);
          filters.classList.add('presentation-programas-tools');
        }
      }
    }

    /* Mostrar/ocultar el container compartido de filtros segun el slide activo */
    _updateProgramasTools(activeId) {
      const filters = this.frame?.querySelector('.presentation-programas-tools');
      if (!filters) return;
      const visible = (activeId === 'programas-a' || activeId === 'programas-b');
      filters.classList.toggle('is-visible', visible);
    }

    /* Devuelve cada nodo a su parent original en el mismo orden. */
    _restoreSections() {
      // Restaurar los filtros compartidos de programas a su posicion original
      if (this._programasFiltersOriginal) {
        const { node, parent, nextSibling } = this._programasFiltersOriginal;
        node.classList.remove('presentation-programas-tools', 'is-visible');
        if (parent) parent.insertBefore(node, nextSibling);
        this._programasFiltersOriginal = null;
      }
      // Limpiar el select dinamico de facultades + observer
      if (this._facultadesTabObserver) {
        this._facultadesTabObserver.disconnect();
        this._facultadesTabObserver = null;
      }
      if (this._facultadesSelectWrap && this._facultadesSelectWrap.parentNode) {
        this._facultadesSelectWrap.parentNode.removeChild(this._facultadesSelectWrap);
        this._facultadesSelectWrap = null;
      }
      this.slides.forEach(s => {
        // Iterar en orden inverso para que nextSibling sea consistente
        for (let i = s.originals.length - 1; i >= 0; i--) {
          const { node, parent, nextSibling } = s.originals[i];
          if (parent) parent.insertBefore(node, nextSibling);
        }
      });
    }

    /* ---------- Privados: hook del menu lateral ----------
       Cuando estamos en presentacion, los .nav__item del sidebar deben navegar
       al slide correspondiente (en lugar de hacer scroll-to-section). Guardamos
       los listeners originales para restaurarlos al salir. */
    _hookNavToSlides() {
      // Mapeo data-label -> id de slide. El item 'Panorama' lleva a la portada
      // porque conceptualmente la portada es la entrada al panorama institucional.
      const LABEL_TO_SLIDE_ID = {
        'Panorama': 'portada',
        'Posicionamiento': 'posicionamiento',
        'Facultades': 'facultades',
        'Programas': 'programas-a',
        'Competencias': 'competencias',
        'Valor agregado': 'valor-agregado',
        'Metodología': 'metodologia'
      };
      this._navHandlers = [];
      document.querySelectorAll('.nav__item').forEach(link => {
        const label = link.getAttribute('data-label');
        const slideId = LABEL_TO_SLIDE_ID[label];
        if (!slideId) return;
        const slideIdx = this.slides.findIndex(s => s.group.id === slideId);
        if (slideIdx < 0) return;
        const handler = (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.goto(slideIdx);
          // Cerrar el drawer despues de navegar
          document.body.classList.remove('nav-open');
        };
        // capture=true para correr ANTES del listener original del informe
        link.addEventListener('click', handler, true);
        this._navHandlers.push({ link, handler });
      });
      // Tambien hook al backdrop para cerrar drawer
      const backdrop = document.getElementById('sidebarBackdrop');
      if (backdrop) {
        this._backdropHandler = () => document.body.classList.remove('nav-open');
        backdrop.addEventListener('click', this._backdropHandler);
      }
      // El boton sidebar-toggle (rectangulo dentro del drawer) — en presentacion
      // su funcion es CERRAR el drawer, no colapsar el sidebar.
      const sidebarToggle = document.getElementById('sidebarToggle');
      if (sidebarToggle) {
        this._sidebarToggleHandler = (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          document.body.classList.remove('nav-open');
        };
        sidebarToggle.addEventListener('click', this._sidebarToggleHandler, true);
      }
    }
    _unhookNavFromSlides() {
      if (this._navHandlers) {
        this._navHandlers.forEach(({ link, handler }) => link.removeEventListener('click', handler, true));
        this._navHandlers = null;
      }
      const backdrop = document.getElementById('sidebarBackdrop');
      if (backdrop && this._backdropHandler) {
        backdrop.removeEventListener('click', this._backdropHandler);
        this._backdropHandler = null;
      }
      const sidebarToggle = document.getElementById('sidebarToggle');
      if (sidebarToggle && this._sidebarToggleHandler) {
        sidebarToggle.removeEventListener('click', this._sidebarToggleHandler, true);
        this._sidebarToggleHandler = null;
      }
    }


    /* ---------- Privados: listeners ---------- */
    _attachListeners() {
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('wheel', this._onWheel, { passive: true });
      this.frame.addEventListener('touchstart', this._onTouchStart, { passive: true });
      this.frame.addEventListener('touchmove', this._onTouchMove, { passive: true });
      this.frame.addEventListener('touchend', this._onTouchEnd);
      document.addEventListener('fullscreenchange', this._onFullscreenChange);
    }
    _detachListeners() {
      window.removeEventListener('keydown', this._onKey);
      window.removeEventListener('wheel', this._onWheel);
      if (this.frame) {
        this.frame.removeEventListener('touchstart', this._onTouchStart);
        this.frame.removeEventListener('touchmove', this._onTouchMove);
        this.frame.removeEventListener('touchend', this._onTouchEnd);
      }
      document.removeEventListener('fullscreenchange', this._onFullscreenChange);
    }

    /* ---------- Privados: handlers ---------- */
    _onKey(e) {
      // Si el modal de ayuda esta abierto solo responde a Escape/Enter
      if (this.help && this.help.classList.contains('is-open')) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._dismissHelp();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault(); this.next(); break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault(); this.prev(); break;
        case 'Escape':
          e.preventDefault(); this.exit(); break;
        case 'f': case 'F':
          e.preventDefault(); this._toggleFullscreen(); break;
        case 'Home':
          e.preventDefault(); this.goto(0); break;
        case 'End':
          e.preventDefault(); this.goto(TOTAL - 1); break;
      }
    }

    _onWheel(e) {
      const now = Date.now();
      if (now - this.lastWheelTs < WHEEL_DEBOUNCE_MS) return;
      // Solo navegar con scroll predominantemente vertical y suficiente magnitud.
      if (Math.abs(e.deltaY) < 24) return;
      // Si la slide tiene scroll interno y NO esta en el limite, dejar que la
      // pagina haga scroll normal (no interceptamos).
      const slide = this.slides[this.currentSlide]?.wrapper;
      if (slide) {
        const atTop = slide.scrollTop === 0;
        const atBottom = Math.ceil(slide.scrollTop + slide.clientHeight) >= slide.scrollHeight;
        if (e.deltaY > 0 && !atBottom) return;
        if (e.deltaY < 0 && !atTop) return;
      }
      this.lastWheelTs = now;
      if (e.deltaY > 0) this.next(); else this.prev();
    }

    _onTouchStart(e) {
      if (!e.touches || e.touches.length === 0) return;
      this.touch.x0 = e.touches[0].clientX;
      this.touch.y0 = e.touches[0].clientY;
      this.touch.active = true;
    }
    _onTouchMove(e) {
      // sin-op: solo necesitamos start/end para detectar swipe.
      // No previene el scroll vertical interno del slide.
    }
    _onTouchEnd(e) {
      if (!this.touch.active) return;
      this.touch.active = false;
      const t = (e.changedTouches && e.changedTouches[0]) || null;
      if (!t) return;
      const dx = t.clientX - this.touch.x0;
      const dy = t.clientY - this.touch.y0;
      // Solo navegar si el desplazamiento horizontal domina al vertical
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) <= Math.abs(dy)) return;
      if (dx < 0) this.next(); else this.prev();
    }

    _onFullscreenChange() {
      if (!this.fullBtn) return;
      const isFull = !!document.fullscreenElement;
      this.fullBtn.innerHTML = isFull ? ICONS.fullshrink : ICONS.fullscreen;
      this.fullBtn.setAttribute('aria-label', isFull ? 'Salir de pantalla completa' : 'Pantalla completa');
    }

    /* ---------- Privados: fullscreen ---------- */
    _toggleFullscreen() {
      const target = document.documentElement;
      try {
        if (!document.fullscreenElement) {
          if (target.requestFullscreen) target.requestFullscreen();
          else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
      } catch (err) {
        console.warn('Fullscreen no disponible:', err);
      }
    }

    /* ---------- Privados: ayuda primera vez ---------- */
    _showHelp() {
      if (this.help) return;
      const panel = el('div', { class: 'presentation-help__panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'presentationHelpTitle' },
        el('h3', { id: 'presentationHelpTitle', class: 'presentation-help__title' }, 'Controles del Modo Presentación'),
        el('p',  { class: 'presentation-help__sub' }, 'Usa el teclado, el mouse o gestos táctiles para navegar entre las 7 diapositivas del informe.'),
        el('div', { class: 'presentation-help__keys' },
          el('div', { class: 'presentation-help__key' }, el('kbd', {}, '→  Espacio'),  el('span', {}, 'Siguiente')),
          el('div', { class: 'presentation-help__key' }, el('kbd', {}, '←'),           el('span', {}, 'Anterior')),
          el('div', { class: 'presentation-help__key' }, el('kbd', {}, 'Esc'),         el('span', {}, 'Salir')),
          el('div', { class: 'presentation-help__key' }, el('kbd', {}, 'F'),           el('span', {}, 'Pantalla completa')),
          el('div', { class: 'presentation-help__key' }, el('kbd', {}, 'Swipe'),       el('span', {}, 'Touch en móvil')),
          el('div', { class: 'presentation-help__key' }, el('kbd', {}, 'Scroll'),      el('span', {}, 'Rueda del mouse'))
        ),
        el('button', { class: 'presentation-help__cta', type: 'button', onclick: () => this._dismissHelp() }, 'Entendido')
      );
      this.help = el('div', { class: 'presentation-help' }, panel);
      document.body.appendChild(this.help);
      requestAnimationFrame(() => this.help.classList.add('is-open'));
    }
    _dismissHelp() {
      if (!this.help) return;
      this.help.classList.remove('is-open');
      localStorage.setItem(HELP_STORAGE_KEY, '1');
      const node = this.help;
      this.help = null;
      setTimeout(() => { if (node.parentNode) node.parentNode.removeChild(node); }, 350);
    }
  }


  /* -------------------------------------------------------------------------
     Bootstrap.
     ------------------------------------------------------------------------- */
  const presentationMode = new PresentationMode();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => presentationMode.init());
  } else {
    presentationMode.init();
  }
  // Exponer en window para tests, debugging y posibles integraciones (ej. boton
  // alternativo desde teclas externas).
  window.PresentationMode = presentationMode;
})();
