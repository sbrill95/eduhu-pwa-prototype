# Epic 4.0: External Calendar Sync

**Epic ID**: Epic 4.0
**Parent PRD**: [docs/prd.md](../prd.md)
**Timeline**: Weeks 9-12 (PARALLEL with Epic 3.2)
**Status**: Not Started
**Priority**: P1 (High)
**Runs In Parallel With**: Epic 3.2 (Production Deployment)

---

## Epic Goal

Replace mock calendar data with real events from Google Calendar via read-only OAuth sync.

---

## Epic Context

**Current Problem**:
- CalendarCard on Home screen shows hardcoded mock data (lines 61-64 in `CalendarCard.tsx`)
- Teachers cannot see their real schedule in the app
- No integration with external calendar systems

**Target State**:
- Teachers can connect Google Calendar via OAuth
- CalendarCard displays real events from synced calendar
- Background sync every 30 minutes
- Read-only sync (no calendar editing in app)

---

## Integration Requirements

- ✅ Read-only sync from external calendar (no CRUD in app)
- ✅ Sync runs in background without impacting app performance
- ✅ OAuth flow is secure and user-friendly
- ✅ InstantDB schema changes are non-breaking

---

## Stories

### Story 4.0.1: Google Calendar OAuth Integration
**Goal**: Teachers can connect their Google Calendar to the app

**Acceptance Criteria**:
1. "Kalender verbinden" button in Profile page
2. Google OAuth consent screen opens in popup
3. Scope: `calendar.readonly` (read-only access)
4. OAuth tokens stored encrypted in InstantDB
5. Success message: "Google Calendar verbunden ✓"

**Story File**: [docs/stories/epic-4.0.story-1.md](../stories/epic-4.0.story-1.md)

---

### Story 4.0.2: Calendar Sync Service
**Goal**: Fetch calendar events from Google Calendar and cache in InstantDB

**Acceptance Criteria**:
1. Background job: sync every 30 minutes per connected user
2. Fetch next 30 days of events from Google Calendar API
3. Transform events to InstantDB `calendar_events` schema
4. Upsert events (prevent duplicates by `externalId`)
5. Track last sync timestamp in `calendar_connections` table

**Story File**: [docs/stories/epic-4.0.story-2.md](../stories/epic-4.0.story-2.md)

---

### Story 4.0.3: Update CalendarCard to Use Real Data
**Goal**: CalendarCard displays real synced events instead of mock data

**Acceptance Criteria**:
1. CalendarCard fetches events from InstantDB `calendar_events` table
2. Shows today's events by default, sorted by time
3. Loading state: spinner while fetching data
4. Empty state: "Keine Termine heute" if no events
5. Error state: "Kalender nicht verbunden" with link to Profile

**Story File**: [docs/stories/epic-4.0.story-3.md](../stories/epic-4.0.story-3.md)

---

### Story 4.0.4: Calendar Management in Profile (Optional P1)
**Goal**: View and manage calendar connection in Profile page

**Acceptance Criteria**:
1. Profile shows: "Google Calendar verbunden ✓" or "Nicht verbunden"
2. Last sync time: "Zuletzt synchronisiert: vor 12 Minuten"
3. Manual sync button: "Jetzt synchronisieren"
4. Next 7 days preview of events
5. Disconnect button: removes OAuth tokens and stops syncing

**Story File**: [docs/stories/epic-4.0.story-4.md](../stories/epic-4.0.story-4.md)

---

## Dependencies

**Before Starting**:
- ✅ Google Cloud Console project created
- ✅ Google Calendar API enabled
- ✅ OAuth consent screen configured
- ✅ InstantDB schema supports new entities

**External Dependencies**:
- Google Calendar API (free tier: 1M requests/day)
- InstantDB storage for calendar cache

---

## Success Criteria

Epic 4.0 is complete when:
- ✅ Teachers can connect Google Calendar via OAuth
- ✅ Real events displayed on Home screen CalendarCard
- ✅ Background sync every 30 minutes works reliably
- ✅ Calendar sync maintains ≥99% uptime
- ✅ OAuth tokens encrypted and secure
- ✅ E2E test: Connect calendar → See events on Home

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google OAuth complexity delays implementation | MEDIUM | Use well-documented OAuth library, implement basic flow first |
| Calendar sync causes backend performance degradation | MEDIUM | Background job architecture, rate limiting, caching |
| Google Calendar API rate limits | LOW | Cache aggressively (30min TTL), respect quotas |

---

## Out of Scope

This epic explicitly does NOT include:
- ❌ Internal calendar management (create/edit/delete events in app)
- ❌ Two-way calendar sync (write back to Google Calendar)
- ❌ Multiple calendar support (only primary calendar)
- ❌ Outlook/Office 365 integration (Google only for MVP)

**Future Phase 6**: Two-way sync, internal CRUD, multi-calendar support

---

## Business Value

**Better Planning**: Teachers see real schedule data instead of mock
**Time Savings**: No manual data entry for schedule
**User Adoption**: Practical feature that adds immediate value
**Foundation**: Architecture ready for advanced calendar features in Phase 6

---

**Epic Owner**: BMad Dev Agent
**QA Reviewer**: BMad QA Agent (Quinn)
**Created**: 2025-10-17
**Last Updated**: 2025-10-17
