import pytest
from unittest.mock import patch, AsyncMock
from fastapi import status
from app.models.document import ChatSession, ChatMessage

def test_chat_new_session(client, mock_anthropic, mock_vector_store, db_session):
    """Test creating new chat session"""
    # Clean database first
    db_session.query(ChatSession).delete()
    db_session.query(ChatMessage).delete()
    db_session.commit()
    
    with patch('app.services.chat_service.ChatService.process_message') as mock_process:
        mock_process.return_value = {
            "answer": "Test response",
            "sources": [],
            "performance": {"total_time": 1.0, "retrieval_time": 0.3, "generation_time": 0.7},
            "confidence": 0.8,
            "context_used": []
        }
        
        response = client.post(
            "/api/v1/chat/",
            json={"message": "Hello, what can you tell me?"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "session_id" in data
        assert data["answer"] == "Test response"
        assert "performance" in data

def test_chat_existing_session(client, db_session, mock_anthropic, mock_vector_store):
    """Test sending message to existing session"""
    # Clean database first
    db_session.query(ChatSession).delete()
    db_session.query(ChatMessage).delete()
    db_session.commit()
    
    # Create test session
    session = ChatSession(session_id="test-session-123")
    db_session.add(session)
    db_session.commit()
    
    with patch('app.services.chat_service.ChatService.process_message') as mock_process:
        mock_process.return_value = {
            "answer": "Follow-up response",
            "sources": [{"id": "test", "source": "test.pdf", "similarity": 0.9}],
            "performance": {"total_time": 0.8, "retrieval_time": 0.2, "generation_time": 0.6},
            "confidence": 0.9,
            "context_used": ["test context"]
        }
        
        response = client.post(
            "/api/v1/chat/",
            json={
                "message": "Tell me more",
                "session_id": "test-session-123",
                "prompt_style": "analytical"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["session_id"] == "test-session-123"
        assert len(data["sources"]) > 0

def test_chat_invalid_session(client, mock_anthropic, mock_vector_store, db_session):
    """Test using invalid session ID"""
    # Clean database first
    db_session.query(ChatSession).delete()
    db_session.commit()
    
    response = client.post(
        "/api/v1/chat/",
        json={
            "message": "Hello",
            "session_id": "non-existent-session"
        }
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"]

def test_list_sessions_empty(client, db_session):
    """Test listing sessions when none exist"""
    # Clean database first
    db_session.query(ChatSession).delete()
    db_session.commit()
    
    response = client.get("/api/v1/chat/sessions")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_list_sessions_with_data(client, db_session):
    """Test listing sessions with data"""
    # Clean database first
    db_session.query(ChatSession).delete()
    db_session.commit()
    
    session = ChatSession(session_id="test-session")
    db_session.add(session)
    db_session.commit()
    
    response = client.get("/api/v1/chat/sessions")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["session_id"] == "test-session"

def test_get_session_messages(client, db_session):
    """Test getting messages for a session"""
    # Clean database first
    db_session.query(ChatSession).delete()
    db_session.query(ChatMessage).delete()
    db_session.commit()
    
    session = ChatSession(session_id="test-session")
    db_session.add(session)
    db_session.flush()
    
    message = ChatMessage(
        session_id=session.id,
        message_type="user",
        content="Test message"
    )
    db_session.add(message)
    db_session.commit()
    
    response = client.get("/api/v1/chat/sessions/test-session/messages")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["content"] == "Test message"
    assert data[0]["type"] == "user"

def test_delete_session(client, db_session):
    """Test deleting a chat session"""
    # Clean database first
    db_session.query(ChatSession).delete()
    db_session.commit()
    
    session = ChatSession(session_id="to-delete")
    db_session.add(session)
    db_session.commit()
    
    response = client.delete("/api/v1/chat/sessions/to-delete")
    
    assert response.status_code == status.HTTP_200_OK
    assert "deleted successfully" in response.json()["message"]
