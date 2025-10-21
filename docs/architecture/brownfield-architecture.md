# Teacher Assistant - Brownfield Architecture Document

## Introduction

This document captures the **CURRENT STATE** of the Teacher Assistant codebase as of 2025-10-17, including technical debt, workarounds, and real-world patterns. It serves as a **definitive reference for AI agents** working on enhancements.

**CRITICAL PURPOSE**: This document exists because tasks were frequently marked "complete" but failed in production. Use this as your source of truth to prevent repeating past mistakes.

### Document Scope

Comprehensive documentation of the entire system with special focus on:
- Agent workflow implementation (Agent Confirmation UX - Feature 003)
- Navigation architecture (Ionic tabs - BUG-030 source)
- InstantDB schema patterns (BUG-025 field name mismatches)
- Testing methodology (definition of done issues)

### Change Log

| Date       | Version | Description                          | Author             |
| ---------- | ------- | ------------------------------------ | ------------------ |
| 2025-10-17 | 1.0     | Initial brownfield analysis          | BMad Architect     |

---

## ⚠️ CRITICAL GOTCHAS - READ THIS FIRST

### 1. Navigation Architecture - THREE SYSTEMS (ONLY ONE WORKS)

**THE PROBLEM**: There are THREE navigation systems in the codebase. Using the wrong one causes BUG-030 (page reload instead of SPA navigation).

**THE CORRECT SYSTEM** ✅:
```typescript
// In components: Call navigateToTab from AgentContext
const { navigateToTab } = useAgent();
navigateToTab('chat', { sessionId: 'abc123' });

// This calls: AgentContext.navigateToTab() →
//             onNavigateToTab callback →
//             App.tsx handleTabChange() →
//             Ionic Framework setActiveTab()
```

**WRONG SYSTEMS** ❌ (DO NOT USE):
- ❌ React Router (`useNavigate`) - Installed but NOT wired to Ionic tabs
- ❌ Direct `window.location.href` - Causes page reload (BUG-030)

**Evidence**: `App.tsx:239`, `AgentContext.tsx:390-414`, `AgentResultView.tsx:337-339`

---

### 2. InstantDB Field Names - INCONSISTENT (CAUSES BUG-025)

**THE PROBLEM**: Two different routes use DIFFERENT field names for the same InstantDB relationships.

**CORRECT FIELD NAMES** ✅ (per instant.schema.ts):
```typescript
// For messages entity
session_id: string  // NOT "session"
user_id: string     // NOT "author"
```

**WHERE IT'S CORRECT** ✅:
- `langGraphAgents.ts:517-518` - Uses `session_id` and `user_id`

**WHERE IT'S WRONG** ❌ (BROKEN CODE):
- `imageGeneration.ts:254-255` - Uses `session:` and `author:` (WRONG!)

**WHY THIS MATTERS**: Wrong field names cause:
- Messages not linked to sessions (orphaned data)
- Permission checks fail
- Chat history breaks

**FIX REQUIRED**: `imageGeneration.ts` needs field name correction before production use.

---

### 3. Image Generation Routes - WHICH ONE IS PRODUCTION?

**THE PROBLEM**: THREE different image generation endpoints exist.

**PRODUCTION ROUTE** ✅:
```
POST /api/langgraph/agents/execute
Used by: AgentContext.tsx:188 → apiClient.executeAgent() → api.ts:452
```

**FALLBACK ROUTES** (Deprecated):
- `/api/agents/execute` (imageGeneration.ts) - Labeled "Fallback for broken langGraphAgents"
- `/api/langgraph-agents/image/generate` (langGraphAgents.ts:594) - Enhanced version, unused

**RECOMMENDATION**: Deprecate fallback routes or clearly document when each is used.

---

### 4. Backend Port - MUST BE 3006

**CRITICAL**: The backend MUST run on port 3006, not 3001 or 3003.

**Why 3006**:
- Frontend Vite proxy configured for `localhost:3006` (vite.config.ts:16)
- Backend .env sets PORT=3006
- ApiClient defaults to `localhost:3006/api` (api.ts:20)

**Evidence**:
- `teacher-assistant/backend/.env`: `PORT=3006`
- `teacher-assistant/frontend/vite.config.ts`: `target: 'http://localhost:3006'`

---

### 5. Testing - Visual Features REQUIRE Visual Tests

**THE PROBLEM**: Tasks marked "complete" after `npm test` + `npm run build`, but UI was broken.

**CORRECT TESTING WORKFLOW** for visual features:

1. ✅ `npm run build` - Must pass with 0 TypeScript errors
2. ✅ `npm test` - Unit tests must pass
3. ✅ **Visual E2E Tests** (REQUIRED for UI features):
   ```bash
   # Run with bypass mode
   VITE_TEST_MODE=true npx playwright test --project="Desktop Chrome"
   VITE_TEST_MODE=true npx playwright test --project="Mobile Safari"
   ```
4. ✅ **Manual Verification** (REQUIRED):
   - Chrome Desktop
   - Chrome Mobile (Pixel 9 simulation)
   - Safari Mobile (iPhone simulation)
   - Test ACTUAL visual appearance, not just "it doesn't crash"

**E2E Test Location**: `teacher-assistant/frontend/e2e-tests/*.spec.ts` (80+ test files)

**Evidence**: BUG-026, BUG-028, BUG-030 all caught by E2E tests but missed by unit tests.

---

### 6. Logging - USE WINSTON, NOT console.log

**THE PROBLEM**: Excessive `console.log` everywhere creates noise and isn't production-ready.

**CORRECT LOGGING** ✅:
```typescript
// Backend (Winston already configured)
import { logInfo, logError, logDebug } from '../config/logger';
logInfo('Image generated', { imageId, userId });
logError('DALL-E failed', error);

// Frontend (needs implementation)
import { logger } from '../lib/logger';
logger.info('Agent opened', { agentType, sessionId });
```

**CURRENT STATE** ❌:
- Backend: Mix of Winston and console.log
- Frontend: All console.log (needs Winston integration)

**FILES WITH EXCESSIVE LOGGING**:
- `AgentResultView.tsx` - 50+ console.log statements
- `langGraphAgents.ts` - 100+ console.log statements
- `AgentContext.tsx` - 30+ console.log statements

**ACTION REQUIRED**: Replace console.log with proper logging before production.

---

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

**Frontend Entry Points**:
- `teacher-assistant/frontend/src/App.tsx` - Main app, Ionic tab management
- `teacher-assistant/frontend/src/lib/AgentContext.tsx` - Agent execution state
- `teacher-assistant/frontend/src/lib/api.ts` - Backend API client

**Backend Entry Points**:
- `teacher-assistant/backend/src/server.ts` - Server startup
- `teacher-assistant/backend/src/app.ts` - Express app configuration
- `teacher-assistant/backend/src/routes/index.ts` - Route aggregator

**Configuration Files**:
- `instant.schema.ts` - InstantDB schema (SOURCE OF TRUTH for field names)
- `teacher-assistant/backend/.env` - Backend config (PORT=3006)
- `teacher-assistant/frontend/.env` - Frontend config (VITE_INSTANTDB_APP_ID)

**Key Business Logic**:
- `teacher-assistant/backend/src/routes/langGraphAgents.ts` - Image generation (PRODUCTION)
- `teacher-assistant/frontend/src/components/AgentConfirmationMessage.tsx` - Agent UI
- `teacher-assistant/frontend/src/components/AgentResultView.tsx` - Result display

**Testing**:
- `teacher-assistant/frontend/e2e-tests/` - 80+ Playwright E2E tests
- `playwright.config.ts` - Test configuration (bypass mode)

---

## High Level Architecture

### Technical Summary

**Architecture Type**: Modern full-stack PWA with AI agent system
**Deployment**: Vercel (frontend + serverless functions)
**Key Pattern**: Ionic Framework tabs + React + InstantDB real-time + OpenAI agents

### Actual Tech Stack

| Category         | Technology          | Version   | Notes                                      |
| ---------------- | ------------------- | --------- | ------------------------------------------ |
| **Frontend**     | React               | 19.1.1    | Functional components + hooks              |
|                  | TypeScript          | 5.8.3     | Strict mode enabled                        |
|                  | Vite                | 7.1.7     | Dev server on :5174, proxies to :3006      |
|                  | Tailwind CSS        | 4.1.13    | Primary color: #fb6542 (orange)            |
|                  | Ionic React         | 8.7.6     | Tab navigation system (NOT React Router)   |
|                  | InstantDB React     | 0.21.24   | Real-time queries + auth                   |
| **Backend**      | Node.js             | 18.x      | Express server                             |
|                  | Express             | 5.1.0     | REST API framework                         |
|                  | TypeScript          | 5.9.2     | Type safety                                |
|                  | OpenAI SDK          | 5.23.0    | GPT-4o-mini + DALL-E 3                     |
|                  | Winston             | 3.17.0    | Logging (underutilized)                    |
| **Database**     | InstantDB           | Latest    | Real-time + auth + storage                 |
|                  | Redis (Upstash)     | 7.x       | Agent state (LangGraph checkpoints)        |
| **Testing**      | Vitest              | 3.2.4     | Frontend unit tests                        |
|                  | Playwright          | 1.56.0    | E2E tests (80+ test files)                 |
|                  | Jest                | 30.1.3    | Backend unit tests                         |
| **AI/Agents**    | OpenAI GPT-4o-mini  | Latest    | Chat model                                 |
|                  | DALL-E 3            | Latest    | Image generation                           |
|                  | LangGraph           | 0.4.9     | Agent workflow (not fully utilized)        |

### Repository Structure Reality Check

**Type**: Monorepo
**Package Manager**: npm
**Structure**:
```
eduhu-pwa-prototype/
├── teacher-assistant/
│   ├── frontend/          # React PWA
│   └── backend/           # Express API
├── docs/                  # Comprehensive documentation (200+ files)
├── specs/                 # Active feature specs (SpecKit)
├── .specify/              # Archived specs
├── .bmad-core/            # BMad workflow system
├── instant.schema.ts      # InstantDB schema (ROOT LEVEL)
└── playwright.config.ts   # E2E test config (ROOT LEVEL)
```

**Notable**:
- InstantDB schema at ROOT level (shared by frontend/backend)
- Playwright config at ROOT level (tests frontend)
- Backend and frontend are separate packages with own node_modules

---

## Source Tree and Module Organization

### Frontend Structure (ACTUAL)

```
teacher-assistant/frontend/src/
├── components/               # 50+ React components
│   ├── AgentConfirmationMessage.tsx  # ⚠️ Has OLD + NEW interface (remove OLD)
│   ├── AgentResultView.tsx           # ⚠️ 50+ console.log statements
│   ├── AgentFormView.tsx             # Gemini design form
│   ├── AgentProgressView.tsx         # Progress animation
│   ├── AgentModal.tsx                # Modal container
│   ├── ChatView.tsx                  # Main chat interface
│   ├── LibraryView.tsx               # NOTE: Library.tsx in placeholder state (BUG-020)
│   └── MaterialPreviewModal.tsx      # Image preview modal
├── pages/                    # Page-level components
│   ├── Home/Home.tsx         # Dashboard
│   ├── Chat/Chat.tsx         # Chat page wrapper
│   └── Library/Library.tsx   # Library page wrapper
├── lib/                      # Core utilities
│   ├── AgentContext.tsx      # ⚠️ Agent state management (30+ console.log)
│   ├── api.ts                # ✅ API client (production route: line 452)
│   ├── instantdb.ts          # InstantDB initialization
│   ├── auth-context.tsx      # Authentication hook
│   ├── imageProxy.ts         # S3 CORS proxy helper (BUG-042 fix)
│   ├── materialMappers.ts    # Library data transformers
│   ├── metadataValidator.ts  # JSON validation for metadata
│   └── types.ts              # TypeScript definitions
├── hooks/                    # Custom React hooks (minimal usage)
└── test/                     # Vitest unit tests
```

**Key Modules and Their Purpose**:

- **AgentContext.tsx** (lib/) - Central agent state management
  - Manages modal phases: form → progress → result
  - Communicates with `/api/langgraph/agents/execute`
  - Provides `navigateToTab()` for SPA navigation
  - ⚠️ Contains 30+ console.log statements (needs Winston)

- **api.ts** (lib/) - Backend API client
  - Line 452: `executeAgent()` - Production image generation route
  - Line 20: `API_BASE_URL` defaults to `localhost:3006/api`
  - All responses unwrap `response.data` automatically

- **AgentConfirmationMessage.tsx** (components/) - Agent confirmation UI
  - ⚠️ Supports TWO interfaces: OLD (deprecated) + NEW (Gemini)
  - OLD interface should be removed (user confirmed)
  - NEW interface: lines 46-64

- **AgentResultView.tsx** (components/) - Result display after agent execution
  - ⚠️ 50+ console.log statements (excessive)
  - Lines 337-339: Uses `navigateToTab()` correctly ✅
  - Lines 232-263: Creates chat message with image metadata
  - Debounced navigation (300ms cooldown) to prevent BUG-030

- **Navigation** (App.tsx):
  - ✅ Ionic Framework tabs: `handleTabChange()` at line 239
  - ❌ React Router is installed but NOT used for tab navigation
  - Components MUST use `navigateToTab()` from AgentContext

### Backend Structure (ACTUAL)

```
teacher-assistant/backend/src/
├── routes/                   # API endpoints
│   ├── index.ts              # Route aggregator
│   ├── langGraphAgents.ts    # ✅ PRODUCTION image generation (line 110)
│   ├── imageGeneration.ts    # ❌ FALLBACK with WRONG field names (line 254-255)
│   ├── chat.ts               # ChatGPT integration
│   ├── files.ts              # File upload
│   ├── storageProxy.ts       # S3 CORS proxy (BUG-042 fix)
│   ├── visionTagging.ts      # Automatic image tagging (US5)
│   └── health.ts             # Health checks
├── services/                 # Business logic
│   ├── chatService.ts        # OpenAI GPT integration
│   ├── langGraphAgentService.ts   # Agent workflow execution
│   ├── instantdbService.ts   # InstantDB operations
│   ├── visionService.ts      # GPT-4 Vision tagging
│   └── agentService.ts       # Agent registry
├── agents/                   # LangGraph agent definitions
│   ├── langGraphImageGenerationAgent.ts  # Image generation agent
│   └── imageGenerationAgent.ts           # Legacy agent
├── config/                   # Configuration
│   ├── index.ts              # Environment variables (PORT from .env)
│   ├── openai.ts             # OpenAI client (90s timeout)
│   ├── logger.ts             # Winston configuration
│   └── redis.ts              # Redis (Upstash) connection
├── middleware/               # Request processing
│   ├── rateLimiter.ts        # 30 req/15min per IP
│   ├── validation.ts         # Input validation
│   ├── errorHandler.ts       # Error responses
│   └── logger.ts             # Request logging
├── utils/                    # Utilities
│   └── metadataValidator.ts  # JSON validation (shared with frontend pattern)
├── app.ts                    # Express app setup
└── server.ts                 # Server startup (PORT=3006)
```

**Key Modules and Their Purpose**:

- **langGraphAgents.ts** (routes/) - PRODUCTION IMAGE GENERATION ✅
  - Line 110: `POST /execute` - Main agent execution endpoint
  - Lines 517-518: Uses CORRECT field names (`session_id`, `user_id`)
  - Lines 316-545: Saves to library_materials + creates chat message
  - Lines 402-468: Automatic tagging via Vision API (async, non-blocking)
  - ⚠️ 100+ console.log statements (needs Winston)

- **imageGeneration.ts** (routes/) - FALLBACK ROUTE ❌
  - Line 41: `POST /agents/execute` - Labeled "Fallback for broken langGraphAgents"
  - Lines 254-255: ❌ USES WRONG FIELD NAMES (`session:`, `author:`)
  - **ACTION REQUIRED**: Fix field names or deprecate this route

- **instantdbService.ts** (services/) - InstantDB operations
  - Exports `getInstantDB()` for database access
  - FileStorage.uploadImageFromUrl() - Uploads to S3 with permanent URLs
  - Uses InstantDB Admin SDK with INSTANTDB_ADMIN_TOKEN

- **visionService.ts** (services/) - Automatic image tagging (US5)
  - `tagImage()` - Analyzes image with GPT-4 Vision
  - Generates 5-10 German tags for search
  - Called async from langGraphAgents.ts:402-468

- **config/index.ts** - Environment configuration
  - PORT from .env (default: 3006) ✅
  - Validates required env vars on startup
  - FRONTEND_URL for CORS (localhost:5174 in dev)

---

## Data Models and APIs

### InstantDB Schema (SOURCE OF TRUTH)

**Critical File**: `instant.schema.ts` (ROOT LEVEL)

**Key Entities**:

```typescript
// messages - Chat messages with agent results
messages: {
  content: string,
  role: string,                    // 'user' | 'assistant'
  session_id: string,              // ✅ CORRECT field name (NOT "session")
  user_id: string,                 // ✅ CORRECT field name (NOT "author")
  metadata: json,                  // JSON field for image data, originalParams
  message_index: number,
  timestamp: number,
  is_edited: boolean
}

// library_materials - Saved artifacts (images, worksheets)
library_materials: {
  title: string,
  type: string,                    // 'image' | 'worksheet'
  content: string,                 // Image URL or document content
  description: string,             // Revised prompt or description
  user_id: string,                 // ✅ CORRECT field name
  source_session_id: string,       // Optional link to chat session
  metadata: json,                  // originalParams for regeneration, tags
  tags: string,                    // Deprecated (use metadata.tags now)
  created_at: number,
  is_favorite: boolean
}

// chat_sessions - Chat history
chat_sessions: {
  title: string,
  user_id: string,                 // ✅ CORRECT field name
  message_count: number,
  summary: string,
  created_at: number,
  updated_at: number,
  is_archived: boolean
}
```

**CRITICAL PATTERNS**:

1. **Metadata Field** (messages + library_materials):
   - Type: `json` (stored as JSON, not string)
   - Must be stringified before saving: `JSON.stringify(metadata)`
   - Use `metadataValidator.ts` to validate before saving
   - Structure for image messages:
     ```typescript
     {
       type: 'image',
       image_url: string,
       title: string,
       originalParams: {          // For regeneration
         description: string,
         imageStyle: string,
         learningGroup: string,
         subject: string
       }
     }
     ```

2. **Field Name Consistency**:
   - ✅ Always use: `session_id`, `user_id`, `source_session_id`
   - ❌ Never use: `session`, `author`, `session` (BUG-025)

3. **Permissions** (instant.schema.ts:113-167):
   - `$files` - Public read, authenticated write (for S3 images)
   - `library_materials` - Owner-only access (`auth.id == data.user_id`)
   - `messages` - Owner-only access
   - `chat_sessions` - Owner-only access

### API Specifications

**Base URL**:
- Development: `http://localhost:3006/api`
- Production: `/api` (Vercel serverless)

**Key Endpoints**:

```
POST /api/langgraph/agents/execute        # ✅ PRODUCTION image generation
GET  /api/langgraph/agents/available      # List available agents
GET  /api/langgraph/agents/status         # LangGraph system status

POST /api/agents/execute                  # ❌ FALLBACK (broken field names)

POST /api/chat                            # ChatGPT conversation
GET  /api/chat/health                     # OpenAI connectivity check

POST /api/files/upload                    # File upload (multipart/form-data)

GET  /api/storage-proxy                   # S3 CORS proxy (BUG-042 fix)
  ?url=<InstantDB S3 URL>                 # Returns proxied image

POST /api/vision-tagging                  # Automatic image tagging (US5)
  { imageUrl, context }                   # Returns tags array

GET  /api/health                          # Overall system health
```

**Agent Execution Request** (PRODUCTION format):
```typescript
POST /api/langgraph/agents/execute
{
  agentId: 'image-generation',
  input: {                               // Gemini form format
    description: string,                 // What to generate
    imageStyle: 'realistic' | 'cartoon' | 'illustrative' | 'abstract',
    learningGroup: string,               // Optional grade level
    subject: string                      // Optional subject
  },
  userId: string,                        // REQUIRED for permissions
  sessionId?: string,                    // Optional for chat integration
  confirmExecution: true                 // Must be true to execute
}

Response:
{
  success: true,
  data: {
    image_url: string,                   // Permanent S3 URL
    revised_prompt: string,              // DALL-E revised prompt
    title: string,                       // German title (from ChatGPT)
    library_id: string,                  // UUID in library_materials
    message_id: string,                  // UUID in messages (if sessionId provided)
    originalParams: { ... }              // For regeneration
  }
}
```

---

## Technical Debt and Known Issues

### Critical Technical Debt

1. **imageGeneration.ts - WRONG FIELD NAMES** (Priority: P0)
   - File: `teacher-assistant/backend/src/routes/imageGeneration.ts`
   - Lines 254-255: Uses `session:` and `author:` (WRONG!)
   - Should use: `session_id:` and `user_id:`
   - Impact: Messages not linked to sessions, breaks chat history
   - Fix: Update field names to match schema
   - Status: ❌ BROKEN - Needs immediate fix before production use

2. **Excessive console.log Logging** (Priority: P1)
   - Files affected:
     - `AgentResultView.tsx` - 50+ console.log
     - `langGraphAgents.ts` - 100+ console.log
     - `AgentContext.tsx` - 30+ console.log
   - Impact: Production noise, no log levels, can't filter
   - Fix: Replace with Winston (backend) or implement frontend logger
   - Status: ⚠️ IN PROGRESS - Needs cleanup

3. **Navigation System Confusion** (Priority: P1)
   - Three navigation systems exist:
     - ✅ Ionic tabs (correct)
     - ❌ React Router (installed but unused)
     - ❌ window.location (causes BUG-030)
   - Impact: Developers use wrong system, causes page reloads
   - Fix: Remove React Router or document why it exists
   - Status: ⚠️ DOCUMENTED - React Router can be removed

4. **Backward Compatibility Layers** (Priority: P2)
   - `AgentConfirmationMessage.tsx` supports OLD + NEW interface
   - OLD interface no longer used
   - Fix: Remove OLD interface (lines 54-60, 76-189)
   - Status: ✅ APPROVED FOR REMOVAL - User confirmed

5. **Testing Gaps - Visual Features** (Priority: P0)
   - Pattern: Tasks marked "complete" after `npm test` but UI broken
   - Root cause: No visual verification in DoD
   - Fix: Mandate E2E tests + manual verification for visual features
   - Status: ✅ DOCUMENTED in this document

### Workarounds and Gotchas

1. **Backend Port MUST Be 3006**:
   - Vite proxy hardcoded to `localhost:3006`
   - Changing port breaks frontend-backend communication
   - Evidence: `vite.config.ts:16`, `.env:PORT=3006`

2. **InstantDB Schema at Root Level**:
   - `instant.schema.ts` is at ROOT, not in backend/
   - Shared by both frontend and backend imports
   - Changing schema requires `npx instant-cli push` to sync

3. **Image URLs - Permanent Storage Required**:
   - DALL-E URLs expire in 2 hours
   - Backend MUST upload to InstantDB S3 for permanent storage
   - Uses `InstantDBService.FileStorage.uploadImageFromUrl()`
   - Evidence: `langGraphAgents.ts:135-147`

4. **Agent Context Navigation Callback**:
   - `AgentProvider` MUST receive `onNavigateToTab` callback from App.tsx
   - Without it, falls back to `window.location.href` (causes BUG-030)
   - Wiring: `App.tsx:533` → `AgentProvider` → `AgentContext.navigateToTab()`

5. **Metadata Field - JSON String, Not Object**:
   - InstantDB `metadata` field is type `json`
   - Backend must stringify: `JSON.stringify(metadata)`
   - Frontend receives as string, must parse: `JSON.parse(metadata)`
   - Validator: `metadataValidator.ts:validateAndStringifyMetadata()`

6. **Playwright Bypass Mode**:
   - E2E tests run with `VITE_TEST_MODE=true`
   - This enables bypass mode (no actual API calls in some tests)
   - Real API tests explicitly specify `--project="Real API Tests"`
   - Config: `playwright.config.ts`

7. **Tailwind Primary Color**:
   - Primary orange: `#fb6542` (defined in tailwind.config.js)
   - Gradient: `from-primary-50 to-primary-100`
   - Border: `border-primary-500`
   - Background: `bg-primary-600`
   - DO NOT hardcode colors (BUG-013, BUG-014, BUG-015)

---

## Integration Points and External Dependencies

### External Services

| Service             | Purpose              | Integration Type | Key Files                                    |
| ------------------- | -------------------- | ---------------- | -------------------------------------------- |
| OpenAI GPT-4o-mini  | Chat conversations   | REST API         | `chatService.ts`, `chat.ts`                  |
| OpenAI DALL-E 3     | Image generation     | REST API         | `langGraphImageGenerationAgent.ts`           |
| OpenAI GPT-4 Vision | Image analysis/tags  | REST API         | `visionService.ts`, `visionTagging.ts`       |
| InstantDB           | Database + Auth + S3 | SDK              | `instantdb.ts`, `instantdbService.ts`        |
| Redis (Upstash)     | Agent state          | REST API         | `redis.ts`, `langGraphAgentService.ts`       |

**API Keys Required** (.env):
- `OPENAI_API_KEY` - OpenAI services
- `INSTANTDB_APP_ID` - Database
- `INSTANTDB_ADMIN_TOKEN` - Backend database operations
- `UPSTASH_REDIS_REST_URL` - Redis connection
- `UPSTASH_REDIS_REST_TOKEN` - Redis auth

### Internal Integration Points

**Frontend ↔ Backend**:
- Protocol: REST API over HTTP
- Port: 3006 (development)
- Vite Proxy: `/api/*` → `http://localhost:3006/api/*`
- Authentication: InstantDB session tokens (future)

**Backend ↔ InstantDB**:
- Admin SDK for write operations
- Schema defined in `instant.schema.ts`
- Permissions enforced by InstantDB (auth.id checks)

**Backend ↔ OpenAI**:
- Timeout: 90 seconds (configured in `openai.ts`)
- Rate limiting: 30 req/15min (per IP)
- Models:
  - Chat: `gpt-4o-mini`
  - Images: `dall-e-3`
  - Vision: `gpt-4-vision-preview`

**Frontend ↔ InstantDB**:
- Real-time queries via `@instantdb/react`
- Authentication via magic link
- File storage via `db.storage`
- Public read access for `$files` (images)

---

## Development and Deployment

### Local Development Setup

**ACTUAL STEPS THAT WORK**:

1. **Install Dependencies**:
   ```bash
   # Root level (for Playwright)
   npm install

   # Frontend
   cd teacher-assistant/frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   # Backend: teacher-assistant/backend/.env
   PORT=3006                        # MUST be 3006
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5174
   API_PREFIX=/api
   OPENAI_API_KEY=sk-proj-...
   INSTANTDB_APP_ID=39f14e13-...
   INSTANTDB_ADMIN_TOKEN=578e3067-...
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...

   # Frontend: teacher-assistant/frontend/.env
   VITE_INSTANTDB_APP_ID=39f14e13-...
   VITE_NODE_ENV=development
   VITE_BYPASS_AUTH=true
   VITE_ENABLE_LIBRARY=true
   VITE_ENABLE_PROFILE=true
   VITE_ENABLE_AGENT_UI=true
   ```

3. **Start Development Servers**:
   ```bash
   # Terminal 1 - Backend
   cd teacher-assistant/backend
   npm run dev                      # Runs on :3006

   # Terminal 2 - Frontend
   cd teacher-assistant/frontend
   npm run dev                      # Runs on :5174
   ```

4. **Verify Setup**:
   - Backend health: `http://localhost:3006/api/health`
   - Frontend: `http://localhost:5174`
   - Vite proxy working: Check Network tab for `/api/*` requests

**Known Setup Issues**:
- If backend port isn't 3006, frontend proxy fails (no visible error, just 404s)
- InstantDB requires internet connection (no offline mode)
- OpenAI API key must have DALL-E 3 access

### Build and Deployment Process

**Build Commands**:
```bash
# Frontend
cd teacher-assistant/frontend
npm run build                      # TypeScript compile + Vite build
npm run preview                    # Preview production build

# Backend
cd teacher-assistant/backend
npm run build                      # TypeScript compile to dist/
npm start                          # Run compiled dist/server.js
```

**Deployment**:
- Platform: Vercel
- Frontend: Static build + serverless functions
- Backend: Serverless functions
- Database: InstantDB (hosted)
- Redis: Upstash (hosted)

**Environment Configuration** (Vercel):
- Same env vars as local .env
- `NODE_ENV=production`
- `FRONTEND_URL` set to Vercel domain

---

## Testing Reality

### Current Test Coverage

**Frontend**:
- Unit Tests: Vitest - `npm test`
  - Location: `src/**/*.test.tsx`
  - Coverage: Component-level
- E2E Tests: Playwright - `npm run test:e2e`
  - Location: `e2e-tests/*.spec.ts` (80+ files)
  - Projects:
    - "Desktop Chrome - Chat Agent Testing"
    - "Mobile Safari - Touch Interface Testing"
    - "Mock Tests (Fast)" - With VITE_TEST_MODE=true
    - "Real API Tests (Smoke)" - Actual backend calls

**Backend**:
- Unit Tests: Jest - `npm test`
  - Location: `src/**/*.test.ts`
  - Coverage: Routes, services, utilities
- Integration Tests: Minimal

**Test Execution**:
```bash
# Frontend unit tests
cd teacher-assistant/frontend
npm test                           # Vitest watch mode
npm run test:run                   # Vitest single run

# Frontend E2E tests
npm run test:e2e                   # Mock tests (fast)
npm run test:e2e:real              # Real API tests (slow)

# Backend unit tests
cd teacher-assistant/backend
npm test                           # Jest watch mode
npm run test:ci                    # Jest CI mode with coverage
```

### Definition of Done - MANDATORY CHECKLIST

**For ALL Tasks**:

1. ✅ **Build Clean**:
   ```bash
   npm run build                   # MUST pass with 0 TypeScript errors
   ```

2. ✅ **Unit Tests Pass**:
   ```bash
   npm test                        # All existing tests must pass
   ```

3. ✅ **Visual Verification** (if UI feature):
   ```bash
   # Run E2E tests
   VITE_TEST_MODE=true npx playwright test \
     --project="Desktop Chrome - Chat Agent Testing"

   VITE_TEST_MODE=true npx playwright test \
     --project="Mobile Safari - Touch Interface Testing"

   # Manual verification (REQUIRED)
   # - Chrome Desktop
   # - Chrome Mobile (Pixel 9 DevTools)
   # - Safari Mobile (iPhone DevTools)
   ```

4. ✅ **Session Log Created**:
   - Location: `docs/development-logs/sessions/YYYY-MM-DD/`
   - Must include: Build output, test results, manual verification

**Task is COMPLETE ONLY when**:
- All 4 criteria met
- Session log created
- Feature verified in at least 2 browsers (if visual)

**If Blocked**:
- Task stays in_progress
- Blocker documented in session log
- New task created for blocker resolution

---

## Current Feature Context - Agent Confirmation UX (Feature 003)

### Feature Overview

**Active SpecKit**: `/specs/003-agent-confirmation-ux/`
- spec.md - 6 user stories (4x P1, 2x P2)
- plan.md - Technical implementation
- tasks.md - Task breakdown

**Priority Issues** (all related to definition of done failures):

1. **US1 - Agent Confirmation Card Visibility** (P1):
   - Problem: White card on white background
   - Fix: Orange gradient + border + shadow
   - Component: `AgentConfirmationMessage.tsx`
   - Status: Implementation needed

2. **US2 - Library Navigation after Image Creation** (P1):
   - Problem: "Weiter im Chat" navigates to wrong place
   - Fix: Use `navigateToTab('library')` correctly
   - Component: `AgentResultView.tsx`
   - Related: BUG-030 (navigation architecture)

3. **US3 - Image in Chat History** (P1):
   - Problem: Image not appearing in chat messages
   - Fix: Backend creates message with metadata (DONE in langGraphAgents.ts:507-520)
   - Frontend: Display image thumbnails in ChatView
   - Field names: MUST use `session_id`, `user_id` (not session/author)

4. **US4 - MaterialPreviewModal Content** (P2):
   - Problem: Only title visible, no image/buttons
   - Fix: Modal rendering + scrollability
   - Component: `MaterialPreviewModal.tsx`

5. **US5 - Automatic Image Tagging** (P2):
   - Problem: No search functionality for images
   - Fix: Vision API generates tags async
   - Backend: `visionService.ts`, `visionTagging.ts`
   - Status: Implemented in langGraphAgents.ts:402-468
   - Tags stored in `library_materials.metadata.tags`

6. **US6 - Chat Session Persistence** (P2):
   - Problem: New session after agent use
   - Fix: Keep same sessionId throughout
   - Status: Fixed in BUG-030 resolution

### Files Modified for Feature 003

**Frontend**:
- `AgentConfirmationMessage.tsx` - Visibility fixes (US1)
- `AgentResultView.tsx` - Navigation fixes (US2)
- `ChatView.tsx` - Display image messages (US3)
- `MaterialPreviewModal.tsx` - Content rendering (US4)

**Backend**:
- `langGraphAgents.ts` - Already implements US3, US5, US6
- `visionService.ts` - Image tagging (US5)
- `visionTagging.ts` - Tagging endpoint (US5)

**Schema**:
- No changes needed (metadata already supports tags)

---

## Testing Strategy for Feature 003

### Visual Features Testing (MANDATORY)

**US1 - Agent Confirmation Visibility**:
1. E2E Test: `e2e-tests/agent-confirmation-visibility.spec.ts`
   - Verify background color (orange gradient)
   - Verify border (2px, primary-500)
   - Verify buttons (orange + gray)
   - Screenshot comparison
2. Manual:
   - Chrome Desktop
   - Safari iPhone
   - Pixel 9 Chrome

**US2 - Library Navigation**:
1. E2E Test: `e2e-tests/bug-fixes-2025-10-11-real-api.spec.ts`
   - Already exists, verifies navigation
2. Manual:
   - Click "Weiter im Chat"
   - Verify Library tab active
   - Verify MaterialPreviewModal opens
   - Verify correct image shown

**US3 - Image in Chat**:
1. E2E Test: New test needed
   - Generate image
   - Return to chat
   - Verify thumbnail in chat history
   - Verify message has metadata
2. Manual:
   - Visual check of thumbnail
   - Click thumbnail → opens full size
   - Verify Vision context works (ask about image)

**US4 - Modal Content**:
1. E2E Test: `e2e-tests/storage-verification.spec.ts`
   - Already verifies modal rendering
2. Manual:
   - Open Library
   - Click material
   - Verify all content visible (image, buttons, metadata)
   - Verify scrollable on mobile

**US5 - Automatic Tagging**:
1. Unit Test: Backend test for visionService
2. E2E Test: `e2e-tests/automatic-tagging.spec.ts`
   - Generate image
   - Check library_materials.metadata.tags populated
   - Search by tag
   - Verify image found
3. Manual:
   - Generate multiple images
   - DevTools: Check metadata has tags array
   - Use search (when implemented)

**US6 - Session Persistence**:
1. E2E Test: Covered by BUG-030 tests
2. Manual:
   - Check sessionId in DevTools before agent
   - Check sessionId after agent completes
   - Verify same sessionId throughout

---

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
# Development
cd teacher-assistant/backend && npm run dev      # Backend on :3006
cd teacher-assistant/frontend && npm run dev     # Frontend on :5174

# Building
cd teacher-assistant/frontend && npm run build   # Must pass with 0 errors
cd teacher-assistant/backend && npm run build    # Compiles to dist/

# Testing
cd teacher-assistant/frontend && npm test        # Vitest unit tests
cd teacher-assistant/frontend && npm run test:e2e # Playwright E2E (mock)
cd teacher-assistant/backend && npm test         # Jest unit tests

# Code Quality
cd teacher-assistant/frontend && npm run lint    # ESLint
cd teacher-assistant/frontend && npm run format  # Prettier
cd teacher-assistant/backend && npm run quality  # Type-check + lint + format

# InstantDB Schema
npx instant-cli pull                            # Pull schema from InstantDB
npx instant-cli push                            # Push schema to InstantDB
```

### Debugging and Troubleshooting

**Backend Not Responding**:
1. Check port: `lsof -i :3006` (Mac/Linux) or `netstat -ano | findstr :3006` (Windows)
2. Check .env: Verify PORT=3006
3. Check logs: Console output from `npm run dev`
4. Test directly: `curl http://localhost:3006/api/health`

**Frontend API Calls Failing**:
1. Check Vite proxy config: `vite.config.ts:14-22`
2. Check Network tab: Are `/api/*` requests reaching :3006?
3. Check CORS: Backend must allow `localhost:5174`
4. Check apiClient: `api.ts:19-21` for base URL

**InstantDB Issues**:
1. Schema out of sync: `npx instant-cli pull` then `npx instant-cli push`
2. Permission denied: Check schema permissions (instant.schema.ts:113-167)
3. Field not found: Verify field exists in schema
4. Data not appearing: Check user_id matches auth.id

**E2E Tests Failing**:
1. Check bypass mode: `VITE_TEST_MODE=true` for mock tests
2. Check selectors: Use `data-testid` attributes, not text
3. Check timeouts: Image generation takes 10-20s
4. Screenshots: `playwright show-report` to see visual diffs

**Navigation Issues**:
1. Verify using `navigateToTab()`, not `window.location`
2. Check AgentProvider has `onNavigateToTab` callback
3. Check App.tsx `handleTabChange` wired correctly
4. Use React DevTools to inspect AgentContext state

---

## Document Maintenance

**When to Update This Document**:
- New critical bugs discovered
- Navigation patterns change
- API endpoints added/removed
- InstantDB schema changes
- New technical debt identified
- Definition of done evolves

**Review Schedule**:
- After each major feature completion
- Monthly architecture review
- When new team members join (onboarding)

**Related Documents**:
- `/specs/003-agent-confirmation-ux/` - Current feature spec
- `/docs/quality-assurance/bug-tracking.md` - All resolved bugs
- `/docs/STRUCTURE.md` - Documentation organization
- `/docs/architecture/system-overview.md` - High-level architecture

---

**Document Version**: 1.0
**Last Updated**: 2025-10-17
**Maintained By**: BMad Architect Agent
**Next Review**: After Feature 003 completion
