# Agent Handoff Instructions: US5 E2E Testing

**Created**: 2025-10-15
**Purpose**: Instructions for handing off E2E test execution to a QA agent

---

## Quick Start

### What Was Created

I've prepared a complete E2E test plan for User Story 5 (Automatic Image Tagging). Everything an agent needs is documented in:

📄 **`docs/testing/E2E-TEST-PLAN-US5-COMPLETE-WORKFLOW.md`**

---

## How to Hand Off to Agent

### Option 1: Start Fresh Session with QA Agent

In a new Claude Code session, say:

```
Please execute the E2E test plan located at:
docs/testing/E2E-TEST-PLAN-US5-COMPLETE-WORKFLOW.md

Execute all 7 test cases, capture screenshots, document results, and provide a comprehensive test report with final verdict (PASS/FAIL/PARTIAL).

Work autonomously - make decisions when needed, document everything, and commit all results to git when done.
```

### Option 2: Use Task Tool (Recommended)

Use the `Task` tool with `qa-integration-reviewer` agent:

```typescript
Task(
  subagent_type: "qa-integration-reviewer",
  description: "Execute US5 E2E Test Plan",
  prompt: "Execute the complete E2E test plan in docs/testing/E2E-TEST-PLAN-US5-COMPLETE-WORKFLOW.md.

  Follow all 7 test cases:
  1. Image generation triggers tagging
  2. Tags saved to InstantDB
  3. Tag-based search works
  4. Tags NOT visible in UI (privacy)
  5. Graceful degradation
  6. Performance & rate limiting
  7. Edge cases

  For each test:
  - Follow step-by-step procedures
  - Capture required screenshots
  - Document all results
  - Note any issues

  At the end:
  - Create test execution report
  - Create screenshot gallery
  - Save backend logs
  - Provide final verdict (PASS/FAIL/PARTIAL)
  - Commit all documentation

  Work autonomously and make decisions as the PM."
)
```

---

## What the Agent Will Do

### Execution Steps (Autonomous)

1. **Verify Prerequisites** (~5 min)
   - Check backend running (port 3006)
   - Check frontend running (port 5173)
   - Test Vision API directly
   - Verify OpenAI API key configured

2. **Execute 7 Test Cases** (~60 min)
   - Test Case 1: Image generation triggers tagging
   - Test Case 2: Verify tags in InstantDB
   - Test Case 3: Tag-based search
   - Test Case 4: Privacy (tags not visible)
   - Test Case 5: Error handling
   - Test Case 6: Performance & rate limits
   - Test Case 7: Edge cases

3. **Capture Evidence** (~10 min)
   - Screenshots (10+ images)
   - Backend logs
   - InstantDB query results
   - Performance metrics

4. **Create Documentation** (~20 min)
   - Test execution report
   - Screenshot gallery
   - Backend logs file
   - Final verdict document

5. **Commit Results** (~5 min)
   - Add all documentation to git
   - Commit with descriptive message

**Total Time**: ~100 minutes (1.5-2 hours)

---

## Expected Deliverables

The agent will create these files:

### 1. Test Execution Report
**Location**: `docs/testing/test-reports/2025-10-15/US5-e2e-execution-report.md`

**Contents**:
- Date, time, environment details
- All 7 test cases with PASS/FAIL status
- Screenshots embedded
- Backend log excerpts
- InstantDB query results
- Performance metrics
- Issues found (if any)

### 2. Screenshot Gallery
**Location**: `docs/testing/screenshots/2025-10-15/US5-complete-workflow/`

**Files** (10+ screenshots):
- `01-frontend-homepage.png`
- `02-chat-interface.png`
- `03-agent-confirmation.png`
- `04-backend-logs-tagging.png`
- `05-image-result.png`
- `06-instantdb-metadata.png`
- `07-library-search-tag1.png`
- `08-library-search-tag2.png`
- `09-modal-no-tags-visible.png`
- `10-rate-limit-error.png`

### 3. Backend Logs
**Location**: `docs/testing/logs/2025-10-15/backend-vision-api-logs.txt`

**Contents**:
- All Vision API calls
- Tag generation results
- Processing times
- Errors/warnings

### 4. Final Verdict
**Location**: `docs/testing/test-reports/2025-10-15/US5-VERDICT.md`

**Contents**:
- Overall result: PASS/FAIL/PARTIAL
- Test case summary (X/7 passed)
- Critical issues found
- Recommendations
- Deployment decision
- Sign-off

---

## Success Criteria

### Agent Test is PASS if:
- ✅ All 7 test cases execute successfully
- ✅ Vision API generates 5-10 German tags per image
- ✅ Tags saved to InstantDB metadata.tags
- ✅ Tag-based search works (or documented as UI not implemented)
- ✅ Tags NOT visible in UI (privacy preserved)
- ✅ Graceful degradation works (image saves even if tagging fails)
- ✅ No critical bugs found

### Agent Test is PARTIAL if:
- ✅ Vision API working
- ✅ Tags saved to database
- ⚠️ Search UI not implemented (blocked but not a failure)
- ✅ Privacy maintained
- ⚠️ Minor issues found (documented)

### Agent Test is FAIL if:
- ❌ Vision API not working
- ❌ Tags not saved to database
- ❌ Tags visible in UI (privacy violation)
- ❌ Image creation fails due to tagging
- ❌ Critical bugs block feature

---

## Prerequisites Verification

Before starting agent, ensure:

### Backend Status
```bash
# Check backend running
curl http://localhost:3006/api/health

# Test Vision API
curl -X POST http://localhost:3006/api/vision/tag-image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg", "context": {"title": "Test"}}'

# Expected: Returns JSON with tags array
```

### Frontend Status
```bash
# Check frontend accessible
curl http://localhost:5173

# Expected: Returns HTML (200 OK)
```

### Environment
- ✅ OpenAI API key configured in `teacher-assistant/backend/.env`
- ✅ Backend running on port 3006
- ✅ Frontend running on port 5173
- ✅ Browser with DevTools available
- ✅ Terminal for monitoring logs

---

## Monitoring the Agent

While the agent works, you can:

### 1. Watch Backend Logs
Open terminal and tail logs:
```bash
cd teacher-assistant/backend
npm run dev

# Look for these log patterns:
# [ImageAgent] Triggering automatic tagging
# [VisionService] Generated X tags
# [ImageAgent] ✅ Tags saved
```

### 2. Check Browser
The agent will interact with browser at:
- `http://localhost:5173` - Frontend application
- Browser DevTools - Console logs

### 3. Monitor File Creation
Watch for new files in:
- `docs/testing/test-reports/2025-10-15/`
- `docs/testing/screenshots/2025-10-15/`
- `docs/testing/logs/2025-10-15/`

---

## If Agent Gets Blocked

### Blocker: Search UI Not Implemented
**Status**: Expected (frontend search component not built yet)

**Agent should**:
- Document this as "Blocked - UI Not Implemented"
- Verify tag matching logic exists in code (review `useLibraryMaterials.ts`)
- Mark test case as "PARTIAL PASS - Logic Complete, UI Pending"
- Continue with other test cases

### Blocker: Backend Not Starting
**Agent should**:
1. Check if port 3006 is in use
2. Kill existing node processes
3. Restart backend
4. Document issue and resolution

### Blocker: Vision API Timeout
**Agent should**:
1. Check OpenAI API key validity
2. Check internet connection
3. Retry with simpler image
4. Document timeout and workaround

### Blocker: InstantDB Query Fails
**Agent should**:
1. Use InstantDB web dashboard instead
2. Screenshot the result
3. Document alternative verification method

---

## After Agent Completes

### Review Checklist

1. **Read Test Report**
   - Open `docs/testing/test-reports/2025-10-15/US5-e2e-execution-report.md`
   - Review all test results
   - Check verdict: PASS/FAIL/PARTIAL

2. **Review Screenshots**
   - Open `docs/testing/screenshots/2025-10-15/US5-complete-workflow/`
   - Verify all 10+ screenshots captured
   - Check for visual proof of functionality

3. **Review Backend Logs**
   - Open `docs/testing/logs/2025-10-15/backend-vision-api-logs.txt`
   - Verify Vision API calls logged
   - Check processing times

4. **Check Git Commit**
   - Run `git log -1` to see agent's commit
   - Verify all files committed

### Next Steps

**If PASS**:
- ✅ Feature ready for production
- ✅ Merge `003-agent-confirmation-ux` to main
- ✅ Deploy to staging/production

**If PARTIAL**:
- ⚠️ Review blockers (e.g., search UI not implemented)
- ⚠️ Decide: Deploy now or wait for UI implementation
- ⚠️ Create tickets for remaining work

**If FAIL**:
- ❌ Review critical issues in report
- ❌ Fix issues before deployment
- ❌ Re-run tests after fixes

---

## Quick Command Reference

### Start Backend
```bash
cd teacher-assistant/backend
npm run dev
```

### Start Frontend
```bash
cd teacher-assistant/frontend
npm run dev
```

### Test Vision API Directly
```bash
curl -X POST http://localhost:3006/api/vision/tag-image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/1200px-Lion_waiting_in_Namibia.jpg", "context": {"title": "Löwe", "subject": "Biologie"}}'
```

### View Agent's Files
```bash
# Test report
cat docs/testing/test-reports/2025-10-15/US5-e2e-execution-report.md

# Verdict
cat docs/testing/test-reports/2025-10-15/US5-VERDICT.md

# Screenshots
ls docs/testing/screenshots/2025-10-15/US5-complete-workflow/

# Logs
cat docs/testing/logs/2025-10-15/backend-vision-api-logs.txt
```

---

## Summary

**You have**: Complete E2E test plan ready for agent execution

**Agent will**: Execute 7 test cases, capture evidence, create comprehensive documentation

**You get**: Test report, screenshots, logs, and final verdict (PASS/FAIL/PARTIAL)

**Time**: ~1.5-2 hours of autonomous agent work

**Ready to start?** Use Option 1 or Option 2 above to hand off to agent.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-15
**Status**: Ready for Handoff
