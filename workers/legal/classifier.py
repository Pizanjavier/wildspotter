"""Legal document classifier with keyword gate + LLM dispatch.

Pipeline:
  1. Load keyword patterns from DB (legal_keywords table)
  2. Run keyword gate on unclassified documents (zero AI cost)
  3. For keyword matches: run LLM classification
  4. Route by confidence: verified / automated / unverified / needs_review

Usage:
    from legal.classifier import LegalClassifier
    classifier = LegalClassifier()
    classifier.process_batch(limit=20)
"""

import logging
import re

from legal.llm import LegalLLM
from utils import get_db_connection, setup_logging

logger = setup_logging("legal-classifier")


class LegalClassifier:
    def __init__(self, llm_backend: str | None = None) -> None:
        self.llm = LegalLLM(backend=llm_backend)
        self._keyword_pattern: re.Pattern | None = None

    def _load_keywords(self) -> re.Pattern:
        if self._keyword_pattern:
            return self._keyword_pattern

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT pattern FROM legal_keywords ORDER BY id")
                patterns = [row[0] for row in cur.fetchall()]
        finally:
            conn.close()

        if not patterns:
            patterns = [
                "autocaravana", "pernocta", "acampada", "estacionamiento",
                "camping", "caravana", r"aparcamiento.*nocturno",
                r"vehiculo.*vivienda", r"prohibi.*aparcar",
                "vehiculos de uso habitacional", "acampada libre",
                "acampada difusa", "estacionamiento prolongado",
                "incendios forestales", r"furgoneta.*camper",
                "camper", "motorhome", "zona de acampada",
            ]

        combined = "|".join(patterns)
        self._keyword_pattern = re.compile(combined, re.IGNORECASE)
        return self._keyword_pattern

    def keyword_gate(self, text: str) -> bool:
        pattern = self._load_keywords()
        return bool(pattern.search(text))

    def classify_document(self, doc_id: str, title: str, text: str, source_id: str) -> dict:
        searchable = f"{title} {text or ''}"

        if not self.keyword_gate(searchable):
            self._update_document(
                doc_id,
                restriction_type="other",
                confidence_tier="unverified",
                llm_confidence=0.0,
                needs_review=True,
            )
            return {"action": "filtered", "reason": "no_keyword_match"}

        result = self.llm.classify(title, text or title)

        if not result.get("relevant", False):
            self._update_document(
                doc_id,
                restriction_type="other",
                confidence_tier="unverified",
                llm_confidence=0.0,
                needs_review=True,
            )
            return {"action": "filtered", "reason": "llm_not_relevant", "llm": result}

        confidence = result.get("confidence", 0.0)
        tier = self._route_confidence(confidence, source_id)

        needs_review = confidence < 0.5

        self._update_document(
            doc_id,
            restriction_type=result.get("restriction_type", "other"),
            confidence_tier=tier,
            llm_confidence=confidence,
            needs_review=needs_review,
            municipality=result.get("municipality"),
            province=result.get("province"),
            ccaa=result.get("ccaa"),
        )

        self._expand_keywords(searchable, result)
        self._increment_keyword_hits(searchable)

        return {
            "action": "classified",
            "tier": tier,
            "confidence": confidence,
            "restriction_type": result.get("restriction_type"),
            "needs_review": needs_review,
        }

    def process_batch(self, limit: int = 20) -> int:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, title, raw_text, body, source_id
                    FROM legal_documents
                    WHERE llm_confidence IS NULL
                      AND status = 'active'
                      AND confidence_tier != 'verified'
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (limit,))
                docs = cur.fetchall()
        finally:
            conn.close()

        if not docs:
            return 0

        classified = 0
        for doc_id, title, raw_text, body, source_id in docs:
            text = raw_text or body or ""
            try:
                result = self.classify_document(str(doc_id), title, text, source_id)
                if result["action"] == "classified":
                    classified += 1
                logger.info("Doc %s: %s", doc_id, result)
            except Exception:
                logger.exception("Failed to classify doc %s", doc_id)

        logger.info("Classified %d/%d documents", classified, len(docs))
        return classified

    def _route_confidence(self, confidence: float, source_id: str) -> str:
        if source_id.startswith("boe") or source_id.startswith("decree_"):
            return "verified"
        if confidence > 0.8:
            return "automated"
        if confidence >= 0.5:
            return "unverified"
        return "unverified"

    def _update_document(
        self,
        doc_id: str,
        restriction_type: str,
        confidence_tier: str,
        llm_confidence: float,
        needs_review: bool,
        municipality: str | None = None,
        province: str | None = None,
        ccaa: str | None = None,
    ) -> None:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                updates = [
                    "restriction_type = %s",
                    "confidence_tier = %s",
                    "llm_confidence = %s",
                    "needs_review = %s",
                    "updated_at = NOW()",
                ]
                params: list = [restriction_type, confidence_tier, llm_confidence, needs_review]

                if municipality:
                    updates.append("affected_municipality = COALESCE(affected_municipality, %s)")
                    params.append(municipality)
                if province:
                    updates.append("affected_province = COALESCE(affected_province, %s)")
                    params.append(province)
                if ccaa:
                    updates.append("affected_ccaa = COALESCE(affected_ccaa, %s)")
                    params.append(ccaa)

                params.append(doc_id)
                cur.execute(
                    f"UPDATE legal_documents SET {', '.join(updates)} WHERE id = %s",
                    params,
                )
            conn.commit()
        finally:
            conn.close()

    def _expand_keywords(self, text: str, llm_result: dict) -> None:
        if not llm_result.get("relevant"):
            return

        pattern = self._load_keywords()
        if pattern.search(text):
            return

        words = text.lower().split()
        relevant_terms = [
            w for w in words
            if len(w) > 6 and w not in ("gobierno", "comunidad", "articulo", "decreto")
        ]

        if not relevant_terms:
            return

        candidate = relevant_terms[0]
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO legal_keywords (pattern, category, added_by)
                    VALUES (%s, 'llm_expansion', 'llm_expansion')
                    ON CONFLICT (pattern) DO NOTHING
                    """,
                    (candidate,),
                )
            conn.commit()
            self._keyword_pattern = None
            logger.info("Keyword expansion: added '%s'", candidate)
        finally:
            conn.close()

    def _increment_keyword_hits(self, text: str) -> None:
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id, pattern FROM legal_keywords")
                for kw_id, pattern in cur.fetchall():
                    if re.search(pattern, text, re.IGNORECASE):
                        cur.execute(
                            "UPDATE legal_keywords SET hit_count = hit_count + 1 WHERE id = %s",
                            (kw_id,),
                        )
            conn.commit()
        finally:
            conn.close()
