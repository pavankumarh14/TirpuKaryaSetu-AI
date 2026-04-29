# backend/app/prompts/classification.py

CLASSIFICATION_PROMPT = """
Classify the judgment into a practical administrative workflow category.

Return ONLY valid JSON:
{
  "judgment_type": "pension|reinstatement|service_matter|disciplinary|benefits|land|compliance|other",
  "domain_department_hint": "string or null",
  "urgency_hint": "low|medium|high|critical",
  "reason": "short explanation"
}

Rules:
- Base classification only on the judgment text.
- Do not hallucinate departments.
"""
