from __future__ import annotations

import math
from pathlib import Path
import re
import polars as pl

# Rutas de entrada y salida dinámicas
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT_CSV = PROJECT_ROOT / "data" / "datos_cuadrantes_saber11_saberpro_2020_2024.csv"
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "resultados"
HTML_REPORT_PATH = DEFAULT_OUTPUT_DIR / "analisis_graficos_cuadrantes_2020_2024.html"

# Años del periodo de estudio
YEARS = [2020, 2021, 2022, 2023, 2024]

def fmt_num(value: float, decimals: int = 1) -> str:
    return f"{value:.{decimals}f}"

def esc(value: object) -> str:
    import html
    return html.escape("" if value is None else str(value), quote=True)

def build_trajectory_svg(
    unimag_points: list[dict[str, object]],
    x_mean: float,
    y_mean: float,
    x_min: float,
    x_max: float,
    y_min: float,
    y_max: float
) -> str:
    width = 1800
    height = 1000
    
    margin_left = 300
    margin_right = 180
    margin_top = 120
    margin_bottom = 180
    
    plot_w = width - margin_left - margin_right
    plot_h = height - margin_top - margin_bottom
    
    def sx(value: float) -> float:
        return margin_left + (value - x_min) / (x_max - x_min) * plot_w
        
    def sy(value: float) -> float:
        return margin_top + (y_max - value) / (y_max - y_min) * plot_h

    x0 = margin_left
    x1 = margin_left + plot_w
    y0 = margin_top
    y1 = margin_top + plot_h
    x_mid = sx(x_mean)
    y_mid = sy(y_mean)

    parts: list[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}" role="img" '
            f'aria-label="Trayectoria de UNIMAGDALENA Saber 11 y Saber Pro 2020-2024">'
        ),
        "<style>",
        "text{font-family:Arial, Helvetica, sans-serif;letter-spacing:0}",
        ".title{font-size:36px;font-weight:800;fill:#1b4d3e}",
        ".subtitle{font-size:20px;fill:#65748a;font-weight:500}",
        ".axis-label{font-size:27px;font-weight:800;fill:#4a5870}",
        ".tick{font-size:28px;fill:#666}",
        ".quad{font-size:27px;font-weight:800;fill:#073a67}",
        ".base{fill:#5d6e87}",
        ".alert{fill:#846b00}",
        ".legend{font-size:24px;font-weight:700;fill:#4a5870}",
        ".grid{stroke:#d9e3ef;stroke-width:2;stroke-dasharray:7 9}",
        ".axis{stroke:#666;stroke-width:2}",
        ".mean{stroke:#6f91ba;stroke-width:2.5;stroke-dasharray:11 11}",
        ".mean-label{font-size:20px;font-weight:800;fill:#4a5870}",
        ".label-year{font-family:Arial, Helvetica, sans-serif;paint-order:stroke fill}",
        "</style>",
        # Definición del marcador de flecha para la trayectoria
        "<defs>",
        '  <marker id="arrow" viewBox="0 0 10 10" refX="23" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">',
        '    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7c1f12"/>',
        "  </marker>",
        "</defs>",
        f'<rect x="0" y="0" width="{width}" height="{height}" fill="#ffffff"/>',
        
        # Fondos de los Cuadrantes
        f'<rect x="{x0}" y="{y0}" width="{x_mid - x0}" height="{y_mid - y0}" fill="#eaf7ed"/>',
        f'<rect x="{x_mid}" y="{y0}" width="{x1 - x_mid}" height="{y_mid - y0}" fill="#eff6ff"/>',
        f'<rect x="{x0}" y="{y_mid}" width="{x_mid - x0}" height="{y1 - y_mid}" fill="#fbfcfd"/>',
        f'<rect x="{x_mid}" y="{y_mid}" width="{x1 - x_mid}" height="{y1 - y_mid}" fill="#fffaf0"/>',
    ]

    # Grid de fondo
    x_ticks = [270, 275, 280, 285, 290, 295]
    y_ticks = [145, 147.5, 150, 152.5, 155, 157]

    for x_tick in x_ticks:
        x = sx(x_tick)
        parts.append(f'<line class="grid" x1="{x:.2f}" y1="{y0}" x2="{x:.2f}" y2="{y1}"/>')
    for y_tick in y_ticks:
        y = sy(y_tick)
        parts.append(f'<line class="grid" x1="{x0}" y1="{y:.2f}" x2="{x1}" y2="{y:.2f}"/>')

    # Líneas de media nacional (Ejes divisores de cuadrantes)
    parts.extend([
        f'<line class="mean" x1="{x_mid:.2f}" y1="{y0}" x2="{x_mid:.2f}" y2="{y1}"/>',
        f'<line class="mean" x1="{x0}" y1="{y_mid:.2f}" x2="{x1}" y2="{y_mid:.2f}"/>',
        f'<text class="mean-label" x="{x_mid:.2f}" y="{y0 - 15}" text-anchor="middle">{fmt_num(x_mean, 1)}</text>',
        f'<text class="mean-label" x="{x1 + 18}" y="{y_mid + 8:.2f}" text-anchor="start">{fmt_num(y_mean, 1)}</text>',
        f'<line class="axis" x1="{x0}" y1="{y1}" x2="{x1}" y2="{y1}"/>',
        f'<line class="axis" x1="{x0}" y1="{y0}" x2="{x0}" y2="{y1}"/>',
    ])

    # Ticks y etiquetas en el eje X
    for x_tick in x_ticks:
        x = sx(x_tick)
        parts.append(f'<line class="axis" x1="{x:.2f}" y1="{y1}" x2="{x:.2f}" y2="{y1 + 12}"/>')
        parts.append(f'<text class="tick" x="{x:.2f}" y="{y1 + 58}" text-anchor="middle">{fmt_num(x_tick, 0)}</text>')

    # Ticks y etiquetas en el eje Y
    for y_tick in y_ticks:
        y = sy(y_tick)
        parts.append(f'<line class="axis" x1="{x0 - 12}" y1="{y:.2f}" x2="{x0}" y2="{y:.2f}"/>')
        parts.append(f'<text class="tick" x="{x0 - 34}" y="{y + 10:.2f}" text-anchor="end">{fmt_num(y_tick, 1)}</text>')

    # Etiquetas de los cuadrantes
    parts.extend([
        f'<text class="quad" x="{x0 + 20}" y="{y0 + 38}">Alto aporte</text>',
        f'<text class="quad" x="{x1 - 20}" y="{y0 + 38}" text-anchor="end">Alto desempeño</text>',
        f'<text class="quad base" x="{x0 + 20}" y="{y1 - 20}">Base baja</text>',
        f'<text class="quad alert" x="{x1 - 20}" y="{y1 - 20}" text-anchor="end">Alerta</text>',
    ])

    # Ordenar los puntos cronológicamente
    points_sorted = sorted(unimag_points, key=lambda p: int(p["year_sbpro"]))
    
    # Dibujar líneas conectoras con flechas para la trayectoria
    for i in range(len(points_sorted) - 1):
        p_curr = points_sorted[i]
        p_next = points_sorted[i+1]
        
        x_curr = sx(float(p_curr["sb11_global_mean"]))
        y_curr = sy(float(p_curr["sbpro_global_mean"]))
        x_next = sx(float(p_next["sb11_global_mean"]))
        y_next = sy(float(p_next["sbpro_global_mean"]))
        
        parts.append(
            f'<line x1="{x_curr:.2f}" y1="{y_curr:.2f}" x2="{x_next:.2f}" y2="{y_next:.2f}" '
            f'stroke="#d9482f" stroke-width="4.5" stroke-dasharray="10 6" '
            f'marker-end="url(#arrow)"/>'
        )

    # Dibujar los puntos y etiquetas de años
    for i, p in enumerate(points_sorted):
        year = int(p["year_sbpro"])
        sb11 = float(p["sb11_global_mean"])
        sbpro = float(p["sbpro_global_mean"])
        
        x = sx(sb11)
        y = sy(sbpro)
        
        # Dibujar punto (círculo)
        title = f"UNIMAGDALENA {year} | Saber 11: {fmt_num(sb11, 2)} | Saber Pro: {fmt_num(sbpro, 2)} | n={p['crossed_n']}"
        parts.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="18" fill="#d9482f" fill-opacity="0.95" '
            f'stroke="#7c1f12" stroke-width="3.5">'
            f'<title>{esc(title)}</title>'
            f'</circle>'
        )
        
        # Definición del offset del texto y su alineación para evitar solapamiento
        # Alternamos arriba/abajo y ajustamos extremos
        if year == 2020:
            tx, ty, anchor = x - 25, y - 35, "end"
        elif year == 2021:
            tx, ty, anchor = x, y + 60, "middle"
        elif year == 2022:
            tx, ty, anchor = x - 5, y - 38, "middle"
        elif year == 2023:
            tx, ty, anchor = x, y + 60, "middle"
        elif year == 2024:
            tx, ty, anchor = x + 25, y - 35, "start"
        else:
            tx, ty, anchor = x, y - 35, "middle"
            
        parts.extend([
            f'<g class="label-group">',
            f'  <text class="label-year" x="{tx:.2f}" y="{ty:.2f}" text-anchor="{anchor}">',
            f'    <tspan font-weight="900" font-size="28" fill="#1b4d3e" stroke="#ffffff" stroke-width="5" paint-order="stroke fill">{year}</tspan>',
            f'    <tspan x="{tx:.2f}" dy="24" font-weight="800" font-size="16" fill="#4b5563" stroke="#ffffff" stroke-width="4.5" paint-order="stroke fill">({fmt_num(sb11, 1)}, {fmt_num(sbpro, 1)})</tspan>',
            f'  </text>',
            f'</g>'
        ])

    # Punto de intersección de las medias nacionales
    parts.append(
        f'<circle cx="{x_mid:.2f}" cy="{y_mid:.2f}" r="10" fill="#063a66" stroke="#ffffff" stroke-width="2">'
        f'<title>Intersección de Medias del Periodo (Saber 11: {fmt_num(x_mean, 2)} | Saber Pro: {fmt_num(y_mean, 2)})</title>'
        f'</circle>'
    )

    # Nombres de los ejes
    parts.extend([
        f'<text class="axis-label" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="800" fill="#4a5870" x="{x0 - 198}" y="{(y0 + y1) / 2:.2f}" text-anchor="middle" '
        f'transform="rotate(-90 {x0 - 198} {(y0 + y1) / 2:.2f})">'
        f'Promedio Saber Pro (Salida)</text>',
        f'<text class="axis-label" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="800" fill="#4a5870" x="{(x0 + x1) / 2:.2f}" y="{y1 + 96}" text-anchor="middle">Promedio Saber 11 (Entrada)</text>',
    ])

    parts.append("</svg>")
    return "\n".join(parts)


def update_html_report(svg_content: str) -> None:
    if not HTML_REPORT_PATH.exists():
        print(f"Advertencia: No se encontró el archivo de reporte HTML en {HTML_REPORT_PATH}")
        return
        
    print(f"Modificando el reporte HTML en: {HTML_REPORT_PATH}")
    html_content = HTML_REPORT_PATH.read_text(encoding="utf-8")
    
    # Limpiamos las etiquetas <?xml del SVG para insertarlo inline
    clean_svg = "\n".join(line for line in svg_content.splitlines() if not line.startswith("<?xml"))
    
    # Si la sección ya existe de una inyección previa, la removemos primero para evitar duplicados
    marker = "<!-- SECCION TRAYECTORIA HISTORICA CONSOLIDADA (INYECCION AUTOMATICA) -->"
    if marker in html_content:
        start_idx = html_content.find(marker)
        # Encontramos la etiqueta de cierre </section> correspondiente a esta inyección
        end_idx = html_content.find("</section>", start_idx)
        if end_idx != -1:
            end_idx += len("</section>")
            html_content = html_content[:start_idx] + html_content[end_idx:]
            print("Se detectó y removió la inyección previa en el HTML para evitar duplicación.")
            
    # Preparamos la sección HTML a inyectar
    new_section = f"""
    <!-- SECCION TRAYECTORIA HISTORICA CONSOLIDADA (INYECCION AUTOMATICA) -->
    <section class="section">
      <h2>Trayectoria Histórica y Evolución de UNIMAGDALENA</h2>
      <p class="section-desc">
        Este gráfico consolidado muestra la evolución temporal del promedio de **UNIMAGDALENA** año a año (2020 a 2024). 
        Las líneas punteadas de los ejes representan las medias nacionales consolidadas de las universidades para todo el periodo (Saber 11: 284.7, Saber Pro: 148.3).
      </p>
      
      <div class="year-block" style="margin-bottom: 24px;">
        <div class="year-content">
          <figure class="graph">
            {clean_svg}
          </figure>
          
          <div class="metric-grid">
            <div class="metric-card">
              <small>Periodo Histórico</small>
              <b>2020 - 2024</b>
              <small>Serie de 5 años</small>
            </div>
            <div class="metric-card">
              <small>Avance en Entrada (Saber 11)</small>
              <b class="positivo">+14.63 pts</b>
              <small>De 275.3 (2020) a 289.9 (2024)</small>
            </div>
            <div class="metric-card">
              <small>Sostenibilidad (Saber Pro)</small>
              <b class="positivo">153.76 pts</b>
              <small>Puntaje promedio máximo en 2024</small>
            </div>
            <div class="metric-card">
              <small>Tránsito de Cuadrante</small>
              <b class="positivo" style="color: var(--blue-acad);">Alto Aporte ➔ Alto Desempeño</b>
              <small>Consolidación de calidad educativa</small>
            </div>
          </div>
          
          <div class="analysis-text" style="margin-top: 24px;">
            <p>
              El análisis de la trayectoria consolidada de **UNIMAGDALENA** revela un patrón sobresaliente de fortalecimiento institucional y éxito en sus procesos de enseñanza-aprendizaje durante el lustro 2020-2024:
            </p>
            <ul>
              <li>
                <strong>Fase de Alto Aporte (2020-2022):</strong> En estos años, la universidad recibía cohortes con promedios de Saber 11 inferiores a la media nacional (empezando en 275.3 puntos). Sin embargo, lograba que sus graduandos obtuvieran puntajes en Saber Pro sistemáticamente por encima de la media nacional (hasta 153.5 puntos). Esto evidenció un **alto valor agregado formativo**, transformando positivamente el perfil académico de los estudiantes.
              </li>
              <li>
                <strong>Fase de Alto Desempeño (2023-2024):</strong> A partir de 2023, la universidad experimentó un notable incremento en el promedio de ingreso de sus estudiantes (alcanzando 289.3 puntos en 2023 y 289.9 en 2024), posicionándose por encima de la media nacional. Lejos de relajar sus procesos de formación, la institución capitalizó esta mejora en la entrada logrando sus puntajes históricos más altos en la salida de Saber Pro (153.8 en 2024).
              </li>
            </ul>
            <p class="note">
              <strong>Conclusión Estratégica:</strong> La trayectoria confirma que la Universidad del Magdalena ha transitado de ser una institución focalizada en "nivelar" y agregar valor académico, a consolidarse como una universidad de **Alto Desempeño**, atrayendo mejor talento e impulsándolo a la excelencia a nivel país.
            </p>
          </div>
        </div>
      </div>
    </section>
"""

    # Buscamos dónde inyectar la sección. La colocamos justo antes del bloque de evolución cronológica.
    target_match = re.search(r'<!-- SECCIONES HISTORICAS LINEALES ANUALES -->\s*<section class="section">', html_content)
    if target_match:
        insert_index = target_match.start()
        updated_content = html_content[:insert_index] + new_section + "\n" + html_content[insert_index:]
        HTML_REPORT_PATH.write_text(updated_content, encoding="utf-8")
        print("¡Inyección en reporte HTML completada exitosamente!")
    else:
        # Fallback si no encuentra el comentario
        target_match = re.search(r'<h2>Evolución Cronológica y Análisis por Año</h2>', html_content)
        if target_match:
            # Encontrar el principio de la sección que contiene este H2
            insert_index = html_content.find('<section class="section">', html_content.rfind('<section', 0, target_match.start()))
            if insert_index != -1:
                updated_content = html_content[:insert_index] + new_section + "\n" + html_content[insert_index:]
                HTML_REPORT_PATH.write_text(updated_content, encoding="utf-8")
                print("¡Inyección en reporte HTML completada exitosamente (con fallback H2)!")
            else:
                print("No se pudo inyectar automáticamente en el HTML. Se requiere integración manual.")
        else:
            print("No se pudo ubicar el punto de inyección en el reporte HTML.")


def update_readme() -> None:
    readme_path = DEFAULT_OUTPUT_DIR / "README_graficos_cuadrantes.md"
    if not readme_path.exists():
        return
        
    print(f"Modificando el archivo README en: {readme_path}")
    readme_content = readme_path.read_text(encoding="utf-8")
    
    trajectory_readme_info = """
## Trayectoria Histórica Consolidada (2020-2024)
Se ha generado un gráfico adicional que consolida la evolución del promedio de **UNIMAGDALENA** a lo largo de todo el periodo estudiado:
- Archivo SVG: `resultados/trayectoria_unimagdalena_2020_2024.svg`
- Archivo PNG: `resultados/trayectoria_unimagdalena_2020_2024.png`
- Características:
  - Muestra exclusivamente los puntos promedios de la universidad en cada año.
  - Los ejes del gráfico representan el promedio nacional simple del periodo consolidado de 5 años: Saber 11 = 284.69, Saber Pro = 148.34.
  - Conecta los puntos cronológicamente para mostrar visualmente el tránsito institucional del cuadrante **Alto Aporte** (2020-2022) hacia el cuadrante **Alto Desempeño** (2023-2024).
"""
    
    if "Trayectoria Histórica Consolidada" not in readme_content:
        readme_content += "\n" + trajectory_readme_info
        readme_path.write_text(readme_content, encoding="utf-8")
        print("¡Modificación del README completada exitosamente!")


def main() -> None:
    print("Iniciando generación de gráfico de trayectoria de UNIMAGDALENA...")
    
    # 1. Cargar datos del CSV generado anteriormente
    if not DEFAULT_INPUT_CSV.exists():
        raise FileNotFoundError(f"No se encuentra el archivo de datos base: {DEFAULT_INPUT_CSV}")
        
    df = pl.read_csv(DEFAULT_INPUT_CSV)
    
    # 2. Filtrar por UNIMAGDALENA institucional
    unimag_points = (
        df.filter(
            (pl.col("point_type") == "unimagdalena_university") &
            (pl.col("year_sbpro").is_in(YEARS))
        )
        .to_dicts()
    )
    
    if not unimag_points:
        raise ValueError("No se encontraron registros para UNIMAGDALENA en el archivo de datos.")
        
    print(f"Registros encontrados para UNIMAGDALENA: {len(unimag_points)}")
    for p in sorted(unimag_points, key=lambda x: x["year_sbpro"]):
        print(f"  Año {p['year_sbpro']}: Saber 11 = {p['sb11_global_mean']:.2f}, Saber Pro = {p['sbpro_global_mean']:.2f}")

    # 3. Calcular la media nacional consolidada del periodo de 5 años a partir de todos los registros institucionales
    inst_df = df.filter(pl.col("point_type").is_in(["other_university", "unimagdalena_university"]))
    x_mean = inst_df["sb11_global_mean"].mean()
    y_mean = inst_df["sbpro_global_mean"].mean()
    
    print(f"Medias nacionales de referencia calculadas (2020-2024):")
    print(f"  Saber 11 (Entrada): {x_mean:.2f}")
    print(f"  Saber Pro (Salida): {y_mean:.2f}")
    
    # Límites específicos fijos para el zoom
    x_min, x_max = 270.0, 295.0
    y_min, y_max = 145.0, 157.0

    # 4. Generar el SVG de Trayectoria
    svg_content = build_trajectory_svg(unimag_points, x_mean, y_mean, x_min, x_max, y_min, y_max)
    
    svg_path = DEFAULT_OUTPUT_DIR / "trayectoria_unimagdalena_2020_2024.svg"
    svg_path.write_text(svg_content, encoding="utf-8")
    print(f"Archivo SVG guardado en: {svg_path}")

    # 5. Intentar convertir a PNG usando PyMuPDF (fitz)
    try:
        import fitz
        doc = fitz.open(str(svg_path), filetype="svg")
        page = doc.load_page(0)
        pix = page.get_pixmap(dpi=150)
        png_path = DEFAULT_OUTPUT_DIR / "trayectoria_unimagdalena_2020_2024.png"
        pix.save(str(png_path))
        print(f"Archivo PNG guardado en: {png_path}")
    except Exception as e:
        print(f"Advertencia: No se pudo generar la copia PNG. Error: {e}")

    # 6. Actualizar el reporte HTML
    update_html_report(svg_content)
    
    # 7. Actualizar el README
    update_readme()
    
    print("Proceso completado exitosamente.")


if __name__ == "__main__":
    main()
