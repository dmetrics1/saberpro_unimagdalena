# Documentación del proyecto

Esta carpeta contiene la documentación canónica del proyecto de informe Saber Pro de la Universidad del Magdalena.

## Lectura recomendada

1. [Guía operativa](./guia_operativa.md): cómo instalar, regenerar datos, copiar el JSON al informe y abrir el HTML.
2. [Diccionario del JSON maestro](./diccionario_json.md): estructura de `data/processed/datos_informe.json` y campos que consume el informe.
3. [Plan maestro](./plan_maestro.md): decisiones metodológicas, fuentes, arquitectura y estado por etapas.
4. [Arquitectura narrativa](./etapa2.md): secciones del informe, perfiles de lector y reglas narrativas.
5. [Catálogo de visualizaciones](./etapa3.md): gráficos implementados, fuentes, mensajes y prioridades.

## Estado documental

La documentación vigente está en `docs/`. La carpeta `informe/docs/` se conserva solo como compatibilidad con entregas anteriores y apunta a estos archivos canónicos mediante stubs de redirección.

## Archivos clave

| Archivo | Uso |
|---|---|
| `README.md` | Índice de documentación. |
| `guia_operativa.md` | Manual de ejecución y actualización. |
| `diccionario_json.md` | Contrato de datos del informe HTML. |
| `plan_maestro.md` | Hoja de ruta y decisiones del proyecto. |
| `etapa2.md` | Arquitectura narrativa del informe. |
| `etapa3.md` | Catálogo de visualizaciones. |

## Convenciones

- `UNIMAGDALENA` se refiere a la Universidad del Magdalena.
- **Fuente A** o **base de cruce**: el parquet que empareja Saber 11 y Saber Pro a nivel de estudiante. Mide `n` como `crossed_n` con umbral mínimo 25. Cubre 2018–2024.
- **Fuente B** o **bases agregadas**: los Excel oficiales anuales del Icfes con resultados Saber Pro agregados. Mide `n` como `CANTIDADEVALUADOS`. Cubre 2020–2025.
- Esta convención está fijada en `meta.convencion_n` dentro del JSON maestro y se usa consistentemente en todos los documentos.
- El JSON conserva los años 2018 y 2019 en `cuadrantes_por_anio` y `trayectoria_unimag`, pero el informe los oculta y muestra cuadrantes y trayectoria solo entre 2020 y 2024.
- Los análisis basados en Fuente B (programas, facultades, SUE, departamento, niveles) cubren 2020–2025.
