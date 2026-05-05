# backend/app/schemas.py

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models import ActionStatus, CaseStatus, ReviewAction, RiskLevel


class ExtractionBase(BaseModel):
    field_name: str
    field_value: str
    confidence: float
    source_page: Optional[int] = None
    source_text_span: Optional[str] = None


class ExtractionCreate(ExtractionBase):
    case_id: int


class Extraction(ExtractionBase):
    id: int
    case_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ActionBase(BaseModel):
    action_text: str
    action_text_kn: Optional[str] = None           # Gap 1: Kannada translation
    owner_department: Optional[str] = None
    deadline: Optional[datetime] = None
    deadline_expression: Optional[str] = None      # raw textual deadline phrase
    risk_level: RiskLevel = RiskLevel.MEDIUM
    recommendation: Optional[str] = None
    assigned_to: Optional[str] = None
    appeal_window: Optional[datetime] = None
    appeal_window_days: Optional[int] = None       # Gap 6: numerical countdown days
    appeal_window_expression: Optional[str] = None # raw textual appeal phrase
    contempt_risk: bool = False
    confidence: float
    source_evidence: str
    source_page: Optional[int] = None             # Gap 5: page reference


class ActionCreate(ActionBase):
    case_id: int


class Action(ActionBase):
    id: int
    case_id: int
    status: ActionStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewBase(BaseModel):
    reviewer_name: Optional[str] = None
    reviewer_role: Optional[str] = None
    review_action: ReviewAction
    edited_fields: Optional[str] = None
    notes: Optional[str] = None


class ReviewCreate(ReviewBase):
    pass


class Review(ReviewBase):
    id: int
    case_id: int
    action_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProofBase(BaseModel):
    file_path: str
    document_type: Optional[str] = None
    uploaded_by: Optional[str] = None


class Proof(ProofBase):
    id: int
    case_id: int
    action_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Gap 2: Audit Trail schema
class AuditLogOut(BaseModel):
    id: int
    case_id: Optional[int] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    event: str
    before_value: Optional[str] = None
    after_value: Optional[str] = None
    actor: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class CaseBase(BaseModel):
    case_number: Optional[str] = None
    court_name: Optional[str] = None
    court_type: Optional[str] = None
    order_date: Optional[datetime] = None
    judgment_type: Optional[str] = None
    petitioner: Optional[str] = None
    respondent_department: Optional[str] = None
    disposal_status: Optional[str] = None
    language: Optional[str] = "en"
    status: Optional[CaseStatus] = CaseStatus.PENDING
    source_pdf_path: Optional[str] = None


class CaseCreate(CaseBase):
    pass


class Case(CaseBase):
    id: int
    actions: List[Action] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_cases: int
    pending_cases: int
    verified_cases: int
    total_actions: int
    pending_actions: int
    high_risk_actions: int
    contempt_risk_count: int


# Gap 4: Department workload schema
class DepartmentWorkload(BaseModel):
    department: str
    pending: int
    approved: int
    completed: int
    total: int
