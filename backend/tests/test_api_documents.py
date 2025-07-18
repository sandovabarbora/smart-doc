import pytest
import io
from fastapi import status
from app.models.document import Document
from app.core.config import settings

def test_upload_document_success(client, temp_upload_dir, db_session):
    """Test successful document upload"""
    file_content = b"Test document content"
    
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "document_id" in data
    assert data["filename"] == "test.txt"
    assert data["status"] == "processed"

def test_upload_document_invalid_type(client):
    """Test upload with invalid file type"""
    file_content = b"Invalid content"
    
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("test.exe", io.BytesIO(file_content), "application/exe")}
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "File type not supported" in response.json()["detail"]

def test_upload_document_too_large(client):
    """Test upload with file too large"""
    large_content = b"x" * (settings.MAX_FILE_SIZE + 1)
    
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("large.txt", io.BytesIO(large_content), "text/plain")}
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "File too large" in response.json()["detail"]

def test_list_documents_empty(client, db_session):
    """Test listing documents when none exist"""
    # Clean database first
    db_session.query(Document).delete()
    db_session.commit()
    
    response = client.get("/api/v1/documents/")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_list_documents_with_data(client, db_session):
    """Test listing documents with existing data"""
    # Clean database first
    db_session.query(Document).delete()
    db_session.commit()
    
    # Create test document
    doc = Document(
        filename="test_doc.pdf",
        original_filename="test_doc.pdf",
        file_size=1024,
        content_type="application/pdf",
        processed=True
    )
    db_session.add(doc)
    db_session.commit()
    
    response = client.get("/api/v1/documents/")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["filename"] == "test_doc.pdf"
    assert data[0]["processed"] is True

def test_delete_document_success(client, db_session):
    """Test successful document deletion"""
    # Clean database first
    db_session.query(Document).delete()
    db_session.commit()
    
    doc = Document(
        filename="to_delete.pdf",
        original_filename="to_delete.pdf", 
        file_size=512,
        content_type="application/pdf"
    )
    db_session.add(doc)
    db_session.commit()
    doc_id = doc.id
    
    response = client.delete(f"/api/v1/documents/{doc_id}")
    
    assert response.status_code == status.HTTP_200_OK
    assert "deleted successfully" in response.json()["message"]

def test_delete_document_not_found(client):
    """Test deleting non-existent document"""
    response = client.delete("/api/v1/documents/999")
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"]
