# Implementation Plan: Agent Confirmation UX + Auto-Tagging

**Branch**: `003-agent-confirmation-ux` | **Date**: 2025-10-14 | **Spec**: [spec.md](./spec.md)

## Summary

This feature fixes 6 critical UX issues in the agent confirmation workflow and implements automatic image tagging via ChatGPT Vision API:

1. **Agent Confirmation Card Visibility (P1)**: Fix white-on-white rendering by enhancing contrast with shadows and rings
2. **Library Navigation (P1)**: Navigate to Library with auto-opened MaterialPreviewModal after image creation
3. **Chat History Integration (P1)**: Display generated images as thumbnails in chat with Vision API context
4. **MaterialPreviewModal Content (P2)**: Fix content rendering to show full image preview and buttons
5. **Automatic Tagging (P2)**: Generate 5-10 searchable tags per image via GPT-4o Vision API
6. **Session Persistence (P2)**: Maintain chat session ID across agent workflows (no new sessions)

**Technical Approach**:
- Use existing Tailwind classes with enhanced contrast (shadows, rings)
- Extend existing `navigate-library-tab` custom event pattern with materialId parameter
- Integrate OpenAI GPT-4o Vision API for background tagging (non-blocking)
- Store metadata as JSON strings in existing InstantDB fields (no schema migration)
- Pass sessionId through AgentContext to preserve chat continuity

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**:
- Frontend: React 18.2, Vite 4.x, Tailwind CSS 3.4, Ionic 8.x, InstantDB React SDK
- Backend: Node.js 18+, Express 4.x, OpenAI SDK 4.x, InstantDB Node SDK

**Storage**: InstantDB (real-time sync, JSON metadata fields in messages and library_materials tables)
**Testing**:
- Frontend: Vitest for unit tests, Playwright for E2E tests
- Backend: Jest for unit tests, Supertest for integration tests

**Target Platform**:
- Web: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Mobile: iOS 13+ (Safari, WKWebView), Android 8+ (Chrome)
- PWA-enabled (offline-capable with service worker)

**Project Type**: Web application (full-stack)
**Performance Goals**:
- Agent Confirmation Card render: <100ms
- Library navigation + modal open: <500ms
- Vision API tagging: <5 seconds (non-blocking, async)
- Chat message rendering: <50ms per message

**Constraints**:
- Vision API timeout: 30 seconds (hard limit, graceful degradation)
- OpenAI cost: ~$0.01 per image tagging (GPT-4o vision)
- Rate limiting: 100 tagging requests/hour per user
- No breaking changes to existing InstantDB schema
- Backward compatible with existing messages (metadata optional)

**Scale/Scope**:
- Expected users: 100-500 teachers (MVP phase)
- Images per day: 50-200
- Chat messages per session: 10-50 average
- Library materials per user: 20-100 items

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle 1: TypeScript Everywhere ✅ PASS

- All new code is TypeScript with strict mode
- Interfaces defined for metadata structures (MessageMetadata, LibraryMaterialMetadata)
- Type guards for message type discrimination
- No `any` types without explicit justification

### Principle 2: Functional Components with Hooks ✅ PASS

- AgentConfirmationMessage uses functional component pattern
- Hooks: useState, useEffect, useCallback
- No class components introduced
- Custom hooks: useAgent, useLibraryMaterials

### Principle 3: Tailwind CSS for Styling ✅ PASS

- All styling via Tailwind utility classes
- Primary colors already defined in tailwind.config.js (50-900 scale)
- No inline styles except for backward compatibility sections
- Responsive design: sm, md breakpoints for mobile/desktop

### Principle 4: InstantDB for Data Operations ✅ PASS

- All data mutations via db.transact()
- No direct database calls
- Real-time sync for messages and library_materials
- Permissions already defined in schema

### Principle 5: ESLint + Prettier Formatting ✅ PASS

- Existing ESLint rules applied
- Prettier for code formatting
- Pre-commit hooks ensure compliance

### Principle 6: SpecKit Workflow ✅ PASS

- Feature documented in specs/003-agent-confirmation-ux/
- Phase 0 (research.md) completed
- Phase 1 (data-model.md, contracts/, quickstart.md) completed
- Next: Phase 2 (tasks.md via /speckit.tasks)

### Verdict: ✅ ALL CHECKS PASSED - Proceed to implementation

## Project Structure

### Documentation (this feature)

```
specs/003-agent-confirmation-ux/
├── spec.md                          # User stories, requirements, success criteria
├── plan.md                          # This file (technical design)
├── research.md                      # Phase 0: Technical decisions
├── data-model.md                    # Phase 1: Metadata schemas
├── quickstart.md                    # Phase 1: Manual test procedures
├── contracts/                       # Phase 1: API specifications
│   ├── vision-tagging-api.md       # POST /api/vision/tag-image endpoint
│   └── message-creation-contract.md # InstantDB message patterns
└── tasks.md                         # Phase 2: Generated by /speckit.tasks (NOT YET CREATED)
```

### Source Code (repository root)

```
teacher-assistant/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── chat.ts                    # MODIFY: Add vision context building
│   │   │   ├── imageGeneration.ts         # MODIFY: Trigger tagging after image creation
│   │   │   └── visionTagging.ts           # NEW: Vision tagging endpoint
│   │   ├── services/
│   │   │   └── visionService.ts           # NEW: OpenAI GPT-4o vision integration
│   │   ├── schemas/
│   │   │   └── instantdb.ts               # UNCHANGED: Metadata field already exists
│   │   └── server.ts                      # MODIFY: Register vision routes
│   └── tests/
│       ├── integration/
│       │   └── vision-tagging.test.ts     # NEW: Vision API integration tests
│       └── unit/
│           └── visionService.test.ts      # NEW: Tag normalization tests
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentConfirmationMessage.tsx  # MODIFY: Enhance contrast (shadows, rings)
│   │   │   ├── MaterialPreviewModal.tsx      # MODIFY: Fix content rendering
│   │   │   ├── ChatView.tsx                  # MODIFY: Render image thumbnails
│   │   │   └── ImageMessage.tsx              # NEW: Image message component
│   │   ├── pages/
│   │   │   └── Library/
│   │   │       └── Library.tsx               # MODIFY: Handle materialId param in event
│   │   ├── lib/
│   │   │   ├── AgentContext.tsx              # MODIFY: Add sessionId state
│   │   │   ├── materialMappers.ts            # MODIFY: Parse metadata for tags
│   │   │   └── visionClient.ts               # NEW: Vision API client service
│   │   ├── types/
│   │   │   └── metadata.ts                   # NEW: MessageMetadata, LibraryMaterialMetadata interfaces
│   │   ├── hooks/
│   │   │   └── useLibraryMaterials.ts        # MODIFY: Include tags in search
│   │   └── App.tsx                           # UNCHANGED: No changes needed
│   └── tests/
│       ├── e2e/
│       │   ├── agent-confirmation-visibility.spec.ts  # NEW: E2E tests for US1
│       │   ├── library-navigation.spec.ts             # NEW: E2E tests for US2
│       │   ├── chat-image-integration.spec.ts         # NEW: E2E tests for US3
│       │   └── automatic-tagging.spec.ts              # NEW: E2E tests for US5
│       └── unit/
│           └── metadata-parsing.test.ts               # NEW: Unit tests for type guards
```

**Structure Decision**:

This is a **web application** (Option 2) with clear frontend/backend separation. The feature touches both layers:

- **Backend**: New Vision API endpoint, chat route modifications for vision context
- **Frontend**: Component styling fixes, modal integration, metadata rendering

**Key Architectural Decisions**:
1. No new database tables (use existing metadata JSON fields)
2. No breaking changes to existing components (additive only)
3. Vision tagging is async/non-blocking (doesn't block image creation)
4. Custom event pattern for cross-tab navigation (Ionic compatibility)

## Phase 0: Research Complete ✅

**Document**: [research.md](./research.md)

**Key Findings**:
1. **Tailwind classes ARE rendering** - Issue is contrast, not configuration
   - Solution: Add shadows and rings to Agent Confirmation Card
2. **Library navigation pattern exists** - Custom event `navigate-library-tab`
   - Solution: Extend event with materialId parameter
3. **Vision API integration** - Use OpenAI GPT-4o with vision
   - Solution: Dedicated `/api/vision/tag-image` endpoint
4. **Metadata structure defined** - JSON string in InstantDB
   - Solution: TypeScript interfaces for type safety

**Research Questions Resolved**: 6/6 (100%)

## Phase 1: Design Complete ✅

**Documents**:
- [data-model.md](./data-model.md) - Metadata schemas
- [contracts/vision-tagging-api.md](./contracts/vision-tagging-api.md) - Vision API spec
- [contracts/message-creation-contract.md](./contracts/message-creation-contract.md) - Message patterns
- [quickstart.md](./quickstart.md) - Manual test procedures

**Data Models Defined**:
1. **MessageMetadata Interface** - For chat messages
   - Fields: type, image_url, thumbnail_url, title, originalParams, agentSuggestion
2. **LibraryMaterialMetadata Interface** - For library materials
   - Fields: tags, tagging, originalParams, agent metadata, educational context
3. **LibraryNavigationEvent** - Custom event structure
   - Fields: tab, materialId, source
4. **AgentContextState** - Session persistence
   - Fields: activeAgent, isModalOpen, sessionId, prefillData

**API Contracts Defined**:
1. **POST /api/vision/tag-image** - Vision tagging endpoint
   - Request: imageUrl, context (title, description, subject, grade)
   - Response: tags array, confidence, model, processingTime
   - Error handling: 400, 401, 404, 429, 500, 503 responses
   - Rate limiting: 100/hour, 10/min per user
2. **Message Creation Pattern** - InstantDB transaction pattern
   - Image messages: metadata with type='image'
   - Agent confirmation messages: metadata with type='agent_confirmation'
   - Session persistence: sessionId forwarding through context

**Test Procedures Defined**: 27 test cases across 6 user stories + 4 edge cases

## Phase 2: Task Generation (Next Step)

**Command**: `/speckit.tasks` - Generate tasks.md from spec, plan, and design artifacts

**Expected Output**:
- Concrete implementation tasks (TASK-001 to TASK-N)
- Dependency-ordered (frontend/backend parallelizable where possible)
- Acceptance criteria per task
- Estimated complexity (S/M/L)

**Not Yet Created** - Waiting for user approval of Phase 0-1 deliverables

## Complexity Tracking

*No constitution violations - This section is empty (as intended)*

## Implementation Phases (Preview)

### Phase A: Agent Confirmation Card Visibility (P1)
- Enhance AgentConfirmationMessage.tsx with shadows and rings
- Add WCAG contrast ratio validation tests
- Verify responsive layout on mobile
- Estimated: 1-2 tasks, 2-4 hours

### Phase B: Library Navigation + Modal Integration (P1)
- Extend Library.tsx event handler with materialId parameter
- Update AgentResultView to dispatch event with materialId
- Test MaterialPreviewModal auto-open on navigation
- Estimated: 2-3 tasks, 3-5 hours

### Phase C: Chat History Image Integration (P1)
- Create ImageMessage.tsx component for thumbnails
- Update ChatView.tsx to render image messages
- Modify backend chat route to build vision context
- Pass sessionId through AgentContext
- Estimated: 4-5 tasks, 6-8 hours

### Phase D: MaterialPreviewModal Content Fixes (P2)
- Fix modal content rendering (image preview, metadata, buttons)
- Ensure scrollability on mobile
- Test regenerate button with originalParams
- Estimated: 2-3 tasks, 3-4 hours

### Phase E: Automatic Image Tagging (P2)
- Create Vision API endpoint (POST /api/vision/tag-image)
- Integrate OpenAI GPT-4o vision service
- Trigger tagging after image creation (async)
- Update Library search to include tags
- Estimated: 4-5 tasks, 6-8 hours

### Phase F: Session Persistence (P2)
- Pass sessionId to AgentConfirmationMessage
- Store sessionId in AgentContext state
- Use sessionId when creating messages
- Validate message_index sequentiality
- Estimated: 2-3 tasks, 3-4 hours

### Phase G: Testing & QA
- Write E2E tests for all 6 user stories
- Execute manual test procedures from quickstart.md
- Fix bugs discovered during QA
- Estimated: 5-7 tasks, 8-12 hours

**Total Estimated Effort**: 20-30 tasks, 30-50 hours

## Dependencies

### External APIs
- **OpenAI GPT-4o API** - Required for:
  - Vision context in chat (FR-018 to FR-021)
  - Automatic image tagging (FR-022 to FR-029)
  - Cost: ~$0.01 per image tagging, ~$0.001 per vision context message

### Internal Systems
- **InstantDB Storage** - Required for permanent image URLs
- **InstantDB Real-time Sync** - Required for message updates
- **Ionic Tab Navigation** - Custom event pattern dependency

### Configuration
- `OPENAI_API_KEY` environment variable (backend)
- Tailwind primary colors (already configured: 50-900)
- Vite proxy for /api routes (already configured)

### No Blockers Identified
- All dependencies already integrated
- No new external services required
- No schema migrations needed

## Risk Assessment

### Low Risk ✅
- Tailwind contrast fixes (CSS-only)
- Custom event extension (additive)
- Metadata JSON storage (existing field)

### Medium Risk ⚠️
- Vision API integration (new endpoint)
  - Mitigation: Graceful degradation on failure
- Session persistence (state management)
  - Mitigation: Fallback to new session if sessionId missing
- Vision context (image URL expiration)
  - Mitigation: Fallback to text-only if image 404

### High Risk ❌
- None identified

## Success Criteria Mapping

| Success Criterion | How Validated | Target |
|-------------------|---------------|--------|
| SC-001: Agent Card visible 100% | Manual visual test + E2E | 100% |
| SC-002: Library navigation works 100% | E2E test suite | 100% |
| SC-003: Image in chat history 100% | E2E test suite | 100% |
| SC-004: Vision context works ≥90% | Manual testing with sample prompts | ≥90% |
| SC-005: 7-10 tags per image | Vision API unit tests | Avg 7-10 |
| SC-006: Tag search precision ≥80% | Manual search tests | ≥80% |
| SC-007: Modal content renders 100% | E2E test suite | 100% |
| SC-008: Session persists 100% | Unit tests for sessionId | 100% |
| SC-009: Build with 0 TS errors | npm run build | 0 errors |
| SC-010: E2E tests ≥90% pass rate | npm run test:e2e | ≥90% |

## Next Steps

1. **User Review** - Review Phase 0-1 deliverables:
   - [x] research.md (technical decisions)
   - [x] data-model.md (metadata schemas)
   - [x] contracts/ (API specs)
   - [x] quickstart.md (test procedures)
   - [x] plan.md (this file)

2. **Generate Tasks** - Run `/speckit.tasks` command to create tasks.md

3. **Implementation** - Execute tasks in dependency order:
   - Frontend and backend tasks can run in parallel where independent
   - P1 tasks (MVP) take priority over P2 tasks (enhancements)

4. **Testing** - Execute quickstart.md manual tests + automated E2E suite

5. **Definition of Done** - Validate all criteria from `.specify/templates/DEFINITION-OF-DONE.md`:
   - [ ] npm run build → 0 TypeScript errors
   - [ ] npm test → all pass
   - [ ] Manual testing complete (quickstart.md)
   - [ ] Session log created in docs/development-logs/sessions/2025-10-14/
   - [ ] Pre-commit hook passes

## References

- **Feature Spec**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/](./contracts/)
- **Test Guide**: [quickstart.md](./quickstart.md)
- **Constitution**: `../../templates/DEFINITION-OF-DONE.md`
- **Backend Schema**: `teacher-assistant/backend/src/schemas/instantdb.ts`
- **Frontend Components**: `teacher-assistant/frontend/src/components/`

---

**Phase 0-1 Status**: ✅ **COMPLETE** - Ready for task generation
**Next Command**: `/speckit.tasks` to generate implementation tasks
