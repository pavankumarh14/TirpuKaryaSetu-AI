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
    """Court case / judgment record"""
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(100), index=True)
    court_name = Column(String(200))
    court_type = Column(String(50))  # High Court, District Court, etc.
    order_date = Column(DateTime)
    judgment_type = Column(String(100))  # pension, reinstatement, compliance, etc.
    petitioner = Column(String(200))
    respondent_department = Column(String(200))
    disposal_status = Column(String(100))
    language = Column(String(10), default="en")  # en or kn
    status = Column(Enum(CaseStatus), default=CaseStatus.PENDING)
    source_pdf_path = Column(String(500))
    extracted_text = Column(Text)
    ocr_text = Column(Text)
    received_date = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    extractions = relationship("Extraction", back_populates="case", cascade="all, delete-orphan")
    actions = relationship("Action", back_populates="case", cascade="all, delete-orphan")
    proofs = relationship("Proof", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="case", cascade="all, delete-orphan")


class Extraction(Base):
    """Extracted fields from judgment"""
    __tablename__ = "extractions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    field_name = Column(String(100))
    field_value = Column(Text)
    confidence = Column(Float)  # 0.0 to 1.0
    source_page = Column(Integer)
    source_text_span = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    case = relationship("Case", back_populates="extractions")


class Action(Base):
    """Verifiable action derived from judgment"""
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    action_text = Column(Text, nullable=False)
    owner_department = Column(String(200))
    deadline = Column(DateTime)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM)
    recommendation = Column(Text)
    status = Column(Enum(ActionStatus), default=ActionStatus.PENDING)
    assigned_to = Column(String(200))
    appeal_window = Column(DateTime)
    contempt_risk = Column(Boolean, default=False)
    confidence = Column(Float)
    source_evidence = Column(Text)  # Exact judgment text span
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    case = relationship("Case", back_populates="actions")
    reviews = relationship("Review", back_populates="action", cascade="all, delete-orphan")


class Review(Base):
    """Officer review of an action"""
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, ForeignKey("actions.id"), nullable=False)
    reviewer_name = Column(String(200))
    reviewer_role = Column(String(100))
    review_action = Column(Enum(ReviewAction), nullable=False)
    edited_fields = Column(Text)  # JSON string of edited fields
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    action = relationship("Action", back_populates="reviews")


class Proof(Base):
    """Proof of compliance document"""
    __tablename__ = "proofs"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    action_id = Column(Integer, ForeignKey("actions.id"))
    file_path = Column(String(500), nullable=False)
    proof_type = Column(String(100))  # order_copy, compliance_report, etc.
    uploaded_by = Column(String(200))
    verified = Column(Boolean, default=False)
    verified_by = Column(String(200))
    uploaded_at = Column(DateTime, server_default=func.now())

    case = relationship("Case", back_populates="proofs")


class AuditLog(Base):
    """Tamper-evident audit trail"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    entity_type = Column(String(50))  # case, action, review, proof
    entity_id = Column(Integer)
    event = Column(String(100), nullable=False)
    before_value = Column(Text)
    after_value = Column(Text)
    actor = Column(String(200))
    ip_address = Column(String(45))
    timestamp = Column(DateTime, server_default=func.now())

    case = relationship("Case", back_populates="audit_logs")
