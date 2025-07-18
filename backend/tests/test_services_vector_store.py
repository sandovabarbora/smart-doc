import pytest
from unittest.mock import Mock, patch, AsyncMock
import numpy as np
from app.services.vector_store import VectorStore
from app.models.document import DocumentChunk

@pytest.fixture
def vector_store(mock_embedding_model, mock_chroma_client):
    with patch('app.services.vector_store.chromadb.PersistentClient') as mock_client_class:
        mock_client_class.return_value = mock_chroma_client
        store = VectorStore()
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
            chunk_metadata={"source": "test.pdf"}  # Správný atribut
        )
    ]
    
    result = await vector_store.add_chunks(chunks)
    
    assert len(result) == 1
    assert isinstance(result[0], str)
    vector_store.collection.add.assert_called_once()

@pytest.mark.asyncio
async def test_add_chunks_empty(vector_store):
    """Test adding empty chunks list"""
    result = await vector_store.add_chunks([])
    assert result == []

@pytest.mark.asyncio
async def test_add_chunks_no_metadata(vector_store):
    """Test adding chunks without metadata"""
    chunks = [
        DocumentChunk(
            id=1,
            document_id=1,
            chunk_index=0,
            content="Test content",
            chunk_metadata=None
        )
    ]
    
    result = await vector_store.add_chunks(chunks)
    assert len(result) == 1

@pytest.mark.asyncio
async def test_search(vector_store):
    """Test semantic search"""
    results = await vector_store.search("test query")
    
    assert len(results) == 1
    assert results[0]['content'] == 'Test content'
    assert results[0]['similarity'] == 0.8  # 1 - 0.2

@pytest.mark.asyncio
async def test_search_with_similarity_threshold(vector_store):
    """Test search with similarity threshold"""
    # Mock low similarity result
    vector_store.collection.query.return_value = {
        'ids': [['doc1']],
        'distances': [[0.9]],  # Low similarity (high distance)
        'metadatas': [[{'source': 'test.pdf'}]],
        'documents': [['Test content']]
    }
    
    results = await vector_store.search("test query", similarity_threshold=0.5)
    assert len(results) == 0  # Should be filtered out

@pytest.mark.asyncio
async def test_hybrid_search(vector_store):
    """Test hybrid search combining semantic and keyword"""
    results = await vector_store.hybrid_search("test query")
    
    assert len(results) >= 1
    assert 'combined_score' in results[0]

@pytest.mark.asyncio
async def test_search_with_filter(vector_store):
    """Test search with metadata filter"""
    filter_metadata = {"source": "test.pdf"}
    results = await vector_store.search("test query", filter_metadata=filter_metadata)
    
    assert len(results) == 1
    vector_store.collection.query.assert_called()

@pytest.mark.asyncio
async def test_keyword_search(vector_store):
    """Test keyword search functionality"""
    results = await vector_store._keyword_search("test query", 5, None)
    
    # Should find matches based on keyword overlap
    assert len(results) >= 1
    assert 'keyword_matches' in results[0]

@pytest.mark.asyncio
async def test_delete_chunks(vector_store):
    """Test deleting chunks from vector store"""
    chunk_ids = ["test-id-1", "test-id-2"]
    await vector_store.delete_chunks(chunk_ids)
    
    vector_store.collection.delete.assert_called_once_with(chunk_ids)

@pytest.mark.asyncio
async def test_delete_chunks_empty(vector_store):
    """Test deleting empty chunks list"""
    await vector_store.delete_chunks([])
    vector_store.collection.delete.assert_not_called()

@pytest.mark.asyncio
async def test_get_collection_stats(vector_store):
    """Test getting collection statistics"""
    stats = await vector_store.get_collection_stats()
    
    assert "total_chunks" in stats
    assert "embedding_model" in stats
    assert "collection_name" in stats
    assert stats["total_chunks"] == 5  # from mock

def test_combine_search_results(vector_store):
    """Test combining semantic and keyword search results"""
    semantic_results = [
        {"id": "doc1", "content": "test", "metadata": {}, "similarity": 0.9, "rank": 1}
    ]
    keyword_results = [
        {"id": "doc1", "content": "test", "metadata": {}, "similarity": 0.7, "keyword_matches": 2}
    ]
    
    combined = vector_store._combine_search_results(semantic_results, keyword_results, 0.7)
    
    assert len(combined) == 1
    assert "combined_score" in combined[0]
    assert "keyword_matches" in combined[0]

@pytest.mark.asyncio
async def test_generate_embeddings(vector_store):
    """Test embedding generation"""
    embeddings = await vector_store._generate_embeddings(["test text"])
    
    assert len(embeddings) == 1
    assert len(embeddings[0]) == 3  # Mock returns 3-dim vector

def test_add_to_collection(vector_store):
    """Test adding to ChromaDB collection"""
    ids = ["id1"]
    embeddings = [[0.1, 0.2, 0.3]]
    metadatas = [{"source": "test.pdf"}]
    documents = ["test content"]
    
    vector_store._add_to_collection(ids, embeddings, metadatas, documents)
    
    vector_store.collection.add.assert_called_with(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents
    )

def test_search_collection(vector_store):
    """Test searching ChromaDB collection"""
    query_embedding = [0.1, 0.2, 0.3]
    top_k = 5
    filter_metadata = {"source": "test.pdf"}
    
    vector_store._search_collection(query_embedding, top_k, filter_metadata)
    
    vector_store.collection.query.assert_called_with(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=filter_metadata
    )

def test_get_all_documents(vector_store):
    """Test getting all documents from collection"""
    filter_metadata = {"source": "test.pdf"}
    
    vector_store._get_all_documents(filter_metadata)
    
    vector_store.collection.get.assert_called_with(where=filter_metadata)
