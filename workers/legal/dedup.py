"""Deduplication engine for legal documents.

Prevents duplicate legal documents from multiple sources:
  1. SHA-256 content hash on insert — skip if exists
  2. Fuzzy cross-source: same municipality + overlapping dates + pg_trgm > 0.9 — merge
  3. Authority ranking: BOE > CCAA > BOP — upgrade confidence when higher source confirms

Usage:
    from legal.dedup import LegalDedup
    dedup = LegalDedup()
    dedup.run()
"""

import logging

from utils import get_db_connection, setup_logging

logger = setup_logging("legal-dedup")

AUTHORITY_RANKING = {
    "boe_national": 1,
    "boe_secondary": 1,
}


def _authority_score(source_id: str) -> int:
    if source_id.startswith("boe"):
        return 1
    if source_id.startswith(("decree_", "dog_", "dogc_", "boja_", "boa_",
                              "boc_", "bocyl_", "doe_", "bocm_", "dogv_",
                              "bopa_", "bon_", "bopv_", "bor_", "borm_",
                              "docm_")):
        return 2
    if source_id.startswith("bop_"):
        return 3
    return 4


class LegalDedup:
    def run(self) -> dict:
        results = {
            "exact_dupes_removed": self._exact_hash_dedup(),
            "fuzzy_merged": self._fuzzy_cross_source(),
            "authority_upgraded": self._authority_upgrade(),
        }
        logger.info("Dedup results: %s", results)
        return results

    def _exact_hash_dedup(self) -> int:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    WITH dupes AS (
                        SELECT content_hash, MIN(created_at) AS first_created
                        FROM legal_documents
                        WHERE status = 'active'
                        GROUP BY content_hash
                        HAVING COUNT(*) > 1
                    )
                    UPDATE legal_documents d
                    SET status = 'superseded'
                    FROM dupes
                    WHERE d.content_hash = dupes.content_hash
                      AND d.created_at > dupes.first_created
                      AND d.status = 'active'
                """)
                count = cur.rowcount
            conn.commit()
            if count:
                logger.info("Removed %d exact hash duplicates", count)
            return count
        finally:
            conn.close()

    def _fuzzy_cross_source(self) -> int:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT a.id, b.id, similarity(a.title, b.title) AS sim
                    FROM legal_documents a
                    JOIN legal_documents b ON a.id < b.id
                    WHERE a.status = 'active'
                      AND b.status = 'active'
                      AND a.source_id != b.source_id
                      AND a.affected_municipality IS NOT NULL
                      AND a.affected_municipality = b.affected_municipality
                      AND similarity(a.title, b.title) > 0.9
                      AND (
                        (a.effective_from IS NULL OR b.effective_until IS NULL OR a.effective_from <= b.effective_until)
                        AND
                        (b.effective_from IS NULL OR a.effective_until IS NULL OR b.effective_from <= a.effective_until)
                      )
                    LIMIT 100
                """)
                pairs = cur.fetchall()

            merged = 0
            for a_id, b_id, sim in pairs:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT source_id FROM legal_documents WHERE id = %s",
                        (a_id,),
                    )
                    a_source = cur.fetchone()[0]
                    cur.execute(
                        "SELECT source_id FROM legal_documents WHERE id = %s",
                        (b_id,),
                    )
                    b_source = cur.fetchone()[0]

                    a_auth = _authority_score(a_source)
                    b_auth = _authority_score(b_source)

                    keep_id = a_id if a_auth <= b_auth else b_id
                    remove_id = b_id if keep_id == a_id else a_id

                    cur.execute(
                        "UPDATE legal_documents SET status = 'superseded' WHERE id = %s AND status = 'active'",
                        (remove_id,),
                    )
                    if cur.rowcount:
                        merged += 1

            conn.commit()
            if merged:
                logger.info("Fuzzy-merged %d cross-source duplicates", merged)
            return merged
        finally:
            conn.close()

    def _authority_upgrade(self) -> int:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE legal_documents d
                    SET confidence_tier = 'verified'
                    FROM legal_documents higher
                    WHERE d.status = 'active'
                      AND higher.status = 'active'
                      AND d.confidence_tier != 'verified'
                      AND d.affected_municipality IS NOT NULL
                      AND d.affected_municipality = higher.affected_municipality
                      AND d.restriction_type = higher.restriction_type
                      AND higher.confidence_tier = 'verified'
                      AND higher.source_id LIKE 'boe%%'
                      AND d.id != higher.id
                """)
                count = cur.rowcount
            conn.commit()
            if count:
                logger.info("Upgraded %d documents to verified via authority", count)
            return count
        finally:
            conn.close()
