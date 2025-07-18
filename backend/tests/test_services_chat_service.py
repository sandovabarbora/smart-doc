import pytest
from unittest.mock import AsyncMock, Mock, patch
from app.services.chat_service import ChatService
from app.models.document import ChatSession, ChatMessage

@pytest.fixture
def chat_service(mock_vector_store):
    with patch('app.services.chat_service.RAGEngine') as mock_rag:
        service = ChatService()
        service.rag_engine = AsyncMock()
        service.rag_engine.query = AsyncMock(return_value=Mock(
            answer="Test response",
            sources=[],
            retrieval_time=0.1,
            generation_time=0.5,
            total_time=0.6,
            confidence_score=0.8,
            context_used=[]
        ))
        return service

@pytest.mark.asyncio
async def test_process_message(chat_service, db_session):
    """Test processing a chat message"""
    session = ChatSession(session_id="test-session")
    db_session.add(session)
    db_session.commit()
    
    result = await chat_service.process_message(
        message="Test message",
        session=session,
        db=db_session
    )
    
    assert result["answer"] == "Test response"
    assert "performance" in result
    assert "confidence" in result

@pytest.mark.asyncio
async def test_process_message_with_history(chat_service, db_session):
    """Test processing message with chat history"""
    session = ChatSession(session_id="test-session")
    db_session.add(session)
    db_session.flush()
    
    # Add previous message
    message = ChatMessage(
        session_id=session.id,
        message_type="user",
        content="Previous message"
    )
    db_session.add(message)
    db_session.commit()
    
    result = await chat_service.process_message(
        message="Follow up message",
        session=session,
        db=db_session
    )
    
    assert result["answer"] == "Test response"

def test_get_chat_history(chat_service, db_session):
    """Test getting chat history"""
    session = ChatSession(session_id="test-session")
    db_session.add(session)
    db_session.flush()
    
    # Add messages
    for i in range(3):
        message = ChatMessage(
            session_id=session.id,
            message_type="user" if i % 2 == 0 else "assistant",
            content=f"Message {i}"
        )
        db_session.add(message)
    
    db_session.commit()
    
    history = chat_service._get_chat_history(session, db_session)
    assert len(history) == 3
    assert all("type" in msg and "content" in msg for msg in history)

@pytest.mark.asyncio
async def test_ensure_documents_indexed(chat_service, db_session):
    """Test ensuring documents are indexed"""
    from app.models.document import Document
    
    doc = Document(
        filename="test.pdf",
        original_filename="test.pdf",
        file_size=1024,
        content_type="application/pdf",
        processed=True
    )
    db_session.add(doc)
    db_session.commit()
    
    await chat_service.ensure_documents_indexed(db_session)
    # Should not raise any errors
