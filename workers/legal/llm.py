"""LLM abstraction layer for legal document classification.

Supports two backends:
  - ollama: Local Qwen model (for dev / bootstrap)
  - haiku: Claude Haiku API (for production)

Usage:
    from legal.llm import LegalLLM
    llm = LegalLLM(backend="ollama")
    result = llm.classify(title, text)
"""

import json
import logging
import os

from utils import setup_logging

logger = setup_logging("legal-llm")

CLASSIFICATION_PROMPT = """You are a legal document classifier for a Spanish vanlife/camping app.

Analyze the following legal document and determine:
1. Is it relevant to vanlife, motorhome parking, camping, or outdoor overnight stays?
2. What type of restriction does it describe?
3. What municipality/province/CCAA does it affect?
4. How confident are you? (0.0 to 1.0)

Restriction types:
- parking_ban: Prohibits or restricts vehicle parking
- overnight_ban: Prohibits overnight stays
- camping_ban: Prohibits camping or wild camping
- fire_ban: Fire risk restriction
- access_restriction: Restricts vehicle access
- seasonal_closure: Seasonal area closure
- tourism_decree: Tourism regulation
- other: Other relevant restriction

Reply ONLY with valid JSON:
{
  "relevant": true/false,
  "restriction_type": "type",
  "municipality": "name or null",
  "province": "name or null",
  "ccaa": "name or null",
  "confidence": 0.0-1.0,
  "summary": "one sentence summary"
}

DOCUMENT TITLE: %s

DOCUMENT TEXT:
%s"""


class LegalLLM:
    def __init__(self, backend: str | None = None) -> None:
        self.backend = backend or os.environ.get("LEGAL_LLM_BACKEND", "ollama")

    def classify(self, title: str, text: str) -> dict:
        truncated = text[:3000]
        prompt = CLASSIFICATION_PROMPT % (title, truncated)

        try:
            raw = self._call(prompt)
            return self._parse_response(raw)
        except Exception as e:
            logger.error("LLM classification failed: %s", e)
            return {
                "relevant": False,
                "confidence": 0.0,
                "error": str(e),
            }

    def _call(self, prompt: str) -> str:
        if self.backend == "ollama":
            return self._call_ollama(prompt)
        elif self.backend == "haiku":
            return self._call_haiku(prompt)
        else:
            raise ValueError(f"Unknown LLM backend: {self.backend}")

    def _call_ollama(self, prompt: str) -> str:
        import requests

        ollama_url = os.environ.get("OLLAMA_URL", "http://host.docker.internal:11434")
        # Default to gemma4 (8B, faster) for classification; override via OLLAMA_MODEL env var.
        # Available models on host as of 2026-05-14: gemma4:latest, qwen3.6:27b
        # NOTE: qwen3.6 is a "thinking" model — it burns tokens on <think> tags,
        # leaving empty responses with low num_predict. Use gemma4 for structured JSON.
        model = os.environ.get("OLLAMA_MODEL", "gemma4")

        resp = requests.post(
            f"{ollama_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "think": False,  # Disable thinking mode — both gemma4 and qwen3.6 are
                                 # thinking models that burn tokens on <think> reasoning,
                                 # leaving empty responses for structured JSON tasks.
                "options": {"temperature": 0.1, "num_predict": 512},
            },
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json().get("response", "")

    def _call_haiku(self, prompt: str) -> str:
        import anthropic

        client = anthropic.Anthropic()
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text

    def _parse_response(self, raw: str) -> dict:
        import re

        cleaned = raw.strip()

        # Strip <think>...</think> blocks from thinking models (e.g. Qwen 3.6)
        cleaned = re.sub(r"<think>.*?</think>", "", cleaned, flags=re.DOTALL).strip()

        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0]

        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start >= 0 and end > start:
            cleaned = cleaned[start:end]

        try:
            result = json.loads(cleaned)
            result.setdefault("relevant", False)
            result.setdefault("confidence", 0.0)
            result.setdefault("restriction_type", "other")
            return result
        except json.JSONDecodeError:
            logger.warning("Failed to parse LLM response: %s", raw[:200])
            return {"relevant": False, "confidence": 0.0, "parse_error": True}
