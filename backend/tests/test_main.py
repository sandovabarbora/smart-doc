import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_root():
    """Test root endpoint"""
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert "Smart Document Analyzer API" in response.json()["message"]

def test_health_check():
    """Test health check endpoint"""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_cors_headers():
    """Test CORS headers are present"""
    client = TestClient(app)
    response = client.options("/", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET"
    })
    assert response.status_code == 200

def test_api_docs():
    """Test API documentation is accessible"""
    client = TestClient(app)
    response = client.get("/docs")
    assert response.status_code == 200

def test_openapi_schema():
    """Test OpenAPI schema is available"""
    client = TestClient(app)
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "info" in schema
