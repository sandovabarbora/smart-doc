#!/bin/bash

set -e

echo "🔗 Running Integration Tests"
echo "============================="

# Start services
echo "🚀 Starting test environment..."
docker-compose -f docker-compose.test.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health checks
echo "🏥 Running health checks..."
timeout 60 bash -c "until curl -f http://localhost:8000/health; do sleep 5; done" || {
    echo "❌ Backend health check failed"
    docker-compose -f docker-compose.test.yml logs backend
    exit 1
}

echo "✅ Backend is healthy"

# Run integration tests
echo "🧪 Running integration tests..."

# Test document upload and processing
echo "📄 Testing document upload..."
response=$(curl -s -w "%{http_code}" -o /tmp/upload_response.json \
    -X POST "http://localhost:8000/api/v1/documents/upload" \
    -F "file=@README.md")

if [[ "$response" -eq 200 ]]; then
    echo "✅ Document upload successful"
else
    echo "❌ Document upload failed with status $response"
    cat /tmp/upload_response.json
    exit 1
fi

# Test chat functionality
echo "💬 Testing chat functionality..."
chat_response=$(curl -s -w "%{http_code}" -o /tmp/chat_response.json \
    -X POST "http://localhost:8000/api/v1/chat/" \
    -H "Content-Type: application/json" \
    -d '{"message": "What is this project about?"}')

if [[ "$chat_response" -eq 200 ]]; then
    echo "✅ Chat functionality working"
else
    echo "❌ Chat failed with status $chat_response"
    cat /tmp/chat_response.json
    exit 1
fi

# Test evaluation
echo "📊 Testing evaluation..."
eval_response=$(curl -s -w "%{http_code}" -o /tmp/eval_response.json \
    -X POST "http://localhost:8000/api/v1/evaluation/single" \
    -H "Content-Type: application/json" \
    -d '{"question": "Test question", "ground_truth": "Test answer"}')

if [[ "$eval_response" -eq 200 ]]; then
    echo "✅ Evaluation working"
else
    echo "❌ Evaluation failed with status $eval_response"
    cat /tmp/eval_response.json
    exit 1
fi

# Cleanup
echo "🧹 Cleaning up..."
docker-compose -f docker-compose.test.yml down -v

echo "🎉 All integration tests passed!"
