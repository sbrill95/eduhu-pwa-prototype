# Testing Strategy Summary: US4 & US2

**Date**: 2025-10-14
**Focus**: Post-fix validation for MaterialPreviewModal bug
**Full Document**: `US4-US2-TESTING-STRATEGY.md` (12,000+ words)

---

## What Changed

**Bug Fixed**: MaterialPreviewModal content was invisible (IonContent height: 0px)
**Root Cause**: Wrapper `<div>` around IonContent children was collapsing the container
**Fix Applied**: Removed wrapper div, kept `<IonContent className="ion-padding">` with direct children
**File**: `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx:270-272`

---

## Testing Priorities (5-Phase Plan)

### Phase 1: Manual Verification (30 min) - REQUIRED FIRST
**Objective**: Visual confirmation that content now renders

**Steps**:
1. Start frontend/backend
2. Navigate to Library → Materials
3. Click material card
4. **Verify**: Image, metadata, buttons ALL VISIBLE
5. **Verify**: Mobile viewport scrollable
6. Take screenshots

**Decision**: If pass → Phase 2. If fail → Debug and retry.

---

### Phase 2: E2E Automation (20 min)
**Objective**: Run existing Playwright tests for regression check

**Command**:
```bash
cd teacher-assistant/frontend
npm run test:e2e -- material-preview-modal-simplified.spec.ts
```

**Expected**: 5/5 tests pass (US4-001 through US4-005)

---

### Phase 3: US2 Integration (30 min)
**Objective**: Test Library navigation after image generation

**Flow**:
1. Generate image via agent
2. Click "In Library öffnen" button
3. Verify Library tab opens
4. Verify Materials subtab active
5. Verify modal auto-opens with correct image

**Blocker**: If US2 not implemented (T014-T016), skip this phase

---

### Phase 4: Regression Testing (20 min)
**Objective**: Ensure no collateral damage

**Checklist**:
- ✅ AgentFormView modal works
- ✅ Delete confirmation alert works
- ✅ Chat image thumbnails work
- ✅ Library grid and search work

---

### Phase 5: Documentation (15 min)
**Objective**: Prepare for PR

**Deliverables**:
- Test summary report
- Session log with screenshots
- Update tasks.md (mark T029-T033 complete)

---

## Critical Success Criteria

### US4 (Modal Content)
- ✅ Image renders at full size (not blank)
- ✅ Metadata section visible (Type/Source/Date/Agent)
- ✅ 5 action buttons visible (Regenerate/Download/Favorite/Share/Delete)
- ✅ Mobile viewport scrollable
- ✅ No "undefined" text in fields

### US2 (Library Navigation)
- ✅ "In Library öffnen" button navigates to Library
- ✅ Materials subtab automatically selected
- ✅ Modal auto-opens with newly generated material
- ✅ Console logs show event fired + handled

### Build & Tests
- ✅ `npm run build` → 0 TypeScript errors
- ✅ E2E tests ≥80% pass rate (4/5 minimum)
- ✅ No console errors in browser

---

## Risk Areas (What Could Still Break)

### HIGH RISK
**Ionic Framework Behavior**: Fix works on desktop but fails on mobile
- **Mitigation**: Test on 3+ viewports (390px, 768px, 1024px)
- **Contingency**: Consider custom modal (non-Ionic) if Ionic unreliable

### MEDIUM RISK
**Image Proxy Failures**: Proxied URLs fail or images expired
- **Mitigation**: Test with expired URL (simulate 404)
- **Contingency**: Show placeholder: "Bild nicht verfügbar"

**Event Timing**: navigate-library-tab event fires before listener attached
- **Mitigation**: Add console logs, test with network throttling
- **Contingency**: Add setTimeout delay or use React Context

### LOW RISK
**Metadata Parsing**: JSON string vs. parsed object inconsistency
- **Mitigation**: Type guard in mapper (`typeof === 'string'`)

**Other Modals Broken**: Shared Ionic components affected
- **Mitigation**: Smoke test all modals (AgentFormView, Delete alert)

---

## Quick Start - Manual Test (5 Minutes)

**Prerequisites**:
- Frontend: http://localhost:5173
- Backend: http://localhost:3006
- User authenticated

**Test Steps**:
1. Go to Library → Materialien
2. Click any image card
3. Modal opens → **Check**:
   - [ ] Image visible (not blank)
   - [ ] Metadata fields visible (4 rows)
   - [ ] Buttons visible (5 buttons)
4. DevTools → Responsive (390px width) → **Check**:
   - [ ] Modal scrollable
   - [ ] All content reachable
5. Close modal → **Check**:
   - [ ] Modal closes cleanly

**Result**: [ PASS / FAIL ]

If PASS: Proceed to E2E tests
If FAIL: Open full strategy document for debug steps

---

## Test Data Requirements

**Minimum Dataset**:
1. **Agent-Generated Image**: Type='image', source='agent-generated', has originalParams
2. **Uploaded Image**: Type='upload-image', source='upload' (optional)
3. **Expired Image**: S3 URL returns 404 (optional, for error testing)

**How to Get Test Data**:
- **Option A**: Use existing materials in Library
- **Option B**: Generate fresh image in Chat (30-60s)

**Recommended**: Option B for US2 testing (guarantees correct metadata)

---

## Expected Console Logs (Success Case)

**US4 Modal Opening**:
```
🎨 [DEBUG US4] MaterialPreviewModal rendering: { materialType: 'image', ... }
🖼️ [DEBUG US4] Image rendering: { originalUrl: '...', proxiedUrl: '...' }
✅ [DEBUG US4] Image loaded successfully! { naturalWidth: 1024, ... }
```

**US2 Library Navigation**:
```
[Event] Library navigation: tab=materials, materialId=<UUID>
[Library] Received navigate-library-tab event: { ... }
[Library] Opening modal for material: <UUID>
```

**Failure Indicators**:
```
🔍 [DEBUG US4] IonContent investigation: { ionContentHeight: 0 }  // ❌ Fix didn't work
❌ [DEBUG US4] Image failed to load: { error: '404' }             // ❌ Image expired
⚠️ [Library] Material not found: <UUID>                            // ❌ materialId mismatch
```

---

## Browser & Device Coverage

**Desktop** (MUST TEST):
- ✅ Chrome 120+ (65% users)
- ✅ Firefox 121+ (15% users)
- ✅ Edge 120+ (10% users)

**Mobile** (DevTools Emulation):
- ✅ iPhone 12 Pro (390px)
- ✅ Pixel 5 (393px)
- ✅ Galaxy S8 (360px)

---

## Definition of Done

**US4 Complete When**:
- ✅ Manual test passes (all content visible)
- ✅ E2E tests pass (≥4/5)
- ✅ Mobile viewport works (scrollable)
- ✅ No regressions (other modals work)
- ✅ Build clean (0 errors)

**US2 Complete When**:
- ✅ "In Library öffnen" navigates correctly
- ✅ Modal auto-opens with correct material
- ✅ Console logs show event flow
- ✅ Integration with US4 works

**Ready for PR When**:
- ✅ Both US4 and US2 complete
- ✅ Session log created with screenshots
- ✅ tasks.md updated (T029-T033 marked complete)
- ✅ No critical bugs in regression tests

---

## Files to Review

**Components**:
- `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx` (lines 270-441)
- `teacher-assistant/frontend/src/components/AgentResultView.tsx` (US2 navigation)
- `teacher-assistant/frontend/src/pages/Library/Library.tsx` (event handler)

**Tests**:
- `teacher-assistant/frontend/e2e-tests/material-preview-modal-simplified.spec.ts`

**Documentation**:
- `specs/003-agent-confirmation-ux/tasks.md` (T029-T033)
- `docs/testing/MODAL-VISIBILITY-DEBUG-REPORT-2025-10-14.md` (root cause analysis)

---

## Next Actions

### Immediate (Today)
1. Run Phase 1 manual test (30 min)
2. Document results with screenshots
3. If pass: Run Phase 2 E2E tests
4. If fail: Debug, review full strategy document

### Tomorrow (If Tests Pass)
1. Implement US2 if not done (T014-T016)
2. Run Phase 3 integration test
3. Create session log
4. Prepare PR

### If Tests Fail
1. Review debug section in full strategy document
2. Check Ionic documentation for IonContent best practices
3. Consider alternative modal approach (custom div-based modal)
4. Escalate to team if Ionic issue persists

---

**Document**: `US4-US2-TESTING-STRATEGY.md` (full version, 12,000 words)
**Location**: `docs/testing/test-reports/2025-10-14/`
**Status**: Ready for QA execution
