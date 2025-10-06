# Session 04: Form Prefill & Library Storage Investigation

**Datum**: 2025-10-05
**Agent**: react-frontend-developer
**Dauer**: 2 hours
**Status**: 🔄 In Progress (Blocked by Library.tsx state)
**Related SpecKit**: `.specify/specs/image-generation-ux-v2/`

---

## 🎯 Session Ziele

1. ✅ Verify form prefill from `agentSuggestion.prefillData` in AgentFormView
2. ⚠️  Fix Library storage - images not appearing after generation
3. ⏸️  Test complete end-to-end flow with Playwright (blocked)
4. ⏸️  Capture required screenshots (blocked)

---

## 🔍 Investigation Findings

### Task 1: Form Prefill Verification ✅

**Status**: ✅ **VERIFIED - Working Correctly**

**Files Analyzed**:
- `teacher-assistant/frontend/src/components/AgentFormView.tsx` (Lines 16-25)
- `teacher-assistant/frontend/src/components/AgentConfirmationMessage.tsx` (Lines 240-252)
- `teacher-assistant/frontend/src/lib/AgentContext.tsx` (Line 84-96)

**Data Flow**:
1. **Backend Response** → Contains `agentSuggestion.prefillData`:
   ```json
   {
     "agentSuggestion": {
       "agentType": "image-generation",
       "reasoning": "...",
       "prefillData": {
         "description": "Ein Löwen",
         "imageStyle": "realistic"
       }
     }
   }
   ```

2. **AgentConfirmationMessage** → Calls `openModal` with prefillData:
   ```typescript
   openModal(
     message.agentSuggestion!.agentType,
     message.agentSuggestion!.prefillData,  // ← Passes prefill data
     sessionId || null
   );
   ```

3. **AgentContext** → Stores in state:
   ```typescript
   setState({
     isOpen: true,
     phase: 'form',
     agentType: agentType as any,
     formData: prefillData,  // ← Stored here
     // ...
   });
   ```

4. **AgentFormView** → useEffect watches state.formData:
   ```typescript
   useEffect(() => {
     if (state.formData.description) {
       setFormData(prev => ({
         ...prev,
         description: state.formData.description || prev.description,
         imageStyle: state.formData.imageStyle || prev.imageStyle
       }));
     }
   }, [state.formData]);
   ```

**Conclusion**: Form prefill mechanism is **correctly implemented**. Prefilled data flows from backend → AgentContext → AgentFormView.

---

### Task 2: Library Storage Investigation ⚠️

**Status**: ⚠️  **ROOT CAUSE IDENTIFIED - Fix Blocked**

**User Report**:
> "in der library scheint weiterhin das bild nicht abgelegt zu werden"

#### Root Cause Analysis

**Backend Side** ✅ (CORRECT):
- File: `teacher-assistant/backend/src/routes/langGraphAgents.ts` (Lines 296-346)
- Images ARE being saved to `library_materials` table:
  ```typescript
  await db.transact([
    db.tx.library_materials[imageLibraryId].update({
      user_id: effectiveUserId,
      title: titleToUse,
      type: 'image',
      content: result.data.image_url,
      description: result.data.revised_prompt || params.prompt,
      tags: JSON.stringify([]),
      created_at: now,
      updated_at: now,
      is_favorite: false,
      usage_count: 0,
      source_session_id: sessionId || null
    })
  ]);
  ```

**Frontend Side** ❌ (INCORRECT):
- File: `teacher-assistant/frontend/src/pages/Library/Library.tsx` (Line 49)
- Current: Uses `useMaterials` hook
  ```typescript
  import { useMaterials, type UnifiedMaterial } from '../../hooks/useMaterials';

  const {
    materials,
    loading: materialsLoading,
    error: materialsError,
  } = useMaterials();
  ```

- **Problem**: `useMaterials` queries these tables:
  - ✅ `artifacts` (manual materials)
  - ✅ `generated_artifacts` (old agent-generated)
  - ✅ `messages` (uploads)
  - ❌ **MISSING**: `library_materials` (new image storage)

**Correct Hook Exists**:
- File: `teacher-assistant/frontend/src/hooks/useLibraryMaterials.ts` (Lines 47-56)
- This hook correctly queries `library_materials`:
  ```typescript
  const { data: materialsData, error: queryError } = db.useQuery(
    user ? {
      library_materials: {
        $: {
          where: { user_id: user.id },
          order: { serverCreatedAt: 'desc' }
        }
      }
    } : null
  );
  ```

#### The Fix

**Replace** in `Library.tsx`:
```typescript
// ❌ WRONG
import { useMaterials, type UnifiedMaterial } from '../../hooks/useMaterials';

// ✅ CORRECT
import { useLibraryMaterials, type LibraryMaterial } from '../../hooks/useLibraryMaterials';
```

**Update hook usage**:
```typescript
// ❌ WRONG
const {
  materials,
  loading: materialsLoading,
  error: materialsError,
} = useMaterials();

// ✅ CORRECT
const {
  materials,
  loading: materialsLoading,
  error: materialsError,
} = useLibraryMaterials();
```

**Update type references**:
```typescript
// ❌ WRONG
const [selectedMaterial, setSelectedMaterial] = useState<UnifiedMaterial | null>(null);

// ✅ CORRECT
const [selectedMaterial, setSelectedMaterial] = useState<LibraryMaterial | null>(null);
```

#### Why Fix Cannot Be Applied Now

**Current State**: Library.tsx is in a **placeholder/old version** state after git operations:
- Lines 1-212: Placeholder component with no InstantDB integration
- Missing: useMaterials hook, MaterialPreviewModal, chat integration
- This is from a very old commit (pre-Phase 3 implementation)

**Next Steps**:
1. User needs to restore correct Library.tsx version from recent commits (11b90be or later)
2. OR provide access to working Library.tsx
3. Then apply the 3-line fix above

---

## 📁 Files Analyzed

**Form Prefill** (✅ Verified):
- `teacher-assistant/frontend/src/components/AgentFormView.tsx`
- `teacher-assistant/frontend/src/components/AgentConfirmationMessage.tsx`
- `teacher-assistant/frontend/src/lib/AgentContext.tsx`

**Library Storage** (⚠️  Fix Identified):
- `teacher-assistant/backend/src/routes/langGraphAgents.ts` (Backend ✅)
- `teacher-assistant/frontend/src/pages/Library/Library.tsx` (Frontend ❌)
- `teacher-assistant/frontend/src/hooks/useMaterials.ts` (Wrong hook)
- `teacher-assistant/frontend/src/hooks/useLibraryMaterials.ts` (Correct hook)

---

## 🧪 Testing Status

**Form Prefill**:
- ✅ Code review: Correct implementation
- ⏸️  E2E test: Blocked (needs Library fix first)
- ⏸️  Screenshot: Blocked

**Library Storage**:
- ✅ Root cause identified
- ⏸️  Fix application: Blocked (Library.tsx old version)
- ⏸️  E2E test: Blocked
- ⏸️  Screenshot: Blocked

---

## 🎯 Next Steps

1. **User Action Required**: Restore correct Library.tsx from commit 11b90be or later
2. **Apply Fix**: Change hook import and usage (3 lines)
3. **Test E2E Flow**:
   - Send chat message requesting image
   - Click "Bild-Generierung starten"
   - Verify form prefilled
   - Submit and generate image
   - Navigate to Library
   - Verify image appears in "Bilder" filter
4. **Capture Screenshots**:
   - form-prefilled-description.png
   - form-prefilled-style.png
   - chat-image-display.png
   - library-all-filter.png
   - library-bilder-filter.png
   - library-image-visible.png

---

## 📝 Technical Debt

1. **Inconsistent Material Hooks**:
   - `useMaterials` vs `useLibraryMaterials`
   - Should unify under one hook or document clearly when to use each
   - Consider deprecating `useMaterials` in favor of `useLibraryMaterials`

2. **Type Mismatches**:
   - `UnifiedMaterial` vs `LibraryMaterial`
   - Material type definitions spread across multiple files
   - Should consolidate into shared types

3. **Documentation**:
   - Hook usage guidelines missing
   - No clear documentation on when to use which hook
   - Type differences not documented

---

## 🔗 References

- **Spec**: `.specify/specs/image-generation-ux-v2/spec.md` (US-2, US-4)
- **Plan**: `.specify/specs/image-generation-ux-v2/REVISED-IMPLEMENTATION-PLAN.md` (Phase 4)
- **Backend Implementation**: `langGraphAgents.ts` Lines 296-346
- **Frontend Hooks**: `useMaterials.ts` vs `useLibraryMaterials.ts`

---

**Duration**: 2 hours
**Outcome**: Root cause identified, fix ready but blocked by file state
**Blocker**: Library.tsx needs restoration to working version
