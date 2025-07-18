import os
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import aiofiles

from ...core.database import get_db
from ...core.config import settings
from ...models.document import Document, DocumentChunk

router = APIRouter()

@router.post("/upload", response_model=Dict[str, Any])
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not supported. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )
    
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    document = Document(
        filename=unique_filename,
        original_filename=file.filename,
        file_size=len(content),
        content_type=file.content_type or "application/octet-stream"
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    return {
        "document_id": document.id,
        "filename": document.original_filename,
        "chunks_created": 1,  # Mock for now
        "status": "processed"
    }

@router.get("/", response_model=List[Dict[str, Any]])
async def list_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).order_by(Document.upload_time.desc()).all()
    
    return [
        {
            "id": doc.id,
            "filename": doc.original_filename,
            "upload_time": doc.upload_time.isoformat(),
            "file_size": doc.file_size,
            "processed": doc.processed,
            "processing_error": doc.processing_error,
            "chunks_count": len(doc.chunks)
        }
        for doc in documents
    ]

@router.delete("/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}
