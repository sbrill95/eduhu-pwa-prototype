# Epics - BMad Structure

**Last Updated**: 2025-10-17
**Methodology**: BMad Method
**Parent PRD**: [docs/prd.md](../prd.md)

---

## Overview

This directory contains **sharded epics** from the main Product Requirements Document (PRD). Each epic represents a major feature area or enhancement phase.

Epics are high-level feature groupings that are further broken down into **stories** (located in `docs/stories/`).

---

## Current Epics

### Phase 3: Multi-Agent System Enhancement

| Epic | Title | Timeline | Status | Priority |
|------|-------|----------|--------|----------|
| [Epic 3.0](./epic-3.0.md) | Foundation & Migration | Weeks 1-4 | Not Started | P0 |
| [Epic 3.1](./epic-3.1.md) | Image Agent - Creation + Editing | Weeks 5-8 | Not Started | P0 |
| [Epic 3.2](./epic-3.2.md) | Production Deployment | Weeks 9-12 | Not Started | P0 |
| [Epic 4.0](./epic-4.0.md) | External Calendar Sync | Weeks 9-12 (Parallel) | Not Started | P1 |

---

## Epic Structure

Each epic file contains:

1. **Epic Goal**: High-level objective
2. **Epic Context**: Current state → Target state
3. **Integration Requirements**: Compatibility and integration needs
4. **Stories**: List of user stories that deliver the epic
5. **Dependencies**: Prerequisites and external dependencies
6. **Success Criteria**: Definition of done for the epic
7. **Risks & Mitigation**: Identified risks and mitigation strategies

---

## Epic Workflow (BMad Method)

```
1. PM creates PRD (docs/prd.md)
   ↓
2. PO shards PRD into Epics (docs/epics/)
   ↓
3. SM creates Stories from Epics (docs/stories/)
   ↓
4. QA performs Risk Assessment + Test Design
   ↓
5. Dev implements Stories
   ↓
6. QA performs Comprehensive Review + Quality Gate
   ↓
7. Story marked complete → Move to next story
```

---

## Creating New Epics

When adding new epics:

1. Use naming convention: `epic-X.Y.md` (e.g., `epic-5.0.md`)
2. Reference parent PRD in header
3. Link to story files in `docs/stories/`
4. Update this README with the new epic
5. Run `/bmad-sm` to create stories from the epic

---

## Related Documentation

- **PRD**: [docs/prd.md](../prd.md) - Product Requirements Document
- **Stories**: [docs/stories/](../stories/) - User stories for each epic
- **QA Assessments**: [docs/qa/assessments/](../qa/assessments/) - Risk and test design
- **Quality Gates**: [docs/qa/gates/](../qa/gates/) - QA review decisions

---

**Maintained By**: BMad PO Agent (Product Owner)
**Review Cycle**: Updated as epics are added or completed
