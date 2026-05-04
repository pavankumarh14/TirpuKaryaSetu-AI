# backend/app/routers/dashboard.py
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Action, ActionStatus, Case, CaseStatus, RiskLevel
from app.schemas import DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_cases = db.query(Case).count()
    pending_cases = db.query(Case).filter(
        Case.status.in_(
            [
                CaseStatus.PENDING,
                CaseStatus.EXTRACTING,
                CaseStatus.PENDING_REVIEW,
            ]
        )
    ).count()
    verified_cases = db.query(Case).filter(Case.status == CaseStatus.VERIFIED).count()

    total_actions = db.query(Action).count()
    pending_actions = db.query(Action).filter(Action.status == ActionStatus.PENDING).count()
    high_risk_actions = db.query(Action).filter(
        Action.risk_level.in_([RiskLevel.CRITICAL, RiskLevel.HIGH])
    ).count()
    contempt_risk_count = db.query(Action).filter(Action.contempt_risk == True).count()

    return DashboardStats(
        total_cases=total_cases,
        pending_cases=pending_cases,
        verified_cases=verified_cases,
        total_actions=total_actions,
        pending_actions=pending_actions,
        high_risk_actions=high_risk_actions,
        contempt_risk_count=contempt_risk_count,
    )


@router.get("/workload")
def get_department_workload(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Action.owner_department,
            func.count(Action.id).label("total_actions"),
        )
        .group_by(Action.owner_department)
        .all()
    )
    result = []
    for row in rows:
        department = row[0] or "Unassigned"
        pending_count = (
            db.query(Action)
            .filter(
                Action.owner_department == row[0],
                Action.status.in_(
                    [
                        ActionStatus.PENDING,
                        ActionStatus.EDITED,
                        ActionStatus.ASSIGNED,
                        ActionStatus.APPROVED,
                    ]
                ),
            )
            .count()
        )
        completed_count = (
            db.query(Action)
            .filter(
                Action.owner_department == row[0],
                Action.status == ActionStatus.COMPLETED,
            )
            .count()
        )
        result.append(
            {
                "department": department,
                "total_actions": row[1],
                "pending_actions": pending_count,
                "completed_actions": completed_count,
            }
        )
    return result


@router.get("/urgent")
def get_urgent_actions(days: int = 14, db: Session = Depends(get_db)):
    """
    Returns actions that are urgent — either:
    1. Have a deadline within the next `days` days (original behaviour), OR
    2. Have no deadline but are high/critical risk or have contempt_risk=True
       (catches actions where AI extracted risk but couldn't parse a deadline).
    """
    cutoff = datetime.utcnow() + timedelta(days=days)

    # Actions with explicit deadlines coming up
    deadline_actions = (
        db.query(Action)
        .filter(
            Action.deadline.isnot(None),
            Action.deadline <= cutoff,
            Action.status != ActionStatus.COMPLETED,
        )
        .order_by(Action.deadline.asc())
        .all()
    )

    # Actions with no deadline but flagged high-risk or contempt risk
    risk_actions = (
        db.query(Action)
        .filter(
            Action.deadline.is_(None),
            Action.status != ActionStatus.COMPLETED,
            Action.risk_level.in_([RiskLevel.CRITICAL, RiskLevel.HIGH]),
        )
        .order_by(Action.created_at.asc())
        .all()
    )

    # Merge: deadline actions first, then risk-only actions (deduplicated by id)
    seen_ids = set()
    merged = []
    for action in deadline_actions + risk_actions:
        if action.id not in seen_ids:
            seen_ids.add(action.id)
            merged.append(action)

    return [
        {
            "action_id": action.id,
            "case_id": action.case_id,
            "action_text": action.action_text,
            "owner_department": action.owner_department,
            "deadline": action.deadline,
            "risk_level": action.risk_level.value if action.risk_level else None,
            "contempt_risk": action.contempt_risk,
            "assigned_to": action.assigned_to,
        }
        for action in merged
    ]
