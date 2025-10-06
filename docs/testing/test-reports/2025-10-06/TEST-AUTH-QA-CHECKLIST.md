# Test Authentication - QA Verification Checklist

## 📋 Pre-Testing Checklist

### Environment Setup
- [ ] Node.js and npm are installed
- [ ] Playwright is installed (`npm install` in frontend directory)
- [ ] Backend is running on `http://localhost:3006` (if needed for tests)
- [ ] No existing dev server running on port 5174

---

## ✅ Automated Test Verification

### Step 1: Navigate to Frontend Directory
```bash
cd C:\Users\steff\Desktop\eduhu-pwa-prototype\teacher-assistant\frontend
```

### Step 2: Run Test Auth Verification Suite
```bash
npx playwright test e2e-tests/test-auth-verification.spec.ts
```

**Expected Results:**
- ✅ All tests pass
- ✅ Console shows browser console messages
- ✅ No authentication errors
- ✅ Test completion time: ~30-60 seconds

### Step 3: Run Full Playwright Test Suite
```bash
npx playwright test
```

**Expected Results:**
- ✅ Tests run without manual login
- ✅ No magic link prompts
- ✅ Tests complete successfully
- ✅ Test report generated in `playwright-report/`

---

## 🔍 Manual Verification (Optional)

### Test Mode: Enabled

#### Step 1: Start Dev Server with Test Mode
```bash
# Windows PowerShell
$env:VITE_TEST_MODE="true"
npm run dev

# OR create .env.local temporarily
echo VITE_TEST_MODE=true > .env.local
npm run dev
```

#### Step 2: Open Browser
Navigate to: `http://localhost:5174`

#### Step 3: Verify Console Warnings
**Expected in Browser Console:**
```
🚨 TEST MODE ACTIVE 🚨
Authentication is bypassed with test user: s.brill@eduhu.de
This should NEVER be enabled in production!
```

**Checklist:**
- [ ] Red warning banner in console
- [ ] Warning mentions test user email
- [ ] Warning mentions production safety

#### Step 4: Verify Auto-Login
**Expected Behavior:**
- [ ] No login screen appears
- [ ] App loads directly to Home view
- [ ] User is authenticated automatically
- [ ] All tabs are accessible (Home, Chat, Library)

#### Step 5: Test Navigation
**Navigate through all tabs:**
- [ ] Click "Home" tab → Loads without errors
- [ ] Click "Chat" tab → Accessible without login
- [ ] Click "Library" tab → Shows library content
- [ ] Click profile button (top-right) → Profile view opens

#### Step 6: Verify Test User
**In Browser Console, run:**
```javascript
console.log('Test Mode:', import.meta.env.VITE_TEST_MODE);
```

**Expected Output:**
```
Test Mode: true
```

---

### Test Mode: Disabled (Production Simulation)

#### Step 1: Stop Dev Server
Press `Ctrl+C` in terminal

#### Step 2: Remove Test Mode
```bash
# If using environment variable, unset it
# Windows PowerShell
Remove-Item Env:VITE_TEST_MODE

# If using .env.local, delete it
rm .env.local
```

#### Step 3: Start Dev Server Normally
```bash
npm run dev
```

#### Step 4: Open Browser
Navigate to: `http://localhost:5174`

#### Step 5: Verify Normal Auth Flow
**Expected Behavior:**
- [ ] Login screen appears (or existing auth flow)
- [ ] No test mode warnings in console
- [ ] App requires authentication
- [ ] Normal InstantDB auth behavior

---

## 🔒 Security Verification

### Environment Files Check

#### `.env.development`
```bash
cat .env.development
```

**Expected:**
- [ ] `VITE_TEST_MODE=false` is present
- [ ] Test mode is explicitly disabled

#### `.env.test`
```bash
cat .env.test
```

**Expected:**
- [ ] `VITE_TEST_MODE=true` is present
- [ ] File includes security warning comment
- [ ] InstantDB App ID is correct

#### `.env.production` (if exists)
```bash
cat .env.production
```

**Expected:**
- [ ] `VITE_TEST_MODE=false` OR variable not set
- [ ] Test mode is NOT enabled

### Playwright Config Check
```bash
cat playwright.config.ts | grep -A5 "webServer"
```

**Expected:**
- [ ] `VITE_TEST_MODE: 'true'` in webServer.env
- [ ] Environment variables properly set

---

## 📊 Test Results Documentation

### Record Test Outcomes

#### Automated Tests
| Test Suite | Status | Notes |
|------------|--------|-------|
| test-auth-verification.spec.ts | ⬜ Pass / ⬜ Fail | |
| Full Playwright suite | ⬜ Pass / ⬜ Fail | |

#### Manual Verification
| Check | Status | Notes |
|-------|--------|-------|
| Console warnings appear | ⬜ Yes / ⬜ No | |
| Auto-login works | ⬜ Yes / ⬜ No | |
| All tabs accessible | ⬜ Yes / ⬜ No | |
| Test mode disabled works | ⬜ Yes / ⬜ No | |

#### Security Verification
| Check | Status | Notes |
|-------|--------|-------|
| .env.development correct | ⬜ Yes / ⬜ No | |
| .env.test correct | ⬜ Yes / ⬜ No | |
| Playwright config correct | ⬜ Yes / ⬜ No | |

---

## 🐛 Known Issues & Troubleshooting

### Issue: Login Screen Still Appears in Test Mode

**Symptoms:**
- Test mode enabled but login screen shows
- Console warnings not appearing

**Troubleshooting Steps:**
1. [ ] Verify `VITE_TEST_MODE=true` is set
   ```bash
   # In browser console
   console.log(import.meta.env.VITE_TEST_MODE)
   ```
2. [ ] Restart dev server after setting environment variable
3. [ ] Clear browser cache and localStorage
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```
4. [ ] Check browser console for errors

**Resolution:**
- Ensure environment variable is string `"true"` not boolean
- Restart dev server is critical after env changes

---

### Issue: Playwright Tests Fail with Auth Errors

**Symptoms:**
- Tests timeout waiting for elements
- Auth errors in test output
- Login screen appears in tests

**Troubleshooting Steps:**
1. [ ] Check playwright.config.ts has correct env variables
2. [ ] Set `reuseExistingServer: false` temporarily
3. [ ] Kill any existing dev servers
   ```bash
   # Windows
   netstat -ano | findstr :5174
   taskkill /PID <pid> /F
   ```
4. [ ] Run tests with visible browser
   ```bash
   npx playwright test --headed
   ```

**Resolution:**
- Playwright must start its own dev server with test env vars
- Existing servers may have wrong configuration

---

### Issue: Console Warnings Not Showing

**Symptoms:**
- Test mode enabled but no warnings
- Can't verify if test mode is active

**Troubleshooting Steps:**
1. [ ] Check browser console (not terminal)
2. [ ] Verify `warnIfTestMode()` is called in auth-context
3. [ ] Check for JavaScript errors blocking execution
4. [ ] Try hard refresh (Ctrl+Shift+R)

**Resolution:**
- Warnings appear on mount of AuthProvider
- Check React component is mounting correctly

---

## 📈 Performance Metrics

### Test Execution Time

| Metric | Expected | Actual | Notes |
|--------|----------|--------|-------|
| test-auth-verification.spec.ts | 30-60s | | |
| Full Playwright suite | 2-5min | | |
| Dev server startup | 10-30s | | |

### Test Coverage

| Feature | Covered | Status |
|---------|---------|--------|
| Auto-authentication | ✅ Yes | |
| Console warnings | ✅ Yes | |
| Protected routes | ✅ Yes | |
| Test user verification | ✅ Yes | |
| Environment detection | ✅ Yes | |
| Security checks | ✅ Yes | |

---

## ✅ Final Sign-Off

### QA Approval

- [ ] All automated tests pass
- [ ] Manual verification complete
- [ ] Security checks pass
- [ ] Documentation reviewed
- [ ] No blocking issues found

### QA Engineer: _____________________
### Date: _____________________
### Status: ⬜ Approved / ⬜ Needs Revision

### Comments/Notes:
```
[Add any observations, issues, or recommendations here]
```

---

## 📚 Reference Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| Quick Start | Fast setup guide | `TEST-AUTH-QUICK-START.md` |
| Implementation Summary | Technical details | `TEST-AUTH-IMPLEMENTATION-SUMMARY.md` |
| Complete Guide | Full documentation | `TEST-AUTH-GUIDE.md` |
| This Checklist | QA verification | `TEST-AUTH-QA-CHECKLIST.md` |

---

## 🔄 Next Steps After QA

1. **If Approved:**
   - Mark implementation as production-ready
   - Update main project documentation
   - Train team on test auth usage
   - Set up CI/CD with test mode

2. **If Issues Found:**
   - Document issues in bug tracker
   - Assign to development team
   - Re-test after fixes
   - Update checklist with lessons learned

---

**QA Checklist Version:** 1.0.0
**Last Updated:** 2025-10-05
**Created By:** Development Team
