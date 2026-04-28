"""Pydantic schemas for API request/response validation"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models import CaseStatus, ActionStatus, RiskLevel, ReviewAction


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


class Proof(ProofCreate):
    id: int
    case_id: int
    file_path: str
    verified: bool
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
    pass


class Case(CaseBase):
    id: int
    status: CaseStatus
    order_date: Optional[datetime] = None
    received_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    extractions: List[Extraction] = []
    actions: List[Action] = []

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
