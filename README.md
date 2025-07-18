# Smart Document Analyzer

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![Claude](https://img.shields.io/badge/Claude-4_Sonnet-orange.svg)](https://anthropic.com)
[![React](https://img.shields.io/badge/React-18.2+-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Advanced RAG-powered document analysis system with intelligent chat interface, comprehensive evaluation framework, and modern web UI. Upload documents, ask questions in natural language, and get intelligent responses with source attribution and confidence scoring.

## 🚀 Features

### Core Capabilities
- **Multi-format Document Processing**: PDF, DOCX, TXT, Markdown support with intelligent chunking
- **Advanced RAG Pipeline**: Claude 4 Sonnet-powered generation with multiple prompt styles
- **Hybrid Search**: Semantic + keyword retrieval for optimal results
- **Real-time Chat Interface**: Conversational experience with session management
- **Modern Web UI**: React + TypeScript with Material-UI design system

### AI & RAG Features
- **Multiple Prompt Styles**: Default, Analytical, Concise response modes
- **Context Enhancement**: Query refinement based on chat history
- **Source Attribution**: Transparent citation with relevance scoring
- **Confidence Metrics**: AI-generated reliability assessment
- **Session Management**: Persistent chat histories with message tracking

### Evaluation & Quality Assurance
- **RAGAS Integration**: Industry-standard RAG evaluation metrics
- **Custom Metrics**: Faithfulness, relevancy, precision, recall scoring
- **Batch Evaluation**: Automated testing on question datasets
- **Performance Analytics**: Response time and quality monitoring
- **Interactive Testing**: Single question and batch evaluation interfaces

### Modern UI/UX
- **Dark/Light Theme**: Adaptive design with user preference
- **Responsive Layout**: Mobile-friendly Material-UI components
- **Real-time Updates**: Live document processing and chat updates
- **Animated Transitions**: Smooth user interactions and feedback
- **Dashboard Analytics**: Visual metrics and system health monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React/TS      │    │   FastAPI       │    │   ChromaDB      │
│   Frontend      │◄──►│   Backend       │◄──►│   Vector Store  │
│   (Port 3000)   │    │   (Port 8000)   │    │   (Embeddings)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                       ┌───────▼───────┐
                       │   SQLite DB   │
                       │   (Metadata)  │
                       └───────────────┘
```

### Core Components

**Document Processor**
- Multi-format text extraction (PDF, DOCX, TXT, MD)
- Intelligent preprocessing with metadata extraction
- Asynchronous chunking with configurable overlap
- Error handling and processing status tracking

**Vector Store (ChromaDB)**
- Efficient embedding storage and retrieval
- Hybrid search combining semantic and keyword matching
- Sentence-transformers embeddings
- Configurable similarity thresholds

**RAG Engine**
- Context-aware query enhancement with chat history
- Multiple generation strategies (Default, Analytical, Concise)
- Confidence scoring and source attribution
- Performance timing and metrics

**Chat Service**
- Session-based conversation management
- Real-time message processing
- Source tracking and citation
- Performance monitoring

**Frontend Application**
- Modern React with TypeScript
- Material-UI component library
- React Query for data management
- Responsive design with dark/light themes

## 🛠️ Tech Stack

**Backend**
- FastAPI (async Python web framework)
- SQLAlchemy + SQLite (data persistence)
- ChromaDB (vector embeddings)
- Anthropic Claude 4 Sonnet (LLM)
- Sentence-Transformers (embeddings)
- RAGAS (evaluation framework)
- PyPDF2, python-docx (document processing)

**Frontend**
- React 18 + TypeScript
- Material-UI (MUI) design system
- TanStack React Query (data fetching)
- React Router (navigation)
- React Dropzone (file uploads)

**Infrastructure**
- Docker + Docker Compose
- Alembic (database migrations)
- Pytest (testing)
- Development scripts for setup and monitoring

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Anthropic API key ([get one here](https://console.anthropic.com/))
- 8GB+ RAM recommended

### 1. Clone and Setup
```bash
git clone <repository-url>
cd smart-doc-analyzer
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` with your API key:
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Start Services
```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start with logs visible
docker-compose up
```

### 4. Access the Application
- **Web Interface**: `http://localhost:3000`
- **API Documentation**: `http://localhost:8000/docs`
- **API Health Check**: `http://localhost:8000/health`

## 📖 Usage Guide

### Document Management
1. **Upload Documents**: Drag & drop or click to upload PDF, DOCX, TXT, or MD files
2. **Processing**: Documents are automatically processed and chunked for AI analysis
3. **Status Tracking**: Monitor processing status and view document statistics

### Chat Interface
1. **Start Conversation**: Click "New Chat" to begin
2. **Ask Questions**: Type questions about your uploaded documents
3. **Response Styles**: Choose between Default, Analytical, or Concise responses
4. **View Sources**: Expand source citations to see relevant document chunks
5. **Session History**: Access previous conversations from the sidebar

### Evaluation Tools
1. **Single Question Test**: Test individual questions with optional expected answers
2. **Batch Evaluation**: Run multiple questions and get aggregated metrics
3. **Performance Metrics**: View faithfulness, relevancy, precision, and recall scores
4. **Response Analysis**: Monitor AI response times and quality

### Dashboard Analytics
- **Document Statistics**: Track upload counts, processing rates, and storage usage
- **Chat Metrics**: Monitor conversation activity and engagement
- **System Health**: Real-time status monitoring and performance metrics

## ⚙️ Configuration

### Environment Variables
```bash
# AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
DEFAULT_MODEL=claude-3-sonnet-20240229

# RAG Parameters
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RETRIEVAL=5
SIMILARITY_THRESHOLD=0.7

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads

# Vector Store
CHROMA_PERSIST_DIRECTORY=./chroma_db
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Security
SECRET_KEY=your-secret-key-change-in-production
```

### Model Configuration
The system uses Claude 4 Sonnet by default. You can modify the model in `backend/app/core/config.py`:
```python
DEFAULT_MODEL = "claude-3-sonnet-20240229"
```

### Frontend Configuration
React app configuration in `frontend/package.json` and environment:
```json
{
  "proxy": "http://localhost:8000"
}
```

## 🧪 Development

### Local Development Setup
```bash
# Run setup script
chmod +x scripts/setup_dev.sh
./scripts/setup_dev.sh

# Manual setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start backend
uvicorn app.main:app --reload

# In another terminal, start frontend
cd frontend
npm install
npm start
```

### Backend Development
```bash
cd backend

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Frontend Development
```bash
cd frontend

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### API Endpoints

#### Documents
- `POST /api/v1/documents/upload` - Upload document
- `GET /api/v1/documents/` - List documents
- `DELETE /api/v1/documents/{id}` - Delete document

#### Chat
- `POST /api/v1/chat/` - Send message
- `GET /api/v1/chat/sessions` - List chat sessions
- `GET /api/v1/chat/sessions/{id}/messages` - Get session messages
- `DELETE /api/v1/chat/sessions/{id}` - Delete session

#### Evaluation
- `POST /api/v1/evaluation/single` - Single question evaluation
- `GET /api/v1/evaluation/batches` - List evaluation batches
- `GET /api/v1/evaluation/test-dataset` - Get test questions

## 📊 Monitoring & Operations

### Health Monitoring
```bash
# Check system status
./scripts/monitor.sh

# Manual health check
curl http://localhost:8000/health
```

### Backup & Recovery
```bash
# Create backup
./scripts/backup.sh

# Backup includes:
# - SQLite database
# - ChromaDB vector store
# - Uploaded files
# - Configuration
```

### Production Deployment
```bash
# Deploy to production
./scripts/deploy_prod.sh production your-domain.com

# Monitor production
./scripts/monitor.sh
```

## 🔧 Troubleshooting

### Common Issues

**Document processing fails**
- Check file format and size (max 10MB)
- Verify upload directory permissions
- Monitor disk space and memory usage

**Vector search returns no results**
- Ensure documents are processed successfully
- Check similarity threshold settings
- Verify embedding model is loaded

**Frontend connection issues**
- Confirm backend is running on port 8000
- Check CORS settings in backend
- Verify proxy configuration in package.json

**Slow response times**
- Monitor Claude API latency
- Check vector store index size
- Review chunk size configuration
- Verify memory and CPU usage

### Debug Mode
```bash
# Enable detailed logging
export LOG_LEVEL=DEBUG

# Run backend with debug output
cd backend
uvicorn app.main:app --reload --log-level debug
```

### Performance Optimization
- **Database**: Use PostgreSQL for production (see config backup)
- **Caching**: Implement Redis for vector store caching
- **Scaling**: Use horizontal scaling for multiple instances
- **Memory**: Monitor embedding model memory usage

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Run evaluation suite
5. Submit pull request

### Code Standards
- **Python**: Type hints, docstrings, Black formatting
- **TypeScript**: Strict mode, proper component types
- **Testing**: Unit tests for core components
- **Documentation**: Update README for new features

### Project Structure
```
smart-doc-analyzer/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration
│   │   ├── models/         # Database models
│   │   └── services/       # Business logic
│   ├── tests/              # Backend tests
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # API client
│   │   └── types/          # TypeScript types
│   └── package.json
├── scripts/                # Deployment scripts
├── docker-compose.yml      # Container orchestration
└── .env.example           # Environment template
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- [ChromaDB](https://www.trychroma.com/) for vector storage
- [Material-UI](https://mui.com/) for React components
- [RAGAS](https://github.com/explodinggradients/ragas) for evaluation framework

---

**Smart Document Analyzer** - Transform how you work with documents using AI-powered analysis and natural language conversations.