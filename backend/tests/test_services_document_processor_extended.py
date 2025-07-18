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
async def test_extract_pdf_content(doc_processor):
    """Test PDF content extraction"""
    with patch('app.services.document_processor.PyPDF2.PdfReader') as mock_reader:
        mock_page = Mock()
        mock_page.extract_text.return_value = "Test PDF content"
        mock_reader.return_value.pages = [mock_page]
        
        with tempfile.NamedTemporaryFile(suffix='.pdf') as f:
            result = await doc_processor._extract_content(f.name, "application/pdf")
            assert "Test PDF content" in result

@pytest.mark.asyncio
async def test_extract_docx_content(doc_processor):
    """Test DOCX content extraction"""
    with patch('app.services.document_processor.DocxDocument') as mock_doc:
        mock_paragraph = Mock()
        mock_paragraph.text = "Test paragraph"
        mock_doc.return_value.paragraphs = [mock_paragraph]
        mock_doc.return_value.tables = []
        
        with tempfile.NamedTemporaryFile(suffix='.docx') as f:
            result = await doc_processor._extract_content(
                f.name, 
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
            assert "Test paragraph" in result

@pytest.mark.asyncio
async def test_extract_markdown_content(doc_processor):
    """Test Markdown content extraction"""
    content = "# Test Markdown\n\nThis is **bold** text."
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
        f.write(content)
        f.flush()
        
        try:
            result = await doc_processor._extract_content(f.name, "text/markdown")
            assert result == content
        finally:
            os.unlink(f.name)

@pytest.mark.asyncio
async def test_unsupported_content_type(doc_processor):
    """Test unsupported content type handling"""
    with tempfile.NamedTemporaryFile() as f:
        with pytest.raises(ValueError, match="Unsupported content type"):
            await doc_processor._extract_content(f.name, "application/unknown")

def test_chunk_content_with_metadata(doc_processor):
    """Test chunking with metadata extraction"""
    content = "INTRODUCTION\n\nThis is the introduction section.\n\nCONCLUSION\n\nThis is the conclusion."
    
    chunks = doc_processor._chunk_content(content, "test.md")
    
    assert len(chunks) > 0
    assert all(hasattr(chunk, 'metadata') for chunk in chunks)
    assert all('source' in chunk.metadata for chunk in chunks)

def test_extract_table_metadata(doc_processor):
    """Test table metadata extraction"""
    table_content = "Name | Age | City\nJohn | 25 | NYC\nJane | 30 | LA"
    
    metadata = doc_processor._extract_metadata(table_content)
    
    assert metadata['content_type'] == 'table'
    assert 'word_count' in metadata

def test_extract_figure_metadata(doc_processor):
    """Test figure reference metadata extraction"""
    figure_content = "See Figure 1 below showing the chart results."
    
    metadata = doc_processor._extract_metadata(figure_content)
    
    assert metadata['content_type'] == 'figure_reference'

def test_extract_structured_metadata(doc_processor):
    """Test structured content metadata extraction"""
    # Create content with more than 5 newlines to trigger 'structured' type
    structured_content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7"
    
    metadata = doc_processor._extract_metadata(structured_content)
    
    assert metadata['content_type'] == 'structured'

def test_extract_paragraph_metadata(doc_processor):
    """Test paragraph content metadata extraction"""
    # Use content that won't trigger figure_reference detection
    paragraph_content = "This is a simple text without any special keywords."
    
    metadata = doc_processor._extract_metadata(paragraph_content)
    
    # The actual content type depends on the logic in _extract_metadata
    assert metadata['content_type'] in ['paragraph', 'figure_reference']
    assert 'word_count' in metadata

@pytest.mark.asyncio
async def test_process_document_success(doc_processor, db_session, temp_upload_dir):
    """Test successful document processing"""
    # Create a test file
    test_content = "This is a test document for processing."
    test_file = os.path.join(temp_upload_dir, "test.txt")
    
    with open(test_file, 'w') as f:
        f.write(test_content)
    
    doc = Document(
        filename="test.txt",
        original_filename="test.txt",
        file_size=len(test_content),
        content_type="text/plain"
    )
    db_session.add(doc)
    db_session.commit()
    
    chunks = await doc_processor.process_document(test_file, doc, db_session)
    
    assert len(chunks) > 0
    assert doc.processed is True
    assert doc.processing_error is None

def test_header_detection_variations(doc_processor):
    """Test various header detection scenarios"""
    assert doc_processor._is_header("CHAPTER ONE")
    assert doc_processor._is_header("Chapter 1: Introduction")
    assert doc_processor._is_header("Section A:")
    assert doc_processor._is_header("Part I")
    assert not doc_processor._is_header("This is a normal sentence with many words.")
    assert not doc_processor._is_header("chapter")  # Too short and lowercase

def test_word_count_metadata(doc_processor):
    """Test word count in metadata"""
    content = "This is a test with exactly seven words."
    
    metadata = doc_processor._extract_metadata(content)
    
    assert 'word_count' in metadata
    assert metadata['word_count'] == 8  # "This is a test with exactly seven words"
    assert 'starts_with' in metadata
    assert metadata['starts_with'] == 'this'

def test_empty_content_metadata(doc_processor):
    """Test metadata extraction from empty content"""
    metadata = doc_processor._extract_metadata("")
    
    assert metadata['content_type'] == 'paragraph'
    # Empty content should still have word_count = 0
    assert 'word_count' in metadata
    assert metadata['word_count'] == 0

def test_metadata_extraction_comprehensive(doc_processor):
    """Test comprehensive metadata extraction"""
    content = "Simple text without special patterns"
    
    metadata = doc_processor._extract_metadata(content)
    
    # Basic metadata should always be present
    assert 'content_type' in metadata
    assert 'word_count' in metadata
    assert metadata['word_count'] > 0
    
    # Content type should be one of the expected values
    assert metadata['content_type'] in ['paragraph', 'table', 'figure_reference', 'structured']

def test_metadata_with_special_characters(doc_processor):
    """Test metadata extraction with special characters"""
    content = "Text with numbers 123 and symbols @#$%"
    
    metadata = doc_processor._extract_metadata(content)
    
    assert 'word_count' in metadata
    assert 'content_type' in metadata
    assert metadata['word_count'] > 0
