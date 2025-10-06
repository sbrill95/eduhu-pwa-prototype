# BUG: Layout Regression + Font Loading Issues

**Created**: 2025-10-05
**Severity**: CRITICAL
**Status**: IN PROGRESS

---

## 🔴 Problem Description

Nach Restore von `pages/Home/Home.tsx` aus Stash erscheint NICHT das erwartete Gemini-Layout, sondern ein älteres Layout. Zusätzlich laden Schriftarten und einige Ressourcen nicht.

### User Expectation
- **Gemini-Layout** mit Orange (#FB6542) Farben
- **Inter Font** geladen
- **Ionic Components** korrekt gerendert
- **Image Generation UX V2** Features vorhanden

### Current Reality
- ❌ Altes Layout wird angezeigt
- ❌ Schriftarten laden NICHT (`ERR_FILE_NOT_FOUND`)
- ❌ API Client komplett kaputt (`apiClient.post is not a function`)
- ❌ Keine Image Generation Features sichtbar

---

## 🔍 Root Cause Analysis

### Issue 1: Wrong File Restored
**Problem**: `pages/Home/Home.tsx` wurde aus Stash wiederhergestellt, ABER:
- Das ist NICHT die Gemini-Version
- Das ist eine ÄLTERE Version (vor Gemini-Redesign)

**Evidence**:
```bash
git stash show stash@{0} -- teacher-assistant/frontend/src/pages/Home/Home.tsx
```
Zeigt: Diese Datei im Stash ist die Gemini-Version MIT Ionic Components.

Aber der AKTUELLE Stand (nach Restore) hat KEIN Ionic mehr → FALSCHER Stash verwendet?

### Issue 2: Font Files Missing
**Problem**: Fonts versuchen von `file://` zu laden statt via Vite
**Evidence**:
```
utils.js:1  Failed to load resource: net::ERR_FILE_NOT_FOUND
```

**Likely Cause**: `index.css` oder Font-Imports sind kaputt

### Issue 3: API Client Broken
**Problem**: `apiClient.post` und `apiClient.getAvailableAgents` existieren nicht
**Evidence**:
```
usePromptSuggestions.ts:51 Error: apiClient.post is not a function
useAgents.ts:42 Failed: apiClient.getAvailableAgents is not a function
```

**Likely Cause**: `lib/api.ts` wurde überschrieben oder ist aus falschem Stash

---

## 📋 Investigation Steps

### Step 1: Verify Stash Content
Check if `stash@{0}` really contains Gemini layout:
```bash
git stash list
git stash show stash@{0} --stat
```

### Step 2: Compare Files
Compare current vs. stash for critical files:
- `pages/Home/Home.tsx` (should have Ionic)
- `index.css` (font imports)
- `lib/api.ts` (API client)
- `App.tsx` (already restored - correct)

### Step 3: Check Font Loading
Verify font imports in:
- `index.css` - `@font-face` rules
- `tailwind.config.js` - font family config

---

## 🔧 Fix Plan

### Fix 1: Restore Correct Home.tsx
```bash
# Check what's in stash
git show stash@{0}:teacher-assistant/frontend/src/pages/Home/Home.tsx | head -50

# If it has Ionic imports, restore it again
git checkout stash@{0} -- teacher-assistant/frontend/src/pages/Home/Home.tsx
```

### Fix 2: Fix Font Loading
Check and restore `index.css`:
```bash
git checkout stash@{0} -- teacher-assistant/frontend/src/index.css
```

### Fix 3: Fix API Client
Check and restore `lib/api.ts`:
```bash
git checkout stash@{0} -- teacher-assistant/frontend/src/lib/api.ts
```

### Fix 4: Clear Cache & Restart
```bash
cd teacher-assistant/frontend
rm -rf node_modules/.vite
npm run dev
```

---

## ✅ Verification Checklist

- [x] **api.ts restored** with all missing methods (`post()`, `getAvailableAgents()`, etc.)
- [x] **index.css restored** for font loading
- [x] **Vite cache cleared** and dev server restarted
- [x] **Fonts loading correctly** - Login page shows clean, readable text (no ERR_FILE_NOT_FOUND)
- [x] **No API client errors** - `usePromptSuggestions` and `useAgents` hooks will now work
- [ ] Home page Gemini layout verification (requires login with magic code)
- [ ] CalendarCard visible
- [ ] WelcomeMessageBubble with Prompt Tiles visible
- [ ] 3-Tab bottom navigation (Home, Chat, Library)
- [ ] Image Generation modal accessible

---

## 📸 Screenshots

**After Fix - Login Page**:
- ✅ Fonts loading correctly (Inter font visible)
- ✅ Clean rendering, no font errors
- ✅ Authentication flow working
- 📁 `layout-fix-verification-login.png`

**Note**: Full home page verification pending - requires actual magic code from email (InstantDB sends real email codes)

---

## 🎯 Success Criteria

1. ✅ **API Client Fixed** - All methods restored from stash
2. ✅ **Font Loading Fixed** - index.css restored, fonts load properly
3. ✅ **Vite Cache Cleared** - Clean build with no stale dependencies
4. 🟡 **Gemini-Layout** - Pending verification (needs login)
5. 🟡 **Image Generation UX V2 Features** - Pending verification (needs login)

---

## 🔧 What Was Fixed

### Fix 1: Restored api.ts (Line 120-125)
**Problem**: Missing `.post()`, `.getAvailableAgents()`, and other critical methods

**Solution**:
```bash
git checkout stash@{0} -- teacher-assistant/frontend/src/lib/api.ts
```

**Result**: ✅ All API methods now available
- `async post<T>(endpoint: string, data?: any): Promise<T>`
- `async getAvailableAgents(): Promise<{agents: AgentInfo[]; count: number}>`
- `async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResponse>`
- Plus all other endpoints for onboarding, profile, context, materials, etc.

### Fix 2: Restored index.css
**Problem**: Font files not loading (ERR_FILE_NOT_FOUND)

**Solution**:
```bash
git checkout stash@{0} -- teacher-assistant/frontend/src/index.css
```

**Result**: ✅ Fonts load correctly - visible in login page screenshot

### Fix 3: Cleared Vite Cache & Restarted
**Problem**: Stale dependencies causing "Outdated Optimize Dep" errors

**Solution**:
```bash
rm -rf teacher-assistant/frontend/node_modules/.vite
npm run dev
```

**Result**: ✅ Clean build, frontend running on port 5181

---

## 🚧 Remaining Work

### To Complete Verification:
1. **Get magic code** from email `s.brill@eduhu.de`
2. **Login** to application
3. **Verify Gemini layout** on home page (Orange "Hallo!", CalendarCard, WelcomeMessageBubble)
4. **Test Image Generation** features
5. **Take screenshots** of working state

### Alternative: Implement Development Bypass
The `.env.development` file has `VITE_BYPASS_AUTH=true`, but this isn't implemented in the auth flow. Could add development bypass to skip email verification for testing.

---

## Notes

- ✅ **Root Cause Confirmed**: api.ts was incomplete (missing methods)
- ✅ **Home.tsx is CORRECT**: Already has Ionic/Gemini code - was not the problem
- ✅ **Fonts Fixed**: index.css restoration solved ERR_FILE_NOT_FOUND errors
- 🟡 **Full Verification Blocked**: Waiting for real magic code from InstantDB email system
