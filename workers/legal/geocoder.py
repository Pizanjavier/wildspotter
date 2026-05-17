"""3-pass municipality geocoder for legal documents.

Matches municipality names mentioned in legal documents to the
municipalities table using:
  1. Exact match: normalized name + province context
  2. Fuzzy: pg_trgm similarity > 0.6, same province
  3. LLM disambiguation: only when passes 1+2 fail

Usage:
    from legal.geocoder import LegalGeocoder
    geocoder = LegalGeocoder()
    result = geocoder.match("Villaviciosa de Córdoba", province="Córdoba")
"""

import logging
import os
import re
import unicodedata

from utils import get_db_connection, setup_logging

logger = setup_logging("legal-geocoder")


def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = re.sub(r"[̀-ͯ]", "", text)
    text = re.sub(r"[^a-z0-9 ]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


class LegalGeocoder:
    def __init__(self, llm_backend: str | None = None) -> None:
        self.llm_backend = llm_backend or os.environ.get("LEGAL_LLM_BACKEND", "ollama")

    def match(
        self,
        name: str,
        province: str | None = None,
        ccaa: str | None = None,
    ) -> dict | None:
        result = self._pass_exact(name, province, ccaa)
        if result:
            result["match_method"] = "exact"
            return result

        result = self._pass_fuzzy(name, province, ccaa)
        if result:
            result["match_method"] = "fuzzy"
            return result

        result = self._pass_llm(name, province, ccaa)
        if result:
            result["match_method"] = "llm"
            return result

        logger.warning("No match for municipality: '%s' (province=%s)", name, province)
        return None

    def match_bulk(self, names: list[dict]) -> list[dict | None]:
        return [
            self.match(
                n.get("name", ""),
                province=n.get("province"),
                ccaa=n.get("ccaa"),
            )
            for n in names
        ]

    def _pass_exact(self, name: str, province: str | None, ccaa: str | None) -> dict | None:
        normalized = _normalize(name)
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                conditions = ["nombre_normalized = %s"]
                params: list = [normalized]

                if province:
                    conditions.append("provincia ILIKE %s")
                    params.append(f"%{province}%")
                if ccaa:
                    conditions.append("ccaa = %s")
                    params.append(ccaa)

                where = " AND ".join(conditions)
                cur.execute(
                    f"""
                    SELECT ine_code, nombre, provincia, ccaa,
                           ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid
                    FROM municipalities
                    WHERE {where}
                    LIMIT 1
                    """,
                    params,
                )
                row = cur.fetchone()
                if row:
                    return {
                        "ine_code": row[0],
                        "nombre": row[1],
                        "provincia": row[2],
                        "ccaa": row[3],
                        "centroid": row[4],
                    }
        finally:
            conn.close()
        return None

    def _pass_fuzzy(self, name: str, province: str | None, ccaa: str | None) -> dict | None:
        normalized = _normalize(name)
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                conditions = ["similarity(nombre_normalized, %s) > 0.6"]
                params: list = [normalized]

                if province:
                    conditions.append("provincia ILIKE %s")
                    params.append(f"%{province}%")
                if ccaa:
                    conditions.append("ccaa = %s")
                    params.append(ccaa)

                where = " AND ".join(conditions)
                cur.execute(
                    f"""
                    SELECT ine_code, nombre, provincia, ccaa,
                           similarity(nombre_normalized, %s) AS sim,
                           ST_AsGeoJSON(ST_Centroid(geom))::json AS centroid
                    FROM municipalities
                    WHERE {where}
                    ORDER BY sim DESC
                    LIMIT 1
                    """,
                    [normalized] + params,
                )
                row = cur.fetchone()
                if row:
                    logger.info(
                        "Fuzzy match: '%s' -> '%s' (sim=%.2f)",
                        name, row[1], row[4],
                    )
                    return {
                        "ine_code": row[0],
                        "nombre": row[1],
                        "provincia": row[2],
                        "ccaa": row[3],
                        "similarity": row[4],
                        "centroid": row[5],
                    }
        finally:
            conn.close()
        return None

    def _pass_llm(self, name: str, province: str | None, ccaa: str | None) -> dict | None:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                search = _normalize(name)
                cur.execute(
                    """
                    SELECT ine_code, nombre, provincia, ccaa
                    FROM municipalities
                    WHERE nombre_normalized %% %s
                    ORDER BY similarity(nombre_normalized, %s) DESC
                    LIMIT 5
                    """,
                    (search, search),
                )
                candidates = cur.fetchall()

            if not candidates:
                return None

            prompt = (
                f"Match the municipality name '{name}'"
                + (f" in province '{province}'" if province else "")
                + " to one of these candidates:\n"
            )
            for i, c in enumerate(candidates):
                prompt += f"  {i+1}. {c[1]} ({c[2]}, {c[3]})\n"
            prompt += "Reply with ONLY the number (1-5), or 0 if none match."

            try:
                choice = self._call_llm(prompt)
                idx = int(choice.strip()) - 1
                if 0 <= idx < len(candidates):
                    match = candidates[idx]
                    logger.info("LLM match: '%s' -> '%s'", name, match[1])
                    return {
                        "ine_code": match[0],
                        "nombre": match[1],
                        "provincia": match[2],
                        "ccaa": match[3],
                    }
            except (ValueError, IndexError):
                logger.warning("LLM disambiguation failed for '%s'", name)

        finally:
            conn.close()
        return None

    def _call_llm(self, prompt: str) -> str:
        if self.llm_backend == "ollama":
            import requests
            resp = requests.post(
                "http://localhost:11434/api/generate",
                json={"model": "qwen3:8b", "prompt": prompt, "stream": False},
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json().get("response", "0")

        elif self.llm_backend == "haiku":
            import anthropic
            client = anthropic.Anthropic()
            msg = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=10,
                messages=[{"role": "user", "content": prompt}],
            )
            return msg.content[0].text

        return "0"
