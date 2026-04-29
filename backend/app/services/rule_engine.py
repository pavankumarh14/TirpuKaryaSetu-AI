# backend/app/services/rule_engine.py

import re
from datetime import datetime, timedelta
from typing import Dict, Optional

from app.models import RiskLevel


_WEEK_PATTERN = re.compile(r"(\d+)\s+week", re.IGNORECASE)
_DAY_PATTERN = re.compile(r"(\d+)\s+day", re.IGNORECASE)
_MONTH_PATTERN = re.compile(r"(\d+)\s+month", re.IGNORECASE)


def parse_relative_deadline(expression: Optional[str], base_date: Optional[datetime]) -> Optional[datetime]:
    if not expression or not base_date:
        return None

    week_match = _WEEK_PATTERN.search(expression)
    if week_match:
        return base_date + timedelta(weeks=int(week_match.group(1)))

    day_match = _DAY_PATTERN.search(expression)
    if day_match:
        return base_date + timedelta(days=int(day_match.group(1)))

    month_match = _MONTH_PATTERN.search(expression)
    if month_match:
        return base_date + timedelta(days=30 * int(month_match.group(1)))

    return None


def compute_risk_level(deadline: Optional[datetime], contempt_risk: bool = False) -> RiskLevel:
    if contempt_risk:
        return RiskLevel.CRITICAL

    if not deadline:
        return RiskLevel.MEDIUM

    days_left = (deadline - datetime.utcnow()).days
    if days_left <= 7:
        return RiskLevel.CRITICAL
    if days_left <= 21:
        return RiskLevel.HIGH
    if days_left <= 45:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def enrich_action_with_rules(action: Dict, order_date: Optional[datetime]) -> Dict:
    deadline = parse_relative_deadline(action.get("deadline_expression"), order_date)
    appeal_window = parse_relative_deadline(action.get("appeal_window_expression"), order_date)

    contempt_risk = bool(action.get("contempt_risk", False))
    risk_level = compute_risk_level(deadline, contempt_risk)

    action["deadline"] = deadline
    action["appeal_window"] = appeal_window
    action["risk_level"] = risk_level
    action["contempt_risk"] = contempt_risk or risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]

    return action
