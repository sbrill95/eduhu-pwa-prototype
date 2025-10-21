# Migration Checklist: Story 3.0.3 - DALL-E Agent to OpenAI SDK

**Story**: Epic 3.0, Story 3.0.3
**Date**: 2025-10-20
**Purpose**: Ensure 100% feature parity during migration from LangGraph to OpenAI Agents SDK

---

## Pre-Migration Verification

- [ ] Review existing LangGraph implementation (842 lines)
- [ ] Document all API response formats
- [ ] List all E2E tests that must pass (10+ tests)
- [ ] Backup current working implementation
- [ ] Verify test environment setup (`VITE_TEST_MODE`)

---

## Core Implementation Tasks

### 1. Agent Structure
- [ ] Create `ImageGenerationAgent` class extending base SDK agent
- [ ] Port agent metadata (id, name, description, triggers)
- [ ] Implement config object with defaults
- [ ] Add monthly limit constants (10 free, 50 premium)

### 2. DALL-E 3 Integration
- [ ] Implement `generateImage()` method with SDK
- [ ] Add 60-second timeout protection (Promise.race)
- [ ] Support all sizes: 1024x1024, 1024x1792, 1792x1024
- [ ] Support quality: standard, hd
- [ ] Support style: vivid, natural
- [ ] Test mode bypass for `VITE_TEST_MODE=true`

### 3. Prompt Enhancement
- [ ] Port `enhanceGermanPrompt()` method
- [ ] Implement German text detection
- [ ] Translate German to English for better DALL-E results
- [ ] Add educational context enhancement
- [ ] Support Gemini form input (`buildImagePrompt()`)

### 4. Title & Tag Generation
- [ ] Port `generateTitleAndTags()` using ChatGPT
- [ ] Implement fallback title generation
- [ ] Implement fallback tag extraction
- [ ] Ensure German language support
- [ ] Return format: `{ title: string, tags: string[] }`

### 5. Usage Limits
- [ ] Implement `canExecute()` method
- [ ] Check monthly usage against limits
- [ ] Track usage per user ID
- [ ] Return German error message when exceeded

### 6. Cost Tracking
- [ ] Implement `calculateCost()` method
- [ ] Support pricing matrix for all sizes/qualities
- [ ] Include cost in response metadata

### 7. Artifact Creation
- [ ] Port `createArtifact()` method
- [ ] Store all generation metadata
- [ ] Include originalParams for re-generation
- [ ] Save to InstantDB format

### 8. Error Handling
- [ ] Implement German error messages
- [ ] Handle OpenAI rate limits
- [ ] Handle content policy violations
- [ ] Handle timeout errors
- [ ] Always return structured response

---

## API Endpoint Migration

### 9. Create New Endpoint
- [ ] Create `/api/agents-sdk/image/generate`
- [ ] Accept same parameters as LangGraph endpoint
- [ ] Implement request validation
- [ ] Support manual override parameter
- [ ] Return identical response format

### 10. Response Format Validation
- [ ] Ensure `success` boolean field
- [ ] Ensure `data` object with all required fields
- [ ] Ensure `cost` number field
- [ ] Ensure `metadata` object
- [ ] Ensure `artifacts` array

---

## Testing Requirements

### 11. Unit Tests
- [ ] Test prompt enhancement logic
- [ ] Test title/tag generation
- [ ] Test cost calculation
- [ ] Test usage limit checking
- [ ] Test error handling
- [ ] Mock OpenAI API calls

### 12. Integration Tests
- [ ] Test API endpoint with valid requests
- [ ] Test validation errors
- [ ] Test rate limiting
- [ ] Test response format
- [ ] Test with test mode enabled

### 13. E2E Tests (CRITICAL)
- [ ] `image-generation-complete-workflow.spec.ts` MUST PASS
- [ ] 10-step user journey must complete
- [ ] Screenshots must be captured
- [ ] Console errors: ZERO allowed
- [ ] Response time < 70 seconds
- [ ] All UI elements must remain functional

---

## Critical E2E Test Points (from complete-workflow.spec.ts)

1. **Chat Message** (Step 1)
   - [ ] Accept prompt "Erstelle ein Bild vom Satz des Pythagoras"
   - [ ] Send to backend successfully

2. **Agent Confirmation** (Step 2)
   - [ ] Orange gradient card appears
   - [ ] No "Failed to fetch" errors
   - [ ] Response within 20 seconds

3. **Form Opens** (Step 3)
   - [ ] Form prefilled with original prompt
   - [ ] All form fields functional

4. **Generation Progress** (Step 4)
   - [ ] Single progress animation (not duplicate)
   - [ ] Loading state handled correctly

5. **Preview Opens** (Step 5)
   - [ ] Image displayed in fullscreen
   - [ ] 3 action buttons visible
   - [ ] Generation completes < 70 seconds

6. **Continue in Chat** (Step 6)
   - [ ] Navigation to chat works
   - [ ] Image thumbnail visible (max 200px)

7. **Thumbnail Clickable** (Step 7)
   - [ ] Click opens preview modal
   - [ ] "Neu generieren" button visible

8. **Library Auto-Save** (Step 8)
   - [ ] Image saved to library
   - [ ] "Bilder" filter works

9. **Library Preview** (Step 9)
   - [ ] Preview opens from library
   - [ ] Regenerate button present

10. **Regenerate from Library** (Step 10)
    - [ ] Form opens with original params
    - [ ] Description prefilled correctly

---

## Validation Criteria

### Build & Tests
- [ ] `npm run build` - 0 TypeScript errors
- [ ] `npm test` - All unit tests passing
- [ ] `npx playwright test image` - All E2E tests passing
- [ ] Console monitoring - ZERO errors in browser

### Performance
- [ ] Image generation < 70 seconds
- [ ] API response < 20 seconds for confirmation
- [ ] No memory leaks
- [ ] No duplicate animations

### Feature Parity
- [ ] All existing features work identically
- [ ] Response format 100% compatible
- [ ] UI behavior unchanged
- [ ] Error messages in German

---

## Migration Success Criteria

✅ **Migration is complete when:**
1. All checkboxes above are checked
2. All existing E2E tests pass (0 failures)
3. Manual test of 10-step workflow succeeds
4. No console errors in any scenario
5. Response format identical to LangGraph
6. Performance meets or exceeds current baseline

---

## Rollback Plan

If migration fails:
1. Keep LangGraph endpoint active at `/api/langgraph/agents/image-generation`
2. Use environment variable to switch: `AGENTS_SDK_ENABLED=false`
3. Dual-path support allows instant rollback
4. Monitor error rates for 24 hours before removing LangGraph

---

## Notes

- **Test Mode**: Always test with `VITE_TEST_MODE=true` first
- **Mock Data**: Use mock image URL in test mode to avoid API costs
- **Timeout**: DALL-E 3 can take 35-60 seconds, plan accordingly
- **German Users**: All user-facing errors must be in German
- **Re-generation**: originalParams MUST be preserved for feature to work

---

**Total Tasks**: 75 checkboxes
**Estimated Time**: 8-12 hours
**Risk Level**: Medium (existing tests provide safety net)