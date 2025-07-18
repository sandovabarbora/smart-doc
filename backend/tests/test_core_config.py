# backend/tests/test_core_config.py
import pytest
import os
from app.core.config import Settings

def test_settings_defaults():
    """Test default configuration values"""
    settings = Settings()
    
    assert settings.PROJECT_NAME == "Smart Document Analyzer"
    assert settings.VERSION == "1.0.0"
    assert settings.CHUNK_SIZE == 1000
    assert settings.CHUNK_OVERLAP == 200
    assert settings.TOP_K_RETRIEVAL == 5

def test_settings_from_env(monkeypatch):
    """Test settings loaded from environment variables"""
    monkeypatch.setenv("CHUNK_SIZE", "2000")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    
    settings = Settings()
    
    assert settings.CHUNK_SIZE == 2000
    assert settings.ANTHROPIC_API_KEY == "test-key"
    