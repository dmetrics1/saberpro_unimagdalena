# Graficos De Cuadrantes Saber 11 - Saber Pro 2020-2024

## Objetivo General
Desarrollar un informe institucional interactivo y de alto valor analítico que permita evaluar, monitorear y comunicar el desempeño de los estudiantes de la Universidad del Magdalena en las pruebas Saber Pro, mediante indicadores, visualizaciones y análisis estratégicos que apoyen la toma de decisiones académicas, curriculares y de aseguramiento de la calidad.

## Fuente y filtros
- Fuente: `C:/Users/Estudiante/OneDrive - Universidad del Magdalena/02_Universidad_y_Planeacion/01_Universidad_Proyectos_Generales/proyecto_informe_saberpro/data/Perfiles_INBC_Anuales_2016_2024.parquet`.
- Unidad principal del grafico: universidad.
- Capa adicional: NBC de UNIMAGDALENA.
- Filtro base: INBC con `crossed_n >= 25` antes de agregar a universidad.
- Eje X: `sb11_global_mean`.
- Eje Y: `sbpro_global_mean`.
- Lineas punteadas: promedio simple de las universidades graficadas en cada ano.

## Resumen
| Ano | Universidades | NBC UNIMAGDALENA | Promedio universidades Saber 11 | Promedio universidades Saber Pro |
|---:|---:|---:|---:|---:|
| 2020 | 202 | 11 | 283.91 | 151.94 |
| 2021 | 215 | 15 | 285.04 | 147.41 |
| 2022 | 215 | 15 | 285.65 | 147.47 |
| 2023 | 221 | 19 | 284.99 | 147.17 |
| 2024 | 232 | 18 | 283.87 | 148.01 |


## Trayectoria Histórica Consolidada (2020-2024)
Se ha generado un gráfico adicional que consolida la evolución del promedio de **UNIMAGDALENA** a lo largo de todo el periodo estudiado:
- Archivo SVG: `resultados/trayectoria_unimagdalena_2020_2024.svg`
- Archivo PNG: `resultados/trayectoria_unimagdalena_2020_2024.png`
- Características:
  - Muestra exclusivamente los puntos promedios de la universidad en cada año.
  - Los ejes del gráfico representan el promedio nacional simple del periodo consolidado de 5 años: Saber 11 = 284.69, Saber Pro = 148.34.
  - Conecta los puntos cronológicamente para mostrar visualmente el tránsito institucional del cuadrante **Alto Aporte** (2020-2022) hacia el cuadrante **Alto Desempeño** (2023-2024).
