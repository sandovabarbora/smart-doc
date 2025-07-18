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

# Test database - use unique DB for each test
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")  # Changed to function scope for isolation
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    return TestClient(app)

@pytest.fixture
def db_session(test_db):
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

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
        mock_client.messages.create.return_value = mock_response
        mock.return_value = mock_client
        yield mock_client

@pytest.fixture
def mock_vector_store():
    with patch('app.services.vector_store.VectorStore') as mock_class:
        store = AsyncMock()  # Made async
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
        # Return numpy-like array with tolist method
        mock_array = Mock()
        mock_array.tolist = Mock(return_value=[[0.1, 0.2, 0.3]])
        model.encode = Mock(return_value=mock_array)
        mock.return_value = model
        yield model
