from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ...core.database import get_db

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

@router.post("/", response_model=Dict[str, Any])
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Simplified chat for now
    return {
        "answer": f"Echo: {request.message}",
        "session_id": "test-session",
        "message_id": 1
    }

@router.get("/sessions", response_model=List[Dict[str, Any]])
async def list_sessions(db: Session = Depends(get_db)):
    return []
