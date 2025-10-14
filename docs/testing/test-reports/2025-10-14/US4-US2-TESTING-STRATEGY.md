# Testing Strategy: US4 MaterialPreviewModal & US2 Library Navigation

**Date**: 2025-10-14
**Branch**: `003-agent-confirmation-ux`
**Focus**: Post-fix validation for US4 (Modal Content Visibility) and US2 (Library Navigation)
**Context**: Critical bug fixed - IonContent wrapper div removed (MaterialPreviewModal.tsx:272)

---

## Executive Summary

**Status**: US4 bug fix implemented (removed collapsing wrapper div)
**Fix Applied**: Removed `<div style={{ padding: '16px' }}>` wrapper around IonContent child elements
**Impact**: Modal content should now be visible (image, metadata, buttons)
**Risk Level**: MEDIUM - Ionic framework behavior can be unpredictable, need thorough validation

**Testing Priority**:
1. **CRITICAL**: US4 manual verification (does content appear?)
2. **HIGH**: US2 integration test (navigation + auto-open modal)
3. **MEDIUM**: Regression testing (other modals, responsive behavior)
4. **LOW**: Cross-browser/device compatibility

---

## 1. Test Scope

### US4: MaterialPreviewModal Content Visibility (Priority: P2)

**What Changed**:
- **File**: `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx`
- **Lines Modified**: 270-272 (removed div wrapper, kept IonContent with className="ion-padding")
- **Root Cause**: Wrapper div was collapsing IonContent container (height: 0px)
- **Expected Fix**: Content should now render at correct height with padding

**What Needs Testing**:
- ✅ Image preview renders at full size
- ✅ Metadata section visible (Type, Source, Date, Agent)
- ✅ Action buttons visible (Regenerate, Download, Favorite, Share, Delete)
- ✅ Modal is scrollable on mobile viewports
- ✅ "Neu generieren" button opens AgentFormView with correct prefill data
- ✅ Download button triggers file download
- ✅ Close button works (X in header)
- ✅ Backdrop click closes modal

### US2: Library Navigation after Image Generation (Priority: P1)

**What's Implemented**:
- **Tasks**: T014-T016 in tasks.md (event dispatch, event handler, backend materialId)
- **Components**: AgentResultView.tsx, Library.tsx
- **Expected Flow**: Generate image → Click "In Library öffnen" → Library tab opens → Materials tab active → Modal auto-opens with new image

**What Needs Testing**:
- ✅ "In Library öffnen" button visible after image generation
- ✅ Button click navigates to Library tab
- ✅ Materials subtab is active (not Chats)
- ✅ MaterialPreviewModal auto-opens
- ✅ Modal shows newly generated image (not random material)
- ✅ Custom event fired with correct materialId
- ✅ Material found in materials array
- ✅ No console errors during navigation

**Integration Points** (US4 + US2):
- US2 navigation → US4 modal content display
- If US2 works but US4 fails: Modal opens but content invisible
- If US4 works but US2 fails: Manual Library navigation shows content, but auto-open doesn't work

---

## 2. Test Types & Coverage

### 2.1 Manual Testing (REQUIRED FIRST)

**Why Manual First**:
- Visual verification needed (IonContent rendering is visual bug)
- Fast feedback loop (5 minutes vs. 30 minutes E2E setup)
- Confirms fix before writing automated tests
- Can take screenshots for documentation

**Manual Test Protocol**: See Section 4.1

### 2.2 E2E Testing (AFTER Manual Validation)

**Test Suite**: `teacher-assistant/frontend/e2e-tests/material-preview-modal-simplified.spec.ts`

**Current Status**:
- ✅ File exists (282 lines)
- ✅ 5 test cases defined (US4-001 through US4-005)
- ✅ Uses real API (VITE_TEST_MODE=true for auth bypass)
- ⚠️ Tests may have been written before fix (need to re-run)

**E2E Tests to Run**:
1. `US4-001`: Material card click opens modal
2. `US4-002`: Modal displays image if material is an image
3. `US4-003`: Modal displays metadata section
4. `US4-004`: Modal can be closed
5. `US4-005`: Modal has action buttons

**Command**:
```bash
cd teacher-assistant/frontend
npm run test:e2e -- material-preview-modal-simplified.spec.ts
```

**Expected Pass Rate**: 5/5 (100%) - All tests should pass after fix

### 2.3 Integration Testing

**Test Scenario**: US2 → US4 Integration
- Generate image via agent
- Click "In Library öffnen"
- Verify Library navigation
- Verify modal auto-opens
- Verify modal content visible

**No Dedicated E2E Yet**: Need to create `library-navigation-integration.spec.ts`

### 2.4 Unit Testing

**NOT RECOMMENDED** for this bug:
- Issue is visual/DOM-related (Ionic framework behavior)
- Unit tests can't catch IonContent collapse issues
- Manual + E2E testing sufficient for validation

---

## 3. Test Scenarios (Detailed)

### 3.1 US4: Modal Content Visibility

#### Scenario 1: Image Material Preview (CRITICAL)

**Given**: User is in Library → Materials tab
**And**: At least one image material exists (generated via agent)
**When**: User clicks on image material card
**Then**: MaterialPreviewModal opens with:
- ✅ Full-size image visible (proxied URL)
- ✅ Image scales correctly (max-width: 100%, borderRadius: 8px)
- ✅ Image has alt text (material title)
- ✅ Metadata section visible with 4+ fields:
  - Type: "image"
  - Source: "KI-generiert"
  - Date: Format "DD.MM.YYYY"
  - Agent: "Bildgenerierungs-Agent" (if available)
- ✅ Action buttons section visible with 5 buttons:
  - "Neu generieren" (if source === 'agent-generated')
  - "Download"
  - "Als Favorit" or "Favorit entfernen"
  - "Teilen"
  - "Löschen"

**Test Data Required**:
- Image material with type: 'image'
- Material has metadata.artifact_data.url (S3 URL)
- Material source: 'agent-generated'
- Material metadata.agent_name exists

**Pass Criteria**:
- All elements render within 2 seconds of modal open
- Image loads successfully (onLoad fires, no 404 error)
- Metadata fields populated with actual data (not "undefined")
- All 5 buttons clickable

**Failure Modes**:
- ❌ Modal opens but content area is blank → IonContent still collapsed (fix didn't work)
- ❌ Image shows placeholder "Bild nicht verfügbar" → Proxied URL failing or image expired
- ❌ Metadata shows "undefined" → Parsing issue in useLibraryMaterials.ts
- ❌ Buttons missing → Conditional rendering logic broken

---

#### Scenario 2: Uploaded Image Material Preview

**Given**: User uploaded an image (not agent-generated)
**When**: User clicks on uploaded image card
**Then**: MaterialPreviewModal opens with:
- ✅ Full-size image visible (from metadata.image_data)
- ✅ Metadata shows Source: "Hochgeladen"
- ✅ NO "Neu generieren" button (only for agent-generated)
- ✅ Download button works

**Test Data Required**:
- Material with type: 'upload-image'
- metadata.image_data exists (base64 or file URL)
- source: 'upload'

---

#### Scenario 3: Modal Scroll on Mobile

**Given**: User on mobile viewport (390px width)
**And**: Modal content exceeds viewport height
**When**: User opens modal
**Then**:
- ✅ Modal content is scrollable (overflow-y-auto)
- ✅ Header sticky at top (close button always visible)
- ✅ All buttons reachable after scroll
- ✅ No horizontal scroll (content fits width)

**Test Viewports**:
- 390px × 844px (iPhone 12 Pro)
- 393px × 851px (Pixel 5)
- 360px × 740px (Galaxy S8)

**Pass Criteria**:
- Can scroll to bottom of modal on all viewports
- All 5 action buttons visible after scroll
- No content cut off

---

#### Scenario 4: Regenerate Button Functionality

**Given**: Modal open for agent-generated image
**When**: User clicks "Neu generieren" button
**Then**:
- ✅ AgentFormView modal opens
- ✅ Form prefilled with originalParams:
  - Description field populated
  - Image style dropdown set correctly
- ✅ MaterialPreviewModal closes (no double-modal issue)
- ✅ No console errors

**Test Data Required**:
- Material with metadata.originalParams defined:
  ```json
  {
    "description": "Ein Löwe in der Savanne",
    "imageStyle": "realistic",
    "learningGroup": "Klasse 7-9",
    "subject": "Biologie"
  }
  ```

**Pass Criteria**:
- AgentFormView opens within 500ms
- All form fields correctly populated
- User can modify and regenerate image

---

#### Scenario 5: Download Button

**Given**: Modal open for any image material
**When**: User clicks "Download" button
**Then**:
- ✅ Browser triggers file download
- ✅ Filename is meaningful (not "download.jpg")
- ✅ Image file downloads successfully
- ✅ Modal remains open

**Pass Criteria**:
- File downloads within 3 seconds
- Downloaded file is valid image (can be opened)
- Filename contains material title or date

---

#### Scenario 6: Image Load Error Handling

**Given**: Modal open for image with expired S3 URL (7+ days old)
**When**: Image fails to load (404 error)
**Then**:
- ✅ Placeholder SVG shown ("Bild nicht verfügbar")
- ✅ Hint text visible: "Bilder älter als 7 Tage müssen möglicherweise neu generiert werden."
- ✅ Image has reduced opacity (0.5)
- ✅ "Neu generieren" button still functional
- ✅ No console errors (onError handler catches failure)

---

### 3.2 US2: Library Navigation

#### Scenario 1: Auto-Navigation after Image Generation (CRITICAL)

**Given**: User generated image via agent
**And**: AgentResultView shows "In Library öffnen" button
**When**: User clicks "In Library öffnen"
**Then**:
- ✅ Tab changes from Chat to Library (tab indicator updates)
- ✅ Library loads within 1 second
- ✅ Materials subtab is active (not Chats tab)
- ✅ Material grid visible
- ✅ MaterialPreviewModal auto-opens
- ✅ Modal shows NEWLY GENERATED image (not first item in grid)
- ✅ Modal title matches generated image title

**Test Flow**:
1. Navigate to Chat
2. Send: "Erstelle ein Bild von einem Löwen"
3. Agent confirmation appears → Click "Bild-Generierung starten"
4. Fill form, submit
5. Wait for generation (30-60s)
6. AgentResultView appears with "In Library öffnen" button
7. Click button
8. Verify navigation + modal

**Console Logs to Check**:
```
[Event] Library navigation: tab=materials, materialId=<UUID>
[Library] Received navigate-library-tab event: { tab: 'materials', materialId: '<UUID>', source: 'AgentResultView' }
[Library] Opening modal for material: <UUID>
```

**Pass Criteria**:
- Navigation completes within 1 second
- Correct material displayed (match by UUID)
- Modal content visible (per US4 tests)

**Failure Modes**:
- ❌ Library tab opens but stays on "Chats" → Event not dispatching 'materials' tab
- ❌ Materials tab opens but no modal → Event handler not opening modal
- ❌ Modal opens with wrong image → materialId mismatch or array order issue
- ❌ Modal opens but content invisible → US4 bug not fixed

---

#### Scenario 2: Event Dispatch Verification

**Given**: User clicks "In Library öffnen"
**When**: Button click handler executes
**Then**:
- ✅ Custom event fired: `window.dispatchEvent(new CustomEvent('navigate-library-tab', {...}))`
- ✅ Event detail contains:
  - `tab: 'materials'`
  - `materialId: '<UUID>'` (from agent result)
  - `source: 'AgentResultView'`
- ✅ Console log shows event fired

**Testing Method**:
- Add browser event listener in DevTools:
  ```javascript
  window.addEventListener('navigate-library-tab', (e) => {
    console.log('Event captured:', e.detail);
  });
  ```

**Pass Criteria**:
- Event fires before navigation
- materialId is valid UUID (not null/undefined)

---

#### Scenario 3: Material Not Found Handling

**Given**: User clicks "In Library öffnen"
**And**: materialId in event does NOT exist in materials array
**When**: Library event handler tries to find material
**Then**:
- ✅ Console warning logged: "Material not found: <UUID>"
- ✅ Library opens normally (no crash)
- ✅ Materials tab active
- ✅ Modal does NOT open
- ✅ User can manually browse materials

**Test Scenario**:
- Generate image
- Delete image from library_materials table
- Click "In Library öffnen"
- Verify graceful degradation

---

### 3.3 Integration Test: US2 + US4 Combined

#### Scenario: Full Workflow (E2E)

**Test Name**: "Generate Image → Navigate to Library → Verify Modal Content"

**Steps**:
1. **Setup**: User authenticated, no existing materials
2. **Action 1**: Generate image via agent
   - Send chat message: "Erstelle ein Bild von einer Katze"
   - Confirm agent
   - Fill form, submit
   - Wait for generation (30-60s)
3. **Action 2**: Navigate to Library
   - Click "In Library öffnen" in AgentResultView
4. **Verify 1**: Library tab active
   - Tab indicator shows "Bibliothek"
   - Materials subtab active
5. **Verify 2**: Modal auto-opens
   - MaterialPreviewModal visible
   - Modal has is-open attribute
6. **Verify 3**: Modal content visible
   - Image visible (cat image)
   - Metadata: Type="image", Source="KI-generiert"
   - 5 action buttons visible
7. **Action 3**: Close modal
   - Click X button
   - Modal closes
8. **Verify 4**: Material persists in grid
   - Material card still visible in grid
   - Can re-open modal by clicking card

**Pass Criteria**: All 8 steps pass without errors

**Time Budget**: 90 seconds total (60s generation + 30s testing)

---

## 4. Acceptance Criteria

### US4 Success Criteria

**AC-US4-1**: Modal Content Rendering
- ✅ Image preview renders at full size (not placeholder)
- ✅ Image scales correctly on all viewports (300px - 1200px wide)
- ✅ Image aspect ratio preserved

**AC-US4-2**: Metadata Display
- ✅ Metadata section visible with ALL fields populated:
  - Type field shows material type
  - Source field shows correct label (KI-generiert / Hochgeladen / Manuell erstellt)
  - Date field formatted as DD.MM.YYYY
  - Agent field shows agent name (if agent-generated)
- ✅ NO "undefined" text in any field

**AC-US4-3**: Action Buttons
- ✅ "Neu generieren" button visible ONLY for agent-generated images
- ✅ Download button always visible
- ✅ Favorite button visible with correct icon (outline vs filled)
- ✅ Teilen button visible
- ✅ Löschen button visible with danger styling
- ✅ All buttons clickable (not overlapping or cut off)

**AC-US4-4**: Mobile Responsiveness
- ✅ Modal scrollable on viewports < 600px height
- ✅ All content reachable via scroll
- ✅ Header sticky (close button always visible)
- ✅ No horizontal scroll

**AC-US4-5**: Error Handling
- ✅ Expired image shows fallback placeholder
- ✅ Hint text shown: "Bilder älter als 7 Tage..."
- ✅ No console errors when image fails to load

### US2 Success Criteria

**AC-US2-1**: Navigation Trigger
- ✅ "In Library öffnen" button visible in AgentResultView
- ✅ Button click navigates to Library tab
- ✅ Navigation completes within 1 second

**AC-US2-2**: Tab State
- ✅ Library tab becomes active (tab indicator changes)
- ✅ Materials subtab automatically selected
- ✅ NOT "Chats" subtab

**AC-US2-3**: Modal Auto-Open
- ✅ MaterialPreviewModal opens automatically
- ✅ Modal shows newly generated material (correct UUID)
- ✅ Modal content visible (per US4 AC)

**AC-US2-4**: Event System
- ✅ Custom event fired with correct detail object
- ✅ Event includes: tab, materialId, source
- ✅ Library event handler receives event
- ✅ Material found in materials array

**AC-US2-5**: Error Scenarios
- ✅ If material not found: No crash, warning logged
- ✅ If Library empty: Opens normally, no modal

### Combined Success Criteria

**AC-COMBINED-1**: No Regressions
- ✅ Manual Library navigation still works (clicking material card)
- ✅ Other modals unaffected (AgentFormView, Delete confirmation)
- ✅ Chat functionality unaffected

**AC-COMBINED-2**: Performance
- ✅ Modal opens within 500ms
- ✅ Image loads within 3 seconds
- ✅ Navigation completes within 1 second

**AC-COMBINED-3**: Build & Tests
- ✅ `npm run build` → 0 TypeScript errors
- ✅ E2E tests pass (material-preview-modal-simplified.spec.ts)
- ✅ No console errors in browser

---

## 5. Risk Areas

### 5.1 HIGH RISK: Ionic Framework Behavior

**Risk**: IonContent rendering is framework-specific, behavior varies across versions

**Potential Issues**:
- Fix works on desktop but fails on mobile
- Fix works in dev mode but fails in production build
- Fix works with one Ionic version but breaks after update

**Mitigation**:
- Test on multiple viewports (390px, 768px, 1024px, 1440px)
- Test production build: `npm run build && npm run preview`
- Check Ionic version: `grep '@ionic/react' package.json`
- Review Ionic docs for IonContent best practices

**Contingency Plan**:
- If fix fails: Consider custom modal (non-Ionic) as fallback
- Alternative: Use IonPage layout instead of IonContent

---

### 5.2 MEDIUM RISK: Image Proxy Issues

**Risk**: Proxied image URLs may fail if CORS proxy is down

**Potential Issues**:
- Image loads locally but fails in production
- InstantDB Storage URLs expire after 7 days
- Proxy service has rate limits

**Mitigation**:
- Test with expired image URLs (simulate 404 errors)
- Verify error handler shows fallback placeholder
- Check proxy implementation: `teacher-assistant/frontend/src/lib/imageProxy.ts`

**Contingency Plan**:
- If proxy fails: Add backend endpoint for image serving
- Alternative: Use InstantDB Storage signed URLs with longer expiry

---

### 5.3 MEDIUM RISK: Event Dispatch Timing

**Risk**: navigate-library-tab event may fire before Library component mounts

**Potential Issues**:
- Event fires, but listener not attached yet → Modal doesn't open
- Race condition between tab change and event handling
- InstantDB query not complete when event arrives

**Mitigation**:
- Add console logs to verify event timing
- Test with slow network (DevTools throttling)
- Add delay if needed: `setTimeout(() => dispatch event, 300ms)`

**Contingency Plan**:
- If timing issue: Use React Context instead of DOM events
- Alternative: Pass materialId via URL query parameter

---

### 5.4 LOW RISK: Metadata Parsing

**Risk**: metadata field may be JSON string or already-parsed object

**Potential Issues**:
- useLibraryMaterials.ts assumes string, but receives object
- Backend changes metadata format
- Legacy materials have different structure

**Mitigation**:
- Type guard in mapper: `typeof metadata === 'string' ? JSON.parse(metadata) : metadata`
- Error handling: Try-catch around JSON.parse
- Test with both old and new materials

**Testing**:
- Check console for parse errors
- Verify metadata displays correctly for all materials

---

### 5.5 LOW RISK: Regression - Other Modals

**Risk**: Fix may inadvertently break other modals in the app

**Potential Issues**:
- AgentFormView modal affected
- Delete confirmation alert affected
- Chat image preview modal affected

**Mitigation**:
- Smoke test all modals after fix
- Check for shared Ionic components
- Review other components using IonModal

**Testing Checklist**:
- [ ] AgentFormView opens correctly
- [ ] Delete confirmation shows buttons
- [ ] Chat image preview works
- [ ] Image full-screen preview (click thumbnail in chat)

---

## 6. Test Data Requirements

### 6.1 Required Test Materials

**Minimum Dataset**:
1. **Image Material (Agent-Generated)**
   - Type: 'image'
   - Source: 'agent-generated'
   - metadata.artifact_data.url: Valid S3 URL
   - metadata.agent_name: "Bildgenerierungs-Agent"
   - metadata.originalParams: { description, imageStyle, learningGroup, subject }
   - is_favorite: false

2. **Image Material (Uploaded)**
   - Type: 'upload-image'
   - Source: 'upload'
   - metadata.image_data: Base64 or file URL
   - metadata.filename: "test-image.jpg"

3. **Image Material (Expired URL)**
   - Type: 'image'
   - Source: 'agent-generated'
   - metadata.artifact_data.url: URL returning 404
   - Purpose: Test error handling

### 6.2 Test Data Generation

**Option A: Use Existing Materials**
- Navigate to Library, check for existing images
- If materials exist: Use for testing
- Pro: Fast, uses real data
- Con: May not have all test cases

**Option B: Generate Fresh Material**
- Go to Chat
- Generate image: "Erstelle ein Bild von einem Löwen für Biologieunterricht"
- Wait 30-60s for generation
- Use newly created material
- Pro: Guarantees correct metadata structure
- Con: Time-consuming (60s per image)

**Recommended**: Option B (generate fresh) for US2 testing, Option A (existing) for US4 testing

### 6.3 Test Environment Setup

**Prerequisites**:
```bash
# 1. Start backend
cd teacher-assistant/backend
npm run dev  # Port 3006

# 2. Start frontend
cd teacher-assistant/frontend
npm run dev  # Port 5173

# 3. Verify services
curl http://localhost:3006/health  # Should return 200
open http://localhost:5173          # Should load app
```

**Database State**:
- At least 1 user authenticated
- At least 1 chat session created
- InstantDB connection active

**Browser Setup**:
- Open DevTools Console (for logs)
- Disable cache (for fresh loads)
- Responsive mode for mobile testing

---

## 7. Browser & Device Coverage

### 7.1 Desktop Browsers (MUST TEST)

**Priority 1 (Required)**:
- ✅ Chrome 120+ (Windows/Mac/Linux) - 65% user base
- ✅ Firefox 121+ (Windows/Mac/Linux) - 15% user base
- ✅ Edge 120+ (Windows) - 10% user base

**Priority 2 (Recommended)**:
- ⚠️ Safari 17+ (Mac only) - 8% user base
  - Known issue: Ionic modals behave differently on Safari
  - Test iOS-specific CSS (-webkit-* properties)

**Priority 3 (Optional)**:
- ⬜ Opera, Brave, Vivaldi - 2% user base

### 7.2 Mobile Devices (SHOULD TEST)

**Testing Method**: Chrome DevTools Device Emulation

**Required Viewports**:
1. **iPhone 12 Pro** (390 × 844px) - iOS simulation
2. **Pixel 5** (393 × 851px) - Android simulation
3. **Galaxy S8** (360 × 740px) - Small screen edge case

**Test Cases**:
- Modal fits viewport height
- Buttons not cut off
- Touch targets ≥48px (Apple HIG guideline)
- Scrolling works with touch

### 7.3 Responsive Breakpoints

**Test Widths**:
- 360px (mobile S)
- 390px (mobile M)
- 768px (tablet)
- 1024px (desktop S)
- 1440px (desktop M)
- 1920px (desktop L)

**Expected Behavior**:
- 360-768px: Modal takes full width, buttons stack vertically
- 768-1024px: Modal takes 90% width, buttons may be inline
- 1024px+: Modal max-width 800px, centered

**CSS to Verify**:
```css
/* Check in DevTools */
.ion-page { /* Should have correct width */ }
ion-content { /* Should have height > 0 */ }
```

### 7.4 Network Conditions

**Test Scenarios**:
- ✅ Fast 3G (DevTools throttling)
- ✅ Slow 3G (extreme case)
- ✅ Offline (service worker behavior)

**Expected Behavior**:
- Slow network: Image loads progressively, skeleton shown
- Offline: Cached materials shown, new materials fail gracefully

---

## 8. Regression Risks

### 8.1 High-Risk Regression Areas

**1. Other Modals**
- **Risk**: IonContent change affects all modals
- **Check**: AgentFormView, Delete Alert, Image Preview Modal
- **Test**: Open each modal, verify content visible

**2. Library Grid Layout**
- **Risk**: CSS changes affect material cards
- **Check**: Material cards render correctly
- **Test**: Grid layout on mobile/desktop

**3. Chat Integration**
- **Risk**: Image thumbnail rendering affected
- **Check**: Chat history shows image messages
- **Test**: Generate image, verify thumbnail in chat

### 8.2 Medium-Risk Regression Areas

**4. Favorite Toggle**
- **Risk**: Button click handler broken
- **Check**: Favorite button updates state
- **Test**: Click favorite, verify icon changes

**5. Download Functionality**
- **Risk**: File download trigger broken
- **Check**: Browser downloads file
- **Test**: Click download, verify file saves

**6. Regenerate Flow**
- **Risk**: AgentFormView prefill broken
- **Check**: Form fields populated correctly
- **Test**: Click "Neu generieren", verify form

### 8.3 Low-Risk Regression Areas

**7. Search Functionality**
- **Risk**: Library search still works
- **Check**: Can search by title
- **Test**: Enter search query, verify filtering

**8. Tab Navigation**
- **Risk**: Other tabs still work
- **Check**: Chat/Library/Settings tabs
- **Test**: Click each tab, verify content loads

---

## 9. Testing Execution Plan

### Phase 1: Manual Verification (30 minutes)

**Objective**: Confirm US4 fix works visually

**Tasks**:
1. ⏱️ 5 min: Setup environment (start frontend/backend)
2. ⏱️ 5 min: Generate test image (or use existing)
3. ⏱️ 10 min: Run US4 manual tests (Scenario 1-6)
4. ⏱️ 5 min: Take screenshots, document results
5. ⏱️ 5 min: Test on mobile viewport (390px width)

**Deliverable**: `docs/testing/test-reports/2025-10-14/US4-manual-test-results.md`

**Decision Point**:
- ✅ If all tests pass: Proceed to Phase 2
- ❌ If tests fail: Debug, re-apply fix, repeat Phase 1

---

### Phase 2: E2E Automation (20 minutes)

**Objective**: Run existing E2E tests for regression check

**Tasks**:
1. ⏱️ 5 min: Setup Playwright environment
2. ⏱️ 10 min: Run material-preview-modal-simplified.spec.ts
3. ⏱️ 5 min: Review test report, capture failures

**Commands**:
```bash
cd teacher-assistant/frontend
npm run test:e2e -- material-preview-modal-simplified.spec.ts --headed
```

**Deliverable**: Playwright HTML report (`playwright-report/index.html`)

**Decision Point**:
- ✅ If 5/5 tests pass: Proceed to Phase 3
- ⚠️ If 3-4/5 pass: Document failures, proceed with caution
- ❌ If <3/5 pass: Fix issues, repeat Phase 2

---

### Phase 3: US2 Integration Test (30 minutes)

**Objective**: Verify US2 navigation + US4 content works together

**Tasks**:
1. ⏱️ 10 min: Generate fresh image via agent
2. ⏱️ 10 min: Test "In Library öffnen" navigation
3. ⏱️ 5 min: Verify modal auto-opens with correct content
4. ⏱️ 5 min: Document console logs, take screenshots

**Test Procedure**: Follow US2 Scenario 1 (Section 3.2)

**Deliverable**: `docs/testing/test-reports/2025-10-14/US2-integration-test-results.md`

**Decision Point**:
- ✅ If navigation + modal works: Proceed to Phase 4
- ❌ If navigation fails: Implement T014-T016, repeat Phase 3

---

### Phase 4: Regression Testing (20 minutes)

**Objective**: Ensure no other features broken

**Tasks**:
1. ⏱️ 5 min: Test other modals (AgentFormView, Delete alert)
2. ⏱️ 5 min: Test Library grid and search
3. ⏱️ 5 min: Test Chat integration (image thumbnails)
4. ⏱️ 5 min: Test responsive behavior (3 viewports)

**Checklist**: See Section 8 (Regression Risks)

**Deliverable**: Regression test checklist (pass/fail for each item)

---

### Phase 5: Documentation & Sign-Off (15 minutes)

**Objective**: Document all findings, prepare for PR

**Tasks**:
1. ⏱️ 5 min: Compile all test results into summary report
2. ⏱️ 5 min: Update tasks.md (mark T029-T033 complete if passing)
3. ⏱️ 5 min: Create session log with screenshots and evidence

**Deliverables**:
- `docs/testing/test-reports/2025-10-14/US4-US2-TEST-SUMMARY.md`
- `docs/development-logs/sessions/2025-10-14/session-XX-us4-fix-validation.md`
- Screenshots: `docs/testing/test-reports/2025-10-14/screenshots/`

**Definition of Done**:
- ✅ All US4 manual tests pass
- ✅ E2E tests pass (≥4/5)
- ✅ US2 integration test passes
- ✅ No critical regressions
- ✅ Build clean (`npm run build`)
- ✅ Documentation complete

---

## 10. Manual Test Procedures

### 10.1 US4 Manual Test - Image Content Visibility

**Prerequisites**:
- Frontend running: http://localhost:5173
- Backend running: http://localhost:3006
- User authenticated
- At least 1 image material in Library

**Test Steps**:

1. **Open Library**
   ```
   Action: Click "Bibliothek" tab
   Expected: Library loads, Materials subtab active
   Result: [ PASS / FAIL ]
   ```

2. **Click Material Card**
   ```
   Action: Click first image material card
   Expected: MaterialPreviewModal opens (backdrop visible)
   Result: [ PASS / FAIL ]
   ```

3. **Verify Image Rendering**
   ```
   Action: Look at modal content area
   Expected: Full-size image visible (not blank)
   Actual Image Size: _____ × _____ px
   Result: [ PASS / FAIL ]
   Screenshot: us4-image-visible.png
   ```

4. **Verify Metadata Section**
   ```
   Action: Scroll down (if needed), look for metadata fields
   Expected: 4 fields visible:
     - Type: [ Visible / Not Visible ] Value: _______
     - Source: [ Visible / Not Visible ] Value: _______
     - Date: [ Visible / Not Visible ] Value: _______
     - Agent: [ Visible / Not Visible ] Value: _______
   Result: [ PASS / FAIL ]
   Screenshot: us4-metadata-visible.png
   ```

5. **Verify Action Buttons**
   ```
   Action: Scroll to bottom of modal
   Expected: 5 buttons visible:
     - "Neu generieren": [ Visible / Not Visible ]
     - "Download": [ Visible / Not Visible ]
     - "Als Favorit": [ Visible / Not Visible ]
     - "Teilen": [ Visible / Not Visible ]
     - "Löschen": [ Visible / Not Visible ]
   Result: [ PASS / FAIL ]
   Screenshot: us4-buttons-visible.png
   ```

6. **Test Mobile Viewport**
   ```
   Action: Open DevTools → Responsive mode → 390px width
   Expected: Modal scrollable, all content reachable
   Result: [ PASS / FAIL ]
   Screenshot: us4-mobile-scroll.png
   ```

7. **Test Close Button**
   ```
   Action: Click X button in header
   Expected: Modal closes, returns to Library grid
   Result: [ PASS / FAIL ]
   ```

**Summary**:
- Tests Passed: ___ / 7
- Tests Failed: ___ / 7
- Critical Failures: [ YES / NO ]
- Overall Status: [ PASS / FAIL ]

**Notes**:
_______________________________________________________
_______________________________________________________

---

### 10.2 US2 Manual Test - Library Navigation

**Prerequisites**:
- Frontend running
- Backend running
- User authenticated
- Ready to generate new image

**Test Steps**:

1. **Generate Image**
   ```
   Action: Navigate to Chat
   Action: Send "Erstelle ein Bild von einem Löwen"
   Action: Confirm agent, fill form, submit
   Expected: Image generates successfully (wait 30-60s)
   Result: [ PASS / FAIL ]
   Timestamp Started: _______
   Timestamp Completed: _______
   ```

2. **Verify "In Library öffnen" Button**
   ```
   Action: Look at AgentResultView after generation
   Expected: "In Library öffnen" button visible
   Result: [ PASS / FAIL ]
   Screenshot: us2-button-visible.png
   ```

3. **Click Navigation Button**
   ```
   Action: Click "In Library öffnen" button
   Expected: Tab changes to "Bibliothek" within 1 second
   Result: [ PASS / FAIL ]
   Navigation Time: _____ ms
   ```

4. **Verify Library Tab State**
   ```
   Action: Check active tab indicator
   Expected: "Bibliothek" tab active (highlighted)
   Result: [ PASS / FAIL ]
   ```

5. **Verify Materials Subtab**
   ```
   Action: Check subtab state in Library
   Expected: "Materialien" subtab active (NOT "Chats")
   Actual Subtab: [ Materialien / Chats ]
   Result: [ PASS / FAIL ]
   ```

6. **Verify Modal Auto-Opens**
   ```
   Action: Check if modal appeared automatically
   Expected: MaterialPreviewModal is open
   Result: [ PASS / FAIL ]
   Screenshot: us2-modal-auto-open.png
   ```

7. **Verify Correct Material**
   ```
   Action: Check modal title
   Expected: Title matches newly generated image
   Actual Title: _______________________
   Result: [ PASS / FAIL ]
   ```

8. **Check Console Logs**
   ```
   Action: Open DevTools Console, search for logs
   Expected Logs:
     - [ FOUND / NOT FOUND ] "[Event] Library navigation: tab=materials, materialId=..."
     - [ FOUND / NOT FOUND ] "[Library] Received navigate-library-tab event:"
     - [ FOUND / NOT FOUND ] "[Library] Opening modal for material: ..."
   Result: [ PASS / FAIL ]
   ```

**Summary**:
- Tests Passed: ___ / 8
- Tests Failed: ___ / 8
- Critical Failures: [ YES / NO ]
- Overall Status: [ PASS / FAIL ]

**Console Logs** (copy relevant logs):
```
_______________________________________________________
_______________________________________________________
```

---

### 10.3 Regression Test - Other Modals

**Prerequisites**:
- Frontend running
- User authenticated

**Test Checklist**:

1. **AgentFormView Modal**
   ```
   Action: Go to Chat, send "Erstelle ein Bild"
   Action: Click "Bild-Generierung starten"
   Expected: Modal opens with form fields visible
   Result: [ PASS / FAIL ]
   ```

2. **Delete Confirmation Alert**
   ```
   Action: Go to Library, open material modal
   Action: Click "Löschen" button
   Expected: IonAlert appears with "Abbrechen" and "Löschen" buttons
   Result: [ PASS / FAIL ]
   ```

3. **Chat Image Thumbnail**
   ```
   Action: Go to Chat, find message with image
   Expected: Thumbnail visible inline (max 300px width)
   Result: [ PASS / FAIL ]
   ```

4. **Image Full-Screen Preview**
   ```
   Action: Click image thumbnail in Chat
   Expected: Full-screen modal opens
   Result: [ PASS / FAIL ]
   ```

**Summary**:
- Tests Passed: ___ / 4
- Tests Failed: ___ / 4
- Regressions Found: [ YES / NO ]

---

## 11. Test Results Template

### Test Execution Summary

**Date**: 2025-10-14
**Tester**: ___________________
**Environment**:
- Frontend: http://localhost:5173
- Backend: http://localhost:3006
- Browser: _______________ Version: ______
- Viewport: _______ × _______ px

---

### US4 Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Image Visible | ☐ PASS ☐ FAIL | |
| Metadata Visible | ☐ PASS ☐ FAIL | |
| Buttons Visible | ☐ PASS ☐ FAIL | |
| Mobile Scroll | ☐ PASS ☐ FAIL | |
| Close Button | ☐ PASS ☐ FAIL | |
| Regenerate Button | ☐ PASS ☐ FAIL | |
| Download Button | ☐ PASS ☐ FAIL | |

**US4 Overall**: ☐ PASS ☐ FAIL
**Critical Blockers**: _______________________

---

### US2 Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Button Visible | ☐ PASS ☐ FAIL | |
| Navigation Works | ☐ PASS ☐ FAIL | |
| Tab State Correct | ☐ PASS ☐ FAIL | |
| Modal Auto-Opens | ☐ PASS ☐ FAIL | |
| Correct Material | ☐ PASS ☐ FAIL | |
| Console Logs | ☐ PASS ☐ FAIL | |

**US2 Overall**: ☐ PASS ☐ FAIL
**Critical Blockers**: _______________________

---

### E2E Test Results

**Test Suite**: material-preview-modal-simplified.spec.ts
**Command**: `npm run test:e2e`

| Test Case | Status | Duration | Notes |
|-----------|--------|----------|-------|
| US4-001: Card click opens modal | ☐ PASS ☐ FAIL | ___s | |
| US4-002: Modal displays image | ☐ PASS ☐ FAIL | ___s | |
| US4-003: Modal displays metadata | ☐ PASS ☐ FAIL | ___s | |
| US4-004: Modal can be closed | ☐ PASS ☐ FAIL | ___s | |
| US4-005: Modal has action buttons | ☐ PASS ☐ FAIL | ___s | |

**E2E Overall**: ☐ PASS ☐ FAIL
**Pass Rate**: ___% (___/5)

---

### Regression Results

| Area | Status | Notes |
|------|--------|-------|
| AgentFormView Modal | ☐ PASS ☐ FAIL | |
| Delete Alert | ☐ PASS ☐ FAIL | |
| Chat Thumbnails | ☐ PASS ☐ FAIL | |
| Library Grid | ☐ PASS ☐ FAIL | |
| Search Functionality | ☐ PASS ☐ FAIL | |

**Regressions Found**: ☐ YES ☐ NO

---

### Build Verification

```bash
# Command
cd teacher-assistant/frontend && npm run build

# Result
TypeScript Errors: ___ errors
Build Status: ☐ SUCCESS ☐ FAILED
Build Time: ___s
```

---

### Screenshots

- [ ] us4-image-visible.png
- [ ] us4-metadata-visible.png
- [ ] us4-buttons-visible.png
- [ ] us4-mobile-scroll.png
- [ ] us2-button-visible.png
- [ ] us2-modal-auto-open.png

**Screenshots Location**: `docs/testing/test-reports/2025-10-14/screenshots/`

---

### Recommendation

**Overall Status**: ☐ READY FOR PRODUCTION ☐ NEEDS FIXES ☐ BLOCKED

**Action Items**:
1. _______________________________________
2. _______________________________________
3. _______________________________________

**Sign-Off**:
- QA Approved: ☐ YES ☐ NO
- Date: __________
- Signature: __________________

---

## 12. Next Steps

### If Tests Pass (All Green)

1. **Update tasks.md**
   - Mark T029-T033 as ✅ complete
   - Add test evidence to task notes

2. **Create Session Log**
   - Document fix implementation
   - Include test results
   - Add screenshots

3. **Prepare for PR**
   - Run `npm run build` (verify 0 errors)
   - Commit changes
   - Write PR description with test summary

4. **Move to Next User Story**
   - US2 implementation (T014-T016) if not done
   - Or US5 (Auto-tagging) if US2 complete

### If Tests Fail (Red Flags)

1. **Document Failures**
   - Screenshot failing state
   - Copy console errors
   - Note exact failure conditions

2. **Debug**
   - Check if wrapper div still present (revert issue)
   - Verify IonContent has className="ion-padding"
   - Test with minimal modal (remove all content, just add text)

3. **Alternative Solutions**
   - Try removing IonContent entirely (test with plain div)
   - Try different Ionic modal presentation mode
   - Consider custom modal component (non-Ionic)

4. **Escalate**
   - Document issue in bug-tracking.md
   - Create new debugging session log
   - Request support from Ionic community/docs

---

## Appendix A: Console Log Reference

### Expected Logs (Success Case)

**US4 - Modal Opening**:
```
🎨 [DEBUG US4] MaterialPreviewModal rendering: {
  materialId: '<UUID>',
  materialTitle: 'einem Löwen',
  materialType: 'image',
  'type === "image"': true,
  hasMetadata: true,
  hasArtifactData: true,
  'artifact_data?.url': 'https://instant-storage.s3.amazonaws.com/...',
  'condition result': true
}

🖼️ [DEBUG US4] Image rendering: {
  originalUrl: 'https://instant-storage.s3.amazonaws.com/...',
  proxiedUrl: 'https://instant-storage.s3.amazonaws.com/...',
  'proxiedUrl === originalUrl': false
}

✅ [DEBUG US4] Image loaded successfully! {
  naturalWidth: 1024,
  naturalHeight: 1024,
  displayWidth: 358,
  displayHeight: 358,
  ...
}
```

**US2 - Library Navigation**:
```
[AgentResultView] handleOpenInLibrary called with materialId: <UUID>
[Event] Library navigation: tab=materials, materialId=<UUID>, source=AgentResultView
[Library] Received navigate-library-tab event: { tab: 'materials', materialId: '<UUID>', source: 'AgentResultView' }
[Library] Material found in array: <UUID>
[Library] Opening modal for material: <UUID>
```

### Error Logs (Failure Cases)

**IonContent Still Collapsed**:
```
🔍 [DEBUG US4] IonContent investigation: {
  ionContentHeight: 0,  // ❌ Still 0!
  scrollElementHeight: 0
}
```

**Material Not Found**:
```
⚠️ [Library] Material not found: <UUID>
[Library] Available materials: [<UUID1>, <UUID2>, ...]
```

**Image Load Failure**:
```
❌ [DEBUG US4] Image failed to load: {
  src: 'https://...',
  error: 'Failed to load resource: 404'
}
```

---

## Appendix B: Quick Reference

### Component Files
- **MaterialPreviewModal**: `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx`
- **AgentResultView**: `teacher-assistant/frontend/src/components/AgentResultView.tsx`
- **Library**: `teacher-assistant/frontend/src/pages/Library/Library.tsx`
- **useLibraryMaterials**: `teacher-assistant/frontend/src/hooks/useLibraryMaterials.ts`

### Test Files
- **E2E (US4)**: `teacher-assistant/frontend/e2e-tests/material-preview-modal-simplified.spec.ts`
- **E2E (US2)**: Not created yet (need library-navigation.spec.ts)

### Commands
```bash
# Start dev servers
cd teacher-assistant/backend && npm run dev
cd teacher-assistant/frontend && npm run dev

# Run E2E tests
cd teacher-assistant/frontend
npm run test:e2e -- material-preview-modal-simplified.spec.ts

# Build verification
npm run build

# View test report
npx playwright show-report
```

### Key Selectors
```typescript
// Modal
'ion-modal'
'ion-content'

// Material card
'[data-testid="material-card"]'

// Modal elements
'[data-testid="material-image"]'
'[data-testid="material-title"]'
'[data-testid="material-type"]'
'[data-testid="download-button"]'
'[data-testid="regenerate-button"]'
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-14
**Status**: Draft - Ready for QA Review
**Next Review**: After manual testing complete
