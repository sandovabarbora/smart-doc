import asyncio
from typing import List, Dict, Any, Optional
import uuid
from concurrent.futures import ThreadPoolExecutor

import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
import numpy as np

from ..core.config import settings
from ..models.document import DocumentChunk

class VectorStore:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIRECTORY,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        
        self.collection = self.chroma_client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )
        
        self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    async def add_chunks(self, chunks: List[DocumentChunk]) -> List[str]:
        if not chunks:
            return []
        
        texts = [chunk.content for chunk in chunks]
        metadatas = []
        ids = []
        
        for chunk in chunks:
            chunk_id = str(uuid.uuid4())
            ids.append(chunk_id)
            
            metadata = {
                "document_id": chunk.document_id,
                "chunk_index": chunk.chunk_index,
                "chunk_id": chunk.id,
                "source": chunk.metadata.get("source", "unknown") if chunk.metadata else "unknown",
                "content_type": chunk.metadata.get("content_type", "paragraph") if chunk.metadata else "paragraph",
                "word_count": chunk.metadata.get("word_count", 0) if chunk.metadata else 0
            }
            metadatas.append(metadata)
        
        embeddings = await self._generate_embeddings(texts)
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            self.executor,
            self._add_to_collection,
            ids, embeddings, metadatas, texts
        )
        
        return ids
    
    async def search(
        self, 
        query: str, 
        top_k: int = None, 
        filter_metadata: Optional[Dict[str, Any]] = None,
        similarity_threshold: float = None
    ) -> List[Dict[str, Any]]:
        top_k = top_k or settings.TOP_K_RETRIEVAL
        similarity_threshold = similarity_threshold or settings.SIMILARITY_THRESHOLD
        
        query_embedding = await self._generate_embeddings([query])
        
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            self.executor,
            self._search_collection,
            query_embedding[0], top_k, filter_metadata
        )
        
        filtered_results = []
        for i, (doc_id, distance, metadata, document) in enumerate(zip(
            results['ids'][0],
            results['distances'][0], 
            results['metadatas'][0],
            results['documents'][0]
        )):
            similarity = 1 - distance
            
            if similarity >= similarity_threshold:
                result = {
                    "id": doc_id,
                    "content": document,
                    "metadata": metadata,
                    "similarity": similarity,
                    "rank": i + 1
                }
                filtered_results.append(result)
        
        return filtered_results
    
    async def hybrid_search(
        self,
        query: str,
        top_k: int = None,
        alpha: float = 0.7,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        top_k = top_k or settings.TOP_K_RETRIEVAL
        
        semantic_results = await self.search(
            query, 
            top_k=top_k * 2,
            filter_metadata=filter_metadata,
            similarity_threshold=0.0
        )
        
        keyword_results = await self._keyword_search(query, top_k * 2, filter_metadata)
        combined_results = self._combine_search_results(semantic_results, keyword_results, alpha)
        
        return combined_results[:top_k]
    
    async def _keyword_search(
        self, 
        query: str, 
        top_k: int, 
        filter_metadata: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        query_terms = set(query.lower().split())
        
        loop = asyncio.get_event_loop()
        all_results = await loop.run_in_executor(
            self.executor,
            self._get_all_documents,
            filter_metadata
        )
        
        scored_results = []
        for doc_id, metadata, document in zip(
            all_results['ids'],
            all_results['metadatas'], 
            all_results['documents']
        ):
            doc_terms = set(document.lower().split())
            matches = len(query_terms.intersection(doc_terms))
            
            if matches > 0:
                tf = matches / len(doc_terms) if doc_terms else 0
                score = tf * len(query_terms) / len(query_terms.union(doc_terms))
                
                scored_results.append({
                    "id": doc_id,
                    "content": document,
                    "metadata": metadata,
                    "similarity": score,
                    "keyword_matches": matches
                })
        
        scored_results.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_results[:top_k]
    
    def _combine_search_results(
        self, 
        semantic_results: List[Dict], 
        keyword_results: List[Dict], 
        alpha: float
    ) -> List[Dict[str, Any]]:
        if semantic_results:
            max_semantic = max(r["similarity"] for r in semantic_results)
            for result in semantic_results:
                result["normalized_semantic"] = result["similarity"] / max_semantic if max_semantic > 0 else 0
        
        if keyword_results:
            max_keyword = max(r["similarity"] for r in keyword_results)
            for result in keyword_results:
                result["normalized_keyword"] = result["similarity"] / max_keyword if max_keyword > 0 else 0
        
        all_results = {}
        
        for result in semantic_results:
            doc_id = result["id"]
            all_results[doc_id] = result.copy()
            all_results[doc_id]["combined_score"] = alpha * result["normalized_semantic"]
        
        for result in keyword_results:
            doc_id = result["id"]
            if doc_id in all_results:
                all_results[doc_id]["combined_score"] += (1 - alpha) * result["normalized_keyword"]
                all_results[doc_id]["keyword_matches"] = result.get("keyword_matches", 0)
            else:
                all_results[doc_id] = result.copy()
                all_results[doc_id]["combined_score"] = (1 - alpha) * result["normalized_keyword"]
        
        final_results = list(all_results.values())
        final_results.sort(key=lambda x: x["combined_score"], reverse=True)
        
        return final_results
    
    async def _generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            self.executor,
            self.embedding_model.encode,
            texts
        )
        return embeddings.tolist()
    
    def _add_to_collection(
        self, 
        ids: List[str], 
        embeddings: List[List[float]], 
        metadatas: List[Dict], 
        documents: List[str]
    ):
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
    
    def _search_collection(
        self, 
        query_embedding: List[float], 
        top_k: int, 
        filter_metadata: Optional[Dict[str, Any]]
    ):
        where_clause = filter_metadata if filter_metadata else None
        
        return self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_clause
        )
    
    def _get_all_documents(self, filter_metadata: Optional[Dict[str, Any]]):
        where_clause = filter_metadata if filter_metadata else None
        return self.collection.get(where=where_clause)
    
    async def delete_chunks(self, chunk_ids: List[str]):
        if not chunk_ids:
            return
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            self.executor,
            self.collection.delete,
            chunk_ids
        )
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        loop = asyncio.get_event_loop()
        count = await loop.run_in_executor(self.executor, self.collection.count)
        
        return {
            "total_chunks": count,
            "embedding_model": settings.EMBEDDING_MODEL,
            "collection_name": "documents"
        }
import asyncio
from typing import List, Dict, Any, Optional
import uuid
from concurrent.futures import ThreadPoolExecutor

import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
import numpy as np

from ..core.config import settings
from ..models.document import DocumentChunk

class VectorStore:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIRECTORY,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        
        self.collection = self.chroma_client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )
        
        self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    async def add_chunks(self, chunks: List[DocumentChunk]) -> List[str]:
        if not chunks:
            return []
        
        texts = [chunk.content for chunk in chunks]
        metadatas = []
        ids = []
        
        for chunk in chunks:
            chunk_id = str(uuid.uuid4())
            ids.append(chunk_id)
            
            metadata = {
                "document_id": chunk.document_id,
                "chunk_index": chunk.chunk_index,
                "chunk_id": chunk.id,
                "source": chunk.metadata.get("source", "unknown") if chunk.metadata else "unknown",
                "content_type": chunk.metadata.get("content_type", "paragraph") if chunk.metadata else "paragraph",
                "word_count": chunk.metadata.get("word_count", 0) if chunk.metadata else 0
            }
            metadatas.append(metadata)
        
        embeddings = await self._generate_embeddings(texts)
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            self.executor,
            self._add_to_collection,
            ids, embeddings, metadatas, texts
        )
        
        return ids
    
    async def search(
        self, 
        query: str, 
        top_k: int = None, 
        filter_metadata: Optional[Dict[str, Any]] = None,
        similarity_threshold: float = None
    ) -> List[Dict[str, Any]]:
        top_k = top_k or settings.TOP_K_RETRIEVAL
        similarity_threshold = similarity_threshold or settings.SIMILARITY_THRESHOLD
        
        query_embedding = await self._generate_embeddings([query])
        
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            self.executor,
            self._search_collection,
            query_embedding[0], top_k, filter_metadata
        )
        
        filtered_results = []
        for i, (doc_id, distance, metadata, document) in enumerate(zip(
            results['ids'][0],
            results['distances'][0], 
            results['metadatas'][0],
            results['documents'][0]
        )):
            similarity = 1 - distance
            
            if similarity >= similarity_threshold:
                result = {
                    "id": doc_id,
                    "content": document,
                    "metadata": metadata,
                    "similarity": similarity,
                    "rank": i + 1
                }
                filtered_results.append(result)
        
        return filtered_results
    
    async def hybrid_search(
        self,
        query: str,
        top_k: int = None,
        alpha: float = 0.7,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        top_k = top_k or settings.TOP_K_RETRIEVAL
        
        semantic_results = await self.search(
            query, 
            top_k=top_k * 2,
            filter_metadata=filter_metadata,
            similarity_threshold=0.0
        )
        
        keyword_results = await self._keyword_search(query, top_k * 2, filter_metadata)
        combined_results = self._combine_search_results(semantic_results, keyword_results, alpha)
        
        return combined_results[:top_k]
    
    async def _keyword_search(
        self, 
        query: str, 
        top_k: int, 
        filter_metadata: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        query_terms = set(query.lower().split())
        
        loop = asyncio.get_event_loop()
        all_results = await loop.run_in_executor(
            self.executor,
            self._get_all_documents,
            filter_metadata
        )
        
        scored_results = []
        for doc_id, metadata, document in zip(
            all_results['ids'],
            all_results['metadatas'], 
            all_results['documents']
        ):
            doc_terms = set(document.lower().split())
            matches = len(query_terms.intersection(doc_terms))
            
            if matches > 0:
                tf = matches / len(doc_terms) if doc_terms else 0
                score = tf * len(query_terms) / len(query_terms.union(doc_terms))
                
                scored_results.append({
                    "id": doc_id,
                    "content": document,
                    "metadata": metadata,
                    "similarity": score,
                    "keyword_matches": matches
                })
        
        scored_results.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_results[:top_k]
    
    def _combine_search_results(
        self, 
        semantic_results: List[Dict], 
        keyword_results: List[Dict], 
        alpha: float
    ) -> List[Dict[str, Any]]:
        if semantic_results:
            max_semantic = max(r["similarity"] for r in semantic_results)
            for result in semantic_results:
                result["normalized_semantic"] = result["similarity"] / max_semantic if max_semantic > 0 else 0
        
        if keyword_results:
            max_keyword = max(r["similarity"] for r in keyword_results)
            for result in keyword_results:
                result["normalized_keyword"] = result["similarity"] / max_keyword if max_keyword > 0 else 0
        
        all_results = {}
        
        for result in semantic_results:
            doc_id = result["id"]
            all_results[doc_id] = result.copy()
            all_results[doc_id]["combined_score"] = alpha * result["normalized_semantic"]
        
        for result in keyword_results:
            doc_id = result["id"]
            if doc_id in all_results:
                all_results[doc_id]["combined_score"] += (1 - alpha) * result["normalized_keyword"]
                all_results[doc_id]["keyword_matches"] = result.get("keyword_matches", 0)
            else:
                all_results[doc_id] = result.copy()
                all_results[doc_id]["combined_score"] = (1 - alpha) * result["normalized_keyword"]
        
        final_results = list(all_results.values())
        final_results.sort(key=lambda x: x["combined_score"], reverse=True)
        
        return final_results
    
    async def _generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            self.executor,
            self.embedding_model.encode,
            texts
        )
        return embeddings.tolist()
    
    def _add_to_collection(
        self, 
        ids: List[str], 
        embeddings: List[List[float]], 
        metadatas: List[Dict], 
        documents: List[str]
    ):
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
    
    def _search_collection(
        self, 
        query_embedding: List[float], 
        top_k: int, 
        filter_metadata: Optional[Dict[str, Any]]
    ):
        where_clause = filter_metadata if filter_metadata else None
        
        return self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_clause
        )
    
    def _get_all_documents(self, filter_metadata: Optional[Dict[str, Any]]):
        where_clause = filter_metadata if filter_metadata else None
        return self.collection.get(where=where_clause)
    
    async def delete_chunks(self, chunk_ids: List[str]):
        if not chunk_ids:
            return
        
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            self.executor,
            self.collection.delete,
            chunk_ids
        )
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        loop = asyncio.get_event_loop()
        count = await loop.run_in_executor(self.executor, self.collection.count)
        
        return {
            "total_chunks": count,
            "embedding_model": settings.EMBEDDING_MODEL,
            "collection_name": "documents"
        }
