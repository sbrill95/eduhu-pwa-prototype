# Stories - BMad Structure

**Last Updated**: 2025-10-20
**Methodology**: BMad Method
**Parent Epics**: [docs/epics/](../epics/)

---

## 🔴 CRITICAL PRODUCTION BLOCKER

### Story TD-1: Fix All TypeScript Compilation Errors
**Status**: Ready for Development
**Priority**: P0 CRITICAL
**File**: [tech-debt.story-1.md](./tech-debt.story-1.md)

**Blocks**: ALL production deployments, Epic 3.2 (Production), Vercel deployment

**Quick Summary**:
- Backend build fails with 36 TypeScript errors
- Production deployment to Vercel is BLOCKED
- Must be completed BEFORE any production release
- Estimated: 4-6 hours development + 1-2 hours QA

**Why P0**: Cannot deploy to production with failing build. Every new feature adds more type errors.

---

## Overview

This directory contains **user stories** created from epics. Each story represents a single, implementable unit of work.

Stories follow the BMad story format with:
- User story description (As a... I want... so that...)
- Acceptance criteria
- Technical approach
- Implementation tasks
- Definition of done
- QA results (after review)

---

## Story Naming Convention

Stories are named using the pattern: `epic-X.Y.story-Z.md` or `tech-debt.story-Z.md`

Examples:
- `epic-3.0.story-1.md` - Story 1 from Epic 3.0
- `epic-3.0.story-2.md` - Story 2 from Epic 3.0
- `tech-debt.story-1.md` - Technical Debt Story 1

---

## Current Stories

### Technical Debt (CRITICAL)
- [x] **TD-1**: [Fix All TypeScript Compilation Errors](./tech-debt.story-1.md) - 🔴 **P0 CRITICAL** - Ready for Development

### Epic 3.0: Foundation & Migration (Weeks 1-4)

- [x] **Story 3.0.1**: [OpenAI Agents SDK Setup](./epic-3.0.story-1.md) - ✅ COMPLETE (QA: PASS)
- [ ] **Story 3.0.2**: [Router Agent Implementation](./epic-3.0.story-2.md) - Ready for Development
- [ ] **Story 3.0.3**: [Migrate DALL-E Image Agent](./epic-3.0.story-3.md) - Ready for Development
- [ ] **Story 3.0.4**: [Dual-Path Support](./epic-3.0.story-4.md) - Ready for Development
- [ ] **Story 3.0.5**: [E2E Tests](./epic-3.0.story-5.md) - Ready for Development

### Epic 3.1: Image Agent Enhancement (Weeks 5-8)

Stories to be created after Epic 3.0:
- [ ] epic-3.1.story-1.md - Gemini API Integration
- [ ] epic-3.1.story-2.md - Image Editing Sub-Agent
- [ ] epic-3.1.story-3.md - Router Creation vs Editing
- [ ] epic-3.1.story-4.md - E2E Tests
- [ ] epic-3.1.story-5.md - Cost Optimization

### Epic 3.2: Production Deployment (Weeks 9-12)

Stories to be created after Epic 3.1:
- [ ] epic-3.2.story-1.md - Remove LangGraph
- [ ] epic-3.2.story-2.md - Monitoring + Logging
- [ ] epic-3.2.story-3.md - Cost Tracking Dashboard
- [ ] epic-3.2.story-4.md - Error Handling
- [ ] epic-3.2.story-5.md - Documentation

### Epic 4.0: Calendar Integration (Weeks 9-12)

Stories in parallel with Epic 3.2:
- [ ] epic-4.0.story-1.md - Google Calendar OAuth
- [ ] epic-4.0.story-2.md - Calendar Sync Service
- [ ] epic-4.0.story-3.md - CalendarCard Real Data
- [ ] epic-4.0.story-4.md - Profile Calendar Management

---

## BMad Story Workflow

```
1. SM creates story (/bmad-sm)
2. QA Risk Assessment (/bmad.risk)
3. QA Test Design (/bmad.test-design)
4. Dev implements (/bmad-dev)
5. QA Review (/bmad.review)
6. Quality Gate (PASS/CONCERNS/FAIL)
7. Story complete or fix issues
```

---

## Creating Stories

```bash
# Run Scrum Master agent to create stories
/bmad-sm

# Follow prompts to create story from epic
```

---

**Maintained By**: BMad SM Agent
**Review Cycle**: Updated as stories are created/completed
