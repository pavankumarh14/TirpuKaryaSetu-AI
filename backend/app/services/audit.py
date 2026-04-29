# backend/app/services/audit.py

import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models import AuditLog


def create_audit_log(
    db: Session,
    *,
    case_id: Optional[int],
    entity_type: str,
    entity_id: Optional[int],
    event: str,
    actor: Optional[str] = None,
    before_value: Any = None,
    after_value: Any = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    audit = AuditLog(
        case_id=case_id,
        entity_type=entity_type,
        entity_id=entity_id,
        event=event,
        actor=actor,
        before_value=json.dumps(before_value, default=str) if before_value is not None else None,
        after_value=json.dumps(after_value, default=str) if after_value is not None else None,
        ip_address=ip_address,
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit
