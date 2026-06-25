import json
import polars as pl
from pathlib import Path
import lib_saberpro as sp

def main() -> None:
    print("-------------------------------------------------------")
    # Cargar parámetros y normalización
    params = sp.load_params()
    parquet_path = sp.PROJECT_ROOT / params["parquet_path"]
    umbral = params["umbral_n_cuadrantes"]
    norm_mapping = sp.load_normalization()
    
    print(f"Iniciando procesamiento de cuadrantes (Fuente A)...")
    print(f"Parquet de entrada: {parquet_path}")
    print(f"Umbral crossed_n >= {umbral}")
    
    if not parquet_path.exists():
        raise FileNotFoundError(f"No existe el archivo parquet en: {parquet_path}")
        
    # Leer archivo parquet
    df = pl.read_parquet(parquet_path)
    
    # Filtrar por cruzados mayores al umbral y coordenadas no nulas
    df = df.filter(
        (pl.col("crossed_n") >= umbral) & 
        (pl.col("sb11_global_mean").is_not_null()) & 
        (pl.col("sbpro_global_mean").is_not_null())
    )
    
    # Obtener lista de años reales contenidos en el parquet
    years = sorted(df["year_sbpro"].unique().to_list())
    
    cuadrantes_por_anio = {}
    unimag_trajectory_points = []
    all_univ_points = []
    
    for year in years:
        year_df = df.filter(pl.col("year_sbpro") == year)
        if year_df.is_empty():
            continue
            
        # Normalizar nombres de IES agregando columna inst_normalized
        year_df = year_df.with_columns(
            pl.col("inst_norm").map_elements(
                lambda name: sp.normalize_ies_name(name, "cruce", norm_mapping), 
                return_dtype=pl.Utf8
            ).alias("inst_normalized")
        )
        
        # Calcular columnas pesadas para promedio ponderado
        year_df = year_df.with_columns(
            (pl.col("sb11_global_mean") * pl.col("crossed_n")).alias("sb11_weighted"),
            (pl.col("sbpro_global_mean") * pl.col("crossed_n")).alias("sbpro_weighted")
        )
        
        # Agrupar a nivel institucional
        univ_agg = year_df.group_by("inst_normalized").agg(
            pl.col("crossed_n").sum().alias("n"),
            (pl.col("sb11_weighted").sum() / pl.col("crossed_n").sum()).alias("sb11"),
            (pl.col("sbpro_weighted").sum() / pl.col("crossed_n").sum()).alias("sbpro")
        )
        
        # Límites del año: promedio simple de las coordenadas de todas las universidades
        x_mean = univ_agg["sb11"].mean()
        y_mean = univ_agg["sbpro"].mean()
        
        instituciones = []
        unimag_inst = None
        
        for row in univ_agg.iter_rows(named=True):
            nombre = row["inst_normalized"]
            sb11 = row["sb11"]
            sbpro = row["sbpro"]
            n = row["n"]
            cuadrante = sp.classify_quadrant(sb11, sbpro, x_mean, y_mean)
            
            inst_obj = {
                "nombre": nombre,
                "sb11": round(sb11, 2) if sb11 is not None else None,
                "sbpro": round(sbpro, 2) if sbpro is not None else None,
                "n": int(n),
                "cuadrante": cuadrante
            }
            instituciones.append(inst_obj)
            
            # Recolectar todas las coordenadas universitarias para la trayectoria global
            all_univ_points.append({
                "nombre": nombre,
                "sb11": sb11,
                "sbpro": sbpro,
                "year": year
            })
            
            if nombre == "UNIVERSIDAD DEL MAGDALENA":
                unimag_inst = inst_obj
                
        # Extraer NBCs de UNIMAGDALENA
        unimag_nbc_df = year_df.filter(pl.col("inst_normalized") == "UNIVERSIDAD DEL MAGDALENA")
        nbcs_unimag = []
        for row in unimag_nbc_df.iter_rows(named=True):
            nbc_name = row["nbc_norm"]
            sb11_nbc = row["sb11_global_mean"]
            sbpro_nbc = row["sbpro_global_mean"]
            n_nbc = row["crossed_n"]
            cuadrante_nbc = sp.classify_quadrant(sb11_nbc, sbpro_nbc, x_mean, y_mean)

            nbcs_unimag.append({
                "nbc": nbc_name,
                "sb11": round(sb11_nbc, 2) if sb11_nbc is not None else None,
                "sbpro": round(sbpro_nbc, 2) if sbpro_nbc is not None else None,
                "n": int(n_nbc),
                "cuadrante": cuadrante_nbc
            })

        # NBCs nacionales: promedio ponderado por crossed_n de cada NBC a nivel
        # nacional (todas las IES del pais que lo ofrecen). Solo se calcula para
        # los NBCs que Unimagdalena tiene, para poder hacer la comparacion 1 a 1.
        unimag_nbc_names = {n["nbc"] for n in nbcs_unimag}
        nacional_nbc_df = year_df.filter(pl.col("nbc_norm").is_in(list(unimag_nbc_names)))
        nbcs_nacional = []
        if not nacional_nbc_df.is_empty():
            nacional_agg = nacional_nbc_df.group_by("nbc_norm").agg(
                pl.col("crossed_n").sum().alias("n"),
                (pl.col("sb11_weighted").sum() / pl.col("crossed_n").sum()).alias("sb11"),
                (pl.col("sbpro_weighted").sum() / pl.col("crossed_n").sum()).alias("sbpro")
            )
            for row in nacional_agg.iter_rows(named=True):
                sb11_n = row["sb11"]
                sbpro_n = row["sbpro"]
                nbcs_nacional.append({
                    "nbc": row["nbc_norm"],
                    "sb11": round(sb11_n, 2) if sb11_n is not None else None,
                    "sbpro": round(sbpro_n, 2) if sbpro_n is not None else None,
                    "n": int(row["n"]),
                    "cuadrante": sp.classify_quadrant(sb11_n, sbpro_n, x_mean, y_mean)
                })

        # IES por NBC: para cada NBC de Unimagdalena, lista de todas las IES
        # que lo ofrecen con su sb11 y sbpro para ese NBC. Se usa cuando el
        # usuario filtra por NBC en la grafica de cuadrantes para mostrar
        # todas las instituciones que tienen ese NBC.
        ies_por_nbc = {}
        if not nacional_nbc_df.is_empty():
            # Excluimos Unimagdalena (se dibuja con su propio dot azul)
            ies_nbc_df = nacional_nbc_df.filter(pl.col("inst_normalized") != "UNIVERSIDAD DEL MAGDALENA")
            for nbc_name in unimag_nbc_names:
                ies_for_this_nbc = ies_nbc_df.filter(pl.col("nbc_norm") == nbc_name)
                if ies_for_this_nbc.is_empty():
                    continue
                ies_list = []
                for row in ies_for_this_nbc.iter_rows(named=True):
                    sb11_i = row["sb11_global_mean"]
                    sbpro_i = row["sbpro_global_mean"]
                    if sb11_i is None or sbpro_i is None:
                        continue
                    ies_list.append({
                        "nombre": row["inst_normalized"],
                        "sb11": round(sb11_i, 2),
                        "sbpro": round(sbpro_i, 2),
                        "n": int(row["crossed_n"]),
                        "cuadrante": sp.classify_quadrant(sb11_i, sbpro_i, x_mean, y_mean)
                    })
                if ies_list:
                    ies_por_nbc[nbc_name] = ies_list

        cuadrantes_por_anio[str(year)] = {
            "limites": {
                "x_mean": round(x_mean, 2) if x_mean is not None else None,
                "y_mean": round(y_mean, 2) if y_mean is not None else None
            },
            "instituciones": instituciones,
            "nbcs_unimag": nbcs_unimag,
            "nbcs_nacional": nbcs_nacional,
            "ies_por_nbc": ies_por_nbc
        }
        
        # Guardar coordenadas de la trayectoria para UNIMAGDALENA
        if unimag_inst is not None:
            unimag_trajectory_points.append({
                "anio": int(year),
                "sb11": unimag_inst["sb11"],
                "sbpro": unimag_inst["sbpro"],
                "n": unimag_inst["n"],
                "cuadrante_anual": unimag_inst["cuadrante"]
            })
            
    # Calcular límites consolidados de la trayectoria (promedio de todos los puntos de todas las IES de todos los años)
    all_sb11 = [p["sb11"] for p in all_univ_points if p["sb11"] is not None]
    all_sbpro = [p["sbpro"] for p in all_univ_points if p["sbpro"] is not None]
    traj_x_mean = sum(all_sb11) / len(all_sb11) if all_sb11 else 0
    traj_y_mean = sum(all_sbpro) / len(all_sbpro) if all_sbpro else 0
    
    # Clasificar puntos de UNIMAGDALENA en base al límite consolidado
    for p in unimag_trajectory_points:
        p["cuadrante_consolidado"] = sp.classify_quadrant(p["sb11"], p["sbpro"], traj_x_mean, traj_y_mean)
        
    trajectory_unimag = {
        "limites": {
            "x_mean": round(traj_x_mean, 2),
            "y_mean": round(traj_y_mean, 2)
        },
        "puntos": sorted(unimag_trajectory_points, key=lambda x: x["anio"])
    }
    
    # Escribir salida intermedia
    processed_dir = sp.PROJECT_ROOT / params["processed_dir"]
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    output_data = {
        "cuadrantes_por_anio": cuadrantes_por_anio,
        "trayectoria_unimag": trajectory_unimag
    }
    
    output_path = processed_dir / "cuadrantes_procesados.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
        
    print(f"Procesamiento finalizado. Archivo temporal guardado en {output_path}")
    print(f"Años procesados: {years}")
    print(f"Puntos de trayectoria de UNIMAGDALENA: {len(unimag_trajectory_points)}")
    print("-------------------------------------------------------")

if __name__ == "__main__":
    main()
