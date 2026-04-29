# TirpuKaryaSetu AI

> **AI-powered system that transforms court judgment PDFs into verified, accountable government action workflows**

Built for the AI for Bharat Hackathon

##  Problem Statement

Indian courts generate thousands of judgments daily, but there's a critical gap between judicial decisions and their actual implementation by government agencies. TirpuKaryaSetu AI bridges this gap by automatically extracting actionable items from court judgments and creating tracked government action workflows.

## ✨ Key Features

- **PDF Ingestion**: Upload court judgment PDFs for processing
- **AI-powered Extraction**: Uses Google Gemini/LLM to extract actionable items
- **Rule-based Validation**: Custom rule engine to validate government actions
- **OCR Support**: Handles scanned and image-based PDFs
- **Audit Trail**: Complete audit logging for compliance
- **Dashboard**: Real-time monitoring of all cases and actions
- **Review Queue**: Manual review system for AI-extracted content
- **Classification**: Automatic categorization of government actions

## 🏗️ Project Structure

```
TirpuKaryaSetu-AI/
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── prompts/          # AI prompts
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── database.py       # Database configuration
│   │   └── main.py           # FastAPI application
│   └── requirements.txt
├── frontend/                  # React UI (Vite)
├── README_PROJECT.md         # Detailed project documentation
├── Dockerfile                # Backend containerization
├── docker-compose.yml        # Full stack deployment
└── .gitignore
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository:**
```bash
git clone https://github.com/pavankumarh14/TirpuKaryaSetu-AI.git
cd TirpuKaryaSetu-AI
```

2. **Using Docker Compose (Recommended):**
```bash
docker-compose up --build
```

3. **Manual Setup:**
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## 🔧 API Endpoints

### Cases
- `POST /api/cases/` - Upload and process new case
- `GET /api/cases/` - List all cases
- `GET /api/cases/{id}` - Get case details
- `DELETE /api/cases/{id}` - Delete case

### Actions
- `GET /api/actions/` - List all actions
- `POST /api/actions/` - Create action
- `PUT /api/actions/{id}` - Update action
- `DELETE /api/actions/{id}` - Delete action

### Review
- `POST /api/review/submit/` - Submit review
- `POST /api/review/process/` - Process review queue

### Dashboard
- `GET /api/dashboard/stats/` - Get dashboard statistics
- `GET /api/dashboard/summary/` - Get summary report

## 🛠️ Technology Stack

### Backend
- **Python 3.11** with FastAPI
- **PostgreSQL** for data storage
- **SQLAlchemy** for ORM
- **Google Gemini API** for AI processing
- **PyMuPDF** for PDF parsing
- **pytesseract** for OCR
- **Pydantic** for data validation

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for orchestration
- **PostgreSQL** database
- **Nginx** for reverse proxy (production)

## 🤖 AI Pipeline

1. **Document Ingestion** - PDF upload and text extraction
2. **OCR Processing** - Handle scanned/image PDFs
3. **AI Classification** - Categorize judgment type and actions
4. **Entity Extraction** - Extract government bodies, deadlines, actions
5. **Rule Validation** - Apply government workflow rules
6. **Audit Logging** - Track all processing steps

## 📊 Project Statistics

- **29+** commits
- **20+** files and directories
- **3000+** lines of code
- **Python 95%**, JavaScript 5%

## 🎯 Use Cases

1. **Court Case Monitoring**: Track judgment implementation status
2. **Government Accountability**: Ensure departments act on court orders
3. **Citizen Rights Protection**: Monitor compliance with rights-based judgments
4. **Legal Compliance**: Automated tracking of regulatory court decisions
5. **Public Transparency**: Make government action on court orders visible

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is built for the AI for Bharat Hackathon.

## 📧 Contact

**Pavan Kumar H** - QA Automation Lead
**GitHub**: [@pavankumarh14](https://github.com/pavankumarh14)

---

**Built with ❤️ for India's Digital Governance**
