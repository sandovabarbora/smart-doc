from pydantic_settings import BaseSettings
from typing import Optional, List
import os
from pathlib import Path

# Find .env file in project root
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Document Analyzer"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # SQLite Database
    DATABASE_URL: str = "sqlite:///./smart_doc_analyzer.db"
    
    # LLM Configuration
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_MODEL: str = "claude-3-sonnet-20240229"
    
    # Vector Store
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # RAG Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RETRIEVAL: int = 5
    SIMILARITY_THRESHOLD: float = 0.7
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "txt", "md"]
    UPLOAD_DIR: str = "./uploads"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Development Settings
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = False
    
    # Production Settings (optional)
    ALLOWED_HOSTS: Optional[str] = None
    CORS_ORIGINS: Optional[str] = None
    USE_HTTPS: bool = False
    
    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = 'utf-8'

settings = Settings()

# Debug print
if os.path.exists(ENV_FILE):
    print(f"✅ Found .env at: {ENV_FILE}")
else:
    print(f"❌ .env not found at: {ENV_FILE}")
    print(f"Looking for: {ENV_FILE}")
