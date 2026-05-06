# backend/app/routers/ccms.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import Case as CaseSchema
from app.services.audit import create_audit_log
from app.services.ccms_import import fetch_disposed_cases, import_case_from_ccms

router = APIRouter()


@router.get("/disposed-cases")
def list_disposed_cases():
    """List disposed CCMS/CIS cases ready for judgment import."""
    return fetch_disposed_cases()


@router.post("/import/{ccms_case_id}", response_model=CaseSchema)
def import_disposed_case(ccms_case_id: str, db: Session = Depends(get_db)):
    """Import a disposed CCMS/CIS judgment into the local AI workflow."""
    try:
        case = import_case_from_ccms(ccms_case_id, db)
    except ValueError:
        raise HTTPException(status_code=404, detail="CCMS case not found")

    create_audit_log(
        db,
        case_id=case.id,
        entity_type="case",
        entity_id=case.id,
        event="ccms_case_imported",
        actor="system",
        after_value={
            "ccms_case_id": ccms_case_id,
            "case_number": case.case_number,
            "source_pdf_path": case.source_pdf_path,
        },
    )

    return case
