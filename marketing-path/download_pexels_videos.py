import os
import requests
import re

# 1. Configuración
# Consigue tu API Key gratuita creando una cuenta en: https://www.pexels.com/api/
API_KEY = "EX4E3Z8PIhsUIFVXc5Vrzl8FEA0Q65zbuiyqCvVnR0w0PBte3zFMDdpJ"
DOWNLOAD_DIR = "public/downloaded_videos"

# Qué quieres buscar y cuántos vídeos por búsqueda
# QUERIES = {
#     "vanlife nature": 5,
#     "dirt road driving": 5,
#     "wild beach empty": 5,
#     "forest drone top down": 5,
#     "camper sunset": 5,
# }

QUERIES = {
    # 1. El Problema (Para los ganchos de tus vídeos: masificación, ruido)
    "rv park crowded": 3,
    "cars parked dirt road": 3,
    "traffic city escape": 2,
    "tourist crowded nature": 2,
    # 2. Vehículos en Acción (Sensación de aventura y huida)
    "camper van dirt road": 5,
    "motorhome mountain driving": 4,
    "overland vehicle nature": 3,
    "vanlife aerial drone": 4,
    "driving forest path": 3,
    # 3. Los Spots (El objetivo: claros, acantilados, aislamiento)
    "forest clearing top down": 4,  # Perfectos para superponer tus gráficos de radar
    "empty dirt lot nature": 3,
    "cliff edge ocean view": 5,
    "pine forest empty space": 3,
    "gravel road mountain view": 4,
    "isolated landscape drone": 3,
    # 4. La Recompensa (Para el final de los vídeos: POV y tranquilidad)
    "van doors opening ocean": 3,
    "making coffee camper": 2,
    "waking up vanlife": 3,
    "reading book nature": 2,
}

HEADERS = {"Authorization": API_KEY}


def clean_filename(title, query):
    """Limpia el nombre para que sea seguro y descriptivo para código."""
    # Si el video no tiene título, usamos la query
    base_name = title if title else query
    # Convertir a minúsculas y reemplazar espacios/caracteres raros con guiones bajos
    clean = re.sub(r"[^a-z0-9]", "_", base_name.lower())
    clean = re.sub(r"_+", "_", clean).strip("_")
    return clean


def download_videos():
    if not os.path.exists(DOWNLOAD_DIR):
        os.makedirs(DOWNLOAD_DIR)

    for query, count in QUERIES.items():
        print(f"\nBuscando: '{query}'...")
        url = f"https://api.pexels.com/videos/search?query={query}&per_page={count}&orientation=portrait"  # ideal para Reels/TikTok

        response = requests.get(url, headers=HEADERS)

        if response.status_code != 200:
            print(f"Error en la API: {response.status_code}")
            continue

        data = response.json()

        for index, video in enumerate(data.get("videos", [])):
            video_id = video["id"]
            # Obtener el título original o usar la query
            raw_title = (
                video.get("url", "").split("/")[-2] if video.get("url") else query
            )

            # Buscar el archivo de video con la mejor resolución (ej. HD o FHD)
            video_files = video.get("video_files", [])
            # Filtrar por mp4
            mp4_files = [f for f in video_files if f["file_type"] == "video/mp4"]
            # Ordenar por anchura para coger una calidad decente pero no 4K que pese 1GB
            mp4_files.sort(key=lambda x: x["width"], reverse=True)

            if not mp4_files:
                continue

            best_file = mp4_files[0]
            download_link = best_file["link"]
            resolution = f"{best_file['width']}x{best_file['height']}"

            # Crear nombre descriptivo: ej. "camper_sunset_1080x1920_12345.mp4"
            descriptive_name = (
                f"{clean_filename(raw_title, query)}_{resolution}_{video_id}.mp4"
            )
            filepath = os.path.join(DOWNLOAD_DIR, descriptive_name)

            print(f"  -> Descargando: {descriptive_name}")

            try:
                vid_response = requests.get(download_link, stream=True)
                with open(filepath, "wb") as f:
                    for chunk in vid_response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
            except Exception as e:
                print(f"     Error descargando {descriptive_name}: {e}")


if __name__ == "__main__":
    if API_KEY == "TU_API_KEY_AQUI":
        print("¡Ojo! Tienes que poner tu API Key de Pexels en la variable API_KEY.")
    else:
        download_videos()
        print("\n¡Descarga completada!")
