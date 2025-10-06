# Prompt Suggestions Feature - Bug Fix & Re-Activation

**Feature Name**: Home Screen Prompt Suggestions
**Version**: 1.0 - Bug Fix
**Status**: Disabled (TypeScript Errors)
**Created**: 2025-10-06
**Priority**: P2 - Medium

---

## Problem Statement

### Current Status
Das Prompt Suggestions Feature ist **komplett disabled** aufgrund von massiven TypeScript Compilation Errors.

**Symptome:**
- ❌ Backend: `prompts.ts.disabled` und `promptService.ts.disabled`
- ❌ Frontend: `usePromptSuggestions.ts` mit `ENABLE_PROMPT_SUGGESTIONS = false`
- ❌ Console Error: `POST http://localhost:3006/api/prompts/generate-suggestions net::ERR_CONNECTION_REFUSED`

### Root Cause Analysis

#### Backend TypeScript Errors (13 Total)

**File:** `src/services/promptService.ts.disabled`

```
1. Line 20: Module './instantdbService' has no exported member 'TeacherProfileService'
2. Line 20: Module './instantdbService' has no exported member 'ManualContextService'
3. Line 32: Argument of type 'string | undefined' is not assignable to parameter of type 'string'
4. Line 35: Argument of type 'string | undefined' is not assignable to parameter of type 'string'
5. Line 62: Property 'text' is missing in type 'PromptTemplate' (data vs types mismatch)
6. Line 196: Property 'promptTemplate' does not exist on type 'PromptTemplate'
7. Line 197: Property 'title' does not exist on type 'PromptTemplate'
8. Line 198: Property 'description' does not exist on type 'PromptTemplate'
9. Line 229: Object literal may only specify known properties, 'title' does not exist
10. Line 233: Property 'icon' does not exist on type 'PromptTemplate'
11. Line 234: Property 'color' does not exist on type 'PromptTemplate'
12. Line 235: Property 'estimatedTime' does not exist on type 'PromptTemplate'
13. Line 328/344: Type mismatch - 'text' property missing in PromptSuggestion
```

**File:** `src/routes/prompts.ts.disabled`
- Depends on `promptService` (which has errors)
- Import from disabled service fails

---

## Technical Debt Analysis

### Issue 1: Type Definition Mismatch

**Problem:** Two different `PromptTemplate` types exist:
1. `src/data/promptTemplates.ts` - Data model (has: id, promptTemplate, title, description, icon, color, etc.)
2. `src/types/index.ts` - Expected model (has: id, text, category, metadata)

**Why it happened:**
- Data structure evolved but types weren't updated
- Or types were created but data wasn't migrated

**Fix needed:** Align one to the other

---

### Issue 2: Missing Service Exports

**Problem:** `instantdbService.ts` doesn't export:
- `TeacherProfileService`
- `ManualContextService`

**Why it happened:**
- Services were removed/refactored
- Or promptService references old architecture

**Fix needed:** Either implement missing services or refactor promptService to not need them

---

### Issue 3: Nullable Type Safety

**Problem:** `userId` can be `undefined` but service expects `string`

**Code:**
```typescript
const userId = (req as any).user?.id || req.body.userId || 'default-user';
// userId is string | undefined

const profileService = new TeacherProfileService(userId); // Error: needs string
```

**Fix needed:** Type guard or default value handling

---

## Solution Options

### Option A: Quick Fix (2-3 hours)
**Goal:** Get feature working ASAP with minimal changes

1. **Fix Type Definitions**
   - Update `src/types/index.ts` to match `promptTemplates.ts` structure
   - OR update `promptTemplates.ts` to match types

2. **Remove Missing Service Dependencies**
   - Remove `TeacherProfileService` usage
   - Remove `ManualContextService` usage
   - Use simpler context extraction

3. **Fix Nullable Types**
   - Add type guards: `if (!userId) throw new Error(...)`
   - Or use non-null assertion where safe

4. **Re-activate Feature**
   - Rename `.disabled` files back to `.ts`
   - Re-register routes
   - Change `ENABLE_PROMPT_SUGGESTIONS = true`

**Pros:** Fast, gets feature live
**Cons:** Might not be optimal architecture

---

### Option B: Proper Refactor (1-2 days)
**Goal:** Clean, maintainable solution

1. **Unified Type System**
   - Create single source of truth for PromptTemplate
   - Migrate all data to new schema
   - Update all consumers

2. **Simplified Service Architecture**
   - Extract prompt logic to standalone service
   - Remove InstantDB dependencies where not needed
   - Use functional approach instead of class-based

3. **Improved Error Handling**
   - Proper null checks
   - Graceful degradation if profile/context unavailable
   - Better logging

4. **Add Tests**
   - Unit tests for promptService
   - Integration tests for /prompts endpoint
   - E2E tests for Home screen tiles

**Pros:** Clean, maintainable, tested
**Cons:** Takes longer

---

### Option C: MVP Simplified (1 hour)
**Goal:** Get SOMETHING working, even if simplified

1. **Static Prompts Only**
   - Remove personalization logic
   - Return fixed set of prompts from templates
   - No user context needed

2. **Minimal Service**
```typescript
// NEW: promptService.simple.ts
export async function getStaticSuggestions(limit: number = 6) {
  const { PROMPT_TEMPLATES } = await import('../data/promptTemplates');
  return PROMPT_TEMPLATES.slice(0, limit);
}
```

3. **Simple Route**
```typescript
// prompts.ts - simplified
router.post('/generate-suggestions', async (req, res) => {
  const { limit = 6 } = req.body;
  const suggestions = await getStaticSuggestions(limit);
  return res.json({ success: true, data: { suggestions } });
});
```

4. **Re-activate**
   - Change flag to true
   - Test with Home screen

**Pros:** Very fast, guaranteed to work
**Cons:** No personalization (but better than nothing)

---

## Recommendation: Option C → Option A

### Phase 1: MVP (Today)
1. Implement Option C (static prompts)
2. Re-activate feature
3. Verify Home screen works
4. Deploy to staging

### Phase 2: Quick Fix (Next Sprint)
1. Implement Option A (proper types + context)
2. Add basic personalization
3. Deploy to production

### Phase 3: Refactor (Future)
1. Implement Option B when time permits
2. Add advanced personalization
3. Add tests

---

## User Stories

### US-1: See Prompt Suggestions on Home
**Als** Lehrkraft
**möchte ich** vorgefertigte Prompt-Vorschläge auf dem Home-Screen sehen
**damit** ich schneller mit häufigen Aufgaben starten kann

**Acceptance Criteria:**
- [ ] Home Screen zeigt 6 Prompt-Tiles
- [ ] Klick auf Tile startet Chat mit diesem Prompt
- [ ] Keine Console Errors
- [ ] Lädt innerhalb 1 Sekunde

---

## Technical Requirements

### Phase 1: MVP Implementation

#### Backend Changes

**File:** `src/services/promptService.simple.ts` (NEW)
```typescript
import { PROMPT_TEMPLATES } from '../data/promptTemplates';

export async function getStaticSuggestions(limit: number = 6) {
  // Simple: return first N templates
  return PROMPT_TEMPLATES.slice(0, limit).map(template => ({
    id: template.id,
    text: template.promptTemplate, // Map to expected field
    category: template.category,
    icon: template.icon,
    color: template.color,
    metadata: {
      title: template.title,
      description: template.description,
      estimatedTime: template.estimatedTime
    }
  }));
}
```

**File:** `src/routes/prompts.simple.ts` (NEW)
```typescript
import { Router } from 'express';
import { getStaticSuggestions } from '../services/promptService.simple';

const router = Router();

router.post('/generate-suggestions', async (req, res) => {
  try {
    const { limit = 6 } = req.body;
    const suggestions = await getStaticSuggestions(limit);

    return res.json({
      success: true,
      data: { suggestions },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Vorschläge'
    });
  }
});

export default router;
```

**File:** `src/routes/index.ts`
```typescript
import promptsRouter from './prompts.simple'; // Use simple version
router.use('/prompts', promptsRouter);
```

#### Frontend Changes

**File:** `src/hooks/usePromptSuggestions.ts`
```typescript
// Change flag
const ENABLE_PROMPT_SUGGESTIONS = true; // ✅ Re-enable

// Update useEffect to check flag BEFORE calling
useEffect(() => {
  if (ENABLE_PROMPT_SUGGESTIONS) {
    fetchSuggestions();
  }
}, [fetchSuggestions, ENABLE_PROMPT_SUGGESTIONS]);
```

---

## Testing Plan

### Manual Testing
1. Start backend: `npm run dev`
2. Test endpoint: `curl -X POST http://localhost:3006/api/prompts/generate-suggestions`
3. Expected: JSON with 6 suggestions
4. Open Home screen
5. Verify 6 tiles appear
6. Click tile → Chat starts with prompt

### Automated Testing
```typescript
// test: GET /prompts/generate-suggestions
test('returns 6 static prompts', async () => {
  const response = await request(app)
    .post('/api/prompts/generate-suggestions')
    .send({ limit: 6 });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.suggestions).toHaveLength(6);
});
```

---

## Success Criteria

### MVP (Phase 1)
- [ ] No TypeScript compilation errors
- [ ] Backend endpoint returns prompts
- [ ] Home screen displays tiles
- [ ] No console errors
- [ ] Tiles clickable → starts chat

### Full Feature (Phase 2+)
- [ ] Personalized based on user context
- [ ] Dynamic ordering (popular first)
- [ ] Category filtering
- [ ] Usage tracking
- [ ] A/B testing support

---

## Migration Path

### From Disabled to Enabled

1. **Create simple implementations** (new files)
2. **Register simple route** (index.ts)
3. **Test backend** (curl)
4. **Re-enable frontend flag** (usePromptSuggestions.ts)
5. **Test Home screen** (manual QA)
6. **Deploy to staging**
7. **Monitor for errors**
8. **Deploy to production**

### Future: From Simple to Advanced

1. **Implement proper promptService** (fix TypeScript errors)
2. **Add personalization logic**
3. **Switch route to use advanced service**
4. **A/B test simple vs advanced**
5. **Full rollout if metrics good**

---

## Files Summary

### Files to Create (MVP)
- `src/services/promptService.simple.ts`
- `src/routes/prompts.simple.ts`

### Files to Modify (MVP)
- `src/routes/index.ts` (register route)
- `src/hooks/usePromptSuggestions.ts` (enable flag)

### Files to Keep Disabled (For Now)
- `src/services/promptService.ts.disabled` (complex, has errors)
- `src/routes/prompts.ts.disabled` (depends on complex service)

### Files to Fix Later (Phase 2)
- `src/types/index.ts` (align types)
- `src/services/promptService.ts` (fix 13 errors)
- Add tests

---

## Estimated Effort

### Phase 1: MVP (Simple Static Prompts)
- **Development:** 1 hour
- **Testing:** 30 min
- **Total:** 1.5 hours

### Phase 2: Proper Fix (Type-safe + Context)
- **Type alignment:** 2 hours
- **Service refactor:** 3 hours
- **Testing:** 2 hours
- **Total:** 7 hours (1 day)

### Phase 3: Advanced Features
- **Personalization:** 1 day
- **Analytics:** 1 day
- **A/B testing:** 1 day
- **Total:** 3 days

---

## Dependencies

### Internal
- ✅ Prompt Templates data (`promptTemplates.ts`)
- ✅ Home Screen UI (already has grid)
- ✅ API client (frontend)

### External
- None (no external APIs needed)

---

## Risks & Mitigation

### Risk 1: Type Mismatch in Frontend
**Mitigation:** Simple service returns correct structure (text, category, etc.)

### Risk 2: Performance with Large Template Set
**Mitigation:** MVP limits to 6, Phase 2 adds pagination/filtering

### Risk 3: User Confusion (Static Prompts Not Relevant)
**Mitigation:** Choose diverse, generally useful prompts for MVP

---

## Open Questions

### Q1: Which 6 prompts for MVP?
**Suggestion:**
1. "Erstelle ein Arbeitsblatt zu [Thema]"
2. "Generiere eine Unterrichtseinheit für [Klassenstufe]"
3. "Erkläre [Konzept] kindgerecht"
4. "Erstelle einen Test mit 10 Fragen zu [Thema]"
5. "Schlage Differenzierung für [Aufgabe] vor"
6. "Generiere ein Bild für [Thema]"

**User Input Needed:** OK oder andere Auswahl?

### Q2: Tile Design
**Current:** Grid of cards with icon + title
**Question:** Keep current design or update?

### Q3: Click Behavior
**Current:** Tile click → fills chat input
**Suggested:** Tile click → sends message directly
**Question:** Which UX preferred?

---

## Related Documents

- **Data:** `src/data/promptTemplates.ts`
- **Types:** `src/types/index.ts`
- **Frontend Hook:** `src/hooks/usePromptSuggestions.ts`
- **Bug Report:** `KNOWN-ISSUE-PROMPTS-ENDPOINT.md`

---

## Approval

**Status:** ⏳ Awaiting Approval for Option C (MVP)
**Next Step:** Implement simple version if approved
**Estimated:** 1.5 hours to complete MVP

---

**Created:** 2025-10-06
**Author:** Claude Code Agent
**Reviewed By:** [Pending User Approval]
