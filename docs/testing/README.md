# Testing Documentation

**Testing Framework**: BMad Method (Comprehensive Quality Gates)
**Last Updated**: 2025-10-23
**Status**: Active Testing (Phase 3)

---

## 📋 Overview

This directory contains **test strategy, test reports, screenshots, and test artifacts** for the Teacher Assistant project.

**Testing Philosophy**: **Tests are not optional**. Every feature must have comprehensive automated tests with visual proof (screenshots).

---

## 🗂️ Directory Structure

```
testing/
├── README.md                          # This file (testing guide)
├── test-strategy.md                   # Comprehensive testing approach
├── testing-documentation.md           # Testing overview
├── agent-integration-examples.md      # Agent testing examples
├── E2E-TEST-PLAN-US5-COMPLETE-WORKFLOW.md  # E2E test plans
├── scripts/                           # Test utility scripts
│   └── README.md                     # Script documentation
├── screenshots/                       # Test screenshots (MANDATORY)
│   ├── YYYY-MM-DD/                  # Date-organized screenshots
│   │   ├── feature-before.png       # BEFORE state
│   │   ├── feature-after.png        # AFTER state
│   │   └── feature-error.png        # ERROR state
│   └── ...
├── test-reports/                      # Test execution reports
│   ├── YYYY-MM-DD/                  # Date-organized reports
│   │   ├── test-execution-report.md
│   │   └── test-results.json
│   └── ...
└── artifacts/                         # Test artifacts
    ├── test-results/                 # Playwright test results
    └── test-videos/                  # Video recordings (when needed)
```

---

## 🧪 Testing Strategy (BMad Method)

### Test Pyramid

```
┌─────────────────────────────────┐
│   E2E Tests (Playwright)        │  ← Full user workflows
│   - Real browser automation     │  ← Screenshots REQUIRED
│   - Zero console errors         │  ← STRICT enforcement
│   - Visual proof captured       │  ← Minimum 3 per feature
└─────────────────────────────────┘
         ▲
┌─────────────────────────────────┐
│  Integration Tests (Jest)       │  ← API + Database
│  - Backend endpoints            │  ← Service integration
│  - Agent workflows              │  ← Error scenarios
│  - Database operations          │  ← Data validation
└─────────────────────────────────┘
         ▲
┌─────────────────────────────────┐
│   Unit Tests (Vitest/Jest)      │  ← Component logic
│   - React components            │  ← Business logic
│   - Utility functions           │  ← Type validation
│   - Service methods             │  ← Edge cases
└─────────────────────────────────┘
```

---

## 🎯 Test Requirements (MANDATORY)

### Definition of Done - Testing

**EVERY story must have**:

✅ **Playwright E2E Tests**
- Happy path test
- Error handling test
- Edge case test
- Screenshots captured (min 3 per feature)

✅ **Unit Tests** (where applicable)
- Component tests
- Service tests
- Utility tests

✅ **Integration Tests** (where applicable)
- API endpoint tests
- Database operation tests
- Agent workflow tests

✅ **ZERO Console Errors**
- All tests scan for console output
- ANY console error = Test FAIL
- Console warnings investigated

✅ **Visual Proof**
- BEFORE screenshot (starting state)
- AFTER screenshot (completed state)
- ERROR screenshot (error handling)
- Saved to `screenshots/YYYY-MM-DD/`

---

## 📸 Screenshot Requirements

### Why Screenshots?

**Screenshots provide visual proof for the user** that:
1. Feature works correctly
2. Error handling works
3. UI looks as expected
4. No regressions occurred

### Screenshot Standards

**Minimum 3 per feature**:

1. **BEFORE** - Starting state
   ```typescript
   await page.screenshot({
     path: `docs/testing/screenshots/${date}/feature-before.png`,
     fullPage: true
   });
   ```

2. **AFTER** - Completed state
   ```typescript
   await page.screenshot({
     path: `docs/testing/screenshots/${date}/feature-after.png`,
     fullPage: true
   });
   ```

3. **ERROR** - Error handling
   ```typescript
   await page.screenshot({
     path: `docs/testing/screenshots/${date}/feature-error.png`,
     fullPage: true
   });
   ```

**Storage**: `docs/testing/screenshots/YYYY-MM-DD/`

---

## 🔧 Test Setup & Execution

### Frontend Tests (Vitest + Playwright)

```bash
cd teacher-assistant/frontend

# Unit tests
npm test                 # Run all unit tests
npm run test:ui         # Interactive UI mode
npm run test:coverage   # Generate coverage report

# E2E tests
npm run test:e2e        # Run all E2E tests
npm run test:e2e:ui     # Interactive E2E mode
npm run test:e2e:debug  # Debug mode
```

### Backend Tests (Jest)

```bash
cd teacher-assistant/backend

# Unit + Integration tests
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

### Test Mode Configuration

**CRITICAL**: All E2E tests must use TEST_MODE:

```typescript
// playwright.config.ts
use: {
  baseURL: 'http://localhost:5173',
}

// Test file
test.beforeEach(async ({ page }) => {
  // CRITICAL: Auth bypass pattern (MANDATORY!)
  await page.addInitScript(() => {
    (window as any).__VITE_TEST_MODE__ = true;
    console.log('🔧 TEST_MODE injected via Playwright addInitScript');
  });
});
```

**Why?**
- Bypasses authentication in tests
- Prevents login screen timeouts
- Enables test data isolation

---

## 🚦 Test Quality Standards

### Zero Tolerance Policies

1. **Console Errors**: ANY = FAIL
   ```typescript
   page.on('console', msg => {
     if (msg.type() === 'error') {
       console.error('CONSOLE ERROR:', msg.text());
       // Test framework will fail
     }
   });
   ```

2. **Flaky Tests**: NOT ALLOWED
   - Tests must be deterministic
   - Proper `waitForSelector()` usage
   - No `waitForTimeout()` (use explicit waits)

3. **Missing Screenshots**: FAIL
   - Minimum 3 per feature
   - Full page screenshots
   - Clear naming convention

4. **Test Coverage**:
   - P0 features: 100% coverage
   - P1 features: 90% coverage
   - P2 features: 70% coverage

---

## 📊 Test Execution Reports

### Report Structure

```markdown
# Test Execution Report - Story X.Y.Z

**Date**: YYYY-MM-DD
**Story**: Epic X.Y Story Z
**Test Type**: E2E / Integration / Unit
**Status**: PASS / FAIL

## Test Summary
- Total Tests: X
- Passed: Y
- Failed: Z
- Pass Rate: XX%

## P0 Tests (Critical)
- Test 1: ✅ PASS
- Test 2: ❌ FAIL - Reason: ...

## Screenshots
- Location: docs/testing/screenshots/YYYY-MM-DD/
- Count: X files

## Console Errors
- Count: 0 ✅ (ZERO TOLERANCE)

## Issues Found
- Issue 1: Description + Fix
- Issue 2: Description + Fix

## Quality Gate
- Decision: PASS / CONCERNS / FAIL
- Justification: ...
```

**Storage**: `test-reports/YYYY-MM-DD/`

---

## 🎭 Testing Patterns

### 1. Playwright E2E Test Pattern

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // CRITICAL: Auth bypass (MANDATORY!)
    await page.addInitScript(() => {
      (window as any).__VITE_TEST_MODE__ = true;
    });

    // Console error listener
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('CONSOLE ERROR:', msg.text());
      }
    });

    // Navigate to feature
    await page.goto('/feature-page');
  });

  test('[P0] Happy path - Feature works correctly', async ({ page }) => {
    const date = new Date().toISOString().split('T')[0];

    // BEFORE screenshot
    await page.screenshot({
      path: `docs/testing/screenshots/${date}/feature-before.png`,
      fullPage: true
    });

    // Perform action
    await page.click('[data-testid="action-button"]');
    await page.waitForSelector('[data-testid="success-message"]');

    // AFTER screenshot
    await page.screenshot({
      path: `docs/testing/screenshots/${date}/feature-after.png`,
      fullPage: true
    });

    // Assertions
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });

  test('[P1] Error handling - Shows error message', async ({ page }) => {
    // Trigger error
    await page.click('[data-testid="error-trigger"]');

    // ERROR screenshot
    await page.screenshot({
      path: `docs/testing/screenshots/${date}/feature-error.png`,
      fullPage: true
    });

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
```

---

### 2. Backend Integration Test Pattern

```typescript
import request from 'supertest';
import { app } from '../app';

describe('API Endpoint', () => {
  it('[P0] POST /api/endpoint - Success case', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'test' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });

  it('[P1] POST /api/endpoint - Error handling', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ /* invalid data */ })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });
});
```

---

## 📈 Current Test Status

### Epic 3.0 (Complete)

| Test Type | Count | Passing | Status |
|-----------|-------|---------|--------|
| **Backend Unit** | 516 | 516 (100%) | ✅ PASS |
| **E2E Tests** | 18 | 18 (100%) | ✅ PASS |
| **Console Errors** | 0 | 0 (ZERO) | ✅ PASS |
| **Screenshots** | 12+ | 12+ | ✅ PASS |

### Epic 3.1 (In Progress)

| Test Type | Count | Passing | Status |
|-----------|-------|---------|--------|
| **Backend Unit** | TBD | TBD | 🔧 In Progress |
| **E2E Tests** | 32 | 3 (9.4%) | 🔴 BLOCKED (backend issue) |
| **Console Errors** | 58+ | - | 🔴 BLOCKED |
| **Screenshots** | 15+ | 15+ | ✅ PASS |

---

## 🔍 Debugging Failed Tests

### Common Issues

1. **Navigation Timeout**
   - Check selector accuracy
   - Verify page loaded
   - Ensure TEST_MODE active

2. **Console Errors**
   - Check browser console
   - Review error messages
   - Fix root cause (not test)

3. **Screenshot Missing**
   - Verify directory exists
   - Check file permissions
   - Ensure full path correct

4. **Flaky Tests**
   - Use explicit waits
   - Check async handling
   - Verify state consistency

---

## 📚 Related Documentation

- **QA Process**: [docs/qa/README.md](../qa/README.md)
- **Architecture**: [docs/architecture.md](../architecture.md)
- **Stories**: [docs/stories/](../stories/)
- **Test Designs**: [docs/qa/assessments/](../qa/assessments/)

---

## 🔗 Useful Commands

### Quick Test Commands

```bash
# Frontend E2E (with TEST_MODE)
cd teacher-assistant/frontend
set VITE_TEST_MODE=true && npx playwright test

# Backend tests
cd teacher-assistant/backend
npm test

# Full project test
npm run test:all  # From project root
```

### Screenshot Viewing

```bash
# View latest screenshots
cd docs/testing/screenshots
ls -lt | head -20

# Open screenshot directory
start docs/testing/screenshots/$(date +%Y-%m-%d)  # Windows
open docs/testing/screenshots/$(date +%Y-%m-%d)  # Mac/Linux
```

---

## ❓ FAQ

**Q: Are tests really mandatory for every story?**
A: **YES**. No exceptions. Tests = proof that code works.

**Q: Can I skip screenshots?**
A: **NO**. Screenshots = visual proof for user and team.

**Q: What if my test is flaky?**
A: **FIX IT**. Flaky tests = FAIL quality gate. Must be deterministic.

**Q: How many tests do I need?**
A: Minimum: 1 happy path, 1 error case, 1 edge case per feature.

**Q: What about console warnings (not errors)?**
A: Investigate them. Some warnings indicate potential errors.

**Q: Can I use `waitForTimeout()`?**
A: **AVOID**. Use explicit waits (`waitForSelector()`, `waitForResponse()`).

---

**Maintained By**: BMad QA Agent (Quinn) + Development Team
**Review Schedule**: Continuous (per story)

---

**Tests are NOT optional. Tests are proof. Screenshots are visual contracts.** ✅
