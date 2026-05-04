"""Database models for TirpuKaryaSetu AI"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class CaseStatus(str, enum.Enum):
    PENDING = "pending"
    EXTRACTING = "extracting"
    PENDING_REVIEW = "pending_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    COMPLETED = "completed"


class ActionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    EDITED = "edited"
    REJECTED = "rejected"
    ASSIGNED = "assigned"
    COMPLETED = "completed"


class ReviewAction(str, enum.Enum):
    APPROVE = "approve"
    EDIT = "edit"
    REJECT = "reject"
    ASSIGN = "assign"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, nullable=True)
    court_name = Column(String, nullable=True)
    court_type = Column(String, nullable=True)
    order_date = Column(DateTime, nullable=True)
    judgment_type = Column(String, nullable=True)
    petitioner = Column(String, nullable=True)
    respondent_department = Column(String, nullable=True)
    disposal_status = Column(String, nullable=True)
    language = Column(String, default="en")
    status = Column(Enum(CaseStatus), default=CaseStatus.PENDING)
    source_pdf_path = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=True)
    ocr_text = Column(Text, nullable=True)
    received_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    actions = relationship("Action", back_populates="case", cascade="all, delete-orphan")
    extractions = relationship("Extraction", back_populates="case", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="case", cascade="all, delete-orphan")


class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    action_text = Column(Text, nullable=False)
    # Gap 1: Bilingual Kannada support
    action_text_kn = Column(Text, nullable=True)  # Kannada translation of action
    owner_department = Column(String, nullable=True)
    deadline = Column(DateTime, nullable=True)
    deadline_expression = Column(String, nullable=True)  # raw textual expression e.g. "within 8 weeks"
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM)
    recommendation = Column(Text, nullable=True)
    status = Column(Enum(ActionStatus), default=ActionStatus.PENDING)
    assigned_to = Column(String, nullable=True)
    appeal_window = Column(DateTime, nullable=True)
    appeal_window_days = Column(Integer, nullable=True)  # Gap 6: numerical days for countdown
    appeal_window_expression = Column(String, nullable=True)  # raw textual phrase
    contempt_risk = Column(Boolean, default=False)
    confidence = Column(Float, nullable=False, default=0.0)
    source_evidence = Column(Text, nullable=True)
    source_page = Column(Integer, nullable=True)  # Gap 5: page reference for source
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    case = relationship("Case", back_populates="actions")
    reviews = relationship("Review", back_populates="action", cascade="all, delete-orphan")


class Extraction(Base):
    __tablename__ = "extractions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    field_name = Column(String, nullable=False)
    field_value = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    source_page = Column(Integer, nullable=True)
    source_text_span = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    case = relationship("Case", back_populates="extractions")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    action_id = Column(Integer, ForeignKey("actions.id"), nullable=False)
    reviewer_name = Column(String, nullable=True)
    reviewer_role = Column(String, nullable=True)
    review_action = Column(Enum(ReviewAction), nullable=False)
    edited_fields = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    case = relationship("Case", back_populates="reviews")
    action = relationship("Action", back_populates="reviews")


class Proof(Base):
    __tablename__ = "proofs"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    action_id = Column(Integer, ForeignKey("actions.id"), nullable=True)
    file_path = Column(String, nullable=False)
    document_type = Column(String, nullable=True)
    uploaded_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    entity_type = Column(String, nullable=True)  # e.g. "review", "action", "case"
    entity_id = Column(Integer, nullable=True)
    event = Column(String, nullable=False)  # e.g. "review_approve", "action_completed"
    before_value = Column(Text, nullable=True)
    after_value = Column(Text, nullable=True)
    actor = Column(String, nullable=True)  # reviewer name / officer
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())

    case = relationship("Case", back_populates="audit_logs")
