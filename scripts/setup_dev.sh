#!/bin/bash

set -e

echo "🛠️ Setting up Smart Document Analyzer with UV..."

# Check if UV is installed
if ! command -v uv &> /dev/null; then
    echo "📦 Installing UV..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env from template..."
    cp .env.example .env
    echo "✏️ Please edit .env with your API keys"
fi

# Setup backend with UV
echo "🐍 Setting up Python backend with UV..."
cd backend

# Create virtual environment and install dependencies
echo "📦 Creating virtual environment and installing dependencies..."
uv venv --python 3.11
source .venv/bin/activate
uv pip install -e ".[dev]"

echo "🗄️ Starting services check..."
if ! pg_isready -h localhost -p 5432 2>/dev/null; then
    echo "🐘 PostgreSQL not running. Starting with Docker:"
    echo "   docker-compose up -d postgres"
    echo "   Or use SQLite (already configured)"
fi

cd ..

echo "✅ Development setup complete with UV!"
echo ""
echo "🚀 To start development:"
echo "   cd backend && source .venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "📖 API Documentation: http://localhost:8000/docs"
