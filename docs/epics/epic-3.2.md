# Epic 3.2: Production Deployment

**Epic ID**: Epic 3.2
**Parent PRD**: [docs/prd.md](../prd.md)
**Timeline**: Weeks 9-12
**Status**: Not Started
**Priority**: P0 (Critical)
**Depends On**: Epic 3.0, Epic 3.1

---

## Epic Goal

Complete migration to OpenAI Agents SDK, remove LangGraph, and deploy to production with comprehensive monitoring.

---

## Epic Context

**Current State** (after Epic 3.0 + 3.1):
- OpenAI Agents SDK working in production
- Router agent classifies intents successfully
- Image creation (DALL-E) and editing (Gemini) both functional
- Dual-path support active (LangGraph + OpenAI SDK)

**Target State**:
- 100% traffic on OpenAI SDK
- LangGraph code removed from codebase
- Production monitoring and logging in place
- Cost tracking dashboard operational
- Comprehensive error handling and fallback strategies

---

## Integration Requirements

- ✅ 100% traffic on OpenAI SDK before LangGraph removal
- ✅ Monitoring and alerting in place for production issues
- ✅ Rollback plan tested and documented
- ✅ Cost tracking prevents budget overruns

---

## Stories

### Story 3.2.1: LangGraph Deprecation (Remove Old Code)
**Goal**: Remove LangGraph code from codebase to reduce complexity

**Acceptance Criteria**:
1. All LangGraph dependencies removed from package.json
2. `/api/langgraph/agents/execute` endpoint removed
3. Redis checkpoints for LangGraph cleaned up
4. Documentation updated to remove LangGraph references
5. Git branch: `remove-langgraph` merged to main

**Story File**: [docs/stories/epic-3.2.story-1.md](../stories/epic-3.2.story-1.md)

---

### Story 3.2.2: Production Monitoring + Logging
**Goal**: Comprehensive monitoring for agent executions in production

**Acceptance Criteria**:
1. OpenAI tracing dashboard configured and accessible
2. Agent execution metrics: success rate, response time, error rate
3. Alerts configured: error rate >5%, response time >20s
4. Daily reports: agent usage, costs, performance
5. Runbook documentation: how to respond to alerts

**Story File**: [docs/stories/epic-3.2.story-2.md](../stories/epic-3.2.story-2.md)

---

### Story 3.2.3: Cost Tracking Dashboard
**Goal**: Real-time visibility into AI API costs

**Acceptance Criteria**:
1. Dashboard shows: OpenAI costs, Gemini costs, total monthly costs
2. Breakdown by agent type: DALL-E vs Gemini vs GPT-4
3. Budget alerts: 80% of $70/month budget reached
4. Trend analysis: cost per user, cost per day
5. Export capability: CSV report for monthly review

**Story File**: [docs/stories/epic-3.2.story-3.md](../stories/epic-3.2.story-3.md)

---

### Story 3.2.4: Error Handling + Fallback Strategies
**Goal**: Graceful error handling when agents fail

**Acceptance Criteria**:
1. OpenAI API failure: retry 3 times, then user-friendly error
2. Gemini API failure: automatic fallback to DALL-E with notification
3. Router classification failure: ask user to clarify intent
4. Rate limit exceeded: queue request and notify user
5. Network timeout: show spinner, retry, then fail gracefully

**Story File**: [docs/stories/epic-3.2.story-4.md](../stories/epic-3.2.story-4.md)

---

### Story 3.2.5: Documentation + Handoff
**Goal**: Comprehensive documentation of the agent system

**Acceptance Criteria**:
1. Architecture documentation updated in `docs/architecture/`
2. API documentation for all agent endpoints
3. Developer guide: how to add new agent types
4. Troubleshooting guide: common issues and solutions
5. Video walkthrough: 10-minute demo of agent system

**Story File**: [docs/stories/epic-3.2.story-5.md](../stories/epic-3.2.story-5.md)

---

## Dependencies

**Before Starting**:
- ✅ Epic 3.0 complete (Foundation & Migration)
- ✅ Epic 3.1 complete (Image Agent Enhancement)
- ✅ 100% traffic on OpenAI SDK (verified for 1 week)

**External Dependencies**:
- OpenAI tracing dashboard access
- Vercel monitoring and analytics

---

## Success Criteria

Epic 3.2 is complete when:
- ✅ 100% traffic on OpenAI SDK
- ✅ LangGraph removed from codebase
- ✅ Monitoring and alerting operational
- ✅ Cost tracking dashboard live
- ✅ Error handling tested and working
- ✅ Documentation complete and accurate
- ✅ Zero P0 bugs in production

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| LangGraph removal causes unforeseen breaking changes | HIGH | Keep code for 4 weeks post-migration, monitor error rates |
| Cost tracking inaccurate or delayed | MEDIUM | Test with production data, validate against OpenAI billing |
| Monitoring overhead impacts performance | LOW | Use lightweight monitoring, async logging |

---

## Business Value

**Reduced Complexity**: 30% reduction in codebase complexity
**Better Visibility**: Real-time cost and performance monitoring
**Faster Development**: Easier to add new agent types
**Production Ready**: Enterprise-grade monitoring and error handling

---

**Epic Owner**: BMad Dev Agent
**QA Reviewer**: BMad QA Agent (Quinn)
**Created**: 2025-10-17
**Last Updated**: 2025-10-17
