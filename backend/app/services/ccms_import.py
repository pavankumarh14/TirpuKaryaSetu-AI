"""Placeholder CCMS/CIS import service.

This module is intentionally mock-backed for the prototype. The public function
shape mirrors what a real CCMS/CIS client would need: list disposed cases, then
import one judgment into the normal TirpuKaryaSetu case workflow.
"""

from typing import Dict, List

from sqlalchemy.orm import Session

from app.models import Case, CaseStatus


MOCK_CCMS_CASES: List[Dict[str, str]] = [
    {
        "ccms_case_id": "CCMS-2026-001",
        "case_number": "WP No. 15186 of 2023",
        "court_name": "High Court of Karnataka",
        "court_type": "High Court",
        "bench_judge": "Hon'ble Justice A. Example",
        "petitioner": "Retired Government Employee",
        "respondent_name": "State of Karnataka",
        "respondent_department": "Finance / Pension Cell",
        "disposal_status": "disposed",
        "judgment_type": "compliance-directed",
        "judgment_pdf_url": "ccms://judgments/WP-15186-2023.pdf",
        "judgment_text": (
            "The respondent department is directed to release pension benefits "
            "to the petitioner within 8 weeks from the date of receipt of this order. "
            "Failure to comply within the stipulated period may expose the department "
            "to further proceedings."
        ),
    },
    {
        "ccms_case_id": "CCMS-2026-002",
        "case_number": "WP No. 2044 of 2024",
        "court_name": "High Court of Karnataka",
        "court_type": "High Court",
        "bench_judge": "Hon'ble Justice B. Example",
        "petitioner": "Terminated Employee",
        "respondent_name": "State of Karnataka",
        "respondent_department": "Education Department",
        "disposal_status": "disposed",
        "judgment_type": "compliance-directed",
        "judgment_pdf_url": "ccms://judgments/WP-2044-2024.pdf",
        "judgment_text": (
            "The respondents shall reinstate the terminated employee to service "
            "within 4 weeks from the date of receipt of this order. Liberty is "
            "reserved to the department to consider appeal in accordance with law."
        ),
    },
]


def fetch_disposed_cases() -> List[Dict[str, str]]:
    """Return disposed cases available for import from CCMS/CIS."""
    return [
        {key: value for key, value in case.items() if key != "judgment_text"}
        for case in MOCK_CCMS_CASES
    ]


def import_case_from_ccms(ccms_case_id: str, db: Session) -> Case:
    """Create a local case record from a CCMS/CIS disposed judgment."""
    case_data = next(
        (case for case in MOCK_CCMS_CASES if case["ccms_case_id"] == ccms_case_id),
        None,
    )
    if case_data is None:
        raise ValueError("CCMS case not found")

    existing = db.query(Case).filter(Case.source_pdf_path == case_data["judgment_pdf_url"]).first()
    if existing:
        return existing

    case = Case(
        case_number=case_data["case_number"],
        court_name=case_data["court_name"],
        court_type=case_data["court_type"],
        bench_judge=case_data["bench_judge"],
        petitioner=case_data["petitioner"],
        respondent_name=case_data["respondent_name"],
        respondent_department=case_data["respondent_department"],
        disposal_status=case_data["disposal_status"],
        judgment_type=case_data["judgment_type"],
        language="en",
        status=CaseStatus.PENDING,
        source_pdf_path=case_data["judgment_pdf_url"],
        extracted_text=case_data["judgment_text"],
    )

    db.add(case)
    db.commit()
    db.refresh(case)
    return case
