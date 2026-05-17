"""OCR fallback for scanned PDF documents.

Uses ocrmypdf to handle rotation, deskewing, and Spanish text extraction.
Only processes TOC + keyword-matched pages to minimize processing cost.

Usage:
    from legal.pdf_ocr import ocr_pdf
    text = ocr_pdf("path/to/scanned.pdf")
"""

import logging
import subprocess
import tempfile
from pathlib import Path

from utils import setup_logging

logger = setup_logging("pdf-ocr")


def ocr_pdf(pdf_path: str, max_pages: int = 20) -> str:
    path = Path(pdf_path)
    if not path.exists():
        logger.error("PDF not found: %s", pdf_path)
        return ""

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        out_path = tmp.name

    try:
        cmd = [
            "ocrmypdf",
            "--language", "spa",
            "--rotate-pages",
            "--deskew",
            "--skip-text",
            "--pages", f"1-{max_pages}",
            "--sidecar", out_path + ".txt",
            str(path),
            out_path,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
        )

        if result.returncode not in (0, 6):
            logger.error("ocrmypdf failed (code %d): %s", result.returncode, result.stderr[:500])
            return ""

        sidecar_path = Path(out_path + ".txt")
        if sidecar_path.exists():
            text = sidecar_path.read_text(encoding="utf-8")
            sidecar_path.unlink(missing_ok=True)
            logger.info("OCR extracted %d chars from %s", len(text), path.name)
            return text

        try:
            import pdfplumber
            with pdfplumber.open(out_path) as pdf:
                pages = [p.extract_text() or "" for p in pdf.pages[:max_pages]]
                return "\f".join(pages)
        except ImportError:
            logger.warning("pdfplumber not available for OCR output extraction")
            return ""

    except subprocess.TimeoutExpired:
        logger.error("OCR timed out for %s", path.name)
        return ""
    except FileNotFoundError:
        logger.error("ocrmypdf not installed. Install with: pip install ocrmypdf")
        return ""
    finally:
        Path(out_path).unlink(missing_ok=True)
