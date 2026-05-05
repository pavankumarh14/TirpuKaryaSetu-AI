# backend/app/routers/proofs.py

import os
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Action, Case, Proof
from app.schemas import Proof as ProofSchema
from app.services.audit import create_audit_log

router = APIRouter()


@router.post("/upload", response_model=ProofSchema)
@router.post("/upload/{case_id}", response_model=ProofSchema)
async def upload_proof(
    case_id: int,
    proof_type: str = Form(...),
    uploaded_by: str = Form(...),
    action_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if action_id is not None:
        action = db.query(Action).filter(Action.id == action_id, Action.case_id == case_id).first()
        if not action:
            raise HTTPException(status_code=404, detail="Action not found for this case")

    os.makedirs(os.path.join(settings.STATIC_DIR, "proofs"), exist_ok=True)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid proof file")

    target_path = Path(settings.STATIC_DIR) / "proofs" / file.filename
    counter = 1

    while target_path.exists():
        stem = Path(file.filename).stem
        suffix = Path(file.filename).suffix
        target_path = Path(settings.STATIC_DIR) / "proofs" / f"{stem}_{counter}{suffix}"
        counter += 1

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    proof = Proof(
        case_id=case_id,
        action_id=action_id,
        file_path=str(target_path),
        document_type=proof_type,
        uploaded_by=uploaded_by,
    )

    db.add(proof)
    db.commit()
    db.refresh(proof)

    create_audit_log(
        db,
        case_id=case_id,
        entity_type="proof",
        entity_id=proof.id,
        event="proof_uploaded",
        actor=uploaded_by,
        after_value={
            "proof_type": proof_type,
            "file_path": str(target_path),
            "action_id": action_id,
        },
    )

    return proof
