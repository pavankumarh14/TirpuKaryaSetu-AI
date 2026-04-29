# backend/app/prompts/review.py

REVIEW_SUMMARY_PROMPT = """
You are helping a government officer review an AI-extracted action.

Given:
- case metadata
- extracted action
- evidence span

Return a short JSON summary:
{
  "officer_summary": "2-3 sentence concise summary",
  "verification_points": [
    "point 1",
    "point 2"
  ]
}

Rules:
- Do not change the action.
- Do not invent facts.
- Keep the summary grounded in the evidence.
"""
