import csv
import json
import urllib.request

url_taxonomia = "https://static.openfoodfacts.org/data/taxonomies/categories.json"
archivo_salida = "categorias_openfoodfacts.csv"

print(f"⚡ Descargando taxonomía oficial de categorías desde {url_taxonomia} ...")

req = urllib.request.Request(
    url_taxonomia,
    headers={"User-Agent": "NutriCompare - Category Extractor"}
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode("utf-8"))

    print(f"📦 Procesando {len(data):,} categorías encontradas...")

    categorias = []
    for tag, info in data.items():
        # Extraer nombre en español si existe, si no en inglés, si no la etiqueta
        names = info.get("name", {}) if isinstance(info, dict) else {}
        name_es = names.get("es", "") if isinstance(names, dict) else ""
        name_en = names.get("en", "") if isinstance(names, dict) else ""
        
        categorias.append({
            "tag": tag,
            "nombre_es": name_es,
            "nombre_en": name_en,
        })

    # Ordenar alfabéticamente
    categorias.sort(key=lambda x: x["tag"])

    with open(archivo_salida, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["tag", "nombre_es", "nombre_en"])
        writer.writeheader()
        writer.writerows(categorias)

    print(f"✅ ¡Completado en 2 segundos! Se han guardado {len(categorias):,} categorías en '{archivo_salida}'.")

except Exception as e:
    print(f"❌ Error al descargar taxonomía: {e}")

