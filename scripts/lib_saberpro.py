from __future__ import annotations

import csv
import unicodedata
from pathlib import Path
import yaml

# Directorio raíz del proyecto
PROJECT_ROOT = Path(__file__).resolve().parent.parent

def clean_text(text: object) -> str:
    """
    Limpia y estandariza cadenas de texto:
    - Convierte a mayúsculas.
    - Elimina acentos y diacríticos.
    - Elimina espacios en blanco múltiples y bordes.
    - Reemplaza guiones especiales.
    """
    if text is None:
        return ""
    text_str = str(text).strip().upper()
    # Descomponer caracteres con acento
    nfkd_form = unicodedata.normalize('NFKD', text_str)
    # Filtrar solo caracteres sin marcas de acento
    text_clean = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    # Normalizar espacios múltiples
    text_clean = " ".join(text_clean.split())
    # Reemplazar caracteres especiales de guiones
    text_clean = text_clean.replace("–", "-")
    return text_clean

def load_params() -> dict[str, object]:
    """
    Carga el archivo de configuración parametros.yml.
    """
    params_path = PROJECT_ROOT / "data" / "config" / "parametros.yml"
    if not params_path.exists():
        raise FileNotFoundError(f"No se encontró el archivo de parámetros: {params_path}")
    with open(params_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def load_normalization() -> dict[tuple[str, str], str]:
    """
    Carga el mapeo de normalización de IES desde normalizacion_ies.csv.
    Retorna un diccionario con clave (nombre_origen_limpio, fuente_limpia) -> nombre_normalizado_limpio
    """
    csv_path = PROJECT_ROOT / "data" / "config" / "normalizacion_ies.csv"
    mapping = {}
    if csv_path.exists():
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = (clean_text(row["nombre_origen"]), clean_text(row["fuente"]))
                mapping[key] = clean_text(row["nombre_normalizado"])
    return mapping

def normalize_ies_name(name: object, fuente: str, mapping: dict[tuple[str, str], str] | None = None) -> str:
    """
    Retorna el nombre oficial normalizado para una IES.
    Si no está en el archivo CSV, retorna el nombre limpio estándar.
    """
    if name is None:
        return ""
    cleaned_name = clean_text(name)
    cleaned_fuente = clean_text(fuente)
    if mapping is None:
        mapping = load_normalization()
    
    key = (cleaned_name, cleaned_fuente)
    if key in mapping:
        return mapping[key]
    return cleaned_name

def safe_num(val: object) -> float | int | None:
    """
    Casteo seguro de celdas a valores numéricos (int, float o None para celdas vacías/nulos).
    Previene errores al procesar celdas con espacios, guiones o textos de error como N/A.
    """
    if val is None:
        return None
    val_str = str(val).strip()
    if val_str == "" or val_str.upper() in {"N/A", "NULL", "NONE", "-", "N.A."}:
        return None
    try:
        # Reemplazar coma por punto por si viene formato en español
        if "." in val_str or "," in val_str:
            val_str = val_str.replace(",", ".")
            return float(val_str)
        # Si es un número sin punto, intentar int primero, si falla, float
        try:
            return int(val_str)
        except ValueError:
            return float(val_str)
    except ValueError:
        return None

def classify_quadrant(sb11: float, sbpro: float, limit_x: float, limit_y: float) -> str:
    """
    Clasifica un punto de coordenadas en uno de los 4 cuadrantes definidos.
    """
    if sb11 is None or sbpro is None:
        return "Desconocido"
    if sb11 < limit_x:
        if sbpro >= limit_y:
            return "Alto aporte"
        else:
            return "Base baja"
    else:
        if sbpro >= limit_y:
            return "Alto desempeño"
        else:
            return "Alerta"
