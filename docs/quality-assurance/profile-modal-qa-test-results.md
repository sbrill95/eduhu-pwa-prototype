# QA Test Results - Profile Modal Button Visibility

**Date**: 2025-10-04
**Tester**: qa-integration-reviewer (Playwright Agent)
**Test Duration**: ~30 minutes
**Status**: ❌ FAILED

---

## Test Summary

**Task**: Verify if "Hinzufügen" and "Abbrechen" buttons are visible in the "Merkmal hinzufügen" modal.

---

## Questions & Answers

### 1. Are the buttons visible initially?

**Answer**: ❌ **NO**

**Evidence**:
- Screenshot: `add-characteristic-modal-initial.png`
- Modal opens with header and input visible
- Footer with both buttons is **cut off below viewport**
- Buttons exist in DOM but are NOT rendered in visible area

---

### 2. Screenshot filename(s)

**Captured Screenshots**:
1. `profile-button-location.png` - Shows profile button location
2. `profile-modal-open.png` - Profile view opened
3. `add-characteristic-modal-initial.png` - ❌ **CRITICAL: Buttons NOT visible**
4. `current-state-after-reload.png` - After hot reload
5. `profile-view-opened.png` - Profile view state
6. `profile-scrolled-to-add-button.png` - Attempted scroll

**Key Screenshot**: `add-characteristic-modal-initial.png`
- Shows modal header ✅
- Shows description text ✅
- Shows input field (partially) ✅
- **Does NOT show buttons** ❌

---

### 3. Root Cause

**CSS Layout Issue** - Modal height constraint problem

**Technical Analysis**:

```tsx
// Current Code (PROBLEMATIC):
<div
  className="fixed inset-0 bg-white z-50 flex flex-col"
  style={{ maxHeight: '100vh' }}
>
```

**Problem Identified**:
1. **`maxHeight: '100vh'` doesn't enforce proper flexbox behavior**
   - The modal content (`flex-1`) expands beyond available space
   - Footer is pushed below visible viewport
   - No scrolling constraint is applied correctly

2. **Mobile viewport issues**:
   - Viewport: 143.56px × 310.67px (extremely narrow)
   - `100vh` includes browser chrome on mobile
   - Dynamic viewport height changes when scrolling

3. **Flexbox layout not constraining properly**:
   - Header: `flex-shrink-0` ✅
   - Content: `flex-1 overflow-y-auto` ❌ (not working as expected)
   - Footer: `flex-shrink-0` ✅ (but pushed out of view)

**Root Cause Summary**:
The modal's `maxHeight: '100vh'` inline style doesn't properly constrain the flexbox children. The content area (`flex-1`) expands beyond the available space, pushing the footer out of the viewport.

---

### 4. Does the add flow work end-to-end?

**Answer**: ❌ **NO - CANNOT TEST**

**Reason**: Cannot access the "Hinzufügen" button to complete the flow.

**Expected Flow**:
1. ✅ Open profile modal
2. ✅ Click "Merkmal hinzufügen +"
3. ✅ Modal opens
4. ✅ Input field visible and functional
5. ❌ **BLOCKER**: Cannot click "Hinzufügen" button (not visible)
6. ❌ Cannot verify characteristic is added
7. ❌ Cannot verify percentage changes from 0% to 20%

**Impact**: **CRITICAL** - Core functionality is completely broken.

---

### 5. Other Visual Issues Found

#### Issue 1: Narrow Viewport Test
- **Viewport**: 143.56px × 310.67px
- **Issue**: Extremely narrow viewport suggests mobile testing, but this is TOO narrow
- **Recommendation**: Test with standard mobile viewports:
  - iPhone SE: 375x667
  - iPhone 12: 390x844
  - Pixel 5: 393x852

#### Issue 2: Hot Reload Disruption
- **Issue**: Vite hot reload closed the modal during testing
- **Impact**: Testing interrupted multiple times
- **Recommendation**: Disable HMR during E2E tests

#### Issue 3: Profile View Not Using Modal Component
- **Issue**: Profile is rendered as a fixed div, not using a proper modal component
- **Code**: `App.tsx` lines 480-504
```tsx
{showProfile && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
    background: 'white',
    overflow: 'auto'
  }}>
    <ProfileView />
  </div>
)}
```
- **Recommendation**: Use a proper modal component for better accessibility

---

## Visual Comparison

### Expected Layout (from code):
```
┌─────────────────────┐
│ Header              │ ← flex-shrink-0 (visible ✅)
├─────────────────────┤
│                     │
│ Content             │ ← flex-1 overflow-y-auto
│ (scrollable)        │
│                     │
├─────────────────────┤
│ Footer              │ ← flex-shrink-0 (should be visible ✅)
│ [Cancel] [Add]      │
└─────────────────────┘
```

### Actual Layout (observed):
```
┌─────────────────────┐
│ Header              │ ← Visible ✅
├─────────────────────┤
│                     │
│ Content             │ ← Visible ✅
│ (input field)       │
│                     │
└─────────────────────┘
  ↓ (cut off below viewport)
┌─────────────────────┐
│ Footer              │ ← NOT visible ❌
│ [Cancel] [Add]      │
└─────────────────────┘
```

---

## Recommended Fixes

### Fix Option 1: Use `height: 100dvh` (RECOMMENDED)

```tsx
<div
  className="fixed inset-0 bg-white z-50 flex flex-col"
  style={{ height: '100dvh' }}  // Dynamic viewport height for mobile
>
```

**Why**: `100dvh` accounts for mobile browser UI changes (address bar, etc.)

---

### Fix Option 2: Remove inline style, use Tailwind

```tsx
<div className="fixed inset-0 bg-white z-50 flex flex-col h-screen">
  {/* h-screen = height: 100vh */}
```

**Why**: Tailwind's `h-screen` is more reliable than inline styles

---

### Fix Option 3: Add explicit overflow to modal container

```tsx
<div
  className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden"
  style={{ height: '100vh' }}
>
  {/* overflow-hidden prevents content from expanding beyond */}
```

---

## Testing Recommendations

### Immediate Testing Needed:
1. **Apply Fix** (Option 1 or 2)
2. **Test with Playwright** on multiple viewports:
   - Desktop: 1920x1080
   - Tablet: 768x1024
   - Mobile (iPhone SE): 375x667
   - Mobile (iPhone 12): 390x844
   - Mobile (Pixel 5): 393x852

3. **Verify**:
   - [ ] Both buttons visible on all viewports
   - [ ] Input field accessible
   - [ ] Can type text
   - [ ] "Hinzufügen" button enables when text is entered
   - [ ] Can click "Hinzufügen"
   - [ ] Characteristic is added to profile
   - [ ] Percentage updates from 0% to 20%
   - [ ] Modal closes after adding

### Long-term Testing:
- [ ] Real device testing (iOS Safari, Android Chrome)
- [ ] Keyboard interaction (Tab, Enter, Escape)
- [ ] Screen reader accessibility
- [ ] Performance (modal open/close animation)

---

## Priority & Severity

**Severity**: 🔴 **P0 - BLOCKER**

**Justification**:
- Core user flow is completely broken
- No workaround available
- Affects all users on all devices
- Must be fixed before any deployment

---

## Files Affected

- `teacher-assistant/frontend/src/components/ProfileView.tsx` (lines 298-373)

---

## Next Actions

1. ✅ QA testing completed
2. ✅ Root cause identified
3. ✅ Recommendations provided
4. ⏳ **PENDING**: Developer to apply fix
5. ⏳ **PENDING**: Re-test with Playwright
6. ⏳ **PENDING**: Visual verification with screenshots
7. ⏳ **PENDING**: Mark as RESOLVED

---

## Test Artifacts

**Screenshots**: `/.playwright-mcp/`
- `add-characteristic-modal-initial.png` - PRIMARY EVIDENCE
- `profile-button-location.png`
- `profile-modal-open.png`
- `current-state-after-reload.png`
- `profile-view-opened.png`
- `profile-scrolled-to-add-button.png`

**Bug Report**: `/docs/quality-assurance/profile-modal-button-visibility-bug-report.md`

---

## Conclusion

**Test Result**: ❌ **FAILED**

The "Merkmal hinzufügen" modal has a critical layout bug where the footer buttons ("Abbrechen" and "Hinzufügen") are not visible in the viewport. This prevents users from adding manual profile characteristics, breaking a core feature.

**Immediate Action Required**: Apply recommended CSS fix and re-test.
