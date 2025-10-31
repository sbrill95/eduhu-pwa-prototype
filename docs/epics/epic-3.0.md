# Epic 3.0: Foundation & Migration

**Epic ID**: Epic 3.0
**Parent PRD**: [docs/prd.md](../prd.md)
**Timeline**: Weeks 1-4
**Status**: Not Started
**Priority**: P0 (Critical)

---

## Epic Goal

Migrate existing LangGraph image agent to OpenAI Agents SDK without breaking current functionality.

---

## Epic Context

**Current State**:
- Image generation uses LangGraph 0.4.9 with Redis state management
- Single image agent (DALL-E 3 creation only)
- Manual agent selection by users

**Target State**:
- OpenAI Agents SDK replaces LangGraph
- Router agent for intelligent intent classification
- Dual-path support during migration (LangGraph deprecated, SDK active)
- All existing functionality preserved

---

## Integration Requirements

- ✅ Maintain 100% backward compatibility with existing API endpoints
- ✅ Zero downtime during migration
- ✅ Existing E2E tests must pass with minimal changes
- ✅ Performance must match or exceed LangGraph (≤15s response time)

---

## Stories

### Story 3.0.1: OpenAI Agents SDK Setup & Authentication
**Goal**: Install and configure OpenAI Agents SDK in backend

**Acceptance Criteria**:
1. OpenAI Agents SDK npm package installed
2. SDK initialized with OpenAI API key from environment
3. Basic agent executes simple task successfully
4. SDK tracing enabled at https://platform.openai.com/traces
5. Documentation added to `docs/architecture/api-documentation/`

**Story File**: [docs/stories/epic-3.0.story-1.md](../stories/epic-3.0.story-1.md)

---

### Story 3.0.2: Router Agent Implementation
**Goal**: Automatic detection of "create" vs "edit" intent

**Acceptance Criteria**:
1. Router classifies "image creation" vs "image editing" intents
2. Classification accuracy ≥95% on test dataset (100 samples)
3. Router extracts entities: subject, grade level, topic, style
4. Confidence score provided with classification
5. Manual override button available

**Story File**: [docs/stories/epic-3.0.story-2.md](../stories/epic-3.0.story-2.md)

---

### Story 3.0.3: Migrate DALL-E Image Agent to OpenAI SDK
**Goal**: Existing image generation works via OpenAI Agents SDK

**Acceptance Criteria**:
1. DALL-E 3 image generation works via SDK
2. All existing E2E tests pass (0 failures)
3. Prompt enhancement preserved
4. Image quality matches LangGraph implementation
5. 10 images/month usage limit enforced

**Story File**: [docs/stories/epic-3.0.story-3.md](../stories/epic-3.0.story-3.md)

---

### Story 3.0.4: Dual-Path Support
**Goal**: Both LangGraph and OpenAI SDK run in parallel during migration

**Acceptance Criteria**:
1. Environment variable `AGENTS_SDK_ENABLED` controls path
2. Feature flag allows percentage-based traffic split
3. Deprecation warnings logged for LangGraph endpoint
4. Both paths share same API response format
5. Rollback to LangGraph possible within 1 minute

**Story File**: [docs/stories/epic-3.0.story-4.md](../stories/epic-3.0.story-4.md)

---

### Story 3.0.5: E2E Tests for Router + Basic Image Agent
**Goal**: Comprehensive E2E tests for new agent system

**Acceptance Criteria**:
1. Playwright test: Router classifies "create image" intent
2. Playwright test: Router classifies "edit image" intent
3. Playwright test: End-to-end image creation via SDK
4. Playwright test: Manual override of router works
5. All tests capture screenshots for verification

**Story File**: [docs/stories/epic-3.0.story-5.md](../stories/epic-3.0.story-5.md)

---

## Dependencies

**Before Starting**:
- ✅ Phase 2.5 testing complete (all bugs fixed)
- ✅ OpenAI API key with Agents SDK access
- ✅ BMad central PRD approved

**External Dependencies**:
- OpenAI Agents SDK GA release
- Vercel serverless functions support for SDK

---

## Success Criteria

Epic 3.0 is complete when:
- ✅ OpenAI Agents SDK integrated and functional
- ✅ Router agent routes to image creation with ≥95% accuracy
- ✅ Existing DALL-E functionality migrated (all tests pass)
- ✅ Dual-path support working (can switch between LangGraph/SDK)
- ✅ E2E tests passing (100%)
- ✅ Performance matches or exceeds LangGraph baseline

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI SDK breaks existing functionality | HIGH | Dual-path support, gradual rollout, extensive E2E tests |
| Router misclassifies intent frequently | MEDIUM | Extensive prompt engineering, user feedback loop |
| Performance degradation vs LangGraph | MEDIUM | Benchmark before/after, optimize if needed |

---

**Epic Owner**: BMad Dev Agent
**QA Reviewer**: BMad QA Agent (Quinn)
**Created**: 2025-10-17
**Last Updated**: 2025-10-17
