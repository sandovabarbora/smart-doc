#!/bin/bash

set -e

echo "🛠️ Setting up Smart Document Analyzer for development..."

# Check Python version
if ! python3 --version | grep -q "3.1[1-9]"; then
    echo "❌ Python 3.11+ required"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env from template..."
    cp .env.example .env
    echo "✏️ Please edit .env with your API keys"
fi

# Setup backend
echo "🐍 Setting up Python backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "🔄 Activating virtual environment..."
source venv/bin/activate

echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

echo "🗄️ Starting PostgreSQL (if not running)..."
if ! pg_isready -h localhost -p 5432 2>/dev/null; then
    echo "🐘 Please start PostgreSQL manually or use Docker:"
    echo "   docker-compose up -d postgres"
fi

cd ..

echo "✅ Development setup complete!"
echo ""
echo "🚀 To start development:"
echo "   Backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "   Or use: python run_dev.py"
echo ""
echo "📖 API Documentation: http://localhost:8000/docs"
