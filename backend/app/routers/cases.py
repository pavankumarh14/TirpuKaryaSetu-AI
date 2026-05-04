# backend/app/routers/cases.py

from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Action, Case, CaseStatus, Extraction
from app.schemas import Case as CaseSchema
from app.services.ai_pipeline import run_ai_extraction
from app.services.audit import create_audit_log
from app.services.pdf_ingest import ingest_pdf, save_uploaded_pdf

router = APIRouter()


@router.post("/upload", response_model=CaseSchema)
async def upload_case(file: UploadFile = File(...), db: Session = Depends(get_db)):
    pdf_path = await save_uploaded_pdf(file)
    extracted = ingest_pdf(pdf_path)

    case = Case(
        case_number=file.filename,
        court_name="Pending extraction",
        court_type="Unknown",
        judgment_type="pending",
        petitioner="Pending extraction",
        respondent_department="Pending extraction",
        language="en",
        status=CaseStatus.PENDING,
        source_pdf_path=pdf_path,
        extracted_text=extracted["full_text"],
        ocr_text=extracted["full_text"] if extracted["ocr_used"] else None,
    )

    db.add(case)
    db.commit()
    db.refresh(case)

    create_audit_log(
        db,
        case_id=case.id,
        entity_type="case",
        entity_id=case.id,
        event="case_uploaded",
        actor="system",
        after_value={"source_pdf_path": pdf_path},
    )

    return case


@router.get("", response_model=List[CaseSchema])
def list_cases(db: Session = Depends(get_db)):
    cases = (
        db.query(Case)
        .options(joinedload(Case.extractions), joinedload(Case.actions))
        .order_by(Case.created_at.desc())
        .all()
    )
    return cases


@router.get("/{case_id}", response_model=CaseSchema)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = (
        db.query(Case)
        .options(joinedload(Case.extractions), joinedload(Case.actions))
        .filter(Case.id == case_id)
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("/{case_id}/extract")
def extract_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if not case.extracted_text:
        raise HTTPException(status_code=400, detail="No extracted text available for case")

    case.status = CaseStatus.EXTRACTING
    db.commit()

    result = run_ai_extraction(case.extracted_text)

    metadata = result.get("case_metadata", {})
    case.case_number = metadata.get("case_number") or case.case_number
    case.court_name = metadata.get("court_name") or case.court_name
    case.court_type = metadata.get("court_type") or case.court_type
    case.judgment_type = metadata.get("judgment_type") or case.judgment_type
    case.petitioner = metadata.get("petitioner") or case.petitioner
    case.respondent_department = metadata.get("respondent_department") or case.respondent_department
    case.disposal_status = metadata.get("disposal_status")
    case.language = metadata.get("language") or case.language
    case.status = CaseStatus.PENDING_REVIEW

    existing_extractions = db.query(Extraction).filter(Extraction.case_id == case.id).all()
    for item in existing_extractions:
        db.delete(item)

    existing_actions = db.query(Action).filter(Action.case_id == case.id).all()
    for item in existing_actions:
        db.delete(item)

    db.commit()

    for item in result.get("extractions", []):
        extraction = Extraction(
            case_id=case.id,
            field_name=item.get("field_name"),
            field_value=item.get("field_value"),
            confidence=item.get("confidence", 0.0),
            source_page=item.get("source_page"),
            source_text_span=item.get("source_text_span"),
        )
        db.add(extraction)

    for item in result.get("actions", []):
        action = Action(
            case_id=case.id,
            action_text=item.get("action_text"),
            owner_department=item.get("owner_department"),
            deadline=item.get("deadline"),
            risk_level=item.get("risk_level"),
            recommendation=item.get("recommendation"),
            assigned_to=item.get("assigned_to"),
            appeal_window=item.get("appeal_window"),
            contempt_risk=item.get("contempt_risk", False),
            confidence=item.get("confidence", 0.0),
            source_evidence=item.get("source_evidence"),
        )
        db.add(action)

    db.commit()
    db.refresh(case)

    create_audit_log(
        db,
        case_id=case.id,
        entity_type="case",
        entity_id=case.id,
        event="case_extracted",
        actor="system",
        after_value={
            "actions_created": len(result.get("actions", [])),
            "extractions_created": len(result.get("extractions", [])),
        },
    )

    return {
        "case_id": case.id,
        "status": case.status,
        "metadata": metadata,
        "actions_created": len(result.get("actions", [])),
        "extractions_created": len(result.get("extractions", [])),
    }
