# TirpuKaryaSetu AI

## From Court Judgments to Verified Government Actions

**AI-powered decision-intelligence system that transforms court judgment PDFs into verified, accountable government action workflows.**

Built for the **AI for Bharat Hackathon** | HackerEarth

---

## Overview

Government departments receive court judgments as long, complex PDF documents where critical directions — what must be done, by when, and by which department — are buried inside dense legal text. TirpuKaryaSetu AI transforms these judgments into structured, explainable, and officer-verified action workflows that fit real government processes.

---

## Problem Statement

- Court judgments arrive as dense PDFs with buried action items
- No structured tracking of deadlines, responsible authorities, or compliance status
- High risk of non-compliance, contempt of court, and delayed justice delivery
- Manual file movement creates inefficiencies and confusion

## Solution

TirpuKaryaSetu AI (ತಿರ್ಪು ಕಾರ್ಯ ಸೇತು: A bridge from court judgment to government action) processes court judgment PDFs using OCR and text extraction, uses RAG to identify orders, directions, deadlines, responsible authorities, and conditions, and converts judgments into structured, verifiable action records with human-in-the-loop verification.

---

## Key Features

- **PDF Ingestion**: Supports scanned and digital PDFs with OCR fallback
- **AI Extraction**: RAG-powered extraction of metadata, directions, deadlines, parties
- **Rule Engine**: Deterministic deadline calculation, appeal window tracking, risk flags
- **Human Verification**: Officer dashboard with Approve/Edit/Reject/Assign actions
- **Verified Dashboard**: Pending actions, countdown timers, contempt-risk flags
- **Audit Trail**: Tamper-evident logging of all actions and reviews
- **Bilingual Support**: English and Kannada (ಕನ್ನಡ) interface labels
- **Proof of Compliance**: Upload and track proof-of-action documents

---

## Project Structure

```
TirpuKaryaSetu-AI/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Configuration settings
│   │   ├── models.py            # Database models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── database.py          # Database connection
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── cases.py         # Case management endpoints
│   │   │   ├── actions.py       # Action management endpoints
│   │   │   ├── review.py        # Officer review endpoints
│   │   │   └── dashboard.py     # Dashboard endpoints
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── pdf_ingest.py    # PDF upload & storage
│   │   │   ├── ocr_extract.py   # OCR text extraction
│   │   │   ├── ai_pipeline.py   # RAG extraction pipeline
│   │   │   ├── rule_engine.py   # Deadline & risk rules
│   │   │   └── audit.py         # Audit logging
│   │   └── prompts/
│   │       ├── __init__.py
│   │       ├── classification.py
│   │       ├── extraction.py
│   │       └── review.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CaseList.jsx
│   │   │   ├── CaseDetail.jsx
│   │   │   ├── ReviewPanel.jsx
│   │   │   ├── ActionCard.jsx
│   │   │   └── ProofUpload.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── locales/
│   │       ├── en.json
│   │       └── kn.json
│   └── package.json
├── data/
│   └── sample_judgments/        # Sample PDFs for testing
├── docs/
│   ├── architecture.md
│   └── api.md
├── .gitignore
└── README.md
```

---

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cases/upload` | Upload a judgment PDF |
| GET | `/api/cases` | List all cases |
| GET | `/api/cases/{id}` | Get case details |
| POST | `/api/cases/{id}/extract` | Trigger AI extraction |
| GET | `/api/actions` | List all actions |
| POST | `/api/actions/{id}/review` | Submit officer review |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/workload` | Department workload |
| GET | `/api/dashboard/urgent` | Urgent actions due soon |
| POST | `/api/proofs/upload` | Upload proof of compliance |

---

## Technology Stack

- **Backend**: Python, FastAPI, PyMuPDF, Tesseract OCR
- **AI/ML**: LangChain, Google Gemini API, RAG pipeline
- **Database**: PostgreSQL
- **Frontend**: React, shadcn/ui components
- **Deployment**: Docker, Docker Compose
- **Infrastructure**: NIC Cloud / Self-hosted ready

---

## Security & Compliance

- Role-based access control (RBAC)
- Encrypted file storage
- Tamper-evident audit logs
- Private AI processing (no data sent to external APIs)
- Supports government-grade deployment (NIC Cloud)

---

## License

MIT License

---

## Team

**pavankumarh14** - AI for Bharat Hackathon 2026

---

*ತಿರ್ಪು ಕಾರ್ಯ ಸೇತು - A bridge from court judgment to government action*
