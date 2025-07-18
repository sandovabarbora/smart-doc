# backend/tests/test_services_document_processor.py
import pytest
import tempfile
import os
from unittest.mock import patch, Mock
from app.services.document_processor import DocumentProcessor
from app.models.document import Document

@pytest.fixture
def doc_processor():
    return DocumentProcessor()

@pytest.mark.asyncio
async def test_extract_text_file(doc_processor):
    """Test extracting content from text file"""
    content = "Test document content\nSecond line"
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(content)
        f.flush()
        
        result = await doc_processor._extract_content(f.name, "text/plain")
        
        assert result == content
        os.unlink(f.name)

@pytest.mark.asyncio
async def test_create_chunks(doc_processor):
    """Test document chunking"""
    content = "This is a test document. " * 100  # Long content
    
    chunks = await doc_processor._create_chunks(content, "test.txt")
    
    assert len(chunks) > 1  # Should be split into multiple chunks
    assert all(chunk.metadata['source'] == 'test.txt' for chunk in chunks)
    assert all('chunk_id' in chunk.metadata for chunk in chunks)

def test_preprocess_content(doc_processor):
    """Test content preprocessing"""
    content = "  Title:  \n\n  Paragraph 1  \n\n  Paragraph 2  "
    
    result = doc_processor._preprocess_content(content)
    
    assert "Title:" in result
    assert result.strip() != content.strip()

def test_extract_metadata(doc_processor):
    """Test metadata extraction"""
    table_content = "Row 1 | Column A | Column B\nRow 2 | Data 1 | Data 2"
    
    metadata = doc_processor._extract_metadata(table_content)
    
    assert metadata['content_type'] == 'table'
    assert 'word_count' in metadata
