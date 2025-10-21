# Story: Admin-Only Cost Tracking Dashboard

**Epic:** 3.2 - Production Deployment
**Story ID:** epic-3.2.story-3
**Created:** 2025-10-20
**Status:** Not Started
**Priority:** P0 (Critical - Cost Control)
**Sprint:** Week 10-11
**Assignee:** Dev Agent

## Context

After migrating to OpenAI Agents SDK and adding Gemini integration, we need visibility into API costs to prevent budget overruns. This dashboard must be **admin-only** to protect sensitive cost information from regular users.

### Current State
- No visibility into API usage costs
- No alerts for approaching budget limits
- No way to track cost per user or agent type
- Risk of unexpected bills from OpenAI/Google

### Target State
- Admin-only dashboard with real-time cost tracking
- Budget alerts before limits reached
- Cost breakdown by service and user
- Historical trends and projections

## Problem Statement

Without cost visibility, the application could generate unexpected API bills. We need an admin-only dashboard that provides:
1. Real-time cost monitoring
2. Budget alerts
3. Usage analytics
4. Cost optimization insights

## User Story

**As an** administrator (Steffen)
**I want** a private cost tracking dashboard
**So that** I can monitor API expenses and prevent budget overruns

## Acceptance Criteria

### AC1: Admin-Only Access Control
- [ ] Dashboard accessible only at `/admin/dashboard` route
- [ ] Admin authentication required (separate from user auth)
  - Admin email hardcoded in environment variable: `ADMIN_EMAIL`
  - Only this email can access admin routes
- [ ] Non-admin users redirected to home if they try to access
- [ ] Admin login persists in separate session (24 hours)
- [ ] "Admin" badge shown in navigation when logged in as admin

### AC2: Cost Tracking Implementation
- [ ] Real-time cost calculation for each API call:
  - OpenAI GPT-4: $0.01/1K input, $0.03/1K output tokens
  - DALL-E 3: $0.04 per image (1024x1024)
  - Gemini 2.5 Flash: Free tier tracking (100/day limit)
- [ ] Costs stored in InstantDB `api_costs` table:
  ```typescript
  {
    id: string,
    timestamp: Date,
    userId: string,
    service: 'openai-gpt4' | 'dalle3' | 'gemini',
    operation: string,
    inputTokens?: number,
    outputTokens?: number,
    cost: number,
    metadata: object
  }
  ```
- [ ] Daily aggregation job calculates totals

### AC3: Dashboard UI Components
- [ ] **Overview Card**:
  - Current month total cost
  - Budget remaining ($70 - spent)
  - Days left in billing period
  - Projected month-end total
- [ ] **Service Breakdown Chart**:
  - Pie chart: OpenAI vs Gemini costs
  - Bar chart: Daily costs last 30 days
  - Table: Cost per agent type
- [ ] **User Analytics**:
  - Top 10 users by cost
  - Average cost per user
  - Cost per feature (chat, image gen, image edit)
- [ ] **Alerts Section**:
  - Red alert if >90% budget used
  - Yellow warning if >70% budget used
  - Daily limit warnings for Gemini

### AC4: Budget Management Features
- [ ] Set monthly budget (default $70, configurable)
- [ ] Email alerts to admin when thresholds reached:
  - 70% = Warning email
  - 90% = Critical email
  - 100% = Service suspension warning
- [ ] Auto-throttling when budget exceeded:
  - Disable DALL-E generation
  - Limit to Gemini free tier only
  - Show users: "Premium features temporarily unavailable"

### AC5: Export and Reporting
- [ ] Export monthly report as CSV:
  - Date, User, Service, Operation, Cost
  - Summary statistics
  - Top users report
- [ ] Monthly cost breakdown email (1st of month)
- [ ] Cost optimization suggestions:
  - "Consider moving more edits to Gemini"
  - "User X generates 30% of costs"

### AC6: Mobile Responsive Admin View
- [ ] Dashboard works on mobile (admin on the go)
- [ ] Key metrics visible without scrolling
- [ ] Touch-friendly controls
- [ ] Quick actions: Pause service, View alerts

## Technical Requirements

### Backend Implementation
```typescript
// teacher-assistant/backend/src/middleware/adminAuth.ts
export const adminAuth = async (req, res, next) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const userEmail = req.session?.user?.email;

  if (userEmail !== adminEmail) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// teacher-assistant/backend/src/services/costTrackingService.ts
export class CostTrackingService {
  trackAPICall(params: {
    userId: string,
    service: string,
    tokens?: { input: number, output: number },
    operation: string
  }): Promise<void>

  getDashboardData(timeRange: string): Promise<DashboardData>

  checkBudgetLimits(): Promise<BudgetStatus>

  sendAlertIfNeeded(): Promise<void>
}
```

### Frontend Implementation
```typescript
// teacher-assistant/frontend/src/pages/AdminDashboard.tsx
- Protected route component
- Real-time cost updates via InstantDB subscriptions
- Charts using Recharts library
- Export functionality

// teacher-assistant/frontend/src/components/admin/
- CostOverview.tsx
- ServiceBreakdown.tsx
- UserAnalytics.tsx
- BudgetAlerts.tsx
- ExportReport.tsx
```

### Database Schema
```sql
-- InstantDB Collections
api_costs: {
  id: string,
  timestamp: number,
  userId: string,
  service: string,
  operation: string,
  inputTokens?: number,
  outputTokens?: number,
  cost: number,
  metadata: object
}

budget_settings: {
  id: string,
  monthlyLimit: number,
  alertThresholds: number[],
  autoThrottle: boolean,
  adminEmail: string
}

cost_aggregations: {
  id: string,
  date: string,
  totalCost: number,
  byService: object,
  byUser: object,
  topUsers: array
}
```

## Task Breakdown

### Task 1: Admin Authentication System
- [ ] Create admin auth middleware
- [ ] Setup admin session management
- [ ] Implement admin route protection
- [ ] Add admin email to environment variables

### Task 2: Cost Tracking Infrastructure
- [ ] Create InstantDB schema for costs
- [ ] Implement CostTrackingService
- [ ] Add cost calculation for each API call
- [ ] Setup cost aggregation job

### Task 3: Admin Dashboard UI
- [ ] Create `/admin/dashboard` route
- [ ] Build dashboard layout
- [ ] Implement cost overview cards
- [ ] Add charts (Recharts integration)

### Task 4: Budget Management
- [ ] Implement budget settings
- [ ] Add threshold monitoring
- [ ] Create email alert system
- [ ] Build auto-throttling logic

### Task 5: Analytics and Reporting
- [ ] User cost analytics
- [ ] Service breakdown charts
- [ ] CSV export functionality
- [ ] Monthly report generation

### Task 6: Testing and Documentation
- [ ] E2E tests for admin auth
- [ ] Unit tests for cost calculations
- [ ] Admin guide documentation
- [ ] Budget management runbook

## Dependencies

- Recharts library for data visualization
- Email service for alerts (SendGrid/Resend)
- CSV export library
- Admin email configuration in environment

## Success Criteria

Story is complete when:
- ✅ Only admin can access dashboard
- ✅ All API calls tracked with costs
- ✅ Dashboard shows real-time data
- ✅ Budget alerts working
- ✅ Export functionality operational
- ✅ Mobile responsive design
- ✅ Zero cost tracking errors

## Definition of Done

- [ ] Admin-only access implemented and tested
- [ ] Cost tracking accurate to $0.01
- [ ] Dashboard updates in real-time
- [ ] Budget alerts tested (70%, 90%, 100%)
- [ ] CSV export works correctly
- [ ] E2E tests passing
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Deployed to production

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cost calculation errors lead to wrong data | HIGH | Extensive unit testing, validation against OpenAI billing |
| Admin access compromised | HIGH | Strong auth, rate limiting, audit logs |
| Dashboard performance with large datasets | MEDIUM | Pagination, data aggregation, caching |
| Email alerts not delivered | LOW | Multiple alert channels, dashboard notifications |

## Notes

- Admin email should be configured in environment: `ADMIN_EMAIL=steffen@example.com`
- Consider adding 2FA for admin access in future iteration
- Cost data should be retained for at least 12 months
- Dashboard should load in <2 seconds even with 1000+ records

## Open Questions for Steffen

1. **Admin Authentication**:
   - Soll ich Magic Link auch für Admin nutzen oder separates Passwort?
   - Willst du 2FA für Admin-Zugang?

2. **Budget Limits**:
   - $70/Monat fest oder soll das konfigurierbar sein?
   - Was soll passieren wenn Budget überschritten? Komplett blockieren oder nur Premium Features?

3. **Alerts**:
   - Email-Adresse für Alerts?
   - Auch Push-Notifications gewünscht?

4. **Data Retention**:
   - Wie lange sollen Cost-Daten gespeichert werden? 12 Monate?

---

**Story Owner:** Dev Agent
**Reviewed By:** QA Agent (Quinn)
**Last Updated:** 2025-10-20