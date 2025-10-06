# Project Structure

## Teacher Assistant - Architecture & Directory Structure

This document provides a comprehensive overview of the project's architecture, directory structure, and technical organization.

---

## High-Level Architecture

The Teacher Assistant application follows a modern **client-server architecture** with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  External       │
│   (React SPA)   │◄──►│  (Express API)  │◄──►│  Services       │
│                 │    │                 │    │                 │
│ • React + TS    │    │ • Node.js + TS  │    │ • InstantDB     │
│ • Vite Build    │    │ • Express       │    │ • OpenAI API    │
│ • Tailwind CSS  │    │ • Winston       │    │ • GitHub Actions│
│ • InstantDB     │    │ • Rate Limiting │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Communication Flow:
1. **User Authentication**: Frontend ↔ InstantDB (magic-link auth)
2. **Chat Messages**: Frontend → Backend → OpenAI API → Backend → Frontend
3. **Real-time Updates**: Frontend ↔ InstantDB (WebSocket connections)
4. **State Management**: Client-side with React Context + InstantDB sync

---

## Complete Directory Structure

```
teacher-assistant/                          # Root project directory
├── .github/                               # GitHub-specific configurations
│   └── workflows/                         # CI/CD pipeline definitions
│       ├── ci.yml                        # Main CI/CD workflow
│       ├── quality.yml                   # Code quality checks
│       └── deploy.yml                    # Deployment automation
├── docs/                                  # Project documentation
│   ├── README.md                         # Main project documentation
│   ├── PRD.md                           # Product Requirements Document
│   ├── implementation-plan.md            # Development phases and status
│   ├── project-structure.md              # This file - architecture docs
│   ├── api-docs/                         # API endpoint documentation
│   │   ├── instantdb.md                 # InstantDB integration docs
│   │   ├── langchain-docu.md            # LangChain integration docs
│   │   ├── open-ai-api.md               # OpenAI API integration
│   │   └── tavily.md                    # Tavily search API docs
│   ├── agent-logs.md                    # Development session logs
│   ├── testing.md                       # Testing strategy and results
│   ├── bug-tracking.md                  # Issue tracking and resolutions
│   ├── todo.md                          # Task management and progress
│   └── ui-ux-docs.md                    # User interface documentation
├── frontend/                              # React frontend application
│   ├── public/                           # Static assets and PWA manifests
│   │   ├── vite.svg                     # Vite logo
│   │   └── index.html                   # HTML entry point
│   ├── src/                             # Source code
│   │   ├── components/                  # Reusable UI components
│   │   │   ├── auth/                    # Authentication components
│   │   │   │   ├── LoginForm.tsx        # Magic-link login form
│   │   │   │   ├── AuthLoading.tsx      # Loading states during auth
│   │   │   │   ├── UserProfile.tsx      # User profile display
│   │   │   │   └── index.ts             # Component exports
│   │   │   ├── Layout/                  # Layout and navigation
│   │   │   │   ├── Layout.tsx           # Main layout wrapper
│   │   │   │   ├── Header.tsx           # Application header
│   │   │   │   ├── Navigation.tsx       # Responsive navigation
│   │   │   │   └── index.ts             # Layout exports
│   │   │   ├── ProtectedRoute.tsx       # Route authentication guard
│   │   │   ├── Dashboard.tsx            # User dashboard component
│   │   │   └── index.ts                 # All component exports
│   │   ├── pages/                       # Route-based page components
│   │   │   ├── Home/                    # Dashboard homepage
│   │   │   │   ├── Home.tsx            # Home page component
│   │   │   │   └── index.ts            # Home exports
│   │   │   ├── Chat/                    # Chat interface
│   │   │   │   ├── Chat.tsx            # Chat page component
│   │   │   │   └── index.ts            # Chat exports
│   │   │   ├── Library/                 # Content library
│   │   │   │   ├── Library.tsx         # Library page component
│   │   │   │   └── index.ts            # Library exports
│   │   │   └── index.ts                 # All page exports
│   │   ├── lib/                         # Utilities and core libraries
│   │   │   ├── instantdb.ts             # InstantDB client configuration
│   │   │   ├── auth-context.tsx         # Authentication context provider
│   │   │   ├── api.ts                   # Backend API client
│   │   │   ├── utils.ts                 # Utility functions
│   │   │   └── index.ts                 # Library exports
│   │   ├── hooks/                       # Custom React hooks
│   │   │   ├── useApi.ts               # API state management hooks
│   │   │   └── index.ts                # Hook exports
│   │   ├── routes/                      # Router configuration
│   │   │   ├── AppRouter.tsx           # Main router component
│   │   │   └── index.ts                # Router exports
│   │   ├── test/                        # Test setup and utilities
│   │   │   └── setup.ts                # Vitest configuration
│   │   ├── App.tsx                      # Root application component
│   │   ├── main.tsx                     # Application entry point
│   │   └── vite-env.d.ts               # Vite TypeScript definitions
│   ├── dist/                            # Production build output
│   ├── node_modules/                    # NPM dependencies
│   ├── package.json                     # NPM configuration and scripts
│   ├── package-lock.json                # Dependency lock file
│   ├── tsconfig.json                    # TypeScript configuration
│   ├── tsconfig.node.json               # Node.js TypeScript config
│   ├── vite.config.ts                   # Vite build configuration
│   ├── vitest.config.ts                 # Vitest test configuration
│   ├── tailwind.config.js               # Tailwind CSS configuration
│   ├── postcss.config.js                # PostCSS configuration
│   ├── eslint.config.js                 # ESLint configuration
│   ├── .prettierrc                      # Prettier configuration
│   ├── .env                            # Environment variables (local)
│   ├── .env.example                    # Environment template
│   └── .gitignore                      # Git ignore patterns
├── backend/                              # Express.js API server
│   ├── src/                            # Source code
│   │   ├── config/                     # Configuration and environment
│   │   │   ├── index.ts               # Main configuration loader
│   │   │   ├── logger.ts              # Winston logging configuration
│   │   │   └── openai.ts              # OpenAI client setup
│   │   ├── middleware/                 # Express middleware
│   │   │   ├── errorHandler.ts        # Global error handling
│   │   │   ├── logger.ts              # HTTP request logging
│   │   │   ├── rateLimiter.ts         # Rate limiting protection
│   │   │   └── validation.ts          # Request validation
│   │   ├── routes/                     # API route definitions
│   │   │   ├── index.ts               # Main router setup
│   │   │   ├── health.ts              # Health check endpoints
│   │   │   └── chat.ts                # Chat completion endpoints
│   │   ├── services/                   # Business logic and integrations
│   │   │   └── chatService.ts         # OpenAI integration service
│   │   ├── types/                      # TypeScript type definitions
│   │   │   └── index.ts               # Shared type interfaces
│   │   ├── test/                       # Test setup and utilities
│   │   │   └── setup.ts               # Jest configuration
│   │   ├── app.ts                      # Express application setup
│   │   └── server.ts                   # Server entry point
│   ├── dist/                           # Compiled JavaScript output
│   ├── logs/                           # Winston log files (production)
│   ├── node_modules/                   # NPM dependencies
│   ├── package.json                    # NPM configuration and scripts
│   ├── package-lock.json               # Dependency lock file
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── jest.config.js                  # Jest testing configuration
│   ├── nodemon.json                    # Development server config
│   ├── .eslintrc.json                  # ESLint configuration
│   ├── .prettierrc.json                # Prettier configuration
│   ├── .prettierignore                 # Prettier ignore patterns
│   ├── .env                           # Environment variables (local)
│   ├── .env.example                   # Environment template
│   └── .gitignore                     # Git ignore patterns
├── tests/                              # End-to-end tests
│   ├── app.spec.ts                     # Frontend E2E tests
│   └── api.spec.ts                     # Backend API E2E tests
├── node_modules/                       # Root-level NPM dependencies
├── package.json                        # Root NPM configuration
├── package-lock.json                   # Root dependency lock
├── playwright.config.ts                # Playwright E2E configuration
└── README.md                          # Project overview (symlink to docs/)
```

---

## Technology Stack & Architecture Decisions

### Frontend Architecture
```
React 19 + TypeScript
├── Vite (Build Tool)
│   ├── Hot Module Replacement
│   ├── TypeScript compilation
│   └── Optimized production builds
├── Tailwind CSS v4 (Styling)
│   ├── Utility-first CSS framework
│   ├── Mobile-first responsive design
│   └── Custom design system
├── React Router v7 (Navigation)
│   ├── Client-side routing
│   ├── Protected routes
│   └── URL-based navigation
├── InstantDB (Authentication & Data)
│   ├── Magic-link authentication
│   ├── Real-time data synchronization
│   └── Offline-capable local storage
└── Vitest (Testing)
    ├── Unit testing with React Testing Library
    ├── Integration testing
    └── Component testing
```

### Backend Architecture
```
Node.js + Express + TypeScript
├── Express.js (Web Framework)
│   ├── RESTful API design
│   ├── Middleware-based architecture
│   └── Route-based organization
├── OpenAI API (AI Integration)
│   ├── GPT-4 chat completions
│   ├── Multiple model support
│   └── Error handling and retries
├── Winston (Logging)
│   ├── Structured JSON logging
│   ├── Multiple log levels
│   └── File and console transports
├── Express Rate Limit (Security)
│   ├── IP-based rate limiting
│   ├── Multiple rate limit tiers
│   └── DoS attack prevention
└── Jest + Supertest (Testing)
    ├── API endpoint testing
    ├── Service layer testing
    └── Integration testing
```

---

## Component Architecture

### Frontend Component Hierarchy
```
App.tsx
├── AuthProvider (Context)
├── AppRouter
    ├── Layout
    │   ├── Header
    │   └── Navigation
    └── Routes
        ├── Home (Dashboard)
        ├── Chat (AI Interface)
        └── Library (Content Management)
```

### Backend Service Architecture
```
server.ts
├── app.ts (Express App)
    ├── Middleware Stack
    │   ├── CORS
    │   ├── Body Parser
    │   ├── Rate Limiter
    │   ├── Request Logger
    │   └── Error Handler
    ├── Route Handlers
    │   ├── /api/health
    │   ├── /api/chat
    │   └── /api/chat/models
    └── Services
        └── ChatService (OpenAI Integration)
```

---

## Data Flow Architecture

### Authentication Flow
1. **User Login**: Frontend → InstantDB magic-link
2. **Email Verification**: User clicks email link → InstantDB auth
3. **Session Management**: InstantDB → Frontend auth context
4. **Route Protection**: ProtectedRoute checks auth state

### Chat Completion Flow
1. **User Input**: Chat component captures message
2. **API Request**: Frontend → Backend /api/chat endpoint
3. **OpenAI Processing**: Backend → OpenAI API → Response
4. **Response Delivery**: Backend → Frontend → UI update
5. **State Persistence**: InstantDB stores chat history

### Error Handling Flow
1. **Error Detection**: Any layer can throw errors
2. **Error Categorization**: Type-specific error handling
3. **User Feedback**: User-friendly error messages
4. **Logging**: Structured logs for debugging
5. **Recovery**: Retry logic where appropriate

---

## API Architecture

### RESTful Endpoint Design
```
/api/
├── health              # GET - Server status
├── chat               # POST - Chat completion
├── chat/models        # GET - Available models
└── chat/health        # GET - AI service status
```

### Request/Response Architecture
- **Request Validation**: express-validator middleware
- **Rate Limiting**: IP-based with multiple tiers
- **Error Responses**: Consistent JSON structure
- **Success Responses**: Standardized format with timestamps
- **CORS Handling**: Frontend domain whitelisting

---

## Testing Architecture

### Test Pyramid Structure
```
E2E Tests (13 tests)
├── Playwright across browsers
├── Full user workflow testing
└── Cross-device responsive testing

Integration Tests (37 tests)
├── Frontend-Backend communication
├── API endpoint testing
└── Authentication flow testing

Unit Tests (39 tests)
├── Component testing (Frontend)
├── Service testing (Backend)
└── Utility function testing
```

### Test Organization
- **Frontend**: Vitest + React Testing Library
- **Backend**: Jest + Supertest + Mocks
- **E2E**: Playwright with real browser automation
- **Coverage**: Comprehensive with quality gates

---

## Development Workflow Architecture

### Local Development
1. **Frontend**: `npm run dev` → Vite dev server (port 5173)
2. **Backend**: `npm run dev` → Nodemon + ts-node (port 3001)
3. **Testing**: `npm run test:all` → All test suites
4. **Quality**: `npm run quality` → Linting + formatting

### Production Build
1. **Frontend**: `npm run build` → Optimized static files
2. **Backend**: `npm run build` → Compiled TypeScript
3. **Testing**: Full test suite validation
4. **Deployment**: GitHub Actions automation

---

## Key Architectural Decisions

### 1. **Monorepo Structure**
- **Frontend + Backend** in single repository
- **Shared documentation** and configuration
- **Coordinated testing** and deployment

### 2. **TypeScript First**
- **Strict type checking** across entire codebase
- **No 'any' types** allowed in production code
- **Interface-driven development** for API contracts

### 3. **Component-Based Frontend**
- **Reusable components** with clear props interfaces
- **Separation of concerns** between UI and business logic
- **Context-based state management** for global state

### 4. **Service-Oriented Backend**
- **Clear separation** between routes, services, and middleware
- **Single responsibility** principle for each service
- **Dependency injection** for testability

### 5. **Security-First Design**
- **Rate limiting** on all endpoints
- **Input validation** for all requests
- **Secure error handling** without information leakage
- **Environment-based configuration** for secrets

### 6. **Testing Strategy**
- **Test pyramid** with unit, integration, and E2E tests
- **Behavior-driven testing** focusing on user workflows
- **Mock-based testing** for external dependencies
- **Continuous testing** in CI/CD pipeline

This architecture provides a **scalable**, **maintainable**, and **production-ready** foundation for the Teacher Assistant application, with clear separation of concerns and comprehensive testing coverage.