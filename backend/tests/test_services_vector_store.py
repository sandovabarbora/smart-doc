import pytest
from unittest.mock import Mock, patch, AsyncMock
import numpy as np
from app.services.vector_store import VectorStore
from app.models.document import DocumentChunk

@pytest.fixture
def vector_store(mock_embedding_model):
    with patch('app.services.vector_store.chromadb.PersistentClient'):
        store = VectorStore()
        store.collection = Mock()
        store.embedding_model = mock_embedding_model
        return store

@pytest.mark.asyncio
async def test_add_chunks(vector_store):
    """Test adding document chunks to vector store"""
    chunks = [
        DocumentChunk(
            id=1,
            document_id=1,
            chunk_index=0,
            content="Test content",
            chunk_metadata={"source": "test.pdf"}
        )
    ]
    
    # Mock embedding model to return proper format
    mock_array = Mock()
    mock_array.tolist = Mock(return_value=[[0.1, 0.2, 0.3]])
    vector_store.embedding_model.encode.return_value = mock_array
    
    result = await vector_store.add_chunks(chunks)
    
    assert len(result) == 1
    assert isinstance(result[0], str)
    vector_store.collection.add.assert_called_once()

@pytest.mark.asyncio
async def test_search(vector_store):
    """Test semantic search"""
    # Mock embedding model
    mock_array = Mock()
    mock_array.tolist = Mock(return_value=[[0.1, 0.2, 0.3]])
    vector_store.embedding_model.encode.return_value = mock_array
    
    vector_store.collection.query.return_value = {
        'ids': [['doc1']],
        'distances': [[0.2]],
        'metadatas': [[{'source': 'test.pdf'}]],
        'documents': [['Test content']]
    }
    
    results = await vector_store.search("test query")
    
    assert len(results) == 1
    assert results[0]['content'] == 'Test content'
    assert results[0]['similarity'] == 0.8  # 1 - 0.2

@pytest.mark.asyncio
async def test_hybrid_search(vector_store):
    """Test hybrid search combining semantic and keyword"""
    # Mock embedding model
    mock_array = Mock()
    mock_array.tolist = Mock(return_value=[[0.1, 0.2, 0.3]])
    vector_store.embedding_model.encode.return_value = mock_array
    
    # Mock semantic search results
    vector_store.collection.query.return_value = {
        'ids': [['doc1']],
        'distances': [[0.2]],
        'metadatas': [[{'source': 'test.pdf'}]],
        'documents': [['Test content with query terms']]
    }
    
    # Mock all documents for keyword search
    vector_store.collection.get.return_value = {
        'ids': ['doc1', 'doc2'],
        'metadatas': [{'source': 'test.pdf'}, {'source': 'other.pdf'}],
        'documents': ['Test content with query terms', 'Other content']
    }
    
    results = await vector_store.hybrid_search("test query")
    
    assert len(results) >= 1
    assert 'combined_score' in results[0]
