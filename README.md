# TirpuKaryaSetu AI

> **AI-powered system that transforms court judgment PDFs into verified, accountable government action workflows**

Built for the AI for Bharat Hackathon

## Problem Statement

Indian courts generate thousands of judgments daily, but there's a critical gap between judicial decisions and their actual implementation by government agencies. TirpuKaryaSetu AI bridges this gap by automatically extracting actionable items from court judgments and creating tracked government action workflows.

## Key Features

- **PDF Ingestion**: Upload court judgment PDFs for processing
- **AI-powered Extraction**: Uses Google Gemini/LLM to extract actionable items
- **Rule-based Validation**: Custom rule engine to validate government actions
- **OCR Support**: Handles scanned and image-based PDFs
- **Audit Trail**: Complete audit logging for compliance
- **Dashboard**: Real-time monitoring of all cases and actions
- **Review Queue**: Manual review system for AI-extracted content
- **Classification**: Automatic categorization of government actions
- **Action Tracking**: Monitor implementation status of government actions
- **Multi-department Coordination**: Route actions to relevant government bodies

## Language Support

TirpuKaryaSetu AI is designed with bilingual usability in mind for government workflows.

- English interface support
- Kannada (ಕನ್ನಡ) interface labels
- OCR configuration prepared for English + Kannada text processing
- UI localization structure for multilingual rollout
**AI-powered system that transforms court judgment PDFs into verified, accountable government action workflows with bilingual support in English and Kannada (ಕನ್ನಡ).**

## Project Structure

```
TirpuKaryaSetu-AI/
├── backend/
│   └── app/
│       ├── routers/          # API endpoints
│       │   ├── cases.py
│       │   ├── actions.py
│       │   ├── review.py
│       │   └── dashboard.py
│       ├── services/         # Business logic
│       │   ├── pdf_processor.py
│       │   ├── ocr_processor.py
│       │   ├── ai_pipeline.py
│       │   ├── rule_engine.py
│       │   ├── audit_logger.py
│       │   └── action_tracker.py
│       ├── prompts/          # AI prompts
│       │   ├── classification.py
│       │   ├── extraction.py
│       │   └── review.py
│       ├── __init__.py
│       ├── config.py
│       ├── database.py
│       ├── main.py
│       ├── models.py
│       └── schemas.py
├── frontend/
│   └── src/
│       ├── components/       # React components
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── README.md
└── README_PROJECT.md
```

## Quick Start

### Using Docker Compose (Recommended)

```bash
git clone https://github.com/pavankumarh14/TirpuKaryaSetu-AI.git
cd TirpuKaryaSetu-AI

# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up --build
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Manual Setup

#### Backend
```bash
cd backend
pip install -r app/requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Database
```bash
docker run --name tirpukaryasetu-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tirpukaryasetu -p 5432:5432 postgres:15-alpine
```

## Configuration

Copy the environment file and configure your API keys:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key for AI processing
- `SECRET_KEY` - Application secret key

## API Endpoints

### Cases
- `POST /api/cases/` - Upload and process new judgment PDF
- `GET /api/cases/` - List all cases
- `GET /api/cases/{id}` - Get case details
- `DELETE /api/cases/{id}` - Delete case
- `PUT /api/cases/{id}` - Update case

### Actions
- `GET /api/actions/` - List all actions
- `GET /api/actions?case_id={id}` - List actions for a case
- `POST /api/actions/` - Create new action
- `PUT /api/actions/{id}` - Update action
- `DELETE /api/actions/{id}` - Delete action
- `PUT /api/actions/{id}/status` - Update action status

### Review
- `POST /api/review/submit/` - Submit review
- `POST /api/review/process/` - Process review queue
- `GET /api/review/pending/` - Get pending reviews

### Dashboard
- `GET /api/dashboard/stats/` - Get dashboard statistics
- `GET /api/dashboard/summary/` - Get summary report
- `GET /api/dashboard/charts/` - Get chart data

### Health
- `GET /health` - Health check endpoint

## Technology Stack

### Backend
- **Python 3.11** with FastAPI
- **PostgreSQL** for data storage
- **SQLAlchemy** for ORM
- **Google Gemini API** for AI processing
- **PyMuPDF** for PDF parsing
- **pytesseract** for OCR
- **Pydantic** for data validation
- **PyJWT** for authentication
- **Celery** for async task processing (optional)

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Zustand** for state management
- **React Icons** for icons

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for orchestration
- **PostgreSQL 15** database
- **Nginx** for reverse proxy (production)

## AI Pipeline

1. **Document Ingestion** - PDF upload and text extraction
2. **OCR Processing** - Handle scanned/image PDFs
3. **AI Classification** - Categorize judgment type and actions
4. **Entity Extraction** - Extract government bodies, deadlines, actions
5. **Rule Validation** - Apply government workflow rules
6. **Action Tracking** - Monitor implementation status
7. **Audit Logging** - Track all processing steps

## Project Statistics

- **58+** commits
- **30+** files and directories
- **3000+** lines of code
- **Python 95%**, JavaScript 5%

## Use Cases

1. **Court Case Monitoring** - Track judgment implementation status
2. **Government Accountability** - Ensure departments act on court orders
3. **Citizen Rights Protection** - Monitor compliance with rights-based judgments
4. **Legal Compliance** - Automated tracking of regulatory court decisions
5. **Public Transparency** - Make government action on court orders visible
6. **Multi-department Coordination** - Route actions to relevant government bodies

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is built for the AI for Bharat Hackathon.

## Contact

**Pavan Kumar H** - QA Automation Lead  
**GitHub**: [@pavankumarh14](https://github.com/pavankumarh14)

---

**Built with ❤️ for India's Digital Governance**
