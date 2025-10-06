# Tasks: Chat Summaries Implementation

**Feature**: Automatic Chat Summaries
**Status**: Not Started
**Last Updated**: 2025-10-03

---

## Task Overview

| Phase | Tasks | Status | Agent |
|-------|-------|--------|-------|
| **Phase 1: Backend** | 6 tasks | ⏳ Not Started | backend-node-developer |
| **Phase 2: Frontend** | 5 tasks | ⏳ Not Started | react-frontend-developer |
| **Phase 3: Testing** | 6 tasks | ⏳ Not Started | qa-integration-reviewer |
| **Phase 4: Deployment** | 3 tasks | ⏳ Not Started | All agents |

**Total**: 20 tasks

---

## Phase 1: Backend Implementation

**Agent**: `backend-node-developer`

### TASK-001: Update InstantDB Schema
- [ ] Add `summary: string | null` field to `chats` table in `instantdb.ts`
- [ ] Add TypeScript type definition for chat summary
- [ ] Verify schema compiles without errors
- **Files**: `teacher-assistant/backend/src/schemas/instantdb.ts`
- **Time**: 30 min
- **Dependencies**: None

### TASK-002: Create Summary Service
- [ ] Create `summaryService.ts` in `services/`
- [ ] Implement `generateSummary(messages)` method
- [ ] Build OpenAI prompt with 20-char limit enforcement
- [ ] Add error handling with fallback text
- [ ] Add retry logic (1 retry on failure)
- **Files**: `teacher-assistant/backend/src/services/summaryService.ts`
- **Time**: 2 hours
- **Dependencies**: TASK-001

### TASK-003: Write Summary Service Unit Tests
- [ ] Create `summaryService.test.ts`
- [ ] Test: Summary is ≤20 characters
- [ ] Test: Handles OpenAI API errors gracefully
- [ ] Test: Returns fallback text on failure
- [ ] Test: Retry logic works correctly
- **Files**: `teacher-assistant/backend/src/services/summaryService.test.ts`
- **Time**: 1 hour
- **Dependencies**: TASK-002

### TASK-004: Create Summary API Route
- [ ] Add `POST /api/chat/summary` route in `routes/index.ts`
- [ ] Validate request body (chatId, messages)
- [ ] Call `summaryService.generateSummary()`
- [ ] Store summary in InstantDB via `instantdbService`
- [ ] Add rate limiting (10 req/min per user)
- **Files**: `teacher-assistant/backend/src/routes/index.ts`
- **Time**: 1 hour
- **Dependencies**: TASK-002

### TASK-005: Write API Route Tests
- [ ] Create route integration test
- [ ] Test: Valid request returns summary
- [ ] Test: Invalid request returns 400 error
- [ ] Test: Summary is stored in InstantDB
- [ ] Test: Rate limiting works
- **Files**: `teacher-assistant/backend/src/routes/index.test.ts`
- **Time**: 1 hour
- **Dependencies**: TASK-004

### TASK-006: Update InstantDB Service
- [ ] Add `updateChat(chatId, { summary })` method to `instantdbService.ts`
- [ ] Handle null/undefined summary values
- [ ] Add error logging
- **Files**: `teacher-assistant/backend/src/services/instantdbService.ts`
- **Time**: 30 min
- **Dependencies**: TASK-001

---

## Phase 2: Frontend Implementation

**Agent**: `react-frontend-developer`

### TASK-007: Create useChatSummary Hook
- [ ] Create `useChatSummary.ts` in `hooks/`
- [ ] Implement trigger logic: after 3 messages
- [ ] Implement trigger logic: on component unmount (user leaves chat)
- [ ] Prevent duplicate summary generation with `useRef`
- [ ] Add API call to `POST /api/chat/summary`
- **Files**: `teacher-assistant/frontend/src/hooks/useChatSummary.ts`
- **Time**: 1.5 hours
- **Dependencies**: TASK-004

### TASK-008: Write Hook Unit Tests
- [ ] Create `useChatSummary.test.ts`
- [ ] Test: Triggers after 3 messages
- [ ] Test: Triggers on component unmount
- [ ] Test: Doesn't generate duplicate summaries
- [ ] Test: Handles API errors gracefully
- **Files**: `teacher-assistant/frontend/src/hooks/useChatSummary.test.ts`
- **Time**: 1 hour
- **Dependencies**: TASK-007

### TASK-009: Create Dynamic Font Size Utility
- [ ] Add `getDynamicFontSize(text)` to `lib/utils.ts`
- [ ] Logic: ≤10 chars → `text-sm`, ≤15 chars → `text-xs`, >15 → `text-xs`
- [ ] Write unit tests for utility
- **Files**: `teacher-assistant/frontend/src/lib/utils.ts`, `utils.test.ts`
- **Time**: 30 min
- **Dependencies**: None

### TASK-010: Integrate Summary in ChatView
- [ ] Import and use `useChatSummary` hook in `ChatView.tsx`
- [ ] Pass `chatId`, `messages`, and `enabled` props
- [ ] Verify hook triggers correctly
- **Files**: `teacher-assistant/frontend/src/components/ChatView.tsx`
- **Time**: 30 min
- **Dependencies**: TASK-007

### TASK-011: Display Summary in HomeView
- [ ] Update "Letzte Chats" section in `HomeView.tsx`
- [ ] Display `chat.summary` with dynamic font size
- [ ] Show "Neuer Chat" placeholder if no summary
- [ ] Apply truncation with `truncate` class
- [ ] **Playwright Verification**: Take screenshot `home-chat-summary.png` (mobile viewport)
- [ ] **Visual Comparison**: Compare to design requirements
- **Files**: `teacher-assistant/frontend/src/components/HomeView.tsx`
- **Time**: 1 hour
- **Dependencies**: TASK-009

### TASK-012: Display Summary in LibraryView
- [ ] Update chat list items in `Library.tsx`
- [ ] Display `chat.summary` with dynamic font size
- [ ] Show "Neuer Chat" placeholder if no summary
- [ ] Apply truncation with `truncate` class
- [ ] **Playwright Verification**: Take screenshot `library-chat-summary.png` (mobile viewport)
- [ ] **Visual Comparison**: Compare to design requirements
- **Files**: `teacher-assistant/frontend/src/pages/Library/Library.tsx`
- **Time**: 1 hour
- **Dependencies**: TASK-009

---

## Phase 3: Testing & Quality Assurance

**Agent**: `qa-integration-reviewer`

### TASK-013: E2E Test - Summary Generation After 3 Messages
- [ ] Write Playwright test: `chat-summaries.spec.ts`
- [ ] Test: Login → Send 3 messages → Summary generated → Visible in Home
- [ ] **Screenshot Verification**: `e2e-summary-after-3-messages.png`
- [ ] Verify summary ≤20 characters
- [ ] Compare screenshot to design mockup
- **Files**: `teacher-assistant/frontend/e2e-tests/chat-summaries.spec.ts`
- **Time**: 1.5 hours
- **Dependencies**: TASK-010, TASK-011

### TASK-014: E2E Test - Summary on Chat Exit
- [ ] Test: Login → Send 2 messages → Leave chat → Summary generated
- [ ] **Screenshot Verification**: `e2e-summary-on-exit.png`
- [ ] Verify summary appears in Library view
- [ ] Compare screenshot to design mockup
- **Files**: `teacher-assistant/frontend/e2e-tests/chat-summaries.spec.ts`
- **Time**: 1 hour
- **Dependencies**: TASK-010, TASK-012

### TASK-015: E2E Test - Responsive Font Sizing
- [ ] Test on 3 viewports: iPhone SE (375px), iPhone 12 (390px), Pixel 5 (393px)
- [ ] **Screenshot Verification**:
  - `chat-summary-iphone-se.png`
  - `chat-summary-iphone-12.png`
  - `chat-summary-pixel-5.png`
- [ ] Verify text is readable (not cut off)
- [ ] Verify dynamic font sizing works correctly
- [ ] Compare all screenshots to design requirements
- **Files**: `teacher-assistant/frontend/e2e-tests/chat-summaries.spec.ts`
- **Time**: 1.5 hours
- **Dependencies**: TASK-011, TASK-012

### TASK-016: E2E Test - Text Truncation
- [ ] Mock API to return 20-char summary
- [ ] Verify text truncates with ellipsis
- [ ] **Screenshot Verification**: `chat-summary-truncated.png`
- [ ] Test on both Home and Library views
- [ ] Compare screenshot to design mockup
- **Files**: `teacher-assistant/frontend/e2e-tests/chat-summaries.spec.ts`
- **Time**: 1 hour
- **Dependencies**: TASK-011, TASK-012

### TASK-017: Integration Test - End-to-End Flow
- [ ] Create integration test: Chat → Summary → InstantDB storage
- [ ] Verify summary stored correctly in database
- [ ] Verify summary persists across sessions
- [ ] Test error handling (API failure scenarios)
- **Files**: `teacher-assistant/frontend/src/hooks/useChatSummary.integration.test.ts`
- **Time**: 1.5 hours
- **Dependencies**: TASK-007, TASK-011, TASK-012

### TASK-018: Manual QA & Visual Verification
- [ ] Manual testing on staging environment
- [ ] Verify summaries are meaningful and accurate
- [ ] Test edge cases (empty chats, very short chats)
- [ ] Verify no regressions in existing chat functionality
- [ ] Document findings in QA report
- **Files**: `/docs/quality-assurance/chat-summaries-qa-report.md`
- **Time**: 2 hours
- **Dependencies**: All previous tasks

---

## Phase 4: Deployment & Monitoring

**Agent**: All agents (coordinated)

### TASK-019: Deploy to Staging
- [ ] Deploy backend to Vercel (staging)
- [ ] Deploy frontend to Vercel (staging)
- [ ] Run smoke tests on staging
- [ ] Verify InstantDB schema update
- [ ] Monitor error logs for 24 hours
- **Time**: 1 hour
- **Dependencies**: All Phase 1-3 tasks

### TASK-020: Production Deployment
- [ ] Set feature flag `ENABLE_CHAT_SUMMARIES=true`
- [ ] Gradual rollout: 10% → 50% → 100%
- [ ] Monitor OpenAI API usage and errors
- [ ] Monitor summary generation success rate
- [ ] Document rollback procedure
- **Time**: 2 hours
- **Dependencies**: TASK-019

### TASK-021: Post-Deployment Verification
- [ ] Run full E2E test suite in production
- [ ] Verify summaries generating correctly
- [ ] Check performance metrics (API latency, error rates)
- [ ] Collect user feedback
- [ ] Document lessons learned in session log
- **Files**: `/docs/development-logs/sessions/2025-10-03/session-chat-summaries-deployment.md`
- **Time**: 1 hour
- **Dependencies**: TASK-020

---

## Acceptance Criteria (Feature Complete)

### Functional
- ✅ Summaries generate after 3 messages
- ✅ Summaries generate when user leaves chat (even <3 messages)
- ✅ All summaries are ≤20 characters
- ✅ Summaries display in Home "Letzte Chats" section
- ✅ Summaries display in Library chat list
- ✅ Dynamic font sizing works on all viewports
- ✅ Text truncates with ellipsis when needed

### Technical
- ✅ All unit tests pass (100% coverage for new code)
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ Playwright screenshots verify correct UI rendering
- ✅ No regressions in existing functionality

### Visual Verification (CRITICAL)
- ✅ **Home View**: Screenshot matches design requirements
  - Font size scales correctly
  - Truncation works properly
  - Spacing and alignment correct
- ✅ **Library View**: Screenshot matches design requirements
  - Summary visible and readable
  - Consistent with Home view styling
- ✅ **Responsive**: All viewports tested (375px, 390px, 393px)
  - No text cutoff
  - Readable on smallest screens

### Performance
- ✅ Summary generation <10 seconds (95th percentile)
- ✅ No UI blocking during generation
- ✅ Error rate <5%
- ✅ Retry logic works correctly

---

## Notes

- **Future Enhancement**: Update summaries when chat continues (currently static) - track in `/docs/project-management/master-todo.md`
- **Dependency**: Requires OpenAI API key in production environment
- **Monitoring**: Set up alerts for summary generation failures

---

## Task Assignment

| Agent | Tasks | Total Time |
|-------|-------|------------|
| backend-node-developer | TASK-001 to TASK-006 | ~6 hours |
| react-frontend-developer | TASK-007 to TASK-012 | ~5.5 hours |
| qa-integration-reviewer | TASK-013 to TASK-018 | ~8.5 hours |
| All (coordinated) | TASK-019 to TASK-021 | ~4 hours |

**Total Estimated Time**: ~24 hours
