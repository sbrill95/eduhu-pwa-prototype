# Bug Fix Critical - October 5, 2025

**Status**: 🔴 IN PROGRESS
**Priority**: CRITICAL
**Created**: 2025-10-05
**Agent**: Claude Code

## Overview

This spec kit addresses 5 critical bugs identified during user testing that break core functionality of the Teacher Assistant PWA.

## Bugs Addressed

### 🐛 BUG 1: Homepage Prompt Auto-Submit
**Impact**: High | **Status**: Pending
- Prompt tiles don't auto-submit messages
- User has to manually click send button

### 🐛 BUG 2: Material Link Navigation
**Impact**: Medium | **Status**: Pending
- Material arrow navigates to wrong tab
- Should go to Library → Materials tab

### 🐛 BUG 3: Agent Detection Not Working
**Impact**: CRITICAL | **Status**: ✅ FIXED & QA APPROVED
- Backend sends agentSuggestion ✅
- Frontend shows confirmation ✅
- **Workflow FIXED** ✅
- **QA Review**: APPROVED FOR DEPLOYMENT (pending manual test)
- **Files**: `qa-reports/bug-003-agent-detection-qa.md`, `tests/bug-003-agent-detection.spec.ts`

### 🐛 BUG 4: Console Errors (Profile API)
**Impact**: Medium | **Status**: Pending
- Numerous 404 errors for profile extraction
- Routes not registered in backend

### 🐛 BUG 5: Library Date Formatting
**Impact**: Low | **Status**: Pending
- Inconsistent date display vs Homepage
- Should use German relative dates

### 🐛 BUG 6: Profil - Merkmal hinzufügen
**Impact**: HIGH | **Status**: Pending
- Modal has NO confirmation button ❌
- User cannot save new characteristic
- Incomplete UX

### 🐛 BUG 7: Profil - Name ändern
**Impact**: MEDIUM | **Status**: Pending
- Name change is not saved ❌
- apiClient.updateUserName() fails
- Edit mode broken

### 🐛 BUG 8: Library - Falsche Akzentfarbe
**Impact**: LOW | **Status**: Pending
- Blue accent instead of Orange (#FB6542) ❌
- Inconsistent with Gemini design system

### 🐛 BUG 9: Library - Chat-Tagging
**Impact**: HIGH | **Status**: Pending
- Chats have NO tags ❌
- NO search functionality ❌
- User cannot find chats efficiently

### 🚨 CRITICAL WORKFLOW: Image Generation
**Impact**: P0 - BLOCKS CORE FEATURE | **Status**: Pending
**Reference**: `.specify/specs/image-generation-ux-v2/spec.md`
- Complete end-to-end workflow broken
- See Journey 10 in spec.md for full details
- **15 tasks** from previous spec never implemented

## Files in This Spec Kit

- **`README.md`** (this file) - Overview
- **`spec.md`** - Detailed implementation specification
- **`tests.spec.ts`** - Comprehensive E2E test suite (15+ tests)
- **`tasks.md`** - Task breakdown and tracking
- **`screenshots/`** - Before/after screenshots

## Test-First Approach

Every bug fix follows this process:

1. ✅ Write test (should fail)
2. ✅ Implement fix
3. ✅ Run test (should pass)
4. ✅ Take screenshot as proof
5. ✅ Mark task as complete

## Quick Start

```bash
# Run all tests
cd teacher-assistant/frontend
npm run test:e2e -- ../../../.specify/specs/bug-fix-critical-oct-05/tests.spec.ts

# Run specific suite
npm run test:e2e -- tests.spec.ts -g "Agent Detection"

# With screenshots
npm run test:e2e -- tests.spec.ts --screenshot=on
```

## Progress Tracking

- [ ] Phase 1: Backend & API Fixes
  - [x] Backend running without errors
  - [x] Agent Detection implemented (backend)
  - [ ] Console errors fixed
- [ ] Phase 2: Frontend Core Fixes
  - [ ] Agent Detection frontend integration
  - [ ] Date formatting Library
- [ ] Phase 3: UX Improvements
  - [ ] Prompt auto-submit
  - [ ] Material navigation
- [ ] Phase 4: Testing & Verification
  - [ ] All 15+ tests passing
  - [ ] Screenshots collected
  - [ ] Integration verified

## Related Files

### Backend
- `teacher-assistant/backend/src/services/chatService.ts` - Agent detection logic
- `teacher-assistant/backend/src/routes/index.ts` - Route registration
- `teacher-assistant/backend/src/types/index.ts` - Type definitions

### Frontend
- `teacher-assistant/frontend/src/pages/Home/Home.tsx` - Homepage bugs
- `teacher-assistant/frontend/src/pages/Library/Library.tsx` - Date formatting
- `teacher-assistant/frontend/src/components/ChatView.tsx` - Agent detection
- `teacher-assistant/frontend/src/hooks/useChat.ts` - Chat logic

## Success Criteria

✅ **Definition of Done**:
- All 15+ tests in `tests.spec.ts` passing
- Zero console errors in browser
- Screenshots prove functionality
- Agent workflow works end-to-end
- Navigation flows work correctly
- Date formatting is consistent

## Timeline

**Estimated**: 3-4 hours
**Started**: 2025-10-05 14:00
**Target Completion**: 2025-10-05 18:00

## Notes

- Backend agent detection already works ✅
- Main issue is frontend not handling agentSuggestion
- Profile API routes need to be disabled or implemented
- Test suite is comprehensive and ready to run
