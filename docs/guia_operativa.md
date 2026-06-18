# Guía operativa

Esta guía describe cómo regenerar los datos del informe, abrir el HTML y actualizar el proyecto cuando llegue un nuevo archivo anual de Saber Pro.

## 1. Requisitos

- Windows con PowerShell.
- Python 3 instalado.
- Dependencias de `requirements.txt`: `polars`, `pymupdf`, `openpyxl`, `pyarrow`, `pyyaml`.

Instalación inicial:

```powershell
python -m venv venv
venv\Scripts\python.exe -m pip install --upgrade pip
venv\Scripts\python.exe -m pip install -r requirements.txt
```

## 2. Configuración principal

El archivo [data/config/parametros.yml](../data/config/parametros.yml) controla:

- `anio_vigente`: año que se toma como corte actual del informe.
- `umbral_n_cuadrantes`: mínimo de `crossed_n` para incluir registros en valor agregado.
- `umbral_n_bajo_programa`: mínimo de evaluados para marcar alertas por n bajo.
- Rutas de datos crudos y procesados.
- Competencias genéricas oficiales.
- Universidades SUE y Caribe.
- `universidades_dept_magdalena`: lista de universidades del Departamento del Magdalena para el comparativo (cada entrada con `nombre_display`, `busqueda` exacta como aparece en el Excel del Icfes, y `agregacion` = `INSTITUCION` o `SEDE`).
- Mapeo de programas de UNIMAGDALENA a facultad y NBC.

El archivo [data/config/normalizacion_ies.csv](../data/config/normalizacion_ies.csv) alinea nombres de instituciones entre la Fuente A (base de cruce) y la Fuente B (Excel agregados). Por ejemplo, normaliza `UNIVERSIDAD DE NARIÑO` a `UNIVERSIDAD DE NARINO` para que el cruce con la Fuente B sea exitoso.

## 3. Regenerar el JSON maestro

Opción recomendada en Windows:

```powershell
.\ejecutar_proyecto.bat
```

Este script crea o activa el entorno virtual, instala dependencias, ejecuta los scripts 01-03 y copia `data/processed/datos_informe.json` a `informe/informe/data/datos_informe.json`.

Opción manual:

Ejecutar desde la raíz del proyecto:

```powershell
venv\Scripts\python.exe scripts\01_construir_cuadrantes.py
venv\Scripts\python.exe scripts\02_construir_agregados.py
venv\Scripts\python.exe scripts\03_consolidar_json.py
```

Salidas esperadas:

- `data/processed/cuadrantes_procesados.json`
- `data/processed/agregados_procesados.json`
- `data/processed/datos_informe.json`

Después de consolidar, copiar el JSON al informe HTML:

```powershell
Copy-Item data\processed\datos_informe.json informe\informe\data\datos_informe.json -Force
```

## 4. Abrir el informe

El informe usa `fetch()` para cargar `data/datos_informe.json`, por eso debe servirse con HTTP local.

Opción rápida en Windows:

```powershell
.\informe\abrir_informe.bat
```

Opción manual:

```powershell
cd informe\informe
python -m http.server 8000
```

Abrir en el navegador:

```text
http://localhost:8000
```

## 5. Actualizar con un nuevo año

1. Agregar el nuevo Excel oficial en `data/saberpro_agregados/`.
2. Confirmar que el nombre del archivo siga el patrón `Base-de-datos-de-resultados-agregados-de-saber-pro-YYYY.xlsx` (mismo formato que los archivos 2020-2025 ya presentes). El script `02_construir_agregados.py` detecta el año a partir del nombre.
3. Actualizar `anio_vigente` en `data/config/parametros.yml`.
4. Verificar si el esquema del Excel conserva la hoja `SABER PRO` y las columnas críticas usadas por `scripts/02_construir_agregados.py`.
5. Si aparecen nuevas IES o cambian nombres en `INSTITUCIÓN`, actualizar `data/config/normalizacion_ies.csv`.
6. Ejecutar los scripts 01, 02 y 03.
7. Copiar `data/processed/datos_informe.json` a `informe/informe/data/datos_informe.json`.
8. Abrir el informe local y revisar KPIs, históricos, programas y visualizaciones.

Nota: si el nuevo año no existe en la base de cruce Saber 11 - Saber Pro, los cuadrantes seguirán llegando hasta el último año disponible del parquet.

## 6. Scripts principales

### Pipeline obligatorio (01-03)

| Script | Entrada | Salida | Función |
|---|---|---|---|
| `scripts/lib_saberpro.py` | `parametros.yml`, `normalizacion_ies.csv` | funciones reutilizables | Limpieza de texto, carga de parámetros, normalización de IES, casteo numérico y clasificación de cuadrantes. |
| `scripts/01_construir_cuadrantes.py` | parquet de cruce (Fuente A) | `cuadrantes_procesados.json` | Calcula instituciones, NBC de UNIMAGDALENA y trayectoria de valor agregado. |
| `scripts/02_construir_agregados.py` | Excel anuales Saber Pro (Fuente B) | `agregados_procesados.json` | Calcula panorama institucional, SUE, departamento, facultades, programas, Top 10 y niveles de desempeño. |
| `scripts/03_consolidar_json.py` | JSON intermedios | `datos_informe.json` | Une todas las piezas y crea el bloque `meta`. |

### Scripts auxiliares opcionales (no parte del pipeline)

Los scripts 16 y 17 generan gráficos estáticos (PNG, SVG, HTML) en la carpeta `resultados/`. No son ejecutados por `ejecutar_proyecto.bat` y no alimentan el informe HTML. Son útiles para entregables imprimibles o anexos independientes del informe interactivo.

| Script | Entrada | Salida | Función |
|---|---|---|---|
| `scripts/16_generar_graficos_cuadrantes_2022_2024.py` | parquet de cruce | archivos en `resultados/` | Genera gráficos históricos de cuadrantes por año en SVG, PNG y HTML. |
| `scripts/17_generar_grafico_trayectoria_unimagdalena.py` | CSV de cuadrantes | archivos en `resultados/` | Genera la trayectoria consolidada de UNIMAGDALENA en SVG y PNG. |

Para ejecutarlos manualmente:

```powershell
venv\Scripts\python.exe scripts\16_generar_graficos_cuadrantes_2022_2024.py
venv\Scripts\python.exe scripts\17_generar_grafico_trayectoria_unimagdalena.py
```

Una descripción más detallada del contenido de `resultados/` está en [resultados/README_graficos_cuadrantes.md](../resultados/README_graficos_cuadrantes.md).

## 7. Verificación mínima antes de entregar

Ejecutar:

```powershell
venv\Scripts\python.exe scripts\01_construir_cuadrantes.py
venv\Scripts\python.exe scripts\02_construir_agregados.py
venv\Scripts\python.exe scripts\03_consolidar_json.py
Copy-Item data\processed\datos_informe.json informe\informe\data\datos_informe.json -Force
```

Comprobar que `datos_informe.json` contiene:

- `meta.anio_vigente = 2025` o el año vigente configurado.
- 6 puntos en `institucional.historico` para 2020-2025; cada entrada con su `competencias[]` de 5 elementos (la usa el radar filtrable por año).
- 37 universidades en `sue_ranking` (puede variar si el Icfes incorpora o retira IES; ver nota de brecha SUE en el [plan maestro §9](./plan_maestro.md)).
- 6 facultades.
- 39 programas.
- Cuadrantes para 2018-2024.
- `universidades_dept_historico` con 6 años (2020-2025) y 3 universidades por año (UNIMAGDALENA + Sergio Arboleda Santa Marta + Cooperativa Santa Marta).
