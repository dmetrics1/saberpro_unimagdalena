# Plan maestro - Informe institucional Saber Pro

## Universidad del Magdalena - Oficina Asesora de Planeación

**Versión:** 2.2
**Fecha de actualización:** Junio 2026
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
| 1 | Pipeline de datos | Scripts 01-03 y JSON maestro | Completada |
| 2 | Arquitectura narrativa | Mapa de secciones y perfiles de lector | Completada |
| 3 | Catálogo de visualizaciones | 12 visualizaciones priorizadas | Completada |
| 4 | Diseño y maquetación | Informe HTML, tokens CSS, navegación y KPIs | Completada — rediseño v2.2 (sidebar flotante permanente, hero con identidad ejecutiva y 3 KPIs incrustados) |
| 5 | Visualizaciones | Gráficos interactivos en JavaScript puro | Completada |
| 6 | Narrativa y síntesis | Leads dinámicos y DOFA derivada de datos | Completada (ver §7 para revisión editorial pendiente) |
| 7 | Actualización y entrega | Guía operativa, documentación técnica y `ejecutar_proyecto.bat` | Completada |

## 5. Componentes principales

| Componente | Ubicación | Estado | Comentario |
|---|---|---|---|
| Parámetros del pipeline | `data/config/parametros.yml` | Activo | Controla año vigente, umbrales, fuentes y mapeo programa-facultad. |
| Normalización de IES | `data/config/normalizacion_ies.csv` | Activo | Alinea nombres de instituciones entre fuentes. |
| Pipeline de cuadrantes | `scripts/01_construir_cuadrantes.py` | Activo | Genera valor agregado desde la Fuente A. |
| Pipeline de agregados | `scripts/02_construir_agregados.py` | Activo | Genera indicadores agregados desde la Fuente B. |
| Consolidación | `scripts/03_consolidar_json.py` | Activo | Produce el JSON maestro. |
| Gráficos estáticos auxiliares | `scripts/16_*.py`, `scripts/17_*.py` | Activo, opcional | Generan PNG/SVG/HTML en `resultados/`. No forman parte del pipeline 01-03 ni del informe HTML. |
| Informe HTML | `informe/informe/index.html` | Activo | Consume `data/datos_informe.json`. |
| Interactividad y gráficos | `informe/informe/assets/js/app.js` | Activo | Implementa KPIs, radar, líneas, rankings, cuadrantes, explorador, Top 10, niveles, heatmap y DOFA. |
| Sistema visual | `informe/informe/assets/css/tokens.css` | Activo | Define identidad visual institucional y estilos del informe. |

## 6. Visualizaciones implementadas

Las 12 visualizaciones, su sección, tipo, fuente, prioridad y mensaje principal están descritas en el [catálogo de visualizaciones (etapa 3)](./etapa3.md). Aquí se referencia esa tabla para evitar duplicación.

## 7. Síntesis: cómo se deriva la DOFA dinámica

La matriz DOFA del informe NO es texto editorial fijo: se calcula en `informe/informe/assets/js/app.js` (función `buildDofaDetails`) a partir del JSON maestro cada vez que el informe se carga. Reglas vigentes:

**Fortalezas**
1. La competencia genérica con mayor `puntaje_unimag - puntaje_nacional`. Si la brecha es positiva, se redacta como "desempeño destacado"; si es negativa, como "cercanía al promedio nacional".
2. La facultad con `puntaje_global` más alto (líder interno).
3. Conteo de programas donde `global_2025 > global_nbc_nacional_2025` (programas que superan su NBC).

**Debilidades**
1. La competencia con la peor brecha (mayor déficit vs. nacional).
2. La segunda peor competencia, solo si su brecha sigue siendo negativa.
3. La facultad con `puntaje_global` más bajo.

**Oportunidades**
1. La posición SUE actual de UNIMAGDALENA como activo de posicionamiento regional.
2. Programas con brecha entre -3 y 0 vs. su NBC nacional (a punto de superar la referencia).
3. Mención fija del análisis de valor agregado como insumo para autoevaluación.

**Amenazas**
1. Programas con `n_bajo: true` (cohortes pequeñas, riesgo de volatilidad).
2. Si el promedio nacional subió más de 1 punto entre los dos últimos años, se reporta el aumento de exigencia del estándar.
3. Mención fija del riesgo curricular en pruebas específicas de ingeniería.

Los textos resultantes se insertan en `#dofaFortalezas`, `#dofaDebilidades`, `#dofaOportunidades` y `#dofaAmenazas` del `index.html`. Para revisión editorial antes de publicación oficial, editar las plantillas de cadena dentro de `buildDofaDetails`.

## 8. Pendientes recomendados

- Revisar editorialmente los textos de la DOFA dinámica antes de usarla como documento institucional definitivo.
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
