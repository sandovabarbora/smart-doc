import pytest
from unittest.mock import AsyncMock, Mock, patch
from app.services.rag_engine import RAGEngine, RAGResponse

@pytest.fixture
def rag_engine(mock_vector_store, mock_anthropic):
    with patch('app.services.rag_engine.anthropic.AsyncAnthropic') as mock_client_class:
        mock_client_class.return_value = mock_anthropic
        return RAGEngine(mock_vector_store)

@pytest.mark.asyncio
async def test_rag_query_simple(rag_engine, mock_anthropic):
    """Test basic RAG query"""
    mock_anthropic.messages.create.return_value.content[0].text = "Test answer"
    
    response = await rag_engine.query("What is this about?")
    
    assert isinstance(response, RAGResponse)
    assert response.answer == "Test answer"
    assert len(response.sources) > 0
    assert response.confidence_score > 0

@pytest.mark.asyncio
async def test_rag_query_with_history(rag_engine, mock_anthropic):
    """Test RAG query with chat history"""
    chat_history = [
        {"type": "user", "content": "Previous question"},
        {"type": "assistant", "content": "Previous answer"}
    ]
    
    mock_anthropic.messages.create.return_value.content[0].text = "Follow-up answer"
    
    response = await rag_engine.query(
        "Follow up question", 
        chat_history=chat_history
    )
    
    assert isinstance(response, RAGResponse)
    assert response.answer == "Follow-up answer"

@pytest.mark.asyncio
async def test_rag_query_analytical_style(rag_engine, mock_anthropic):
    """Test RAG query with analytical prompt style"""
    mock_anthropic.messages.create.return_value.content[0].text = "Analytical response"
    
    response = await rag_engine.query(
        "Analyze this data",
        prompt_style="analytical"
    )
    
    assert response.answer == "Analytical response"

@pytest.mark.asyncio
async def test_rag_query_error_handling(rag_engine, mock_anthropic):
    """Test RAG query error handling"""
    mock_anthropic.messages.create.side_effect = Exception("API Error")
    
    response = await rag_engine.query("Test question")
    
    assert "error" in response.answer.lower()
    assert response.confidence_score == 0.0

@pytest.mark.asyncio
async def test_enhance_query(rag_engine, mock_anthropic):
    """Test query enhancement with chat history"""
    mock_anthropic.messages.create.return_value.content[0].text = "Enhanced question"
    
    chat_history = [
        {"type": "user", "content": "What is machine learning?"},
        {"type": "assistant", "content": "Machine learning is..."}
    ]
    
    enhanced = await rag_engine._enhance_query("Tell me more about it", chat_history)
    assert enhanced == "Enhanced question"

def test_calculate_confidence(rag_engine):
    """Test confidence calculation"""
    question = "What is AI?"
    context = "AI is artificial intelligence technology"
    answer = "AI stands for artificial intelligence"
    
    confidence = rag_engine._calculate_confidence(question, context, answer)
    assert 0.0 <= confidence <= 1.0

def test_prepare_sources(rag_engine):
    """Test source preparation"""
    retrieved_docs = [
        {
            "id": "doc1",
            "content": "Test content for source preparation",
            "metadata": {"source": "test.pdf", "chunk_index": 0},
            "similarity": 0.9
        }
    ]
    
    sources = rag_engine._prepare_sources(retrieved_docs)
    assert len(sources) == 1
    assert sources[0]["source"] == "test.pdf"
    assert sources[0]["similarity"] == 0.9
