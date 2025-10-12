# Implementation Plan: Library UX Fixes

**Branch**: `002-library-ux-fixes` | **Date**: 2025-10-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-library-ux-fixes/spec.md`

## Summary

Fix critical Library UX issues preventing image preview and regeneration. Integrate existing MaterialPreviewModal component into Library.tsx with proper state management and type mapping. Improve agent confirmation button visibility and design consistency in loading/result views.

**Key Technical Decisions** (from Clarifications):
- MaterialPreviewModal renders at IonPage level (sibling to IonContent) for proper Ionic animations
- Type mapper utility (`lib/materialMappers.ts`) converts ArtifactItem → UnifiedMaterial
- Component-level useState for modal state (selectedMaterial, isModalOpen)
- Immediate state cleanup on modal close (prevents stale references)

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: React 18 + Ionic Framework 7 + InstantDB + Tailwind CSS 3
**Storage**: InstantDB (cloud-hosted) for library_materials table with JSON metadata field
**Testing**: Playwright E2E tests + Manual verification (NO bypass mode - always test with real interactions)
**Target Platform**: Progressive Web App (Desktop Chrome + Mobile Safari)
**Project Type**: Monorepo with separate frontend/backend packages
**Performance Goals**: Modal opens in <2s (SC-005), regeneration form appears in <10s (SC-002)
**Constraints**: Must work with existing InstantDB metadata structure, backward-compatible with old metadata format
**Scale/Scope**: 5 User Stories (2 P1 critical, 1 P2 UX improvement, 2 P3 design polish)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: SpecKit-First
- **Status**: PASS
- **Evidence**: SpecKit exists at `specs/002-library-ux-fixes/` with complete spec.md, plan.md (this file), and clarifications
- **Next**: Generate tasks.md via `/speckit.tasks` after plan completion

### ✅ Principle II: Definition of Done
- **Status**: PASS (Design Phase)
- **Implementation Requirements**:
  1. Build Clean: `npm run build` → 0 TypeScript errors
  2. Tests Pass: Playwright E2E tests for each user story (with REAL interactions, NO bypass mode)
  3. Manual Test: Documented in session log with screenshots
  4. Pre-Commit Pass: Husky hooks must succeed
- **Critical Testing Feedback from User**:
  - Tests MUST use real user interactions (NO bypass mode)
  - Test duration is NOT a valid reason to skip testing
  - All errors must be caught BEFORE marking task complete

### ✅ Principle III: TypeScript Everywhere
- **Status**: PASS
- **Evidence**: All files in scope are .tsx (React components)
- **Shared Types**: Use existing `teacher-assistant/shared/types/` for cross-package contracts

### ✅ Principle IV: Documentation & Traceability
- **Status**: PASS (Design Phase)
- **Session Log Location**: `docs/development-logs/sessions/2025-10-12/session-01-library-ux-fixes.md`
- **Required Content**: Task IDs, files modified, build output, test results, manual verification steps

### ✅ Principle V: Tech Stack Consistency
- **Status**: PASS
- **Stack Compliance**:
  - Frontend: React ✅ + TypeScript ✅ + Vite ✅ + Tailwind ✅ + InstantDB ✅
  - Ionic Framework ✅ for IonModal, IonButton, IonContent
  - Functional components with hooks ✅ (no class components)
  - Tailwind for ALL styling ✅ (no new custom CSS files)

### Final Constitution Assessment
**Result**: ✅ **ALL GATES PASS** - Proceed to implementation

## Project Structure

### Documentation (this feature)

```
specs/002-library-ux-fixes/
├── spec.md              # WHAT & WHY (complete with 5 user stories, 20 FRs, 5 clarifications)
├── plan.md              # THIS FILE - HOW (architecture, components, implementation)
├── research.md          # Phase 0 output - NOT NEEDED (all clarifications resolved)
├── data-model.md        # Phase 1 output - NOT NEEDED (uses existing InstantDB schema)
├── quickstart.md        # Phase 1 output - NOT NEEDED (existing dev environment)
├── contracts/           # Phase 1 output - NOT NEEDED (frontend-only changes)
└── tasks.md             # Phase 2 output - Generate via /speckit.tasks command
```

### Source Code (repository root)

```
teacher-assistant/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MaterialPreviewModal.tsx     # ✅ EXISTS - Already has regeneration logic (T028-T029)
│   │   │   ├── AgentConfirmationMessage.tsx # 🔧 MODIFY - Improve button visibility (User Story 3)
│   │   │   ├── AgentFormView.tsx            # 🔧 MODIFY - Fix loading view design (User Story 4)
│   │   │   └── AgentResultView.tsx          # 🔧 MODIFY - Fix result view layout (User Story 5)
│   │   ├── pages/
│   │   │   └── Library/
│   │   │       └── Library.tsx              # 🔧 MODIFY - Add modal integration (User Stories 1-2)
│   │   ├── lib/
│   │   │   ├── materialMappers.ts           # ✨ CREATE - Type conversion utility (Clarification Q2)
│   │   │   ├── AgentContext.tsx             # ✅ EXISTS - Provides openModal function
│   │   │   └── types.ts                     # ✅ EXISTS - UnifiedMaterial, AgentSuggestion types
│   │   └── hooks/
│   │       └── useLibraryMaterials.ts       # ✅ EXISTS - Fetches materials from InstantDB
│   └── tests/
│       └── e2e/
│           └── library-modal-integration.spec.ts  # ✨ CREATE - E2E tests for modal flow
└── shared/
    └── types/
        └── agents.ts                        # ✅ EXISTS - Shared agent types
```

**Structure Decision**: Web application structure (Option 2) with separate frontend/backend packages. This feature only modifies frontend components - NO backend changes required (uses existing InstantDB schema and API).

## Architecture Overview

### Component Hierarchy (User Stories 1-2: Library Modal Integration)

```
Library.tsx (Modified)
├── State Management
│   ├── selectedMaterial: UnifiedMaterial | null
│   ├── isModalOpen: boolean
│   └── Handler: onClick={() => handleMaterialClick(material)}
│
├── Material Grid (Existing)
│   └── Material Cards (Add onClick handler - Clarification Q1)
│       └── Entire card div is clickable
│
└── MaterialPreviewModal (Existing Component - Render at IonPage level - Clarification Q4)
    ├── Props: material, isOpen, onClose
    ├── Type Conversion: ArtifactItem → UnifiedMaterial via materialMappers.ts
    ├── Close Handler: setIsModalOpen(false) + setSelectedMaterial(null) - Clarification Q5
    └── Regeneration: ✅ Already implemented (T028-T029) - Extracts originalParams from metadata

```

### Data Flow (User Story 2: Image Regeneration)

```
1. User clicks image in Library
   ↓
2. Library.tsx: handleMaterialClick(artifact: ArtifactItem)
   ↓
3. materialMappers.ts: convertArtifactToUnifiedMaterial(artifact)
   - Maps: id, title, type, created_at
   - Parses: metadata JSON string
   - Returns: UnifiedMaterial
   ↓
4. setState: setSelectedMaterial(unifiedMaterial), setIsModalOpen(true)
   ↓
5. MaterialPreviewModal renders with material prop
   ↓
6. User clicks "Neu generieren" button
   ↓
7. MaterialPreviewModal.handleRegenerate() [ALREADY EXISTS]
   - Extracts originalParams from material.metadata
   - Handles null/invalid metadata gracefully (FR-010, FR-011)
   ↓
8. AgentContext.openModal('image-generation', originalParams)
   ↓
9. AgentFormView opens with pre-filled form fields (FR-009)
```

### Type Mapping Strategy (Clarification Q2)

**Problem**: Library uses `ArtifactItem`, MaterialPreviewModal expects `UnifiedMaterial`

**Solution**: Create utility function `lib/materialMappers.ts`

```typescript
// lib/materialMappers.ts
export interface ArtifactItem {
  id: string;
  title: string;
  type: 'document' | 'image' | 'worksheet' | 'quiz' | 'lesson_plan';
  description: string;       // For images: InstantDB storage URL
  dateCreated: Date;
  source: 'chat_generated' | 'uploaded' | 'manual';
  chatId?: string;
}

export interface UnifiedMaterial {
  id: string;
  title: string;
  type: MaterialType;
  source: MaterialSource;
  created_at: number;         // timestamp
  updated_at: number;         // timestamp
  metadata: {
    artifact_data?: { url: string };  // For images
    originalParams?: {                // For regeneration
      description: string;
      imageStyle: string;
      learningGroup?: string;
      subject?: string;
    };
    // Backward compatibility fields
    prompt?: string;
    image_style?: string;
  };
  is_favorite: boolean;
}

export function convertArtifactToUnifiedMaterial(artifact: ArtifactItem): UnifiedMaterial {
  return {
    id: artifact.id,
    title: artifact.title,
    type: artifact.type as MaterialType,
    source: mapSource(artifact.source),
    created_at: artifact.dateCreated.getTime(),
    updated_at: artifact.dateCreated.getTime(),
    metadata: {
      artifact_data: artifact.type === 'image' ? { url: artifact.description } : undefined,
      // Note: originalParams will be fetched from InstantDB metadata field
      // (not available in ArtifactItem mapping - loaded separately by MaterialPreviewModal)
    },
    is_favorite: false,
  };
}
```

## Phase 0: Outline & Research

**Status**: ✅ **SKIPPED** - All clarifications resolved during `/speckit.clarify` phase

**Rationale**:
- 5 clarification questions answered by user
- All NEEDS CLARIFICATION markers resolved
- Technical context fully understood from existing codebase analysis
- No additional research required

## Phase 1: Design & Contracts

**Status**: ✅ **SKIPPED** - Frontend-only changes, existing schema sufficient

### Data Model (SKIPPED - using existing InstantDB schema)

No schema changes required. Feature uses existing `library_materials` table:

```typescript
// Existing InstantDB Schema (instant.schema.ts)
library_materials: {
  id: string;
  title: string;
  type: string;
  content?: string;          // For images: storage URL
  description?: string;
  created_at: number;
  updated_at: number;
  chat_session_id?: string;
  user_id: string;
  metadata: any;             // JSON field - contains originalParams for regeneration
}
```

### API Contracts (SKIPPED - no new endpoints)

No backend API changes required. Feature uses existing:
- InstantDB `useQuery()` for fetching materials (via `useLibraryMaterials` hook)
- AgentContext `openModal()` for launching image generation agent
- MaterialPreviewModal existing event handlers (onClose, onDelete, onToggleFavorite)

### Quickstart (SKIPPED - existing dev environment)

Development environment already configured:
- Frontend: `cd teacher-assistant/frontend && npm run dev` (port 3000)
- Backend: `cd teacher-assistant/backend && npm run dev` (port 3001)
- InstantDB: Cloud-hosted (credentials in `.env`)

## Implementation Checklist

### User Story 1: Library Preview Modal (Priority P1)

**Files to Modify**:
1. `teacher-assistant/frontend/src/lib/materialMappers.ts` (CREATE)
   - Export `convertArtifactToUnifiedMaterial` function
   - Handle type mapping from ArtifactItem to UnifiedMaterial
   - Include metadata parsing for image URLs

2. `teacher-assistant/frontend/src/pages/Library/Library.tsx` (MODIFY)
   - Import MaterialPreviewModal and materialMappers
   - Add state: `useState<UnifiedMaterial | null>(null)` for selectedMaterial
   - Add state: `useState<boolean>(false)` for isModalOpen
   - Add onClick handler to material card div (line ~400)
   - Add MaterialPreviewModal at IonPage level (after IonContent)
   - Add handleClose: `() => { setIsModalOpen(false); setSelectedMaterial(null); }`

**Acceptance Criteria**:
- ✅ Clicking image thumbnail opens full-screen modal
- ✅ Modal displays full image + metadata (title, date, type, source)
- ✅ Close button and backdrop click both close modal
- ✅ State cleanup happens immediately on close (no stale references)

### User Story 2: Image Regeneration (Priority P1)

**Files to Verify** (Already Implemented):
1. `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx` (VERIFY - Lines 142-198)
   - ✅ handleRegenerate function exists
   - ✅ Extracts originalParams from metadata
   - ✅ Handles null/invalid metadata gracefully (FR-010)
   - ✅ Supports backward compatibility with old structure (FR-011)
   - ✅ Opens agent form with openModal('image-generation', originalParams)

**Acceptance Criteria**:
- ✅ "Neu generieren" button visible for agent-generated images
- ✅ Clicking button pre-fills form with original parameters
- ✅ Graceful degradation for missing metadata (empty form)
- ✅ Backward compatibility with old metadata structure

### User Story 3: Agent Confirmation Button Visibility (Priority P2)

**Files to Modify**:
1. `teacher-assistant/frontend/src/components/AgentConfirmationMessage.tsx` (MODIFY - Lines 274-282)
   - Current: `className="flex-1 h-12 bg-primary-500..."`
   - Improve: Increase height to `h-14`, add shadow, increase font size
   - Ensure: Minimum 44x44px touch target (FR-014)
   - Verify: WCAG AA contrast ratio 4.5:1 for normal text (FR-012)

**Design Changes**:
```tsx
// Before (Line 278)
className="flex-1 h-12 bg-primary-500 text-white rounded-xl font-medium..."

// After (Proposed)
className="flex-1 h-14 bg-primary-500 text-white rounded-xl font-semibold text-base
           shadow-md hover:shadow-lg transition-all duration-200..."
```

**Acceptance Criteria**:
- ✅ Button height ≥44px on mobile (meets touch target FR-014)
- ✅ High contrast ratio (primary-500 orange vs white text = ~8:1)
- ✅ Visual prominence increased (shadow, larger font)
- ✅ Proper ARIA labels for accessibility (already implemented)

### User Story 4: Loading View Design (Priority P3)

**Files to Modify**:
1. `teacher-assistant/frontend/src/components/AgentFormView.tsx` (MODIFY - Loading state JSX)
   - Remove redundant text: "Bild erstellen" header + "In Bearbeitung..." message
   - Replace with single message: "Dein Bild wird erstellt..."
   - Match design system: Use Tailwind typography classes
   - Add progress indicator if generation >10s (FR-017)

**Design Changes**:
```tsx
// Before (Redundant text)
<div>
  <h2>Bild erstellen</h2>
  <p>In Bearbeitung...</p>
</div>

// After (Clean, single message)
<div className="text-center py-8">
  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
  <p className="mt-4 text-lg font-medium text-gray-700">Dein Bild wird erstellt...</p>
  <p className="mt-2 text-sm text-gray-500">Das kann bis zu 1 Minute dauern</p>
</div>
```

**Acceptance Criteria**:
- ✅ Single, clear message (no redundancy)
- ✅ Design matches app's visual language (Tailwind classes)
- ✅ Progress feedback for 30+ second operations (FR-017)

### User Story 5: Result View Design (Priority P3)

**Files to Modify**:
1. `teacher-assistant/frontend/src/components/AgentResultView.tsx` (MODIFY - Layout JSX)
   - Align button spacing with design system (gap-4 instead of gap-2)
   - Ensure image preview is properly sized (max-w-2xl)
   - Use consistent button styles (primary-500 for main action)
   - Follow Tailwind spacing scale (FR-018)

**Design Changes**:
```tsx
// Before (Inconsistent spacing)
<div className="flex gap-2">
  <button className="...">In Library speichern</button>
  <button className="...">Weiter im Chat</button>
</div>

// After (Consistent with design system)
<div className="flex flex-col sm:flex-row gap-4">
  <button className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors">
    In Library speichern
  </button>
  <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors">
    Weiter im Chat
  </button>
</div>
```

**Acceptance Criteria**:
- ✅ Layout follows design system patterns (spacing, typography)
- ✅ Image preview clearly visible with proper sizing (FR-019)
- ✅ Action buttons use consistent styling (FR-020)

## Testing Strategy (CRITICAL - User Feedback Integrated)

### E2E Test Requirements (Playwright)

**MANDATORY**: All tests MUST use REAL user interactions - NO bypass mode

**Test File**: `teacher-assistant/frontend/e2e-tests/library-modal-integration.spec.ts`

```typescript
test('User Story 1: View image in library', async ({ page }) => {
  // Setup: Generate image first (real OpenAI call)
  await page.goto('http://localhost:3000');
  await page.click('[data-testid="chat-tab"]');
  await page.fill('[data-testid="chat-input"]', 'Erstelle ein Bild von einem Löwen');
  await page.click('[data-testid="send-button"]');

  // Wait for agent confirmation (real interaction)
  await page.waitForSelector('[data-testid="agent-confirmation-start-button"]');
  await page.click('[data-testid="agent-confirmation-start-button"]');

  // Fill form and generate (real OpenAI call - DO NOT bypass)
  await page.fill('[data-testid="description-input"]', 'Ein majestätischer Löwe');
  await page.click('[data-testid="generate-button"]');

  // Wait for generation to complete (real wait - up to 60s)
  await page.waitForSelector('[data-testid="save-to-library-button"]', { timeout: 60000 });
  await page.click('[data-testid="save-to-library-button"]');

  // Navigate to Library
  await page.click('[data-testid="library-tab"]');
  await page.click('[data-testid="materials-tab"]');

  // Test: Click image thumbnail
  const imageThumbnail = page.locator('.cursor-pointer').first();
  await imageThumbnail.click();

  // Verify: Modal opens with full image
  await expect(page.locator('[data-testid="material-preview-modal"]')).toBeVisible();
  await expect(page.locator('[data-testid="material-image"]')).toBeVisible();
  await expect(page.locator('[data-testid="material-title"]')).toHaveText(/Löwe/i);

  // Verify: Close button works
  await page.click('[data-testid="close-button"]');
  await expect(page.locator('[data-testid="material-preview-modal"]')).not.toBeVisible();
});

test('User Story 2: Regenerate image with original parameters', async ({ page }) => {
  // Prerequisite: Image exists in library (from User Story 1 test)
  await page.goto('http://localhost:3000');
  await page.click('[data-testid="library-tab"]');
  await page.click('[data-testid="materials-tab"]');

  // Open modal
  const imageThumbnail = page.locator('.cursor-pointer').first();
  await imageThumbnail.click();

  // Test: Click "Neu generieren"
  await page.click('[data-testid="regenerate-button"]');

  // Verify: Form opens with pre-filled data
  await expect(page.locator('[data-testid="agent-form"]')).toBeVisible();
  await expect(page.locator('[data-testid="description-input"]')).toHaveValue(/Löwe/i);

  // Verify: Can modify and regenerate
  await page.fill('[data-testid="description-input"]', 'Ein Löwe bei Sonnenuntergang');
  await page.click('[data-testid="generate-button"]');

  // Wait for new image (real generation - DO NOT bypass)
  await page.waitForSelector('[data-testid="save-to-library-button"]', { timeout: 60000 });
});
```

**Test Duration Policy** (User Feedback):
- Test duration is NOT a reason to skip testing
- Real OpenAI calls may take 30-60 seconds - this is expected
- Tests MUST verify actual functionality, not mock responses
- Use `{ timeout: 60000 }` for generation steps

### Manual Testing Checklist

**Test on BOTH platforms**:
- [ ] Desktop Chrome (1920x1080)
- [ ] Mobile Safari (375x667 iPhone SE)

**Test ALL user stories**:
- [ ] User Story 1: Click image → Modal opens → View full image → Close modal
- [ ] User Story 2: Open modal → Click "Neu generieren" → Form pre-fills → Generate new image
- [ ] User Story 3: Trigger agent suggestion → Button is highly visible → Click starts agent
- [ ] User Story 4: Start generation → Loading view shows clean message → No redundancy
- [ ] User Story 5: Generation completes → Result view matches design system → Buttons aligned

**Document in Session Log**:
- Screenshot of each user story working
- Any errors encountered (with full stack trace)
- Time taken for each interaction (must meet success criteria)

## Complexity Tracking

**No violations** - This feature requires NO new complexity:
- Uses existing components (MaterialPreviewModal already implemented)
- Uses existing InstantDB schema (no database changes)
- Uses existing tech stack (React + Ionic + Tailwind)
- Follows established patterns (useState for modal state, utility functions for type mapping)

## Post-Implementation Checklist

### Before Marking Task Complete (Definition of Done)

1. **Build Clean** ✅
   ```bash
   cd teacher-assistant/frontend
   npm run build
   # Expected: 0 TypeScript errors
   ```

2. **Tests Pass** ✅
   ```bash
   cd teacher-assistant/frontend
   VITE_TEST_MODE=true npx playwright test library-modal-integration.spec.ts --reporter=list
   # Expected: All tests pass (may take 5-10 minutes due to real OpenAI calls)
   ```

3. **Manual Test** ✅
   - Complete manual testing checklist (see above)
   - Document in session log with screenshots
   - Verify on both Desktop Chrome and Mobile Safari

4. **Pre-Commit Pass** ✅
   ```bash
   git add .
   git commit -m "feat: integrate MaterialPreviewModal in Library (BUG-020, BUG-019)"
   # Expected: Husky pre-commit hooks pass (ESLint, Prettier, TypeScript)
   ```

### Session Log Template

Create: `docs/development-logs/sessions/2025-10-12/session-01-library-ux-fixes.md`

```markdown
# Session Log: Library UX Fixes

**Date**: 2025-10-12
**Tasks**: User Stories 1-2 (Library Modal Integration + Image Regeneration)
**Files Modified**:
- teacher-assistant/frontend/src/lib/materialMappers.ts (created)
- teacher-assistant/frontend/src/pages/Library/Library.tsx (modified)

## Build Output
\`\`\`
npm run build
✓ 142 modules transformed.
dist/index.html                   0.45 kB
dist/assets/index-abc123.js     245.67 kB
Build completed in 3.2s
\`\`\`

## Test Results
\`\`\`
npx playwright test library-modal-integration.spec.ts
✓ User Story 1: View image in library (passed in 45s)
✓ User Story 2: Regenerate image with original parameters (passed in 52s)
Tests: 2 passed, 2 total
\`\`\`

## Manual Verification
- [x] Desktop Chrome: Image thumbnail click opens modal ✅
- [x] Desktop Chrome: Modal displays full image + metadata ✅
- [x] Desktop Chrome: Regeneration pre-fills form ✅
- [x] Mobile Safari: Touch target ≥44px ✅
- [x] Mobile Safari: Modal works on small screen ✅

## Screenshots
![Library Grid](./screenshots/library-grid.png)
![Modal Open](./screenshots/modal-open.png)
![Regeneration Form](./screenshots/regeneration-form.png)
\`\`\`

## Next Steps

After plan completion:
1. Generate tasks via `/speckit.tasks`
2. Implement User Stories 1-2 (P1 critical features first)
3. Run full E2E test suite (NO bypass mode)
4. Create session log with evidence
5. Commit with pre-commit hooks passing
6. Implement User Stories 3-5 (P2-P3 design improvements)

**Branch**: `002-library-ux-fixes`
**Plan Path**: `C:/Users/steff/Desktop/eduhu-pwa-prototype/specs/002-library-ux-fixes/plan.md`
**Generated Artifacts**: plan.md (this file)
