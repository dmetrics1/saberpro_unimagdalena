# ETAPA 2 — Arquitectura Narrativa del Informe
## Informe Institucional Saber Pro · Universidad del Magdalena

**Propósito del informe:** socializar el **estado actual y la evolución** de la
universidad y sus programas en Saber Pro (rendición de cuentas).
**Lector principal:** Rector y alta dirección.
**Tono narrativo:** factual y evolutivo — muestra la trayectoria (de dónde venía →
dónde está), reconoce logros sin inflarlos y señala brechas sin alarmismo.
**Hilo conductor:** *"Cómo está y cómo ha venido evolucionando la Universidad."*

---

## 1. Principio narrativo: la pirámide invertida + el eje del tiempo

El informe se lee de lo **general a lo específico** (pirámide invertida: el rector ve
lo macro primero, y quien quiera baja al detalle), y **cada sección incorpora el eje
temporal** (no solo "cómo está" sino "cómo llegó hasta aquí"). Esto responde
directamente al propósito de socializar la evolución.

```
PANORAMA  →  POSICIONAMIENTO  →  VALOR AGREGADO  →  FACULTADES  →  PROGRAMAS  →  COMPETENCIAS  →  SÍNTESIS
 (¿cómo      (¿frente a          (¿cuánto           (¿quién       (¿mi          (¿fortalezas    (¿qué
 estamos?)    quién?)             aportamos?)        lidera?)      programa?)     y brechas?)     hacer?)
```

---

## 2. Recorrido por perfil de lector

| Perfil | Qué busca | Secciones que lee primero |
|---|---|---|
| **Rector / alta dirección** *(lector #1)* | Estado global, posición frente al país, evolución | 1 → 2 → 3 → 8 |
| Vicerrectoría académica | Competencias fuertes/débiles, valor agregado | 4 → 7 → 5 |
| Decanos | Desempeño de su facultad y sus programas | 5 → 6 |
| Directores de programa | Su programa vs. el NBC nacional | 6 |
| Oficina de Planeación | Todo, con foco en síntesis y decisiones | 8 → 4 → 1 |

El diseño debe permitir que el rector entienda lo esencial en las **3 primeras
secciones** sin necesidad de bajar al detalle, y que decanos/directores **salten
directo** a su facultad o programa vía la navegación lateral.

---

## 3. Las 8 secciones en detalle

### Sección 1 — Hero + KPIs ejecutivos
- **Objetivo:** dar el estado global de la universidad en una sola mirada.
- **Historia que cuenta:** "Esta es la foto de hoy y cómo cambió respecto al año pasado."
- **Preguntas que responde:** ¿Cuál es el puntaje global 2025? ¿Subió o bajó frente a 2024? ¿Qué posición ocupamos en el SUE? ¿Cuántos programas están sobre la media nacional?
- **Indicadores (KPIs):** puntaje global institucional + variación vs. año anterior; posición en ranking SUE; % de programas sobre la media nacional; puntaje promedio de salida; n total de evaluados.
- **Fuente:** agregados (global, SUE) + cruce (valor agregado).
- **Perfil:** rector.

### Sección 2 — Panorama institucional
- **Objetivo:** mostrar cómo se compara la universidad con el país y cómo ha evolucionado.
- **Historia:** "Estamos por encima/igual al país en estas competencias, y esta es nuestra trayectoria 2020-2025."
- **Preguntas:** ¿En qué competencias superamos al promedio nacional? ¿En cuáles estamos por debajo? ¿La brecha con el país se amplía o se cierra en el tiempo?
- **Indicadores:** radar de las 5 competencias genéricas UM vs. nacional (2025); línea histórica del puntaje global UM vs. nacional (2020-2025).
- **Fuente:** agregados (`PAIS` + `PUNTAJE_PRUEBA` por competencia; `PUNTAJE_GLOBAL` para global).
- **Perfil:** rector.

### Sección 3 — Posicionamiento externo (SUE + Universidades del Departamento)
- **Objetivo:** ubicar a la universidad frente a sus pares públicos del SUE y frente a las universidades privadas del propio territorio (Departamento del Magdalena).
- **Historia:** "Entre las universidades del SUE ocupamos la posición X; en el Magdalena lideramos frente a la oferta privada en estas competencias…"
- **Preguntas:** ¿Dónde estamos en el ranking de universidades del SUE? ¿Cómo nos comparamos con las universidades privadas que operan en Santa Marta (Sergio Arboleda, Cooperativa de Colombia)? ¿En qué competencias somos mejores y en cuáles nos ganan?
- **Indicadores:** comparativo con universidades del Departamento (barras agrupadas, filtrable por año, 5 competencias + global); ranking SUE (barras horizontales, con UM y Caribe resaltadas).
- **Fuente:** agregados (`INSTITUCIÓN` para UNIMAGDALENA y la lista SUE; `SEDE` para las universidades privadas de Santa Marta, filtrando por la lista `universidades_dept_magdalena` del YML).
- **Perfil:** rector / consejo superior.

### Sección 4 — Valor agregado (cuadrantes)
- **Objetivo:** mostrar cuánto aporta la formación más allá del perfil de ingreso.
- **Historia:** "Recibimos estudiantes con cierto nivel de entrada y los graduamos por encima de la media: este es nuestro aporte, y cómo ha evolucionado de Alto Aporte a Alto Desempeño."
- **Preguntas:** ¿La universidad agrega valor frente al perfil de ingreso? ¿En qué cuadrante estamos cada año? ¿Cómo se mueven nuestros NBC?
- **Indicadores:** scatter de cuadrantes con filtro por año (2020-2024); trayectoria histórica de UM; brechas de entrada/salida vs. media.
- **Fuente:** cruce (parquet, `crossed_n ≥ 25`). **Nota: llega solo hasta 2024.**
- **Perfil:** vicerrectoría / planeación.

### Sección 5 — Facultades
- **Objetivo:** comparar el desempeño agregado entre las 6 facultades.
- **Historia:** "Estas facultades lideran; estas requieren acompañamiento; así han evolucionado."
- **Preguntas:** ¿Qué facultad tiene mejor desempeño? ¿Cuál muestra mayor mejora/caída en el tiempo?
- **Indicadores:** barras/heatmap por facultad; evolución por facultad.
- **Fuente:** agregados, usando el mapeo programa→facultad del YML.
- **Perfil:** decanos.

### Sección 6 — Programas
- **Objetivo:** permitir a cada director ver su programa frente a su NBC nacional.
- **Historia:** "Mi programa está por encima/debajo de su grupo de referencia nacional, y así ha evolucionado."
- **Preguntas:** ¿Cómo está mi programa vs. el promedio nacional de su NBC? ¿En qué competencias destaca o falla? ¿Mejoró respecto a años anteriores?
- **Indicadores:** **componente filtrable** (selector de facultad→programa) que muestra radar de genéricas vs. NBC, barras de específicas, histórico del programa, y niveles de desempeño.
- **Fuente:** agregados (`PROGRAMA_ACADEMICO` vs. `NBC`). **Marcar programas con n bajo.**
- **Perfil:** directores de programa.

### Sección 7 — Competencias y Top 10
- **Objetivo:** identificar fortalezas y brechas transversales de toda la universidad.
- **Historia:** "Estas son las competencias donde más destacamos y los programas que las lideran."
- **Preguntas:** ¿Cuáles son nuestras competencias más fuertes/débiles? ¿Qué programas encabezan cada competencia?
- **Indicadores:** Top 10 de programas por competencia; distribución institucional por niveles de desempeño (Nivel 1-5).
- **Fuente:** agregados.
- **Perfil:** vicerrectoría académica.

### Sección 8 — Síntesis + DOFA + recomendaciones
- **Objetivo:** cerrar con una lectura estratégica y acciones.
- **Historia:** "Esto es lo que los datos nos dicen, y esto es lo que sugieren hacer."
- **Preguntas:** ¿Cuáles son nuestras fortalezas, debilidades, oportunidades y amenazas? ¿Qué decisiones priorizar?
- **Indicadores:** matriz DOFA derivada de los datos; resumen de hallazgos clave.
- **Fuente:** ambas (síntesis de todo el informe).
- **Perfil:** alta dirección / planeación.

---

## 4. Reglas narrativas transversales

1. **Cada sección abre con una frase-resumen** (el "titular") que el rector pueda leer
   en 5 segundos, seguida del detalle para quien quiera profundizar.
2. **Todo dato comparativo lleva su referencia explícita** (vs. nacional, vs. NBC, vs.
   año anterior) para evitar lecturas ambiguas.
3. **El eje temporal está presente en todas las secciones** (cómo evolucionó), porque
   el propósito es socializar la evolución, no solo la foto fija.
4. **Los programas con n bajo se muestran con advertencia visual** y no se usan para
   afirmaciones concluyentes.
5. **Asimetría temporal declarada:** se indica claramente que los cuadrantes llegan a
   2024 y el resto a 2025.
6. **Tono factual:** los logros se muestran con su dato, sin adjetivos triunfalistas;
   las brechas se presentan como zonas de oportunidad, sin alarmismo.

---

## 5. Entregable de la Etapa 2

Este documento ES el entregable: el mapa narrativo que guiará el diseño visual
(Etapa 4), el catálogo de gráficos (Etapa 3) y la redacción (Etapa 6).

## 6. Registro de criterios narrativos

> "Adopta esta arquitectura narrativa de 8 secciones para el informe, con propósito de
> socializar estado y evolución, lector principal el rector, y tono factual-evolutivo.
> Respeta el orden general→específico, el eje temporal en cada sección, el recorrido
> por perfil de lector, y las 6 reglas narrativas transversales. Cada sección debe
> abrir con una frase-titular legible en 5 segundos. Usa este documento como base para
> el catálogo de visualizaciones (Etapa 3) y la maquetación (Etapa 4).
