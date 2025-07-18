#!/bin/bash

set -e

echo "🧪 Running Smart Document Analyzer Test Suite with UV"
echo "===================================================="

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Backend Tests with UV
echo "🐍 Running Backend Tests with UV..."
echo "-----------------------------------"

cd backend

# Activate UV virtual environment
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment with UV..."
    uv venv --python 3.11
fi

source .venv/bin/activate

# Install dependencies if needed
if [ ! -f ".venv/pyvenv.cfg" ] || [ ! -d ".venv/lib" ]; then
    echo "📚 Installing dependencies with UV..."
    uv pip install -e ".[dev]"
fi

# Set test environment
export TESTING=true
export DATABASE_URL="sqlite:///./test.db"

# Run backend tests with coverage
echo "Running pytest with coverage..."
pytest --cov=app --cov-report=term-missing --cov-report=html --cov-fail-under=85 -v

backend_exit_code=$?

cd ..

# Frontend Tests
echo ""
echo "⚛️  Running Frontend Tests..."
echo "----------------------------"

cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Run frontend tests with coverage
echo "Running Jest with coverage..."
npm run test:coverage

frontend_exit_code=$?

cd ..

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="

if [ $backend_exit_code -eq 0 ]; then
    echo "✅ Backend Tests: PASSED"
else
    echo "❌ Backend Tests: FAILED"
fi

if [ $frontend_exit_code -eq 0 ]; then
    echo "✅ Frontend Tests: PASSED"
else
    echo "❌ Frontend Tests: FAILED"
fi

# Coverage Reports
echo ""
echo "📈 Coverage Reports:"
echo "Backend:  backend/htmlcov/index.html"
echo "Frontend: frontend/coverage/lcov-report/index.html"

# Exit with error if any tests failed
if [ $backend_exit_code -ne 0 ] || [ $frontend_exit_code -ne 0 ]; then
    echo ""
    echo "❌ Some tests failed. Check the output above for details."
    exit 1
else
    echo ""
    echo "🎉 All tests passed!"
    exit 0
fi
