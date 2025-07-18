import asyncio
import time
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from .rag_engine import RAGEngine
from .vector_store import VectorStore
from .document_processor import DocumentProcessor
from ..models.document import ChatSession, ChatMessage, Document, DocumentChunk
from ..core.config import settings

class ChatService:
    def __init__(self):
        self.vector_store = VectorStore()
        self.rag_engine = RAGEngine(self.vector_store)
        self.document_processor = DocumentProcessor()
    
    async def process_message(
        self, 
        message: str, 
        session: ChatSession, 
        db: Session,
        prompt_style: str = "default"
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        # Získat chat historii pro kontext
        chat_history = self._get_chat_history(session, db)
        
        # Použít RAG engine pro generování odpovědi
        try:
            rag_response = await self.rag_engine.query(
                question=message,
                chat_history=chat_history,
                prompt_style=prompt_style,
                search_type="hybrid"
            )
            
            return {
                "answer": rag_response.answer,
                "sources": rag_response.sources,
                "performance": {
                    "retrieval_time": rag_response.retrieval_time,
                    "generation_time": rag_response.generation_time,
                    "total_time": rag_response.total_time
                },
                "confidence": rag_response.confidence_score,
                "context_used": rag_response.context_used
            }
            
        except Exception as e:
            # Fallback na jednoduchý mock pokud RAG selže
            return {
                "answer": f"I apologize, but I encountered an error processing your question: {str(e)}. This might be because no documents have been uploaded yet or there's an issue with the AI service.",
                "sources": [],
                "performance": {
                    "retrieval_time": 0.0,
                    "generation_time": 0.0,
                    "total_time": time.time() - start_time
                },
                "confidence": 0.1,
                "context_used": []
            }
    
    def _get_chat_history(self, session: ChatSession, db: Session) -> List[Dict[str, str]]:
        messages = db.query(ChatMessage).filter(
            ChatMessage.session_id == session.id
        ).order_by(ChatMessage.timestamp.desc()).limit(10).all()
        
        history = []
        for msg in reversed(messages):
            history.append({
                "type": msg.message_type,
                "content": msg.content
            })
        
        return history
    
    async def ensure_documents_indexed(self, db: Session):
        """Ujistí se, že všechny zpracované dokumenty jsou v vector store"""
        processed_docs = db.query(Document).filter(Document.processed == True).all()
        
        for doc in processed_docs:
            chunks = db.query(DocumentChunk).filter(
                DocumentChunk.document_id == doc.id
            ).all()
            
            if chunks:
                try:
                    await self.vector_store.add_chunks(chunks)
                except Exception as e:
                    print(f"Error indexing document {doc.id}: {e}")
