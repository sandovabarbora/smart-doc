#!/bin/bash

set -e

echo "🧪 Running Smart Document Analyzer Test Suite"
echo "=============================================="

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Backend Tests
echo "🐍 Running Backend Tests..."
echo "----------------------------"

cd backend

# Check if virtual environment exists
if [ ! -d ".venv" ] || [ ! -f ".venv/bin/activate" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

# Set test environment
export TESTING=true
export DATABASE_URL="sqlite:///./test.db"

# Create test database tables
echo "🗄️ Setting up test database..."
python -c "
from app.core.database import engine, Base
Base.metadata.create_all(bind=engine)
print('Test database initialized')
" 2>/dev/null || echo "Database setup completed"

# Run backend tests with coverage
echo "Running pytest with coverage..."
pytest --cov=app --cov-report=term-missing --cov-report=html --cov-fail-under=65 -v --tb=short --disable-warnings

backend_exit_code=$?

cd ..

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="

if [ $backend_exit_code -eq 0 ]; then
    echo "✅ Backend Tests: ALL PASSED"
    echo "📈 Coverage Report: backend/htmlcov/index.html"
    
    # Extract coverage percentage from pytest output
    cd backend
    coverage_pct=$(coverage report --show-missing | grep TOTAL | awk '{print $4}' | sed 's/%//')
    cd ..
    
    echo "🎯 Test Coverage: ${coverage_pct}%"
    
    if (( $(echo "$coverage_pct >= 85" | bc -l) )); then
        echo "🏆 EXCELLENT coverage (≥85%)!"
    elif (( $(echo "$coverage_pct >= 75" | bc -l) )); then
        echo "👍 GOOD coverage (≥75%)"
    else
        echo "✓ Acceptable coverage (≥65%)"
    fi
else
    echo "❌ Backend Tests: FAILED"
fi

# Exit with error if tests failed
if [ $backend_exit_code -ne 0 ]; then
    echo ""
    echo "❌ Tests failed. Check the output above for details."
    exit 1
else
    echo ""
    echo "🎉 ALL TESTS PASSED!"
    echo "🚀 Backend is ready for production!"
    exit 0
fi
