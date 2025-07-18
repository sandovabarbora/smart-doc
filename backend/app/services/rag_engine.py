import asyncio
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

import anthropic
from langchain.schema import HumanMessage, SystemMessage, AIMessage

from .vector_store import VectorStore
from ..core.config import settings

@dataclass
class RAGResponse:
    answer: str
    sources: List[Dict[str, Any]]
    retrieval_time: float
    generation_time: float
    total_time: float
    context_used: List[str]
    confidence_score: float

class RAGEngine:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.client = anthropic.AsyncAnthropic(
            api_key=settings.ANTHROPIC_API_KEY
        )
        
        self.system_prompts = {
            "default": self._create_default_system_prompt(),
            "analytical": self._create_analytical_system_prompt(),
            "concise": self._create_concise_system_prompt()
        }
    
    async def query(
        self, 
        question: str, 
        chat_history: Optional[List[Dict[str, str]]] = None,
        prompt_style: str = "default",
        search_type: str = "hybrid",
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> RAGResponse:
        start_time = time.time()
        
        enhanced_query = await self._enhance_query(question, chat_history)
        
        retrieval_start = time.time()
        if search_type == "hybrid":
            retrieved_docs = await self.vector_store.hybrid_search(
                enhanced_query,
                top_k=settings.TOP_K_RETRIEVAL,
                filter_metadata=filter_metadata
            )
        else:
            retrieved_docs = await self.vector_store.search(
                enhanced_query,
                top_k=settings.TOP_K_RETRIEVAL,
                filter_metadata=filter_metadata
            )
        retrieval_time = time.time() - retrieval_start
        
        context = self._prepare_context(retrieved_docs)
        
        generation_start = time.time()
        answer, confidence = await self._generate_answer(
            question, context, chat_history, prompt_style
        )
        generation_time = time.time() - generation_start
        
        total_time = time.time() - start_time
        sources = self._prepare_sources(retrieved_docs)
        
        return RAGResponse(
            answer=answer,
            sources=sources,
            retrieval_time=retrieval_time,
            generation_time=generation_time,
            total_time=total_time,
            context_used=[doc["content"] for doc in retrieved_docs],
            confidence_score=confidence
        )
    
    async def _enhance_query(
        self, 
        question: str, 
        chat_history: Optional[List[Dict[str, str]]]
    ) -> str:
        if not chat_history or len(chat_history) == 0:
            return question
        
        recent_context = []
        for msg in chat_history[-3:]:
            if msg["type"] == "user":
                recent_context.append(f"User: {msg['content']}")
            elif msg["type"] == "assistant":
                recent_context.append(f"Assistant: {msg['content']}")
        
        context_str = "\n".join(recent_context)
        
        enhancement_prompt = f"""Given the conversation context below, reformulate the current question to be more specific and searchable.
If the question refers to "it", "this", "that" or other pronouns, replace them with specific terms from the context.
If the question is a follow-up, make it standalone.

Conversation context:
{context_str}

Current question: {question}

Enhanced question:"""

        try:
            response = await self.client.messages.create(
                model=settings.DEFAULT_MODEL,
                max_tokens=150,
                messages=[{"role": "user", "content": enhancement_prompt}]
            )
            enhanced = response.content[0].text.strip()
            return enhanced if enhanced else question
        except:
            return question
    
    def _prepare_context(self, retrieved_docs: List[Dict[str, Any]]) -> str:
        if not retrieved_docs:
            return "No relevant information found."
        
        context_parts = []
        for i, doc in enumerate(retrieved_docs, 1):
            source = doc["metadata"].get("source", "Unknown")
            content = doc["content"]
            similarity = doc.get("similarity", 0)
            
            context_parts.append(
                f"[Source {i}: {source} (relevance: {similarity:.2f})]\n{content}\n"
            )
        
        return "\n---\n".join(context_parts)
    
    async def _generate_answer(
        self, 
        question: str, 
        context: str, 
        chat_history: Optional[List[Dict[str, str]]],
        prompt_style: str
    ) -> Tuple[str, float]:
        system_prompt = self.system_prompts.get(prompt_style, self.system_prompts["default"])
        
        history_context = ""
        if chat_history:
            recent_exchanges = []
            for msg in chat_history[-5:]:
                recent_exchanges.append(f"{msg['type'].title()}: {msg['content']}")
            history_context = "\n".join(recent_exchanges)
        
        user_prompt = f"""Context from documents:
{context}

{f"Recent conversation:\n{history_context}" if history_context else ""}

Question: {question}

Please provide a comprehensive answer based on the provided context. If the context doesn't contain enough information to fully answer the question, clearly state what information is missing."""

        try:
            response = await self.client.messages.create(
                model=settings.DEFAULT_MODEL,
                max_tokens=2000,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            
            answer = response.content[0].text.strip()
            confidence = self._calculate_confidence(question, context, answer)
            
            return answer, confidence
            
        except Exception as e:
            return f"I apologize, but I encountered an error while generating a response: {str(e)}", 0.0
    
    def _calculate_confidence(self, question: str, context: str, answer: str) -> float:
        if not context or context == "No relevant information found.":
            return 0.1
        
        question_words = set(question.lower().split())
        context_words = set(context.lower().split())
        answer_words = set(answer.lower().split())
        
        question_context_overlap = len(question_words.intersection(context_words)) / len(question_words) if question_words else 0
        answer_context_overlap = len(answer_words.intersection(context_words)) / len(answer_words) if answer_words else 0
        
        uncertainty_phrases = ["i don't know", "unclear", "not enough information", "cannot determine"]
        has_uncertainty = any(phrase in answer.lower() for phrase in uncertainty_phrases)
        
        base_confidence = (question_context_overlap + answer_context_overlap) / 2
        
        if has_uncertainty:
            base_confidence *= 0.5
        
        return min(max(base_confidence, 0.1), 0.9)
    
    def _prepare_sources(self, retrieved_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sources = []
        for doc in retrieved_docs:
            source = {
                "id": doc["id"],
                "source": doc["metadata"].get("source", "Unknown"),
                "chunk_index": doc["metadata"].get("chunk_index", 0),
                "similarity": doc.get("similarity", 0),
                "content_preview": doc["content"][:200] + "..." if len(doc["content"]) > 200 else doc["content"]
            }
            sources.append(source)
        return sources
    
    def _create_default_system_prompt(self) -> str:
        return """You are an intelligent document assistant that helps users find and understand information from their documents.

Key instructions:
1. Base your answers strictly on the provided context from the documents
2. If information is not available in the context, clearly state this
3. Provide specific, detailed answers when possible
4. Always cite which source(s) your information comes from
5. If asked about something not in the documents, suggest what additional information might be helpful
6. Be conversational but professional
7. If multiple sources provide conflicting information, acknowledge this and present both perspectives

Remember: Your role is to help users understand their documents, not to provide general knowledge."""
    
    def _create_analytical_system_prompt(self) -> str:
        return """You are an analytical document assistant specializing in detailed analysis and insights.

Focus on:
1. Providing comprehensive analysis of the information in the documents
2. Identifying patterns, trends, and relationships in the data
3. Offering insights and implications based on the document content
4. Breaking down complex information into digestible parts
5. Suggesting areas for further investigation based on the available data
6. Being precise with numbers, dates, and specific details
7. Highlighting any gaps or limitations in the available information

Approach each query with analytical rigor while remaining accessible to non-technical users."""
    
    def _create_concise_system_prompt(self) -> str:
        return """You are a concise document assistant that provides direct, to-the-point answers.

Guidelines:
1. Keep responses brief and focused
2. Lead with the most important information
3. Use bullet points for lists when appropriate
4. Avoid unnecessary elaboration
5. Still cite sources, but briefly
6. If the answer is complex, provide a summary followed by key details
7. Prioritize actionable information

Aim for clarity and brevity while maintaining accuracy."""
import asyncio
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

import anthropic
from langchain.schema import HumanMessage, SystemMessage, AIMessage

from .vector_store import VectorStore
from ..core.config import settings

@dataclass
class RAGResponse:
    answer: str
    sources: List[Dict[str, Any]]
    retrieval_time: float
    generation_time: float
    total_time: float
    context_used: List[str]
    confidence_score: float

class RAGEngine:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store
        self.client = anthropic.AsyncAnthropic(
            api_key=settings.ANTHROPIC_API_KEY
        )
        
        self.system_prompts = {
            "default": self._create_default_system_prompt(),
            "analytical": self._create_analytical_system_prompt(),
            "concise": self._create_concise_system_prompt()
        }
    
    async def query(
        self, 
        question: str, 
        chat_history: Optional[List[Dict[str, str]]] = None,
        prompt_style: str = "default",
        search_type: str = "hybrid",
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> RAGResponse:
        start_time = time.time()
        
        enhanced_query = await self._enhance_query(question, chat_history)
        
        retrieval_start = time.time()
        if search_type == "hybrid":
            retrieved_docs = await self.vector_store.hybrid_search(
                enhanced_query,
                top_k=settings.TOP_K_RETRIEVAL,
                filter_metadata=filter_metadata
            )
        else:
            retrieved_docs = await self.vector_store.search(
                enhanced_query,
                top_k=settings.TOP_K_RETRIEVAL,
                filter_metadata=filter_metadata
            )
        retrieval_time = time.time() - retrieval_start
        
        context = self._prepare_context(retrieved_docs)
        
        generation_start = time.time()
        answer, confidence = await self._generate_answer(
            question, context, chat_history, prompt_style
        )
        generation_time = time.time() - generation_start
        
        total_time = time.time() - start_time
        sources = self._prepare_sources(retrieved_docs)
        
        return RAGResponse(
            answer=answer,
            sources=sources,
            retrieval_time=retrieval_time,
            generation_time=generation_time,
            total_time=total_time,
            context_used=[doc["content"] for doc in retrieved_docs],
            confidence_score=confidence
        )
    
    async def _enhance_query(
        self, 
        question: str, 
        chat_history: Optional[List[Dict[str, str]]]
    ) -> str:
        if not chat_history or len(chat_history) == 0:
            return question
        
        recent_context = []
        for msg in chat_history[-3:]:
            if msg["type"] == "user":
                recent_context.append(f"User: {msg['content']}")
            elif msg["type"] == "assistant":
                recent_context.append(f"Assistant: {msg['content']}")
        
        context_str = "\n".join(recent_context)
        
        enhancement_prompt = f"""Given the conversation context below, reformulate the current question to be more specific and searchable.
If the question refers to "it", "this", "that" or other pronouns, replace them with specific terms from the context.
If the question is a follow-up, make it standalone.

Conversation context:
{context_str}

Current question: {question}

Enhanced question:"""

        try:
            response = await self.client.messages.create(
                model=settings.DEFAULT_MODEL,
                max_tokens=150,
                messages=[{"role": "user", "content": enhancement_prompt}]
            )
            enhanced = response.content[0].text.strip()
            return enhanced if enhanced else question
        except:
            return question
    
    def _prepare_context(self, retrieved_docs: List[Dict[str, Any]]) -> str:
        if not retrieved_docs:
            return "No relevant information found."
        
        context_parts = []
        for i, doc in enumerate(retrieved_docs, 1):
            source = doc["metadata"].get("source", "Unknown")
            content = doc["content"]
            similarity = doc.get("similarity", 0)
            
            context_parts.append(
                f"[Source {i}: {source} (relevance: {similarity:.2f})]\n{content}\n"
            )
        
        return "\n---\n".join(context_parts)
    
    async def _generate_answer(
        self, 
        question: str, 
        context: str, 
        chat_history: Optional[List[Dict[str, str]]],
        prompt_style: str
    ) -> Tuple[str, float]:
        system_prompt = self.system_prompts.get(prompt_style, self.system_prompts["default"])
        
        history_context = ""
        if chat_history:
            recent_exchanges = []
            for msg in chat_history[-5:]:
                recent_exchanges.append(f"{msg['type'].title()}: {msg['content']}")
            history_context = "\n".join(recent_exchanges)
        
        user_prompt = f"""Context from documents:
{context}

{f"Recent conversation:\n{history_context}" if history_context else ""}

Question: {question}

Please provide a comprehensive answer based on the provided context. If the context doesn't contain enough information to fully answer the question, clearly state what information is missing."""

        try:
            response = await self.client.messages.create(
                model=settings.DEFAULT_MODEL,
                max_tokens=2000,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            
            answer = response.content[0].text.strip()
            confidence = self._calculate_confidence(question, context, answer)
            
            return answer, confidence
            
        except Exception as e:
            return f"I apologize, but I encountered an error while generating a response: {str(e)}", 0.0
    
    def _calculate_confidence(self, question: str, context: str, answer: str) -> float:
        if not context or context == "No relevant information found.":
            return 0.1
        
        question_words = set(question.lower().split())
        context_words = set(context.lower().split())
        answer_words = set(answer.lower().split())
        
        question_context_overlap = len(question_words.intersection(context_words)) / len(question_words) if question_words else 0
        answer_context_overlap = len(answer_words.intersection(context_words)) / len(answer_words) if answer_words else 0
        
        uncertainty_phrases = ["i don't know", "unclear", "not enough information", "cannot determine"]
        has_uncertainty = any(phrase in answer.lower() for phrase in uncertainty_phrases)
        
        base_confidence = (question_context_overlap + answer_context_overlap) / 2
        
        if has_uncertainty:
            base_confidence *= 0.5
        
        return min(max(base_confidence, 0.1), 0.9)
    
    def _prepare_sources(self, retrieved_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sources = []
        for doc in retrieved_docs:
            source = {
                "id": doc["id"],
                "source": doc["metadata"].get("source", "Unknown"),
                "chunk_index": doc["metadata"].get("chunk_index", 0),
                "similarity": doc.get("similarity", 0),
                "content_preview": doc["content"][:200] + "..." if len(doc["content"]) > 200 else doc["content"]
            }
            sources.append(source)
        return sources
    
    def _create_default_system_prompt(self) -> str:
        return """You are an intelligent document assistant that helps users find and understand information from their documents.

Key instructions:
1. Base your answers strictly on the provided context from the documents
2. If information is not available in the context, clearly state this
3. Provide specific, detailed answers when possible
4. Always cite which source(s) your information comes from
5. If asked about something not in the documents, suggest what additional information might be helpful
6. Be conversational but professional
7. If multiple sources provide conflicting information, acknowledge this and present both perspectives

Remember: Your role is to help users understand their documents, not to provide general knowledge."""
    
    def _create_analytical_system_prompt(self) -> str:
        return """You are an analytical document assistant specializing in detailed analysis and insights.

Focus on:
1. Providing comprehensive analysis of the information in the documents
2. Identifying patterns, trends, and relationships in the data
3. Offering insights and implications based on the document content
4. Breaking down complex information into digestible parts
5. Suggesting areas for further investigation based on the available data
6. Being precise with numbers, dates, and specific details
7. Highlighting any gaps or limitations in the available information

Approach each query with analytical rigor while remaining accessible to non-technical users."""
    
    def _create_concise_system_prompt(self) -> str:
        return """You are a concise document assistant that provides direct, to-the-point answers.

Guidelines:
1. Keep responses brief and focused
2. Lead with the most important information
3. Use bullet points for lists when appropriate
4. Avoid unnecessary elaboration
5. Still cite sources, but briefly
6. If the answer is complex, provide a summary followed by key details
7. Prioritize actionable information

Aim for clarity and brevity while maintaining accuracy."""
