# backend/app/routers/dashboard.py
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Action, ActionStatus, AuditLog, Case, CaseStatus, RiskLevel
from app.schemas import Action as ActionSchema
from app.schemas import AuditLogOut, DashboardStats, DepartmentWorkload

router = APIRouter()

TRUSTED_ACTION_STATUSES = [
    ActionStatus.APPROVED,
    ActionStatus.ASSIGNED,
    ActionStatus.COMPLETED,
]


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

    trusted_actions = db.query(Action).filter(Action.status.in_(TRUSTED_ACTION_STATUSES))
    total_actions = trusted_actions.count()
    pending_actions = db.query(Action).filter(Action.status == ActionStatus.PENDING).count()
    high_risk_actions = trusted_actions.filter(
        Action.risk_level.in_([RiskLevel.CRITICAL, RiskLevel.HIGH])
    ).count()
    contempt_risk_count = trusted_actions.filter(Action.contempt_risk == True).count()

    cases_with_approvals = (
        db.query(Case.id)
        .join(Action)
        .filter(Action.status.in_(TRUSTED_ACTION_STATUSES))
        .distinct()
        .count()
    )
    if verified_cases == 0 and cases_with_approvals > 0:
        verified_cases = cases_with_approvals

    return DashboardStats(
        total_cases=total_cases,
        pending_cases=pending_cases,
        verified_cases=verified_cases,
        total_actions=total_actions,
        pending_actions=pending_actions,
        high_risk_actions=high_risk_actions,
        contempt_risk_count=contempt_risk_count,
    )


# Gap 4: Department-wise workload endpoint
@router.get("/workload", response_model=List[DepartmentWorkload])
def get_department_workload(db: Session = Depends(get_db)):
    actions = (
        db.query(Action)
        .filter(
            Action.owner_department != None,
            Action.status.in_(TRUSTED_ACTION_STATUSES),
        )
        .all()
    )
    dept_map = defaultdict(lambda: {"pending": 0, "approved": 0, "completed": 0, "total": 0})
    for action in actions:
        dept = action.owner_department or "Unknown"
        dept_map[dept]["total"] += 1
        if action.status in (ActionStatus.PENDING, ActionStatus.EDITED, ActionStatus.ASSIGNED):
            dept_map[dept]["pending"] += 1
        elif action.status == ActionStatus.APPROVED:
            dept_map[dept]["approved"] += 1
        elif action.status == ActionStatus.COMPLETED:
            dept_map[dept]["completed"] += 1
    return [
        DepartmentWorkload(
            department=dept,
            pending=counts["pending"],
            approved=counts["approved"],
            completed=counts["completed"],
            total=counts["total"],
        )
        for dept, counts in sorted(dept_map.items())
    ]


# Gap 3 & 6: Urgent actions — approaching deadlines + appeal window expiry
@router.get("/urgent")
def get_urgent_actions(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    threshold = now + timedelta(days=14)

    seen_ids = set()
    result = []

    deadline_actions = (
        db.query(Action)
        .filter(
            Action.deadline != None,
            Action.deadline <= threshold,
            Action.deadline >= now,
            Action.status.in_(TRUSTED_ACTION_STATUSES),
        )
        .order_by(Action.deadline.asc())
        .all()
    )
    for a in deadline_actions:
        if a.id not in seen_ids:
            seen_ids.add(a.id)
            result.append(a)

    risk_actions = (
        db.query(Action)
        .filter(
            Action.risk_level.in_([RiskLevel.CRITICAL, RiskLevel.HIGH]),
            Action.status.in_(TRUSTED_ACTION_STATUSES),
        )
        .all()
    )
    for a in risk_actions:
        if a.id not in seen_ids:
            seen_ids.add(a.id)
            result.append(a)

    return result


@router.get("/trusted-actions", response_model=List[ActionSchema])
def get_trusted_actions(db: Session = Depends(get_db)):
    return (
        db.query(Action)
        .filter(Action.status.in_(TRUSTED_ACTION_STATUSES))
        .order_by(Action.updated_at.desc().nullslast(), Action.created_at.desc())
        .all()
    )


# Gap 2: Audit Trail — get audit logs for a case
@router.get("/audit/case/{case_id}", response_model=List[AuditLogOut])
def get_case_audit_log(case_id: int, db: Session = Depends(get_db)):
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.case_id == case_id)
        .order_by(AuditLog.timestamp.desc())
        .all()
    )
    return logs


# Gap 2: Audit Trail — get all audit logs (recent first)
@router.get("/audit", response_model=List[AuditLogOut])
def get_all_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    return logs
