"""PDF extraction pipeline for BOP (Boletín Oficial Provincial) documents.

4-stage regex funnel that extracts relevant sections from PDF bulletins:
  1. TOC extraction (first 2 pages)
  2. Regex split at ANUNCIO/EDICTO/BANDO/ORDENANZA headers
  3. Keyword gate (zero AI cost) — eliminates ~95-98% of content
  4. Output: matched sections for LLM classification

Usage:
    from legal.pdf_pipeline import PdfPipeline
    pipeline = PdfPipeline()
    results = pipeline.process("path/to/bop.pdf")
"""

import hashlib
import logging
import re
from pathlib import Path

from utils import setup_logging

logger = setup_logging("pdf-pipeline")

SECTION_HEADERS = re.compile(
    r"(ANUNCIO|EDICTO|BANDO|ORDENANZA|DECRETO|RESOLUCIÓN|ACUERDO|DISPOSICIÓN)\s*\.?\s*[-–—]?\s*",
    re.IGNORECASE,
)

KEYWORD_PATTERN = re.compile(
    r"autocaravana|pernocta|acampada|estacionamiento|camping|caravana|"
    r"aparcamiento\s*nocturno|veh[ií]culo\s*vivienda|prohibi.*aparcar|"
    r"veh[ií]culos?\s*de\s*uso\s*habitacional|acampada\s*libre|"
    r"incendios?\s*forestales|medio\s*ambient[e]?|turismo|turisme|"
    r"parque\s*natural|parc\s*natural|espacio\s*natural|"
    r"ordenanza|urbanismo|urbanisme|"
    r"circulaci[oó]n|tr[aá]fico",
    re.IGNORECASE,
)

MIN_CHARS_PER_PAGE = 50


class PdfPipeline:
    def __init__(self) -> None:
        try:
            import pdfplumber
            self._pdfplumber = pdfplumber
        except ImportError:
            self._pdfplumber = None
            logger.warning("pdfplumber not installed — PDF extraction disabled")

    def process(self, pdf_path: str) -> list[dict]:
        if not self._pdfplumber:
            return []

        path = Path(pdf_path)
        if not path.exists():
            logger.error("PDF not found: %s", pdf_path)
            return []

        text = self._extract_text(path)
        if not text:
            text = self._ocr_fallback(path)
            if not text:
                return []

        toc = self._extract_toc(text)
        sections = self._split_sections(text)
        matched = self._keyword_gate(sections)

        logger.info(
            "PDF %s: %d pages, %d sections, %d matched",
            path.name, text.count("\f") + 1, len(sections), len(matched),
        )

        return [
            {
                "title": m["header"],
                "text": m["text"][:5000],
                "content_hash": hashlib.sha256(m["text"].encode()).hexdigest(),
                "source_file": path.name,
                "toc_hint": toc,
            }
            for m in matched
        ]

    def _extract_text(self, path: Path) -> str:
        try:
            with self._pdfplumber.open(str(path)) as pdf:
                pages_text = []
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    pages_text.append(text)

                full_text = "\f".join(pages_text)

                total_chars = sum(len(p) for p in pages_text)
                page_count = len(pages_text)
                if page_count > 0 and total_chars / page_count < MIN_CHARS_PER_PAGE:
                    logger.info("Low text density — likely scanned PDF")
                    return ""

                return full_text
        except Exception as e:
            logger.error("Failed to extract text from %s: %s", path, e)
            return ""

    def _ocr_fallback(self, path: Path) -> str:
        try:
            from legal.pdf_ocr import ocr_pdf
            return ocr_pdf(str(path))
        except ImportError:
            logger.warning("pdf_ocr not available for OCR fallback")
            return ""
        except Exception as e:
            logger.error("OCR failed for %s: %s", path, e)
            return ""

    def _extract_toc(self, text: str) -> str:
        pages = text.split("\f")
        toc_pages = pages[:2]
        toc_text = "\n".join(toc_pages)
        return toc_text[:2000]

    def _split_sections(self, text: str) -> list[dict]:
        splits = list(SECTION_HEADERS.finditer(text))
        if not splits:
            return [{"header": "FULL_DOCUMENT", "text": text}]

        sections = []
        for i, match in enumerate(splits):
            start = match.start()
            end = splits[i + 1].start() if i + 1 < len(splits) else len(text)
            section_text = text[start:end].strip()

            first_line = section_text.split("\n")[0][:200]
            sections.append({
                "header": first_line,
                "text": section_text,
            })

        return sections

    def _keyword_gate(self, sections: list[dict]) -> list[dict]:
        return [s for s in sections if KEYWORD_PATTERN.search(s["text"])]


def process_pdf_url(url: str, session=None) -> list[dict]:
    import tempfile

    import requests

    if session is None:
        session = requests.Session()
        session.headers["User-Agent"] = "WildSpotter-LegalMonitor/1.0"

    try:
        try:
            resp = session.get(url, timeout=60, stream=True)
            resp.raise_for_status()
        except requests.exceptions.SSLError:
            logger.info("SSL error downloading PDF, retrying without verification: %s", url[:80])
            resp = session.get(url, timeout=60, stream=True, verify=False)
            resp.raise_for_status()

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            for chunk in resp.iter_content(8192):
                tmp.write(chunk)
            tmp_path = tmp.name

        pipeline = PdfPipeline()
        results = pipeline.process(tmp_path)

        Path(tmp_path).unlink(missing_ok=True)
        return results

    except requests.RequestException as e:
        logger.error("Failed to download PDF %s: %s", url, e)
        return []
