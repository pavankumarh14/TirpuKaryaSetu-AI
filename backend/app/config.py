# backend/app/config.py

from typing import List

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

    UPLOAD_DIR: str = "./uploads"
    STATIC_DIR: str = "./static"
    MAX_FILE_SIZE_MB: int = 50

    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "https://tirpukaryasetu.onrender.com", "https://tirpukaryasetu-ai.onrender.com"]

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    TESSERACT_CMD: str = "/usr/local/bin/tesseract"
    OCR_LANG: str = "eng+kan"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
