"""Legal worker: cross-references spots against environmental and cadastral restrictions.

Queries WMS GetFeatureInfo endpoints for Natura 2000, National Parks,
Coastal Law zones, and Cadastre data. Updates legal_status JSONB and
rejects spots in protected areas.

Usage:
    python legal.py --batch-size 50
"""

import argparse
import json
import time
from typing import Any, Dict, List, Optional, Tuple

import requests

from utils import get_db_connection, setup_logging

logger = setup_logging("legal")

# WMS endpoint configuration
WMS_NATURA2000 = "https://wms.mapama.gob.es/sig/Biodiversidad/RedNatura/wms.aspx"
WMS_NATIONAL_PARKS = "https://wms.mapama.gob.es/sig/Biodiversidad/ENP/wms.aspx"
WMS_COASTAL = "https://wms.mapama.gob.es/sig/Costas/DPMTLinea/wms.aspx"
WMS_CATASTRO = "https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx"

# WMS request parameters
WMS_VERSION = "1.1.1"
WMS_SRS = "EPSG:4326"
WMS_IMAGE_SIZE = 101  # odd number so the point is the center pixel
WMS_BBOX_OFFSET = 0.001  # ~111m around the point

# Rate limit between WMS requests
WMS_DELAY_SECONDS = 1.0


def build_bbox(lat: float, lon: float) -> str:
    """Build a small WMS BBOX string centered on the coordinate."""
    return "{},{},{},{}".format(
        lon - WMS_BBOX_OFFSET,
        lat - WMS_BBOX_OFFSET,
        lon + WMS_BBOX_OFFSET,
        lat + WMS_BBOX_OFFSET,
    )


def build_getfeatureinfo_params(
    layer: str,
    bbox: str,
    info_format: str = "application/json",
) -> Dict[str, str]:
    """Build common WMS GetFeatureInfo query parameters."""
    center = WMS_IMAGE_SIZE // 2
    return {
        "SERVICE": "WMS",
        "VERSION": WMS_VERSION,
        "REQUEST": "GetFeatureInfo",
        "LAYERS": layer,
        "QUERY_LAYERS": layer,
        "STYLES": "",
        "SRS": WMS_SRS,
        "BBOX": bbox,
        "WIDTH": str(WMS_IMAGE_SIZE),
        "HEIGHT": str(WMS_IMAGE_SIZE),
        "X": str(center),
        "Y": str(center),
        "INFO_FORMAT": info_format,
        "FEATURE_COUNT": "1",
    }


def query_wms(
    url: str, params: Dict[str, str], timeout: int = 20
) -> Optional[Dict[str, Any]]:
    """Execute a WMS GetFeatureInfo request and return parsed JSON or None."""
    try:
        resp = requests.get(url, params=params, timeout=timeout)
        resp.raise_for_status()
        content_type = resp.headers.get("Content-Type", "")
        if "json" in content_type or "text" in content_type:
            try:
                return resp.json()
            except (json.JSONDecodeError, ValueError):
                # Some WMS return empty text for "no feature"
                return None
        return None
    except requests.RequestException as exc:
        logger.warning("WMS request failed (%s): %s", url, exc)
        return None


def has_features(result: Optional[Dict[str, Any]]) -> Tuple[bool, Optional[str]]:
    """Check if a WMS GetFeatureInfo result contains features.

    Returns (found, feature_name).
    """
    if result is None:
        return False, None

    # GeoJSON FeatureCollection format
    features = result.get("features", [])
    if features:
        props = features[0].get("properties", {})
        name = (
            props.get("nombre")
            or props.get("NOMBRE")
            or props.get("name")
            or props.get("NAME")
            or props.get("denominacion")
            or "Unknown"
        )
        return True, str(name)

    # Some services return a flat properties dict
    if result.get("type") == "Feature" and result.get("properties"):
        name = result["properties"].get("nombre", "Unknown")
        return True, str(name)

    return False, None


def check_natura2000(lat: float, lon: float) -> Dict[str, Any]:
    """Check if coordinate falls within Red Natura 2000."""
    bbox = build_bbox(lat, lon)
    params = build_getfeatureinfo_params("Red_Natura", bbox)
    result = query_wms(WMS_NATURA2000, params)
    found, zone_name = has_features(result)
    return {"inside": found, "zone_name": zone_name}


def check_national_park(lat: float, lon: float) -> Dict[str, Any]:
    """Check if coordinate falls within a National or Natural Park."""
    bbox = build_bbox(lat, lon)
    params = build_getfeatureinfo_params("ENP", bbox)
    result = query_wms(WMS_NATIONAL_PARKS, params)
    found, park_name = has_features(result)
    return {"inside": found, "park_name": park_name}


def check_coastal_law(lat: float, lon: float) -> Dict[str, Any]:
    """Check if coordinate falls within Ley de Costas zone."""
    bbox = build_bbox(lat, lon)
    params = build_getfeatureinfo_params("Linea_de_Costa", bbox)
    result = query_wms(WMS_COASTAL, params)
    found, _ = has_features(result)

    distance_m: Optional[float] = None
    if result and result.get("features"):
        props = result["features"][0].get("properties", {})
        dist_val = props.get("distancia") or props.get("distance")
        if dist_val is not None:
            try:
                distance_m = float(dist_val)
            except (ValueError, TypeError):
                pass

    return {"inside": found, "distance_m": distance_m}


def check_cadastre(lat: float, lon: float) -> Dict[str, Any]:
    """Check cadastral classification (public vs private land)."""
    bbox = build_bbox(lat, lon)
    params = build_getfeatureinfo_params("Catastro", bbox, info_format="text/plain")
    # Catastro WMS may use different layer names; try common ones
    for layer_name in ["Catastro", "catastro", "CP.CadastralParcel"]:
        params["LAYERS"] = layer_name
        params["QUERY_LAYERS"] = layer_name
        result = query_wms(WMS_CATASTRO, params)
        if result is not None:
            break
        time.sleep(WMS_DELAY_SECONDS)

    classification = "unknown"
    is_private = False

    if result and isinstance(result, dict):
        features = result.get("features", [])
        if features:
            props = features[0].get("properties", {})
            uso = str(
                props.get("uso", props.get("currentUse", props.get("USO", "")))
            ).lower()
            if "forestal" in uso or "agrario" in uso or "monte" in uso:
                classification = "public_forestry"
            elif "residencial" in uso or "industrial" in uso:
                classification = "private"
                is_private = True
            elif "rustico" in uso:
                classification = "rustic"
            else:
                classification = uso if uso else "unknown"

    return {"classification": classification, "private": is_private}


def evaluate_legal_status(lat: float, lon: float) -> Dict[str, Any]:
    """Run all legal checks for a coordinate and build the legal_status object."""
    logger.debug("Checking Natura 2000 for (%.6f, %.6f)", lat, lon)
    natura = check_natura2000(lat, lon)
    time.sleep(WMS_DELAY_SECONDS)

    logger.debug("Checking National Parks for (%.6f, %.6f)", lat, lon)
    park = check_national_park(lat, lon)
    time.sleep(WMS_DELAY_SECONDS)

    logger.debug("Checking Coastal Law for (%.6f, %.6f)", lat, lon)
    coastal = check_coastal_law(lat, lon)
    time.sleep(WMS_DELAY_SECONDS)

    logger.debug("Checking Cadastre for (%.6f, %.6f)", lat, lon)
    cadastre = check_cadastre(lat, lon)

    blocked = natura["inside"] or park["inside"] or coastal["inside"] or cadastre["private"]

    return {
        "natura2000": natura,
        "national_park": park,
        "coastal_law": coastal,
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
                legal_status = evaluate_legal_status(lat, lon)

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
