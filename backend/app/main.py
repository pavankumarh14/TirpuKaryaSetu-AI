"""TirpuKaryaSetu AI - FastAPI Main Application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routers import cases, actions, review, dashboard
from app.database import engine, Base
from app.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TirpuKaryaSetu AI",
    description="AI-powered system for court judgment to government action workflows",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for proof uploads
os.makedirs("./static/proofs", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(cases.router, prefix="/api/cases", tags=["Cases"])
app.include_router(actions.router, prefix="/api/actions", tags=["Actions"])
app.include_router(review.router, prefix="/api/review", tags=["Review"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "TirpuKaryaSetu AI"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to TirpuKaryaSetu AI",
        "docs": "/api/docs",
        "health": "/api/health",
    }
