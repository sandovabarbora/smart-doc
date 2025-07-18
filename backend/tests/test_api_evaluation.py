# backend/tests/test_api_evaluation.py
import pytest
from fastapi import status

def test_evaluate_single_query(client):
    """Test single query evaluation"""
    response = client.post(
        "/api/v1/evaluation/single",
        json={
            "question": "What is the main topic?",
            "ground_truth": "Test topic"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["question"] == "What is the main topic?"
    assert "metrics" in data
    assert "faithfulness" in data["metrics"]

def test_evaluate_single_query_no_ground_truth(client):
    """Test single query evaluation without ground truth"""
    response = client.post(
        "/api/v1/evaluation/single",
        json={"question": "What is this about?"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["question"] == "What is this about?"
    assert data["ground_truth"] is None

def test_list_evaluation_batches(client):
    """Test listing evaluation batches"""
    response = client.get("/api/v1/evaluation/batches")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)

def test_get_test_dataset(client):
    """Test getting test dataset"""
    response = client.get("/api/v1/evaluation/test-dataset")
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "question" in data[0]
    assert "ground_truth" in data[0]
