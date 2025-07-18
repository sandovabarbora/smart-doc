.PHONY: help install test test-unit test-integration test-coverage setup clean lint format sync

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies with UV
	@echo "📦 Installing dependencies with UV..."
	cd backend && uv venv --python 3.11 && source .venv/bin/activate && uv pip install -e ".[dev]"
	cd frontend && npm install

sync: ## Sync dependencies with UV
	@echo "🔄 Syncing dependencies with UV..."
	cd backend && source .venv/bin/activate && uv pip sync requirements.txt

setup: ## Setup development environment with UV
	@echo "🛠️ Setting up development environment with UV..."
	chmod +x scripts/*.sh
	./scripts/setup_dev.sh

test: ## Run all tests
	@echo "🧪 Running all tests..."
	./scripts/run_tests.sh

test-unit: ## Run only unit tests
	@echo "🧪 Running unit tests..."
	cd backend && source .venv/bin/activate && pytest tests/ -m "not integration" -v
	cd frontend && npm test -- --coverage --watchAll=false

test-integration: ## Run integration tests
	@echo "🔗 Running integration tests..."
	./scripts/test_integration.sh

test-coverage: ## Generate test coverage reports
	@echo "📊 Generating coverage reports..."
	cd backend && source .venv/bin/activate && pytest --cov=app --cov-report=html
	cd frontend && npm run test:coverage
	@echo "Coverage reports generated:"
	@echo "  Backend:  backend/htmlcov/index.html"
	@echo "  Frontend: frontend/coverage/lcov-report/index.html"

lint: ## Run linting
	@echo "🔍 Running linters..."
	cd backend && source .venv/bin/activate && black --check app/ tests/ && flake8 app/ --max-line-length=100
	cd frontend && npm run lint

format: ## Format code
	@echo "✨ Formatting code..."
	cd backend && source .venv/bin/activate && black app/ tests/ && isort app/ tests/
	cd frontend && npm run format

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf backend/htmlcov/
	rm -rf backend/.venv/
	rm -rf frontend/coverage/
	rm -rf frontend/build/

dev: ## Start development servers
	@echo "🚀 Starting development servers..."
	docker-compose up --build

dev-backend: ## Start only backend with UV
	@echo "🐍 Starting backend with UV..."
	cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

prod: ## Deploy to production
	@echo "🚀 Deploying to production..."
	./scripts/deploy_prod.sh

monitor: ## Monitor system status
	@echo "📊 Monitoring system..."
	./scripts/monitor.sh

backup: ## Create system backup
	@echo "💾 Creating backup..."
	./scripts/backup.sh
