# Software Engineer Task (RMS)

Document management system with Google Drive integration, vector search, and RAG-based chat.

## Architecture

**Frontend**: Next.js + React + TypeScript + TailwindCSS
- Component-based architecture with Zustand state management
- OAuth integration and encrypted credential storage
- Real-time file operations with React Query

**Backend**: FastAPI + PostgreSQL + OpenSearch
- 3-layer architecture (Controllers → Services → Repositories)
- OAuth authentication with Google Drive API
- Vector embeddings and document processing pipeline

## Directory Structure

```
├── frontend/                           # Next.js React application
│   ├── src/
│   │   ├── pages/                      # Next.js routing
│   │   │   ├── _app.tsx                  # App wrapper with providers
│   │   │   └── index.tsx                 # Main landing page
│   │   ├── components/                 # UI components
│   │   │   ├── Dashboard.tsx             # Main dashboard interface
│   │   │   ├── FileTable.tsx             # File listing with selection
│   │   │   ├── ConnectorsTab.tsx         # OAuth connector management
│   │   │   └── ChatPlaceholder.tsx       # Future chat interface
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── useRmsFiles.ts            # File operations and state
│   │   │   ├── useConnector.ts           # Connector management
│   │   │   └── useConnectorLogin.ts      # OAuth login flow
│   │   ├── queries/                    # React Query hooks
│   │   │   ├── useBrowse.ts              # File browsing queries
│   │   │   ├── useConnect.ts             # Connector connection
│   │   │   └── useSync.ts                # File synchronization
│   │   ├── lib/                        # Utilities
│   │   │   ├── credentialManager.ts      # Encrypted token storage
│   │   │   ├── authHelper.ts             # Authentication utilities
│   │   │   └── connectors.ts             # Connector definitions
│   │   ├── store/                      # Zustand state management
│   │   │   └── fileStore.ts              # File operations store
│   │   └── types/                      # TypeScript definitions
│   │       └── rms.type.ts               # RMS types
│   └── package.json
│
└── backend/                            # FastAPI application
    ├── app/
    │   ├── controllers/                # API endpoints
    │   │   ├── auth.py                   # OAuth authentication
    │   │   └── home.py                   # Health check
    │   ├── services/                   # Business logic
    │   │   ├── auth.py                   # Authentication orchestration
    │   │   ├── oauth_service.py          # OAuth provider communication
    │   │   └── encryption_service.py     # Token encryption
    │   ├── repositories/               # Database access
    │   │   ├── base.py                   # Base repository with CRUD
    │   │   └── connector.py              # Connector-specific ops
    │   ├── models/                     # SQLModel schemas
    │   │   ├── base.py                   # Base model classes
    │   │   └── connector.py              # Connector database model
    │   ├── config/                     # Database managers
    │   │   ├── postgres_manager.py       # PostgreSQL connection
    │   │   └── opensearch_manager.py     # OpenSearch connection
    │   └── dto/                        # Data Transfer Objects
    ├── db/                             # Database migrations
    └── requirements.txt
```

## Quick Setup

**Frontend** (`cd frontend`)
1. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Dependencies & Run**
   ```bash
   npm install 
   npm run dev 
   ```

**Backend** (`cd backend`)
1. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Virtual Environment**
   ```bash
   python3 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   # OR: poetry install && $(poetry env activate)
   ```

3. **Database & Run**
   ```bash
   docker-compose up -d           # Start PostgreSQL + OpenSearch
   alembic upgrade head           # Apply migrations
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   
   # For schema changes:
   alembic revision --autogenerate -m "Description"
   alembic upgrade head
   ```

## [Current State](https://github.com/linq-rag/linq-rms-task/blob/main/CurrentState.mp4)

- Google Drive OAuth connection established
- Basic file browsing interface
- Secure credential management with AES encryption
- Single user system

## Task Description: RAG service for File Ingestion + Chat 

- **Build upload/sync system**: Google Drive file ingestion with content parsing, metadata extraction, and embedding
- **Implement browse/search functionality**: Frontend file listing, filtering, and vector search across synced document content  
- **Create chat retrieval interface**: RAG system using OpenSearch vectors for document Q&A with LLM integration

## Required Skills

- **Full-stack development**: React, FastAPI, PostgreSQL, OpenSearch, Docker
- **Google Cloud/OAuth ecosystem**: Setup Google Cloud project, configure Google OAuth App with `drive.readonly` scope, use Client ID, Secret, API Key to enable OAuth-based flows
    - https://understandingdata.com/posts/how-to-easily-setup-a-google-cloud-project-with-apis/
    - https://developers.google.com/workspace/guides/create-project
    - https://cloud.google.com/iam/docs/workforce-manage-oauth-app
- **RAG systems**: Vector embeddings, document retrieval, LLM integration

## Evaluation Criteria

- Codebase adaptation and style consistency
- Code organization following DRY principles
- DB Table design for scalability (multiple connectors, nested file structures)
- Efficient data processing pipeline (background tasks, parsing, indexing) 
    - Efficiently utilize both Postgres and Opensearch
    - Optional: Use background services like Celery
- Search accuracy and retrieval system performance