from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ...core.database import get_db

router = APIRouter()

class EvaluationRequest(BaseModel):
    question: str
    ground_truth: Optional[str] = None

@router.post("/single", response_model=Dict[str, Any])
async def evaluate_single_query(request: EvaluationRequest):
    # Mock evaluation for now
    return {
        "question": request.question,
        "answer": "This is a sample answer for demonstration purposes.",
        "ground_truth": request.ground_truth,
        "metrics": {
            "faithfulness": 0.85,
            "answer_relevancy": 0.92,
            "context_precision": 0.78,
            "context_recall": 0.88,
        },
        "performance": {
            "retrieval_time": 0.234,
            "generation_time": 1.567,
            "total_time": 1.801,
        },
        "retrieved_context": ["Sample context for demonstration"]
    }

@router.get("/batches", response_model=List[Dict[str, Any]])
async def list_evaluation_batches(db: Session = Depends(get_db)):
    # Mock data
    return [
        {
            "id": 1,
            "name": "Sample Batch",
            "total_evaluations": 5,
            "avg_faithfulness": 0.84,
            "avg_answer_relevancy": 0.89,
            "created_at": "2025-07-18T10:00:00"
        }
    ]

@router.get("/test-dataset", response_model=List[Dict[str, str]])
async def get_test_dataset():
    return [
        {"question": "What is the main topic?", "ground_truth": "Expected answer"},
        {"question": "Who are the stakeholders?", "ground_truth": "Expected stakeholders"},
    ]
