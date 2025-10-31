# Quick Reference: Library Navigation Enhancement (US2)
**For**: Developer Agent
**Date**: 2025-10-17
**Print This**: Keep nearby during implementation

---

## The Mission

Fix broken navigation: User clicks "In Library öffnen" → Library opens with modal showing newly created image.

---

## 3 Files to Modify

### 1. AgentResultView.tsx
**Location**: `teacher-assistant/frontend/src/components/AgentResultView.tsx`
**Function**: `handleOpenInLibrary` (~line 356)
**Change**: Add event dispatch with materialId

```typescript
const materialId = state.result?.data?.library_id || state.result?.metadata?.library_id;

window.dispatchEvent(new CustomEvent('navigate-library-tab', {
  detail: { tab: 'materials', materialId, source: 'AgentResultView' }
}));

flushSync(() => navigateToTab('library'));
closeModal();
```

### 2. Library.tsx
**Location**: `teacher-assistant/frontend/src/pages/Library/Library.tsx`
**Function**: Event listener (~line 196)
**Change**: Auto-open modal when materialId provided

```typescript
const materialId = customEvent.detail?.materialId;
if (materialId) {
  const artifact = artifacts.find(a => a.id === materialId);
  if (artifact) {
    setSelectedMaterial(convertArtifactToUnifiedMaterial(artifact));
    setIsModalOpen(true);
  }
}
```

### 3. library-navigation-us2.spec.ts (NEW)
**Location**: `teacher-assistant/frontend/e2e-tests/library-navigation-us2.spec.ts`
**Content**: E2E test for complete flow

---

## Critical Gotchas

### ❌ DON'T Use React Router
```typescript
// WRONG - Causes page reload
navigate('/library');
window.location.href = '/library';

// RIGHT - Use Ionic navigation
const { navigateToTab } = useAgent();
navigateToTab('library');
```

### ❌ DON'T Use Wrong Field Names
```typescript
// WRONG - Causes BUG-025
session: state.sessionId
author: user.id

// RIGHT - Match InstantDB schema
session_id: state.sessionId
user_id: user.id
```

### ❌ DON'T Mark Complete Without Visual Verification
```bash
# NOT ENOUGH
npm run build  # ✅ passes
npm test       # ✅ passes

# REQUIRED
npm run build  # ✅ passes
npm test       # ✅ passes
npx playwright test  # ✅ passes
# PLUS manual verification on 4+ browsers/devices
```

---

## Testing Commands

```bash
# Build (must pass with 0 errors)
cd teacher-assistant/frontend
npm run build

# Unit tests
npm test

# E2E test
VITE_TEST_MODE=true npx playwright test e2e-tests/library-navigation-us2.spec.ts

# Dev server (manual testing)
npm run dev
```

---

## Definition of Done (Copy/Paste Checklist)

```
### US2 Library Navigation - Definition of Done

**Build & Unit Tests**:
- [ ] npm run build passes (0 TypeScript errors)
- [ ] npm test passes (all tests)

**E2E Tests**:
- [ ] library-navigation-us2.spec.ts passes
- [ ] Navigation completes in <2s
- [ ] Modal opens in <500ms

**Manual Verification**:
- [ ] Chrome Desktop: Navigation works, modal opens
- [ ] Chrome Mobile (Pixel 9): Touch targets ≥44px
- [ ] Safari Desktop: Compatibility verified
- [ ] Safari Mobile (iPhone): Safe areas respected

**Accessibility**:
- [ ] Keyboard-only navigation works (Tab/Shift+Tab/Escape)
- [ ] Screen reader announces correctly
- [ ] Focus trap works in modal
- [ ] All buttons have aria-label

**Documentation**:
- [ ] Session log created: docs/development-logs/sessions/2025-10-17/session-01-library-navigation-us2.md
- [ ] Contains: Build output, test results, screenshots
- [ ] Git commit with full DoD in message
```

---

## Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Navigation | <2s | Time from button click to modal visible |
| Modal Open | <500ms | Time from event to modal rendered |
| Animation | 60fps | Chrome DevTools Performance tab |

---

## Accessibility Checklist

```
**Keyboard Navigation**:
- [ ] Tab navigates through interactive elements
- [ ] Shift+Tab navigates backwards
- [ ] Escape closes modal
- [ ] Enter/Space activates buttons

**Focus Management**:
- [ ] Focus trapped within modal
- [ ] Close button focused on modal open
- [ ] Previous focus restored on close

**ARIA**:
- [ ] Modal has role="dialog"
- [ ] Modal has aria-modal="true"
- [ ] Modal has aria-labelledby
- [ ] All buttons have aria-label
- [ ] Live region announces navigation

**Screen Reader**:
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] Announces modal opening
- [ ] Announces button states
- [ ] Announces errors
```

---

## Common Issues & Solutions

### Issue: Material not found in artifacts array
**Solution**: Add error handling
```typescript
if (!artifact) {
  setErrorMessage('Material nicht gefunden');
  setShowError(true);
}
```

### Issue: Modal doesn't open
**Solution**: Check materialId extraction
```typescript
console.log('materialId:', materialId);
console.log('artifacts:', artifacts.length);
```

### Issue: Wrong tab active
**Solution**: Set both selectedTab and selectedFilter
```typescript
setSelectedTab('artifacts');
setSelectedFilter('Bilder');
```

### Issue: Focus not trapped
**Solution**: Check modalRef is set
```typescript
const modalRef = useRef<HTMLDivElement>(null);
<div ref={modalRef}>
```

---

## File Locations Reference

```
Project Structure:
eduhu-pwa-prototype/
├── teacher-assistant/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── AgentResultView.tsx  ← Edit this
│   │   │   ├── pages/
│   │   │   │   └── Library/
│   │   │   │       └── Library.tsx      ← Edit this
│   │   │   └── lib/
│   │   │       └── AgentContext.tsx     ← Read this (navigateToTab)
│   │   └── e2e-tests/
│   │       └── library-navigation-us2.spec.ts  ← Create this
│   └── backend/
│       └── src/
│           └── routes/
│               └── langGraphAgents.ts   ← Read this (library_id)
└── docs/
    ├── architecture/
    │   ├── brownfield-architecture.md   ← Reference
    │   └── implementation-details/
    │       ├── TECHNICAL-PLAN-LIBRARY-NAVIGATION-2025-10-17.md  ← Full plan
    │       └── DEVELOPER-HANDOFF-US2-2025-10-17.md  ← Handoff doc
    └── development-logs/
        └── sessions/
            └── 2025-10-17/
                └── session-01-library-navigation-us2.md  ← Create this
```

---

## Backend API Reference

### Image Generation Response
```typescript
// POST /api/langgraph/agents/execute
// Response structure:
{
  success: true,
  data: {
    image_url: string,
    revised_prompt: string,
    title: string,
    library_id: string,  // ← Use this for materialId
    message_id: string,
    originalParams: { ... }
  }
}
```

### Field Location
```typescript
// T014: Extract materialId from agent result
const materialId = state.result?.data?.library_id || state.result?.metadata?.library_id;
```

---

## Git Commit Template

```bash
git add .
git commit -m "feat(US2): auto-open Library MaterialPreviewModal after image creation

Implements US2 Library Navigation Enhancement with UX enhancements.

Changes:
- T014: Event dispatch in AgentResultView with materialId
- T015: Event handler in Library.tsx to auto-open modal
- T016: Backend library_id verification
- T017: E2E test for complete flow

UX Enhancements:
- UXE-001: Keyboard navigation and ARIA labels
- UXE-007-009: Loading states and progressive disclosure
- UXE-010-011: Error handling with recovery
- UXE-003-006: Mobile optimization

Definition of Done:
✅ Build clean (0 TypeScript errors)
✅ Unit tests pass
✅ E2E tests pass (library-navigation-us2.spec.ts)
✅ Manual verification (Chrome, Safari, Desktop, Mobile)
✅ Accessibility verified (keyboard + screen reader)
✅ Performance verified (<2s navigation, <500ms modal)
✅ Session log created

Performance:
- Navigation: {X}ms (target: <2000ms)
- Modal open: {X}ms (target: <500ms)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
"
```

---

## Emergency Contacts (If Stuck)

1. **Technical Plan**: Full implementation details
   - `docs/architecture/implementation-details/TECHNICAL-PLAN-LIBRARY-NAVIGATION-2025-10-17.md`

2. **Handoff Doc**: Concise guide
   - `docs/architecture/implementation-details/DEVELOPER-HANDOFF-US2-2025-10-17.md`

3. **Brownfield Architecture**: System patterns
   - `docs/architecture/brownfield-architecture.md`

4. **PRD**: Requirements
   - `docs/architecture/implementation-details/PRD-SPRINT-PRIORITIES-2025-10-17.md`

---

## Time Estimate

| Phase | Time |
|-------|------|
| Core Navigation (T014-T016) | 1 hour |
| UX Enhancements | 2.5 hours |
| Testing | 2 hours |
| Documentation | 30 min |
| Buffer | 30 min |
| **TOTAL** | **~8 hours** |

---

## Success Looks Like

✅ Click "In Library öffnen" → Library tab active
✅ Materials subtab selected (not Chats)
✅ MaterialPreviewModal open with correct image
✅ Full keyboard navigation works
✅ Screen reader announces correctly
✅ Navigation <2s, modal <500ms
✅ All tests pass
✅ Manual verification on 4+ devices

---

**Print this and keep nearby. Good luck!**

**Status**: Ready for execution
**Priority**: P1 HIGH
**Estimated Effort**: 8 hours
