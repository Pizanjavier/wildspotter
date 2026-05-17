"""Land-cover worker: tags each spot with its CORINE class + SIOSE-AR descriptor.

Reads spots with status = 'amenities_done', does a point-in-polygon lookup against
landcover_corine (and landcover_siose when present), writes landcover_class /
landcover_label / siose_dominant, and sets status = 'landcover_done'.

SIOSE-AR is optional: the worker checks `to_regclass('landcover_siose')` once per
run and degrades gracefully when the table is missing (V3 first iteration ships
CORINE-only — see SPEC_V3 §3.2).

Pipeline stage: amenities_done → landcover_done

Usage:
    python landcover.py --batch-size 200
"""

import argparse
import json
from typing import Any, Dict, Optional, Tuple

from utils import get_db_connection, setup_logging

logger = setup_logging("landcover")

# Spanish labels for CORINE Land Cover 2018 level-3 codes.
# Reference: Copernicus CLC nomenclature (44 classes).
CORINE_LABELS_ES: Dict[str, str] = {
    "111": "Tejido urbano continuo",
    "112": "Tejido urbano discontinuo",
    "121": "Zonas industriales o comerciales",
    "122": "Redes viarias y ferroviarias",
    "123": "Zonas portuarias",
    "124": "Aeropuertos",
    "131": "Zonas de extracción minera",
    "132": "Escombreras y vertederos",
    "133": "Zonas en construcción",
    "141": "Zonas verdes urbanas",
    "142": "Instalaciones deportivas y recreativas",
    "211": "Tierras de labor en secano",
    "212": "Terrenos regados permanentemente",
    "213": "Arrozales",
    "221": "Viñedos",
    "222": "Frutales",
    "223": "Olivares",
    "231": "Prados y praderas",
    "241": "Cultivos anuales y permanentes asociados",
    "242": "Mosaico de cultivos",
    "243": "Terrenos agrícolas con vegetación natural",
    "244": "Sistemas agroforestales",
    "311": "Bosque de frondosas",
    "312": "Bosque de coníferas",
    "313": "Bosque mixto",
    "321": "Pastizales naturales",
    "322": "Landas y matorrales",
    "323": "Vegetación esclerófila",
    "324": "Matorral boscoso de transición",
    "331": "Playas, dunas y arenales",
    "332": "Roquedo",
    "333": "Espacios con vegetación escasa",
    "334": "Zonas quemadas",
    "335": "Glaciares y nieves permanentes",
    "411": "Humedales y zonas pantanosas",
    "412": "Turberas",
    "421": "Marismas",
    "422": "Salinas",
    "423": "Zonas llanas intermareales",
    "511": "Cursos de agua",
    "512": "Láminas de agua",
    "521": "Lagunas costeras",
    "522": "Estuarios",
    "523": "Mares y océanos",
}

CORINE_SQL = """
    SELECT code_18
    FROM landcover_corine
    WHERE ST_Intersects(geom, %s::geometry)
    LIMIT 1
"""

# SIOSE-AR field names will need to be confirmed against the actual import.
# Common candidates: codiige (class code), descripcio (label), or a composite
# descriptor field like CO_DESC. See SPEC_V3 §3.2.
SIOSE_SQL = """
    SELECT codiige, descripcio
    FROM landcover_siose
    WHERE ST_Intersects(geom, %s::geometry)
    LIMIT 1
"""


def _siose_table_exists(conn: Any) -> bool:
    with conn.cursor() as cur:
        cur.execute("SELECT to_regclass('public.landcover_siose') IS NOT NULL")
        return bool(cur.fetchone()[0])


def _lookup_corine(conn: Any, geom_wkb_hex: str) -> Optional[str]:
    with conn.cursor() as cur:
        cur.execute(CORINE_SQL, (geom_wkb_hex,))
        row = cur.fetchone()
    return row[0] if row else None


def _lookup_siose(conn: Any, geom_wkb_hex: str) -> Optional[Dict[str, Any]]:
    with conn.cursor() as cur:
        cur.execute(SIOSE_SQL, (geom_wkb_hex,))
        row = cur.fetchone()
    if not row:
        return None
    code, label = row
    # TODO: when SIOSE-AR is imported, parse the composite descriptor to extract
    # the dominant cover class + percentage (e.g. "100_CHL_60_OLI_40" -> CHL 60%).
    return {"code": code, "label": label, "cover_pct": None}


def process_batch(batch_size: int = 200) -> int:
    """Tag a batch of amenities_done spots with land-cover. Returns count processed."""
    conn = get_db_connection()
    siose_enabled = _siose_table_exists(conn)
    if not siose_enabled:
        logger.info("landcover_siose table not present — running CORINE-only (V3 first iteration)")

    processed = 0
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, osm_id, ST_AsEWKB(geom) AS wkb
                FROM spots
                WHERE status = 'amenities_done'
                ORDER BY created_at
                LIMIT %s
                """,
                (batch_size,),
            )
            rows = cur.fetchall()

        if not rows:
            logger.info("No amenities_done spots ready for land-cover tagging")
            return 0

        logger.info("Land-cover tagging %d spots (siose=%s)", len(rows), siose_enabled)

        for spot_id, osm_id, wkb in rows:
            try:
                geom_hex = bytes(wkb).hex()
                code = _lookup_corine(conn, geom_hex)
                label = CORINE_LABELS_ES.get(code) if code else None
                siose = _lookup_siose(conn, geom_hex) if siose_enabled else None

                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE spots
                        SET landcover_class = %s,
                            landcover_label = %s,
                            siose_dominant = %s,
                            status = 'landcover_done',
                            updated_at = NOW()
                        WHERE id = %s
                        """,
                        (code, label, json.dumps(siose) if siose else None, spot_id),
                    )
                conn.commit()

                if code is None:
                    logger.info(
                        "Spot %s (osm_id=%s) outside CORINE polygons — landcover_class=NULL",
                        spot_id, osm_id,
                    )
                else:
                    logger.info(
                        "Spot %s (osm_id=%s): CORINE=%s (%s)%s",
                        spot_id, osm_id, code, label,
                        f" SIOSE={siose['code']}" if siose else "",
                    )
                processed += 1

            except Exception:
                conn.rollback()
                logger.exception("Error tagging land-cover for spot %s (osm_id=%s)", spot_id, osm_id)

    finally:
        conn.close()

    return processed


def main() -> None:
    parser = argparse.ArgumentParser(description="WildSpotter land-cover worker")
    parser.add_argument("--batch-size", type=int, default=200, help="Spots per batch")
    args = parser.parse_args()

    logger.info("Starting land-cover worker (batch_size=%d)", args.batch_size)

    total = 0
    while True:
        count = process_batch(args.batch_size)
        if count == 0:
            break
        total += count
        logger.info("Progress: %d spots tagged so far", total)

    logger.info("Land-cover worker finished. Total: %d", total)


if __name__ == "__main__":
    main()
