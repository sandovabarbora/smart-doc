# Smart Document Analyzer

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![Claude](https://img.shields.io/badge/Claude-3_Sonnet-orange.svg)](https://anthropic.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Advanced RAG-powered document analysis system with comprehensive evaluation framework. Upload documents, ask questions in natural language, and get intelligent responses with source attribution and confidence scoring.

## 🚀 Features

### Core Capabilities
- **Multi-format Document Processing**: PDF, DOCX, TXT, Markdown support
- **Intelligent Chunking**: Context-aware document segmentation
- **Hybrid Search**: Semantic + keyword retrieval for optimal results
- **Advanced RAG Pipeline**: Claude-powered generation with multiple prompt styles
- **Real-time Chat Interface**: Conversational experience with context memory

### RAG & AI Features
- **Multiple Prompt Styles**: Default, Analytical, Concise modes
- **Context Enhancement**: Query refinement based on chat history
- **Source Attribution**: Transparent citation and relevance scoring
- **Confidence Metrics**: AI-generated reliability assessment
- **Performance Tracking**: Detailed timing and quality metrics

### Evaluation & Quality Assurance
- **RAGAS Integration**: Industry-standard RAG evaluation metrics
- **Custom Metrics**: Faithfulness, relevancy, precision, recall
- **Batch Evaluation**: Automated testing on question datasets
- **Performance Analytics**: Response time and quality monitoring
- **Comprehensive Reporting**: Detailed evaluation insights

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI       │    │   ChromaDB      │
│   (React)       │◄──►│   Backend       │◄──►│   Vector Store  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                       ┌───────▼───────┐
                       │   PostgreSQL  │
                       │   (Metadata)  │
                       └───────────────┘
```

### Core Components

**Document Processor**
- Multi-format text extraction with error handling
- Intelligent preprocessing and metadata extraction
- Asynchronous chunking with configurable overlap

**Vector Store (ChromaDB)**
- Efficient embedding storage and retrieval
- Hybrid search combining semantic and keyword matching
- Configurable similarity thresholds

**RAG Engine**
- Context-aware query enhancement
- Multiple generation strategies
- Confidence scoring and source attribution

**Evaluation Service**
- RAGAS metrics integration
- Custom evaluation algorithms
- Automated batch processing

## 🛠️ Tech Stack

**Backend**
- FastAPI (async Python web framework)
- SQLAlchemy + PostgreSQL (data persistence)
- ChromaDB (vector embeddings)
- Anthropic Claude API (LLM)
- Sentence-Transformers (embeddings)
- RAGAS (evaluation framework)

**Infrastructure**
- Docker + Docker Compose
- Alembic (database migrations)
- Pytest (testing)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Anthropic API key
- 8GB+ RAM recommended

### 1. Clone and Setup
```bash
git clone <repository-url>
cd smart-doc-analyzer
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` with your API keys:
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Verify Installation
```bash
curl http://localhost:8000/health
```

Access the API documentation at `http://localhost:8000/docs`

## 📖 API Usage

### Document Management
```bash
# Upload document
curl -X POST "http://localhost:8000/api/v1/documents/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf"

# List documents
curl "http://localhost:8000/api/v1/documents/"

# Get document details
curl "http://localhost:8000/api/v1/documents/1"
```

### Chat Interface
```bash
# Send message
curl -X POST "http://localhost:8000/api/v1/chat/" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the key findings?",
    "prompt_style": "analytical",
    "search_type": "hybrid"
  }'

# Get chat history
curl "http://localhost:8000/api/v1/chat/sessions/{session_id}/messages"
```

### Evaluation
```bash
# Single evaluation
curl -X POST "http://localhost:8000/api/v1/evaluation/single" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the main topic?",
    "ground_truth": "Expected answer"
  }'

# Batch evaluation
curl -X POST "http://localhost:8000/api/v1/evaluation/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Batch",
    "questions": [
      {"question": "Q1", "ground_truth": "A1"},
      {"question": "Q2", "ground_truth": "A2"}
    ]
  }'
```

## ⚙️ Configuration

### RAG Parameters
```python
CHUNK_SIZE = 1000              # Document chunk size
CHUNK_OVERLAP = 200            # Overlap between chunks
TOP_K_RETRIEVAL = 5            # Retrieved chunks per query
SIMILARITY_THRESHOLD = 0.7     # Minimum similarity score
```

### Model Configuration
```python
DEFAULT_MODEL = "claude-3-sonnet-20240229"  # Claude model
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
```

### File Upload Limits
```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB max
ALLOWED_EXTENSIONS = ["pdf", "docx", "txt", "md"]
```

## 📊 Evaluation Metrics

### RAGAS Metrics
- **Faithfulness**: Answer consistency with source context
- **Answer Relevancy**: Relevance of response to question
- **Context Precision**: Quality of retrieved information
- **Context Recall**: Coverage of relevant information

### Performance Metrics
- **Retrieval Time**: Document search latency
- **Generation Time**: Response generation duration
- **Total Time**: End-to-end response time
- **Confidence Score**: AI-assessed answer reliability

## 🧪 Development

### Local Development
```bash
# Backend only
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# With auto-reload
python run_dev.py
```

### Database Management
```bash
# Create migration
cd backend
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Reset database
alembic downgrade base
alembic upgrade head
```

### Testing
```bash
cd backend
pytest
pytest -v  # verbose output
pytest tests/test_specific.py  # specific test
```

## 🚀 Production Deployment

### Environment Setup
1. Set production SECRET_KEY
2. Configure production database
3. Set up SSL/HTTPS
4. Configure monitoring
5. Set up log rotation

### Cloud Deployment
```bash
# Build production image
docker build -t smart-doc-analyzer:prod ./backend

# Deploy to cloud platform
# (Adapt for your platform: AWS, GCP, Azure, etc.)
```

### Performance Optimization
- Enable database connection pooling
- Configure Redis caching for vector store
- Set up CDN for static assets
- Monitor memory usage and scaling

## 📈 Monitoring

### Health Checks
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/documents/
```

### Key Metrics to Track
- Query success rate and latency
- Document processing success rate
- Vector store performance
- API response times
- Error rates and types

### Logging
- Application logs: `/app/logs/`
- Database logs: PostgreSQL logs
- Vector store logs: ChromaDB logs

## 🔧 Troubleshooting

### Common Issues

**Document processing fails**
```bash
# Check file format and size
# Verify upload directory permissions
# Monitor disk space
```

**Vector search returns no results**
```bash
# Verify embeddings are generated
# Check similarity threshold settings
# Validate query preprocessing
```

**Slow response times**
```bash
# Monitor Claude API latency
# Check vector store index size
# Verify database query performance
# Review chunk size configuration
```

**Memory issues**
```bash
# Monitor embedding model memory usage
# Check ChromaDB memory consumption
# Review concurrent request limits
```

### Debug Mode
```bash
# Enable detailed logging
export LOG_LEVEL=DEBUG

# Run with debug output
uvicorn app.main:app --reload --log-level debug
```

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Implement with tests
4. Run evaluation suite
5. Submit pull request

### Code Standards
- Type hints for all functions
- Docstrings for public methods
- Unit tests for core components
- Integration tests for API endpoints

## 📋 Roadmap

### Current (v1.0)
- [x] Core RAG functionality
- [x] Document processing pipeline
- [x] Evaluation framework
- [x] REST API endpoints

### Next (v1.1)
- [ ] Frontend implementation
- [ ] Advanced search filters
- [ ] Multi-language support
- [ ] Streaming responses

### Future (v2.0)
- [ ] Fine-tuning capabilities
- [ ] Analytics dashboard
- [ ] Multi-tenant support
- [ ] Plugin architecture

## 📄 License

MIT License - see LICENSE file for details.

---

**Smart Document Analyzer** - Transform how you work with documents using AI.