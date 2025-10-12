# QUICK FIX GUIDE - Visual Bugs (2025-10-12)

**Total Fix Time**: < 5 minutes
**Testing Time**: 15 minutes

---

## Fix 1: Bug 002 - Image Not Showing in Library Modal (CRITICAL)

**File**: `C:\Users\steff\Desktop\eduhu-pwa-prototype\teacher-assistant\frontend\src\components\MaterialPreviewModal.tsx`
**Line**: 299
**Priority**: CRITICAL (one-line fix)

### Change:
```typescript
// BEFORE (line 299) - BUG
src={material.metadata.image_data}

// AFTER (line 299) - FIXED
src={material.metadata.artifact_data.url}
```

**Exact Edit**:
```typescript
{material.type === 'image' && material.metadata.artifact_data?.url && (
  <img
    src={material.metadata.artifact_data.url}  // ← Change this line
    alt={material.title}
    style={{ width: '100%', borderRadius: '8px' }}
    data-testid="material-image"
  />
)}
```

---

## Fix 2: Bug 001 - Agent Confirmation Button Visibility (HIGH)

**File**: `C:\Users\steff\Desktop\eduhu-pwa-prototype\teacher-assistant\frontend\src\components\AgentConfirmationMessage.tsx`
**Line**: 278
**Priority**: HIGH

### Change:
```typescript
// BEFORE (line 278) - LOW CONTRAST
className="flex-1 h-14 bg-primary-500 text-white rounded-xl font-semibold text-base shadow-md hover:shadow-lg hover:bg-primary-600 active:bg-primary-700 transition-all duration-200"

// AFTER (line 278) - BETTER CONTRAST
className="flex-1 h-14 bg-primary-600 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 ring-2 ring-primary-600 ring-offset-2"
```

**Exact Edit**:
```typescript
<button
  data-testid="agent-confirmation-start-button"
  onClick={handleConfirm}
  className="flex-1 h-14 bg-primary-600 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 ring-2 ring-primary-600 ring-offset-2"
  aria-label="Bild-Generierung starten"
>
  Bild-Generierung starten ✨
</button>
```

**Changes**:
- `bg-primary-500` → `bg-primary-600` (darker orange)
- `shadow-md` → `shadow-lg` (stronger shadow)
- Added: `ring-2 ring-primary-600 ring-offset-2` (visual separation)
- Adjusted hover/active states

---

## Fix 3: Bug 003 - Modal Scrolling (MEDIUM)

**File**: `C:\Users\steff\Desktop\eduhu-pwa-prototype\teacher-assistant\frontend\src\components\MaterialPreviewModal.tsx`
**Lines**: 284-286
**Priority**: MEDIUM

### Change:
```typescript
// BEFORE (line 284-286)
<IonContent>
  {/* Material Preview Content */}
  <div style={{ padding: '16px' }}>

// AFTER (line 284-286)
<IonContent className="ion-padding">
  {/* Material Preview Content */}
  <div style={{ paddingBottom: '80px' }}>
```

**Exact Edit**:
```typescript
<IonContent className="ion-padding">
  {/* Material Preview Content */}
  <div style={{ paddingBottom: '80px' }}>
    {/* ... rest of content ... */}
```

---

## Verification Steps

### 1. Apply Fixes
```bash
# Navigate to frontend directory
cd C:\Users\steff\Desktop\eduhu-pwa-prototype\teacher-assistant\frontend

# Build and verify no errors
npm run build

# Should see:
# ✓ built in ~5s
# 0 TypeScript errors
```

### 2. Test Fix 002 (Image Display)
1. Open browser: http://localhost:5174
2. Login and generate an image (or use existing)
3. Navigate to Library → Materialien
4. Click on image thumbnail
5. **VERIFY**: Full-size image is visible in modal
6. **EXPECTED**: Image loads from InstantDB storage URL

### 3. Test Fix 001 (Button Visibility)
1. Navigate to Chat
2. Send message: "Erstelle ein Bild von einem Löwen"
3. Wait for agent suggestion card
4. **VERIFY**: Button has darker orange color with ring effect
5. **EXPECTED**: Button is clearly distinguishable from card border
6. Click button and verify modal opens

### 4. Test Fix 003 (Modal Scrolling)
1. Open any material in Library modal
2. Scroll through modal content
3. **VERIFY**: All buttons are visible and accessible
4. **EXPECTED**: Smooth scrolling with proper bottom padding

---

## Rollback Plan

If fixes cause issues, revert using git:

```bash
# Show current changes
git diff src/components/AgentConfirmationMessage.tsx
git diff src/components/MaterialPreviewModal.tsx

# Revert if needed (before commit)
git checkout src/components/AgentConfirmationMessage.tsx
git checkout src/components/MaterialPreviewModal.tsx

# After commit, revert last commit
git revert HEAD
```

---

## Commit Message Template

```
fix: resolve critical visual bugs in agent confirmation and library modal

- Bug 002: Fix image display in library modal (incorrect src path)
  - Changed metadata.image_data to metadata.artifact_data.url
  - File: MaterialPreviewModal.tsx, line 299

- Bug 001: Improve agent confirmation button visibility
  - Increased button contrast with darker orange and ring effect
  - File: AgentConfirmationMessage.tsx, line 278

- Bug 003: Improve modal scrolling and layout
  - Added bottom padding for safe scrolling
  - File: MaterialPreviewModal.tsx, lines 284-286

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Expected Results After Fixes

1. **Library Modal Image**: ✅ Visible, loads from InstantDB
2. **Agent Confirmation Button**: ✅ Clear, high contrast, distinguishable
3. **Modal Scrolling**: ✅ Smooth, all buttons accessible

**Total Lines Changed**: 3 lines across 2 files
**Impact**: Unblocks critical user workflows

---

**Document Created**: 2025-10-12
**By**: QA Agent
**Location**: `C:\Users\steff\Desktop\eduhu-pwa-prototype\docs\quality-assurance\QUICK-FIX-GUIDE-visual-bugs.md`
