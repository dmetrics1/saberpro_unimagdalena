# ETAPA 3 — Catálogo de Visualizaciones
## Informe Institucional Saber Pro · Universidad del Magdalena

Catálogo completo de gráficos del informe, diseñado sobre los **campos reales** del
`datos_informe.json` generado en la Etapa 1. Cada visualización indica: sección, tipo,
campos del JSON que consume, mensaje principal, decisión que habilita, por qué se
prefiere a otras alternativas y prioridad (**Esencial / Recomendado / Opcional**).

**Convención de color (fija):** azul `#0183EF` = Unimagdalena / UNIMAGDALENA · naranja `#FF9400` =
referencia (nacional/NBC) · verde `#00A50B` = sobre la media · rojo `#D10500` = bajo
la media · primario `#004A87` = estructura.

**Principio anti-redundancia:** la presentación actual repite ~70 gráficos (uno por
programa). Aquí se sustituyen por **un único componente filtrable** (G9).

---

## Decisiones finales aprobadas (registro)

1. **Rango temporal por tipo de análisis:**
   - **Cuadrantes y trayectoria (G6, G7): 2020–2024.** Se excluyen 2018 y 2019 por su
     n muy bajo (≈30 estudiantes) y poca representatividad. La base de cruce no tiene
     2025, por eso el tope es 2024.
   - **Todo lo demás (G2, G3, G4, G5, G8, G9, G10, G11): 2020–2025.**
   - El JSON conserva 2018–2019 en `cuadrantes_por_anio` y `trayectoria_unimag`; el
     filtro "desde 2020" se aplica en el **front-end** (no se regenera el JSON).

2. **Regeneración total desde el JSON:** los 12 gráficos se construyen desde
   `datos_informe.json` con la identidad visual azul institucional y de forma
   interactiva. El PowerPoint queda solo como **referencia de contenido y estilo**; no
   se copian ni incrustan sus imágenes (que usan la paleta verde antigua y son
   estáticas).

---

## Resumen del catálogo

| ID | Sección | Gráfico | Tipo | Prioridad |
|----|---------|---------|------|-----------|
| G1 | 1 | Tarjetas KPI ejecutivas | KPI cards | Esencial |
| G2 | 2 | Radar competencias UM vs. nacional (6 ejes, filtrable por año) | Radar | Esencial |
| G3 | 2 | Evolución histórica global UM vs. nacional | Línea suave | Esencial |
| G4 | 3 | Ranking SUE (filtrable por año) | Barras verticales | Esencial |
| G5 | 3 | Comparativo con universidades del Departamento (filtrable por año) | Barras agrupadas | Esencial |
| G6 | 4 | Cuadrantes de valor agregado (filtrable por año) | Dispersión | Esencial |
| G7 | 4 | Trayectoria histórica de Unimagdalena | Recorrido temporal | Esencial |
| G8 | 5 | Desempeño por facultad (filtrable por año y competencia) | Barras horizontales | Esencial |
| G9 | 5 | Explorador de programas (componente filtrable) | Compuesto | Esencial |
| G10 | 6 | Top 10 por competencia (filtrable por año) | Barras horizontales | Esencial |
| G12 | 4 | Mapa de calor competencias × facultad (filtrable por año) | Heatmap | Esencial |

> **G11 (Niveles de desempeño institucional)** se retira del catálogo en v2.8: la información de niveles ya se cubre dentro del explorador de programas y dejaba el panorama institucional con una dimensión que el rector no usaba.

---

## SECCIÓN 1 — Hero + KPIs

### G1 · Tarjetas KPI ejecutivas — **Esencial**
- **Tipo:** 3 tarjetas KPI con icono, tag de categoría, número grande y etiqueta. Embebidas sobre la franja inferior del hero azul (efecto incrustado).
- **Datos:**
  - **Desempeño** — `institucional.global.puntaje_unimag` (150).
  - **Posicionamiento** — `programas` (% que supera el promedio de su NBC: 23/39 = 59%, con sub-línea "23 de 39 programas").
  - **Cobertura** — `institucional.global.n_unimag` (2 982 evaluados).
- **Mensaje:** "Estado de la universidad de un vistazo en tres lecturas: cómo nos desempeñamos, cómo nos posicionamos, a quiénes representamos."
- **Decisión que habilita:** el rector capta en 5 segundos los tres indicadores ejecutivos más importantes sin distracciones.
- **Por qué esta y no otra:** menos KPIs (3 en lugar de 5) elevan la jerarquía visual; el icono y el tag de color tonal (azul / verde / naranja) refuerzan la lectura categorial. La posición SUE y la variación interanual se desplazan al cuerpo del informe (Sección 3, Sección 2) para no saturar el hero.
- **Diseño:**
  - Hero con sidebar flotante permanente a la izquierda y contenido centrado verticalmente en el ancho derecho.
  - 3 tarjetas blancas con esquinas 18px, sombra elevada y línea de acento superior tonal.
  - Cada tarjeta: icono SVG en cuadro suave (trofeo / diana / personas) + píldora "DESEMPEÑO / POSICIONAMIENTO / COBERTURA" + número 2rem + etiqueta + sub-línea opcional.
  - El conjunto hero + KPIs ocupa ~70 svh para llenar el primer viewport sin asomar la sección siguiente.

---

## SECCIÓN 2 — Panorama institucional

> **v2.9:** los gráficos G2 y G3 viven dentro de un **único card combinado** (`.panorama-card`) con dos columnas separadas por un divisor vertical sutil. La columna izquierda contiene G2 (radar con selector de año) y la derecha G3 (línea histórica). Cada `chart-container` mide 420px de alto, igual al resto de cards combinados del informe.

### G2 · Radar de competencias UM vs. nacional (filtrable por año) — **Esencial**
- **Tipo:** radar de **6 ejes** (5 competencias genéricas + Puntaje Global) con **selector de año** (2020-2025) ubicado en el header de la columna.
- **Datos:** `institucional.historico[<año>].competencias` para las 5 competencias y `institucional.historico[<año>].puntaje_unimag/nacional` para el eje Puntaje Global.
- **Mensaje:** "Cómo se compara Unimagdalena con el promedio nacional en cada competencia, en el año seleccionado."
- **Decisión:** identifica fortalezas/brechas transversales y permite revisar la evolución de esas brechas cambiando el año.
- **Por qué radar:** muestra las 6 dimensiones y la forma global del perfil en una sola figura, comparando dos series sin saturar.
- **Diseño:** polígono azul (UM) sobre polígono verde (nacional) con relleno tenue; etiquetas numéricas a cada lado del eje (UM hacia un lado, Nacional hacia el otro) para que nunca se peguen aunque los valores coincidan. Marcadores sólidos de color, tooltip con la competencia y el valor al hacer hover.

### G3 · Evolución histórica UM vs. nacional (filtrable por competencia) — **Esencial**
- **Tipo:** línea temporal 2020-2025 con curvas suaves (Catmull-Rom) y **selector de competencia** en el header.
- **Datos:** `institucional.historico[]` con dos rutas:
  - **Global (default):** `puntaje_unimag` y `puntaje_nacional` por año.
  - **Por competencia:** `competencias[].puntaje_unimag` y `puntaje_nacional` del elemento cuyo `competencia` coincide con la opción seleccionada (las 5 genéricas).
- **Control:** dropdown `#selEvolComp` con la clase `control-select--compact` (variante más estrecha — 180px máx — porque comparte fila con el título estático). Opciones: `Global` (default, etiqueta "Puntaje global") + 5 competencias con sus nombres en title-case.
- **Mensaje:** "Cómo ha evolucionado la brecha con el país, en la competencia que se elija (o en el agregado Global por defecto)."
- **Decisión:** evidencia la tendencia institucional y permite ver de un vistazo qué competencia mejora más rápido, cuál se estanca y cuál sigue por debajo del estándar nacional.
- **Por qué línea:** es el formato natural para evolución temporal; el cruce de las dos líneas cuenta la historia visualmente.
- **Diseño:** título estático **"Evolución histórica 2020 – 2025"** (no se actualiza dinámicamente para no competir con el dropdown). Línea azul (UM) y verde (nacional) con marcadores sólidos; etiquetas numéricas encima/debajo de cada punto con lógica anti-choque (UM arriba si supera al nacional, abajo si no); eje Y auto-escalado a múltiplos de 5 según el rango de los datos; tooltip con el año y el valor al hacer hover.

---

## SECCIÓN 3 — Posicionamiento externo

### G4 · Ranking SUE (filtrable por año) — **Esencial**
- **Tipo:** barras **verticales** ordenadas de mayor a menor puntaje (37 universidades), con **selector de año** (2020-2025).
- **Datos:** `sue_ranking_historico[<año>]` (rank, nombre, abrev, puntaje, n, es_unimagdalena, es_caribe).
- **Mensaje:** "Posición de Unimagdalena entre las universidades públicas del país en el año seleccionado."
- **Decisión:** ubica a la institución frente a sus pares directos en el SUE y muestra cómo ha cambiado de posición año a año.
- **Por qué barras verticales:** comunica mejor el ranking comparado al ojo (vista de "perfil" de la cohorte SUE) y permite usar el eje X para etiquetas cortas con todas las 37 universidades visibles a la vez. La etiqueta de valor encima de cada barra elimina la necesidad de un eje numérico denso.
- **Diseño:**
  - **Tres categorías de color** (paleta alineada con Posicionamiento):
    - **Unimagdalena** → verde institucional (`#2BA85E`)
    - **Región Caribe** → naranja (`#FF9400`)
    - **Otras del SUE** → azul institucional (`#0F4FA8`)
  - Etiquetas X cortas (UNAL, UIS, Distrital, etc.) tomadas de `parametros.yml` bajo `sue_abreviaturas`, rotadas -45° para que las 37 quepan sin solaparse.
  - Tooltip al hover con el **nombre completo**, posición (`22 de 37`), puntaje y evaluados.
  - Etiqueta de valor encima de cada barra (la de Unimagdalena un poco más grande y en su color).
  - Leyenda inferior con las 3 categorías.

### G5 · Comparativo con universidades del Departamento (filtrable por año) — **Esencial**
- **Tipo:** barras agrupadas (6 grupos de barras: 5 competencias genéricas + Puntaje Global), con **selector de año** (2020-2025).
- **Datos:** `universidades_dept_historico[<año>]`. Universidades incluidas: Unimagdalena (a nivel `INSTITUCION`), U. Sergio Arboleda – Santa Marta y U. Cooperativa de Colombia – Santa Marta (ambas a nivel `SEDE`). La lista es configurable en `parametros.yml` bajo `universidades_dept_magdalena`.
- **Mensaje:** "Cómo se compara Unimagdalena con las universidades privadas del mismo territorio en cada competencia y en el global."
- **Decisión:** posicionamiento regional frente a la competencia directa por matrícula. Permite ver evolución cambiando el año.
- **Por qué barras agrupadas y no scatter o radar:** las barras agrupadas son el formato estándar para comparar pocas categorías × pocas series, fácil de leer para alta dirección. Cada competencia se lee independientemente sin la complejidad geométrica del radar.
- **Diseño:** Unimagdalena en azul institucional, Sergio Arboleda en verde, Cooperativa en naranja (paleta alineada con el resto del informe). Valor sobre cada barra con el color de la serie. Tooltip al hover con universidad + competencia + valor + evaluados. Leyenda inferior con los 3 nombres acortados; el tooltip muestra el nombre completo.
- **Nota:** la lista de 3 universidades es la cobertura efectiva del Icfes en Magdalena (verificado 2020-2025); UNICARIBE no reporta en las bases del Icfes para Magdalena.

---

## SECCIÓN 4 — Valor agregado (cuadrantes)

### G6 · Cuadrantes de valor agregado (filtrable por año) — **Esencial**
- **Tipo:** dispersión con 4 cuadrantes y selector de año (**2020-2024**).
- **Datos:** `cuadrantes_por_anio[año]` (limites x_mean/y_mean, instituciones[], nbcs_unimag[]). **Solo se leen los años 2020-2024; 2018-2019 se omiten en el front-end.**
- **Mensaje:** "Recibimos perfiles de entrada y los graduamos por encima de la media: ese es nuestro aporte."
- **Decisión:** demuestra el valor agregado de la formación, no solo el resultado absoluto.
- **Por qué dispersión:** es el único formato que cruza entrada (X=Saber 11) y salida (Y=Saber Pro) simultáneamente; los 4 cuadrantes dan lectura instantánea.
- **Diseño:** ejes con líneas de media; cuadrantes coloreados suaves (verde=Alto Aporte/Desempeño, rojo=Alerta); otras IES en gris, UM en rojo destacado, NBC de UM en azul. **Nota visible: datos hasta 2024.**

### G7 · Trayectoria histórica de Unimagdalena — **Esencial**
- **Tipo:** recorrido temporal sobre el plano de cuadrantes (línea con puntos por año, **2020-2024**).
- **Datos:** `trayectoria_unimag` (limites, puntos[] con anio, sb11, sbpro, cuadrante). **Filtrar puntos a 2020-2024 en el front-end.**
- **Mensaje:** "La historia de evolución: de 'Alto aporte' (2020) a 'Alto desempeño' (2024)."
- **Decisión:** narrativa central de mejora institucional — el corazón del propósito "cómo ha venido la universidad".
- **Por qué este:** convierte 7 años en una sola línea de progreso visual; es el gráfico más narrativo del informe.
- **Diseño:** flecha conectando los puntos cronológicamente, color degradado del más antiguo al más reciente, etiqueta de año en cada punto.

---

## SECCIÓN 5 — Facultades

### G8 · Desempeño por facultad (filtrable por año y por competencia) — **Esencial**
- **Tipo:** barras horizontales ordenadas, con un **selector de año** (dropdown) + **tabs de competencia** (píldoras estilo Top 10).
- **Datos:** `facultades_historico[<año>]` (6 facultades por año con `puntaje_global`, `n` y las 5 competencias genéricas, todas con promedio ponderado por evaluados). Para el año vigente cae sobre `facultades[]`.
- **Mensaje:** "Cómo le fue a cada facultad en el puntaje global y en cada competencia genérica, año a año."
- **Decisión:** focaliza apoyo institucional por facultad. El decano puede ver el desempeño global y switchear rápido entre las 5 competencias.
- **Por qué barras horizontales con tabs:**
  - Horizontales para que los nombres largos de facultad quepan a la izquierda.
  - Tabs visuales (en lugar de un segundo dropdown) hacen la comparación entre competencias 1-clic; el usuario ve en qué tab está parado.
- **Diseño:**
  - Cada barra con su propio color (paleta indexada de 6 tonos coherentes con el informe).
  - Las barras se reordenan según el valor de la competencia seleccionada (la facultad mejor en Inglés sube al tope cuando se elige Inglés).
  - Tooltip aclara "Promedio ponderado por evaluados" sin listar las demás competencias (esas se ven cambiando de tab).
  - Título dinámico: "Lectura Crítica promedio por facultad 2024" cambia al instante.

### G12 · Matriz de calor competencias × facultad (filtrable por año) — **Esencial** (sección 5)
- **Tipo:** heatmap tabular HTML (6 facultades × 5 competencias) con **selector de año** (2020-2025).
- **Datos:** `facultades_historico[<año>][].competencias[]`.
- **Mensaje:** "Vista panorámica de qué facultad domina qué competencia en cada año."
- **Decisión:** complementa a G8 mostrando todas las competencias de todas las facultades a la vez. Útil para vicerrectoría y planeación cuando hay que detectar patrones (ej. "todas las facultades flojean en Razonamiento Cuantitativo").
- **Por qué heatmap:** densidad informativa (30 celdas en un golpe de vista) imposible de transmitir con G8 sin saturar el chart.
- **Diseño:**
  - Gradiente de azul claro (`#E8F1FB`) a azul institucional (`#0F4FA8`) mapeado al rango min–max del año seleccionado.
  - Texto blanco automático en celdas con porcentaje > 0.55 del rango para mantener legibilidad.
  - Esquina `FACULTAD` y headers de columna con tratamiento editorial (mayúsculas + letter-spacing + acento bajo).
  - Columna de facultades como tarjetas blancas con borde lateral azul brillante.
  - Marcadores ★ en el valor máximo y ◇ en el mínimo del año.
  - Leyenda al pie con barra-gradiente y los valores mín/máx etiquetados como `BAJO` / `ALTO`.
  - Tooltip al hover con facultad + competencia + puntaje + año.
- **Nota de ubicación:** este gráfico estaba en la sección 7 (Síntesis) hasta v2.5; en v2.6 se mueve a la sección 5 (Facultades) porque es donde más sentido tiene narrativamente (el lector que examina facultades necesita esta vista panorámica). La sección 7 ahora se enfoca solo en la DOFA estratégica.

---

## SECCIÓN 5 — Programas

### G9 · Explorador de programas (componente filtrable) — **Esencial**
- **Tipo:** componente compuesto con **3 filtros arriba** (facultad → programa → año único compartido) que actualizan **dos cards combinados grandes** + dos cards regulares.
- **Datos:** `programas[]` (35 programas a partir de v2.13: dedup por mayor n, división de Literatura presencial/distancia, exclusión de 5 programas para alinear con la presentación ejecutiva) con los campos:
  - `competencias_2025[]`, `especificas_2025[]`, `historico[]` (rangos vigentes).
  - **`radar_historico` (v2.7):** `{<año>: {global_programa, global_nbc_nacional, n_programa, n_nbc_nacional, competencias: [5 ejes]}}` — alimenta el radar, las dos líneas del histórico global y las barras agrupadas por año.
  - **`especificas_historico` (v2.7):** `{<año>: [{prueba, puntaje_programa, puntaje_nbc_nacional, n_nbc_nacional}, …]}` — alimenta las barras específicas (solo años en que el programa rindió).
  - `nbc_id`, `nbc_nombre`, `global_nbc_nacional_2025`, `n_nbc_nacional_2025`, `n_bajo`.
- **Layout (v2.8):**
  1. **Card combinado A — "Competencias genéricas + Competencias específicas vs. NBC"** (radar izq. + barras horizontales der., con divisor vertical sutil). ViewBox cuadrado 600×600 en cada columna.
  2. **Card combinado B — "Competencias genéricas evolución 2020-2025 + Histórico puntaje global"** (barras agrupadas por año izq. + dos líneas reales der., con divisor vertical sutil). ViewBox 580×440 en cada columna.
- **Sub-vistas:**
  - **Radar genéricas** (PANORAMA_UM azul = programa; PANORAMA_NAT verde = NBC nacional): 6 ejes incluyendo Puntaje Global.
  - **Barras específicas** (mismo par de colores): horizontales agrupadas. Si el año seleccionado no tiene específicas, el card se oculta automáticamente.
  - **Barras agrupadas año-a-año por competencia genérica** (v2.8): paleta tipo Excel institucional (2020 azul / 2021 naranja / 2022 gris / 2023 amarillo / 2024 azul claro / 2025 verde). Reemplaza el antiguo "Distribución por niveles de desempeño".
  - **Histórico puntaje global** (v2.7): dos líneas reales (programa azul + NBC nacional verde) con etiquetas sobre cada punto.
- **Mensaje:** "Cada programa frente a su grupo de referencia nacional, y su evolución."
- **Decisión:** da a cada director su diagnóstico específico para el año que le interese revisar.
- **Por qué un componente filtrable y NO 39 secciones:** elimina la redundancia del PPTX (~70 gráficos repetidos); un solo módulo interactivo cubre todos los programas.
- **Diseño:** badge `⚠️ Evaluados bajos (n<5)` para programas con `n_bajo: true`. El selector único de año puebla la **unión** de años disponibles en `radar_historico` y `especificas_historico` del programa actual y controla ambos cards combinados; al cambiar de programa, el año se preserva si está disponible y si no cae al año vigente.
- **Tooltips:** todas las visualizaciones incluyen el nombre del programa en el tooltip (así el lector siempre sabe a qué programa pertenecen los números sin tener que mirar el selector).
- **Convenciones visuales (v2.11):** sobre la fila de filtros se muestra una barra `.convenciones` con los 4 indicadores que el explorador puede activar — Programa acreditado (azul), Encima de la media (verde), Debajo de la media (rojo) y Estrella (amarillo, supera al NBC en TODAS las competencias). Una **cajita flotante** anclada a la esquina superior derecha del radar muestra los indicadores aplicables al programa actualmente seleccionado; **un mismo programa puede mostrar varios badges simultáneos** (p. ej. `Acreditado + Estrella`, `Acreditado + Debajo`). Solo iconos visibles; el texto descriptivo aparece como tooltip al hover. Lista de programas acreditados configurable en `data/config/parametros.yml → programas_acreditados`.
- **Estado vacío para específicas (v2.11):** cuando el programa no rindió competencias específicas en el año seleccionado, el card lateral muestra el mensaje "No presentó Competencias Específicas" con un sub-texto que reporta el año exacto, en lugar de desaparecer (mantiene el layout estable).

---

## SECCIÓN 6 — Competencias

### G10 · Top 10 por competencia (filtrable por año) — **Esencial**
- **Tipo:** barras horizontales con tabs por competencia (Global · Lectura Crítica · Raz. Cuantitativo · Ciudadanas · Com. Escrita · Inglés) y selector de año en el header.
- **Datos:** se calcula dinámicamente en el front desde `programas[].historico` (Global) y `programas[].radar_historico[<año>].competencias[]` (genéricas). El bloque estático `top10` del JSON queda como respaldo pero no se usa.
- **Mensaje:** "Qué programas lideran cada competencia en el año que el usuario elige."
- **Decisión:** identifica referentes internos y buenas prácticas replicables, con capacidad de ver evolución histórica.
- **Diseño:** una sola card en la sección (en v2.8 se retira el antiguo card "Niveles de desempeño institucional"). Etiqueta de año dinámica en el título.

---

## TRANSVERSAL / OPCIONAL

### G12 · Mapa de calor competencias × facultad — **Esencial**
- **Tipo:** heatmap (6 facultades × 5 competencias) en la sección 4 Facultades (movido desde la antigua sección 7 en v2.6).
- **Datos:** `facultades_historico[].competencias[]`.
- **Mensaje:** "Dónde está cada fortaleza/brecha en la matriz facultad-competencia."
- **Por qué opcional:** vista densa, más analítica que ejecutiva; útil para planeación, prescindible para el rector.

---

## Notas vigentes de implementación

1. **Todos los gráficos leen del JSON** — ningún dato hardcodeado.
2. **SVG/Canvas vanilla**, sin librerías pesadas.
3. **Programas con `n_bajo: true`** siempre con advertencia visual.
4. **Cuadrantes/trayectoria** muestran nota "datos hasta 2024".
5. **Específicas variables:** algunos programas tienen 0-3 pruebas específicas; el
   componente G9 debe adaptarse (ocultar sub-vista si no hay datos).

## Registro de criterios de implementación

> "Implementa el catálogo de 12 visualizaciones definido, respetando para cada gráfico
> el tipo, los campos exactos del `datos_informe.json` que consume, y la convención de
> color (azul=UM, naranja=referencia, verde/rojo=juicio). Prioriza los Esenciales
> (G1,G2,G3,G4,G6,G7,G9). Reemplaza los gráficos repetidos por programa por el único
> componente filtrable G9. Marca visualmente los programas con n_bajo. Aplica el rango
> temporal: cuadrantes y trayectoria (G6, G7) solo años 2020-2024 (filtrar en el
> front-end, NO regenerar el JSON); el resto de gráficos 2020-2025. Todos los gráficos
> se generan desde el JSON con identidad azul; no copiar imágenes del PowerPoint."
