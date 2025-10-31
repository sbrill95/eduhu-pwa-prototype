# Image Generation UX Improvements V2 - SpecKit

**Feature Name**: Image Generation Complete Workflow Fix
**Version**: 2.0
**Status**: Ready for Review
**Created**: 2025-10-05
**Priority**: P0 - CRITICAL

---

## 📁 SpecKit Contents

### Core Documents
1. **[spec.md](./spec.md)** - Requirements & User Stories
   - Problem statement (6 critical issues)
   - User stories (US-1 to US-6)
   - Open questions for user feedback
   - Success criteria

2. **[visual-analysis.md](./visual-analysis.md)** - Screenshot Analysis
   - Current state (OLD green button ❌)
   - Desired state (NEW Gemini UI ✅)
   - Root cause analysis
   - Visual specifications with exact CSS

3. **[plan.md](./plan.md)** - Technical Design
   - Architecture overview (current vs target)
   - Component changes (8 files modified)
   - Data flow diagram
   - Testing strategy
   - Deployment plan (4 phases)

4. **[tasks.md](./tasks.md)** - Implementation Checklist
   - 15 concrete tasks
   - Estimated effort: 2-3 days
   - Dependencies diagram
   - Progress tracking

### Supporting Materials
5. **screenshots/** - Visual Evidence
   - `current-OLD-green-button.png` - Problem screenshot
   - `desired-NEW-gemini.png` - Target design

---

## 🎯 Quick Summary

### Problems Identified (User-Reported)
1. ❌ Agent Confirmation shows OLD UI (green button) instead of NEW Gemini (orange)
2. ❌ Button layout wrong: Should be LEFT "Bild-Generierung", RIGHT "Chat"
3. ❌ Touch targets potentially too small
4. ❌ Chat context not transferred to form (fields empty)
5. ❌ Double animation appears ("oben links" + center)
6. ❌ Image not saved to Library (or filter missing)
7. ❌ Image not displayed in Chat history
8. ❌ No "Neu generieren" option

### Solution Approach
✅ **Root Cause**: Frontend uses OLD client-side agent detection instead of backend `agentSuggestion`

✅ **Fix Strategy**:
1. Disable OLD detection (feature flag)
2. Check backend `response.agentSuggestion` FIRST
3. Render NEW Gemini component
4. Reverse button order
5. Prefill form from agentSuggestion
6. Remove duplicate animation
7. Display image in chat
8. Add "Neu generieren" button

---

## 📊 Key Metrics

**Files Modified**: 8 frontend files, 0 backend files (already implemented)
**Lines Changed**: ~150 lines (mostly additions)
**Tests Required**: 5 unit test files, 1 E2E test file
**Estimated Effort**: 2-3 days (1 Frontend Dev + 1 QA)

---

## 🚦 Status & Next Steps

### Current Status
- [x] Spec created (spec.md)
- [x] Visual analysis complete (visual-analysis.md)
- [x] Technical plan ready (plan.md)
- [x] Tasks defined (tasks.md)
- [ ] User review pending
- [ ] QA agent review pending

### Blockers
⚠️ **BLOCKER-001**: "Oben links" animation location not specified by user
- Need screenshot/annotation to identify exact element

### Open Questions for User
1. **Q1**: Touch target sizes - Akzeptiert 44x44px minimum (iOS Standard)?
2. **Q2**: Button layout - Links Orange (Bild), Rechts Gray (Chat) korrekt?
3. **Q3**: Wo genau ist die doppelte Animation "oben links"?
4. **Q4**: Bild-Darstellung im Chat - Thumbnail 300px OK?
5. **Q5**: ChatGPT Vision - Soll AI das Bild "sehen" können (höhere Kosten)?

### Next Steps
1. ✅ **User Review**: Feedback auf spec.md, plan.md, tasks.md
2. ✅ **User Input**: BLOCKER-001 (Animation-Location) klären
3. ⏳ **QA Review**: QA-Agent reviewed Spec (NEUE REGEL aus CLAUDE.md!)
4. ⏳ **Implementation**: Frontend-Agent startet mit TASK-001

---

## 🔗 Related Documents

**Previous Specs**:
- `.specify/specs/image-generation-improvements/` - Original V1 spec
- `.specify/specs/image-generation-modal-gemini/` - Gemini modal spec

**QA Reports**:
- `docs/quality-assurance/verification-reports/FINAL-QA-REPORT-IMAGE-GENERATION.md`
- `docs/quality-assurance/verification-reports/IMAGE-GENERATION-QA-FINDINGS.md`

**Session Logs**:
- `docs/development-logs/sessions/2025-10-04/session-02-backend-image-generation-fix.md`
- `docs/development-logs/sessions/2025-10-04/session-02-image-generation-frontend-fixes.md`

**Bug Tracking**:
- `docs/quality-assurance/bug-tracking.md` (BUG-016, BUG-017 related)

---

## 📋 Implementation Phases

### Phase 1: Frontend Core Fixes (Day 1 - 4h)
- TASK-001: Disable OLD detection
- TASK-002: Check agentSuggestion FIRST
- TASK-003: Render NEW Gemini component
- TASK-004: Fix button order
- TASK-005: Unit tests

### Phase 2: Data Prefill & Progress (Day 1-2 - 3h)
- TASK-006: Prefill form
- TASK-007: Remove duplicate animation ⚠️ (needs user input)
- TASK-008: Unit tests

### Phase 3: Chat & Library Integration (Day 2 - 4h)
- TASK-009: Display image in chat
- TASK-010: Add "Neu generieren" button
- TASK-011: Verify Library filter (already done ✅)
- TASK-012: Integration tests

### Phase 4: QA & Deployment (Day 3 - 4h)
- TASK-013: E2E tests with Playwright
- TASK-014: Visual regression testing
- TASK-015: Backend verification

---

## ✅ Approval Checklist

Before starting implementation:

- [ ] User approved spec.md (requirements correct?)
- [ ] User answered open questions (Q1-Q5)
- [ ] User provided animation location (BLOCKER-001)
- [ ] QA-Agent reviewed Spec ✅ (MANDATORY aus CLAUDE.md)
- [ ] Visual specifications match user expectations
- [ ] All stakeholders aligned on solution approach

---

## 📞 Contact & Support

**SpecKit Created By**: General-Purpose Agent
**Date**: 2025-10-05
**Review Status**: ⏳ Awaiting User Feedback

**For Questions**:
- Review individual documents (spec.md, plan.md, tasks.md)
- Check visual-analysis.md for screenshot details
- Refer to existing QA reports for context

---

**Next Action**: User reviews and provides feedback/approvals 🎯
