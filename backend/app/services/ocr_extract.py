# backend/app/services/ocr_extract.py

import io
from typing import Dict, List

import fitz
import pytesseract
from PIL import Image

from app.config import settings


def _looks_low_signal(text: str) -> bool:
    cleaned = (text or "").strip()
    if not cleaned:
        return True
    if len(cleaned) < 80:
        return True
    alpha_chars = sum(ch.isalpha() for ch in cleaned)
    # Mostly symbols/numbers/watermark-style content should still go through OCR.
    if alpha_chars < 30:
        return True
    return False


def extract_text_from_pdf(pdf_path: str) -> Dict:
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

    doc = fitz.open(pdf_path)
    full_text_parts: List[str] = []
    page_map: List[Dict] = []
    ocr_used = False

    for page_index, page in enumerate(doc, start=1):
        text = page.get_text("text").strip()

        if _looks_low_signal(text):
            ocr_used = True
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            image_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image, lang=settings.OCR_LANG).strip()

        page_map.append(
            {
                "page_number": page_index,
                "text": text,
            }
        )
        full_text_parts.append(f"\n\n[PAGE {page_index}]\n{text}")

    return {
        "full_text": "".join(full_text_parts).strip(),
        "page_map": page_map,
        "ocr_used": ocr_used,
        "page_count": len(page_map),
    }
