"""Legal worker: cross-references spots against environmental and cadastral restrictions.

Uses local PostGIS tables (Natura 2000, National Parks, Coastal Law) for fast
spatial checks, and Catastro REST API for cadastral classification.

Usage:
    python legal.py --batch-size 50
"""

import argparse
import json
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional, Tuple

import requests
from psycopg2.extensions import connection

from utils import get_db_connection, setup_logging

logger = setup_logging("legal")

CATASTRO_REST_URL = (
    "http://ovc.catastro.meh.es/ovcservweb/"
    "OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR"
)
CATASTRO_NS = "http://www.catastro.meh.es/"

URBAN_KEYWORDS = [
    "calle", "avenida", "plaza", "paseo", "carretera", "urbanizacion",
    "urbano", "edificio", "portal", "bloque",
]


def check_cadastre(lat: float, lon: float) -> Dict[str, Any]:
    """Check cadastral classification using Catastro REST API (Consulta_RCCOOR)."""
    classification = "unknown"
    is_private = False
    ref = ""
    ldt = ""

    try:
        url = (
            f"{CATASTRO_REST_URL}?SRS=EPSG:4326"
            f"&Coordenada_X={lon}&Coordenada_Y={lat}"
        )
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()

        root = ET.fromstring(resp.text)
        ns = {"c": CATASTRO_NS}

        err = root.find(".//c:cuerr", ns)
        if err is not None and err.text and int(err.text) > 0:
            return {"classification": "no_parcel", "private": False, "ref": ""}

        pc1_el = root.find(".//c:pc1", ns)
        pc2_el = root.find(".//c:pc2", ns)
        ldt_el = root.find(".//c:ldt", ns)

        if pc1_el is not None and pc2_el is not None:
            ref = (pc1_el.text or "") + (pc2_el.text or "")
        if ldt_el is not None:
            ldt = (ldt_el.text or "").lower()

        if not ref:
            classification = "no_parcel"
        elif "polígono" in ldt or "parcela" in ldt:
            classification = "rustic"
        elif any(kw in ldt for kw in URBAN_KEYWORDS):
            classification = "urban"
            is_private = True
        else:
            classification = "registered"

    except requests.RequestException as exc:
        logger.warning("Catastro REST request failed for (%.4f,%.4f): %s", lat, lon, exc)
    except ET.ParseError:
        logger.warning("Failed to parse Catastro XML for (%.4f,%.4f)", lat, lon)

    return {"classification": classification, "private": is_private, "ref": ref}


def evaluate_legal_status(conn: connection, lat: float, lon: float) -> Dict[str, Any]:
    """Run all legal checks for a coordinate using PostGIS and Catastro WMS."""
    
    # 1. Local PostGIS Checks (Natura 2000, National Parks, Costas)
    sql = """
    WITH pt_25830 AS (
        SELECT ST_Transform(ST_SetSRID(ST_MakePoint(%s, %s), 4326), 25830) AS g
    ),
    pt_3042 AS (
        SELECT ST_Transform(ST_SetSRID(ST_MakePoint(%s, %s), 4326), 3042) AS g
    )
    SELECT
        -- Natura 2000 (SRID 3042)
        EXISTS(
            SELECT 1 FROM natura2000, pt_3042
            WHERE ST_Intersects(geometry, pt_3042.g)
        ) as in_natura,

        -- National Parks (SRID 25830)
        EXISTS(
            SELECT 1 FROM national_parks, pt_25830
            WHERE ST_Intersects(geom, pt_25830.g)
        ) as in_park,

        -- Costas (SRID 25830): DPMT is a line, use 20m buffer
        (
            (
                EXISTS(SELECT 1 FROM dpmt, pt_25830 WHERE ST_DWithin(geom, pt_25830.g, 20))
                OR EXISTS(SELECT 1 FROM servidumbre_proteccion, pt_25830 WHERE ST_Intersects(geom, pt_25830.g))
                OR EXISTS(SELECT 1 FROM terrenos_incluidos_dpmt, pt_25830 WHERE ST_Intersects(geom, pt_25830.g))
            )
            AND NOT EXISTS(
                SELECT 1 FROM nucleos_excluidos_dpmt, pt_25830 WHERE ST_Intersects(geom, pt_25830.g)
            )
        ) as in_costas
    """

    with conn.cursor() as cur:
        cur.execute(sql, (lon, lat, lon, lat))
        row = cur.fetchone()
        in_natura = row[0]
        in_park = row[1]
        in_costas = row[2]

    # 2. Remote check for Cadastre
    logger.debug("Checking Cadastre for (%.6f, %.6f)", lat, lon)
    cadastre = check_cadastre(lat, lon)

    blocked = in_natura or in_park or in_costas or cadastre["private"]

    return {
        "natura2000": {"inside": in_natura},
        "national_park": {"inside": in_park},
        "coastal_law": {"inside": in_costas},
        "cadastre": cadastre,
        "blocked": blocked,
    }


def process_batch(batch_size: int) -> int:
    """Fetch and process a batch of terrain_done spots. Returns count processed."""
    conn = get_db_connection()
    processed = 0

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, osm_id, ST_Y(geom) AS lat, ST_X(geom) AS lon
                FROM spots
                WHERE status = 'terrain_done'
                ORDER BY created_at
                LIMIT %s
                """,
                (batch_size,),
            )
            rows: List[Tuple[str, int, float, float]] = cur.fetchall()

        if not rows:
            logger.info("No terrain_done spots to process")
            return 0

        logger.info("Processing %d spots for legal checks", len(rows))

        for spot_id, osm_id, lat, lon in rows:
            try:
                legal_status = evaluate_legal_status(conn, lat, lon)

                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE spots
                        SET legal_status = %s,
                            status = 'legal_done',
                            updated_at = NOW()
                        WHERE id = %s
                        """,
                        (json.dumps(legal_status), spot_id),
                    )
                conn.commit()

                if legal_status["blocked"]:
                    reasons = []
                    if legal_status["natura2000"]["inside"]:
                        reasons.append("Natura 2000")
                    if legal_status["national_park"]["inside"]:
                        reasons.append("National Park")
                    if legal_status["coastal_law"]["inside"]:
                        reasons.append("Coastal Law")
                    if legal_status["cadastre"]["private"]:
                        reasons.append("Private land")
                    logger.info(
                        "Legal flagged for spot %s (osm_id=%s): %s",
                        spot_id, osm_id, ", ".join(reasons),
                    )
                else:
                    logger.info(
                        "Legal clear for spot %s (osm_id=%s)",
                        spot_id, osm_id,
                    )

                processed += 1

            except Exception:
                conn.rollback()
                logger.exception(
                    "Error processing spot %s (osm_id=%s)", spot_id, osm_id
                )

    finally:
        conn.close()

    return processed


def main() -> None:
    parser = argparse.ArgumentParser(description="WildSpotter legal worker")
    parser.add_argument(
        "--batch-size", type=int, default=50, help="Spots per batch (default: 50)"
    )
    args = parser.parse_args()

    logger.info("Starting legal worker (batch_size=%d)", args.batch_size)

    total_processed = 0
    while True:
        count = process_batch(args.batch_size)
        if count == 0:
            break
        total_processed += count
        logger.info("Progress: %d spots processed so far", total_processed)

    logger.info("Legal worker finished. Total processed: %d", total_processed)


if __name__ == "__main__":
    main()

