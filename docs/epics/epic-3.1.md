# Epic 3.1: Image Agent - Creation + Editing

**Epic ID**: Epic 3.1
**Parent PRD**: [docs/prd.md](../prd.md)
**Timeline**: Weeks 5-8
**Status**: Not Started
**Priority**: P0 (Critical)
**Depends On**: Epic 3.0 (Foundation & Migration)

---

## Epic Goal

Enable teachers to edit existing images with natural language instructions using Gemini 2.5 Flash.

---

## Epic Context

**Current State** (after Epic 3.0):
- OpenAI Agents SDK integrated and working
- Router agent classifies intents successfully
- Image creation via DALL-E 3 works through new SDK

**Target State**:
- Teachers can edit images with German natural language instructions
- Router auto-detects creation vs editing intent
- Gemini 2.5 Flash handles image editing operations
- Cost-optimized: Use Gemini free tier (100 edits/day)

---

## Integration Requirements

- ✅ Image editing integrates seamlessly with existing library system
- ✅ Edited images saved with metadata linking to original image
- ✅ Gemini free tier (100 images/day) monitored and enforced
- ✅ Fallback to DALL-E if Gemini limit exceeded

---

## Stories

### Story 3.1.1: Google AI Studio Setup + Gemini API Integration
**Goal**: Gemini 2.5 Flash Image API integrated into backend

**Acceptance Criteria**:
1. Google AI Studio account created with API key
2. `@google/generative-ai` npm package installed
3. Gemini API successfully edits test image
4. Error handling for API failures and rate limits
5. Documentation added to `docs/architecture/api-documentation/gemini.md`

**Story File**: [docs/stories/epic-3.1.story-1.md](../stories/epic-3.1.story-1.md)

---

### Story 3.1.2: Image Editing Sub-Agent
**Goal**: Edit existing images with natural language instructions

**Acceptance Criteria**:
1. Edit operations: add elements, remove elements, change style, adjust colors
2. German language editing instructions processed correctly
3. Edited image saved to library with link to original
4. Editing operation completes in <10 seconds (median)
5. Usage tracking: monitor Gemini free tier limit

**Story File**: [docs/stories/epic-3.1.story-2.md](../stories/epic-3.1.story-2.md)

---

### Story 3.1.3: Router Logic - Creation vs. Editing Detection
**Goal**: Router automatically detects creation vs editing intent

**Acceptance Criteria**:
1. Router detects editing keywords: "ändere", "bearbeite", "füge hinzu", "entferne"
2. Router detects context: uploaded image or reference to previous image
3. Classification accuracy ≥95% on test dataset
4. Confidence score displayed to user
5. Manual override if classification is incorrect

**Story File**: [docs/stories/epic-3.1.story-3.md](../stories/epic-3.1.story-3.md)

---

### Story 3.1.4: Image Workflow E2E Tests
**Goal**: E2E tests covering full image creation and editing workflows

**Acceptance Criteria**:
1. Playwright test: Create image → Save → Edit image → Save edited version
2. Playwright test: Router correctly detects creation vs editing (10 scenarios)
3. Playwright test: Gemini editing with various instructions
4. Playwright test: Error handling when Gemini API fails
5. Screenshots captured for all test steps

**Story File**: [docs/stories/epic-3.1.story-4.md](../stories/epic-3.1.story-4.md)

---

### Story 3.1.5: Cost Optimization (Gemini Free Tier Management)
**Goal**: Gemini free tier usage monitored and enforced

**Acceptance Criteria**:
1. Usage dashboard tracks Gemini edits per day
2. Alert at 80% usage (80 edits out of 100)
3. Automatic fallback to DALL-E if limit exceeded
4. User notification: "Gemini limit erreicht, verwende DALL-E stattdessen"
5. Monthly report: Gemini usage vs DALL-E usage

**Story File**: [docs/stories/epic-3.1.story-5.md](../stories/epic-3.1.story-5.md)

---

## Dependencies

**Before Starting**:
- ✅ Epic 3.0 complete (OpenAI Agents SDK working)
- ✅ Router agent functional and tested
- ✅ Google AI Studio account setup

**External Dependencies**:
- Google Gemini 2.5 Flash Image API access
- Gemini free tier (100 images/day) available

---

## Success Criteria

Epic 3.1 is complete when:
- ✅ Teachers can edit images with natural language instructions
- ✅ Router auto-detects creation vs editing (≥95% accuracy)
- ✅ Gemini integration working and cost-optimized
- ✅ All E2E tests passing (creation + editing workflows)
- ✅ 100 free edits/day budget monitored
- ✅ Fallback to DALL-E works seamlessly

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini free tier exhausted frequently | MEDIUM | Monitor usage, fallback to DALL-E, upgrade to paid if needed |
| Router misclassifies creation vs editing | HIGH | Extensive testing, user feedback, manual override |
| Gemini editing quality below expectations | MEDIUM | Prompt engineering, quality scoring, user feedback |

---

## Business Value

**Time Savings**: 50% reduction in image iteration time (edit vs regenerate)
**Cost Savings**: $0.04 per DALL-E image → $0 per Gemini edit (free tier)
**User Experience**: Teachers can refine images without starting over

---

**Epic Owner**: BMad Dev Agent
**QA Reviewer**: BMad QA Agent (Quinn)
**Created**: 2025-10-17
**Last Updated**: 2025-10-17
