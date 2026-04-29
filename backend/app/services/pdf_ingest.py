# backend/app/services/pdf_ingest.py

import os
import shutil
from pathlib import Path
from typing import Dict

from fastapi import HTTPException, UploadFile

from app.config import settings
from app.services.ocr_extract import extract_text_from_pdf


def ensure_storage_dirs() -> None:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.STATIC_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.STATIC_DIR, "proofs"), exist_ok=True)


async def save_uploaded_pdf(file: UploadFile) -> str:
    ensure_storage_dirs()

    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid file name")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    target_path = Path(settings.UPLOAD_DIR) / file.filename
    counter = 1

    while target_path.exists():
        stem = Path(file.filename).stem
        suffix = Path(file.filename).suffix
        target_path = Path(settings.UPLOAD_DIR) / f"{stem}_{counter}{suffix}"
        counter += 1

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return str(target_path)


def ingest_pdf(pdf_path: str) -> Dict:
    return extract_text_from_pdf(pdf_path)
