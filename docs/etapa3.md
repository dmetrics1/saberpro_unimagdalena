# ETAPA 3 — Catálogo de Visualizaciones
## Informe Institucional Saber Pro · Universidad del Magdalena

Catálogo completo de gráficos del informe, diseñado sobre los **campos reales** del
`datos_informe.json` generado en la Etapa 1. Cada visualización indica: sección, tipo,
campos del JSON que consume, mensaje principal, decisión que habilita, por qué se
prefiere a otras alternativas y prioridad (**Esencial / Recomendado / Opcional**).

**Convención de color (fija):** azul `#0183EF` = UNIMAGDALENA · naranja `#FF9400` =
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
| G2 | 2 | Radar competencias UM vs. nacional | Radar | Esencial |
| G3 | 2 | Evolución histórica global UM vs. nacional | Línea | Esencial |
| G4 | 3 | Ranking SUE | Barras horizontales | Esencial |
| G5 | 3 | Comparativo departamental | Barras | Recomendado |
| G6 | 4 | Cuadrantes de valor agregado (filtrable por año) | Dispersión | Esencial |
| G7 | 4 | Trayectoria histórica de UNIMAGDALENA | Recorrido temporal | Esencial |
| G8 | 5 | Desempeño por facultad | Barras / heatmap | Recomendado |
| G9 | 6 | Explorador de programas (componente filtrable) | Compuesto | Esencial |
| G10 | 7 | Top 10 por competencia | Barras horizontales | Recomendado |
| G11 | 7 | Niveles de desempeño institucional | Barras apiladas 100% | Recomendado |
| G12 | 2/7 | Mapa de calor competencias × facultad | Heatmap | Opcional |

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

### G2 · Radar de competencias UM vs. nacional — **Esencial**
- **Tipo:** radar de 5 ejes.
- **Datos:** `institucional.competencias` (5 ítems con puntaje_unimag y puntaje_nacional).
- **Mensaje:** "En qué competencias superamos al país y en cuáles no."
- **Decisión:** identifica fortalezas/brechas transversales para orientar política académica.
- **Por qué radar:** muestra las 5 competencias y la forma global del perfil en una sola figura, comparando dos series sin saturar. Alternativa (barras agrupadas) pierde la lectura de "perfil".
- **Diseño:** polígono azul (UM) sobre polígono naranja (nacional); etiquetas con el valor en cada vértice.

### G3 · Evolución histórica global UM vs. nacional — **Esencial**
- **Tipo:** línea temporal 2020-2025.
- **Datos:** `institucional.historico` (6 puntos: anio, puntaje_unimag, puntaje_nacional).
- **Mensaje:** "Cómo ha evolucionado nuestra brecha con el país: de estar por debajo (142 vs 149 en 2020) a superarlo (150 vs 148 en 2025)."
- **Decisión:** evidencia la tendencia institucional para rendición de cuentas.
- **Por qué línea:** es el formato natural para evolución temporal; el cruce de las dos líneas cuenta la historia visualmente.
- **Diseño:** línea azul (UM) y naranja (nacional); resaltar el punto donde UM supera al nacional.

---

## SECCIÓN 3 — Posicionamiento externo

### G4 · Ranking SUE — **Esencial**
- **Tipo:** barras horizontales ordenadas (37 universidades).
- **Datos:** `sue_ranking` (rank, nombre, puntaje, es_unimagdalena, es_caribe).
- **Mensaje:** "Posición de UNIMAGDALENA entre las universidades públicas del país."
- **Decisión:** ubica a la institución frente a sus pares directos (clave para el consejo superior).
- **Por qué barras horizontales:** permiten 37 etiquetas legibles y ranking claro; un scatter no comunica orden.
- **Diseño:** barra de UM en azul destacado, Caribe en color secundario, resto en gris; etiqueta de posición.

### G5 · Comparativo departamental — **Recomendado**
- **Tipo:** barras (26 departamentos).
- **Datos:** `departamento` (departamento, puntaje, es_magdalena, es_caribe).
- **Mensaje:** "Magdalena frente a otros departamentos y la región Caribe."
- **Decisión:** contexto territorial del desempeño.
- **Por qué recomendado y no esencial:** complementa el ranking SUE pero el rector prioriza el SUE; útil para contexto regional.

---

## SECCIÓN 4 — Valor agregado (cuadrantes)

### G6 · Cuadrantes de valor agregado (filtrable por año) — **Esencial**
- **Tipo:** dispersión con 4 cuadrantes y selector de año (**2020-2024**).
- **Datos:** `cuadrantes_por_anio[año]` (limites x_mean/y_mean, instituciones[], nbcs_unimag[]). **Solo se leen los años 2020-2024; 2018-2019 se omiten en el front-end.**
- **Mensaje:** "Recibimos perfiles de entrada y los graduamos por encima de la media: ese es nuestro aporte."
- **Decisión:** demuestra el valor agregado de la formación, no solo el resultado absoluto.
- **Por qué dispersión:** es el único formato que cruza entrada (X=Saber 11) y salida (Y=Saber Pro) simultáneamente; los 4 cuadrantes dan lectura instantánea.
- **Diseño:** ejes con líneas de media; cuadrantes coloreados suaves (verde=Alto Aporte/Desempeño, rojo=Alerta); otras IES en gris, UM en rojo destacado, NBC de UM en azul. **Nota visible: datos hasta 2024.**

### G7 · Trayectoria histórica de UNIMAGDALENA — **Esencial**
- **Tipo:** recorrido temporal sobre el plano de cuadrantes (línea con puntos por año, **2020-2024**).
- **Datos:** `trayectoria_unimag` (limites, puntos[] con anio, sb11, sbpro, cuadrante). **Filtrar puntos a 2020-2024 en el front-end.**
- **Mensaje:** "La historia de evolución: de 'Alto aporte' (2020) a 'Alto desempeño' (2024)."
- **Decisión:** narrativa central de mejora institucional — el corazón del propósito "cómo ha venido la universidad".
- **Por qué este:** convierte 7 años en una sola línea de progreso visual; es el gráfico más narrativo del informe.
- **Diseño:** flecha conectando los puntos cronológicamente, color degradado del más antiguo al más reciente, etiqueta de año en cada punto.

---

## SECCIÓN 5 — Facultades

### G8 · Desempeño por facultad — **Recomendado**
- **Tipo:** barras ordenadas + opción heatmap de competencias.
- **Datos:** `facultades` (6 ítems: facultad, puntaje_global, n, competencias[]).
- **Mensaje:** "Qué facultad lidera y cuál requiere acompañamiento."
- **Decisión:** focaliza apoyo institucional por facultad (vista para decanos).
- **Por qué recomendado:** nivel intermedio entre institución y programa; valioso pero el rector lo ve después del panorama.
- **Diseño:** barras de puntaje global por facultad (azul), con mini-heatmap opcional de las 5 competencias por facultad.

---

## SECCIÓN 6 — Programas

### G9 · Explorador de programas (componente filtrable) — **Esencial**
- **Tipo:** componente compuesto con selector facultad→programa, que actualiza 4 sub-vistas.
- **Datos:** `programas[]` (39 programas: competencias_2025[], especificas_2025[], niveles_2025[], historico[], global vs global_nbc_nacional, n_bajo).
- **Sub-vistas al seleccionar un programa:**
  1. Radar de competencias genéricas del programa vs. su NBC nacional.
  2. Barras de competencias específicas vs. NBC (ojo: algunos programas tienen 0 específicas → ocultar la sub-vista).
  3. Histórico del programa (línea 2020-2025).
  4. Niveles de desempeño del programa vs. NBC (barras apiladas).
- **Mensaje:** "Cada programa frente a su grupo de referencia nacional, y su evolución."
- **Decisión:** da a cada director su diagnóstico específico.
- **Por qué un componente filtrable y NO 39 secciones:** elimina la redundancia del PPTX (~70 gráficos repetidos); un solo módulo interactivo cubre todos los programas y escala solo cuando se agregan más.
- **Diseño:** badge de advertencia para programas con `n_bajo: true`; comparación siempre vs. NBC en naranja.

---

## SECCIÓN 7 — Competencias y Top 10

### G10 · Top 10 por competencia — **Recomendado**
- **Tipo:** barras horizontales, con pestañas por competencia.
- **Datos:** `top10.por_competencia` (5 competencias, 10 programas c/u) + `top10.global`.
- **Mensaje:** "Qué programas lideran cada competencia."
- **Decisión:** identifica referentes internos y buenas prácticas replicables.
- **Por qué recomendado:** reconocimiento y benchmarking interno; no es lo primero que ve el rector.

### G11 · Niveles de desempeño institucional — **Recomendado**
- **Tipo:** barras apiladas al 100% (Nivel 1-5), UM vs. nacional, por competencia.
- **Datos:** `niveles_desempeno` (5 competencias con distribucion_unimag[5] y distribucion_nacional[5]).
- **Mensaje:** "Cómo se distribuye nuestra población por nivel de logro — no solo el promedio."
- **Decisión:** revela si el promedio esconde concentración en niveles bajos/altos. **Análisis nuevo que el PPTX no tiene.**
- **Por qué recomendado:** aporta profundidad que el promedio oculta; valioso para vicerrectoría académica.
- **Diseño:** barras apiladas con escala de color de rojo (Nivel 1) a verde (Nivel 5); par UM/nacional por competencia.

---

## TRANSVERSAL / OPCIONAL

### G12 · Mapa de calor competencias × facultad — **Opcional**
- **Tipo:** heatmap (6 facultades × 5 competencias).
- **Datos:** `facultades[].competencias[]`.
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
