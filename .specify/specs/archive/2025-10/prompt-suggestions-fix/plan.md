# Prompt Suggestions Fix - Implementation Plan

**Feature:** Home Screen Prompt Suggestions Re-Activation
**Approach:** Option C (MVP - Static Prompts)
**Estimated Time:** 1.5 hours
**Status:** Ready to implement

---

## Implementation Steps

### Step 1: Create Simple Prompt Service (15 min)

**File:** `teacher-assistant/backend/src/services/promptService.simple.ts`

```typescript
import { PROMPT_TEMPLATES } from '../data/promptTemplates';

/**
 * Simple prompt service - returns static suggestions
 * No personalization, no user context needed
 */
export async function getStaticSuggestions(limit: number = 6) {
  return PROMPT_TEMPLATES.slice(0, limit).map(template => ({
    id: template.id,
    text: template.promptTemplate,
    category: template.category,
    icon: template.icon || '✨',
    color: template.color || '#FF6B35',
    metadata: {
      title: template.title,
      description: template.description,
      estimatedTime: template.estimatedTime || '5 Min'
    }
  }));
}
```

**Why simple:**
- No TypeScript errors (no complex types)
- No user context needed
- No InstantDB dependencies
- Just maps existing data

---

### Step 2: Create Simple Route (15 min)

**File:** `teacher-assistant/backend/src/routes/prompts.simple.ts`

```typescript
import { Router, Request, Response } from 'express';
import { getStaticSuggestions } from '../services/promptService.simple';
import { logInfo, logError } from '../config/logger';

const router = Router();

/**
 * POST /api/prompts/generate-suggestions
 * Returns static prompt suggestions (no personalization)
 */
router.post('/generate-suggestions', async (req: Request, res: Response) => {
  try {
    const { limit = 6 } = req.body;

    logInfo('Fetching static prompt suggestions', { limit });

    const suggestions = await getStaticSuggestions(limit);

    return res.status(200).json({
      success: true,
      data: {
        suggestions,
        generatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Error fetching prompt suggestions', error as Error);

    return res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Vorschläge',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
```

---

### Step 3: Register Route (5 min)

**File:** `teacher-assistant/backend/src/routes/index.ts`

```typescript
// Add import
import promptsRouter from './prompts.simple';

// Add route registration (after other routes)
router.use('/prompts', promptsRouter);
```

**Before:**
```typescript
// TODO: Enable these routes after fixing TypeScript errors
// router.use('/prompts', promptsRouter);
```

**After:**
```typescript
// Mount prompts routes (simple static version)
router.use('/prompts', promptsRouter);
```

---

### Step 4: Re-Enable Frontend Feature (10 min)

**File:** `teacher-assistant/frontend/src/hooks/usePromptSuggestions.ts`

**Change 1 - Enable flag:**
```typescript
// Line 39
const ENABLE_PROMPT_SUGGESTIONS = true; // ✅ Changed from false
```

**Change 2 - Fix useEffect (already done):**
```typescript
// Lines 68-73 (already fixed earlier)
useEffect(() => {
  // Only fetch if feature is enabled
  if (ENABLE_PROMPT_SUGGESTIONS) {
    fetchSuggestions();
  }
}, [fetchSuggestions, ENABLE_PROMPT_SUGGESTIONS]);
```

---

### Step 5: Test Backend (10 min)

**Terminal 1 - Start Backend:**
```bash
cd teacher-assistant/backend
npm run dev
```

**Terminal 2 - Test Endpoint:**
```bash
curl -X POST http://localhost:3006/api/prompts/generate-suggestions \
  -H "Content-Type: application/json" \
  -d '{"limit": 6}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "...",
        "text": "Erstelle ein Arbeitsblatt zu...",
        "category": "material-creation",
        "icon": "📄",
        "color": "#FF6B35",
        "metadata": {
          "title": "Arbeitsblatt erstellen",
          "description": "...",
          "estimatedTime": "10 Min"
        }
      }
      // ... 5 more
    ],
    "generatedAt": "2025-10-06T..."
  }
}
```

---

### Step 6: Test Frontend (15 min)

**Terminal 3 - Start Frontend:**
```bash
cd teacher-assistant/frontend
npm run dev
```

**Browser - Test Home Screen:**
1. Open `http://localhost:5173`
2. Navigate to Home tab
3. Wait 2 seconds for tiles to load
4. Verify: 6 prompt tiles appear
5. Check console: NO errors about `/prompts/generate-suggestions`

**Expected UI:**
- Grid of 6 cards
- Each card has icon + title
- Click on card → fills chat input OR sends message

---

### Step 7: Screenshot & Verify (10 min)

**Create screenshots:**
```bash
# Take screenshot of Home screen with tiles
npx playwright test --headed --project=chromium -g "Home screen loads"
```

**Manual verification:**
- [ ] All 6 tiles visible
- [ ] Icons display correctly
- [ ] Colors applied
- [ ] No console errors
- [ ] Click works (chat starts)

---

### Step 8: Create Test (15 min)

**File:** `teacher-assistant/frontend/e2e-tests/prompt-suggestions.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('Home screen shows 6 prompt suggestion tiles', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Navigate to Home
  await page.click('[aria-label="Home"]');
  await page.waitForTimeout(2000);

  // Check for tiles
  const tiles = page.locator('[data-testid="prompt-tile"]').or(
    page.locator('[class*="prompt"]')
  );

  const count = await tiles.count();
  expect(count).toBe(6);

  // Check first tile has icon and title
  const firstTile = tiles.first();
  await expect(firstTile).toBeVisible();

  // Click should work
  await firstTile.click();
  // Verify chat input filled or message sent
});
```

---

### Step 9: Update Documentation (10 min)

**File:** `PROMPT-SUGGESTIONS-REACTIVATED.md`

```markdown
# Prompt Suggestions Feature - Re-Activated

**Date:** 2025-10-06
**Status:** ✅ Live (Static MVP)

## What Changed

1. Created simple service: `promptService.simple.ts`
2. Created simple route: `prompts.simple.ts`
3. Registered route in `routes/index.ts`
4. Re-enabled frontend flag in `usePromptSuggestions.ts`

## Current Functionality

- **Backend:** Returns 6 static prompts from `promptTemplates.ts`
- **Frontend:** Displays tiles on Home screen
- **Personalization:** None (static for all users)

## Next Steps (Future)

1. Fix TypeScript errors in original `promptService.ts`
2. Add user context personalization
3. Add usage tracking
4. A/B test static vs personalized

## Files Modified

- Created: `backend/src/services/promptService.simple.ts`
- Created: `backend/src/routes/prompts.simple.ts`
- Modified: `backend/src/routes/index.ts`
- Modified: `frontend/src/hooks/usePromptSuggestions.ts`
```

---

## Testing Checklist

### Backend Tests
- [ ] Endpoint returns 200
- [ ] Response has `success: true`
- [ ] Suggestions array has 6 items
- [ ] Each item has: id, text, category, icon, color, metadata
- [ ] No console errors on backend

### Frontend Tests
- [ ] Home screen loads
- [ ] 6 tiles appear
- [ ] No console errors
- [ ] Tiles are clickable
- [ ] Click fills chat input (or sends message)

### Integration Tests
- [ ] Full flow: Load Home → See tiles → Click → Chat starts
- [ ] Works on mobile viewport
- [ ] Works on desktop viewport
- [ ] No errors in any browser

---

## Rollback Plan

If issues occur:

**Step 1 - Disable Frontend:**
```typescript
// usePromptSuggestions.ts
const ENABLE_PROMPT_SUGGESTIONS = false;
```

**Step 2 - Remove Route:**
```typescript
// routes/index.ts
// router.use('/prompts', promptsRouter); // Comment out
```

**Step 3 - Delete New Files (optional):**
```bash
rm backend/src/services/promptService.simple.ts
rm backend/src/routes/prompts.simple.ts
```

---

## Success Metrics

### Immediate (MVP)
- ✅ No TypeScript errors
- ✅ Endpoint returns data
- ✅ Home screen displays tiles
- ✅ No console errors
- ✅ Users can click tiles

### Future (Full Feature)
- Click-through rate on tiles
- Conversion to chat messages
- User satisfaction with suggestions
- A/B test performance vs static

---

## Timeline

**Total Estimated:** 1.5 hours

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Create simple service | 15 min | ⏳ Pending |
| 2 | Create simple route | 15 min | ⏳ Pending |
| 3 | Register route | 5 min | ⏳ Pending |
| 4 | Re-enable frontend | 10 min | ⏳ Pending |
| 5 | Test backend | 10 min | ⏳ Pending |
| 6 | Test frontend | 15 min | ⏳ Pending |
| 7 | Screenshot & verify | 10 min | ⏳ Pending |
| 8 | Create test | 15 min | ⏳ Pending |
| 9 | Update docs | 10 min | ⏳ Pending |

**Next:** Ready to implement Step 1

---

## Dependencies

### Required
- ✅ `promptTemplates.ts` exists with data
- ✅ Home screen has grid layout
- ✅ API client configured

### Not Required
- ❌ TeacherProfileService (not using)
- ❌ ManualContextService (not using)
- ❌ User context (static prompts)

---

## Risk Assessment

### Low Risk
- ✅ No complex type dependencies
- ✅ No InstantDB queries
- ✅ Simple data transformation
- ✅ Easy to rollback

### Mitigation
- Feature flag for easy disable
- Separate simple service (doesn't break old code)
- Comprehensive testing before enable

---

**Status:** ✅ Ready to implement
**Approval:** Awaiting user confirmation to proceed
**ETA:** 1.5 hours after approval
