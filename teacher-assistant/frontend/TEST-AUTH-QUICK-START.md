# Test Auth - Quick Start Guide

## 🚀 Quick Start (2 Minutes)

### For Playwright Tests (Automatic)

```bash
# Navigate to frontend
cd teacher-assistant/frontend

# Run tests - auth bypass is automatic!
npx playwright test
```

**That's it!** Tests will run without requiring login.

---

## 🔍 Verify It's Working

### Check #1: Run Verification Test
```bash
npx playwright test e2e-tests/test-auth-verification.spec.ts
```

**Expected:** All tests pass ✅

### Check #2: Look for Console Warnings
```bash
# Start dev with test mode
VITE_TEST_MODE=true npm run dev
```

**Expected in browser console:**
```
🚨 TEST MODE ACTIVE 🚨
Authentication is bypassed with test user: s.brill@eduhu.de
```

---

## 📋 Test User Info

| Property | Value |
|----------|-------|
| Email | `s.brill@eduhu.de` |
| User ID | `test-user-playwright-id-12345` |
| Type | Mock (no backend) |

---

## ⚙️ Environment Variables

### Playwright Tests (Automatic)
Already configured in `playwright.config.ts` via Vite mode system:
```typescript
webServer: {
  command: 'npm run dev -- --mode test',  // Loads .env.test
  // .env.test contains: VITE_TEST_MODE=true
}
```

**Note:** Vite's `--mode test` flag automatically loads `.env.test` file

### Manual Testing (Terminal)
```bash
# Windows PowerShell
$env:VITE_TEST_MODE="true"
npm run dev

# Linux/Mac
VITE_TEST_MODE=true npm run dev
```

---

## ✅ Success Checklist

- [ ] Can run Playwright tests without login
- [ ] Console shows test mode warnings
- [ ] App loads without authentication screen
- [ ] Protected routes are accessible
- [ ] Test user is authenticated automatically

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Login screen appears | Restart dev server, check `VITE_TEST_MODE=true` |
| No console warnings | Check browser console (not terminal) |
| Tests fail | Set `reuseExistingServer: false` in playwright.config |

---

## ⚠️ Security Warning

**NEVER enable test mode in production!**

Test mode bypasses all authentication. Always verify:
- `.env.production` has `VITE_TEST_MODE=false`
- Production builds don't include test mode
- Deployment configs have test mode disabled

---

## 📚 Full Documentation

For detailed information, see:
- `TEST-AUTH-GUIDE.md` - Complete user guide
- `TEST-AUTH-IMPLEMENTATION-SUMMARY.md` - Technical details

---

## 🎯 Quick Commands

```bash
# Run all tests
npx playwright test

# Run verification test
npx playwright test e2e-tests/test-auth-verification.spec.ts

# Run with visible browser
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Manual test mode
VITE_TEST_MODE=true npm run dev
```

---

**Questions?** Check `TEST-AUTH-GUIDE.md` or contact the development team.
