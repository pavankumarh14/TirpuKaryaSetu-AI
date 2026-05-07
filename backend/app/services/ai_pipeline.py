# backend/app/services/ai_pipeline.py

import json
import re
import time
from datetime import datetime
from typing import Dict, List, Optional

import google.generativeai as genai

from app.config import settings
from app.prompts.extraction import EXTRACTION_SYSTEM_PROMPT
from app.services.rule_engine import enrich_action_with_rules


def chunk_text(text: str, chunk_size: int = 2500, overlap: int = 250) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = max(end - overlap, end)
    return chunks


def simple_retrieve_relevant_chunks(text: str, top_k: int = 10) -> List[str]:
    chunks = chunk_text(text)
    scored = []

    keywords = [
        "directed",
        "ordered",
        "within",
        "respondent",
        "petitioner",
        "department",
        "compliance",
        "appeal",
        "shall",
    ]

    for chunk in chunks:
        score = sum(chunk.lower().count(keyword) for keyword in keywords)
        scored.append((score, chunk))

    if not chunks:
        return []

    scored.sort(key=lambda x: x[0], reverse=True)
    top_scored = [chunk for score, chunk in scored[:top_k] if chunk.strip()]

    # Coverage chunks ensure retrieval sees content spread across the full judgment.
    coverage_indices = sorted(
        set(
            [
                0,
                max(0, len(chunks) // 4),
                max(0, len(chunks) // 2),
                max(0, (3 * len(chunks)) // 4),
                len(chunks) - 1,
            ]
        )
    )
    coverage_chunks = [chunks[i] for i in coverage_indices if chunks[i].strip()]

    merged: List[str] = []
    for chunk in [*coverage_chunks, *top_scored]:
        if chunk not in merged:
            merged.append(chunk)
    return merged


def _safe_json_loads(raw_text: str) -> Dict:
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```json", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    return json.loads(cleaned)


# Fix: Add bilingual support to fallback extraction
def local_fallback_extract(text: str) -> Dict:
    case_number_match = re.search(r"(W\.?P\.?|Case)\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-\(\)]+)", text, re.IGNORECASE)
    case_number = case_number_match.group(2).strip() if case_number_match else None

    court_match = re.search(r"IN THE (.+?COURT.+)", text, re.IGNORECASE)
    court_name = court_match.group(1).strip() if court_match else None

    directives = []
    sentences = re.split(r"(?<=[.!?])\s+|\n+", text)
    for sentence in sentences:
        lowered = sentence.lower()
        if any(word in lowered for word in ["directed", "shall", "within", "ordered", "compliance", "appeal", "dispose"]):
            cleaned = sentence.strip()
            if len(cleaned) > 18:
                directives.append(cleaned)

    # OCR-friendly fallback: scan line-by-line for directive-like phrases.
    if not directives:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        for line in lines:
            lowered = line.lower()
            if any(
                token in lowered
                for token in [
                    "is directed",
                    "are directed",
                    "shall",
                    "within",
                    "weeks",
                    "days",
                    "respondent",
                    "department",
                    "appeal",
                    "compliance",
                    "disposed",
                ]
            ) and len(line) > 18:
                directives.append(line)

    actions = []
    for sentence in directives[:8]:
        deadline_expression = None
        deadline_match = re.search(r"within\s+[^.,;]+", sentence, re.IGNORECASE)
        if deadline_match:
            deadline_expression = deadline_match.group(0).strip()

        # Fix: Fallback actions now include action_text_kn marker
        # When using local fallback, we mark it as needing translation
        actions.append(
            {
                "action_text": sentence[:300],
                "action_text_kn": None,  # Will be null - frontend will hide when null
                "action_type": "compliance",
                "responsible_authority": None,
                "nature_of_action": "Court direction compliance",
                "owner_department": None,
                "deadline_expression": deadline_expression,
                "risk_level": "medium",
                "recommendation": "Officer should verify and assign this direction for compliance.",
                "appeal_recommendation": "Officer should verify whether appeal is required before compliance deadline.",
                "limitation_period": None,
                "appeal_window_expression": None,
                "contempt_risk": False,
                "confidence": 0.68,
                "source_evidence": sentence,
            }
        )

    if not actions:
        actions.append(
            {
                "action_text": "Officer review required: AI could not confidently extract explicit directions. Please review judgment text and define compliance/appeal actions.",
                "action_text_kn": None,
                "action_type": "review_required",
                "responsible_authority": None,
                "nature_of_action": "Manual officer review",
                "owner_department": None,
                "deadline_expression": None,
                "risk_level": "medium",
                "recommendation": "Manually review the judgment and create action items.",
                "appeal_recommendation": "Assess appeal feasibility based on order date and limitation.",
                "limitation_period": None,
                "appeal_window_expression": None,
                "contempt_risk": False,
                "confidence": 0.5,
                "source_evidence": "Gemini extraction could not complete (timeout/quota/token/model issue). Fallback mode used; manual officer review required.",
            }
        )

    result = {
        "case_metadata": {
            "case_number": case_number,
            "court_name": court_name,
            "court_type": "High Court" if court_name and "high court" in court_name.lower() else None,
            "order_date": datetime.utcnow().isoformat(),
            "judgment_type": "compliance",
            "petitioner": None,
            "respondent_name": None,
            "respondent_department": None,
            "bench_judge": None,
            "disposal_status": "disposed" if "disposed" in text.lower() else None,
            "language": "kn" if any("\u0c80" <= ch <= "\u0cff" for ch in text) else "en",
        },
        "extractions": [],
        "actions": actions,
    }

    for key, value in result["case_metadata"].items():
        if value is not None:
            result["extractions"].append(
                {
                    "field_name": key,
                    "field_value": str(value),
                    "confidence": 0.60,
                    "source_page": 1,
                    "source_text_span": str(value),
                }
            )

    return result


def gemini_extract(text: str) -> Dict:
    if not settings.GEMINI_API_KEY:
        return local_fallback_extract(text)

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)

    relevant_chunks = simple_retrieve_relevant_chunks(text)
    prompt = f"""
{EXTRACTION_SYSTEM_PROMPT}

Judgment text chunks:
{json.dumps(relevant_chunks, ensure_ascii=False)}
"""

    retries = max(1, int(getattr(settings, "GEMINI_MAX_RETRIES", 2)))
    timeout_seconds = max(30, int(getattr(settings, "GEMINI_TIMEOUT_SECONDS", 90)))

    for attempt in range(1, retries + 1):
        try:
            response = model.generate_content(
                prompt,
                request_options={"timeout": timeout_seconds},
            )
            result = _safe_json_loads(response.text)
            break
        except Exception as exc:
            if attempt < retries:
                time.sleep(min(2 * attempt, 4))
            else:
                raise RuntimeError(f"Gemini extraction failed: {str(exc)}") from exc

    # Fix: Validate that all actions have action_text_kn field
    # If Gemini returns actions without action_text_kn, we add it as None
    if "actions" in result and isinstance(result["actions"], list):
        for action in result["actions"]:
            if "action_text_kn" not in action:
                action["action_text_kn"] = None
            action.setdefault("action_type", None)
            action.setdefault("responsible_authority", None)
            action.setdefault("nature_of_action", None)
            action.setdefault("appeal_recommendation", None)
            action.setdefault("limitation_period", None)
    
    return result


def run_ai_extraction(text: str) -> Dict:
    result = gemini_extract(text)

    case_metadata = result.get("case_metadata", {})
    order_date = None

    raw_order_date = case_metadata.get("order_date")
    if raw_order_date:
        try:
            order_date = datetime.fromisoformat(raw_order_date.replace("Z", "+00:00"))
        except Exception:
            order_date = None

    enriched_actions = []
    for action in result.get("actions", []):
        enriched_actions.append(enrich_action_with_rules(action, order_date))

    result["actions"] = enriched_actions
    return result
