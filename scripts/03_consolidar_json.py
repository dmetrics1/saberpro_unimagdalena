import json
from datetime import datetime
from pathlib import Path
import lib_saberpro as sp

def main() -> None:
    print("-------------------------------------------------------")
    params = sp.load_params()
    processed_dir = sp.PROJECT_ROOT / params["processed_dir"]
    output_path = sp.PROJECT_ROOT / params["output_json"]
    
    cuadrantes_file = processed_dir / "cuadrantes_procesados.json"
    agregados_file = processed_dir / "agregados_procesados.json"
    
    print(f"Iniciando consolidación de JSON maestro...")
    print(f"Archivo de cuadrantes: {cuadrantes_file}")
    print(f"Archivo de agregados: {agregados_file}")
    
    if not cuadrantes_file.exists():
        raise FileNotFoundError(f"Falta archivo de cuadrantes procesados en: {cuadrantes_file}")
    if not agregados_file.exists():
        raise FileNotFoundError(f"Falta archivo de agregados procesados en: {agregados_file}")
        
    # Cargar datos intermedios
    with open(cuadrantes_file, "r", encoding="utf-8") as f:
        cuadrantes_data = json.load(f)
        
    with open(agregados_file, "r", encoding="utf-8") as f:
        agregados_data = json.load(f)
        
    # Construir bloque meta
    meta = {
        "anio_vigente": params["anio_vigente"],
        "fecha_generacion": datetime.now().astimezone().isoformat(),
        "convencion_n": "Base de cruce (Fuente A) utiliza 'crossed_n' con umbral >= 25. Bases agregadas (Fuente B) utiliza 'CANTIDADEVALUADOS'.",
        "fuentes": {
            "fuente_a_cruce": {
                "archivo": Path(params["parquet_path"]).name,
                "periodo": "2018-2024",
                "medida_n": f"crossed_n >= {params['umbral_n_cuadrantes']}",
                "descripcion": "Estudiantes con registros emparejados en las pruebas Saber 11 y Saber Pro para cálculo de valor agregado."
            },
            "fuente_b_agregados": {
                "directorio": params["agregados_dir"],
                "periodo": "2020-2025",
                "medida_n": "CANTIDADEVALUADOS",
                "descripcion": "Resultados agregados anuales oficiales del Icfes de todos los estudiantes evaluados."
            }
        },
        "nota": "Los cuadrantes y trayectoria (Fuente A) cubren de 2018 a 2024 debido a la disponibilidad actual de datos de cruce. Los demás análisis (programas, facultades, SUE, departamento) cubren de 2020 a 2025."
    }
    
    # Consolidar en el JSON maestro
    consolidated = {
        "meta": meta,
        "institucional": agregados_data["institucional"],
        "sue_ranking": agregados_data["sue_ranking"],
        "departamento": agregados_data["departamento"],
        "cuadrantes_por_anio": cuadrantes_data["cuadrantes_por_anio"],
        "trayectoria_unimag": cuadrantes_data["trayectoria_unimag"],
        "facultades": agregados_data["facultades"],
        "programas": agregados_data["programas"],
        "top10": agregados_data["top10"],
        "niveles_desempeno": agregados_data["niveles_desempeno"]
    }
    
    # Escribir el archivo final consolidado
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(consolidated, f, ensure_ascii=False, indent=2)
        
    print(f"Consolidación completada exitosamente.")
    print(f"JSON maestro final guardado en: {output_path}")
    print("-------------------------------------------------------")

if __name__ == "__main__":
    main()
