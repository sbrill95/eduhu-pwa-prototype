# Epic 3.1 - Clarifications & Design Decisions

**Date**: 2025-10-21
**Status**: ✅ ALL CLARIFIED
**Participants**: User (Steffen), PM Agent

---

## Overview

This document captures all design decisions and clarifications made during Epic 3.1 planning to resolve ambiguities in the story files.

---

## Story 3.1.2: Image Editing Sub-Agent

### Decision 1: Preset Buttons

**Question**: Should Edit Modal have preset operation buttons or just free text field?

**Decision**: **Option A - Free Text Field Only**

**Rationale**:
- ✅ Faster implementation (saves ~2 hours)
- ✅ Simpler UX (less cognitive load)
- ✅ More flexible (users can describe any edit)
- ✅ Gemini understands natural language well

**Implementation**:
```
┌─────────────────────────────────────────┐
│  Bearbeite das Bild:                    │
│  ┌────────────────────────────────────┐ │
│  │ Ändere den Himmel zu Sonnenunter...│ │
│  └────────────────────────────────────┘ │
│           [Bearbeiten]                   │
└─────────────────────────────────────────┘
```

**Future Enhancement (P2)**:
- Add preset buttons if user feedback shows need
- Auto-complete suggestions based on common operations

---

### Decision 2: Version Management - Display Strategy

**Question**: How should edited versions be displayed in the library?

**Decision**: **Standalone Entries (No Grouping)**

**Rationale**:
- ✅ Simpler MVP implementation
- ✅ Each image independently searchable/shareable
- ✅ No complex nested UI required
- ⚠️ Trade-off: Library gets fuller with many edits

**Implementation**:
```typescript
interface MaterialItem {
  id: string;
  url: string;
  originalImageId?: string;  // Links back to original
  version: number;            // 0 = original, 1+ = edited
  editInstruction?: string;   // What edit was performed
  createdAt: Date;
}
```

**Library Display**:
- Each version appears as separate image card
- Metadata shows: "Version 2 of original" (subtle text)
- User can click to see original

**Future Enhancement (P2)**:
- Add "Version History" dropdown on image cards
- Group related versions in collapsed view

---

## Story 3.1.3: Router Logic - Creation vs Editing Detection

### Decision 3: Test Dataset Creation

**Question**: Who creates the 100+ test prompts for router accuracy validation?

**Decision**: **Dev Agent creates 80%, User validates 20%**

**Workflow**:
1. **Dev Agent generates 80 prompts**:
   - 40 clear creation prompts (German + English)
   - 40 clear editing prompts (German + English)
   - Examples based on typical teacher scenarios

2. **Dev Agent generates 20 ambiguous prompts**:
   - Edge cases where intent is unclear
   - Mixed signals (e.g., "mache das bunter")

3. **User reviews 20 prompts (10 min)**:
   - Validates: "Are these realistic scenarios?"
   - Adds 3-5 own edge cases from experience
   - Confirms expected classifications

**Dataset Location**:
`teacher-assistant/frontend/test-data/router-classification-prompts.json`

**Rationale**:
- ✅ Dev Agent knows technical test coverage needs
- ✅ User validates realism and adds domain expertise
- ✅ Balanced approach (not 100% synthetic)

---

### Decision 4: Classifier Implementation

**Question**: Should router use LLM-based classification or rule-based keywords?

**Decision**: **Hybrid Approach (Rules + LLM Fallback)**

**Implementation**:
```typescript
async function classifyIntent(prompt: string, context: Context) {
  // Stage 1: Fast rule-based checks (0ms, 80% of cases)
  if (context.hasImageAttachment) {
    return { intent: 'edit', confidence: 0.95, reasoning: 'Image attached' };
  }

  const keywordMatch = matchEditKeywords(prompt);
  if (keywordMatch.confidence >= 0.8) {
    return { intent: keywordMatch.intent, confidence: keywordMatch.confidence };
  }

  // Stage 2: LLM classification (200-500ms, 20% of cases)
  // Only for ambiguous prompts where rules are uncertain
  const llmResult = await openai.classify(prompt);
  return llmResult;
}
```

**Performance Targets**:
- 80% of prompts: <50ms (rules only)
- 20% of prompts: 200-500ms (LLM needed)
- Average: <150ms

**Rationale**:
- ✅ Fast for clear cases (most requests)
- ✅ Accurate for ambiguous cases (LLM fallback)
- ✅ Cost-effective (fewer LLM API calls)
- ✅ Meets <500ms requirement

---

## Story 3.1.5: Cost Optimization

### Decision 5: Cron Job Hosting

**Question**: Where should the daily usage reset cron job run?

**Decision**: **Vercel Cron** (Frontend is deployed on Vercel)

**Implementation**:
```typescript
// teacher-assistant/frontend/api/cron/reset-usage.ts
import { db } from '@/lib/instant';

export default async function handler(req, res) {
  // Verify Vercel Cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check all users for midnight in their timezone
  const users = await db.users.getAll();
  for (const user of users) {
    await checkAndResetUsage(user);
  }

  return res.json({ success: true, resetCount: users.length });
}
```

**vercel.json**:
```json
{
  "crons": [{
    "path": "/api/cron/reset-usage",
    "schedule": "0 * * * *"
  }]
}
```

**Schedule**: Every hour (checks if user's timezone midnight reached)

**Rationale**:
- ✅ Integrated with Vercel deployment (Frontend is on Vercel)
- ✅ No additional infrastructure needed
- ✅ Vercel Free Tier: 100 cron executions/day (sufficient)
- ✅ Runs independently of backend uptime

**Alternative Considered**: Backend node-cron
- ❌ Depends on backend running 24/7
- ❌ No built-in monitoring

---

### Decision 6: Admin Dashboard Authentication

**Question**: Who should have access to the admin cost dashboard?

**Decision**: **MVP: No Auth (All Users). Post-MVP: Role-Based Access**

**MVP Implementation** (Story 3.1.5):
- Route: `/admin/usage`
- Access: All authenticated users
- No role system needed
- Rationale: Single-user system for now

**Post-MVP Implementation** (Future Story):
- Add InstantDB permissions schema:
  ```typescript
  roles: {
    admin: { canViewUsage: true },
    teacher: { canViewUsage: false }
  }
  ```
- Restrict `/admin/usage` route to admin role
- Add role assignment UI

**Rationale**:
- ✅ MVP: Saves ~4 hours implementation time
- ✅ Current system: Single teacher user
- ✅ Easy to add later when multi-user needed
- ⚠️ Trade-off: All users see costs initially (acceptable for MVP)

---

## Impact on Stories

### Story 3.1.2 Updates
- ✅ AC1: Simplified to free text field only (no preset buttons)
- ✅ AC7: Clarified version management (standalone entries)

### Story 3.1.3 Updates
- ✅ Task 2: Test dataset creation workflow documented
- ✅ Task 4: Hybrid classifier approach specified

### Story 3.1.5 Updates
- ✅ Task 6: Vercel Cron implementation specified
- ✅ AC6: Admin dashboard auth clarified (no auth for MVP)

---

## Next Steps

1. ✅ All stories clarified (no blockers)
2. ✅ Design decisions documented
3. ⏭️ Ready to start Story 3.1.1 (after Epic 3.0 completion)

---

## Summary Table

| Decision | Story | Choice | Impact |
|----------|-------|--------|--------|
| Preset Buttons | 3.1.2 | Free text only | -2h dev time |
| Version Display | 3.1.2 | Standalone entries | Simpler MVP |
| Test Dataset | 3.1.3 | Dev 80%, User 20% | Balanced approach |
| Classifier | 3.1.3 | Hybrid (Rules + LLM) | Fast + Accurate |
| Cron Job | 3.1.5 | Vercel Cron | Integrated deployment |
| Admin Auth | 3.1.5 | No auth (MVP) | -4h dev time |

**Total Time Saved**: ~6 hours (simpler MVP choices)
**Technical Debt**: Low (easy to enhance later)

---

**Document Owner**: PM Agent
**Approved By**: User (Steffen)
**Date**: 2025-10-21
**Status**: ✅ FINAL
