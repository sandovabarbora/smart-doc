import pytest
from unittest.mock import AsyncMock, Mock, patch
from app.services.rag_engine import RAGEngine, RAGResponse

@pytest.fixture
def rag_engine(mock_vector_store):
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
    
    response = await rag_engine.query(
        "Follow up question", 
        chat_history=chat_history
    )
    
    assert isinstance(response, RAGResponse)
    assert response.answer is not None

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
async def test_rag_query_error_handling(rag_engine):
    """Test RAG query error handling"""
    with patch.object(rag_engine, 'vector_store') as mock_vs:
        mock_vs.hybrid_search = AsyncMock(side_effect=Exception("Vector store error"))
        
        response = await rag_engine.query("Test question")
        
        assert "error" in response.answer.lower()
        assert response.confidence_score == 0.0
