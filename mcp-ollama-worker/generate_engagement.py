# -*- coding: utf-8 -*-
import os
import sys
import json
import re
import glob
import requests
import datetime
from apify_client import ApifyClient
import random

# Configuration

HASHTAGS_IG = [
    "pernoctaenfurgo",
    "lugarescamper",
    "rutasfurgoneta",
    "camperizacionmedida",
    "viajandoenfurgo",
    "furgoneteo",
    "dormirenfurgo",
    "furgonetasymas",
    "vanlife",
    "furgocamper",
]

SEARCH_PHRASES_TT = [
    "pernocta furgoneta",
    "ruta camper",
    "camperizacion",
    "camper",
    "furgoneta camper",
]

RESULTS_LIMIT = 100
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen3.6:27b"


def get_previously_engaged_users():
    """Reads all past engagement lists to find users we've already commented on."""
    out_dir = os.path.join(
        os.path.dirname(__file__), "..", "marketing-path", "active-campaigns"
    )
    seen_users = set()
    for file_path in glob.glob(os.path.join(out_dir, "engagement-list-*.md")):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                # Matches patterns like: **1. @username —
                matches = re.findall(r"\*\*\d+\.\s+@([a-zA-Z0-9_.-]+)", content)
                for m in matches:
                    seen_users.add(m.lower())
        except Exception:
            pass
    out_dir = os.path.join(
        os.path.dirname(__file__), "..", "marketing-path", "past-campaigns"
    )
    for file_path in glob.glob(os.path.join(out_dir, "engagement-list-*.md")):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                # Matches patterns like: **1. @username —
                matches = re.findall(r"\*\*\d+\.\s+@([a-zA-Z0-9_.-]+)", content)
                for m in matches:
                    seen_users.add(m.lower())
        except Exception:
            pass
    return seen_users


def main():
    api_token = os.environ.get("APIFY_API_TOKEN")
    if not api_token:
        print("Error: APIFY_API_TOKEN environment variable is not set.")
        sys.exit(1)

    seen_users = get_previously_engaged_users()
    print(f"[*] Loaded {len(seen_users)} previously engaged users to avoid repetition.")

    client = ApifyClient(api_token)

    # 1. Fetch Instagram Posts
    selected_ig_tags = random.sample(HASHTAGS_IG, 3)
    ig_urls = [f"https://www.instagram.com/explore/tags/{h}/" for h in selected_ig_tags]
    print(
        f"[*] Starting Apify Instagram run for hashtags: {', '.join(selected_ig_tags)}..."
    )

    ig_run_input = {
        "directUrls": ig_urls,
        "resultsType": "posts",
        "resultsLimit": RESULTS_LIMIT,
    }

    ig_posts = []
    try:
        ig_run = client.actor("apify/instagram-scraper").call(run_input=ig_run_input)
        print("[*] Instagram Apify run finished. Fetching results...")
        for item in client.dataset(ig_run["defaultDatasetId"]).iterate_items():
            username = (
                item.get("ownerUsername") or item.get("ownerFullName") or "Unknown"
            )
            url = item.get("url") or item.get("displayUrl") or ""
            caption = item.get("caption") or item.get("text") or ""
            likes = item.get("likesCount") or 0
            comments = item.get("commentsCount") or 0
            post_type = item.get("type", "Post")

            # Skip if we've engaged with them before
            if caption and url and username.lower() not in seen_users:
                ig_posts.append(
                    {
                        "username": username,
                        "url": url,
                        "caption": caption,
                        "likes": likes,
                        "comments": comments,
                        "post_type": post_type,
                    }
                )
    except Exception as e:
        print(f"[-] Error calling Apify Instagram Scraper: {e}")

    # 2. Fetch TikTok Posts
    selected_tt_phrase = random.choice(SEARCH_PHRASES_TT)
    print(f"[*] Starting Apify TikTok run for search phrase: '{selected_tt_phrase}'...")

    tt_run_input = {
        "searchQueries": [selected_tt_phrase],
        "resultsPerPage": RESULTS_LIMIT,
        "downloadVideo": False,
        "downloadCoverImage": False,
        "oldestPostDateUnified": (
            datetime.datetime.now() - datetime.timedelta(days=7)
        ).strftime("%Y-%m-%d"),
    }

    tt_posts = []
    try:
        # 'clockworks/tiktok-scraper' is the standard Apify TikTok actor
        tt_run = client.actor("clockworks/tiktok-scraper").call(run_input=tt_run_input)
        print("[*] TikTok Apify run finished. Fetching results...")
        for item in client.dataset(tt_run["defaultDatasetId"]).iterate_items():
            author = (
                item.get("authorMeta", {}).get("name")
                or item.get("author", {}).get("uniqueId")
                or item.get("authorMeta", {}).get("nickName")
                or "Unknown"
            )
            url = item.get("webVideoUrl") or item.get("videoUrl") or ""
            caption = item.get("text") or item.get("desc") or ""
            likes = item.get("diggCount") or item.get("playCount") or 0

            # Extra context specific to TikTok
            keywords = item.get("suggestedWords", [])
            music = item.get("musicMeta", {}).get("musicName", "")

            # Skip if we've engaged with them before
            if caption and url and author.lower() not in seen_users:
                tt_posts.append(
                    {
                        "username": author,
                        "url": url,
                        "caption": caption,
                        "likes": likes,
                        "suggested_keywords": ", ".join(keywords) if keywords else "",
                        "music": music,
                    }
                )
    except Exception as e:
        print(f"[-] Error calling Apify TikTok Scraper: {e}")

    if not ig_posts and not tt_posts:
        print(
            "[-] No valid new posts found on either platform after filtering. Exiting."
        )
        sys.exit(1)

    print(
        f"[*] Fetched {len(ig_posts)} new IG posts and {len(tt_posts)} new TikTok posts. Preparing prompt for Qwen 3.6..."
    )

    today_str = datetime.datetime.now().strftime("%d %B %Y")

    prompt = f"""
Actúa como el Community Manager de WildSpotter (una app de pernocta y exploración de lugares naturales para furgonetas camper).
Filosofía de WildSpotter: Amante de la naturaleza y los spots secretos para dormir. La app avisa de la legalidad de pernocta para no crear conflictos con las autoridades y evitar masificaciones.
Tu objetivo es generar un archivo Markdown con la "Lista de Engagement 5-3-1" para hoy ({today_str}).
He extraído posts recientes de Instagram (múltiples hashtags) y TikTok (búsqueda por palabras clave).

REGLAS ESTRICTAS:
1. NO sigas a nadie. Solo comenta.
2. Adapta CADA comentario con un detalle específico que se mencione en el "Caption" (descripción) del post. Que no parezca un bot.
3. Tono: cercano, con emojis (máximo 2, que no parezcan spam), como si hablaras con un colega vanlifer.
4. Los comentarios deben ser breves y, si aplica, incluir una pregunta abierta no invasiva para generar interacción.
5. No abuses de las preguntas; algunos comentarios pueden ser de simple reconocimiento o empatía.
6. Utiliza solo posts en español y basados en España (excluye Latinoamérica). Deben estar claramente relacionados con el mundo camper.
7. Si no hay suficientes posts en español/España, genera los que puedas y añade una nota al final indicándolo.
8. NUNCA inventes usuarios o posts, usa solo los proporcionados en "DATOS DE...".
9. Genera DOS secciones: "## INSTAGRAM (9 comentarios)" y "## TIKTOK (9 comentarios)".
10. Para CADA plataforma, selecciona idealmente 9 posts (o el máximo disponible):
   - 5 de cuentas pequeñas
   - 3 de cuentas medianas
   - 1 de cuenta grande (básate en los "Likes" para estimar el tamaño)
11. Usa este formato exacto para cada post:

**1. @username — Reel/TikTok "breve resumen"**
📎 URL_AQUI
📝 Contenido: resumen de la descripción
💡 Opinión: Tu opinión sobre el contenido y por qué lo has seleccionado.
💬 `Tu comentario adaptado y súper natural`

12. Para TikTok, te proporcionaré las etiquetas sugeridas ("Keywords") y la música ("Music"). Úsalas sutilmente en tu comentario si aportan valor para demostrar que has visto el vídeo (ej. si la música es relajante o las etiquetas mencionan un lugar).
---

DATOS DE INSTAGRAM:
"""
    for idx, p in enumerate(ig_posts):
        prompt += (
            f"\n--- IG POST {idx+1} ---\n"
            f"Username: {p['username']}\n"
            f"URL: {p['url']}\n"
            f"Likes: {p['likes']} | Comments: {p['comments']} | Type: {p['post_type']}\n"
            f"Caption: {p['caption'][:400]}\n"
            f"...\n"
        )

    prompt += "\n\nDATOS DE TIKTOK:\n"
    for idx, p in enumerate(tt_posts):
        prompt += (
            f"\n--- TT POST {idx+1} ---\n"
            f"Username: {p['username']}\n"
            f"URL: {p['url']}\n"
            f"Likes: {p['likes']}\n"
            f"Keywords: {p['suggested_keywords']}\n"
            f"Music: {p['music']}\n"
            f"Caption: {p['caption'][:400]}\n"
            f"...\n"
        )

    print("[*] Sending data to local Qwen 3.6 model. Streaming response...\n")
    print("-" * 50)
    result = ""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": MODEL_NAME, "prompt": prompt, "stream": True},
            stream=True,
            timeout=None,
        )
        response.raise_for_status()

        # Read the stream chunk by chunk
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line)
                word = chunk.get("response", "")
                print(word, end="", flush=True)
                result += word

        print("\n" + "-" * 50)

        # Clean the output: strip out Qwen's <think>...</think> block
        result = re.sub(r"<think>.*?</think>\n*", "", result, flags=re.DOTALL).strip()

    except Exception as e:
        print(f"\nError connecting to Ollama: {e}")
        sys.exit(1)

    out_dir = os.path.join(
        os.path.dirname(__file__), "..", "marketing-path", "active-campaigns"
    )
    os.makedirs(out_dir, exist_ok=True)
    file_name = (
        f"engagement-list-{datetime.datetime.now().strftime('%b%d').lower()}-test.md"
    )
    file_path = os.path.join(out_dir, file_name)

    header = f"""# WildSpotter — Lista de Engagement 5-3-1 ({today_str})

> NO sigas a nadie. Solo comenta. Adapta cada comentario con un detalle del video 🎯
> Tiempo: ~15 min. Tono: cercano, con emojis, como si hablaras con un colega vanlifer.

---

"""
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(header + result)

    print(f"[+] Success! Engagement list saved to: {file_path}")


if __name__ == "__main__":
    main()
