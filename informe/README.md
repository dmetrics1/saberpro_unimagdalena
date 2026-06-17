# Informe HTML Saber Pro

Esta carpeta contiene la versión navegable del informe institucional Saber Pro de la Universidad del Magdalena.

## Estructura

```text
informe/
├── README.md
├── abrir_informe.bat
├── abrir_informe.sh
├── docs/                # stubs de redirección (la documentación viva está en /docs)
└── informe/
    ├── index.html
    ├── assets/
    │   ├── css/tokens.css
    │   └── js/app.js
    └── data/datos_informe.json
```

> **Nota:** la carpeta `informe/docs/` solo contiene archivos de redirección que apuntan a la documentación vigente en `docs/` (a nivel raíz del proyecto). Se conserva por compatibilidad con entregas anteriores; no agregar contenido nuevo allí.

## Abrir el informe

En Windows:

```powershell
.\abrir_informe.bat
```

O manualmente:

```powershell
cd informe
python -m http.server 8000
```

Luego abrir:

```text
http://localhost:8000
```

No se recomienda abrir `index.html` con doble clic porque el navegador puede bloquear la carga local de `data/datos_informe.json`.

## Refrescar datos

El informe lee este archivo:

```text
informe/informe/data/datos_informe.json
```

Para refrescarlo después de ejecutar el pipeline, desde esta carpeta (`informe/`):

```powershell
Copy-Item ..\data\processed\datos_informe.json .\informe\data\datos_informe.json -Force
```

O desde la raíz del proyecto:

```powershell
Copy-Item data\processed\datos_informe.json informe\informe\data\datos_informe.json -Force
```

## Componentes implementados

- Sidebar flotante permanente (siempre visible, 280px, esquinas 28px).
- Hero ejecutivo con badge de año, título, resumen dinámico y dos accesos rápidos.
- 3 tarjetas KPI incrustadas sobre el hero (Desempeño / Posicionamiento / Cobertura).
- Radar institucional de competencias.
- Evolución histórica global.
- Ranking SUE.
- Comparativo departamental.
- Cuadrantes de valor agregado.
- Trayectoria histórica de UNIMAGDALENA.
- Desempeño por facultad.
- Explorador filtrable de programas.
- Top 10 por competencia.
- Niveles de desempeño.
- Mapa de calor y DOFA dinámica (las reglas de derivación de la DOFA están documentadas en el [plan maestro §7](../docs/plan_maestro.md)).

La documentación completa está en [../docs/README.md](../docs/README.md).
