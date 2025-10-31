# SM Risk Mitigation Plan for Story 3.0.5

**Date:** 2025-10-20
**Story:** Epic 3.0 Story 5 - E2E Tests for Router + Basic Image Agent
**Risk Level:** MEDIUM-HIGH (3 HIGH risks identified)
**Recommendation:** SPLIT STORY into 2 parts

---

## Executive Decision

Based on QA's risk assessment identifying **3 HIGH-SEVERITY RISKS (score 9 each)**, I recommend:

### 🔴 SPLIT Story 3.0.5 into Two Stories

#### Story 3.0.5a: Test Infrastructure & Isolated Router Tests
- **Duration:** 3-4 days
- **Risk Level:** MEDIUM (isolated, controlled scope)
- **Focus:** Foundation, utilities, stability proof

#### Story 3.0.5b: Integration & E2E Workflow Tests
- **Duration:** 4-5 days
- **Risk Level:** MEDIUM (with 5a foundation in place)
- **Focus:** Full integration, all acceptance criteria

---

## Risk Mitigation Strategy

### HIGH RISK #1: Test Flakiness (Score 9)
**Mitigation Approach:**
1. **Day 1-2:** Build robust wait/retry utilities FIRST
2. **Day 3:** Implement with exponential backoff
3. **Day 4:** Validate <2% flakiness over 10 runs

**Required Utilities (MANDATORY before tests):**
```typescript
// wait-helpers.ts
- waitForRouterResponse()
- waitForAgentReady()
- waitForImageGeneration()

// retry-helpers.ts
- retryWithBackoff()
- retryUntilStable()

// mock-sdk.ts
- mockRouterResponse()
- mockAgentResponse()
```

### HIGH RISK #2: Breaking Existing Tests (Score 9)
**Mitigation Approach:**
1. Complete isolation from existing test suite
2. Separate test database with prefix
3. Different port for test server (5174)
4. Feature flag: ENABLE_SDK_TESTS=false

**Isolation Checklist:**
- [ ] Separate directory: `e2e-tests/sdk-migration/`
- [ ] Independent test database
- [ ] Isolated test server instance
- [ ] No shared fixtures with existing tests

### HIGH RISK #3: Migration Side Effects (Score 9)
**Mitigation Approach:**
1. Dual-path comparison testing
2. Run same scenario through both systems
3. Validate output consistency
4. Maintain rollback test suite

---

## Implementation Timeline

### Week 1 - Story 5a (Foundation)
**Monday-Tuesday: Infrastructure**
- Setup isolated test environment
- Create mock OpenAI SDK layer
- Implement wait/retry utilities

**Wednesday-Thursday: Router Tests Only**
- Implement classification tests (AC1 only)
- Stability validation (10 consecutive runs)
- Measure and optimize performance

**Friday: Validation**
- Verify <2% flakiness achieved
- Confirm zero impact on existing tests
- Document patterns and learnings

### Week 2 - Story 5b (Integration)
**Monday-Tuesday: Gradual Integration**
- Add workflow tests one at a time
- Monitor impact on existing suite
- Performance benchmarking

**Wednesday-Thursday: Complete Suite**
- Implement remaining ACs (2-6)
- Screenshot automation
- Error handling tests

**Friday: Final Validation**
- Full regression test
- Performance validation (<5 min)
- Documentation completion

---

## Quality Gates

### Story 5a Completion Criteria
- ✅ Test utilities implemented and tested
- ✅ <2% flaky test rate (10 runs)
- ✅ Zero impact on existing tests
- ✅ Router tests 100% passing
- ✅ Execution time <1 minute

### Story 5b Completion Criteria
- ✅ All 6 ACs implemented
- ✅ <5% performance impact on suite
- ✅ Screenshots automated
- ✅ Total execution <5 minutes
- ✅ Integration verified

---

## Go/No-Go Decision Points

### Checkpoint 1: After Story 4
- **GO** if Story 4 E2E tests stable
- **NO-GO** if Story 4 has unresolved issues
- **Action:** Fix Story 4 first

### Checkpoint 2: After Story 5a
- **GO** if <2% flakiness achieved
- **NO-GO** if tests still flaky
- **Action:** Refactor utilities, add retries

### Checkpoint 3: Before Story 5b Integration
- **GO** if existing tests still pass
- **NO-GO** if any regression detected
- **Action:** Investigate and fix isolation

---

## Risk Monitoring Dashboard

```markdown
| Metric | Target | Current | Status |
|--------|--------|---------|---------|
| Test Flakiness | <2% | TBD | 🔴 |
| Execution Time | <5min | TBD | 🔴 |
| Existing Test Impact | 0% | TBD | 🔴 |
| Router Test Coverage | 100% | TBD | 🔴 |
| SDK Mock Stability | 100% | TBD | 🔴 |
```

---

## Team Assignments

**Story 5a Lead:** Dev Agent
- Focus: Infrastructure and utilities
- Support: QA for stability validation

**Story 5b Lead:** Dev Agent
- Focus: Integration and workflows
- Support: QA for regression testing

**Continuous Monitoring:** QA Agent (Quinn)
- Daily flakiness reports
- Performance tracking
- Risk reassessment

---

## Success Metrics

**Week 1 Success:**
- Risk reduced from HIGH to MEDIUM
- Foundation proven stable
- Zero production impact

**Week 2 Success:**
- Risk reduced from MEDIUM to LOW
- Full test suite integrated
- Ready for production rollout

---

## Conclusion

By splitting the story and focusing on stability first, we can:
1. Reduce risk from HIGH to manageable levels
2. Prevent impact on existing tests
3. Build confidence before integration
4. Maintain ability to rollback

**Recommendation:** Proceed with Story 5a after Story 4 completion, using this mitigation plan.

---

**Approved By:** SM (Scrum Master)
**Date:** 2025-10-20
**Next Review:** After Story 5a completion