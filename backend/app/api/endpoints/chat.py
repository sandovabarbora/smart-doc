from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime

from ...core.database import get_db
from ...models.document import ChatSession, ChatMessage
from ...services.chat_service import ChatService

router = APIRouter()

# Globální instance chat service
chat_service = ChatService()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    prompt_style: Optional[str] = "default"
    search_type: Optional[str] = "hybrid"

class ChatResponse(BaseModel):
    answer: str
    session_id: str
    message_id: int
    sources: List[Dict[str, Any]] = []
    performance: Optional[Dict[str, float]] = None
    confidence: Optional[float] = None

class MessageResponse(BaseModel):
    id: int
    type: str
    content: str
    timestamp: str
    sources: Optional[List[Dict[str, Any]]] = None
    response_time: Optional[float] = None

class SessionResponse(BaseModel):
    session_id: str
    created_at: str
    updated_at: Optional[str] = None
    message_count: int

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Ujistit se, že dokumenty jsou indexované
    await chat_service.ensure_documents_indexed(db)
    
    # Získat nebo vytvořit session
    if request.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.session_id == request.session_id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        # Vytvořit novou session
        session_id = str(uuid.uuid4())
        session = ChatSession(session_id=session_id)
        db.add(session)
        db.commit()
        db.refresh(session)

    # Uložit user message
    user_message = ChatMessage(
        session_id=session.id,
        message_type="user",
        content=request.message,
        timestamp=datetime.utcnow()
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Zpracovat zprávu pomocí RAG
    response_data = await chat_service.process_message(
        message=request.message,
        session=session,
        db=db,
        prompt_style=request.prompt_style or "default"
    )

    # Uložit assistant message
    assistant_message = ChatMessage(
        session_id=session.id,
        message_type="assistant",
        content=response_data["answer"],
        timestamp=datetime.utcnow(),
        sources=response_data["sources"],
        response_time=response_data["performance"]["total_time"]
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return ChatResponse(
        answer=response_data["answer"],
        session_id=session.session_id,
        message_id=assistant_message.id,
        sources=response_data["sources"],
        performance=response_data["performance"],
        confidence=response_data["confidence"]
    )

@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).order_by(ChatSession.created_at.desc()).all()
    
    result = []
    for session in sessions:
        message_count = db.query(ChatMessage).filter(
            ChatMessage.session_id == session.id
        ).count()
        
        result.append(SessionResponse(
            session_id=session.session_id,
            created_at=session.created_at.isoformat(),
            updated_at=session.updated_at.isoformat() if session.updated_at else None,
            message_count=message_count
        ))
    
    return result

@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(session_id: str, db: Session = Depends(get_db)):
    # Najít session
    session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Získat všechny zprávy pro tuto session
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    result = []
    for msg in messages:
        result.append(MessageResponse(
            id=msg.id,
            type=msg.message_type,
            content=msg.content,
            timestamp=msg.timestamp.isoformat(),
            sources=msg.sources,
            response_time=msg.response_time
        ))
    
    return result

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Smazat všechny zprávy (CASCADE by se mělo postarat o to automaticky)
    db.delete(session)
    db.commit()
    
    return {"message": "Session deleted successfully"}
