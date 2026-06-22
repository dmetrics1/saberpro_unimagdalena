# Plan maestro - Informe institucional Saber Pro

## Universidad del Magdalena - Oficina Asesora de Planeación

**Versión:** 2.15
**Fecha de actualización:** Junio 2026
**Estado:** Listo para producción — datos validados contra la presentación ejecutiva oficial + diseño mobile pulido.
**Stack:** Python para procesamiento; HTML, CSS y JavaScript puro para el informe.
**Arquitectura:** `datos crudos -> scripts Python -> JSON maestro -> informe HTML`.

## 1. Objetivo

Construir y mantener un informe institucional interactivo, actualizable y verificable sobre los resultados Saber Pro de la Universidad del Magdalena. El informe permite revisar panorama institucional, posicionamiento externo, valor agregado, facultades, programas, competencias, niveles de desempeño y síntesis estratégica.

## 2. Regla metodológica central

El proyecto trabaja con dos fuentes que no deben mezclarse. La nomenclatura **Fuente A / Fuente B** es la canónica y está fijada en `meta.convencion_n` del JSON maestro.

| Fuente | Archivo o carpeta | Periodo | Medida de n | Uso |
|---|---|---:|---|---|
| **Fuente A** — Base de cruce Saber 11 - Saber Pro | `data/Perfiles_INBC_Anuales_2016_2024.parquet` | 2018-2024 | `crossed_n` con umbral >= 25 | Cuadrantes, trayectoria y valor agregado. |
| **Fuente B** — Bases agregadas Saber Pro Icfes | `data/saberpro_agregados/*.xlsx` | 2020-2025 | `CANTIDADEVALUADOS` | Panorama, SUE, departamentos, facultades, programas, Top 10 y niveles. |

Los cuadrantes y la trayectoria se reportan hasta 2024 porque la base de cruce no contiene 2025. Adicionalmente, el front filtra 2018 y 2019 porque tienen n muy bajo (≈30 evaluados). El resto del informe llega hasta 2025.

## 3. Flujo de datos

```text
Excel oficiales + parquet de cruce
        |
        v
scripts/01_construir_cuadrantes.py
scripts/02_construir_agregados.py
        |
        v
data/processed/cuadrantes_procesados.json
data/processed/agregados_procesados.json
        |
        v
scripts/03_consolidar_json.py
        |
        v
data/processed/datos_informe.json
        |
        v
informe/informe/data/datos_informe.json
        |
        v
informe/informe/index.html
```

## 4. Estado por etapas

| Etapa | Nombre | Entregable | Estado |
|---|---|---|---|
| 0 | Auditoría y cimientos | Fuentes identificadas, regla metodológica y sistema visual | Completada |
| 1 | Pipeline de datos | Scripts 01-03 y JSON maestro | Completada — v2.13: dedup correcto cuando un programa aparece con dos registros (mismo NOMBRE_PROGRAMA_ACAD, distinto ID_PROGRAMA_ACAD del Icfes) — se conserva solo el de mayor n. Nueva config `programas_por_id_icfes` para separar modalidades del mismo nombre (p. ej. Literatura presencial/distancia) y `programas_excluidos` para alinear el conjunto con la presentación ejecutiva (35 programas). Aclaración: la columna `ID_PROGRAMA_ACAD` del Excel del Icfes es un identificador interno, NO el SNIES del MEN. |
| 2 | Arquitectura narrativa | Mapa de secciones y perfiles de lector | Completada |
| 3 | Catálogo de visualizaciones | 12 visualizaciones priorizadas | Completada |
| 4 | Diseño y maquetación | Informe HTML, tokens CSS, navegación y KPIs | Completada — v2.15: **diseño mobile pulido** para producción. El sidebar pasa a barra horizontal en la parte superior con scroll-mask (gradient en el borde derecho) para indicar más items disponibles. Toggle button oculto en mobile (no aplica). Todos los cards y secciones reciben padding compacto (16/14/14) con override `body #section .card` para vencer las reglas section-specific por cascade. Cards combinados de 2 columnas se apilan automáticamente. Filtros del explorer (programas) se apilan verticalmente. Cuadrantes con 2 selectores ahora wrap correctamente. Tabs (facultades, top10) con scroll horizontal sin scrollbar visible. Metodología, glosario y rules grids pasan a 1 columna. Sin overflow horizontal a 320, 360 o 375px. v2.12: **transiciones de aparición** al hacer scroll: cada `.section` entra con fade-in + slide-up (0.7s, cubic-bezier `.16,1,.3,1`) cuando un IntersectionObserver detecta su entrada al viewport; los hijos animan con un stagger interno de 70ms. Footer del sidebar reformulado a "Oficina Asesora de Planeación / Generado: X" en estado expandido y a una píldora compacta "OAP" en estado colapsado. Respeta `prefers-reduced-motion: reduce` desactivando todas las animaciones para accesibilidad. v2.9: **sidebar colapsable** (280px ↔ 72px) con botón toggle dentro del header del brand. En estado colapsado solo muestra los iconos; en cualquier estado, al pasar el cursor por un item del menú aparece una píldora azul (tooltip flotante) con el nombre de la sección. La numeración 01-07 se retiró del menú y queda solo en los `section__eyebrow` del contenido. Estado persistido en `localStorage`. Iconos SVG inline (casa, grid, trending-up, target, briefcase, check-list, info). v2.2: sidebar flotante permanente, hero con identidad ejecutiva y 3 KPIs incrustados. |
| 5 | Visualizaciones | Gráficos interactivos en JavaScript puro | Completada — v2.14: G6 (Cuadrantes de valor agregado) gana **filtro por NBC** después del filtro de año. Cuando se elige un NBC específico, los demás NBCs verdes se atenúan (r=3.5, opacity 0.18) para mantener contexto pero destacar el seleccionado; el seleccionado recibe una etiqueta con su nombre. Adicionalmente, cuando el punto del NBC seleccionado está a <35px del punto de Unimagdalena, la etiqueta "Unimagdalena" sobre el dot azul se oculta para priorizar la lectura del NBC. v2.11: el explorador de Programas (G9) gana **barra de convenciones** (acreditado / encima / debajo / estrella) por encima de los filtros + **cajita flotante de iconos** anclada al área del radar que muestra los estados aplicables al programa seleccionado (varios badges simultáneos, p. ej. `acreditado + estrella`). Cuando un programa no tiene competencias específicas para el año seleccionado, el card lateral muestra un placeholder claro **"No presentó Competencias Específicas"** en lugar de desaparecer. v2.10: G3 (histórico institucional de Panorama) ahora incluye un selector de competencia (dropdown con `Puntaje global` por defecto + las 5 competencias genéricas) en el header de su columna del card combinado. El título pasa de dinámico a estático ("Evolución histórica 2020 – 2025") para no competir con el dropdown por el espacio. Nuevo modificador CSS `.control-select--compact` para selectores cortos que comparten fila con un título. v2.9: en Panorama los gráficos G2 (radar) y G3 (histórico) se fusionan en un card combinado de 2 columnas con divisor vertical. Todas las cards combinadas (`.panorama-card`, `.prog-genspec-card`, `.prog-history-card`) usan altura uniforme de **420px** para los `chart-container`. v2.8: en Programas se fusionan los 4 sub-gráficos en dos cards combinados (genéricas+específicas y evolución de competencias+histórico global). El antiguo "Niveles de desempeño" del programa se reemplaza por barras agrupadas año-a-año por competencia genérica. En Competencias se elimina "Niveles de desempeño institucional" y el Top 10 se computa dinámicamente por año desde los históricos de cada programa. v2.7: filtros unificados arriba (facultad + programa + año único compartido); histórico global con dos líneas reales (programa azul + NBC nacional verde) usando los nuevos bloques `radar_historico` y `especificas_historico`. v2.6: G8 (facultades) con tabs píldora + selector de año; G12 (mapa de calor) se movió de la sección 7 a la sección 5 (Facultades). v2.5: G2 (radar) con año, G4 (SUE vertical tri-color), G5 (universidades del Magdalena), G6 (cuadrantes con 4 capas). |
| 6 | Narrativa y metodología | Leads dinámicos + sección Metodología (v2.8) | Completada — v2.8: la antigua sección 07 Síntesis (matriz DOFA) se reemplaza por **07 Metodología**, que documenta para el lector no técnico las dos fuentes oficiales del ICFES (resultados agregados y datos de cruce Saber 11↔Saber Pro), el flujo de procesamiento, las reglas de interpretación y un glosario. Incluye enlace oficial al ICFES. La función `buildDofaDetails` y la lógica `dofa-*` se retiran del JS y CSS. |
| 7 | Actualización y entrega | Guía operativa, documentación técnica y `ejecutar_proyecto.bat` | Completada |

## 5. Componentes principales

| Componente | Ubicación | Estado | Comentario |
|---|---|---|---|
| Parámetros del pipeline | `data/config/parametros.yml` | Activo | Controla año vigente, umbrales, fuentes, mapeo programa-facultad, la lista de universidades del Departamento del Magdalena (`universidades_dept_magdalena`), las abreviaturas del ranking SUE (`sue_abreviaturas`), la lista de programas con acreditación de alta calidad (`programas_acreditados`, agregada en v2.11), el renombrado por ID interno del Icfes (`programas_por_id_icfes`, agregado en v2.13 — separa modalidades como presencial/distancia) y los programas excluidos del informe (`programas_excluidos`, agregado en v2.13 — alinea con la presentación ejecutiva). |
| Normalización de IES | `data/config/normalizacion_ies.csv` | Activo | Alinea nombres de instituciones entre fuentes. |
| Pipeline de cuadrantes | `scripts/01_construir_cuadrantes.py` | Activo | Genera valor agregado desde la Fuente A. |
| Pipeline de agregados | `scripts/02_construir_agregados.py` | Activo | Genera indicadores agregados desde la Fuente B. **v2.5:** lee con `polars` + `fastexcel` (motor calamine en Rust) y cachea cada Excel a `*.cache.parquet` al lado. Speedup ~4x: corrida en caliente ~30s (antes ~120s con openpyxl). El segundo recorrido (histórico) reutiliza el mismo cache, eliminando la doble lectura. |
| Consolidación | `scripts/03_consolidar_json.py` | Activo | Produce el JSON maestro. |
| Gráficos estáticos auxiliares | `scripts/16_*.py`, `scripts/17_*.py` | Activo, opcional | Generan PNG/SVG/HTML en `resultados/`. No forman parte del pipeline 01-03 ni del informe HTML. |
| Informe HTML | `informe/informe/index.html` | Activo | Consume `data/datos_informe.json`. |
| Interactividad y gráficos | `informe/informe/assets/js/app.js` | Activo | Implementa KPIs, radar, líneas, rankings, cuadrantes, explorador, Top 10, niveles, heatmap y DOFA. |
| Sistema visual | `informe/informe/assets/css/tokens.css` | Activo | Define identidad visual institucional y estilos del informe. |

## 6. Visualizaciones implementadas

Las 12 visualizaciones, su sección, tipo, fuente, prioridad y mensaje principal están descritas en el [catálogo de visualizaciones (etapa 3)](./etapa3.md). Aquí se referencia esa tabla para evitar duplicación.

## 7. Sección Metodología (reemplazo de la DOFA en v2.8)

Hasta la versión 2.7 la sección 07 era una matriz DOFA dinámica calculada con la función `buildDofaDetails` de `app.js`. En la **versión 2.8** se reemplaza por una **sección Metodología** dirigida al lector no técnico (rector, decanos, directores de programa, público externo). Cinco bloques con icono + título + contenido:

1. **Fuentes de los datos** — explica que toda la información es oficial del ICFES, distingue las dos publicaciones ("resultados agregados" y "datos de cruce Saber 11 ↔ Saber Pro") con tags de color e incluye el enlace oficial: <https://www.icfes.gov.co/evaluaciones-icfes/acerca-del-examen-saber-pro/resultados-del-examen-saber-pro/>.
2. **¿Qué es el cruce Saber 11 → Saber Pro?** — explica en lenguaje llano el emparejamiento individual y el cálculo del valor agregado, sin jerga técnica.
3. **Cómo se construye el informe** — los tres pasos del procesamiento (Carga y limpieza · Cálculo de indicadores · Publicación interactiva) sin nombres de scripts ni librerías.
4. **Reglas de interpretación** — cobertura temporal asimétrica (valor agregado 2020-2024, resto 2020-2025), programas con menos de 5 evaluados con la advertencia visual, comparativos siempre referenciados, cifras del ICFES sin retoque.
5. **Glosario rápido** — términos clave (Saber Pro, Saber 11, NBC, SUE, Valor agregado, Cuadrantes, Competencias genéricas, Competencias específicas) en lenguaje cercano.

Implementado en `informe/informe/index.html` (sección `#metodologia`) + estilos `.metodologia-*` en `tokens.css`. La función `buildDofaDetails`, la utilidad `sorted`, los textos `leadSint` y los estilos `.dofa-*` se eliminan del proyecto.

## 8. Pendientes recomendados

- Revisar editorialmente los textos de la nueva sección 07 Metodología antes de cada publicación oficial.
- Validar visualmente el informe en navegador antes de cada entrega.
- Si llega un parquet actualizado con 2025, regenerar cuadrantes y actualizar las notas de rango temporal.
- Actualizar `data/config/normalizacion_ies.csv` cuando el Icfes cambie nombres de IES o aparezcan nuevas instituciones en el SUE.

## 9. Brecha SUE: lista vs. ranking

`parametros.yml` declara 40 IES como universidades SUE. El `sue_ranking` del JSON contiene 37 porque solo se rankean las que aparecen efectivamente en la Fuente B del año vigente. Las IES que pueden faltar por no estar listadas en `INSTITUCIÓN` de los Excel oficiales son, entre otras, UNAD, Universidad de Cundinamarca y Universidad Militar Nueva Granada. Esta diferencia es esperada y debe documentarse cuando se publique el informe.

## 10. Documentación relacionada

- [Guía operativa](./guia_operativa.md)
- [Diccionario del JSON maestro](./diccionario_json.md)
- [Arquitectura narrativa](./etapa2.md)
- [Catálogo de visualizaciones](./etapa3.md)
