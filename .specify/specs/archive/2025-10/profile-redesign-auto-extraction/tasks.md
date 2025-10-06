# Tasks: Profile Redesign with Auto-Extraction

**Feature**: Smart Profile Auto-Extraction
**Status**: ✅ Phase 1-4 Complete | ⏳ Phase 5-6 Pending
**Last Updated**: 2025-10-03

---

## Task Overview

| Phase | Tasks | Status | Agent | Completion Date |
|-------|-------|--------|-------|-----------------|
| **Phase 1: Backend - Extraction** | 7 tasks | ✅ **COMPLETE** | backend-node-developer | 2025-10-03 |
| **Phase 2: Backend - API Routes** | 6 tasks | ✅ **COMPLETE** | backend-node-developer | 2025-10-03 |
| **Phase 3: Frontend - Data Layer** | 3 tasks | ✅ **COMPLETE** | react-frontend-developer | 2025-10-03 |
| **Phase 4: Frontend - UI (Gemini Design)** | 6 tasks | ✅ **COMPLETE** | react-frontend-developer | 2025-10-03 |
| **Phase 5: Testing** | 8 tasks | ⏳ **PENDING** | qa-integration-reviewer | - |
| **Phase 6: Deployment** | 3 tasks | ⏳ **PENDING** | All agents | - |

**Total**: 31 tasks | **Completed**: 22 tasks (71%) | **Pending**: 9 tasks (29%)

---

## Phase 1: Backend - Profile Extraction Service

**Agent**: `backend-node-developer`

### TASK-001: Update InstantDB Schema ✅
- [x] Add `profile_characteristics` table to `instantdb.ts`
- [x] Define fields: `id`, `user_id`, `characteristic`, `category`, `count`, `first_seen`, `last_seen`, `manually_added`, `created_at`, `updated_at`
- [x] Add TypeScript type definitions
- [x] Add indexes: `user_id`, `user_id + characteristic` (unique), `count`
- [x] Verify schema compiles without errors
- **Files**: `teacher-assistant/backend/src/schemas/instantdb.ts`
- **Time**: 1 hour
- **Status**: ✅ Complete
- **Dependencies**: None

### TASK-002: Create Profile Extraction Service (Core)
- [ ] Create `profileExtractionService.ts` in `services/`
- [ ] Implement `extractCharacteristics(userId, messages, existingProfile)` method
- [ ] Build OpenAI prompt for extraction (focus: recurring themes)
- [ ] Enforce extraction of 2-3 characteristics per chat
- [ ] Add error handling with empty array fallback
- **Files**: `teacher-assistant/backend/src/services/profileExtractionService.ts`
- **Time**: 3 hours
- **Dependencies**: TASK-001

### TASK-003: Implement Categorization Logic
- [ ] Add `categorizeCharacteristic(text)` method to `profileExtractionService.ts`
- [ ] Build OpenAI prompt for categorization (6 categories)
- [ ] Categories: `subjects`, `gradeLevel`, `teachingStyle`, `schoolType`, `topics`, `uncategorized`
- [ ] Validate category output (fallback to `uncategorized`)
- [ ] Add error handling
- **Files**: `teacher-assistant/backend/src/services/profileExtractionService.ts`
- **Time**: 2 hours
- **Dependencies**: TASK-002

### TASK-004: Implement Count Increment Logic
- [ ] Add `updateCharacteristicCounts(userId, characteristics)` private method
- [ ] Loop through characteristics and call InstantDB service
- [ ] Handle duplicate characteristics correctly
- **Files**: `teacher-assistant/backend/src/services/profileExtractionService.ts`
- **Time**: 1 hour
- **Dependencies**: TASK-003

### TASK-005: Write Extraction Service Unit Tests
- [ ] Create `profileExtractionService.test.ts`
- [ ] Test: Extracts 2-3 characteristics from valid chat
- [ ] Test: Handles empty/short chats gracefully
- [ ] Test: Categorizes characteristics correctly
- [ ] Test: Avoids duplicate characteristics
- [ ] Test: Error handling (OpenAI API failure)
- [ ] Mock OpenAI API responses
- **Files**: `teacher-assistant/backend/src/services/profileExtractionService.test.ts`
- **Time**: 2 hours
- **Dependencies**: TASK-004

### TASK-006: Extend InstantDB Service (Profile Methods)
- [ ] Add `incrementProfileCharacteristic(userId, characteristic, category)` method
- [ ] Logic: Check if exists → increment count | else → create with count=1
- [ ] Add `getProfileCharacteristics(userId, minCount)` method
- [ ] Add `addManualCharacteristic(userId, characteristic)` method
- [ ] Add error logging
- **Files**: `teacher-assistant/backend/src/services/instantdbService.ts`
- **Time**: 2 hours
- **Dependencies**: TASK-001

### TASK-007: Write InstantDB Service Tests
- [ ] Extend `instantdbService.test.ts`
- [ ] Test: `incrementProfileCharacteristic` creates/updates correctly
- [ ] Test: `getProfileCharacteristics` filters by minCount
- [ ] Test: `addManualCharacteristic` handles duplicates
- [ ] Test: Database constraints (unique user_id + characteristic)
- **Files**: `teacher-assistant/backend/src/services/instantdbService.test.ts`
- **Time**: 1.5 hours
- **Dependencies**: TASK-006

---

## Phase 2: Backend - API Routes

**Agent**: `backend-node-developer`

### TASK-008: Create Profile Routes File
- [ ] Create `profile.ts` in `routes/`
- [ ] Set up Express router
- [ ] Add to main routes in `routes/index.ts`: `app.use('/api/profile', profileRoutes)`
- **Files**: `teacher-assistant/backend/src/routes/profile.ts`, `routes/index.ts`
- **Time**: 30 min
- **Dependencies**: None

### TASK-009: Implement POST /api/profile/extract
- [ ] Add route: `POST /api/profile/extract`
- [ ] Validate request body: `userId`, `messages` (array, length >=2)
- [ ] Fetch existing profile via `instantdbService`
- [ ] Call `profileExtractionService.extractCharacteristics()`
- [ ] Return extracted characteristics count
- [ ] Add error handling (500 status)
- **Files**: `teacher-assistant/backend/src/routes/profile.ts`
- **Time**: 1.5 hours
- **Dependencies**: TASK-002, TASK-006, TASK-008

### TASK-010: Implement GET /api/profile/characteristics
- [ ] Add route: `GET /api/profile/characteristics?userId=...`
- [ ] Validate query param: `userId`
- [ ] Fetch characteristics with `getProfileCharacteristics(userId, 3)`
- [ ] Return JSON: `{ characteristics: [...] }`
- [ ] Add error handling
- **Files**: `teacher-assistant/backend/src/routes/profile.ts`
- **Time**: 1 hour
- **Dependencies**: TASK-006, TASK-008

### TASK-011: Implement POST /api/profile/characteristics/add
- [ ] Add route: `POST /api/profile/characteristics/add`
- [ ] Validate request body: `userId`, `characteristic`
- [ ] Call `instantdbService.addManualCharacteristic()`
- [ ] Return success response
- [ ] Add error handling
- **Files**: `teacher-assistant/backend/src/routes/profile.ts`
- **Time**: 1 hour
- **Dependencies**: TASK-006, TASK-008

### TASK-012: Implement POST /api/profile/characteristics/categorize (Background Job)
- [ ] Add route: `POST /api/profile/characteristics/categorize`
- [ ] Fetch all uncategorized characteristics for user
- [ ] Loop through and categorize via `profileExtractionService`
- [ ] Update database with new categories
- [ ] Return count of categorized items
- [ ] Add error handling
- **Files**: `teacher-assistant/backend/src/routes/profile.ts`
- **Time**: 1.5 hours
- **Dependencies**: TASK-003, TASK-006, TASK-008

### TASK-013: Write API Route Tests
- [ ] Create `profile.routes.test.ts`
- [ ] Test: POST /extract with valid request returns extracted characteristics
- [ ] Test: POST /extract with invalid request returns 400
- [ ] Test: GET /characteristics returns filtered data (count >= 3)
- [ ] Test: POST /add creates characteristic in database
- [ ] Test: POST /categorize updates uncategorized items
- [ ] Mock services
- **Files**: `teacher-assistant/backend/src/routes/profile.routes.test.ts`
- **Time**: 2 hours
- **Dependencies**: TASK-009, TASK-010, TASK-011, TASK-012

---

## Phase 3: Frontend - Data Layer

**Agent**: `react-frontend-developer`

### TASK-014: Create useProfileCharacteristics Hook
- [ ] Create `useProfileCharacteristics.ts` in `hooks/`
- [ ] Fetch characteristics via `GET /api/profile/characteristics`
- [ ] Implement `groupedCharacteristics` computed property (group by category)
- [ ] Add `addCharacteristic(text)` mutation (POST /add)
- [ ] Handle loading/error states
- [ ] Add refetch capability
- **Files**: `teacher-assistant/frontend/src/hooks/useProfileCharacteristics.ts`
- **Time**: 2 hours
- **Dependencies**: TASK-010, TASK-011

### TASK-015: Write Hook Unit Tests
- [ ] Create `useProfileCharacteristics.test.ts`
- [ ] Test: Fetches and groups characteristics correctly
- [ ] Test: `addCharacteristic` calls API and refetches
- [ ] Test: Handles loading/error states
- [ ] Mock API calls
- **Files**: `teacher-assistant/frontend/src/hooks/useProfileCharacteristics.test.ts`
- **Time**: 1 hour
- **Dependencies**: TASK-014

### TASK-016: Integrate Extraction Trigger in ChatView
- [ ] Import and use profile extraction trigger in `ChatView.tsx`
- [ ] On component unmount (user leaves chat), call POST /api/profile/extract
- [ ] Pass `userId` and `messages` (first 10 for context)
- [ ] Add `useRef` to prevent duplicate extractions
- [ ] Handle errors gracefully (log, don't block UI)
- **Files**: `teacher-assistant/frontend/src/components/ChatView.tsx`
- **Time**: 1 hour
- **Dependencies**: TASK-009

---

## Phase 4: Frontend - UI (Gemini Design)

**Agent**: `react-frontend-developer`

### TASK-017: Create Profile View Structure (Header + Sync Indicator)
- [ ] Create `ProfileView.tsx` in `components/` (or update existing)
- [ ] Implement header: "Dein Profil" + subtitle
- [ ] Implement Profile Sync Indicator card:
  - Teal background (`bg-background-teal`)
  - Confetti dots decoration (orange circles, absolute positioning)
  - "60%" large text (hardcoded for MVP)
  - "DEIN PROFIL-SYNC" label
  - "Lernt dich kennen" subtitle
  - Wave decoration at bottom (SVG, orange)
- [ ] **Playwright Verification**: Screenshot `profile-sync-indicator.png` (mobile viewport)
- [ ] **Visual Comparison**: Compare to `.specify/specs/Profil.png` mockup
- **Files**: `teacher-assistant/frontend/src/components/ProfileView.tsx`
- **Time**: 2 hours
- **Dependencies**: TASK-014

### TASK-018: Implement Encouraging Microcopy
- [ ] Add text below sync indicator:
  - "Je mehr du mit eduhu interagierst, desto besser werden die Vorschläge."
- [ ] Style: `text-sm text-gray-600 text-center px-6 mt-4`
- [ ] **Playwright Verification**: Verify text visible in screenshot
- **Files**: `teacher-assistant/frontend/src/components/ProfileView.tsx`
- **Time**: 15 min
- **Dependencies**: TASK-017

### TASK-019: Implement "Gelernte Merkmale" Tag Display
- [ ] Add section: "Gelernte Merkmale" heading
- [ ] Loop through `groupedCharacteristics` in category order
- [ ] Display tags as chips:
  - Orange star icon (`SparklesIcon` from Heroicons)
  - Characteristic text
  - Gray X icon (`XMarkIcon` from Heroicons)
  - Style: `bg-white border border-gray-200 rounded-full px-3 py-2`
- [ ] Group tags visually (same category together, no labels)
- [ ] Show loading spinner while fetching
- [ ] **Playwright Verification**: Screenshot `profile-tags-display.png` (mobile viewport)
- [ ] **Visual Comparison**: Compare to mockup
- **Files**: `teacher-assistant/frontend/src/components/ProfileView.tsx`
- **Time**: 2 hours
- **Dependencies**: TASK-014

### TASK-020: Implement "Merkmal hinzufügen +" Button & Modal
- [ ] Add button: "Merkmal hinzufügen +"
  - Style: `bg-primary text-white font-medium py-3 rounded-xl w-full`
- [ ] Create modal component (bottom sheet):
  - "Merkmal hinzufügen" heading
  - Text input field (placeholder: "z.B. Projektbasiertes Lernen")
  - "Abbrechen" button (gray)
  - "Hinzufügen" button (orange, calls `addCharacteristic`)
- [ ] Handle modal open/close state
- [ ] **Playwright Verification**: Screenshot `profile-add-tag-modal.png` (mobile viewport)
- [ ] **Visual Comparison**: Verify modal styling matches Gemini design
- **Files**: `teacher-assistant/frontend/src/components/ProfileView.tsx`
- **Time**: 2 hours
- **Dependencies**: TASK-014, TASK-019

### TASK-021: Implement General Info Section
- [ ] Add section: "Allgemeine Informationen" heading
- [ ] Display user email (from auth context)
- [ ] Display user name (if available)
- [ ] Style: White card with rounded corners
- [ ] Labels: `text-xs text-gray-500`
- [ ] Values: `text-sm text-gray-800`
- [ ] **Playwright Verification**: Screenshot `profile-general-info.png` (mobile viewport)
- [ ] **Visual Comparison**: Verify spacing and styling
- **Files**: `teacher-assistant/frontend/src/components/ProfileView.tsx`
- **Time**: 1 hour
- **Dependencies**: TASK-017

### TASK-022: Final Visual Polish & Responsive Testing
- [ ] Verify all spacing matches mockup (padding, margins, gaps)
- [ ] Verify all colors match Gemini palette (orange, teal, grays)
- [ ] Verify all font sizes and weights match design
- [ ] Test on multiple viewports (iPhone SE, iPhone 12, Pixel 5)
- [ ] **Playwright Verification**: Full-page screenshots on all viewports
  - `profile-full-iphone-se.png`
  - `profile-full-iphone-12.png`
  - `profile-full-pixel-5.png`
- [ ] **Visual Comparison**: Compare all screenshots to mockup pixel-by-pixel
- [ ] Fix any visual discrepancies
- **Files**: `teacher-assistant/frontend/src/components/ProfileView.tsx`
- **Time**: 2 hours
- **Dependencies**: TASK-017 through TASK-021

---

## Phase 5: Testing & Quality Assurance

**Agent**: `qa-integration-reviewer`

### TASK-023: E2E Test - Auto-Extraction After Chat
- [ ] Write Playwright test: `profile-auto-extraction.spec.ts`
- [ ] Test flow:
  1. Login
  2. Create 3 separate chats mentioning "Mathematik" each time
  3. Navigate to Profile
  4. Verify "Mathematik" tag visible (count >= 3)
- [ ] **Screenshot Verification**: `e2e-profile-auto-extracted.png`
- [ ] Compare screenshot to design mockup
- [ ] Verify tag appears in correct category group
- **Files**: `teacher-assistant/frontend/e2e-tests/profile-auto-extraction.spec.ts`
- **Time**: 2 hours
- **Dependencies**: TASK-016, TASK-019

### TASK-024: E2E Test - Frequency Threshold Filtering
- [ ] Test flow:
  1. Mock database: characteristic with count=2
  2. Navigate to Profile
  3. Verify tag NOT visible
  4. Simulate another chat (count=3)
  5. Reload Profile
  6. Verify tag NOW visible
- [ ] **Screenshot Verification**: `e2e-profile-frequency-threshold.png`
- [ ] Verify only count >= 3 tags displayed
- **Files**: `teacher-assistant/frontend/e2e-tests/profile-auto-extraction.spec.ts`
- **Time**: 1.5 hours
- **Dependencies**: TASK-019

### TASK-025: E2E Test - Manual Tag Addition
- [ ] Test flow:
  1. Navigate to Profile
  2. Click "Merkmal hinzufügen +"
  3. Enter "Projektbasiertes Lernen"
  4. Click "Hinzufügen"
  5. Verify tag appears immediately (at end of list)
  6. Reload page
  7. Verify tag is still visible (persisted)
- [ ] **Screenshot Verification**: `e2e-profile-manual-tag.png`
- [ ] Compare screenshot to design mockup
- **Files**: `teacher-assistant/frontend/e2e-tests/profile-manual-tag.spec.ts`
- **Time**: 1.5 hours
- **Dependencies**: TASK-020

### TASK-026: E2E Test - Auto-Categorization of Manual Tags
- [ ] Test flow:
  1. Add manual tag (should be uncategorized initially)
  2. Trigger background categorization job (POST /categorize)
  3. Reload Profile
  4. Verify tag moved to correct category group
- [ ] **Screenshot Verification**: `e2e-profile-auto-categorized.png`
- [ ] Verify grouping by category works correctly
- **Files**: `teacher-assistant/frontend/e2e-tests/profile-manual-tag.spec.ts`
- **Time**: 1.5 hours
- **Dependencies**: TASK-012, TASK-020

### TASK-027: E2E Test - Pixel-Perfect Gemini Design Match
- [ ] Test on 3 viewports: iPhone SE (375px), iPhone 12 (390px), Pixel 5 (393px)
- [ ] **Screenshot Verification**:
  - `profile-gemini-iphone-se.png`
  - `profile-gemini-iphone-12.png`
  - `profile-gemini-pixel-5.png`
- [ ] Visual regression testing: Compare to `.specify/specs/Profil.png`
- [ ] Verify:
  - Header styling (orange, bold)
  - Sync indicator (teal, confetti, wave)
  - Tag chips (orange star, white background, gray X)
  - Button (orange, rounded, full-width)
  - General info section (white card, labels, values)
  - Spacing and margins match mockup
- [ ] Document any visual discrepancies
- **Files**: `teacher-assistant/frontend/e2e-tests/profile-visual-regression.spec.ts`
- **Time**: 2 hours
- **Dependencies**: TASK-022

### TASK-028: Integration Test - End-to-End Profile Flow
- [ ] Create integration test: Chat → Extract → Store → Display → Manual Add
- [ ] Test complete user journey:
  1. User has 3 chats (Mathematik mentioned 3x)
  2. Extraction triggers automatically
  3. Characteristics stored in database
  4. User opens Profile → sees "Mathematik" tag
  5. User adds "Gruppenarbeit" manually
  6. Tag appears immediately
  7. Background job categorizes it
  8. Next profile load shows tag in correct group
- [ ] Verify database state at each step
- [ ] Test error handling (API failures, network issues)
- **Files**: `teacher-assistant/frontend/src/hooks/useProfileCharacteristics.integration.test.ts`
- **Time**: 2.5 hours
- **Dependencies**: TASK-014, TASK-016, TASK-019, TASK-020

### TASK-029: Manual QA - Extraction Accuracy
- [ ] Manual testing on staging environment
- [ ] Create 10 diverse chats with different topics
- [ ] Verify extracted characteristics are accurate and relevant
- [ ] Verify no irrelevant one-off mentions (e.g., "Arbeitsblatt")
- [ ] Test edge cases:
  - Very short chats (2 messages)
  - Very long chats (20+ messages)
  - Chats with no clear profile info
- [ ] Document extraction accuracy rate (target: ≥85%)
- [ ] Report findings in QA document
- **Files**: `/docs/quality-assurance/profile-auto-extraction-qa-report.md`
- **Time**: 3 hours
- **Dependencies**: All previous tasks

### TASK-030: Manual QA - Visual Design Verification
- [ ] Manual testing on staging (multiple devices)
- [ ] Verify Profile matches Gemini mockup on real devices:
  - iPhone (Safari)
  - Android (Chrome)
- [ ] Check:
  - Colors (orange, teal)
  - Typography (Inter, font weights, sizes)
  - Spacing (padding, margins, gaps)
  - Confetti decoration renders correctly
  - Wave SVG renders correctly
  - Tag chips look correct
  - Modal bottom sheet animates smoothly
- [ ] Document any visual bugs
- [ ] Take reference photos from real devices
- **Files**: `/docs/quality-assurance/profile-visual-qa-report.md`
- **Time**: 2 hours
- **Dependencies**: TASK-022

---

## Phase 6: Deployment & Monitoring

**Agent**: All agents (coordinated)

### TASK-031: Deploy to Staging
- [ ] Deploy backend to Vercel (staging)
- [ ] Deploy frontend to Vercel (staging)
- [ ] Run InstantDB schema migration (add `profile_characteristics` table)
- [ ] Smoke test all API endpoints:
  - POST /profile/extract
  - GET /profile/characteristics
  - POST /profile/characteristics/add
  - POST /profile/characteristics/categorize
- [ ] Verify extraction triggers after chat
- [ ] Monitor error logs for 24 hours
- **Time**: 2 hours
- **Dependencies**: All Phase 1-5 tasks

### TASK-032: Production Deployment
- [ ] Set feature flag `ENABLE_PROFILE_AUTO_EXTRACTION=true`
- [ ] Gradual rollout: 10% → 50% → 100%
- [ ] Monitor OpenAI API usage (extraction + categorization)
- [ ] Monitor extraction success rate (target: ≥90%)
- [ ] Monitor extraction accuracy (manual spot-checks)
- [ ] Set up alerts for high error rates
- [ ] Document rollback procedure
- **Time**: 2 hours
- **Dependencies**: TASK-031

### TASK-033: Post-Deployment Verification & Documentation
- [ ] Run full E2E test suite in production
- [ ] Verify profile extraction working correctly
- [ ] Check performance metrics:
  - Extraction API latency (target: <5s)
  - Categorization API latency (target: <3s)
  - Profile load time (target: <2s)
- [ ] Collect user feedback (first 100 users)
- [ ] Document lessons learned in session log
- [ ] Update master-todo.md with future enhancements:
  - Real profile sync percentage calculation
  - Tag deletion functionality
  - Profile export/sharing
- **Files**: `/docs/development-logs/sessions/2025-10-03/session-profile-redesign-deployment.md`
- **Time**: 2 hours
- **Dependencies**: TASK-032

---

## Acceptance Criteria (Feature Complete)

### Functional
- ✅ After each chat (≥2-3 messages), 2-3 characteristics extracted automatically
- ✅ Characteristics with count ≥3 displayed in profile
- ✅ Characteristics grouped by category (no labels shown)
- ✅ Manual tag addition works (immediate display)
- ✅ Manual tags auto-categorized on next profile load
- ✅ Profile sync indicator displays (hardcoded 60%)
- ✅ General info section displays email & name

### Technical
- ✅ All unit tests pass (backend + frontend)
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ Extraction accuracy ≥85% (verified via manual QA)
- ✅ Categorization accuracy ≥80% (verified via manual QA)
- ✅ No regressions in existing functionality

### Visual Verification (CRITICAL)
- ✅ **Profile View**: Pixel-perfect match to Gemini mockup (`.specify/specs/Profil.png`)
  - Header styling correct
  - Sync indicator correct (confetti, wave, percentage)
  - Tag chips correct (orange star, white bg, gray X)
  - Button correct (orange, rounded, full-width)
  - General info section correct
  - Spacing and margins match mockup
- ✅ **Responsive**: All viewports tested (375px, 390px, 393px)
  - No layout breaks
  - Text readable
  - Elements not cut off
- ✅ **Playwright Screenshots**: All screenshots compared to mockup and verified

### Performance
- ✅ Extraction completes in <15 seconds (95th percentile)
- ✅ Categorization completes in <10 seconds (95th percentile)
- ✅ Profile loads in <2 seconds
- ✅ No UI blocking during extraction
- ✅ Error rate <5%

---

## Notes

- **Mockup Reference**: `.specify/specs/Profil.png`
- **Future Enhancement**: Real profile sync percentage calculation (currently hardcoded 60%)
- **Future Enhancement**: Tag deletion functionality (X button currently non-functional)
- **Future Enhancement**: Profile export/sharing
- **Dependency**: Requires OpenAI API key in production environment
- **Monitoring**: Set up alerts for extraction/categorization failures

---

## Task Assignment

| Agent | Tasks | Total Time |
|-------|-------|------------|
| backend-node-developer | TASK-001 to TASK-013 | ~21 hours |
| react-frontend-developer | TASK-014 to TASK-022 | ~14 hours |
| qa-integration-reviewer | TASK-023 to TASK-030 | ~18 hours |
| All (coordinated) | TASK-031 to TASK-033 | ~6 hours |

**Total Estimated Time**: ~59 hours
