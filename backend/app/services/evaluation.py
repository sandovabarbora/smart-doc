import asyncio
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import json
import numpy as np
from concurrent.futures import ThreadPoolExecutor

import anthropic
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall

from .rag_engine import RAGEngine, RAGResponse
from ..models.evaluation import Evaluation, EvaluationBatch
from ..core.config import settings
from sqlalchemy.orm import Session

@dataclass
class EvaluationResult:
    question: str
    answer: str
    retrieved_context: List[str]
    ground_truth: Optional[str]
    faithfulness_score: float
    answer_relevancy_score: float
    context_precision_score: float
    context_recall_score: float
    retrieval_time: float
    generation_time: float
    total_time: float

class EvaluationService:
    def __init__(self, rag_engine: RAGEngine):
        self.rag_engine = rag_engine
        self.client = anthropic.AsyncAnthropic(
            api_key=settings.ANTHROPIC_API_KEY
        )
        self.executor = ThreadPoolExecutor(max_workers=2)
    
    async def evaluate_single_query(
        self, 
        question: str, 
        ground_truth: Optional[str] = None,
        expected_sources: Optional[List[str]] = None
    ) -> EvaluationResult:
        rag_response = await self.rag_engine.query(question)
        
        evaluation_data = {
            "question": [question],
            "answer": [rag_response.answer],
            "contexts": [rag_response.context_used],
            "ground_truth": [ground_truth] if ground_truth else [rag_response.answer]
        }
        
        dataset = Dataset.from_dict(evaluation_data)
        
        try:
            ragas_result = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self._run_ragas_evaluation,
                dataset
            )
            
            metrics = ragas_result.to_pandas().iloc[0]
            
            return EvaluationResult(
                question=question,
                answer=rag_response.answer,
                retrieved_context=rag_response.context_used,
                ground_truth=ground_truth,
                faithfulness_score=float(metrics.get('faithfulness', 0.0)),
                answer_relevancy_score=float(metrics.get('answer_relevancy', 0.0)),
                context_precision_score=float(metrics.get('context_precision', 0.0)),
                context_recall_score=float(metrics.get('context_recall', 0.0)) if ground_truth else 0.0,
                retrieval_time=rag_response.retrieval_time,
                generation_time=rag_response.generation_time,
                total_time=rag_response.total_time
            )
            
        except Exception as e:
            return await self._custom_evaluation(question, rag_response, ground_truth)
    
    def _run_ragas_evaluation(self, dataset: Dataset):
        metrics_to_use = [faithfulness, answer_relevancy, context_precision]
        
        if dataset['ground_truth'][0] and dataset['ground_truth'][0] != dataset['answer'][0]:
            metrics_to_use.append(context_recall)
            
        return evaluate(dataset, metrics=metrics_to_use)
    
    async def _custom_evaluation(
        self, 
        question: str, 
        rag_response: RAGResponse, 
        ground_truth: Optional[str]
    ) -> EvaluationResult:
        faithfulness_score = await self._evaluate_faithfulness(
            rag_response.answer, rag_response.context_used
        )
        
        relevancy_score = await self._evaluate_answer_relevancy(
            question, rag_response.answer
        )
        
        precision_score = await self._evaluate_context_precision(
            question, rag_response.context_used
        )
        
        recall_score = 0.0
        if ground_truth:
            recall_score = await self._evaluate_context_recall(
                ground_truth, rag_response.context_used
            )
        
        return EvaluationResult(
            question=question,
            answer=rag_response.answer,
            retrieved_context=rag_response.context_used,
            ground_truth=ground_truth,
            faithfulness_score=faithfulness_score,
            answer_relevancy_score=relevancy_score,
            context_precision_score=precision_score,
            context_recall_score=recall_score,
            retrieval_time=rag_response.retrieval_time,
            generation_time=rag_response.generation_time,
            total_time=rag_response.total_time
        )
    
    async def _evaluate_faithfulness(self, answer: str, contexts: List[str]) -> float:
        if not contexts:
            return 0.0
        
        context_text = "\n\n".join(contexts)
        
        prompt = f"""Given the following context and answer, determine if the answer is faithful to the context.
An answer is faithful if it doesn't contradict the context and only uses information present in the context.

Context:
{context_text}

Answer:
{answer}

Rate the faithfulness on a scale of 0.0 to 1.0, where:
- 1.0 = Completely faithful, no contradictions, only uses context information
- 0.5 = Mostly faithful with minor issues
- 0.0 = Contains contradictions or information not in context

Provide only the numeric score (e.g., 0.8):"""

        try:
            response = await self.client.messages.create(
                model=settings.DEFAULT_MODEL,
                max_tokens=50,
                messages=[{"role": "user", "content": prompt}]
            )
            score_text = response.content[0].text.strip()
            return float(score_text)
        except:
            return 0.5
    
    async def _evaluate_answer_relevancy(self, question: str, answer: str) -> float:
        prompt = f"""Evaluate how relevant the following answer is to the given question.

Question:
{question}

Answer:
{answer}

Rate the relevancy on a scale of 0.0 to 1.0, where:
- 1.0 = Perfectly relevant, directly addresses the question
- 0.5 = Somewhat relevant, partially addresses the question
- 0.0 = Not relevant, doesn't address the question

Provide only the numeric score (e.g., 0.8):"""

        try:
            response = await self.client.messages.create(
                model=settings.DEFAULT_MODEL,
                max_tokens=50,
                messages=[{"role": "user", "content": prompt}]
            )
            score_text = response.content[0].text.strip()
            return float(score_text)
        except:
            return 0.5
    
    async def _evaluate_context_precision(self, question: str, contexts: List[str]) -> float:
        if not contexts:
            return 0.0
        
        relevant_count = 0
        total_contexts = len(contexts)
        
        for context in contexts:
            prompt = f"""Is the following context relevant for answering this question?

Question:
{question}

Context:
{context}

Answer with only "yes" or "no":"""
            
            try:
                response = await self.client.messages.create(
                    model=settings.DEFAULT_MODEL,
                    max_tokens=10,
                    messages=[{"role": "user", "content": prompt}]
                )
                answer = response.content[0].text.strip().lower()
                if "yes" in answer:
                    relevant_count += 1
            except:
                continue
        
        return relevant_count / total_contexts if total_contexts > 0 else 0.0
    
    async def _evaluate_context_recall(self, ground_truth: str, contexts: List[str]) -> float:
        if not contexts or not ground_truth:
            return 0.0
        
        context_text = "\n\n".join(contexts)
        
        prompt = f"""Given the ground truth answer and the retrieved contexts, determine what percentage of the ground truth can be supported by the contexts.

Ground Truth:
{ground_truth}

Retrieved Contexts:
{context_text}

Rate the recall on a scale of 0.0 to 1.0, where:
- 1.0 = All information in ground truth is supported by contexts
- 0.5 = About half of the ground truth information is supported
- 0.0 = None of the ground truth information is supported

Provide only the numeric score (e.g., 0.8):"""

        try:
            response = await self.client.messages.create(
                model=settings.DEFAULT_MODEL,
                max_tokens=50,
                messages=[{"role": "user", "content": prompt}]
            )
            score_text = response.content[0].text.strip()
            return float(score_text)
        except:
            return 0.5
    
    async def evaluate_batch(
        self, 
        questions_and_answers: List[Tuple[str, Optional[str]]], 
        batch_name: str,
        db: Session
    ) -> EvaluationBatch:
        batch = EvaluationBatch(
            name=batch_name,
            description=f"Batch evaluation of {len(questions_and_answers)} questions",
            model_version=settings.DEFAULT_MODEL,
            config_snapshot={
                "chunk_size": settings.CHUNK_SIZE,
                "top_k": settings.TOP_K_RETRIEVAL,
                "similarity_threshold": settings.SIMILARITY_THRESHOLD,
                "embedding_model": settings.EMBEDDING_MODEL
            }
        )
        db.add(batch)
        db.flush()
        
        evaluation_tasks = []
        for question, ground_truth in questions_and_answers:
            task = self.evaluate_single_query(question, ground_truth)
            evaluation_tasks.append(task)
        
        results = await asyncio.gather(*evaluation_tasks, return_exceptions=True)
        
        valid_results = []
        for result in results:
            if isinstance(result, EvaluationResult):
                valid_results.append(result)
                
                evaluation = Evaluation(
                    question=result.question,
                    answer=result.answer,
                    retrieved_context=result.retrieved_context,
                    ground_truth=result.ground_truth,
                    faithfulness_score=result.faithfulness_score,
                    answer_relevancy_score=result.answer_relevancy_score,
                    context_precision_score=result.context_precision_score,
                    context_recall_score=result.context_recall_score,
                    retrieval_time=result.retrieval_time,
                    generation_time=result.generation_time,
                    total_time=result.total_time
                )
                db.add(evaluation)
        
        if valid_results:
            batch.avg_faithfulness = np.mean([r.faithfulness_score for r in valid_results])
            batch.avg_answer_relevancy = np.mean([r.answer_relevancy_score for r in valid_results])
            batch.avg_context_precision = np.mean([r.context_precision_score for r in valid_results])
            batch.avg_context_recall = np.mean([r.context_recall_score for r in valid_results if r.context_recall_score > 0])
            batch.total_evaluations = len(valid_results)
        
        db.commit()
        return batch
    
    async def generate_evaluation_report(self, batch_id: int, db: Session) -> Dict[str, Any]:
        batch = db.query(EvaluationBatch).filter(EvaluationBatch.id == batch_id).first()
        if not batch:
            raise ValueError(f"Evaluation batch {batch_id} not found")
        
        evaluations = db.query(Evaluation).filter(Evaluation.created_at >= batch.created_at).all()
        
        report = {
            "batch_info": {
                "name": batch.name,
                "description": batch.description,
                "model_version": batch.model_version,
                "config": batch.config_snapshot,
                "created_at": batch.created_at.isoformat()
            },
            "aggregate_metrics": {
                "faithfulness": batch.avg_faithfulness,
                "answer_relevancy": batch.avg_answer_relevancy,
                "context_precision": batch.avg_context_precision,
                "context_recall": batch.avg_context_recall,
                "total_evaluations": batch.total_evaluations
            },
            "performance_metrics": {
                "avg_retrieval_time": np.mean([e.retrieval_time for e in evaluations if e.retrieval_time]),
                "avg_generation_time": np.mean([e.generation_time for e in evaluations if e.generation_time]),
                "avg_total_time": np.mean([e.total_time for e in evaluations if e.total_time])
            },
            "detailed_results": [
                {
                    "question": e.question,
                    "answer": e.answer,
                    "faithfulness": e.faithfulness_score,
                    "relevancy": e.answer_relevancy_score,
                    "precision": e.context_precision_score,
                    "recall": e.context_recall_score
                }
                for e in evaluations
            ]
        }
        
        return report

    def create_test_dataset(self) -> List[Tuple[str, str]]:
        return [
            ("What is the main topic of the document?", "Expected answer based on document content"),
            ("Can you summarize the key findings?", "Expected summary"),
            ("What are the recommendations mentioned?", "Expected recommendations"),
            ("Who are the main stakeholders discussed?", "Expected stakeholders"),
            ("What is the timeline mentioned in the document?", "Expected timeline")
        ]
