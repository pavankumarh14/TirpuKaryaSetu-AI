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
    owner_department: Optional[str] = None
    deadline: Optional[datetime] = None
    risk_level: RiskLevel = RiskLevel.MEDIUM
    recommendation: Optional[str] = None
    assigned_to: Optional[str] = None
    appeal_window: Optional[datetime] = None
    contempt_risk: bool = False
    confidence: float
    source_evidence: str


class ActionCreate(ActionBase):
    case_id: int


class ActionUpdate(BaseModel):
    action_text: Optional[str] = None
    owner_department: Optional[str] = None
    deadline: Optional[datetime] = None
    risk_level: Optional[RiskLevel] = None
    recommendation: Optional[str] = None
    status: Optional[ActionStatus] = None
    assigned_to: Optional[str] = None
    appeal_window: Optional[datetime] = None
    contempt_risk: Optional[bool] = None
    confidence: Optional[float] = None
    source_evidence: Optional[str] = None


class Action(ActionBase):
    id: int
    case_id: int
    status: ActionStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    reviewer_name: str
    reviewer_role: str
    review_action: ReviewAction
    edited_fields: Optional[str] = None
    notes: Optional[str] = None


class Review(ReviewCreate):
    id: int
    action_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProofCreate(BaseModel):
    proof_type: str
    uploaded_by: str
    action_id: Optional[int] = None


class Proof(ProofCreate):
    id: int
    case_id: int
    file_path: str
    verified: bool
    verified_by: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class CaseBase(BaseModel):
    case_number: str
    court_name: str
    court_type: str
    judgment_type: str
    petitioner: str
    respondent_department: str
    language: str = "en"


class CaseCreate(CaseBase):
    disposal_status: Optional[str] = None
    order_date: Optional[datetime] = None


class Case(CaseBase):
    id: int
    status: CaseStatus
    source_pdf_path: Optional[str] = None
    extracted_text: Optional[str] = None
    ocr_text: Optional[str] = None
    disposal_status: Optional[str] = None
    order_date: Optional[datetime] = None
    received_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    extractions: List[Extraction] = Field(default_factory=list)
    actions: List[Action] = Field(default_factory=list)

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


class DepartmentWorkload(BaseModel):
    department: str
    total_actions: int
    pending_actions: int
    completed_actions: int


class AIExtractResponse(BaseModel):
    case_id: int
    status: str
    metadata: Dict[str, Any]
    actions_created: int
    extractions_created: int
