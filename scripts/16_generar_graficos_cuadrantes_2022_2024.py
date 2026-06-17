from __future__ import annotations

import argparse
import html
import math
from pathlib import Path

import polars as pl

# Definición de rutas dinámicas relativas al directorio raíz del proyecto
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = PROJECT_ROOT / "data" / "Perfiles_INBC_Anuales_2016_2024.parquet"
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "resultados"
YEARS = [2020, 2021, 2022, 2023, 2024]


def nice_floor(value: float, step: int = 10) -> float:
    return math.floor(value / step) * step


def nice_ceil(value: float, step: int = 10) -> float:
    return math.ceil(value / step) * step


def ticks(start: float, end: float, count: int = 5) -> list[float]:
    if count <= 1:
        return [start]
    step = (end - start) / (count - 1)
    return [start + step * i for i in range(count)]


def fmt_num(value: float, decimals: int = 1) -> str:
    return f"{value:.{decimals}f}"


def point_radius(crossed_n: int) -> float:
    return max(5.0, min(15.0, 4.2 + math.sqrt(crossed_n) * 0.12))


def esc(value: object) -> str:
    return html.escape("" if value is None else str(value), quote=True)


def is_unimagdalena(value: object) -> bool:
    text = str(value or "").upper()
    return "UNIMAGDALENA" in text or "UNIVERSIDAD DEL MAGDALENA" in text


def build_svg(
    data: list[dict[str, object]],
    year: int,
    x_min: float,
    x_max: float,
    y_min: float,
    y_max: float,
    show_details: bool = True,
) -> str:
    width = 1800
    if show_details:
        height = 1420
        margin_bottom = 500
    else:
        height = 1100
        margin_bottom = 180
        
    margin_left = 300
    margin_right = 180
    margin_top = 230
    plot_w = width - margin_left - margin_right
    plot_h = height - margin_top - margin_bottom
    card_gap = 60
    card_w = (plot_w - card_gap) / 2
    card_h = 132
    right_card_x = margin_left + card_w + card_gap

    university_data = [row for row in data if row["point_type"] in {"other_university", "unimagdalena_university"}]
    x_mean = sum(float(row["sb11_global_mean"]) for row in university_data) / len(university_data)
    y_mean = sum(float(row["sbpro_global_mean"]) for row in university_data) / len(university_data)

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
            f'aria-label="Grafico de cuadrantes Saber 11 y Saber Pro {year}">'
        ),
        "<style>",
        "text{font-family:Arial, Helvetica, sans-serif;letter-spacing:0}",
        ".title{font-size:36px;font-weight:800;fill:#4a5870}",
        ".axis-label{font-size:27px;font-weight:800;fill:#4a5870}",
        ".tick{font-size:28px;fill:#666}",
        ".quad{font-size:27px;font-weight:800;fill:#073a67}",
        ".base{fill:#5d6e87}",
        ".alert{fill:#846b00}",
        ".legend{font-size:24px;font-weight:700;fill:#4a5870}",
        ".explain-title{font-size:26px;font-weight:800;fill:#111827}",
        ".explain-text{font-size:21px;font-weight:700;fill:#65748a}",
        ".explain-box{stroke:#e7edf5;stroke-width:2}",
        ".grid{stroke:#d9e3ef;stroke-width:2;stroke-dasharray:7 9}",
        ".axis{stroke:#666;stroke-width:2}",
        ".mean{stroke:#6f91ba;stroke-width:2.4;stroke-dasharray:11 11}",
        "</style>",
        f'<rect x="0" y="0" width="{width}" height="{height}" fill="#ffffff"/>',
    ]
    if show_details:
        parts.append(f'<text class="title" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="800" fill="#4a5870" x="58" y="86">Cuadrantes Saber 11 - Saber Pro {year}</text>')
        
    parts.extend([
        '<circle cx="70" cy="135" r="10" fill="#66bf78" fill-opacity="0.62" stroke="#ffffff" stroke-width="2"/>',
        '<text class="legend" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#4a5870" x="92" y="144">Otras universidades</text>',
        '<circle cx="390" cy="135" r="12" fill="#d9482f" fill-opacity="0.92" stroke="#7c1f12" stroke-width="2"/>',
        '<text class="legend" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#4a5870" x="416" y="144">UNIMAGDALENA</text>',
        '<circle cx="660" cy="135" r="9" fill="#2f7fd9" fill-opacity="0.9" stroke="#0f3f77" stroke-width="2"/>',
        '<text class="legend" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#4a5870" x="683" y="144">NBC UNIMAGDALENA</text>',
        f'<rect x="{x0}" y="{y0}" width="{x_mid - x0}" height="{y_mid - y0}" fill="#eaf7ed"/>',
        f'<rect x="{x_mid}" y="{y0}" width="{x1 - x_mid}" height="{y_mid - y0}" fill="#f5f7fa"/>',
        f'<rect x="{x0}" y="{y_mid}" width="{x_mid - x0}" height="{y1 - y_mid}" fill="#fbfcfd"/>',
        f'<rect x="{x_mid}" y="{y_mid}" width="{x1 - x_mid}" height="{y1 - y_mid}" fill="#fffaf0"/>',
    ])

    for x_tick in ticks(x_min, x_max):
        x = sx(x_tick)
        parts.append(f'<line class="grid" stroke="#d9e3ef" stroke-width="2" stroke-dasharray="7,9" x1="{x:.2f}" y1="{y0}" x2="{x:.2f}" y2="{y1}"/>')
    for y_tick in ticks(y_min, y_max):
        y = sy(y_tick)
        parts.append(f'<line class="grid" stroke="#d9e3ef" stroke-width="2" stroke-dasharray="7,9" x1="{x0}" y1="{y:.2f}" x2="{x1}" y2="{y:.2f}"/>')

    parts.extend(
        [
            f'<line class="mean" stroke="#6f91ba" stroke-width="2.4" stroke-dasharray="11,11" x1="{x_mid:.2f}" y1="{y0}" x2="{x_mid:.2f}" y2="{y1}"/>',
            f'<line class="mean" stroke="#6f91ba" stroke-width="2.4" stroke-dasharray="11,11" x1="{x0}" y1="{y_mid:.2f}" x2="{x1}" y2="{y_mid:.2f}"/>',
            f'<line class="axis" stroke="#666" stroke-width="2" x1="{x0}" y1="{y1}" x2="{x1}" y2="{y1}"/>',
            f'<line class="axis" stroke="#666" stroke-width="2" x1="{x0}" y1="{y0}" x2="{x0}" y2="{y1}"/>',
        ]
    )

    for x_tick in ticks(x_min, x_max):
        x = sx(x_tick)
        parts.append(f'<line class="axis" stroke="#666" stroke-width="2" x1="{x:.2f}" y1="{y1}" x2="{x:.2f}" y2="{y1 + 12}"/>')
        parts.append(f'<text class="tick" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#666" x="{x:.2f}" y="{y1 + 58}" text-anchor="middle">{fmt_num(x_tick)}</text>')
    for y_tick in ticks(y_min, y_max):
        y = sy(y_tick)
        parts.append(f'<line class="axis" stroke="#666" stroke-width="2" x1="{x0 - 12}" y1="{y:.2f}" x2="{x0}" y2="{y:.2f}"/>')
        parts.append(f'<text class="tick" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#666" x="{x0 - 34}" y="{y + 10:.2f}" text-anchor="end">{fmt_num(y_tick)}</text>')

    parts.extend(
        [
            f'<text class="quad" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="800" fill="#073a67" x="{x0 + 12}" y="{y0 + 30}">Alto aporte</text>',
            f'<text class="quad" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="800" fill="#073a67" x="{x1 - 12}" y="{y0 + 30}" text-anchor="end">Alto desempe&#241;o</text>',
            f'<text class="quad base" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="800" fill="#5d6e87" x="{x0 + 12}" y="{y1 - 12}">Base baja</text>',
            f'<text class="quad alert" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="800" fill="#846b00" x="{x1 - 12}" y="{y1 - 12}" text-anchor="end">Alerta</text>',
        ]
    )

    draw_order = {"other_university": 0, "unimagdalena_nbc": 1, "unimagdalena_university": 2}
    sorted_data = sorted(data, key=lambda item: (draw_order[str(item["point_type"])], int(item["crossed_n"])))
    for row in sorted_data:
        x = sx(float(row["sb11_global_mean"]))
        y = sy(float(row["sbpro_global_mean"]))
        point_type = str(row["point_type"])
        r = point_radius(int(row["crossed_n"]))
        if point_type == "unimagdalena_university":
            r += 3.0
            fill = "#d9482f"
            opacity = "0.92"
            stroke = "#7c1f12"
            stroke_width = "2.4"
        elif point_type == "unimagdalena_nbc":
            r = max(7.0, r - 1.0)
            fill = "#2f7fd9"
            opacity = "0.88"
            stroke = "#0f3f77"
            stroke_width = "1.9"
        else:
            fill = "#66bf78"
            opacity = "0.62"
            stroke = "#ffffff"
            stroke_width = "1"
        title = (
            f"{row['point_label']} | "
            f"Saber 11: {fmt_num(float(row['sb11_global_mean']), 2)} | "
            f"Saber Pro: {fmt_num(float(row['sbpro_global_mean']), 2)} | "
            f"n={row['crossed_n']}"
        )
        parts.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r:.2f}" fill="{fill}" '
            f'fill-opacity="{opacity}" stroke="{stroke}" stroke-width="{stroke_width}">'
            f"<title>{esc(title)}</title></circle>"
        )

    parts.extend(
        [
            f'<circle cx="{x_mid:.2f}" cy="{y_mid:.2f}" r="10" fill="#063a66" stroke="#ffffff" stroke-width="2">',
            (
                f"<title>Promedio de universidades: Saber 11 {fmt_num(x_mean, 2)}, "
                f"Saber Pro {fmt_num(y_mean, 2)}</title>"
            ),
            "</circle>",
            (
                f'<text class="axis-label" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="800" fill="#4a5870" x="{x0 - 198}" y="{(y0 + y1) / 2:.2f}" text-anchor="middle" '
                f'transform="rotate(-90 {x0 - 198} {(y0 + y1) / 2:.2f})">'
                "Promedio Saber Pro (Salida)</text>"
            ),
            f'<text class="axis-label" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="800" fill="#4a5870" x="{(x0 + x1) / 2:.2f}" y="{y1 + 96}" text-anchor="middle">Promedio Saber 11 (Entrada)</text>',
        ]
    )

    if show_details:
        parts.extend(
            [
                f'<rect class="explain-box" stroke="#e7edf5" stroke-width="2" x="{x0}" y="{y1 + 132}" width="{card_w:.2f}" height="{card_h}" rx="22" fill="#eaf7ed"/>',
                f'<circle cx="{x0 + 34}" cy="{y1 + 170}" r="12" fill="#00a11a"/>',
                f'<text class="explain-title" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="800" fill="#111827" x="{x0 + 66}" y="{y1 + 180}">Alto aporte</text>',
                f'<text class="explain-text" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" fill="#65748a" x="{x0 + 34}" y="{y1 + 214}">Entrada menor al promedio y salida</text>',
                f'<text class="explain-text" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" fill="#65748a" x="{x0 + 34}" y="{y1 + 240}">mayor al promedio.</text>',
                f'<rect class="explain-box" stroke="#e7edf5" stroke-width="2" x="{right_card_x:.2f}" y="{y1 + 132}" width="{card_w:.2f}" height="{card_h}" rx="22" fill="#f5f7fa"/>',
                f'<circle cx="{right_card_x + 34:.2f}" cy="{y1 + 170}" r="12" fill="#073a67"/>',
                f'<text class="explain-title" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="800" fill="#111827" x="{right_card_x + 66:.2f}" y="{y1 + 180}">Alto desempe&#241;o</text>',
                f'<text class="explain-text" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" fill="#65748a" x="{right_card_x + 34:.2f}" y="{y1 + 222}">Entrada y salida por encima del promedio.</text>',
                f'<rect class="explain-box" stroke="#e7edf5" stroke-width="2" x="{x0}" y="{y1 + 286}" width="{card_w:.2f}" height="{card_h}" rx="22" fill="#fbfcfd"/>',
                f'<circle cx="{x0 + 34}" cy="{y1 + 324}" r="12" fill="#5d6e87"/>',
                f'<text class="explain-title" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="800" fill="#111827" x="{x0 + 66}" y="{y1 + 334}">Base baja</text>',
                f'<text class="explain-text" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" fill="#65748a" x="{x0 + 34}" y="{y1 + 376}">Entrada y salida por debajo del promedio.</text>',
                f'<rect class="explain-box" stroke="#e7edf5" stroke-width="2" x="{right_card_x:.2f}" y="{y1 + 286}" width="{card_w:.2f}" height="{card_h}" rx="22" fill="#fffaf0"/>',
                f'<circle cx="{right_card_x + 34:.2f}" cy="{y1 + 324}" r="12" fill="#846b00"/>',
                f'<text class="explain-title" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="800" fill="#111827" x="{right_card_x + 66:.2f}" y="{y1 + 334}">Alerta</text>',
                f'<text class="explain-text" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="700" fill="#65748a" x="{right_card_x + 34:.2f}" y="{y1 + 376}">Entrada alta con salida menor al promedio.</text>',
            ]
        )
    parts.append("</svg>")
    return "\n".join(parts)


def write_html(output_dir: Path, svg_names: list[str]) -> None:
    sections = []
    for name in svg_names:
        svg_text = (output_dir / name).read_text(encoding="utf-8")
        svg_text = "\n".join(line for line in svg_text.splitlines() if not line.startswith("<?xml"))
        sections.append(f"<section>{svg_text}</section>")

    html_text = "\n".join(
        [
            "<!doctype html>",
            '<html lang="es">',
            "<head>",
            '<meta charset="utf-8">',
            "<title>Cuadrantes Saber 11 - Saber Pro 2020-2024</title>",
            "<style>",
            "body{margin:0;background:#f3f5f7;font-family:Arial,Helvetica,sans-serif}",
            "main{max-width:1500px;margin:0 auto;padding:28px}",
            "section{margin:0 0 28px;background:#fff;box-shadow:0 10px 30px rgba(15,23,42,.08)}",
            "svg{display:block;width:100%;height:auto}",
            "</style>",
            "</head>",
            "<body><main>",
            *sections,
            "</main></body></html>",
        ]
    )
    (output_dir / "cuadrantes_saber11_saberpro_2020_2024.html").write_text(html_text, encoding="utf-8")


def write_summary(output_dir: Path, summary: pl.DataFrame, min_crossed_n: int) -> None:
    lines = [
        "# Graficos De Cuadrantes Saber 11 - Saber Pro 2020-2024",
        "",
        "## Objetivo General",
        "Desarrollar un informe institucional interactivo y de alto valor analítico que permita evaluar, monitorear y comunicar el desempeño de los estudiantes de la Universidad del Magdalena en las pruebas Saber Pro, mediante indicadores, visualizaciones y análisis estratégicos que apoyen la toma de decisiones académicas, curriculares y de aseguramiento de la calidad.",
        "",
        "## Fuente y filtros",
        f"- Fuente: `{DEFAULT_INPUT.as_posix()}`.",
        "- Unidad principal del grafico: universidad.",
        "- Capa adicional: NBC de UNIMAGDALENA.",
        f"- Filtro base: INBC con `crossed_n >= {min_crossed_n}` antes de agregar a universidad.",
        "- Eje X: `sb11_global_mean`.",
        "- Eje Y: `sbpro_global_mean`.",
        "- Lineas punteadas: promedio simple de las universidades graficadas en cada ano.",
        "",
        "## Resumen",
        "| Ano | Universidades | NBC UNIMAGDALENA | Promedio universidades Saber 11 | Promedio universidades Saber Pro |",
        "|---:|---:|---:|---:|---:|",
    ]
    for row in summary.iter_rows(named=True):
        lines.append(
            "| {year} | {universities:,} | {unimag_nbc:,} | {x:.2f} | {y:.2f} |".format(
                year=row["year_sbpro"],
                universities=row["university_n"],
                unimag_nbc=row["unimagdalena_nbc_n"],
                x=row["x_mean"],
                y=row["y_mean"],
            )
        )
    (output_dir / "README_graficos_cuadrantes.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera graficos de cuadrantes Saber 11 vs Saber Pro por ano.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--min-crossed-n", type=int, default=25)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)

    inbc_df = (
        pl.read_parquet(args.input)
        .filter(pl.col("year_sbpro").is_in(YEARS))
        .filter(pl.col("crossed_n") >= args.min_crossed_n)
        .filter(pl.col("sb11_global_mean").is_not_null() & pl.col("sbpro_global_mean").is_not_null())
        .with_columns(
            pl.col("inst_norm")
            .map_elements(is_unimagdalena, return_dtype=pl.Boolean)
            .alias("is_unimagdalena")
        )
        .select(
            [
                "year_sbpro",
                "inst_norm",
                "nbc_norm",
                "crossed_n",
                "inst_name",
                "is_unimagdalena",
                "sb11_global_mean",
                "sbpro_global_mean",
                "raw_n",
                "coverage_ratio",
            ]
        )
        .sort(["year_sbpro", "sb11_global_mean", "sbpro_global_mean"])
    )

    if inbc_df.is_empty():
        raise ValueError("No hay datos para graficar con los filtros indicados.")

    university_df = (
        inbc_df.with_columns(
            [
                (pl.col("sb11_global_mean") * pl.col("crossed_n")).alias("sb11_weighted"),
                (pl.col("sbpro_global_mean") * pl.col("crossed_n")).alias("sbpro_weighted"),
            ]
        )
        .group_by(["year_sbpro", "inst_norm", "is_unimagdalena"])
        .agg(
            [
                pl.col("crossed_n").sum().alias("crossed_n"),
                pl.col("inst_name").drop_nulls().first().alias("inst_name"),
                (pl.col("sb11_weighted").sum() / pl.col("crossed_n").sum()).alias("sb11_global_mean"),
                (pl.col("sbpro_weighted").sum() / pl.col("crossed_n").sum()).alias("sbpro_global_mean"),
            ]
        )
        .with_columns(
            [
                pl.when(pl.col("is_unimagdalena"))
                .then(pl.lit("unimagdalena_university"))
                .otherwise(pl.lit("other_university"))
                .alias("point_type"),
                pl.col("inst_name").alias("point_label"),
                pl.lit(None, dtype=pl.Utf8).alias("nbc_norm"),
            ]
        )
        .select(
            [
                "year_sbpro",
                "inst_norm",
                "nbc_norm",
                "crossed_n",
                "inst_name",
                "is_unimagdalena",
                "point_type",
                "point_label",
                "sb11_global_mean",
                "sbpro_global_mean",
            ]
        )
    )

    unimag_nbc_df = (
        inbc_df.filter(pl.col("is_unimagdalena"))
        .with_columns(
            [
                pl.lit("unimagdalena_nbc").alias("point_type"),
                pl.concat_str([pl.lit("UNIMAGDALENA - "), pl.col("nbc_norm")]).alias("point_label"),
            ]
        )
        .select(
            [
                "year_sbpro",
                "inst_norm",
                "nbc_norm",
                "crossed_n",
                "inst_name",
                "is_unimagdalena",
                "point_type",
                "point_label",
                "sb11_global_mean",
                "sbpro_global_mean",
            ]
        )
    )

    df = pl.concat([university_df, unimag_nbc_df], how="diagonal_relaxed").sort(
        ["year_sbpro", "point_type", "sb11_global_mean", "sbpro_global_mean"]
    )

    x_min = nice_floor(df["sb11_global_mean"].min() - 5)
    x_max = nice_ceil(df["sb11_global_mean"].max() + 5)
    y_min = nice_floor(df["sbpro_global_mean"].min() - 5)
    y_max = nice_ceil(df["sbpro_global_mean"].max() + 5)

    csv_path = PROJECT_ROOT / "data" / "datos_cuadrantes_saber11_saberpro_2020_2024.csv"
    df.write_csv(csv_path)

    summary = (
        df.with_columns((pl.col("point_type") != "unimagdalena_nbc").alias("is_university_point"))
        .group_by("year_sbpro")
        .agg(
            [
                pl.col("is_university_point").sum().alias("university_n"),
                (pl.col("point_type") == "unimagdalena_nbc").sum().alias("unimagdalena_nbc_n"),
                pl.when(pl.col("is_university_point"))
                .then(pl.col("sb11_global_mean"))
                .otherwise(None)
                .mean()
                .alias("x_mean"),
                pl.when(pl.col("is_university_point"))
                .then(pl.col("sbpro_global_mean"))
                .otherwise(None)
                .mean()
                .alias("y_mean"),
            ]
        )
        .sort("year_sbpro")
    )

    svg_names: list[str] = []
    for year in YEARS:
        year_data = df.filter(pl.col("year_sbpro") == year).to_dicts()
        if not year_data:
            continue
        svg_name = f"cuadrantes_saber11_saberpro_{year}.svg"
        svg_path = args.output_dir / svg_name
        # Escribir el SVG original con título y explicaciones
        svg_path.write_text(
            build_svg(year_data, year, x_min, x_max, y_min, y_max, show_details=True),
            encoding="utf-8",
        )
        svg_names.append(svg_name)

        # Generar copia en formato PNG usando PyMuPDF si está disponible (sin título ni explicaciones)
        try:
            import fitz
            import os
            # Generamos la versión simplificada del SVG en un archivo temporal
            temp_svg_path = args.output_dir / f"temp_{year}.svg"
            temp_svg_content = build_svg(year_data, year, x_min, x_max, y_min, y_max, show_details=False)
            temp_svg_path.write_text(temp_svg_content, encoding="utf-8")
            
            doc = fitz.open(str(temp_svg_path), filetype="svg")
            page = doc.load_page(0)
            pix = page.get_pixmap(dpi=150)
            png_path = args.output_dir / f"cuadrantes_saber11_saberpro_{year}.png"
            pix.save(str(png_path))
            
            # Borrar archivo temporal
            try:
                os.remove(temp_svg_path)
            except Exception:
                pass
        except Exception as e:
            print(f"Advertencia: No se pudo generar el PNG para {year}. Error: {e}")

    write_html(args.output_dir, svg_names)
    write_summary(args.output_dir, summary, args.min_crossed_n)

    print(f"Graficos generados en: {args.output_dir}")
    print(summary)


if __name__ == "__main__":
    main()
