# backend/app/routers/review.py

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Action, ActionStatus, Case, CaseStatus, Review, ReviewAction
from app.schemas import Review as ReviewSchema
from app.schemas import ReviewCreate
from app.services.audit import create_audit_log

router = APIRouter()


@router.get("/queue")
def get_review_queue(db: Session = Depends(get_db)):
    actions = (
        db.query(Action)
        .filter(Action.status.in_([ActionStatus.PENDING, ActionStatus.EDITED]))
        .order_by(Action.created_at.asc())
        .all()
    )

    return actions


@router.post("/actions/{action_id}", response_model=ReviewSchema)
def submit_review(
    action_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    review = Review(
        case_id=action.case_id,
        action_id=action.id,
        reviewer_name=payload.reviewer_name,
        reviewer_role=payload.reviewer_role,
        review_action=payload.review_action,
        edited_fields=payload.edited_fields,
        notes=payload.notes,
    )
    db.add(review)

    if payload.review_action == ReviewAction.APPROVE:
        action.status = ActionStatus.APPROVED

    elif payload.review_action == ReviewAction.REJECT:
        action.status = ActionStatus.REJECTED

    elif payload.review_action == ReviewAction.ASSIGN:
        action.status = ActionStatus.ASSIGNED
        if payload.edited_fields:
            try:
                edited = json.loads(payload.edited_fields)
                if "assigned_to" in edited:
                    action.assigned_to = edited["assigned_to"]
            except json.JSONDecodeError:
                pass

    elif payload.review_action == ReviewAction.EDIT:
        action.status = ActionStatus.EDITED
        if payload.edited_fields:
            try:
                edited = json.loads(payload.edited_fields)
                editable_fields = {
                    "action_text",
                    "action_type",
                    "responsible_authority",
                    "nature_of_action",
                    "owner_department",
                    "deadline",
                    "risk_level",
                    "recommendation",
                    "appeal_recommendation",
                    "limitation_period",
                    "assigned_to",
                    "appeal_window",
                    "contempt_risk",
                    "confidence",
                    "source_evidence",
                }
                for key, value in edited.items():
                    if key in editable_fields and hasattr(action, key):
                        setattr(action, key, value)
            except json.JSONDecodeError:
                pass

    db.commit()
    db.refresh(review)

    case = db.query(Case).filter(Case.id == action.case_id).first()
    if case:
        action_statuses = [item.status for item in case.actions]
        if action_statuses and all(
            status in {
                ActionStatus.APPROVED,
                ActionStatus.ASSIGNED,
                ActionStatus.COMPLETED,
            }
            for status in action_statuses
        ):
            case.status = CaseStatus.VERIFIED
        elif any(status == ActionStatus.REJECTED for status in action_statuses):
            case.status = CaseStatus.PENDING_REVIEW
        db.commit()

    create_audit_log(
        db,
        case_id=action.case_id,
        entity_type="review",
        entity_id=review.id,
        event=f"review_{payload.review_action.value}",
        actor=payload.reviewer_name,
        after_value={
            "action_id": action.id,
            "review_action": payload.review_action.value,
            "edited_fields": payload.edited_fields,
            "notes": payload.notes,
        },
    )

    return review
