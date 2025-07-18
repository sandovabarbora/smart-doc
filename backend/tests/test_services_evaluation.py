import pytest
from unittest.mock import AsyncMock, Mock, patch
from app.services.evaluation import EvaluationService, EvaluationResult
from app.services.rag_engine import RAGResponse

@pytest.fixture
def mock_rag_engine():
    engine = AsyncMock()
    engine.query = AsyncMock(return_value=RAGResponse(
        answer="Test answer",
        sources=[],
        retrieval_time=0.1,
        generation_time=0.5,
        total_time=0.6,
        context_used=["Test context"],
        confidence_score=0.8
    ))
    return engine

@pytest.fixture
def evaluation_service(mock_rag_engine):
    with patch('app.services.evaluation.anthropic.AsyncAnthropic') as mock_client:
        mock_response = AsyncMock()
        mock_response.content = [AsyncMock()]
        mock_response.content[0].text = "0.8"
        mock_client.return_value.messages.create = AsyncMock(return_value=mock_response)
        
        service = EvaluationService(mock_rag_engine)
        return service

@pytest.mark.asyncio
async def test_evaluate_single_query(evaluation_service):
    """Test single query evaluation"""
    result = await evaluation_service.evaluate_single_query(
        "What is AI?",
        "AI is artificial intelligence"
    )
    
    assert isinstance(result, EvaluationResult)
    assert result.question == "What is AI?"
    assert result.answer == "Test answer"
    assert result.ground_truth == "AI is artificial intelligence"
    assert 0.0 <= result.faithfulness_score <= 1.0

@pytest.mark.asyncio
async def test_evaluate_single_query_no_ground_truth(evaluation_service):
    """Test evaluation without ground truth"""
    result = await evaluation_service.evaluate_single_query("What is AI?")
    
    assert result.ground_truth is None
    assert result.context_recall_score == 0.0

@pytest.mark.asyncio
async def test_evaluate_faithfulness(evaluation_service):
    """Test faithfulness evaluation"""
    score = await evaluation_service._evaluate_faithfulness(
        "AI is artificial intelligence",
        ["Artificial intelligence (AI) refers to computer systems"]
    )
    
    assert 0.0 <= score <= 1.0

@pytest.mark.asyncio
async def test_evaluate_faithfulness_no_context(evaluation_service):
    """Test faithfulness evaluation with no context"""
    score = await evaluation_service._evaluate_faithfulness("Some answer", [])
    
    assert score == 0.0

@pytest.mark.asyncio
async def test_evaluate_answer_relevancy(evaluation_service):
    """Test answer relevancy evaluation"""
    score = await evaluation_service._evaluate_answer_relevancy(
        "What is AI?",
        "AI is artificial intelligence"
    )
    
    assert 0.0 <= score <= 1.0

@pytest.mark.asyncio
async def test_evaluate_context_precision(evaluation_service):
    """Test context precision evaluation"""
    score = await evaluation_service._evaluate_context_precision(
        "What is AI?",
        ["AI is artificial intelligence", "Machine learning is a subset of AI"]
    )
    
    assert 0.0 <= score <= 1.0

@pytest.mark.asyncio
async def test_evaluate_context_precision_no_context(evaluation_service):
    """Test context precision with no context"""
    score = await evaluation_service._evaluate_context_precision("What is AI?", [])
    
    assert score == 0.0

@pytest.mark.asyncio
async def test_evaluate_context_recall(evaluation_service):
    """Test context recall evaluation"""
    score = await evaluation_service._evaluate_context_recall(
        "AI is artificial intelligence",
        ["Artificial intelligence refers to computer systems"]
    )
    
    assert 0.0 <= score <= 1.0

@pytest.mark.asyncio
async def test_evaluate_context_recall_no_context(evaluation_service):
    """Test context recall with no context or ground truth"""
    score = await evaluation_service._evaluate_context_recall("", [])
    assert score == 0.0
    
    score = await evaluation_service._evaluate_context_recall("Ground truth", [])
    assert score == 0.0

@pytest.mark.asyncio
async def test_custom_evaluation(evaluation_service):
    """Test custom evaluation fallback"""
    mock_rag_response = RAGResponse(
        answer="Test answer",
        sources=[],
        retrieval_time=0.1,
        generation_time=0.5,
        total_time=0.6,
        context_used=["Test context"],
        confidence_score=0.8
    )
    
    result = await evaluation_service._custom_evaluation(
        "Test question",
        mock_rag_response,
        "Expected answer"
    )
    
    assert isinstance(result, EvaluationResult)
    assert result.question == "Test question"

@pytest.mark.asyncio
async def test_evaluation_error_handling(evaluation_service):
    """Test evaluation with API errors"""
    # Mock the client to raise an exception
    evaluation_service.client.messages.create = AsyncMock(side_effect=Exception("API Error"))
    
    # Should fallback to default score
    score = await evaluation_service._evaluate_faithfulness("answer", ["context"])
    assert score == 0.5  # Default fallback

def test_create_test_dataset(evaluation_service):
    """Test creating test dataset"""
    dataset = evaluation_service.create_test_dataset()
    
    assert len(dataset) > 0
    assert all(len(item) == 2 for item in dataset)  # (question, expected_answer) pairs
    assert all(isinstance(item[0], str) and isinstance(item[1], str) for item in dataset)

@pytest.mark.asyncio
async def test_evaluate_batch(evaluation_service, db_session):
    """Test batch evaluation"""
    questions_and_answers = [
        ("What is AI?", "AI is artificial intelligence"),
        ("What is ML?", "ML is machine learning")
    ]
    
    batch = await evaluation_service.evaluate_batch(
        questions_and_answers,
        "Test Batch",
        db_session
    )
    
    assert batch.name == "Test Batch"
    assert batch.total_evaluations >= 0

@pytest.mark.asyncio
async def test_generate_evaluation_report(evaluation_service, db_session):
    """Test generating evaluation report"""
    from app.models.evaluation import EvaluationBatch
    
    # Create a test batch
    batch = EvaluationBatch(
        name="Test Report Batch",
        description="Test batch for reporting",
        model_version="test-model",
        config_snapshot={"test": "config"},
        avg_faithfulness=0.8,
        avg_answer_relevancy=0.9,
        avg_context_precision=0.7,
        avg_context_recall=0.75,
        total_evaluations=2
    )
    db_session.add(batch)
    db_session.commit()
    
    report = await evaluation_service.generate_evaluation_report(batch.id, db_session)
    
    assert "batch_info" in report
    assert "aggregate_metrics" in report
    assert "performance_metrics" in report
    assert "detailed_results" in report
    assert report["batch_info"]["name"] == "Test Report Batch"

@pytest.mark.asyncio
async def test_generate_evaluation_report_not_found(evaluation_service, db_session):
    """Test generating report for non-existent batch"""
    with pytest.raises(ValueError, match="Evaluation batch 999 not found"):
        await evaluation_service.generate_evaluation_report(999, db_session)
