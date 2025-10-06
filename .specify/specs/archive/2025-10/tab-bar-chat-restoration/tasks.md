# Tab-Bar & Chat Restoration - Implementation Tasks

**Status**: `ready-to-start`
**Created**: 2025-10-03
**Related**: [spec.md](spec.md) | [plan.md](plan.md)

---

## Task Overview

**Total Tasks**: 12
**Completed**: 0
**In Progress**: 0
**Blocked**: 0

**Estimated Total Time**: 4.5 hours
**Actual Time**: TBD

---

## Task List

### Phase 1: App.tsx Tab-Bar Restoration

#### TASK-001: Update ActiveTab TypeScript Type Definition
**Status**: `todo`
**Priority**: `P0` (Critical - blocks all other tasks)
**Agent**: Frontend-Agent
**Estimate**: 15 minutes
**Actual**: _____

**Description**:
Change the `ActiveTab` type from 4 tabs to 3 tabs in `teacher-assistant/frontend/src/App.tsx`.

**Acceptance Criteria**:
- [ ] Line 44: `type ActiveTab = 'home' | 'chat' | 'library';`
- [ ] No TypeScript errors in IDE
- [ ] All switch cases updated to match new type
- [ ] No references to 'generieren', 'automatisieren', or 'profil' in ActiveTab context

**Dependencies**:
- None (foundation task)

**Implementation Notes**:
- This is a type-only change, no runtime behavior yet
- Ensure all related code (switch statements, handlers) is updated consistently
- Check for any type errors after change

**Files to Create/Modify**:
- [ ] `teacher-assistant/frontend/src/App.tsx` (Line 44)

**Tests Required**:
- [ ] TypeScript compilation succeeds
- [ ] No type errors in VSCode

**Session Log**: _____

---

#### TASK-002: Replace Tab-Bar Icons and Labels
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 30 minutes
**Actual**: _____

**Description**:
Replace the 4-tab Tab-Bar with the original 3-tab structure (Home/Chat/Library) using correct Ionic Icons.

**Acceptance Criteria**:
- [ ] Import statement includes: `homeOutline`, `chatbubbleOutline`, `folderOutline`
- [ ] Tab 1: Icon = homeOutline, Label = "Home"
- [ ] Tab 2: Icon = chatbubbleOutline, Label = "Chat"
- [ ] Tab 3: Icon = folderOutline, Label = "Library"
- [ ] Active tab color: `#FB6542` (Gemini Orange)
- [ ] Inactive tab color: `#9ca3af` (Gray)
- [ ] Remove sunnyOutline, flashOutline imports (unused)

**Dependencies**:
- Depends on: TASK-001 (ActiveTab type must be updated first)

**Implementation Notes**:
- Lines 446-551 in App.tsx need replacement
- Keep transition-colors, cursor-pointer classes
- Maintain minHeight/minWidth: 44px (iOS touch target guidelines)
- Label in German: "Bibliothek" or "Library" (check existing convention)

**Files to Create/Modify**:
- [ ] `teacher-assistant/frontend/src/App.tsx` (Lines 20-24: imports)
- [ ] `teacher-assistant/frontend/src/App.tsx` (Lines 446-551: Tab-Bar JSX)

**Tests Required**:
- [ ] Visual inspection: 3 tabs visible
- [ ] Playwright screenshot: tab-bar-3-tabs.png

**Session Log**: _____

---

#### TASK-003: Remove Profil from Tab-Bar, Add State
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 15 minutes
**Actual**: _____

**Description**:
Remove Profil from the Tab-Bar navigation and add separate state management for the Profile modal.

**Acceptance Criteria**:
- [ ] Add state: `const [showProfile, setShowProfile] = useState(false);`
- [ ] Remove `handleProfilClick` from tab handlers section
- [ ] Add new `handleProfileClick` that toggles `showProfile`
- [ ] No references to 'profil' in ActiveTab-related code

**Dependencies**:
- Depends on: TASK-001 (ActiveTab type updated)

**Implementation Notes**:
```typescript
// Add after line 72:
const [showProfile, setShowProfile] = useState(false);

// Add new handler (around line 361):
const handleProfileClick = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setShowProfile(prev => !prev);
}, []);
```

**Files to Create/Modify**:
- [ ] `teacher-assistant/frontend/src/App.tsx` (Line ~72: Add showProfile state)
- [ ] `teacher-assistant/frontend/src/App.tsx` (Line ~361: Add handleProfileClick)

**Tests Required**:
- [ ] State toggles correctly when button clicked
- [ ] No TypeScript errors

**Session Log**: _____

---

#### TASK-004: Add Floating Profil Button (Top-Right)
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 30 minutes
**Actual**: _____

**Description**:
Add a floating Profile button in the top-right corner with Gemini Orange styling and modal functionality.

**Acceptance Criteria**:
- [ ] Button position: `fixed top-4 right-4`
- [ ] Size: 48x48px (w-12 h-12)
- [ ] Background: `bg-primary` (#FB6542)
- [ ] Icon: `personOutline` (white color)
- [ ] Rounded: `rounded-full`
- [ ] Shadow: `shadow-lg`
- [ ] Z-index: 1000 (above content, below modals)
- [ ] Hover effect: `hover:scale-110 transition-transform`
- [ ] onClick triggers `handleProfileClick`

**Dependencies**:
- Depends on: TASK-003 (showProfile state exists)

**Implementation Notes**:
```typescript
{/* Floating Profile Button - Top Right */}
<button
  onClick={handleProfileClick}
  className="fixed top-4 right-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center z-[1000] shadow-lg hover:scale-110 transition-transform"
>
  <IonIcon icon={personOutline} className="text-2xl text-white" />
</button>

{/* Profile Modal/View */}
{showProfile && (
  <div className="fixed inset-0 z-[999] bg-white">
    <EnhancedProfileView onClose={() => setShowProfile(false)} />
  </div>
)}
```

Insert after `{featureFlags.ENABLE_AGENT_UI && <AgentModal />}` (around line 438)

**Files to Create/Modify**:
- [ ] `teacher-assistant/frontend/src/App.tsx` (After line 438: Add floating button + modal)

**Tests Required**:
- [ ] Button visible in top-right
- [ ] Click opens EnhancedProfileView
- [ ] Click again closes modal
- [ ] Playwright screenshot: floating-profile-button.png

**Session Log**: _____

---

#### TASK-005: Update renderActiveContent Switch Cases
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 15 minutes
**Actual**: _____

**Description**:
Update the `renderActiveContent` useMemo to handle the new 3-tab structure (home/chat/library).

**Acceptance Criteria**:
- [ ] Case 'home': renders `<Home ... />`
- [ ] Case 'chat': renders `<Chat />`
- [ ] Case 'library': renders `<Library />`
- [ ] Default case: renders `<Home ... />`
- [ ] No cases for 'generieren', 'automatisieren', 'profil'
- [ ] Remove placeholder divs for Automatisieren/Profil

**Dependencies**:
- Depends on: TASK-001 (ActiveTab type updated)

**Implementation Notes**:
Lines 367-404 need updating:
```typescript
const renderActiveContent = useMemo(() => {
  console.log(`🖼️ Rendering content for tab: ${activeTab}`);
  switch (activeTab) {
    case 'home':
      return (
        <Home
          onChatSelect={handleChatSelect}
          onTabChange={handleTabChange}
          onNavigateToChat={handleNavigateToChat}
        />
      );
    case 'chat':
      return <Chat />;
    case 'library':
      return <Library />;
    default:
      return (
        <Home
          onChatSelect={handleChatSelect}
          onTabChange={handleTabChange}
          onNavigateToChat={handleNavigateToChat}
        />
      );
  }
}, [activeTab, handleChatSelect, handleTabChange, handleNavigateToChat]);
```

**Files to Create/Modify**:
- [ ] `teacher-assistant/frontend/src/App.tsx` (Lines 367-404: renderActiveContent)

**Tests Required**:
- [ ] All 3 tabs render correct content
- [ ] No errors in console
- [ ] Tab switching works smoothly

**Session Log**: _____

---

#### TASK-006: Update Tab Click Handlers
**Status**: `todo`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent
**Estimate**: 15 minutes
**Actual**: _____

**Description**:
Update tab click handlers to match the 3-tab structure.

**Acceptance Criteria**:
- [ ] `handleHomeClick` exists (calls `handleTabChange('home')`)
- [ ] `handleChatClick` exists (calls `handleTabChange('chat')`)
- [ ] `handleLibraryClick` exists (calls `handleTabChange('library')`)
- [ ] Remove `handleGenerierenClick`, `handleAutomatisierenClick`
- [ ] All handlers use `useCallback` with `[handleTabChange]` dependency

**Dependencies**:
- Depends on: TASK-001 (ActiveTab type updated)

**Implementation Notes**:
Lines 342-364 need updating:
```typescript
const handleHomeClick = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  handleTabChange('home');
}, [handleTabChange]);

const handleChatClick = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  handleTabChange('chat');
}, [handleTabChange]);

const handleLibraryClick = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  handleTabChange('library');
}, [handleTabChange]);

// handleProfileClick is in TASK-003
```

**Files to Create/Modify**:
- [ ] `teacher-assistant/frontend/src/App.tsx` (Lines 342-364: Tab handlers)

**Tests Required**:
- [ ] All handlers work correctly
- [ ] No unnecessary re-renders

**Session Log**: _____

---

#### TASK-007: Update handleNavigateToChat to Use 'chat'
**Status**: `todo`
**Priority**: `P1` (High - affects Home navigation)
**Agent**: Frontend-Agent
**Estimate**: 5 minutes
**Actual**: _____

**Description**:
Update the `handleNavigateToChat` function to navigate to 'chat' instead of 'generieren'.

**Acceptance Criteria**:
- [ ] Line 127: `setActiveTab('chat');` (was 'generieren')
- [ ] Function still accepts optional prompt parameter
- [ ] prefilledChatPrompt state is set correctly

**Dependencies**:
- Depends on: TASK-001 (ActiveTab type updated)

**Implementation Notes**:
```typescript
const handleNavigateToChat = useCallback((prompt?: string) => {
  // Navigate to chat tab with pre-filled prompt
  if (prompt) {
    setPrefilledChatPrompt(prompt);
  }
  setActiveTab('chat'); // Changed from 'generieren'
}, []);
```

**Files to Create/Modify**:
- [ ] `teacher-assistant/frontend/src/App.tsx` (Line 127)

**Tests Required**:
- [ ] Clicking prompt tiles on Home navigates to Chat tab
- [ ] Prompt is pre-filled in Chat input

**Session Log**: _____

---

### Phase 2: ChatView.tsx Inline Styles Cleanup

#### TASK-008: Replace ChatView Inline Styles with Tailwind Classes
**Status**: `todo`
**Priority**: `P1` (High - code quality)
**Agent**: Frontend-Agent
**Estimate**: 1 hour
**Actual**: _____

**Description**:
Replace all inline `style={{...}}` attributes in ChatView.tsx with Tailwind CSS classes for consistency and maintainability.

**Acceptance Criteria**:
- [ ] Empty state wrapper: Replace inline styles with Tailwind
- [ ] Prompt suggestion cards: Use Tailwind classes
- [ ] Input area container: Use Tailwind classes
- [ ] Attach button: Use Tailwind classes
- [ ] Send button: Use Tailwind classes with conditional classes
- [ ] Floating new chat button: Use Tailwind classes
- [ ] Padding-bottom: `pb-20` (80px) for tab-bar clearance
- [ ] All Gemini colors preserved (Orange/Teal)

**Dependencies**:
- None (independent of App.tsx changes)

**Implementation Notes**:

**Section 1: Empty State (Lines 465-604)**
```typescript
// Wrapper div (line 465):
<div className="text-center py-8 flex-1">

// Prompt cards (currently IonCard, replace with button):
<button
  onClick={() => setInputValue('...')}
  className="w-full text-left p-4 bg-white border-l-4 border-primary rounded-xl shadow-sm hover:shadow-md transition-all"
>
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <IonIcon icon={bookOutline} className="text-xl text-primary" />
    </div>
    <span className="text-base font-medium text-gray-900">
      Erstelle mir einen Stundenplan für Mathematik Klasse 7
    </span>
  </div>
</button>
```

**Section 2: Input Area (Lines 954-1160)**
```typescript
// Container (line 954):
<div className="sticky bottom-0 bg-white px-4 py-4 pb-20 border-t border-gray-200">

// Attach button (lines 1039-1068):
<button
  type="button"
  onClick={() => document.getElementById('file-input')?.click()}
  disabled={loading || isUploading}
  title="Datei anhängen"
  className={`
    min-w-[44px] min-h-[44px] w-12 h-12 flex items-center justify-center
    bg-gray-100 rounded-xl border-none transition-all flex-shrink-0
    hover:bg-gray-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `}
>
  {isUploading ? (
    <IonSpinner name="crescent" className="w-5 h-5" />
  ) : (
    <IonIcon icon={attachOutline} className="text-xl text-gray-700" />
  )}
</button>

// Input field wrapper (lines 1071-1098):
<div className="flex-1 bg-gray-100 rounded-xl overflow-hidden min-w-0">

// Send button (lines 1101-1124):
<button
  type="submit"
  disabled={!inputValue.trim() || loading || inputValue.trim().length > MAX_CHAR_LIMIT}
  className={`
    min-w-[44px] min-h-[44px] w-14 h-12 flex items-center justify-center
    rounded-xl border-none shadow-sm transition-all flex-shrink-0
    ${inputValue.trim() && !loading && inputValue.trim().length <= MAX_CHAR_LIMIT
      ? 'bg-primary hover:opacity-90 cursor-pointer'
      : 'bg-gray-300 cursor-not-allowed'}
  `}
>
  <IonIcon icon={sendOutline} className="text-xl text-white" />
</button>

// Floating new chat button (lines 1166-1177):
<button
  onClick={handleNewChat}
  className="fixed z-50 w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 bg-primary bottom-[calc(80px+1rem)] right-4"
  title="Neuer Chat"
>
  <IonIcon icon={addOutline} className="text-2xl text-white" />
</button>
```

**Files to Create/Modify**:
- [ ] `teacher-assistant/frontend/src/components/ChatView.tsx` (Lines 465-604: Empty state)
- [ ] `teacher-assistant/frontend/src/components/ChatView.tsx` (Lines 954-1160: Input area)
- [ ] `teacher-assistant/frontend/src/components/ChatView.tsx` (Lines 1166-1177: Floating button)

**Tests Required**:
- [ ] All elements render correctly
- [ ] Hover states work (buttons)
- [ ] Disabled states work (buttons)
- [ ] Colors match Gemini design (Orange/Teal)
- [ ] Playwright screenshot: chat-view-cleaned.png

**Session Log**: _____

---

### Phase 3: Testing & QA

#### TASK-009: Playwright E2E Tests
**Status**: `todo`
**Priority**: `P0` (Critical - must verify changes)
**Agent**: QA-Agent or Playwright-Agent
**Estimate**: 30 minutes
**Actual**: _____

**Description**:
Create and run Playwright E2E tests to verify the 3-tab navigation and ChatView restoration.

**Acceptance Criteria**:
- [ ] Test 1: Tab-Bar has exactly 3 tabs (Home/Chat/Library)
- [ ] Test 2: No Generieren/Automatisieren tabs visible
- [ ] Test 3: Floating Profile button visible and clickable
- [ ] Test 4: Chat tab shows ChatView with Gemini styling
- [ ] Test 5: Tab switching works correctly
- [ ] All tests pass

**Dependencies**:
- Depends on: TASK-001 to TASK-008 (all implementation complete)

**Implementation Notes**:
Create `teacher-assistant/frontend/e2e-tests/tab-bar-restoration.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Tab-Bar Restoration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173'); // Adjust URL
    // Wait for app to load
    await page.waitForSelector('button:has-text("Home")');
  });

  test('should have exactly 3 tabs: Home, Chat, Library', async ({ page }) => {
    // Verify 3 tabs exist
    await expect(page.locator('button:has-text("Home")')).toBeVisible();
    await expect(page.locator('button:has-text("Chat")')).toBeVisible();
    await expect(page.locator('button:has-text("Library")').or(page.locator('button:has-text("Bibliothek")'))).toBeVisible();

    // Verify old tabs do NOT exist
    await expect(page.locator('button:has-text("Generieren")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Automatisieren")')).not.toBeVisible();
    await expect(page.locator('.tab-bar-fixed button:has-text("Profil")')).not.toBeVisible();
  });

  test('should show floating Profile button in top-right', async ({ page }) => {
    const profileButton = page.locator('.floating-profile-button, button:has(ion-icon[icon="person-outline"])').first();
    await expect(profileButton).toBeVisible();

    // Check position (should be fixed top-right)
    const box = await profileButton.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.x).toBeGreaterThan(page.viewportSize()!.width - 100); // Right side
      expect(box.y).toBeLessThan(100); // Top
    }
  });

  test('should switch to Chat tab and show ChatView', async ({ page }) => {
    await page.click('button:has-text("Chat")');

    // Wait for ChatView to render
    await expect(page.locator('text=Wollen wir loslegen').or(page.locator('text=Wollen wir starten'))).toBeVisible();

    // Verify Chat tab is active (Orange color)
    const chatTab = page.locator('button:has-text("Chat")');
    const color = await chatTab.evaluate((el) => window.getComputedStyle(el).color);
    // Orange should be rgb(251, 101, 66)
    expect(color).toContain('251, 101, 66');
  });

  test('should open Profile modal when clicking floating button', async ({ page }) => {
    const profileButton = page.locator('.floating-profile-button, button:has(ion-icon[icon="person-outline"])').first();
    await profileButton.click();

    // Verify EnhancedProfileView is visible
    await expect(page.locator('text=Profil').or(page.locator('text=Einstellungen'))).toBeVisible();
  });

  test('Tab-Bar should have correct Gemini styling', async ({ page }) => {
    const tabBar = page.locator('.tab-bar-fixed');
    await expect(tabBar).toBeVisible();

    // Check fixed position
    const position = await tabBar.evaluate((el) => window.getComputedStyle(el).position);
    expect(position).toBe('fixed');

    // Check bottom position
    const bottom = await tabBar.evaluate((el) => window.getComputedStyle(el).bottom);
    expect(bottom).toBe('0px');
  });
});
```

**Files to Create/Modify**:
- [ ] `teacher-assistant/frontend/e2e-tests/tab-bar-restoration.spec.ts` (Create new file)

**Tests Required**:
- [ ] Run: `npm run test:e2e`
- [ ] All 5 tests pass

**Session Log**: _____

---

#### TASK-010: Visual Verification Screenshots
**Status**: `todo`
**Priority**: `P0` (Critical - visual regression check)
**Agent**: QA-Agent or Playwright-Agent
**Estimate**: 15 minutes
**Actual**: _____

**Description**:
Take Playwright screenshots to visually verify the Tab-Bar and ChatView restoration matches the Gemini design.

**Acceptance Criteria**:
- [ ] Screenshot 1: `tab-bar-3-tabs-home.png` (Home tab active)
- [ ] Screenshot 2: `tab-bar-3-tabs-chat.png` (Chat tab active)
- [ ] Screenshot 3: `tab-bar-3-tabs-library.png` (Library tab active)
- [ ] Screenshot 4: `floating-profile-button.png` (showing top-right button)
- [ ] Screenshot 5: `chat-view-gemini-restored.png` (ChatView with clean Tailwind)
- [ ] All screenshots show Orange active state (#FB6542)
- [ ] No visual regressions (compare to Gemini mockup)

**Dependencies**:
- Depends on: TASK-009 (E2E tests passing)

**Implementation Notes**:
Add to Playwright test:
```typescript
test('Visual verification screenshots', async ({ page }) => {
  // Screenshot 1: Home tab
  await page.click('button:has-text("Home")');
  await page.screenshot({ path: 'screenshots/tab-bar-3-tabs-home.png', fullPage: true });

  // Screenshot 2: Chat tab
  await page.click('button:has-text("Chat")');
  await page.screenshot({ path: 'screenshots/tab-bar-3-tabs-chat.png', fullPage: true });

  // Screenshot 3: Library tab
  await page.click('button:has-text("Library")');
  await page.screenshot({ path: 'screenshots/tab-bar-3-tabs-library.png', fullPage: true });

  // Screenshot 4: Profile button
  await page.screenshot({ path: 'screenshots/floating-profile-button.png' });

  // Screenshot 5: ChatView detail
  await page.click('button:has-text("Chat")');
  const chatView = page.locator('.chat-view, [class*="ChatView"]');
  await chatView.screenshot({ path: 'screenshots/chat-view-gemini-restored.png' });
});
```

**Files to Create/Modify**:
- [ ] Add screenshot test to `tab-bar-restoration.spec.ts`

**Tests Required**:
- [ ] Screenshots generated in `screenshots/` folder
- [ ] Manual visual inspection vs. Gemini mockup

**Session Log**: _____

---

#### TASK-011: Manual Testing (Mobile + Desktop)
**Status**: `todo`
**Priority**: `P1` (High - user experience verification)
**Agent**: QA-Agent
**Estimate**: 15 minutes
**Actual**: _____

**Description**:
Perform manual testing on Chrome Desktop and Mobile Safari to ensure responsive design and functionality.

**Acceptance Criteria**:
- [ ] Desktop Chrome: All 3 tabs visible and clickable
- [ ] Desktop Chrome: Floating Profile button visible and functional
- [ ] Desktop Chrome: ChatView renders correctly with Gemini colors
- [ ] Mobile Safari (iOS): Tab-Bar not covered by home indicator
- [ ] Mobile Safari (iOS): Touch targets are at least 44x44px
- [ ] Mobile Safari (iOS): Scrolling works correctly in ChatView
- [ ] No console errors on either platform

**Dependencies**:
- Depends on: TASK-009, TASK-010 (automated tests complete)

**Implementation Notes**:
**Testing Checklist**:
1. Open app in Chrome Desktop
   - [ ] Click all 3 tabs → Content switches correctly
   - [ ] Click Profile button → Modal opens
   - [ ] Chat tab → Type message → Send works
   - [ ] Hover over buttons → Hover states visible

2. Open app in Mobile Safari (iPhone)
   - [ ] Tab-Bar visible above home indicator
   - [ ] All touch targets easy to tap (44x44px minimum)
   - [ ] Chat scrolling works (no overlap with tab-bar)
   - [ ] Profile button easy to tap (top-right corner)

3. Check DevTools Console
   - [ ] No errors
   - [ ] No warnings (except expected ones)

**Files to Create/Modify**:
- None (manual testing only)

**Tests Required**:
- [ ] Manual checklist completed
- [ ] Screenshots of mobile view (optional)

**Session Log**: _____

---

### Phase 4: Documentation

#### TASK-012: Session Log with Before/After Screenshots
**Status**: `todo`
**Priority**: `P1` (High - documentation)
**Agent**: Frontend-Agent or QA-Agent
**Estimate**: 30 minutes
**Actual**: _____

**Description**:
Create a comprehensive session log documenting the Tab-Bar & ChatView restoration with before/after screenshots.

**Acceptance Criteria**:
- [ ] Session log created in `/docs/development-logs/sessions/2025-10-03/`
- [ ] Filename: `session-01-tab-bar-chat-restoration.md`
- [ ] Before screenshots: 4-tab tab-bar, ChatView with inline styles
- [ ] After screenshots: 3-tab tab-bar, ChatView with Tailwind classes
- [ ] Summary of all changes made
- [ ] Links to SpecKit documentation
- [ ] Root-cause analysis of unauthorized changes
- [ ] Lessons learned

**Dependencies**:
- Depends on: All previous tasks (implementation + testing complete)

**Implementation Notes**:
**Session Log Template**:
```markdown
# Session 01: Tab-Bar & Chat Restoration

**Datum**: 2025-10-03
**Agent**: [Agent Name]
**Dauer**: [X hours]
**Status**: ✅ Completed
**Related SpecKit**: .specify/specs/tab-bar-chat-restoration/

---

## 🎯 Session Ziele
- Restore original 3-tab navigation (Home/Chat/Library)
- Remove unauthorized 4-tab structure (Generieren/Automatisieren/Profil)
- Replace ChatView inline styles with Tailwind classes
- Add floating Profile button (top-right)

## 🔧 Implementierungen

### App.tsx Changes
- Updated `ActiveTab` type from 4 tabs to 3 tabs
- Replaced Tab-Bar structure: 3 tabs with Gemini Orange active state
- Added floating Profile button (top-right corner)
- Updated all switch cases and handlers

### ChatView.tsx Changes
- Replaced inline styles with Tailwind classes
- Maintained Gemini colors (Orange/Teal)
- Fixed padding-bottom for tab-bar clearance (pb-20)

## 📁 Erstellte/Geänderte Dateien
- `teacher-assistant/frontend/src/App.tsx`: Tab-Bar restoration
- `teacher-assistant/frontend/src/components/ChatView.tsx`: Inline styles cleanup

## 🎨 Before/After Screenshots

### Before (Unauthorized Changes)
![4-tab tab-bar](./before-4-tabs.png)
![ChatView inline styles](./before-chat-inline-styles.png)

### After (Restored)
![3-tab tab-bar](./after-3-tabs.png)
![ChatView Tailwind classes](./after-chat-tailwind.png)

## 🧪 Tests
- Playwright E2E tests: All passing ✅
- Visual regression: Matches Gemini mockup ✅
- Manual testing: Desktop + Mobile Safari ✅

## 🔍 Root-Cause Analysis
**Why did unauthorized changes happen?**
1. No SpecKit documentation existed for Tab-Bar changes
2. "Gemini Polish" sessions went beyond approved scope
3. Inline styles used for quick prototyping, not cleaned up

**Prevention**:
- Always create SpecKit documentation BEFORE coding
- Stick to approved spec (Phase 3.1: Visual Redesign only)
- Use Tailwind classes from the start (no inline prototyping)

## 🎯 Nächste Schritte
- Continue with Phase 3.2: Framer Motion animations (if approved)
- Monitor user feedback on 3-tab navigation
- Ensure all future changes have SpecKit documentation first

---

## 📊 Lessons Learned
1. **SpecKit is mandatory** - No shortcuts, even for "quick polishes"
2. **Tailwind > Inline styles** - Always use Tailwind from the start
3. **Visual verification is critical** - Always screenshot before/after
4. **Gemini Design is approved** - Keep the colors, fix the structure
```

**Files to Create/Modify**:
- [ ] `/docs/development-logs/sessions/2025-10-03/session-01-tab-bar-chat-restoration.md`
- [ ] Add before/after screenshots to session folder

**Tests Required**:
- [ ] Session log is complete and accurate
- [ ] Screenshots are clear and informative

**Session Log**: (This task creates the log itself)

---

## Task Dependencies Graph

```
TASK-001 (ActiveTab type)
    ├─▶ TASK-002 (Tab-Bar icons)
    ├─▶ TASK-003 (Profil state)
    ├─▶ TASK-005 (renderActiveContent)
    ├─▶ TASK-006 (Tab handlers)
    └─▶ TASK-007 (handleNavigateToChat)
            │
            └─▶ TASK-004 (Floating Profil button)

TASK-008 (ChatView cleanup) ◀─ Independent

TASK-001 to TASK-008 ─▶ TASK-009 (Playwright tests)
                              │
                              └─▶ TASK-010 (Screenshots)
                                      │
                                      └─▶ TASK-011 (Manual testing)
                                              │
                                              └─▶ TASK-012 (Session log)
```

---

## Progress Tracking

### Sprint 1 (2025-10-03) - Implementation
**Goal**: Complete all 12 tasks

**Tasks**:
- [ ] TASK-001: Update ActiveTab type (15 min)
- [ ] TASK-002: Replace Tab-Bar icons (30 min)
- [ ] TASK-003: Add Profil state (15 min)
- [ ] TASK-004: Floating Profil button (30 min)
- [ ] TASK-005: Update renderActiveContent (15 min)
- [ ] TASK-006: Update tab handlers (15 min)
- [ ] TASK-007: Fix handleNavigateToChat (5 min)
- [ ] TASK-008: ChatView inline styles cleanup (1 hour)
- [ ] TASK-009: Playwright E2E tests (30 min)
- [ ] TASK-010: Visual verification screenshots (15 min)
- [ ] TASK-011: Manual testing (15 min)
- [ ] TASK-012: Session log (30 min)

**Status**: Not Started
**Notes**: Ready to begin implementation

---

## Blockers & Issues

### Active Blockers
None - all tasks are ready to start

### Resolved Blockers
None

---

## Risk Management

### Current Risks
| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|-----------|-------|
| Inline styles conflict with Tailwind | Medium | Low | Use !important if needed | Frontend-Agent |
| Tab switching breaks existing flow | High | Low | Thorough E2E testing | QA-Agent |
| Mobile Safari rendering issues | Medium | Low | Manual testing on real device | QA-Agent |

---

## Communication Log

### Status Updates
| Date | Update | Author |
|------|--------|--------|
| 2025-10-03 | SpecKit documentation created | QA-Integration-Reviewer |
| 2025-10-03 | Tasks ready for implementation | QA-Integration-Reviewer |

### Decisions Made
| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2025-10-03 | Profil as floating button | Keeps 3-tab structure clean | Slight UX change, but accessible |
| 2025-10-03 | Use Tailwind exclusively | Maintainability and consistency | Cleaner codebase |

---

## Completion Checklist

### Before Deployment
- [ ] All P0 tasks completed (TASK-001 to TASK-007, TASK-009)
- [ ] All P1 tasks completed (TASK-008, TASK-010, TASK-011, TASK-012)
- [ ] All Playwright tests passing
- [ ] Visual verification complete (screenshots match Gemini mockup)
- [ ] No console errors or warnings
- [ ] Manual testing on Chrome Desktop + Mobile Safari
- [ ] Session log created with before/after screenshots

### Post-Deployment
- [ ] Monitor for user feedback on 3-tab navigation
- [ ] Check for any CSS regression issues
- [ ] Verify performance (no slowdowns from Tailwind classes)
- [ ] Update master-todo.md with next priorities

---

## Retrospective

### What Went Well
- _TBD after completion_

### What Could Be Improved
- _TBD after completion_

### Lessons Learned
1. **Always create SpecKit documentation BEFORE coding**
2. **Stick to approved specifications** (Phase 3.1 scope)
3. **Use Tailwind classes from the start** (no inline prototyping)
4. **Visual verification is mandatory** (Playwright screenshots)

### Action Items for Next Feature
- [ ] Ensure SpecKit exists before any coding session
- [ ] Review spec during implementation to stay on track
- [ ] Take screenshots immediately after changes

---

## Related Documentation

- [Specification](spec.md)
- [Technical Plan](plan.md)
- [Visual Redesign Gemini Spec](../visual-redesign-gemini/spec.md)
- [Session Logs](../../../docs/development-logs/sessions/2025-10-03/)
- [Bug Tracking](../../../docs/quality-assurance/bug-tracking.md)

---

**Last Updated**: 2025-10-03
**Maintained By**: QA-Integration-Reviewer Agent
