# Diccionario del JSON maestro

El archivo `data/processed/datos_informe.json` es la fuente de verdad que consume el informe HTML. También debe copiarse a `informe/informe/data/datos_informe.json` para publicarlo localmente.

## Convención de nombres y codificación

- Las dos fuentes se referencian de forma canónica como **Fuente A** (base de cruce Saber 11 - Saber Pro) y **Fuente B** (bases agregadas oficiales Saber Pro). Esta convención está fijada en `meta.convencion_n` y se mantiene en todos los documentos.
- Los nombres de programas, NBC y competencias se conservan **tal como aparecen en las fuentes oficiales**, incluidas grafías con tildes invertidas (`Ò`, `À`, `È`) o sin tilde (`PROGRAMA_ACADEMICO`). No deben "corregirse" porque son la llave para empalmar con los Excel del Icfes y con `parametros.yml`.
- La normalización de nombres de IES entre fuentes se gobierna por `data/config/normalizacion_ies.csv` (por ejemplo, `UNIVERSIDAD DE NARIÑO` → `UNIVERSIDAD DE NARINO`).

## Estructura general

```json
{
  "meta": {},
  "institucional": {},
  "sue_ranking": [],
  "departamento": [],
  "universidades_dept_historico": {},
  "cuadrantes_por_anio": {},
  "trayectoria_unimag": {},
  "facultades": [],
  "programas": [],
  "top10": {},
  "niveles_desempeno": []
}
```

## `meta`

Describe el corte, las fuentes y la convención de n.

| Campo | Tipo | Descripción |
|---|---|---|
| `anio_vigente` | número | Año principal del informe. |
| `fecha_generacion` | texto ISO | Fecha y hora en que se consolidó el JSON. |
| `convencion_n` | texto | Regla metodológica para interpretar el n de cada fuente. Define **Fuente A** y **Fuente B**. |
| `fuentes.fuente_a_cruce` | objeto | Metadatos de la base de cruce Saber 11 - Saber Pro. |
| `fuentes.fuente_b_agregados` | objeto | Metadatos de los Excel agregados oficiales Saber Pro. |
| `nota` | texto | Aclaración sobre rangos temporales por fuente. |

## `institucional`

Bloque para panorama general, hero y KPIs.

### `institucional.global`

| Campo | Tipo | Descripción |
|---|---|---|
| `puntaje_unimag` | número | Puntaje global institucional del año vigente. |
| `puntaje_nacional` | número | Promedio nacional del año vigente. |
| `n_unimag` | número | Evaluados UNIMAGDALENA según bases agregadas. |
| `n_nacional` | número | Evaluados nacionales según bases agregadas. |

### `institucional.competencias[]`

| Campo | Tipo | Descripción |
|---|---|---|
| `competencia` | texto | Competencia genérica. |
| `puntaje_unimag` | número | Puntaje institucional. |
| `puntaje_nacional` | número | Promedio nacional. |
| `n_unimag` | número | Evaluados institucionales para esa competencia. |

### `institucional.historico[]`

Serie 2020-2025 para la línea histórica y para el radar filtrable por año.

| Campo | Tipo | Descripción |
|---|---|---|
| `anio` | número | Año de la medición. |
| `puntaje_unimag` | número | Puntaje global institucional. |
| `puntaje_nacional` | número | Promedio nacional. |
| `n_unimag` | número | Evaluados institucionales. |
| `competencias[]` | arreglo | Las 5 competencias genéricas para ese año, con la misma estructura que `institucional.competencias[]`. Se usa para el radar filtrable por año en Panorama. |

## `sue_ranking[]`

Ranking de universidades del Sistema Universitario Estatal.

| Campo | Tipo | Descripción |
|---|---|---|
| `rank` | número | Posición en el ranking. |
| `nombre` | texto | Nombre normalizado de la IES. |
| `puntaje` | número | Puntaje global. |
| `n` | número | Evaluados según bases agregadas. |
| `es_unimagdalena` | booleano | Marca la Universidad del Magdalena. |
| `es_caribe` | booleano | Marca universidades SUE de la región Caribe. |

**Nota:** `parametros.yml` lista 40 IES del SUE, pero el ranking del JSON contiene solo las que aparecen efectivamente en las bases agregadas del año vigente (37 al cierre de 2025). Las IES SUE sin registro en la Fuente B (actualmente UNAD, Universidad de Cundinamarca y Universidad Militar Nueva Granada) quedan fuera del ranking. Esto no es un error: es el comportamiento esperado del cruce contra `INSTITUCIÓN` en los Excel oficiales.

## `departamento[]`

Comparativo territorial del año vigente.

| Campo | Tipo | Descripción |
|---|---|---|
| `departamento` | texto | Nombre del departamento. |
| `puntaje` | número | Puntaje global departamental. |
| `n` | número | Evaluados. |
| `es_magdalena` | booleano | Marca el departamento del Magdalena. |
| `es_caribe` | booleano | Marca departamentos de la región Caribe. |

## `universidades_dept_historico`

Objeto indexado por año (string) con las universidades del Departamento del Magdalena que se comparan en el card "Comparativo con universidades del departamento" de la sección Posicionamiento. Cubre 2020-2025.

La lista de universidades incluidas se configura en `data/config/parametros.yml` bajo `universidades_dept_magdalena`. Cada entrada de la configuración apunta a una sede o institución específica del Icfes (UNIMAGDALENA a nivel `INSTITUCION`, las demás a nivel `SEDE`).

```json
{
  "2025": [
    { "nombre": "UNIMAGDALENA", "puntaje_global": 150, "n": 2982, "competencias": [...] },
    { "nombre": "U. Sergio Arboleda - Santa Marta", "puntaje_global": 149, "n": 357, "competencias": [...] },
    { "nombre": "U. Cooperativa de Colombia - Santa Marta", "puntaje_global": 143, "n": 884, "competencias": [...] }
  ],
  "2024": [...]
}
```

### `universidades_dept_historico[<año>][]`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | texto | Nombre legible de la universidad (definido en `parametros.yml`). |
| `puntaje_global` | número | Puntaje global de la institución/sede ese año. |
| `n` | número | Evaluados según `CANTIDADEVALUADOS`. |
| `competencias[]` | arreglo | Puntaje por competencia genérica. Ver subschema. |

### `universidades_dept_historico[<año>][].competencias[]`

| Campo | Tipo | Descripción |
|---|---|---|
| `competencia` | texto | Competencia genérica (misma escritura que en `institucional.competencias[]`). |
| `puntaje` | número | Puntaje de la institución/sede en esa competencia. Puede ser `null` si la sede no reportó la prueba. |

## `cuadrantes_por_anio`

Objeto indexado por año de la base de cruce. El JSON conserva 2018-2024; el informe muestra 2020-2024 para evitar lecturas con n muy bajo (2018 y 2019 tienen aproximadamente 30 evaluados).

```json
{
  "2024": {
    "limites": {},
    "instituciones": [],
    "nbcs_unimag": []
  }
}
```

### `limites`

| Campo | Tipo | Descripción |
|---|---|---|
| `x_mean` | número | Media anual de Saber 11 usada como eje vertical de cuadrantes. |
| `y_mean` | número | Media anual de Saber Pro usada como eje horizontal de cuadrantes. |

### `instituciones[]`

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | texto | Nombre de la IES. |
| `sb11` | número | Promedio ponderado Saber 11. |
| `sbpro` | número | Promedio ponderado Saber Pro. |
| `n` | número | `crossed_n` agregado. |
| `cuadrante` | texto | `Alto aporte`, `Alto desempeno`, `Base baja` o `Alerta`. |

### `nbcs_unimag[]`

Misma estructura que `instituciones[]`, pero a nivel NBC de UNIMAGDALENA.

## `trayectoria_unimag`

Trayectoria institucional en el plano Saber 11 - Saber Pro.

| Campo | Tipo | Descripción |
|---|---|---|
| `limites.x_mean` | número | Límite consolidado de Saber 11. |
| `limites.y_mean` | número | Límite consolidado de Saber Pro. |
| `puntos[]` | arreglo | Puntos anuales de UNIMAGDALENA. |

### `trayectoria_unimag.puntos[]`

| Campo | Tipo | Descripción |
|---|---|---|
| `anio` | número | Año del punto. |
| `sb11` | número | Promedio Saber 11. |
| `sbpro` | número | Promedio Saber Pro. |
| `n` | número | `crossed_n` agregado. |
| `cuadrante_anual` | texto | Cuadrante usando límites del año. |
| `cuadrante_consolidado` | texto | Cuadrante usando límites consolidados del periodo. |

## `facultades[]`

Promedios ponderados de programas UNIMAGDALENA por facultad.

| Campo | Tipo | Descripción |
|---|---|---|
| `facultad` | texto | Nombre de la facultad. |
| `puntaje_global` | número | Promedio global ponderado. |
| `n` | número | Evaluados acumulados. |
| `competencias[]` | arreglo | Puntajes por competencia genérica. Ver subschema abajo. |

### `facultades[].competencias[]`

| Campo | Tipo | Descripción |
|---|---|---|
| `competencia` | texto | Competencia genérica (mismas 5 oficiales del Icfes). |
| `puntaje` | número | Puntaje promedio ponderado de la facultad en esa competencia. |

## `programas[]`

Datos del explorador de programas.

| Campo | Tipo | Descripción |
|---|---|---|
| `programa` | texto | Nombre del programa académico (grafía original del Excel). |
| `facultad` | texto | Facultad asignada en `parametros.yml`. |
| `n_2025` | número | Evaluados del año vigente. |
| `global_2025` | número | Puntaje global del programa. |
| `global_nbc_nacional_2025` | número | Referencia nacional del NBC. |
| `n_nbc_nacional_2025` | número | Evaluados nacionales del NBC. |
| `n_bajo` | booleano | Verdadero si `n_2025` está bajo el umbral configurado (`umbral_n_bajo_programa`). |
| `competencias_2025[]` | arreglo | Competencias genéricas del programa vs. NBC. Ver subschema. |
| `especificas_2025[]` | arreglo | Competencias específicas disponibles del programa vs. NBC. Puede estar vacío. Ver subschema. |
| `niveles_2025[]` | arreglo | Distribución por niveles del programa vs. NBC. Ver subschema. |
| `historico[]` | arreglo | Serie histórica 2020-2025 del programa. Ver subschema. |

### `programas[].competencias_2025[]`

| Campo | Tipo | Descripción |
|---|---|---|
| `prueba` | texto | Nombre de la competencia genérica. |
| `puntaje_programa` | número | Puntaje del programa. |
| `puntaje_nbc_nacional` | número | Puntaje promedio del NBC nacional. |
| `n_nbc_nacional` | número | Evaluados del NBC a nivel nacional. |

### `programas[].especificas_2025[]`

Misma estructura que `competencias_2025[]`. El campo `prueba` contiene el nombre de la prueba específica (varía por programa). Programas sin pruebas específicas (por ejemplo varias licenciaturas) devuelven arreglo vacío y el front oculta la sub-vista.

### `programas[].niveles_2025[]`

| Campo | Tipo | Descripción |
|---|---|---|
| `competencia` | texto | Competencia genérica. |
| `distribucion_programa` | arreglo de 5 números | Porcentaje (0-100) de evaluados del programa en Niveles 1 a 5. |
| `distribucion_nbc_nacional` | arreglo de 5 números | Porcentaje (0-100) de evaluados del NBC nacional en Niveles 1 a 5. |

### `programas[].historico[]`

Serie histórica del programa por año.

| Campo | Tipo | Descripción |
|---|---|---|
| `anio` | número | Año de la medición. |
| `puntaje` | número | Puntaje global del programa ese año. |
| `n` | número | Evaluados del programa ese año. |

## `top10`

Ranking interno de programas UNIMAGDALENA.

| Campo | Tipo | Descripción |
|---|---|---|
| `global[]` | arreglo | Top 10 por puntaje global. Ver subschema. |
| `por_competencia` | objeto | Diccionario indexado por nombre de competencia genérica. Cada valor es un arreglo. Ver subschema. |

### `top10.global[]`

| Campo | Tipo | Descripción |
|---|---|---|
| `programa` | texto | Nombre del programa. |
| `puntaje` | número | Puntaje global del programa en el año vigente. |
| `n` | número | Evaluados del programa en el año vigente. |

### `top10.por_competencia[<competencia>][]`

Las claves del objeto son las 5 competencias genéricas oficiales. Cada arreglo contiene los 10 programas con mejor puntaje en esa competencia.

| Campo | Tipo | Descripción |
|---|---|---|
| `programa` | texto | Nombre del programa. |
| `puntaje` | número | Puntaje del programa en la competencia. |

## `niveles_desempeno[]`

Distribución institucional por niveles de logro.

| Campo | Tipo | Descripción |
|---|---|---|
| `competencia` | texto | Competencia genérica. |
| `distribucion_unimag` | arreglo de 5 números | Porcentaje (0-100) por Nivel 1 a Nivel 5 para UNIMAGDALENA. |
| `distribucion_nacional` | arreglo de 5 números | Porcentaje (0-100) por Nivel 1 a Nivel 5 para Colombia. |

## Visualizaciones que consumen el JSON

| Visualización | Campos principales |
|---|---|
| KPIs ejecutivos | `institucional.global`, `institucional.historico`, `programas` |
| Radar institucional (filtrable por año) | `institucional.historico[].competencias`, `institucional.historico[].puntaje_unimag/nacional` |
| Línea histórica | `institucional.historico` |
| Comparativo con universidades del departamento (filtrable por año) | `universidades_dept_historico` |
| Ranking SUE | `sue_ranking` |
| Cuadrantes | `cuadrantes_por_anio` |
| Trayectoria | `trayectoria_unimag` |
| Facultades | `facultades` |
| Explorador de programas | `programas` |
| Top 10 | `top10` |
| Niveles de desempeño | `niveles_desempeno` |
| Mapa de calor y DOFA | `facultades`, `institucional.competencias`, `programas`, `sue_ranking`, `institucional.historico` |
