# backend/app/routers/actions.py

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Action, ActionStatus, Case, CaseStatus
from app.schemas import Action as ActionSchema
from app.services.audit import create_audit_log

router = APIRouter()


@router.get("", response_model=List[ActionSchema])
def list_actions(
    case_id: Optional[int] = None,
    status: Optional[ActionStatus] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Action)

    if case_id is not None:
        query = query.filter(Action.case_id == case_id)

    if status is not None:
        query = query.filter(Action.status == status)

    return query.order_by(Action.created_at.desc()).all()


@router.get("/{action_id}", response_model=ActionSchema)
def get_action(action_id: int, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    return action


@router.patch("/{action_id}", response_model=ActionSchema)
def update_action(
    action_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    allowed_fields = {
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
        "status",
        "assigned_to",
        "appeal_window",
        "contempt_risk",
        "confidence",
        "source_evidence",
    }

    before = {}
    for key, value in payload.items():
        if key in allowed_fields:
            before[key] = getattr(action, key)
            setattr(action, key, value)

    db.commit()
    db.refresh(action)

    create_audit_log(
        db,
        case_id=action.case_id,
        entity_type="action",
        entity_id=action.id,
        event="action_updated",
        actor="officer",
        before_value=before,
        after_value=payload,
    )

    return action


@router.post("/{action_id}/complete", response_model=ActionSchema)
def complete_action(action_id: int, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    action.status = ActionStatus.COMPLETED
    db.commit()
    db.refresh(action)

    case = db.query(Case).filter(Case.id == action.case_id).first()
    if case:
        all_done = all(item.status == ActionStatus.COMPLETED for item in case.actions)
        if all_done:
            case.status = CaseStatus.COMPLETED
            db.commit()

    create_audit_log(
        db,
        case_id=action.case_id,
        entity_type="action",
        entity_id=action.id,
        event="action_completed",
        actor="officer",
        after_value={"status": ActionStatus.COMPLETED.value},
    )

    return action
