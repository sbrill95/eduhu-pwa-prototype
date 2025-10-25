# Story: Cost Optimization (Gemini Free Tier Management)

**Epic:** 3.1 - Image Agent: Creation + Editing
**Story ID:** epic-3.1.story-5
**Created:** 2025-10-21
**Status:** Ready for Development
**Priority:** P1 (High - Cost Control)
**Sprint:** Sprint 3 - Week 8 (Epic 3.1 Integration Phase)
**Assignee:** Dev Agent
**Implementation Time:** 1-2 days (8-16 hours)

## Context

Gemini 2.5 Flash offers a generous free tier (100 images/day), but we need strict budget control to avoid unexpected costs. Story 3.1.5 implements usage tracking, limit enforcement, and cost monitoring to stay within the 20 images/day budget.

### Prerequisites
- ✅ Story 3.1.1: Gemini API Integration COMPLETE
- ✅ Story 3.1.2: Image Editing Sub-Agent COMPLETE (usage tracking hooks)
- ✅ InstantDB for usage counter storage

### Why This Story Matters
Without usage tracking and limits, teachers could accidentally exceed the free tier, resulting in unexpected costs. This story provides budget control, cost visibility, and automatic fallback to prevent overruns.

## Problem Statement

We need a cost management system to:
1. Track daily Gemini usage (combined creation + editing)
2. Enforce 20 images/day budget limit
3. Alert users at 80% usage (16/20 images)
4. Provide usage dashboard for teachers
5. Provide admin cost dashboard showing Gemini vs DALL-E costs
6. Generate monthly usage reports
7. Automatic reset at midnight (user timezone)

## User Story

**As a** teacher using image creation and editing
**I want** to see my daily usage and remaining images
**So that** I can plan my work and avoid hitting the limit

**As an** admin monitoring costs
**I want** a dashboard showing Gemini usage and costs
**So that** I can ensure we stay within budget

## Acceptance Criteria

### AC1: Usage Counter Implementation
- [ ] InstantDB collection: `image_usage`
  ```typescript
  {
    userId: string,
    date: string, // YYYY-MM-DD
    creationCount: number,
    editingCount: number,
    totalCount: number,
    lastReset: Date,
    timezone: string
  }
  ```
- [ ] Counter increments on successful image generation
- [ ] Counter increments on successful image editing
- [ ] Counter resets daily at midnight (user timezone)
- [ ] Counter persists across sessions
- [ ] Counter accessible via API: `GET /api/usage/daily`

### AC2: Usage Display in UI
- [ ] Usage indicator visible in image UI:
  - "15/20 Bilder heute verwendet"
  - Visual bar: 75% filled
  - Color coding:
    - Green: 0-70% (0-14 images)
    - Yellow: 71-89% (15-17 images)
    - Orange: 90-99% (18-19 images)
    - Red: 100% (20/20 images)
- [ ] Breakdown visible on hover/click:
  - "Erstellt: 10"
  - "Bearbeitet: 5"
  - "Verbleibend: 5"
- [ ] Counter updates in real-time after each operation
- [ ] Counter shows reset time: "Zurücksetzen um Mitternacht"

### AC3: 80% Usage Warning
- [ ] Warning appears when usage reaches 16/20 (80%)
- [ ] Warning message: "⚠️ Limit bald erreicht (16/20 Bilder). Noch 4 Bilder verfügbar."
- [ ] Warning dismissible but reappears on next image
- [ ] Warning logs to analytics for monitoring
- [ ] Warning includes suggestion: "Plane deine verbleibenden Bilder."

### AC4: Limit Enforcement at 20/20
- [ ] When counter reaches 20/20:
  - Image creation/editing blocked
  - Error message: "🚫 Tägliches Limit erreicht (20/20 Bilder). Morgen um Mitternacht wieder verfügbar."
  - User prompted with reset time (e.g., "Verfügbar ab: 00:00 Uhr")
- [ ] Limit applies to combined creation + editing
- [ ] Limit cannot be bypassed (validated on backend)
- [ ] Admin users can override limit (optional)

### AC5: Automatic Daily Reset
- [ ] Counter resets at midnight in user's timezone
- [ ] Timezone detected from browser: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- [ ] Reset confirmed in UI: "✅ Tägliches Limit zurückgesetzt. 20 Bilder verfügbar."
- [ ] Reset logged to database for audit
- [ ] Reset logic handles timezone edge cases (DST, UTC conversions)

### AC6: Admin Cost Dashboard
- [ ] Admin dashboard route: `/admin/usage`
- [ ] Dashboard shows:
  - **Total Gemini usage today**: X images
  - **Total DALL-E usage today**: Y images
  - **Gemini cost today**: $X.XX (at $0.039/image)
  - **DALL-E cost today**: $Y.YY (at $0.04/image)
  - **Cost savings**: $Z.ZZ (Gemini vs DALL-E)
  - **Free tier remaining**: 100 - X images
- [ ] Charts:
  - Daily usage trend (last 30 days)
  - Cost comparison (Gemini vs DALL-E)
  - User-level usage breakdown
- [ ] Export data as CSV

### AC7: Monthly Usage Report
- [ ] Generate monthly report on 1st of each month
- [ ] Report includes:
  - Total images: Creation + Editing
  - Gemini usage: Count + Cost
  - DALL-E usage: Count + Cost
  - Total cost for month
  - Average daily usage
  - Peak usage day
  - Cost per user (if multi-user)
- [ ] Report saved to: `docs/usage-reports/YYYY-MM.md`
- [ ] Report emailed to admin (optional)

### AC8: Fallback Strategy (Future Enhancement - P2)
- [ ] When Gemini limit reached, offer DALL-E alternative:
  - "Gemini Limit erreicht. Möchtest du stattdessen DALL-E verwenden? (Kostet $0.04)"
  - User can choose: "Ja, DALL-E verwenden" or "Nein, morgen weitermachen"
- [ ] Track fallback usage separately
- [ ] Include fallback in cost dashboard

**Note**: AC8 is P2 (nice-to-have), not required for Story 3.1.5 completion.

## Technical Requirements

### InstantDB Schema Extension
```typescript
// Add to InstantDB schema
imageUsage: {
  userId: string,
  date: string, // YYYY-MM-DD
  creationCount: number,
  editingCount: number,
  totalCount: number,
  lastReset: Date,
  timezone: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Usage Service Implementation
```typescript
// teacher-assistant/backend/src/services/usageService.ts

export class UsageService {
  async getCurrentUsage(userId: string): Promise<{
    creationCount: number,
    editingCount: number,
    totalCount: number,
    limit: number,
    remaining: number,
    percentage: number,
    resetTime: Date
  }>

  async incrementUsage(
    userId: string,
    type: 'creation' | 'editing'
  ): Promise<void>

  async checkLimitReached(userId: string): Promise<boolean>

  async resetDailyUsage(userId: string): Promise<void>

  async getMonthlyReport(month: string): Promise<MonthlyReport>
}
```

### Timezone Handling
```typescript
// Frontend: Detect user timezone
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// Examples: "Europe/Berlin", "America/New_York", "Asia/Tokyo"

// Backend: Calculate midnight in user timezone
import { DateTime } from 'luxon';
const midnightLocal = DateTime.now()
  .setZone(userTimezone)
  .startOf('day')
  .plus({ days: 1 });
```

### Cost Calculation
| Service | Cost per Image | Formula |
|---------|---------------|---------|
| Gemini 2.5 Flash | $0.039 | `usageCount × 0.039` |
| DALL-E 3 (1024×1024) | $0.040 | `usageCount × 0.040` |
| **Savings** | - | `(DALL-E_cost - Gemini_cost)` |

## Task Breakdown

### Task 1: Create Usage Counter Schema
- [ ] Add `imageUsage` collection to InstantDB schema
- [ ] Create migration if needed
- [ ] Test schema with sample data

**Time Estimate**: 1 hour

### Task 2: Implement Usage Service
- [ ] Create `usageService.ts` in backend
- [ ] Implement `getCurrentUsage()` method
- [ ] Implement `incrementUsage()` method
- [ ] Implement `checkLimitReached()` method
- [ ] Implement `resetDailyUsage()` method
- [ ] Add timezone handling

**Time Estimate**: 3 hours

### Task 3: Integrate Usage Tracking in Image Workflow
- [ ] Hook into DALL-E image creation (Story 3.0.3)
- [ ] Hook into Gemini image editing (Story 3.1.2)
- [ ] Increment counter on successful generation
- [ ] Validate limit before generating
- [ ] Return error if limit reached

**Time Estimate**: 2 hours

### Task 4: Create Usage Display UI Component
- [ ] Create `UsageIndicator.tsx` component
- [ ] Display counter: "X/20 Bilder"
- [ ] Add visual bar with color coding
- [ ] Add hover tooltip with breakdown
- [ ] Update in real-time

**Time Estimate**: 2 hours

### Task 5: Implement Warning & Limit UI
- [ ] Add 80% warning message
- [ ] Add 20/20 limit error message
- [ ] Style warnings appropriately
- [ ] Add dismissible logic
- [ ] Test warning triggers

**Time Estimate**: 1 hour

### Task 6: Implement Daily Reset Logic
- [ ] Create cron job for midnight reset
- [ ] Handle timezone conversions
- [ ] Test reset across timezones
- [ ] Add reset confirmation message
- [ ] Log resets for audit

**Time Estimate**: 2 hours

### Task 7: Create Admin Dashboard
- [ ] Create `/admin/usage` route
- [ ] Display usage statistics
- [ ] Display cost calculations
- [ ] Add charts (daily trend, cost comparison)
- [ ] Add CSV export functionality

**Time Estimate**: 3 hours

### Task 8: Implement Monthly Report Generation
- [ ] Create report generation script
- [ ] Schedule monthly execution
- [ ] Save report to docs folder
- [ ] Test report with sample data

**Time Estimate**: 2 hours

### Task 9: Write Tests
- [ ] Unit tests for usage service
- [ ] Integration tests for counter increment
- [ ] E2E tests for limit enforcement
- [ ] E2E tests for reset logic
- [ ] Test timezone edge cases

**Time Estimate**: 2 hours

### Task 10: Documentation
- [ ] Document usage tracking system
- [ ] Document admin dashboard
- [ ] Document monthly report format
- [ ] Add troubleshooting guide

**Time Estimate**: 1 hour

## Dependencies

### Technical Dependencies
- Story 3.1.2 COMPLETE (editing implementation with usage hooks)
- InstantDB configured and working
- Timezone library (Luxon) installed

### External Dependencies
- User timezone detection (browser API)
- Cron scheduler for daily resets

### Story Dependencies
- **Depends On**: Story 3.1.2 (Image Editing Sub-Agent)
- **Can Run Parallel**: Story 3.1.3 (Router Logic)
- **Blocks**: None (Epic 3.1 can complete without this, but P1 priority)

## Success Criteria

Story 3.1.5 is complete when:
- ✅ Usage counter tracks creation + editing
- ✅ Counter displayed in UI with color coding
- ✅ 80% warning appears at 16/20 images
- ✅ Limit enforced at 20/20 images
- ✅ Daily reset works correctly at midnight
- ✅ Admin dashboard shows costs
- ✅ Monthly report generated
- ✅ All tests passing
- ✅ Build clean (0 TypeScript errors)
- ✅ Zero console errors
- ✅ QA review PASS

## Definition of Done

- [ ] All 7 acceptance criteria met (AC8 is P2, optional)
- [ ] All 10 tasks completed
- [ ] Usage counter working in production
- [ ] UI components functional and tested
- [ ] Daily reset tested across timezones
- [ ] Admin dashboard accessible
- [ ] Build clean: `npm run build` → 0 errors
- [ ] Tests passing: `npm test` → 100%
- [ ] E2E tests passing
- [ ] Zero console errors
- [ ] Session log created
- [ ] QA review PASS
- [ ] Code committed with tests

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Timezone handling edge cases (DST) | MEDIUM | Use Luxon library, extensive testing |
| Counter sync issues (race conditions) | MEDIUM | Atomic increments in database |
| Reset fails during downtime | LOW | Retry logic, manual reset option |
| Admin dashboard performance with large data | LOW | Pagination, date range filters |
| Users bypass limit (client-side only) | HIGH | **CRITICAL**: Backend validation required |

## Notes

### Why 20 Images/Day (Not 100)?
Gemini free tier allows 100 images/day, but we're using 20 to:
1. **Budget predictability**: Prevent unexpected overruns
2. **User behavior**: 20 is reasonable daily usage for a teacher
3. **Upgrade path**: Can increase to 50, 100 later
4. **Safety margin**: Leaves buffer for testing/admin

### Gemini Pricing Tiers
| Tier | Cost per Image | RPM | RPD |
|------|---------------|-----|-----|
| Free | $0 | 15 | 1,500 |
| Pay-as-you-go | $0.039 | 1,000 | Unlimited |

**Current Plan**: Free tier with 20/day budget

### Future Enhancements (P2 - Not in this story)
- User-specific limits (teacher vs admin)
- Weekly/monthly limits in addition to daily
- Dynamic limits based on subscription tier
- Cost alerts via email when threshold reached
- Machine learning to predict daily usage
- Graceful degradation to DALL-E when limit reached

### Testing Strategy
1. **Unit tests**: UsageService methods
2. **Integration tests**: Counter increments, limit checks
3. **E2E tests**: Full workflow with limit enforcement
4. **Timezone tests**: Reset at midnight in various timezones
5. **Manual tests**: Admin dashboard, monthly reports

### Cost Savings Calculation Example
**Scenario**: Teacher uses 20 images/day for 30 days
- **Gemini cost**: 600 images × $0.039 = **$23.40**
- **DALL-E cost**: 600 images × $0.040 = **$24.00**
- **Savings**: $24.00 - $23.40 = **$0.60/month**

**Plus**: First 20 images/day on free tier = **$23.40 saved/month**

### Admin Dashboard Mockup
```
===========================================
| Image Usage Dashboard - October 2025   |
===========================================
| Today:                                  |
| • Gemini: 45 images ($1.76)            |
| • DALL-E: 12 images ($0.48)            |
| • Total: 57 images ($2.24)             |
| • Free tier remaining: 55 images       |
===========================================
| This Month:                             |
| • Gemini: 680 images ($26.52)          |
| • DALL-E: 180 images ($7.20)           |
| • Total: 860 images ($33.72)           |
| • Savings vs all-DALL-E: $8.68         |
===========================================
| Charts:                                 |
| [Daily usage trend graph]              |
| [Cost comparison graph]                |
| [User breakdown pie chart]             |
===========================================
```

---

**Story Owner:** Dev Agent
**Reviewed By:** QA Agent (Quinn) - Pending
**Last Updated:** 2025-10-21

## Related Documentation
- Epic 3.1: `docs/epics/epic-3.1.md`
- Story 3.1.2: Usage tracking integration points
- Gemini Pricing: https://ai.google.dev/pricing
- Sprint Planning Report: `docs/development-logs/sessions/2025-10-21/epic-3.1-sprint-planning-report.md`
