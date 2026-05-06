# backend/app/config.py

import os
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors_origins() -> List[str]:
    """Parse CORS origins from environment variable or use defaults.
    
    Supports comma-separated string format: "url1,url2,url3"
    """
    default_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://tirpukaryasetu.onrender.com",
        "https://tirpukaryasetu-ai.onrender.com"
    ]
    
    # Check for env var
    env_origins = os.getenv("ALLOWED_ORIGINS")
    if env_origins:
        # Split by comma if multiple, or return single item
        if "," in env_origins:
            return [origin.strip() for origin in env_origins.split(",")]
        else:
            return [env_origins.strip()]
    
    return default_origins


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    APP_NAME: str = "TirpuKaryaSetu AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/tirpukaryasetu"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    EMBEDDING_MODEL: str = "text-embedding-004"

    UPLOAD_DIR: str = "./uploads"
    STATIC_DIR: str = "./static"
    MAX_FILE_SIZE_MB: int = 50

    # CORS origins - parsed from env var or use defaults
    ALLOWED_ORIGINS: List[str] = parse_cors_origins()

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    TESSERACT_CMD: str = "/usr/bin/tesseract"
    OCR_LANG: str = "eng+kan"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
