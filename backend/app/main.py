# backend/app/main.py

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import actions, cases, ccms, dashboard, proofs, review
from app.schema_compat import ensure_schema_compatibility

# Ensure storage directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.STATIC_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STATIC_DIR, "proofs"), exist_ok=True)

# Create database tables
Base.metadata.create_all(bind=engine)
ensure_schema_compatibility(engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered system for court judgment to verified government action workflows",
    version=settings.APP_VERSION,
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

# Static files for proof uploads
app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")

# Routers
app.include_router(cases.router, prefix="/api/cases", tags=["Cases"])
app.include_router(actions.router, prefix="/api/actions", tags=["Actions"])
app.include_router(review.router, prefix="/api/review", tags=["Review"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(proofs.router, prefix="/api/proofs", tags=["Proofs"])
app.include_router(ccms.router, prefix="/api/ccms", tags=["CCMS/CIS"])


@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/api/root")
async def root():
    """API root endpoint."""
    return {
        "message": "Welcome to TirpuKaryaSetu AI",
        "docs": "/api/docs",
        "health": "/api/health",
    }


FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="frontend-assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        """Serve the React app for single-service deployments."""
        target = FRONTEND_DIST / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        return FileResponse(FRONTEND_DIST / "index.html")
