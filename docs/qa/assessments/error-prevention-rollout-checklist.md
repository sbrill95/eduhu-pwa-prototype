# Error Prevention System: Rollout Checklist

**System**: Comprehensive Error Prevention System
**Date Created**: 2025-10-23
**Status**: 🔴 PRE-ROLLOUT (awaiting critical fix)

---

## Phase 0: CRITICAL FIX ✅ (MUST DO FIRST)

**Estimated Time**: 5-10 minutes
**Blocking**: YES - cannot proceed without this

- [ ] **Fix TypeScript error in health.ts**
  - File: `teacher-assistant/backend/src/routes/health.ts`
  - Line 44: Change `config.INSTANT_APP_ID` → `config.INSTANTDB_APP_ID`
  - Details: See `error-prevention-CRITICAL-FIX-NEEDED.md`

- [ ] **Verify backend builds**
  ```bash
  cd teacher-assistant/backend
  npm run build
  # Expected: 0 errors
  ```

- [ ] **Test health endpoint**
  ```bash
  npm start
  curl http://localhost:3006/api/health
  # Expected: Valid JSON with "instantdb" field
  ```

**Exit Criteria**: Backend builds successfully + health endpoint returns valid JSON.

---

## Phase 1: HIGH RISK MITIGATION ⚠️ (RECOMMENDED BEFORE TEAM ROLLOUT)

**Estimated Time**: 1-2 hours
**Blocking**: NO, but strongly recommended

### 1. Windows Compatibility (15 minutes)

- [ ] **Add Git Bash requirement to CLAUDE.md**
  - Section: "Error Prevention System"
  - Note: "WINDOWS USERS: Run scripts in Git Bash (NOT cmd.exe)"
  - Link to Git for Windows: https://git-scm.com/download/win

- [ ] **Test scripts on Windows machine**
  ```bash
  # In Git Bash (NOT cmd.exe)
  bash scripts/pre-test-checklist.sh
  bash scripts/kill-backend.sh
  bash scripts/restart-backend.sh
  ```

- [ ] **Document any Windows-specific issues found**

### 2. Test Helper Backend Endpoints (30-45 minutes)

- [ ] **Check if test-helpers endpoint exists**
  ```bash
  grep -r "test-helpers" teacher-assistant/backend/src/routes/
  # OR check if file exists:
  ls teacher-assistant/backend/src/routes/testHelpers.ts
  ```

- [ ] **If missing, create endpoint** (see risk assessment for code template)
  - Create: `teacher-assistant/backend/src/routes/testHelpers.ts`
  - Register in: `teacher-assistant/backend/src/routes/index.ts`
  - Implement:
    - POST `/test-helpers/create-test-image`
    - POST `/test-helpers/create-test-chat`
    - GET `/test-helpers/verify-test-data`
    - DELETE `/test-helpers/cleanup/:type/:id`

- [ ] **Test endpoint with curl**
  ```bash
  curl -X POST http://localhost:3006/api/test-helpers/create-test-image \
    -H "Content-Type: application/json" \
    -d '{"userId":"test-123","name":"Test Image"}'
  # Expected: 200 OK with image data
  ```

### 3. Test Import Pattern Documentation (15 minutes)

- [ ] **Add section to CLAUDE.md**: "Auth Bypass Pattern (Updated 2025-10-23)"
  - NEW tests: Use `./fixtures/authBypass`
  - EXISTING tests: Keep current pattern (don't migrate unless fixing)
  - Document coexistence strategy

- [ ] **Add deprecation warning to old pattern** (optional)

### 4. Pre-Flight Check Improvements (30 minutes)

- [ ] **Add time-based version check logic**
  - Skip version check if backend started < 5 minutes ago
  - Prevents false positive on local development

- [ ] **Improve InstantDB connection check**
  - Actually try to connect, not just check config
  - Return detailed error if connection fails

- [ ] **Add retry logic to port check**
  - Retry 5 times with 1-second delay
  - Prevents race condition false positives

- [ ] **Fix VITE_TEST_MODE check**
  - Check value is "true", not just that variable exists

**Exit Criteria**: All HIGH risks mitigated OR documented workarounds in place.

---

## Phase 2: SELF-TESTING 🧪 (1 day)

**Estimated Time**: 1 day
**Blocking**: NO, but required for confidence

- [ ] **Run pre-flight check script**
  ```bash
  bash scripts/pre-test-checklist.sh
  # Should: PASS all checks
  ```

- [ ] **Test backend restart workflow**
  ```bash
  # Make code change
  bash scripts/restart-backend.sh
  # Verify: Backend restarts with latest code
  ```

- [ ] **Run full E2E test suite**
  ```bash
  bash scripts/pre-test-checklist.sh
  cd teacher-assistant/frontend
  npx playwright test
  # Should: All tests pass
  ```

- [ ] **Test kill-backend script**
  ```bash
  bash scripts/kill-backend.sh
  # Verify: All node processes killed, port 3006 free
  ```

- [ ] **Test error scenarios**
  - Backend not running → pre-flight should FAIL
  - Backend outdated → pre-flight should WARN
  - Port conflict → kill-backend should resolve

- [ ] **Document any issues found**
  - False positives
  - Script errors
  - Confusing messages

**Exit Criteria**: All scripts work on developer's machine, no critical issues.

---

## Phase 3: BETA TESTING 👥 (2-3 days)

**Estimated Time**: 2-3 days
**Blocking**: NO, but required before full rollout

- [ ] **Share with 1-2 team members**
  - Send: Risk assessment document
  - Send: Quick-start guide
  - Ask: Test on their machines

- [ ] **Collect feedback**
  - What worked?
  - What didn't work?
  - What was confusing?
  - Any Windows-specific issues?

- [ ] **Fix any blockers found**
  - Prioritize issues that prevent usage
  - Document workarounds for non-critical issues

- [ ] **Update documentation based on feedback**
  - Add FAQ section
  - Clarify confusing parts
  - Add troubleshooting guide

**Exit Criteria**: >= 2 developers successfully using system, positive feedback.

---

## Phase 4: TEAM ROLLOUT 🚀 (1 week)

**Estimated Time**: 1 week
**Blocking**: NO, this is the rollout itself

### Day 1: Announcement

- [ ] **Share with full team**
  - Slack/email announcement
  - Link to documentation
  - Link to risk assessment

- [ ] **Hold Q&A session** (optional)
  - Demo scripts
  - Answer questions
  - Address concerns

### Day 2-7: Monitor

- [ ] **Track adoption metrics**
  - How many developers using scripts?
  - How many E2E test runs use pre-flight check?

- [ ] **Track issue metrics**
  - False positive rate
  - Script failures
  - Support requests

- [ ] **Quick fixes for pain points**
  - Fix issues within 24 hours
  - Update documentation immediately

- [ ] **Celebrate wins**
  - Share success stories
  - Highlight time saved
  - Thank early adopters

**Exit Criteria**: >= 80% team adoption, < 5% false positive rate, positive feedback.

---

## Phase 5: MONITORING 📊 (Ongoing)

**Estimated Time**: Ongoing
**Blocking**: NO, continuous improvement

- [ ] **Track success metrics** (weekly)
  - Pre-flight check success rate
  - E2E test failure rate (before vs after)
  - Time spent debugging process failures
  - False positive rate
  - Team satisfaction

- [ ] **Review and improve** (monthly)
  - Analyze metrics
  - Identify improvement areas
  - Plan next iteration

- [ ] **Address medium/low risks** (as time permits)
  - Improve process detection
  - Make timeout values configurable
  - Add port-specific killing
  - Add build-time version injection

**Success Criteria**:
- 🎯 Process failure rate: < 5% (down from 80%)
- 🎯 Time debugging: < 2 hours/week (down from 38-64 hours)
- 🎯 Pre-flight adoption: > 90% of test runs
- 🎯 False positive rate: < 10%
- 🎯 Team satisfaction: > 4/5

---

## Rollback Plan 🔄

**Trigger Conditions** (abort rollout if):
- [ ] False positive rate > 30%
- [ ] Team refuses to use system
- [ ] More time spent on scripts than saved
- [ ] Critical production issue caused by system

**Rollback Steps**:

1. **Immediate revert** (5 minutes)
   ```bash
   # Keep ONLY the critical fix (health.ts)
   git checkout HEAD -- scripts/
   git checkout HEAD -- teacher-assistant/frontend/e2e-tests/fixtures/
   git checkout HEAD -- teacher-assistant/backend/src/utils/timeout.ts
   # Keep health.ts fix, revert CLAUDE.md error prevention section
   ```

2. **Notify team** (10 minutes)
   - Announce rollback
   - Explain reason
   - Thank participants

3. **Document lessons learned**
   - What went wrong?
   - What would we do differently?
   - Plan for next attempt

---

## Quick Reference Commands

### Pre-Flight Check
```bash
bash scripts/pre-test-checklist.sh
```

### Restart Backend
```bash
bash scripts/restart-backend.sh
```

### Kill Backend
```bash
bash scripts/kill-backend.sh
```

### Run E2E Tests (with pre-flight)
```bash
bash scripts/pre-test-checklist.sh && cd teacher-assistant/frontend && npx playwright test
```

---

## Status Tracking

| Phase | Status | Start Date | End Date | Notes |
|-------|--------|------------|----------|-------|
| Phase 0: Critical Fix | 🔴 NOT STARTED | | | TypeScript error in health.ts |
| Phase 1: High Risk Mitigation | ⏳ PENDING | | | Awaiting Phase 0 |
| Phase 2: Self-Testing | ⏳ PENDING | | | Awaiting Phase 1 |
| Phase 3: Beta Testing | ⏳ PENDING | | | Awaiting Phase 2 |
| Phase 4: Team Rollout | ⏳ PENDING | | | Awaiting Phase 3 |
| Phase 5: Monitoring | ⏳ PENDING | | | Continuous |

**Current Phase**: Phase 0 (Critical Fix)
**Next Action**: Fix TypeScript error in `health.ts` line 44
**Blocker**: YES - TypeScript error prevents backend build

---

**Update this checklist as you progress through phases.**
