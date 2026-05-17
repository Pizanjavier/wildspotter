"""AEMET fire risk watcher.

Polls the AEMET open data API for estimated fire risk maps
and creates fire_ban restrictions when risk is Extreme or Very High.

API: https://opendata.aemet.es/dist/index.html
Endpoint: /api/incendios/mapasriesgo/estimado/area/{area}
Requires: AEMET_API_KEY env var

Usage:
    from watchers.aemet_watcher import AemetWatcher
    watcher = AemetWatcher(api_key="...")
    watcher.check_and_store()
"""

import hashlib
import json
import logging
import os
import time
from datetime import date, datetime, timezone

import requests

from legal.source_monitor import store_legal_document
from utils import get_db_connection, setup_logging

logger = setup_logging("aemet-watcher")

SOURCE_ID = "aemet_fire_risk"
AEMET_BASE_URL = "https://opendata.aemet.es/opendata/api"

SPAIN_PROVINCES = {
    "01": "Araba/Álava", "02": "Albacete", "03": "Alicante", "04": "Almería",
    "05": "Ávila", "06": "Badajoz", "07": "Illes Balears", "08": "Barcelona",
    "09": "Burgos", "10": "Cáceres", "11": "Cádiz", "12": "Castellón",
    "13": "Ciudad Real", "14": "Córdoba", "15": "A Coruña", "16": "Cuenca",
    "17": "Girona", "18": "Granada", "19": "Guadalajara", "20": "Gipuzkoa",
    "21": "Huelva", "22": "Huesca", "23": "Jaén", "24": "León",
    "25": "Lleida", "26": "La Rioja", "27": "Lugo", "28": "Madrid",
    "29": "Málaga", "30": "Murcia", "31": "Navarra", "32": "Ourense",
    "33": "Asturias", "34": "Palencia", "35": "Las Palmas", "36": "Pontevedra",
    "37": "Salamanca", "38": "Santa Cruz de Tenerife", "39": "Cantabria",
    "40": "Segovia", "41": "Sevilla", "42": "Soria", "43": "Tarragona",
    "44": "Teruel", "45": "Toledo", "46": "Valencia", "47": "Valladolid",
    "48": "Bizkaia", "49": "Zamora", "50": "Zaragoza",
    "51": "Ceuta", "52": "Melilla",
}

HIGH_RISK_LEVELS = {"extremo", "muy alto", "extreme", "very high"}


class AemetWatcher:
    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or os.environ.get("AEMET_API_KEY", "")
        if not self.api_key:
            logger.warning("AEMET_API_KEY not set — fire risk checks disabled")
        self.session = requests.Session()
        self.session.headers["User-Agent"] = (
            "WildSpotter-LegalMonitor/1.0 (+https://wildspotter.app)"
        )

    def _api_get(self, endpoint: str) -> dict | list | None:
        if not self.api_key:
            return None

        url = f"{AEMET_BASE_URL}{endpoint}"
        headers = {"api_key": self.api_key}

        try:
            resp = self.session.get(url, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            if isinstance(data, dict) and "datos" in data:
                time.sleep(1)
                data_resp = self.session.get(data["datos"], timeout=30)
                data_resp.raise_for_status()
                return data_resp.json()

            return data
        except requests.RequestException as e:
            logger.error("AEMET API error for %s: %s", endpoint, e)
            return None
        except (json.JSONDecodeError, ValueError) as e:
            logger.error("AEMET response parse error: %s - Response may be HTML or empty.", e)
            return None

    def _fetch_fire_risk_area(self, area: str) -> list:
        data = self._api_get(f"/incendios/mapasriesgo/estimado/area/{area}")
        if not data:
            logger.info("No fire risk data available from AEMET for area/%s", area)
            return []
        if not isinstance(data, list):
            return []
        if data and not any(e.get("nivel") for e in data):
            logger.warning(
                "AEMET: 'nivel' field absent — response schema may have changed. Keys found: %s",
                list(data[0].keys()) if data else [],
            )
        return data

    def check_fire_risk(self) -> list[dict]:
        # Fetch peninsula (p) and Canarias (c) separately
        data_peninsula = self._fetch_fire_risk_area("p")
        data_canarias = self._fetch_fire_risk_area("c")
        data = data_peninsula + data_canarias

        if not data:
            logger.info("No fire risk data available from AEMET")
            return []

        high_risk_areas = []

        for entry in data:
                nivel = str(entry.get("nivel", "")).lower().strip()
                if nivel in HIGH_RISK_LEVELS:
                    province_code = str(entry.get("provincia", ""))
                    province_name = SPAIN_PROVINCES.get(
                        province_code, entry.get("nombre_provincia", province_code)
                    )
                    high_risk_areas.append(
                        {
                            "province_code": province_code,
                            "province": province_name,
                            "risk_level": nivel,
                            "date": date.today().isoformat(),
                        }
                    )

        logger.info(
            "AEMET fire risk: %d high/extreme areas out of %d total",
            len(high_risk_areas),
            len(data),
        )
        return high_risk_areas

    def check_and_store(self) -> int:
        areas = self.check_fire_risk()
        if not areas:
            return 0

        conn = get_db_connection()
        stored = 0
        try:
            for area in areas:
                content_hash = hashlib.sha256(
                    f"fire_risk:{area['province_code']}:{area['date']}".encode()
                ).hexdigest()

                doc_id = store_legal_document(
                    conn,
                    source_id=SOURCE_ID,
                    title=f"Riesgo de incendio {area['risk_level']} — {area['province']}",
                    restriction_type="fire_ban",
                    content_hash=content_hash,
                    confidence_tier="automated",
                    effective_from=area["date"],
                    effective_until=area["date"],
                    affected_province=area["province"],
                    seasonal=True,
                    source_url="https://opendata.aemet.es",
                    external_id=f"aemet_fire_{area['province_code']}_{area['date']}",
                )
                if doc_id:
                    stored += 1
                    logger.info(
                        "Stored fire risk alert: %s — %s",
                        area["province"],
                        area["risk_level"],
                    )

            conn.commit()
        finally:
            conn.close()

        logger.info("AEMET check complete: %d areas, %d new alerts", len(areas), stored)
        return stored


def ensure_source_registered() -> None:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO legal_source_state (id, name, source_type, region, url, poll_interval_hours)
                VALUES (%s, %s, 'api', 'national', %s, 6)
                ON CONFLICT (id) DO NOTHING
                """,
                (
                    SOURCE_ID,
                    "AEMET - Riesgo de incendios forestales",
                    f"{AEMET_BASE_URL}/incendios/mapasriesgo/estimado/area/p",
                ),
            )
        conn.commit()
    finally:
        conn.close()
