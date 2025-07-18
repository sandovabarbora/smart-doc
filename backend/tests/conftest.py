import pytest
import tempfile
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import Mock, patch, AsyncMock
import asyncio

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings

# Create a temporary database file for each test session
@pytest.fixture(scope="session")
def temp_db():
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    try:
        yield db_path
    finally:
        os.close(db_fd)
        os.unlink(db_path)

@pytest.fixture(scope="session")
def engine(temp_db):
    engine = create_engine(
        f"sqlite:///{temp_db}", 
        connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    return engine

@pytest.fixture(scope="function")
def db_session(engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

def override_get_db(db_session):
    def _override():
        try:
            yield db_session
        finally:
            pass
    return _override

@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db] = override_get_db(db_session)
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()

@pytest.fixture
def temp_upload_dir():
    with tempfile.TemporaryDirectory() as tmpdir:
        old_upload_dir = settings.UPLOAD_DIR
        settings.UPLOAD_DIR = tmpdir
        yield tmpdir
        settings.UPLOAD_DIR = old_upload_dir

@pytest.fixture
def mock_anthropic():
    with patch('app.services.rag_engine.anthropic.AsyncAnthropic') as mock:
        mock_client = AsyncMock()
        mock_response = AsyncMock()
        mock_response.content = [AsyncMock()]
        mock_response.content[0].text = "Test response"
        mock_client.messages.create = AsyncMock(return_value=mock_response)
        mock.return_value = mock_client
        yield mock_client

@pytest.fixture
def mock_vector_store():
    with patch('app.services.vector_store.VectorStore') as mock_class:
        store = AsyncMock()
        store.add_chunks = AsyncMock(return_value=["test-id-1", "test-id-2"])
        store.search = AsyncMock(return_value=[
            {
                "id": "test-id-1",
                "content": "Test content",
                "metadata": {"source": "test.pdf", "chunk_index": 0},
                "similarity": 0.9
            }
        ])
        store.hybrid_search = AsyncMock(return_value=[
            {
                "id": "test-id-1", 
                "content": "Test content",
                "metadata": {"source": "test.pdf", "chunk_index": 0},
                "similarity": 0.9
            }
        ])
        mock_class.return_value = store
        yield store

@pytest.fixture
def mock_embedding_model():
    with patch('app.services.vector_store.SentenceTransformer') as mock:
        model = Mock()
        # Create a proper numpy-like array mock
        import numpy as np
        mock_array = np.array([[0.1, 0.2, 0.3]])
        model.encode = Mock(return_value=mock_array)
        mock.return_value = model
        yield model

@pytest.fixture
def mock_chroma_client():
    with patch('app.services.vector_store.chromadb.PersistentClient') as mock:
        client = Mock()
        collection = Mock()
        collection.add = Mock()
        collection.query = Mock(return_value={
            'ids': [['doc1']],
            'distances': [[0.2]],
            'metadatas': [[{'source': 'test.pdf'}]],
            'documents': [['Test content']]
        })
        collection.get = Mock(return_value={
            'ids': ['doc1', 'doc2'],
            'metadatas': [{'source': 'test.pdf'}, {'source': 'other.pdf'}],
            'documents': ['Test content with query terms', 'Other content']
        })
        collection.count = Mock(return_value=5)
        client.get_or_create_collection = Mock(return_value=collection)
        mock.return_value = client
        yield client
