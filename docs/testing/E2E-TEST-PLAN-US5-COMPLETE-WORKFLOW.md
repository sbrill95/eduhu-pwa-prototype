# E2E Test Plan: US5 - Automatic Image Tagging Complete Workflow

**Created**: 2025-10-15
**Feature**: User Story 5 - Automatic Image Tagging via Vision API
**Purpose**: Verify complete end-to-end workflow from image generation to tag-based search
**Execution Mode**: Manual with automated verification
**Prerequisites**: Backend running on port 3006, Frontend running on port 5173, OpenAI API key configured

---

## Test Objective

Verify that the automatic image tagging feature works end-to-end:
1. User generates image via chat interface
2. Backend automatically calls Vision API to generate tags
3. Tags are saved to InstantDB metadata
4. User can search for images using generated tags
5. Tags remain internal (not visible in UI)

---

## Prerequisites Checklist

**Before Starting:**

- [ ] Backend server running: `cd teacher-assistant/backend && npm run dev`
- [ ] Frontend server running: `cd teacher-assistant/frontend && npm run dev`
- [ ] Backend accessible at: `http://localhost:3006`
- [ ] Frontend accessible at: `http://localhost:5173`
- [ ] OpenAI API key configured in backend/.env: `OPENAI_API_KEY=sk-...`
- [ ] Browser DevTools open (Console tab visible for logs)
- [ ] Screen recording tool ready (optional but recommended)
- [ ] Terminal window visible for backend logs

**Verify Prerequisites:**
```bash
# Test backend health
curl http://localhost:3006/api/health

# Test Vision API directly (should return tags)
curl -X POST http://localhost:3006/api/vision/tag-image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg", "context": {"title": "Test", "subject": "Biologie"}}'
```

Expected: Both commands return success responses.

---

## Test Case 1: Image Generation Triggers Automatic Tagging

### Test ID: US5-E2E-001
**Priority**: P1 (Critical)
**Estimated Time**: 5-10 minutes

### Test Steps

#### Step 1: Open Frontend Application
1. Navigate to `http://localhost:5173` in browser
2. Verify app loads successfully
3. Open Browser DevTools → Console tab
4. **Screenshot**: Homepage loaded

#### Step 2: Navigate to Chat
1. Click "Chat" tab in bottom navigation
2. Verify chat interface visible
3. **Screenshot**: Chat interface

#### Step 3: Send Image Generation Request
1. In chat input, type: **"Erstelle ein Bild von einem anatomischen Löwen für den Biologieunterricht, Seitenansicht mit Skelettstruktur"**
2. Press Enter or Send button
3. Wait for AI response (may take 5-10 seconds)
4. **Screenshot**: Message sent

#### Step 4: Confirm Agent Execution
1. Look for Agent Confirmation Card (orange gradient card)
2. Verify card shows: "Bild-Generierung starten" button
3. Click "Bild-Generierung starten" button
4. Wait for image generation (may take 20-30 seconds)
5. **Screenshot**: Agent confirmation card
6. **Screenshot**: Image generation in progress

#### Step 5: Monitor Backend Logs
While image is generating, watch terminal with backend logs for:

**Expected Log Sequence:**
```
[ImageAgent] Creating library material...
[ImageAgent] Library material created with ID: <uuid>
[ImageAgent] Triggering automatic tagging for: <uuid>
[VisionService] Calling GPT-4o Vision for tagging...
[VisionService] Generated <X> tags in <Y>ms: ["tag1", "tag2", ...]
[ImageAgent] Tagging complete for <uuid>: ["tag1", "tag2", ...]
[ImageAgent] ✅ Tags saved for <uuid>: tag1, tag2, tag3, ...
```

**Document:**
- ✅ All log messages appeared
- ✅ Number of tags generated: ____
- ✅ Processing time: ____ ms
- ✅ Tags list: ____________________

**Screenshot**: Backend terminal showing Vision API logs

#### Step 6: Verify Image Result
1. Wait for agent completion
2. Verify image appears in result view
3. **Screenshot**: Generated image result

### Expected Results

- ✅ Image generated successfully
- ✅ Backend logs show Vision API call
- ✅ Tags generated (5-10 tags in German)
- ✅ Processing time < 30 seconds
- ✅ No errors in backend logs
- ✅ Image appears in UI

### Acceptance Criteria

- [ ] Image generation completes without errors
- [ ] Backend logs show `[ImageAgent] Triggering automatic tagging`
- [ ] Backend logs show `[VisionService] Generated X tags`
- [ ] Backend logs show `[ImageAgent] ✅ Tags saved`
- [ ] Tags are in German
- [ ] 5-10 tags generated
- [ ] Processing time < 30s

---

## Test Case 2: Verify Tags Saved to InstantDB

### Test ID: US5-E2E-002
**Priority**: P1 (Critical)
**Estimated Time**: 3-5 minutes

### Test Steps

#### Step 1: Extract Material ID from Logs
1. Find the line in backend logs: `[ImageAgent] ✅ Tags saved for <uuid>`
2. Copy the UUID (material ID)
3. **Document**: Material ID = `____________________________________`

#### Step 2: Query InstantDB API
```bash
# Use InstantDB admin panel or API to query material
# Replace <materialId> with actual ID from logs

curl -X POST https://api.instantdb.com/admin/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <INSTANT_ADMIN_TOKEN>" \
  -d '{
    "appId": "39f14e13-9afb-4222-be45-3d2c231be3a1",
    "query": {
      "library_materials": {
        "$": {
          "where": {
            "id": "<materialId>"
          }
        }
      }
    }
  }'
```

**Alternative: Use InstantDB Dashboard**
1. Go to https://www.instantdb.com/dash
2. Select app: `39f14e13-9afb-4222-be45-3d2c231be3a1`
3. Navigate to Explorer → library_materials
4. Find material by ID
5. View metadata field

#### Step 3: Verify Metadata Structure
Expected metadata JSON:
```json
{
  "type": "image",
  "image_url": "https://...",
  "title": "...",
  "originalParams": { ... },
  "tags": ["anatomie", "biologie", "löwe", "skelett", ...],
  "tagging": {
    "generatedAt": 1234567890,
    "model": "gpt-4o",
    "confidence": "high",
    "processingTime": 2889
  }
}
```

**Screenshot**: InstantDB query result showing metadata with tags

### Expected Results

- ✅ Material record found in InstantDB
- ✅ metadata field contains JSON object
- ✅ metadata.tags is an array of strings
- ✅ 5-10 tags present
- ✅ All tags are lowercase German words
- ✅ metadata.tagging contains timestamp, model, confidence

### Acceptance Criteria

- [ ] Material exists in InstantDB
- [ ] metadata.tags array exists
- [ ] Tags count: 5-10
- [ ] All tags lowercase
- [ ] No duplicate tags
- [ ] metadata.tagging.model = "gpt-4o"
- [ ] metadata.tagging.confidence = "high"

---

## Test Case 3: Tag-Based Search in Library

### Test ID: US5-E2E-003
**Priority**: P1 (Critical)
**Estimated Time**: 3-5 minutes

### Test Steps

#### Step 1: Navigate to Library
1. Click "Bibliothek" (Library) tab in bottom navigation
2. Wait for Library to load
3. Click "Materialien" tab (if not already selected)
4. **Screenshot**: Library materials view

#### Step 2: Identify Test Tags
From backend logs or InstantDB query, note 2-3 tags to test:
- **Tag 1**: ____________________
- **Tag 2**: ____________________
- **Tag 3**: ____________________

Example tags: "anatomie", "biologie", "löwe"

#### Step 3: Search by First Tag
1. Locate search input in Library (if available)
   - **Note**: If search input not visible, document this and skip to manual verification
2. Type first tag in search input (e.g., "anatomie")
3. Wait 1 second for filtering
4. **Screenshot**: Search results for tag 1

**Expected**:
- ✅ Generated image appears in results
- ✅ Other materials may also appear (if they have same tag)

#### Step 4: Search by Second Tag
1. Clear search input
2. Type second tag (e.g., "biologie")
3. Wait 1 second for filtering
4. **Screenshot**: Search results for tag 2

#### Step 5: Search by Partial Tag
1. Clear search input
2. Type partial tag (e.g., "ana" for "anatomie")
3. Verify partial matching works
4. **Screenshot**: Partial search results

#### Step 6: Search by Non-Existent Tag
1. Clear search input
2. Type random tag that doesn't exist (e.g., "xyz123")
3. Verify no results or empty state
4. **Screenshot**: No results

### Expected Results

- ✅ Search input accessible in Library
- ✅ Typing tag filters materials
- ✅ Generated image appears in results
- ✅ Partial tag matching works
- ✅ Non-existent tags show no results

### Acceptance Criteria

- [ ] Search input exists in Library UI
- [ ] Tag 1 search finds generated image
- [ ] Tag 2 search finds generated image
- [ ] Partial tag search works (e.g., "ana" finds "anatomie")
- [ ] Non-existent tag shows appropriate feedback
- [ ] Search is case-insensitive

**If Search UI Not Available:**
- [ ] Document that search UI needs implementation
- [ ] Verify tag matching logic exists in `useLibraryMaterials.ts` (code review)
- [ ] Mark test as "Blocked - UI Not Implemented"

---

## Test Case 4: Tags NOT Visible in UI (Privacy)

### Test ID: US5-E2E-004
**Priority**: P1 (Critical - Privacy Requirement FR-029)
**Estimated Time**: 2-3 minutes

### Test Steps

#### Step 1: Open Material Preview Modal
1. In Library → Materialien, locate generated image card
2. Click on the image card
3. Wait for MaterialPreviewModal to open
4. **Screenshot**: Modal opened with image

#### Step 2: Inspect Modal Content
1. Carefully read all visible text in modal
2. Look for any of these elements:
   - "Tags:" label
   - "Schlagwörter:" label
   - Any of the generated tags visible as text
   - Tag chips or badges
   - Metadata section showing tags

**Document**:
- Modal shows title: ☐ Yes ☐ No
- Modal shows image: ☐ Yes ☐ No
- Modal shows metadata (type, date, etc.): ☐ Yes ☐ No
- **Modal shows tags**: ☐ Yes ☐ No ← **MUST BE NO**
- Modal shows action buttons: ☐ Yes ☐ No

#### Step 3: Verify Tags Hidden
**Expected**: Tags should NOT appear anywhere in the UI

**Screenshot**: Full modal content (proving tags not visible)

#### Step 4: Inspect Page Source (Optional)
1. Right-click modal → Inspect Element
2. Search page source for tag values (e.g., "anatomie", "biologie")
3. Verify tags only appear in:
   - ✅ Console logs (acceptable)
   - ✅ Network responses (acceptable)
   - ❌ Rendered HTML (NOT acceptable)

### Expected Results

- ✅ Modal displays image, title, metadata
- ✅ Tags are NOT visible anywhere in UI
- ✅ No "Tags:" or "Schlagwörter:" label
- ✅ Generated tag words don't appear as visible text
- ✅ Privacy requirement FR-029 met

### Acceptance Criteria

- [ ] MaterialPreviewModal opens successfully
- [ ] Modal shows image and title
- [ ] Tags NOT visible in modal
- [ ] No "Tags" label in UI
- [ ] Tag values not rendered in HTML
- [ ] Search still works (tags internal only)

---

## Test Case 5: Graceful Degradation (Error Handling)

### Test ID: US5-E2E-005
**Priority**: P2 (Important)
**Estimated Time**: 5-10 minutes

### Test Steps

#### Step 1: Test with Invalid Image URL (Backend)
```bash
# Test Vision API with broken URL
curl -X POST http://localhost:3006/api/vision/tag-image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://invalid-url-that-does-not-exist.com/image.jpg", "context": {"title": "Test"}}'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "tags": [],
    "confidence": "low",
    "model": "gpt-4o",
    "processingTime": <time>
  }
}
```

**Screenshot**: Response showing empty tags but success

#### Step 2: Generate Image with Tagging Failure
1. **Temporarily disable Vision API** (optional):
   - Rename `OPENAI_API_KEY` in .env to `OPENAI_API_KEY_DISABLED`
   - Restart backend
2. Generate image via frontend (same as Test Case 1)
3. Verify image creation still succeeds
4. Check backend logs for tagging warning

**Expected Logs**:
```
[ImageAgent] Triggering automatic tagging for: <uuid>
[VisionService] Tagging failed: <error message>
[ImageAgent] Tagging failed (non-blocking): <error>
```

**Important**: Image should still be created and visible!

**Screenshot**: Image created despite tagging failure

#### Step 3: Re-enable Vision API
1. Restore `OPENAI_API_KEY` in .env
2. Restart backend
3. Generate another test image to verify tagging works again

### Expected Results

- ✅ Invalid URL returns empty tags (not error)
- ✅ Image creation succeeds even if tagging fails
- ✅ Backend logs warning but doesn't crash
- ✅ User experience unchanged (no visible errors)
- ✅ Re-enabling Vision API restores tagging

### Acceptance Criteria

- [ ] Invalid image URL handled gracefully
- [ ] Empty tags returned (not error thrown)
- [ ] Image creation NEVER fails due to tagging
- [ ] Backend logs warning (not error)
- [ ] Feature degrades gracefully
- [ ] Re-enabling Vision API works immediately

---

## Test Case 6: Performance & Rate Limiting

### Test ID: US5-E2E-006
**Priority**: P2 (Monitoring)
**Estimated Time**: 5 minutes

### Test Steps

#### Step 1: Measure Vision API Performance
Generate 3 images back-to-back and measure timing:

**Image 1**:
- Vision API call time: _____ ms (from logs)
- Tags generated: _____
- Confidence: _____

**Image 2**:
- Vision API call time: _____ ms
- Tags generated: _____
- Confidence: _____

**Image 3**:
- Vision API call time: _____ ms
- Tags generated: _____
- Confidence: _____

**Calculate**:
- Average time: _____ ms
- Min time: _____ ms
- Max time: _____ ms

#### Step 2: Test Rate Limiting
Send 11 requests rapidly to Vision API:

```bash
# Run this command 11 times quickly
for i in {1..11}; do
  curl -X POST http://localhost:3006/api/vision/tag-image \
    -H "Content-Type: application/json" \
    -d '{"imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg"}' &
done
wait
```

**Expected**:
- First 10 requests: HTTP 200 (success)
- 11th request: HTTP 429 (Too Many Requests)

**Screenshot**: Rate limit error message

### Expected Results

- ✅ Average response time < 5 seconds
- ✅ All responses complete within 30 seconds
- ✅ Rate limiting triggers at 11th request
- ✅ Rate limit error message clear

### Acceptance Criteria

- [ ] Average Vision API time < 5s
- [ ] Maximum time < 30s (timeout)
- [ ] Rate limit enforced (10/minute)
- [ ] Rate limit error returns HTTP 429
- [ ] Rate limit resets after 1 minute

---

## Test Case 7: Multi-Language & Edge Cases

### Test ID: US5-E2E-007
**Priority**: P3 (Edge Cases)
**Estimated Time**: 10 minutes

### Test Steps

#### Edge Case 1: Very Simple Image
Generate image: **"Ein roter Kreis"** (A red circle)

**Expected Tags**: geometric shapes, colors, education, mathematics, etc.

**Document**:
- Tags generated: _____________________
- Tag count: _____
- Relevance assessment: ☐ High ☐ Medium ☐ Low

#### Edge Case 2: Complex Subject
Generate image: **"Mitochondrium mit innerer und äußerer Membran für Zellbiologie, mikroskopische Darstellung"**

**Expected Tags**: biologie, zellbiologie, mitochondrium, membran, mikroskopie, etc.

**Document**:
- Tags generated: _____________________
- Tag count: _____
- Scientific accuracy: ☐ High ☐ Medium ☐ Low

#### Edge Case 3: Abstract Concept
Generate image: **"Visualisierung der Photosynthese als Prozessdiagramm"**

**Expected Tags**: photosynthese, biologie, prozess, diagramm, pflanze, etc.

**Document**:
- Tags generated: _____________________
- Tag count: _____
- Concept matching: ☐ High ☐ Medium ☐ Low

### Expected Results

- ✅ Simple images get appropriate tags
- ✅ Complex subjects get detailed tags
- ✅ Abstract concepts get contextual tags
- ✅ All tags remain in German
- ✅ Tag count consistent (5-10 per image)

---

## Test Completion Checklist

After completing all test cases, verify:

### Code Requirements
- [ ] FR-022: Backend calls Vision API after image creation ✅
- [ ] FR-023: Prompt requests 5-10 German tags ✅
- [ ] FR-024: Tags saved to metadata.tags ✅
- [ ] FR-025: Tags lowercase and deduplicated ✅
- [ ] FR-026: Maximum 15 tags per image ✅
- [ ] FR-027: Tagging MUST NOT block image saving ✅
- [ ] FR-028: Tags searchable in Library ✅
- [ ] FR-029: Tags NOT visible in UI ✅

### Success Criteria
- [ ] SC-005: 7-10 tags per image (average: _____)
- [ ] SC-006: Tag search ≥80% precision (assessed: ____%)

### Test Evidence
- [ ] All screenshots captured and organized
- [ ] Backend logs saved to file
- [ ] InstantDB query results documented
- [ ] Performance metrics recorded
- [ ] Edge cases tested and documented

---

## Documentation Requirements

After completing all tests, create:

### 1. Test Execution Report
**File**: `docs/testing/test-reports/2025-10-15/US5-e2e-execution-report.md`

**Include**:
- Test date and time
- Test environment (versions, ports, etc.)
- All 7 test cases with PASS/FAIL status
- Screenshots for each step
- Backend logs (full or excerpts)
- InstantDB query results
- Performance metrics
- Issues found (if any)

### 2. Screenshot Gallery
**Folder**: `docs/testing/screenshots/2025-10-15/US5-complete-workflow/`

**Required Screenshots**:
1. `01-frontend-homepage.png`
2. `02-chat-interface.png`
3. `03-agent-confirmation.png`
4. `04-backend-logs-tagging.png`
5. `05-image-result.png`
6. `06-instantdb-metadata.png`
7. `07-library-search-tag1.png`
8. `08-library-search-tag2.png`
9. `09-modal-no-tags-visible.png`
10. `10-rate-limit-error.png`

### 3. Backend Logs
**File**: `docs/testing/logs/2025-10-15/backend-vision-api-logs.txt`

**Include**:
- All Vision API calls
- Tag generation results
- Processing times
- Any errors or warnings

### 4. Summary Verdict
**File**: `docs/testing/test-reports/2025-10-15/US5-VERDICT.md`

**Template**:
```markdown
# US5 - Automatic Image Tagging: Final Verdict

**Date**: 2025-10-15
**Tester**: [Your Name]
**Total Test Cases**: 7
**Passed**: __ / 7
**Failed**: __ / 7
**Blocked**: __ / 7

## Overall Result: ☐ PASS ☐ FAIL ☐ PARTIAL

## Critical Issues Found:
1. [Issue description if any]
2. ...

## Recommendations:
- [Recommendation 1]
- [Recommendation 2]

## Deployment Decision:
☐ Approved for Production
☐ Needs Fixes Before Deployment
☐ Blocked - Cannot Deploy

**Sign-off**: __________________
```

---

## Troubleshooting Guide

### Issue: Backend Not Starting
**Symptoms**: Port 3006 not accessible
**Solution**:
```bash
# Kill existing process
taskkill /F /IM node.exe  # Windows
# OR
pkill node  # Mac/Linux

# Restart backend
cd teacher-assistant/backend
npm run dev
```

### Issue: Frontend Not Loading
**Symptoms**: localhost:5173 shows error
**Solution**:
```bash
cd teacher-assistant/frontend
npm run dev
```

### Issue: Vision API Timeout
**Symptoms**: Logs show "Vision API timeout (30s)"
**Solution**:
- Check OpenAI API key is valid
- Check internet connection
- Retry with simpler image
- Check OpenAI API status: https://status.openai.com

### Issue: Tags Not Saved
**Symptoms**: Backend logs show tagging but InstantDB has no tags
**Solution**:
- Check InstantDB connection
- Verify material ID matches between logs and query
- Check metadata field exists in schema
- Restart backend and try again

### Issue: Search Not Working
**Symptoms**: Typing tags doesn't filter results
**Solution**:
- Verify search UI exists (may not be implemented yet)
- Check browser console for JavaScript errors
- Verify `useLibraryMaterials.ts` has tag matching logic
- May need to implement search UI component

---

## Success Criteria Summary

**Test is PASS if**:
- ✅ All 7 test cases pass
- ✅ Vision API generates tags (5-10 per image)
- ✅ Tags saved to InstantDB metadata
- ✅ Tag-based search works (if UI available)
- ✅ Tags NOT visible in UI
- ✅ Graceful degradation works
- ✅ No critical bugs found

**Test is PARTIAL if**:
- ✅ Vision API works
- ✅ Tags saved to database
- ⚠️ Search UI not implemented (blocked)
- ✅ Privacy maintained
- ⚠️ Minor issues found

**Test is FAIL if**:
- ❌ Vision API not working
- ❌ Tags not saved to database
- ❌ Tags visible in UI (privacy violation)
- ❌ Image creation fails due to tagging
- ❌ Critical bugs block feature

---

## Estimated Total Time

- **Setup & Prerequisites**: 10 minutes
- **Test Case 1** (Image Generation): 10 minutes
- **Test Case 2** (InstantDB Verification): 5 minutes
- **Test Case 3** (Tag Search): 5 minutes
- **Test Case 4** (Privacy): 3 minutes
- **Test Case 5** (Error Handling): 10 minutes
- **Test Case 6** (Performance): 5 minutes
- **Test Case 7** (Edge Cases): 10 minutes
- **Documentation**: 20 minutes

**Total**: ~80 minutes (1.5 hours)

---

## Agent Handoff Instructions

**When giving this to an agent, say:**

> "Please execute the complete E2E test plan in `docs/testing/E2E-TEST-PLAN-US5-COMPLETE-WORKFLOW.md`. Follow all 7 test cases step-by-step, capture screenshots at each checkpoint, document all results, and create the final test report with verdict. Work autonomously - make decisions when needed, document everything, and provide a comprehensive summary at the end."

**Agent should:**
1. Read this entire document first
2. Verify prerequisites
3. Execute all 7 test cases in order
4. Capture required screenshots
5. Save backend logs
6. Create all required documentation
7. Provide final verdict (PASS/FAIL/PARTIAL)
8. Commit documentation to git

**Expected Output**:
- Test execution report (markdown)
- Screenshot gallery (10+ images)
- Backend logs (text file)
- Final verdict with recommendations

---

**Document Version**: 1.0
**Last Updated**: 2025-10-15
**Status**: Ready for Execution
