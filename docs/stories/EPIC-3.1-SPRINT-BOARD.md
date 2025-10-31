# Epic 3.1 Sprint Board

**Last Updated**: 2025-10-21
**Epic**: Epic 3.1 - Image Agent: Creation + Editing
**Timeline**: 4 weeks (after Epic 3.0 completion)
**Status**: ⚠️ Prep Required (1 day)

---

## Sprint Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EPIC 3.1 SPRINT TIMELINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PREP       │  SPRINT 1  │     SPRINT 2     │     SPRINT 3         │
│  (1 day)    │  (1 week)  │    (2 weeks)     │    (2 weeks)         │
│             │            │                  │                      │
│  Story      │  Story     │  Story 3.1.2     │  Story 3.1.3 ───┐    │
│  Files      │  3.1.1     │  (Image Editing) │  (Router Logic) │    │
│  Created    │  (Gemini   │                  │                 │    │
│             │   API)     │                  │  Story 3.1.5 ───┤    │
│  Google     │            │                  │  (Cost Optim)   │    │
│  Account    │  CodeRabbit│                  │                 │    │
│  Setup      │  Pilot     │                  │  Story 3.1.4 ───┘    │
│             │            │                  │  (E2E Tests)         │
│             │            │                  │                      │
│  Risk       │            │                  │                      │
│  Assess     │            │                  │                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PREP PHASE (1 Day)

### Before Epic 3.1 Starts

**Duration**: 5-9 hours (1 day)
**Owner**: SM Agent + User
**Goal**: Create all missing stories and setup external dependencies

#### Tasks

| Task | Owner | Time | Status | Blocker |
|------|-------|------|--------|---------|
| Complete Story 3.0.5 (QA Review) | QA/User | 1-2h | 📝 Ready | None |
| Create epic-3.1.story-1.md | SM Agent | 30m | ❌ TODO | 3.0.5 |
| Create epic-3.1.story-3.md | SM Agent | 30m | ❌ TODO | 3.0.5 |
| Create epic-3.1.story-4.md | SM Agent | 30m | ❌ TODO | 3.0.5 |
| Create epic-3.1.story-5.md | SM Agent | 30m | ❌ TODO | 3.0.5 |
| Create Google AI Studio account | User | 30m | ❌ TODO | None |
| Get Gemini API key | User | 5m | ❌ TODO | Account |
| Risk: Story 3.1.1 | QA Agent | 30m | ❌ TODO | Story file |
| Risk: Story 3.1.2 | QA Agent | 30m | ❌ TODO | None |
| Test Design: Story 3.1.1 | QA Agent | 1h | ❌ TODO | Story file |

**Deliverables**:
- ✅ Epic 3.0 complete (100%)
- ✅ 4 story files created
- ✅ Google AI Studio account + API key
- ✅ 2 risk assessments
- ✅ 1 test design
- ✅ Epic 3.1 ready to start

---

## SPRINT 1: Foundation (Week 5)

### Story 3.1.1: Google AI Studio Setup + Gemini API Integration

**Duration**: 8-16 hours (1-2 days)
**Priority**: P0 (CRITICAL - blocks all other stories)
**Risk**: 🟡 MEDIUM
**Special**: CodeRabbit Pilot

#### Acceptance Criteria

- [ ] AC1: Google AI Studio account created with API key
- [ ] AC2: `@google/generative-ai` npm package installed
- [ ] AC3: Gemini API successfully edits test image
- [ ] AC4: Error handling for API failures and rate limits
- [ ] AC5: Documentation in `docs/architecture/api-documentation/gemini.md`

#### Tasks

- [ ] Create Google AI Studio account (PREP PHASE)
- [ ] Install `@google/generative-ai` package
- [ ] Create `GeminiImageService` class
- [ ] Implement `editImage()` method
- [ ] Add error handling (network, rate limits, timeouts)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] **RUN CodeRabbit review** (pilot)
- [ ] Document CodeRabbit findings
- [ ] Create architecture documentation
- [ ] Request QA review

#### CodeRabbit Pilot

- [ ] Run CodeRabbit before marking "Ready for QA"
- [ ] Document all findings (valid + false positives)
- [ ] Apply valid fixes
- [ ] Compare CodeRabbit vs Quinn findings
- [ ] Make adoption decision

#### Success Metrics

- ✅ Gemini API working
- ✅ Error handling robust
- ✅ CodeRabbit pilot complete
- ✅ QA PASS

**Definition of Done**:
- Build clean (0 errors)
- All tests pass (100%)
- Zero console errors
- QA PASS
- Session log with CodeRabbit analysis

---

## SPRINT 2: Core Feature (Weeks 6-7)

### Story 3.1.2: Image Editing Sub-Agent

**Duration**: 24-40 hours (3-5 days)
**Priority**: P0 (CRITICAL - main Epic 3.1 value)
**Risk**: 🟡 MEDIUM (complexity)
**Dependencies**: Story 3.1.1 complete

#### Acceptance Criteria (8 ACs)

- [ ] AC1: Edit Modal Implementation
  - "Bearbeiten" button on all library images
  - Modal with original (40%) + edit area (60%)
  - Instruction input + preset buttons
  - Preview + Save/Cancel buttons

- [ ] AC2: Edit Operations (6 types)
  - Text addition ("Füge 'Klasse 5b' hinzu")
  - Object addition ("Füge einen Dinosaurier hinzu")
  - Object removal ("Entferne die Person")
  - Style change ("Mache es im Cartoon-Stil")
  - Color adjustment ("Ändere Himmel zu Sonnenuntergang")
  - Background change ("Ersetze Hintergrund")

- [ ] AC3: Natural Language Processing (German)
  - Keywords: "ändere", "bearbeite", "füge hinzu", "entferne"
  - Context: "das rote Auto", "im Vordergrund"

- [ ] AC4: Image Reference Resolution
  - "das letzte Bild", "das Bild von gestern"
  - Clarification dialog with mini-previews

- [ ] AC5: Gemini Integration
  - PNG, JPEG, WebP, HEIC, HEIF support
  - Max 20 MB file size
  - SynthID watermark

- [ ] AC6: Usage Tracking
  - 20 images/day (combined create + edit)
  - Counter in UI
  - Midnight reset

- [ ] AC7: Version Management
  - Original ALWAYS preserved
  - Unlimited versions
  - Standalone library entries

- [ ] AC8: Error Handling
  - API failures, timeouts, rate limits
  - User-friendly error messages

#### Task Breakdown (6 phases)

**Phase 1: UI (6 hours)**
- [ ] Create ImageEditModal component
- [ ] Design modal layout
- [ ] Implement preset buttons
- [ ] Add instruction input field

**Phase 2: Backend (8 hours)**
- [ ] Create GeminiEditService class
- [ ] Implement editImage() method
- [ ] Add image encoding/decoding
- [ ] Error handling + timeouts

**Phase 3: NLP (6 hours)**
- [ ] German instruction parser
- [ ] Image reference resolver
- [ ] Clarification dialog system

**Phase 4: Usage Tracking (4 hours)**
- [ ] Daily limit counter
- [ ] Reset mechanism
- [ ] UI indicators

**Phase 5: Version Management (4 hours)**
- [ ] Save edited images separately
- [ ] Preserve originals
- [ ] Version metadata

**Phase 6: Testing (12 hours)**
- [ ] E2E test: Complete edit workflow
- [ ] Test all 6 preset operations
- [ ] Test German instructions
- [ ] Test limit enforcement
- [ ] Test error scenarios

#### Success Metrics

- ✅ All 6 edit operations working
- ✅ German NLP accurate
- ✅ Performance <10 seconds
- ✅ 20 images/day limit enforced
- ✅ Original always preserved
- ✅ QA PASS

**Definition of Done**:
- Build clean (0 errors)
- All tests pass (100%)
- Playwright E2E tests pass
- Screenshots captured
- Zero console errors
- QA PASS

---

## SPRINT 3: Integration & Testing (Weeks 8-9)

### 🔀 PARALLEL TRACKS

#### Track A: Router Logic
**Story 3.1.3** (16-24 hours, 2-3 days)

#### Track B: Cost Optimization
**Story 3.1.5** (8-16 hours, 1-2 days)

#### Track C: E2E Tests (after A+B)
**Story 3.1.4** (16-24 hours, 2-3 days)

---

### Story 3.1.3: Router Logic - Creation vs. Editing Detection

**Duration**: 16-24 hours (2-3 days)
**Priority**: P0 (HIGH - user experience)
**Risk**: 🟡 MEDIUM (accuracy requirement)
**Dependencies**: Story 3.1.2 complete

#### Acceptance Criteria

- [ ] AC1: Router detects editing keywords
  - "ändere", "bearbeite", "füge hinzu", "entferne"

- [ ] AC2: Router detects context
  - Uploaded image detection
  - Reference to previous image

- [ ] AC3: Classification accuracy ≥95%
  - Test dataset: 100+ samples
  - 50/50 split (creation vs editing)

- [ ] AC4: Confidence score displayed to user
  - Visual indicator in chat

- [ ] AC5: Manual override available
  - Button when confidence <70%
  - User can select agent manually

#### Tasks

- [ ] Enhance router prompt
- [ ] Add German keyword detection
- [ ] Add context detection (image upload/reference)
- [ ] Create test dataset (100+ samples)
- [ ] Validate ≥95% accuracy
- [ ] Implement confidence score UI
- [ ] Add manual override button
- [ ] Write unit tests
- [ ] Write E2E tests
- [ ] Update documentation

#### Success Metrics

- ✅ ≥95% accuracy on test dataset
- ✅ Confidence score visible
- ✅ Manual override works
- ✅ QA PASS

---

### Story 3.1.5: Cost Optimization (Gemini Free Tier Management)

**Duration**: 8-16 hours (1-2 days)
**Priority**: P0 (MEDIUM - cost control)
**Risk**: 🟢 LOW
**Dependencies**: Story 3.1.2 complete
**Can Run**: PARALLEL with Story 3.1.3

#### Acceptance Criteria

- [ ] AC1: Usage dashboard tracks Gemini edits per day
  - Real-time counter

- [ ] AC2: Alert at 80% usage
  - "16/20 Bilder verwendet - Limit bald erreicht"

- [ ] AC3: Automatic fallback to DALL-E if limit exceeded
  - Seamless transition

- [ ] AC4: User notification
  - "Tägliches Limit erreicht. Morgen wieder verfügbar."

- [ ] AC5: Monthly report
  - Gemini usage vs DALL-E usage
  - Cost breakdown

#### Tasks

- [ ] Create usage counter in InstantDB
- [ ] Increment on each Gemini edit
- [ ] Daily reset at midnight
- [ ] Display usage in UI
- [ ] Alert at 80% (16/20)
- [ ] Implement limit enforcement
- [ ] Add DALL-E fallback
- [ ] User notification on limit
- [ ] Admin dashboard (Gemini costs)
- [ ] Monthly usage report
- [ ] E2E tests for limits

#### Success Metrics

- ✅ 20 images/day enforced
- ✅ Counter accurate
- ✅ Fallback works
- ✅ QA PASS

---

### Story 3.1.4: Image Workflow E2E Tests

**Duration**: 16-24 hours (2-3 days)
**Priority**: P0 (CRITICAL - quality gate)
**Risk**: 🟢 LOW
**Dependencies**: Stories 3.1.1, 3.1.2, 3.1.3 complete

#### Acceptance Criteria

- [ ] AC1: Playwright test - Complete workflow
  - Create image → Save → Edit → Save edited version

- [ ] AC2: Playwright test - Router classification
  - 10 scenarios (5 creation, 5 editing)
  - Verify ≥95% accuracy

- [ ] AC3: Playwright test - Gemini editing
  - All 6 edit operations
  - Various instructions

- [ ] AC4: Playwright test - Error handling
  - API failures, timeouts, rate limits

- [ ] AC5: Screenshots captured
  - All test steps documented

#### Tasks

- [ ] Create E2E test suite: `image-workflow-comprehensive.spec.ts`
- [ ] Test: Complete creation workflow
- [ ] Test: Complete editing workflow
- [ ] Test: Router classification (10 scenarios)
- [ ] Test: German instructions (diverse operations)
- [ ] Test: Error handling
- [ ] Test: Version management
- [ ] Test: Usage tracking
- [ ] Capture screenshots (BEFORE, AFTER, ERROR)
- [ ] Create test execution report

#### Success Metrics

- ✅ All E2E tests passing
- ✅ Screenshots captured
- ✅ Full coverage
- ✅ QA PASS

---

## Epic 3.1 Completion Checklist

### Technical Checklist

- [ ] All 5 stories have QA PASS
- [ ] Gemini API integrated with error handling
- [ ] Image editing works in <10 seconds
- [ ] Router ≥95% accuracy (creation vs editing)
- [ ] 20 images/day limit enforced
- [ ] All E2E tests passing (100%)
- [ ] Build clean (0 TypeScript errors)
- [ ] Zero console errors
- [ ] All stories have session logs

### User Experience Checklist

- [ ] Teachers can edit images with German instructions
- [ ] All 6 edit operations functional
- [ ] Manual override available
- [ ] Original images always preserved
- [ ] Unlimited versions supported
- [ ] Usage dashboard shows remaining images
- [ ] Error messages user-friendly

### Business Checklist

- [ ] Cost tracking accurate
- [ ] Cost per edit: $0.039 (Gemini)
- [ ] Time savings: 50% (edit vs regenerate)
- [ ] Free tier utilization optimized
- [ ] Foundation for future agents established

### Documentation Checklist

- [ ] All stories documented in `docs/stories/`
- [ ] Architecture docs updated
- [ ] API documentation complete (`gemini.md`)
- [ ] Session logs for all stories
- [ ] QA reports for all stories
- [ ] Quality gate files for all stories
- [ ] CodeRabbit pilot analysis (Story 3.1.1)

---

## Progress Tracking

### Epic 3.1 Progress: 0% (0/5 stories complete)

```
PREP PHASE      [░░░░░░░░░░] 0%   (0/9 tasks)
SPRINT 1        [░░░░░░░░░░] 0%   Story 3.1.1 (0/5 ACs)
SPRINT 2        [░░░░░░░░░░] 0%   Story 3.1.2 (0/8 ACs)
SPRINT 3        [░░░░░░░░░░] 0%   Stories 3.1.3, 3.1.5, 3.1.4 (0/12 ACs)
EPIC 3.1        [░░░░░░░░░░] 0%   (0/5 stories)
```

**Update this section as you progress!**

---

## Quick Reference

### Story Sizes
- **Small**: 8-16 hours (Story 3.1.1, 3.1.5)
- **Medium**: 16-24 hours (Story 3.1.3, 3.1.4)
- **Large**: 24-40 hours (Story 3.1.2)

### Risk Levels
- **LOW**: Stories 3.1.4, 3.1.5 (testing, simple tracking)
- **MEDIUM**: Stories 3.1.1, 3.1.2, 3.1.3 (API integration, complexity, accuracy)

### Critical Path
```
3.1.1 → 3.1.2 → 3.1.3 → 3.1.4
             → 3.1.5 ────────┘
```

### Commands

**QA Review**:
```bash
/bmad.review docs/stories/epic-3.1.story-X.md
```

**Risk Assessment**:
```bash
/bmad.risk docs/stories/epic-3.1.story-X.md
```

**Test Design**:
```bash
/bmad.test-design docs/stories/epic-3.1.story-X.md
```

---

**Board Owner**: BMad SM Agent
**Last Updated**: 2025-10-21
**Next Update**: After Story 3.0.5 completion
**Status**: 📝 READY FOR PREP PHASE
