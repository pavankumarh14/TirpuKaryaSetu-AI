# backend/app/config.py

import os
import json
from typing import Any, List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    APP_NAME: str = "TirpuKaryaSetu AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/tirpukaryasetu"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    EMBEDDING_MODEL: str = "text-embedding-004"
    GEMINI_TIMEOUT_SECONDS: int = 90
    GEMINI_MAX_RETRIES: int = 2

    UPLOAD_DIR: str = "./uploads"
    STATIC_DIR: str = "./static"
    MAX_FILE_SIZE_MB: int = 50

    # Accept JSON list or comma-separated env var; normalized after Settings loads.
    ALLOWED_ORIGINS: Any = None

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    TESSERACT_CMD: str = "/usr/bin/tesseract"
    OCR_LANG: str = "eng+kan"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://tirpukaryasetu.onrender.com",
    "https://tirpukaryasetu-ai.onrender.com",
]


def get_allowed_origins(value: Any = None) -> List[str]:
    """Get CORS origins from environment or use defaults.
    
    Supports JSON lists and comma-separated strings in ALLOWED_ORIGINS.
    """
    origins = value if value is not None else os.getenv("ALLOWED_ORIGINS")

    if origins is None or origins == "":
        return DEFAULT_ALLOWED_ORIGINS

    if isinstance(origins, list):
        return [str(origin).strip() for origin in origins if str(origin).strip()]

    if isinstance(origins, str):
        stripped = origins.strip()
        if stripped.startswith("["):
            try:
                parsed = json.loads(stripped)
                if isinstance(parsed, list):
                    return [str(origin).strip() for origin in parsed if str(origin).strip()]
            except json.JSONDecodeError:
                pass
        return [origin.strip() for origin in stripped.split(",") if origin.strip()]

    return DEFAULT_ALLOWED_ORIGINS


settings = Settings()
settings.ALLOWED_ORIGINS = get_allowed_origins(settings.ALLOWED_ORIGINS)
