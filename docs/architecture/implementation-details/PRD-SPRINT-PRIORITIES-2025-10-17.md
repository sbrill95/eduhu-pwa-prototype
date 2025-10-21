# Product Requirements Document: Sprint Priorities
**Created**: 2025-10-17
**Author**: Business Analyst (Mary)
**Type**: Sprint Planning PRD
**Scope**: Critical Bug Fixes + High-Priority Features

---

## Executive Summary

This PRD defines the implementation requirements for critical fixes and high-priority features across the Teacher Assistant application, prioritized by impact and effort.

### Features Covered

1. **P0 CRITICAL**: Message Persistence Fix (Spec 001) - 5 minutes
2. **P1 HIGH**: Library Navigation Enhancement (Spec 003 US2) - 2 hours
3. **P2 MEDIUM**: Automatic Image Tagging (Spec 003 US5) - 5 hours
4. **P2 MEDIUM**: Chat Organization (Phase 2 completion) - 3-4 hours

### Business Goals

- **Reliability**: Fix critical data persistence bug blocking core functionality
- **User Experience**: Enable seamless navigation from image generation to Library
- **Discoverability**: Implement intelligent auto-tagging for enhanced material and chat search
- **Phase 2 Completion**: Deliver all Phase 2 features (Vision, Memory, Chat Organization, Real-time)

### Success Criteria

- All critical bugs resolved (100%)
- E2E test pass rate ≥90%
- Core user journeys fully functional
- Enhanced search capabilities via auto-tagging

---

## Problem Statement

### Current Issues

**Critical (P0)**:
- Messages fail to persist to database due to field name mismatch
- Chat history lost after agent-generated image creation
- User cannot see AI responses or generated content

**High Priority (P1)**:
- Library navigation broken after image generation
- Users cannot view newly created images in Library context
- "In Library öffnen" button navigates to wrong tab

**Medium Priority (P2)**:
- No automatic tagging for generated images
- Library search limited to title/description only
- Users cannot find materials by semantic content

### Impact

**Without P0 Fix**:
- Core functionality broken (message persistence)
- User trust eroded (content disappears)
- **DEPLOYMENT BLOCKED**

**Without P1 Fix**:
- Poor UX (broken navigation workflow)
- Users frustrated (can't access their created content)
- Workaround: Manual navigation to Library tab

**Without P2 Implementation**:
- Limited search capability
- Material discovery difficult as library grows
- Workaround: Manual title/description-based search

---

## Feature #1: Message Persistence Fix (P0 CRITICAL)

### User Story

**As a** teacher
**I want** my chat messages and AI-generated content to persist correctly to the database
**So that** I can maintain conversation history and reference previous interactions

### Current Behavior

- Frontend uses incorrect field names (`session:`, `author:`)
- InstantDB expects `session_id` and `user_id`
- Messages fail to save silently
- Chat history lost after page refresh

### Expected Behavior

- Frontend uses correct field names (`session_id`, `user_id`)
- Messages persist successfully to InstantDB
- Chat history preserved across sessions
- AI-generated images appear in chat with metadata

### Acceptance Criteria

**AC-001**: Field names corrected in `AgentResultView.tsx`
- [ ] Line 279: `session:` changed to `session_id:`
- [ ] Line 280: `author:` changed to `user_id:`
- [ ] Build succeeds with 0 TypeScript errors
- [ ] Git commit passes pre-commit hooks

**AC-002**: Message persistence verified
- [ ] Create test message via frontend
- [ ] Message appears in InstantDB `messages` table
- [ ] `session_id` field populated with correct session UUID
- [ ] `user_id` field populated with correct user UUID
- [ ] Metadata JSON string stored correctly

**AC-003**: E2E tests pass
- [ ] US2 (Message Persistence) test passes
- [ ] US4 (Metadata Persistence) test passes
- [ ] Overall E2E pass rate ≥90% (10/11 steps)
- [ ] Zero InstantDB schema errors in console

### Technical Requirements

#### Frontend Changes

**File**: `teacher-assistant/frontend/src/components/AgentResultView.tsx`
**Lines**: 279-280

```typescript
// BEFORE (WRONG):
await db.transact([
  db.tx.messages[messageId].update({
    content: 'Ich habe ein Bild für dich erstellt.',
    role: 'assistant',
    timestamp: now,
    message_index: messageIndex,
    is_edited: false,
    metadata: JSON.stringify(metadata),
    session: state.sessionId,  // ❌ Wrong field name
    author: user.id            // ❌ Wrong field name
  })
]);

// AFTER (CORRECT):
await db.transact([
  db.tx.messages[messageId].update({
    content: 'Ich habe ein Bild für dich erstellt.',
    role: 'assistant',
    timestamp: now,
    message_index: messageIndex,
    is_edited: false,
    metadata: JSON.stringify(metadata),
    session_id: state.sessionId,  // ✅ Correct
    user_id: user.id              // ✅ Correct
  })
]);
```

#### Verification Steps

1. **Code Fix** (2 minutes):
   - Edit `AgentResultView.tsx` lines 279-280
   - Save file
   - Run `npm run build` → verify 0 errors

2. **Functional Test** (5 minutes):
   - Start backend: `cd teacher-assistant/backend && npm run dev`
   - Start frontend: `cd teacher-assistant/frontend && npm run dev`
   - Open app: http://localhost:5173
   - Login as test user
   - Generate image via AI agent
   - Open InstantDB Dashboard → Explorer → messages table
   - Verify latest message has:
     - `session_id` field populated (UUID format)
     - `user_id` field populated (UUID format)
     - `metadata` field contains JSON string

3. **E2E Test** (10 minutes):
   - Run: `cd teacher-assistant/frontend && VITE_TEST_MODE=true npx playwright test e2e-tests/bug-fixes-2025-10-11.spec.ts`
   - Verify: ≥10/11 steps passing (≥90%)
   - Screenshot failing steps (if any)

### Dependencies

- **None** - Can implement immediately
- Backend already uses correct field names (fixed in previous session)

### Risks & Mitigation

**Risk**: Fix doesn't fully resolve persistence issue
- **Mitigation**: Manual verification in InstantDB Dashboard
- **Fallback**: Revert commit, investigate deeper

**Risk**: Other components depend on old field names
- **Mitigation**: Grep codebase for `session:` and `author:` patterns
- **Probability**: Low (backend already migrated)

### Definition of Done

- [ ] Code fix applied and committed
- [ ] Build clean (0 TypeScript errors)
- [ ] Functional test passed (message in InstantDB with correct fields)
- [ ] E2E tests ≥90% pass rate
- [ ] Session log updated with verification results
- [ ] Git commit with message: "fix: correct InstantDB field names in AgentResultView (session_id, user_id)"

---

## Feature #2: Library Navigation Enhancement (P1 HIGH)

### User Story

**As a** teacher
**I want** to be automatically navigated to the Library with the newly created image opened
**So that** I can immediately review, download, or regenerate my created material without manual navigation

### Current Behavior

- User clicks "In Library öffnen" button in AgentResultView
- Library tab opens
- **Problem**: Lands on "Chats" subtab instead of "Materials" subtab
- **Problem**: MaterialPreviewModal does NOT auto-open
- **Problem**: No `materialId` passed in navigation event
- User must manually click "Materials" tab, then click image card

### Expected Behavior

- User clicks "In Library öffnen" button
- Library tab opens
- **Automatically**: "Materials" subtab is active
- **Automatically**: MaterialPreviewModal opens showing the newly created image
- Modal displays: Full image preview, title, metadata, action buttons (Regenerate, Download)
- User can immediately interact with material (download, regenerate, favorite, share)

### Acceptance Criteria

**AC-001**: Event dispatch includes materialId
- [ ] `AgentResultView.tsx` dispatches custom event `navigate-library-tab`
- [ ] Event detail contains: `{ tab: 'materials', materialId: '<uuid>', source: 'AgentResultView' }`
- [ ] materialId extracted from `state.result?.data?.library_id` or `state.result?.metadata?.library_id`
- [ ] Console log confirms: `[Event] Library navigation: tab=materials, materialId=<uuid>`

**AC-002**: Library event handler opens modal
- [ ] `Library.tsx` listens for `navigate-library-tab` event
- [ ] On event, switches to "Materials" subtab
- [ ] If `materialId` provided, finds material in materials array
- [ ] Converts material to `UnifiedMaterial` via `convertArtifactToUnifiedMaterial()`
- [ ] Sets `selectedMaterial` state and `isModalOpen` to `true`
- [ ] Console log confirms: `[Library] Opening modal for material: <uuid>`

**AC-003**: Backend returns library_id
- [ ] Backend `langGraphAgents.ts` includes `library_id` in agent result
- [ ] Field location documented: `result.data.library_id` or `result.metadata.library_id`
- [ ] API contract updated with `library_id` field

**AC-004**: E2E test passes
- [ ] Generate image via agent
- [ ] Click "In Library öffnen" button
- [ ] Verify Library tab becomes active (IonTab with selected="library")
- [ ] Verify "Materials" subtab selected (not "Chats")
- [ ] Verify MaterialPreviewModal opens automatically
- [ ] Verify modal shows newly created image (full size)
- [ ] Verify modal displays title, metadata, action buttons
- [ ] Navigation completes in <2s

### Technical Requirements

#### Task T014: Event Dispatch in AgentResultView.tsx

**File**: `teacher-assistant/frontend/src/components/AgentResultView.tsx`
**Function**: `handleOpenInLibrary` (~line 356-390)
**Effort**: 20 minutes

**Implementation**:
```typescript
const handleOpenInLibrary = () => {
  // Close modal first
  closeModal();

  // Extract materialId from agent result
  const materialId = state.result?.data?.library_id || state.result?.metadata?.library_id;

  if (!materialId) {
    console.warn('[AgentResultView] No materialId found in agent result, navigating to Library without auto-open');
  }

  // Log navigation event (FR-011)
  console.log('[Event] Library navigation:', {
    tab: 'materials',
    materialId: materialId,
    source: 'AgentResultView',
    timestamp: Date.now()
  });

  // Dispatch custom event with materialId
  window.dispatchEvent(new CustomEvent('navigate-library-tab', {
    detail: {
      tab: 'materials',
      materialId: materialId,
      source: 'AgentResultView'
    }
  }));

  // Navigate to Library tab
  navigateToTab('library');
};
```

**Verification**:
- Console shows log with materialId
- Event detail contains `materialId` field
- Navigation still works if `materialId` is undefined (graceful degradation)

---

#### Task T015: Library Event Handler Extension

**File**: `teacher-assistant/frontend/src/pages/Library/Library.tsx`
**Function**: `navigate-library-tab` event listener (~line 114-129)
**Effort**: 30 minutes

**Implementation**:
```typescript
useEffect(() => {
  const handleLibraryNavigation = (event: Event) => {
    const customEvent = event as CustomEvent<{
      tab: 'chats' | 'materials';
      materialId?: string;
      source?: string;
    }>;

    console.log('[Library] Received navigate-library-tab event:', customEvent.detail);

    // Switch to requested tab
    if (customEvent.detail.tab) {
      setSelectedFilter(customEvent.detail.tab === 'materials' ? 'Bilder' : 'Alle');
    }

    // Auto-open modal if materialId provided
    if (customEvent.detail?.materialId) {
      const material = materials.find(m => m.id === customEvent.detail.materialId);

      if (material) {
        console.log('[Library] Opening modal for material:', customEvent.detail.materialId);

        // Convert to UnifiedMaterial
        const unifiedMaterial = convertArtifactToUnifiedMaterial(material);

        // Open modal
        setSelectedMaterial(unifiedMaterial);
        setIsModalOpen(true);
      } else {
        console.warn('[Library] Material not found:', customEvent.detail.materialId, {
          availableMaterials: materials.length,
          source: customEvent.detail.source
        });
      }
    }
  };

  window.addEventListener('navigate-library-tab', handleLibraryNavigation);

  return () => {
    window.removeEventListener('navigate-library-tab', handleLibraryNavigation);
  };
}, [materials]); // Dependency: materials array
```

**Key Points**:
- Event listener depends on `materials` array (must be available)
- Graceful degradation if material not found (log warning, don't crash)
- TypeScript type for event detail
- Cleanup function removes event listener

**Verification**:
- Modal opens when materialId valid
- Warning logged when materialId not found
- No memory leaks (listener removed on unmount)

---

#### Task T016: Backend library_id Verification

**File**: `teacher-assistant/backend/src/routes/langGraphAgents.ts`
**Location**: After image generation success (~line 347)
**Effort**: 15 minutes

**Action**: Verify `materialId` is returned in agent result

**Current Code** (from debug logs):
```typescript
// Backend logs show:
// libraryMaterialId: 0e457ee7-ea5c-4519-9e1d-a01d3d7d41fa

// Need to verify where it's returned:
return {
  success: true,
  data: {
    library_id: materialId,  // ✅ Preferred location
    // ... other fields
  },
  metadata: {
    library_id: materialId,  // ⚠️ Alternative location
    // ... other fields
  }
};
```

**Verification Steps**:
1. Review `langGraphAgents.ts` return statement after image creation
2. Confirm `library_id` field exists in response
3. Document field location in API contract
4. Update frontend to read from correct location

**Expected Result**:
```json
// POST /api/agents/image/generate
// Response:
{
  "success": true,
  "data": {
    "library_id": "0e457ee7-ea5c-4519-9e1d-a01d3d7d41fa",
    "imageUrl": "https://instant-storage.s3.amazonaws.com/...",
    "title": "Anatomischer Löwe für Biologieunterricht"
  }
}
```

---

#### Task T017: E2E Test for Library Navigation

**File**: `teacher-assistant/frontend/e2e-tests/library-navigation.spec.ts` (NEW)
**Effort**: 30 minutes

**Test Implementation**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('US2: Library Navigation after Image Creation', () => {
  test('should navigate to Library Materials tab and auto-open modal', async ({ page }) => {
    console.log('🎯 Starting US2 Library Navigation test');

    // Step 1: Generate image via agent
    await page.goto('http://localhost:5173');
    await page.click('[data-testid="chat-tab"]');
    await page.fill('textarea[placeholder*="Nachricht"]', 'Erstelle ein Bild von einem Löwen für Biologieunterricht');
    await page.click('button[type="submit"]');

    // Wait for agent confirmation card
    await page.waitForSelector('[data-testid="agent-confirmation-card"]', { timeout: 10000 });
    await page.click('[data-testid="agent-confirm-button"]');

    // Wait for image generation (60s max)
    await page.waitForSelector('[data-testid="agent-result-view"]', { timeout: 60000 });
    console.log('✅ Image generated successfully');

    // Step 2: Click "In Library öffnen" button
    const libraryButton = page.locator('button:has-text("In Library öffnen")');
    await expect(libraryButton).toBeVisible({ timeout: 5000 });
    await libraryButton.click();
    console.log('✅ Clicked "In Library öffnen" button');

    // Step 3: Verify Library tab active
    await expect(page.locator('[data-testid="library-tab"][selected="true"]')).toBeVisible({ timeout: 3000 });
    console.log('✅ Library tab is active');

    // Step 4: Verify "Materials" subtab selected
    const materialsTab = page.locator('ion-segment-button[value="Bilder"]');
    await expect(materialsTab).toHaveClass(/segment-button-checked/);
    console.log('✅ Materials subtab is active');

    // Step 5: Verify MaterialPreviewModal opened
    const modal = page.locator('ion-modal[data-testid="material-preview-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });
    console.log('✅ MaterialPreviewModal opened automatically');

    // Step 6: Verify modal shows image
    const modalImage = modal.locator('img[alt*="Material"]');
    await expect(modalImage).toBeVisible({ timeout: 2000 });
    console.log('✅ Modal displays image preview');

    // Step 7: Verify modal metadata and buttons
    await expect(modal.locator('h2')).toContainText('Löwe'); // Title contains "Löwe"
    await expect(modal.locator('button:has-text("Regenerieren")')).toBeVisible();
    await expect(modal.locator('button:has-text("Herunterladen")')).toBeVisible();
    console.log('✅ Modal displays metadata and action buttons');

    // Step 8: Measure navigation time
    const navigationEndTime = Date.now();
    // (Capture start time earlier, calculate duration here)
    // expect(duration).toBeLessThan(2000); // <2s per SC-002

    console.log('✅ US2 Library Navigation test PASSED');
  });

  test('should handle missing materialId gracefully', async ({ page }) => {
    // Test edge case: Navigation without materialId
    // Should still navigate to Library, but not auto-open modal

    console.log('🎯 Testing graceful degradation (no materialId)');

    // Manually dispatch event without materialId
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('navigate-library-tab', {
        detail: { tab: 'materials' } // No materialId
      }));
    });

    // Verify: Library tab active, Materials subtab active, but NO modal
    await expect(page.locator('[data-testid="library-tab"][selected="true"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('ion-segment-button[value="Bilder"]')).toHaveClass(/segment-button-checked/);
    await expect(page.locator('ion-modal[data-testid="material-preview-modal"]')).not.toBeVisible();

    console.log('✅ Graceful degradation test PASSED');
  });
});
```

**Expected Results**:
- **Test 1**: All 7 steps pass, modal opens with correct material
- **Test 2**: Graceful degradation works (no crash if materialId missing)

---

### User Experience Flow

**Before Fix**:
1. User generates image → AgentResultView shows success
2. User clicks "In Library öffnen" → Library tab opens
3. **Problem**: Lands on "Chats" subtab
4. User manually clicks "Materials" tab
5. User manually scrolls to find image
6. User manually clicks image card → Modal opens
7. **Total clicks**: 3, **Time**: ~10-15 seconds

**After Fix**:
1. User generates image → AgentResultView shows success
2. User clicks "In Library öffnen" → Library tab opens
3. **Automatically**: "Materials" subtab active, Modal opens with image
4. User immediately interacts (download, regenerate, etc.)
5. **Total clicks**: 1, **Time**: <2 seconds

**Time Saved**: ~8-13 seconds per image creation
**User Delight**: Seamless workflow, no manual navigation

---

### Dependencies

- **T014 → T015**: Event must dispatch materialId before Library can handle it
- **T016**: Backend must return `library_id` for frontend to extract
- **T001**: Requires `convertArtifactToUnifiedMaterial()` utility (already exists from Spec 002)

### Risks & Mitigation

**Risk**: materialId not in expected location
- **Mitigation**: Check multiple locations (`result.data.library_id`, `result.metadata.library_id`)
- **Fallback**: Log warning, navigate to Library without auto-open

**Risk**: Material not found in Library (race condition)
- **Mitigation**: Retry logic or wait for materials to load
- **Fallback**: Navigate to Library, user clicks card manually

**Risk**: Modal doesn't open on mobile
- **Mitigation**: Test on both Desktop Chrome and Mobile Safari
- **Fallback**: User clicks card manually

### Definition of Done

- [ ] T014: Event dispatch implemented and verified
- [ ] T015: Event handler implemented and verified
- [ ] T016: Backend `library_id` location confirmed
- [ ] T017: E2E test created and passing
- [ ] Manual test on Desktop Chrome: Modal opens automatically
- [ ] Manual test on Mobile Safari: Modal opens automatically
- [ ] Session log updated with implementation details
- [ ] Git commit: "feat(US2): auto-open Library MaterialPreviewModal after image creation"

---

## Feature #3: Automatic Image Tagging (P2 MEDIUM)

### User Story

**As a** teacher
**I want** my generated images to be automatically tagged with relevant educational keywords
**So that** I can quickly find materials by topic without manually tagging each image

### Current Behavior

- Images saved to Library with title and description only
- Search limited to title/description text matching
- No semantic or content-based search
- User must remember exact title to find images
- Library becomes difficult to navigate with >20 images

### Expected Behavior

- After image generation, ChatGPT Vision API automatically analyzes image
- 5-10 relevant educational tags generated in German
- Tags saved to `library_materials.metadata.tags` as array
- Tags normalized: lowercase, deduplicated, max 15
- Library search finds materials by tag keywords
- Tags NOT visible in UI (internal only for search)
- Graceful degradation: Image saves even if tagging fails

### Acceptance Criteria

**AC-001**: Vision API integration
- [ ] Vision Service created in `backend/src/services/visionService.ts`
- [ ] Service uses ChatGPT GPT-4o model with vision capabilities
- [ ] Prompt requests 5-10 educational tags in German
- [ ] Response parsed and normalized (lowercase, dedupe, max 15)
- [ ] Tags saved to `library_materials.metadata.tags` array
- [ ] Processing time <30s (timeout after 30s, empty tags on failure)

**AC-002**: Automatic tagging workflow
- [ ] After image saved to `library_materials`, Vision API called automatically
- [ ] Tagging is async and non-blocking (image saves first, tagging happens after)
- [ ] Error-tolerant: Failed tagging doesn't prevent image save
- [ ] Backend logs tagging start, success, or failure
- [ ] Tags stored in metadata alongside `originalParams`

**AC-003**: Tag-based search
- [ ] Library search includes tag matching (case-insensitive, partial match)
- [ ] Search query "ana" matches tag "anatomie"
- [ ] Multiple tags increase findability (e.g., "biologie löwe" matches both tags)
- [ ] Tag search combined with title/description search (OR logic)

**AC-004**: Privacy & UX
- [ ] Tags NOT visible in MaterialPreviewModal UI
- [ ] No "Tags:" label or tag chips in modal
- [ ] Tags only used internally for search
- [ ] User unaware of auto-tagging (transparent enhancement)

**AC-005**: Error handling & graceful degradation
- [ ] Vision API timeout (>30s) → empty tags, image still saved
- [ ] Vision API error (4xx/5xx) → empty tags, image still saved
- [ ] No image URL → skip tagging, image still saved
- [ ] Invalid image format → skip tagging, image still saved

### Technical Requirements

#### Task T003: Create Vision Service

**File**: `teacher-assistant/backend/src/services/visionService.ts` (NEW)
**Effort**: 2 hours

**Implementation**: (See comprehensive code in Feature Review document)

**Key Methods**:
- `tagImage(imageUrl, context)` - Main Vision API call
- `normalizeTags(tags)` - Lowercase, dedupe, max 15
- `updateMaterialTags(materialId, tags)` - Save to InstantDB

**Vision Prompt**:
```
Analysiere dieses Bildungsmaterial und generiere 5-10 relevante Tags auf Deutsch für Suchzwecke.

Berücksichtige:
- Fachgebiet (Biologie, Mathematik, Geografie, etc.)
- Thema/Konzept (Anatomie, Geometrie, Klimazonen, etc.)
- Visuelle Elemente (Diagramm, Foto, Illustration, etc.)
- Bildungskontext (Grundschule, Sekundarstufe, etc.)
- Perspektive/Stil (Seitenansicht, schematisch, realistisch, etc.)

Kontext:
- Titel: {title}
- Beschreibung: {description}
- Fach: {subject}
- Lerngruppe: {grade}

Gib die Tags als kommaseparierte Liste zurück, nur lowercase, keine Duplikate.
Beispiel: anatomie, biologie, löwe, seitenansicht, säugetier, muskulatur, skelett
```

**Error Handling**:
```typescript
try {
  const response = await openai.chat.completions.create({ /* ... */ });
  // Process tags...
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    console.warn('[VisionService] ⏱️ Timeout after 30s - saving image with empty tags');
  } else if (error.status >= 400 && error.status < 500) {
    console.error('[VisionService] ❌ Client error:', error.status, error.message);
  } else if (error.status >= 500) {
    console.error('[VisionService] ❌ Server error:', error.status, error.message);
  } else {
    console.error('[VisionService] ❌ Unknown error:', error.message);
  }

  return {
    tags: [],
    confidence: 'low',
    model: 'gpt-4o',
    processingTime: Date.now() - startTime
  };
}
```

---

#### Task T004: Create Vision API Route

**File**: `teacher-assistant/backend/src/routes/visionTagging.ts` (NEW)
**Effort**: 45 minutes

**Implementation**: (See comprehensive code in Feature Review document)

**API Endpoint**: `POST /api/vision/tag-image`

**Rate Limiting**:
- 100 requests per hour per user
- 10 requests per minute per user
- HTTP 429 if limit exceeded

**Authentication**: Requires valid auth token (via `requireAuth` middleware)

---

#### Task T005: Register Vision Routes

**File**: `teacher-assistant/backend/src/server.ts`
**Effort**: 10 minutes

**Implementation**:
```typescript
import visionTaggingRoutes from './routes/visionTagging';

// Register Vision API routes
app.use('/api/vision', visionTaggingRoutes);

console.log('[Server] Vision API routes registered at /api/vision');
```

---

#### Task T036: Trigger Tagging After Image Creation

**File**: `teacher-assistant/backend/src/routes/langGraphAgents.ts`
**Location**: After `library_materials` created (~line 347)
**Effort**: 30 minutes

**Implementation**:
```typescript
// After image saved to library_materials
const materialId = /* UUID of newly created library_material */;
const imageUrl = /* InstantDB storage URL */;

// Trigger automatic tagging (async, non-blocking)
visionService.tagImage(imageUrl, {
  title: material.title,
  description: agentInput.description,
  subject: agentInput.subject,
  grade: agentInput.learningGroup
}).catch(error => {
  console.warn('[ImageAgent] ⚠️ Tagging failed for', materialId, ':', error.message);
  // Non-blocking - image already saved successfully
});

console.log('[ImageAgent] 🏷️ Automatic tagging started for:', materialId);
```

**Key Points**:
- Don't `await` tagging (non-blocking, image already saved)
- Catch errors to prevent unhandled promise rejection
- Log tagging start for observability

---

#### Task T039: Frontend Tag Search

**File**: `teacher-assistant/frontend/src/hooks/useLibraryMaterials.ts`
**Effort**: 30 minutes

**Implementation**: (See comprehensive code in Feature Review document)

**Search Logic**:
```typescript
const matchesSearch = (material: ArtifactItem, query: string): boolean => {
  const lowerQuery = query.toLowerCase();

  // Existing: Title/description search
  const matchesText = material.title?.toLowerCase().includes(lowerQuery) ||
                      material.description?.toLowerCase().includes(lowerQuery);

  // NEW: Tag-based search
  let matchesTags = false;
  if (material.metadata) {
    try {
      const metadata = typeof material.metadata === 'string'
        ? JSON.parse(material.metadata)
        : material.metadata;

      if (Array.isArray(metadata.tags)) {
        matchesTags = metadata.tags.some(tag =>
          tag.toLowerCase().includes(lowerQuery)
        );
      }
    } catch (error) {
      console.warn('[useLibraryMaterials] Failed to parse metadata for tag search:', error);
    }
  }

  return matchesText || matchesTags;
};
```

---

#### Task T040: Vision API Unit Tests

**File**: `teacher-assistant/backend/tests/unit/visionService.test.ts` (NEW)
**Effort**: 1 hour

**Test Cases**: (See comprehensive tests in Feature Review document)

1. Tag normalization (lowercase, dedupe, max 15)
2. Vision API timeout (>30s)
3. Vision API errors (4xx, 5xx)
4. Valid image analysis (5-10 tags generated)

---

### Example Tagging Flow

**Input Image**: "Anatomischer Löwe, Seitenansicht, für Biologieunterricht Klasse 7"

**Vision API Analysis**:
```
Analyzing image...
- Subject: Biology (Biologie)
- Content: Lion anatomy (Löwen-Anatomie)
- Perspective: Side view (Seitenansicht)
- Visual elements: Muscles, skeleton visible
- Educational level: Secondary school (Sekundarstufe)
```

**Generated Tags**:
```json
["anatomie", "biologie", "löwe", "seitenansicht", "säugetier", "muskulatur", "skelett", "tier", "sekundarstufe"]
```

**Stored Metadata**:
```json
{
  "type": "image",
  "title": "Anatomischer Löwe für Biologieunterricht",
  "originalParams": { /* ... */ },
  "tags": ["anatomie", "biologie", "löwe", "seitenansicht", "säugetier", "muskulatur", "skelett", "tier", "sekundarstufe"],
  "tagging": {
    "generatedAt": 1729186543210,
    "model": "gpt-4o",
    "confidence": "high"
  }
}
```

**Search Behavior**:
- Query: "anatomie" → ✅ Found (exact tag match)
- Query: "löwe" → ✅ Found (exact tag match)
- Query: "tier" → ✅ Found (exact tag match)
- Query: "ana" → ✅ Found (partial tag match "anatomie")
- Query: "skelett" → ✅ Found (exact tag match)
- Query: "mathematik" → ❌ Not found (no matching tag)

---

### Dependencies

**Sequential**:
1. T003 (Vision Service) → MUST be complete before T036
2. T004 (API Route) → MUST be complete before T036
3. T005 (Route Registration) → MUST be complete before T036
4. T036 (Integration) → MUST be complete before T039 (search needs tags to exist)

**Parallel**:
- T040 (Unit Tests) can run in parallel with T039 (Frontend Search)

### Risks & Mitigation

**Risk**: ChatGPT Vision API rate limits
- **Mitigation**: Rate limiting (100/hour, 10/min)
- **Fallback**: Queue system for high-volume periods

**Risk**: Vision API generates irrelevant tags
- **Mitigation**: Prompt engineering with educational context
- **Iteration**: Monitor tag quality, refine prompt over time

**Risk**: Tagging fails frequently (>50% failure rate)
- **Mitigation**: Error logging + monitoring
- **Fallback**: Manual tagging feature (future sprint)

**Risk**: Search finds too many results (low precision)
- **Mitigation**: Combine tag search with title search (AND logic option)
- **Future**: Relevance scoring, tag weighting

### Definition of Done

- [ ] T003: Vision Service implemented and tested (unit tests pass)
- [ ] T004: Vision API route implemented and accessible
- [ ] T005: Routes registered, server starts successfully
- [ ] T036: Integration in langGraphAgents.ts, tagging triggers after image save
- [ ] T039: Tag-based search implemented, finds materials correctly
- [ ] T040: Unit tests written and passing (≥4 test cases)
- [ ] Manual test: Generate 3 images, verify tags in InstantDB
- [ ] Manual test: Search by tag, verify materials found
- [ ] E2E test: Run `automatic-tagging.spec.ts`, all 4 tests pass
- [ ] Session log updated with implementation details
- [ ] Git commit: "feat(US5): implement automatic image tagging with Vision API"

---

## Implementation Roadmap

### Sprint 1: Critical Fixes & Core UX (This Week)

**Goal**: Fix blocker, complete high-priority UX, achieve deployment readiness

**Day 1** (Today):
- [ ] Fix P0 field name bug (5 min)
- [ ] Verify message persistence (15 min)
- [ ] Start US2 T014: Event dispatch (20 min)
- [ ] Complete US2 T015: Event handler (30 min)

**Day 2**:
- [ ] Complete US2 T016: Backend verification (15 min)
- [ ] Complete US2 T017: E2E test (30 min)
- [ ] Run Spec 001 E2E tests (10 min)
- [ ] Manual verification of US2 (30 min)

**Day 3**:
- [ ] Final QA testing (1 hour)
- [ ] Update documentation (30 min)
- [ ] Deploy to staging (15 min)
- [ ] Smoke test staging environment (15 min)

**Total Effort**: ~4 hours
**Deliverables**: All P0-P1 features complete, ready for production

---

### Sprint 2: Enhanced Search & Discoverability (Next Week)

**Goal**: Implement automatic tagging for improved material search

**Day 1**:
- [ ] T003: Vision Service (2 hours)
- [ ] T040: Unit Tests (1 hour)

**Day 2**:
- [ ] T004: Vision API Route (45 min)
- [ ] T005: Route Registration (10 min)
- [ ] Test Vision API endpoint manually (30 min)

**Day 3**:
- [ ] T036: Integration in langGraphAgents.ts (30 min)
- [ ] T039: Frontend tag search (30 min)
- [ ] Manual testing: Generate 5 images, verify tags (1 hour)

**Day 4**:
- [ ] Run E2E test `automatic-tagging.spec.ts` (30 min)
- [ ] Final QA + documentation (1 hour)
- [ ] Deploy to production (15 min)

**Total Effort**: ~5.5 hours
**Deliverables**: Automatic tagging live, enhanced search capabilities

---

## Sprint 3: Chat Organization (Next Sprint)

**Goal**: Enable automatic chat tagging and searchable chat sessions in Library

**Total Effort**: ~3-4 hours

### Feature Overview

**User Story**:
As a teacher, I want my chat sessions to be automatically tagged so I can find past conversations by topic without manually organizing them.

### Implementation Approach

**Reuse Pattern from US5** (Automatic Image Tagging):
- Apply same Vision/GPT tagging to chat sessions
- Store tags in `chat_sessions.metadata.tags`
- Extend Library search to include chat tags

### Tasks

**T050: Chat Summarization Service** (1.5 hours):
- Create `chatSummaryService.ts` (similar to `visionService.ts`)
- Method: `summarizeAndTagChat(sessionId, messages[])`
- GPT analyzes conversation → generates:
  - Summary (2-3 sentences)
  - Tags (5-10 educational keywords in German)
  - Suggested title (if empty)
- Store in `chat_sessions.summary` and `chat_sessions.metadata.tags`

**T051: Trigger Auto-Tagging on Chat End** (30 min):
- Add endpoint: `POST /api/chat/finalize-session`
- Called when chat session ends or becomes inactive
- Triggers `summarizeAndTagChat()` asynchronously
- Non-blocking (chat already saved)

**T052: Library Chat Search Extension** (45 min):
- Update `useLibraryMaterials.ts` to search chat tags
- Search logic: Match query against title, summary, OR tags
- Same pattern as material tag search

**T053: E2E Test for Chat Tagging** (45 min):
- Create `e2e-tests/chat-organization.spec.ts`
- Test: Create chat → verify tags in `chat_sessions.metadata.tags`
- Test: Search by tag → verify chat found

### Dependencies

**Sequential**:
1. US5 (Image Tagging) MUST complete first (same pattern)
2. T050 → T051 → T052 → T053

**Technical**:
- Reuses OpenAI GPT integration
- Reuses InstantDB metadata pattern
- Reuses Library search infrastructure

### Success Criteria

- ✅ Chat sessions auto-tagged after completion
- ✅ Tags stored in `chat_sessions.metadata.tags`
- ✅ Library "Chats" tab search includes tag matching
- ✅ E2E test passes
- ✅ Tag quality: 5-10 relevant German keywords
- ✅ Performance: Tagging completes in <10s

### Notes

**Why After Sprint 2**:
- Validates image tagging pattern works first
- Allows reuse of tested infrastructure
- Reduces risk (proven pattern)

**Phase 2 Completion**:
- Sprint 3 completes Phase 2 roadmap
- All Phase 2 features delivered

---

## Success Metrics

### Sprint 1 Success Criteria

**Functional**:
- ✅ P0 bug fixed (messages persist correctly)
- ✅ US2 complete (Library navigation + modal auto-open)
- ✅ E2E test pass rate ≥90% (Spec 001)
- ✅ All builds clean (0 TypeScript errors)

**Performance**:
- ✅ Message save <100ms
- ✅ Library navigation <2s
- ✅ Modal open <500ms

**Quality**:
- ✅ Zero InstantDB schema errors
- ✅ Pre-commit hooks pass
- ✅ No regression in existing features

### Sprint 2 Success Criteria

**Functional**:
- ✅ Vision API generates 5-10 tags per image
- ✅ Tags saved to `library_materials.metadata.tags`
- ✅ Tag-based search finds materials correctly
- ✅ Tags NOT visible in UI (privacy requirement)

**Performance**:
- ✅ Tagging completes in <30s (95th percentile)
- ✅ Search includes tags without performance degradation
- ✅ Graceful degradation: Images save even if tagging fails

**Quality**:
- ✅ Unit tests pass (tag normalization, error handling)
- ✅ E2E test passes (automatic-tagging.spec.ts)
- ✅ Vision API error rate <10%

---

## Appendix

### Related Documents

- **Comprehensive Feature Review**: `docs/architecture/implementation-details/COMPREHENSIVE-FEATURE-REVIEW-2025-10-17.md`
- **Spec 001 QA Report**: `docs/quality-assurance/verification-reports/2025-10-13/bug-fixes-2025-10-11-qa-report.md`
- **Spec 003 Spec**: `specs/003-agent-confirmation-ux/spec.md`
- **Spec 003 Tasks**: `specs/003-agent-confirmation-ux/tasks.md`
- **Spec 003 US5 QA Report**: `docs/quality-assurance/verification-reports/2025-10-14/T034-T035-automatic-tagging-e2e-tests-QA-REPORT.md`

### API Contracts

**Vision Tagging API**:
```http
POST /api/vision/tag-image
Authorization: Bearer <token>

Request:
{
  "imageUrl": "https://instant-storage.s3.amazonaws.com/...",
  "context": {
    "title": "Anatomischer Löwe",
    "description": "Seitenansicht für Biologieunterricht",
    "subject": "Biologie",
    "grade": "Klasse 7"
  }
}

Response (200 OK):
{
  "tags": ["anatomie", "biologie", "löwe", "seitenansicht", "säugetier"],
  "confidence": "high",
  "model": "gpt-4o",
  "processingTime": 2453
}

Response (429 Too Many Requests):
{
  "error": "Too many tagging requests, please try again later"
}
```

**Library Navigation Event**:
```javascript
// Custom event dispatched by AgentResultView
window.dispatchEvent(new CustomEvent('navigate-library-tab', {
  detail: {
    tab: 'materials',                     // 'chats' | 'materials'
    materialId: '<uuid>',                 // UUID of library_material
    source: 'AgentResultView'             // Source component
  }
}));
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-17
**Status**: READY FOR IMPLEMENTATION
**Approved By**: Product Owner (pending)
**Next Review**: After Sprint 1 completion
