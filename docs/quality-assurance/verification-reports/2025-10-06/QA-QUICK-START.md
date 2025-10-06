# QA Quick Start Guide
**For Developers: Read This First**

---

## TL;DR

**Status:** ❌ Automated tests blocked by auth infrastructure
**Workaround:** Manual testing required
**Time to Fix:** 1-2 hours (test auth) + 4-6 hours (manual testing)

---

## What Happened?

1. Created 5 Playwright E2E tests (306 lines of code) ✅
2. Tests cannot run - authentication not working in test mode ❌
3. Created manual testing guide as workaround ✅
4. Deployment NOT READY until testing complete ⚠️

---

## Quick Fix (Choose One)

### Option A: Dedicated Test Port (RECOMMENDED)

**Edit:** `teacher-assistant/frontend/playwright.config.ts`

**Change line 133:**
```typescript
// OLD:
command: 'npm run dev -- --mode test',
url: 'http://localhost:5174',
reuseExistingServer: !process.env.CI,

// NEW:
command: 'npm run dev -- --mode test --port 5175',
url: 'http://localhost:5175',
reuseExistingServer: false,
```

**Update test files:**
Replace `http://localhost:5174` with `http://localhost:5175` in all 5 test files

**Run tests:**
```bash
cd teacher-assistant/frontend
npx playwright test e2e-tests/bug-*.spec.ts --headed
```

---

### Option B: Stop Dev Server

```bash
# 1. Stop dev server on port 5174
# 2. Run tests (Playwright will auto-start test server)
cd teacher-assistant/frontend
npx playwright test e2e-tests/bug-*.spec.ts --headed
```

---

## Manual Testing (If No Time to Fix)

**Guide:** `MANUAL-QA-CHECKLIST.md`

**Prerequisites:**
- Frontend: http://localhost:5174
- Backend: http://localhost:3006
- Signed in with real account

**Tests to Run:**
1. BUG-A: Chat Summary (15 min)
2. BUG-B: Agent Cancel (10 min)
3. BUG-C: Profile Modal (10 min)
4. BUG-D: Profile Name (15 min)
5. BUG-E: Image Generation (30-45 min)

**Total Time:** ~2 hours

---

## Documents Created

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `QA-SESSION-SUMMARY-2025-10-06.md` | Executive overview | Start here |
| `MANUAL-QA-CHECKLIST.md` | Step-by-step testing | Doing manual tests |
| `QA-VERIFICATION-REPORT-2025-10-06.md` | Technical details | Debugging issues |
| `DEPLOYMENT-READINESS-ASSESSMENT-2025-10-06.md` | Deployment strategy | Before production |

---

## Test Files Created

**Location:** `teacher-assistant/frontend/e2e-tests/`

1. `bug-a-chat-summary.spec.ts` - Chat summary after 3 messages
2. `bug-b-agent-cancel.spec.ts` - Agent confirmation cancel button
3. `bug-c-modal-buttons.spec.ts` - Profile modal buttons visibility
4. `bug-d-profile-name.spec.ts` - Profile name save persistence
5. `bug-e-image-generation.spec.ts` - E2E image generation workflow

**Status:** Ready to run (once auth fixed)

---

## Critical TODOs Before Deployment

### P0 (Blocker)
- [ ] Fix test auth OR complete manual testing
- [ ] Verify `backend/src/schemas/instantdb.ts` changes compatible with frontend
- [ ] Verify BUG-002 (Material Navigation) is implemented

### P1 (Important)
- [ ] Run all 5 E2E tests (automated or manual)
- [ ] Deploy to staging first
- [ ] Monitor staging for 24 hours

### P2 (Nice to Have)
- [ ] Fix test auth infrastructure permanently
- [ ] Add CI/CD integration for E2E tests

---

## Questions?

1. **"Why can't tests run?"**
   - Test mode requires `VITE_TEST_MODE=true` environment variable
   - Current dev server uses default `.env` (not `.env.test`)
   - Tests hit "Sign In" wall immediately

2. **"Can I deploy without tests?"**
   - NOT RECOMMENDED
   - Must do manual testing first (use `MANUAL-QA-CHECKLIST.md`)
   - High risk of bugs in production

3. **"How long to fix?"**
   - Fix test auth: 1-2 hours
   - Run automated tests: 30 minutes
   - OR manual testing: 4-6 hours

4. **"What's the deployment risk?"**
   - MEDIUM risk if manual testing done properly
   - HIGH risk if no testing at all
   - See `DEPLOYMENT-READINESS-ASSESSMENT-2025-10-06.md` for details

---

## Next Steps

### If You Have 2 Hours
1. Fix test auth (Option A above)
2. Run automated E2E tests
3. Fix any failures
4. Deploy to staging

### If You Have 6 Hours
1. Use `MANUAL-QA-CHECKLIST.md`
2. Test all 5 bugs manually
3. Document results
4. Deploy to staging

### If You Have No Time
1. ❌ **DO NOT DEPLOY TO PRODUCTION**
2. Deploy to staging only
3. Schedule manual testing session
4. Deploy production after testing

---

**Created:** 2025-10-06
**Owner:** QA Team (Claude)
**Status:** Ready for developer action
