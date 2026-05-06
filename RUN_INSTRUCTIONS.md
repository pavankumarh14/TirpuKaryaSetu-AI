# 🚀 How to Run TirpuKaryaSetu AI

Complete step-by-step instructions for running the application locally.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Git** installed
- **Python 3.11+** installed
- **Node.js 18+** installed
- **PostgreSQL** installed (or use Docker)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

---

## 🎯 Option 1: Docker Compose (Easiest - Recommended for Judges)

This runs everything with one command:

- PostgreSQL database
- FastAPI backend
- React frontend served by Nginx

### Step 1: Clone the Repository

```bash
git clone https://github.com/pavankumarh14/TirpuKaryaSetu-AI.git
cd TirpuKaryaSetu-AI
```

### Step 2: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Gemini API key
# You need to get a free API key from: https://makersuite.google.com/app/apikey
```

Your `.env` file should look like:
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/tirpukaryasetu
GEMINI_API_KEY=your_actual_gemini_api_key_here
SECRET_KEY=your-secret-key-here
```

### Step 3: Start All Services

```bash
docker-compose up --build
```

This will:
- Start PostgreSQL database
- Start backend API (FastAPI)
- Build and start frontend (React production build served by Nginx)

### Step 4: Access the Application

Wait for all services to start (~2-3 minutes), then open:

| Service | URL |
|---------|-----|
| **Frontend App** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Documentation** | http://localhost:8000/api/docs |

### Step 5: Stop the Application

```bash
# Press Ctrl+C to stop
# Or run:
docker-compose down
```

To also delete the database volume and start fresh:

```bash
docker-compose down -v
```

---

## 💻 Option 2: Manual Setup (More Control)

### Step 1: Start PostgreSQL Database

**Using Docker:**
```bash
docker run --name tirpukaryasetu-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tirpukaryasetu \
  -p 5432:5432 \
  postgres:15-alpine
```

**Or use local PostgreSQL:**
- Create database: `tirpukaryasetu`
- User: `postgres`
- Password: `postgres`

### Step 2: Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tirpukaryasetu
GEMINI_API_KEY=your_actual_gemini_api_key_here
SECRET_KEY=your-secret-key-here
EOF

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000

### Step 3: Set Up Frontend

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## 📁 Option 3: Using Existing Project Files

If you already have the project on your machine:

```bash
# Navigate to project directory
cd /path/to/TirpuKaryaSetu-AI

# If using Docker Compose (Recommended):
docker-compose up --build

# If running manually:
# Terminal 1: Start database
docker run --name tirpukaryasetu-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tirpukaryasetu -p 5432:5432 postgres:15-alpine

# Terminal 2: Start backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 3: Start frontend
cd frontend
npm install
npm run dev
```

---

## 🔑 Getting Your Gemini API Key

1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

---

## ✅ Verification Checklist

Once running, verify these features work:

- [ ] App loads at http://localhost:5173
- [ ] Can upload a PDF court judgment
- [ ] AI extraction works (click "Run AI Extraction")
- [ ] Actions appear in case detail
- [ ] Can switch language (EN / ಕಂ) in header
- [ ] Dashboard shows stats
- [ ] Review queue displays pending actions
- [ ] Can delete a case
- [ ] Audit trail shows history

---

## 🐛 Troubleshooting

### Issue: "Failed to connect to database"

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it:
docker start tirpukaryasetu-db
```

### Issue: "GEMINI_API_KEY not found"

**Solution:**
- Make sure `.env` file exists in `backend/` directory
- Verify `GEMINI_API_KEY` has a valid key
- Restart the backend after updating .env

### Issue: "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
cd backend
pip install -r requirements.txt

cd ../frontend
npm install
```

### Issue: Port already in use

**Solution:**
```bash
# Find and kill process using port 8000 or 5173
# macOS/Linux:
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Or change ports in configuration
```

---

## 📊 Default Demo Data

The app starts empty. To add test data:

1. Go to **Cases** tab
2. Click **Upload Case**
3. Select any PDF court judgment file
4. Click **Upload** and wait for processing
5. Click **Run AI Extraction** to analyze the judgment

Sample Karnataka High Court judgments work best for optimal extraction.

---

## 🌍 Switching Languages

- Click **EN** for English
- Click **ಕಂ** (Kannada) for Kannada interface

Note: The AI extracts actions in English with optional Kannada translation.

---

**Need Help?** 
- Check the API docs at http://localhost:8000/api/docs
- Review logs in terminal for errors
- Ensure all services are running
