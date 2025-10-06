# QA Bug Report - Profile Modal Button Visibility Issue

**Date**: 2025-10-04
**Reporter**: qa-integration-reviewer
**Severity**: HIGH
**Status**: CONFIRMED
**Component**: ProfileView - "Merkmal hinzufügen" Modal

---

## Summary

The "Hinzufügen" and "Abbrechen" buttons in the "Merkmal hinzufügen" modal are **NOT visible** in the viewport. The modal footer is cut off and appears below the visible area.

---

## Reproduction Steps

1. Navigate to http://localhost:5176
2. Click the floating orange profile button (top right)
3. Scroll down in ProfileView
4. Click "Merkmal hinzufügen +" button
5. **BUG**: The modal opens BUT the footer buttons are NOT visible

---

## Expected Behavior

The modal should display with the following layout (as defined in code):

```
┌─────────────────────────────────┐
│ Header (flex-shrink-0)          │
│ "Merkmal hinzufügen" + Close    │
├─────────────────────────────────┤
│                                 │
│ Content (flex-1, overflow-auto) │
│ - Description text              │
│ - Input field                   │
│                                 │
├─────────────────────────────────┤
│ Footer (flex-shrink-0)          │
│ [Abbrechen] [Hinzufügen]        │
└─────────────────────────────────┘
```

**BOTH buttons should be visible** at all times.

---

## Actual Behavior

![Modal with buttons cut off](/.playwright-mcp/add-characteristic-modal-initial.png)

The modal displays:
- ✅ Header is visible
- ✅ Content is visible
- ❌ **Footer with buttons is NOT visible** (cut off below viewport)

### Screenshots Evidence

1. **Modal opened (initial view)**: `add-characteristic-modal-initial.png`
   - Shows header "Merkmal hinzufügen"
   - Shows description text
   - Shows input field placeholder "z.B. Pr..." (cut off)
   - **Buttons NOT visible**

---

## Root Cause Analysis

### Code Analysis

**File**: `teacher-assistant/frontend/src/components/ProfileView.tsx`
**Lines**: 298-373

```tsx
{/* Add Tag Modal - Fullscreen */}
{showAddModal && (
  <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ maxHeight: '100vh' }}>
    {/* Header */}
    <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between flex-shrink-0">
      <h3 className="text-xl font-semibold text-gray-900">Merkmal hinzufügen</h3>
      <button onClick={() => { setShowAddModal(false); setNewTag(''); }} ... >
        <IonIcon icon={close} style={{ fontSize: '24px' }} />
      </button>
    </div>

    {/* Content */}
    <div className="flex-1 p-6 overflow-y-auto">
      <p className="text-sm text-gray-600 mb-4">...</p>
      <input type="text" ... />
    </div>

    {/* Footer with Actions */}
    <div className="bg-white border-t border-gray-200 p-4 flex gap-3 flex-shrink-0">
      <button>Abbrechen</button>
      <button>Hinzufügen</button>
    </div>
  </div>
)}
```

### Issue Identified

**Problem**: The modal uses `maxHeight: '100vh'` inline style, but this may not work correctly in all viewport scenarios, especially on mobile devices where:
1. The viewport height (`100vh`) includes the browser's address bar
2. When scrolling, the address bar hides, changing the actual viewport height
3. The flexbox layout doesn't recalculate properly

**Additional Issues**:
- The modal content area (`flex-1`) may be expanding beyond the available space
- The `overflow-y-auto` on content might not be triggering correctly
- Mobile browsers have issues with `100vh` (iOS Safari specifically)

---

## Browser/Device Information

- **Browser**: Playwright (Chromium-based)
- **Viewport Size**: 143.56px × 310.67px (extremely narrow - testing mobile view)
- **OS**: Windows

**Note**: The narrow viewport (143.56px width) suggests the issue is more severe on mobile-sized screens.

---

## Accessibility Snapshot Confirmed

From Playwright snapshot, the modal structure exists in DOM:
```yaml
- generic [ref=e246]:
  - generic [ref=e247]:  # Header
    - heading "Merkmal hinzufügen" [level=3]
    - button "Schließen"
  - generic [ref=e254]:  # Content
    - paragraph [description text]
    - textbox "z.B. Projektbasiertes Lernen" [active]
  - generic [ref=e257]:  # Footer
    - button "Abbrechen"
    - button "Hinzufügen" [disabled]
```

**Footer IS in DOM but NOT in viewport** ✅ Confirmed

---

## Impact Assessment

### User Impact: **HIGH**
- Users **CANNOT add manual characteristics** to their profile
- Core functionality is broken
- No workaround available (buttons are completely inaccessible)

### Affected Users:
- ✅ Mobile users (primary target)
- ✅ Desktop users in narrow viewports
- ✅ All browsers

---

## Recommended Fix

### Solution 1: Use `height: 100vh` instead of `maxHeight`

```tsx
<div
  className="fixed inset-0 bg-white z-50 flex flex-col"
  style={{ height: '100vh' }}  // Changed from maxHeight
>
```

### Solution 2: Use CSS `height: 100%` with parent constraint

```tsx
<div
  className="fixed inset-0 bg-white z-50 flex flex-col h-full"
>
```

### Solution 3 (RECOMMENDED): Use `min-h-screen` with proper flex layout

```tsx
<div
  className="fixed inset-0 bg-white z-50 flex flex-col min-h-screen"
>
  {/* Header - flex-shrink-0 */}
  <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-4 ...">
    ...
  </div>

  {/* Content - flex-1 with overflow */}
  <div className="flex-1 overflow-y-auto p-6">
    ...
  </div>

  {/* Footer - flex-shrink-0 with safe-area padding for mobile */}
  <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 pb-safe ...">
    ...
  </div>
</div>
```

### Solution 4: Add explicit height calculation

```tsx
<div
  className="fixed inset-0 bg-white z-50 flex flex-col"
  style={{ height: '100dvh' }}  // Use dvh (dynamic viewport height) for mobile
>
```

---

## Testing Checklist

After fix is applied:

- [ ] Test on Chrome Desktop (1920x1080)
- [ ] Test on Chrome Mobile (375x667 - iPhone SE)
- [ ] Test on Chrome Mobile (393x852 - Pixel 5)
- [ ] Test on Safari iOS (real device)
- [ ] Test with keyboard open (input focused)
- [ ] Verify buttons are ALWAYS visible
- [ ] Verify scrolling works in content area
- [ ] Verify modal closes correctly

---

## Additional Notes

### Design System Compliance
- ✅ Modal uses Gemini colors (white background, orange button)
- ✅ Border radius is correct (`rounded-xl`)
- ✅ Spacing is correct (`p-4`, `gap-3`)

### Mobile-First Considerations
- The modal should use `100dvh` (dynamic viewport height) for better mobile support
- Consider adding `pb-safe` (safe-area-inset-bottom) for iOS notch devices
- Test with mobile keyboard open

---

## Priority: P0 - BLOCKER

This bug prevents a core user flow (adding profile characteristics manually). Must be fixed before deployment.

---

## Related Files

- `teacher-assistant/frontend/src/components/ProfileView.tsx` (lines 298-373)
- Design Reference: `.specify/specs/visual-redesign-gemini/`

---

## Next Steps

1. Apply recommended fix (Solution 3 or 4)
2. Test on all mobile viewports
3. Verify with Playwright screenshot comparison
4. Mark as RESOLVED after visual verification
