# backend/tests/test_models.py
import pytest
from app.models.document import Document, DocumentChunk, ChatSession, ChatMessage

def test_document_model(db_session):
    """Test Document model creation and relationships"""
    doc = Document(
        filename="test.pdf",
        original_filename="test.pdf", 
        file_size=1024,
        content_type="application/pdf"
    )
    
    db_session.add(doc)
    db_session.commit()
    
    assert doc.id is not None
    assert doc.filename == "test.pdf"
    assert doc.processed is False

def test_document_chunk_model(db_session):
    """Test DocumentChunk model and relationship"""
    doc = Document(
        filename="test.pdf",
        original_filename="test.pdf",
        file_size=1024, 
        content_type="application/pdf"
    )
    db_session.add(doc)
    db_session.flush()
    
    chunk = DocumentChunk(
        document_id=doc.id,
        chunk_index=0,
        content="Test chunk content",
        chunk_metadata={"test": "value"}
    )
    
    db_session.add(chunk)
    db_session.commit()
    
    assert chunk.id is not None
    assert chunk.document_id == doc.id
    assert doc.chunks[0] == chunk

def test_chat_session_model(db_session):
    """Test ChatSession model"""
    session = ChatSession(session_id="test-session-123")
    
    db_session.add(session)
    db_session.commit()
    
    assert session.id is not None
    assert session.session_id == "test-session-123"
    assert session.created_at is not None

def test_chat_message_model(db_session):
    """Test ChatMessage model and relationship"""
    session = ChatSession(session_id="test-session")
    db_session.add(session)
    db_session.flush()
    
    message = ChatMessage(
        session_id=session.id,
        message_type="user",
        content="Test message",
        sources=[{"source": "test.pdf"}]
    )
    
    db_session.add(message)
    db_session.commit()
    
    assert message.id is not None
    assert message.session_id == session.id
    assert session.messages[0] == message
