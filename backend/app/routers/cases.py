# backend/app/routers/cases.py

from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Action, Case, CaseStatus, Extraction
from app.schemas import Case as CaseSchema
from app.schemas import CaseListItem as CaseListItemSchema
from app.services.ai_pipeline import run_ai_extraction
from app.services.audit import create_audit_log
from app.services.pdf_ingest import ingest_pdf, save_uploaded_pdf

router = APIRouter()


def _normalize_risk_level(value):
    if value is None:
        return "medium"
    normalized = str(value).strip().lower()
    mapping = {
        "low": "low",
        "medium": "medium",
        "med": "medium",
        "moderate": "medium",
        "high": "high",
        "critical": "critical",
    }
    return mapping.get(normalized, "medium")


def _normalize_confidence(value):
    try:
        parsed = float(value)
        if parsed < 0:
            return 0.0
        if parsed > 1:
            return 1.0
        return parsed
    except Exception:
        return 0.0


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
    return case


@router.get("", response_model=List[CaseListItemSchema])
@router.get("/", response_model=List[CaseListItemSchema])
def list_cases(db: Session = Depends(get_db)):
    cases = db.query(Case).order_by(Case.id.asc()).all()
    return cases


@router.get("/{case_id}", response_model=CaseSchema)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).options(joinedload(Case.actions)).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.delete("/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    """Delete a case and all its associated data (cascade delete)."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Capture case data before deletion for audit log
    case_number = case.case_number
    case_status = case.status.value if case.status else None
    
    # SQLAlchemy cascade will handle related actions, extractions, reviews, audit_logs
    db.delete(case)
    db.commit()
    
    create_audit_log(
        db,
        case_id=None,
        entity_type="case",
        entity_id=case_id,
        event="case_deleted",
        actor="user",
        before_value={"case_number": case_number, "status": case_status},
    )
    
    return {"status": "success", "message": f"Case #{case_id} deleted successfully"}


@router.post("/{case_id}/extract")
def extract_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if not case.extracted_text:
        raise HTTPException(status_code=400, detail="No extracted text found for this case")

    case.status = CaseStatus.EXTRACTING
    db.commit()

    try:
        result = run_ai_extraction(case.extracted_text)
    except Exception as e:
        case.status = CaseStatus.PENDING
        db.commit()
        raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")

    # Update case metadata
    meta = result.get("case_metadata", {})
    if meta.get("case_number"):
        case.case_number = meta["case_number"]
    if meta.get("court_name"):
        case.court_name = meta["court_name"]
    if meta.get("court_type"):
        case.court_type = meta["court_type"]
    if meta.get("order_date"):
        try:
            from datetime import datetime
            case.order_date = datetime.fromisoformat(meta["order_date"].replace("Z", "+00:00"))
        except Exception:
            pass
    if meta.get("judgment_type"):
        case.judgment_type = meta["judgment_type"]
    if meta.get("petitioner"):
        case.petitioner = meta["petitioner"]
    if meta.get("respondent_name"):
        case.respondent_name = meta["respondent_name"]
    if meta.get("respondent_department"):
        case.respondent_department = meta["respondent_department"]
    if meta.get("bench_judge"):
        case.bench_judge = meta["bench_judge"]
    if meta.get("disposal_status"):
        case.disposal_status = meta["disposal_status"]
    if meta.get("language"):
        case.language = meta["language"]

    # Save extractions
    for field_item in result.get("extractions", []):
        extraction = Extraction(
            case_id=case.id,
            field_name=field_item.get("field_name", ""),
            field_value=field_item.get("field_value", ""),
            confidence=field_item.get("confidence", 0.0),
            source_page=field_item.get("source_page"),
            source_text_span=field_item.get("source_text_span"),
        )
        db.add(extraction)

    # Save actions with all new bilingual + appeal + deadline fields
    for item in result.get("actions", []):
        deadline = item.get("deadline")
        appeal_window = item.get("appeal_window")
        if isinstance(deadline, str):
            try:
                from datetime import datetime
                deadline = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
            except Exception:
                deadline = None
        if isinstance(appeal_window, str):
            try:
                from datetime import datetime
                appeal_window = datetime.fromisoformat(appeal_window.replace("Z", "+00:00"))
            except Exception:
                appeal_window = None

        action = Action(
            case_id=case.id,
            action_text=item.get("action_text") or "Manual review action",
            # Gap 1: Kannada translation
            action_text_kn=item.get("action_text_kn"),
            action_type=item.get("action_type"),
            responsible_authority=item.get("responsible_authority"),
            nature_of_action=item.get("nature_of_action"),
            owner_department=item.get("owner_department"),
            deadline=deadline,
            # Gap 3: store textual deadline expression for display
            deadline_expression=item.get("deadline_expression"),
            risk_level=_normalize_risk_level(item.get("risk_level", "medium")),
            recommendation=item.get("recommendation"),
            appeal_recommendation=item.get("appeal_recommendation"),
            limitation_period=item.get("limitation_period"),
            appeal_window=appeal_window,
            # Gap 6: store appeal window fields
            appeal_window_days=item.get("appeal_window_days"),
            appeal_window_expression=item.get("appeal_window_expression"),
            contempt_risk=item.get("contempt_risk", False),
            confidence=_normalize_confidence(item.get("confidence", 0.0)),
            source_evidence=item.get("source_evidence") or (item.get("action_text") or "No source evidence"),
            # Gap 5: store source page
            source_page=item.get("source_page"),
        )
        db.add(action)

    case.status = CaseStatus.PENDING_REVIEW
    try:
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        case.status = CaseStatus.PENDING
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to save extracted actions: {str(e)}")
    db.refresh(case)

    create_audit_log(
        db,
        case_id=case.id,
        entity_type="case",
        entity_id=case.id,
        event="ai_extraction_completed",
        actor="system",
        after_value={"status": "pending_review", "actions_extracted": len(result.get("actions", []))},
    )

    return {"status": "success", "case_id": case.id, "actions_extracted": len(result.get("actions", []))}
