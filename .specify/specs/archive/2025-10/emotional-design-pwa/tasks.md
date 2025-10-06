# Tasks: Emotional Design & PWA Implementation

**Feature ID**: `emotional-design-pwa`
**Status**: Ready for Implementation
**Related Files**: `spec.md`, `plan.md`
**Timeline**: 6 days (Phase 3.2: 3 days, Phase 3.3: 3 days)
**Assigned Agents**: `emotional-design-specialist` (lead), `react-frontend-developer` (implementation)

---

## 🎯 Phase 3.2: Micro-Interactions & Animations (Days 1-3)

### Day 1 - Core Feedback Systems

#### TASK 3.2.1: Button Feedback & Haptic Implementation
**Priority**: P0 - Critical
**Estimated Time**: 3 hours
**Agent**: `react-frontend-developer`

**Subtasks**:
- [ ] **T1.1** Create `hooks/useHaptic.ts` with vibration API integration
  - Implement `tap()` (10ms vibration)
  - Implement `success()` ([50, 50, 100] pattern)
  - Implement `error()` ([100, 50, 100, 50, 100] pattern)
  - Add feature detection and silent fallback

- [ ] **T1.2** Create `components/TapButton.tsx` with Framer Motion
  - Add `whileTap={{ scale: 0.95 }}` animation
  - Add `transition={{ duration: 0.1 }}` for instant feedback
  - Integrate `useHaptic` hook
  - Apply Gemini design colors

- [ ] **T1.3** Replace existing buttons with TapButton
  - `ChatView.tsx`: Submit button
  - `AgentResultView.tsx`: Action buttons (3x)
  - `ProfileView.tsx`: Save button
  - `OnboardingWizard.tsx`: Navigation buttons (Next, Skip)

- [ ] **T1.4** Add `useReducedMotion` checks
  - Disable animations when `prefers-reduced-motion: reduce`
  - Fallback to instant transitions

- [ ] **T1.5** Test on real devices
  - Android/Chrome: Verify haptic feedback works
  - iOS: Verify silent fallback (no errors)
  - Low-end device: Verify 60fps maintained

**Acceptance Criteria**:
- ✅ Buttons scale to 0.95 within 100ms
- ✅ Haptic feedback triggers on supported devices
- ✅ No performance regression (60fps maintained)
- ✅ Respects `prefers-reduced-motion` setting

**Files Created**:
- `teacher-assistant/frontend/src/hooks/useHaptic.ts`
- `teacher-assistant/frontend/src/components/TapButton.tsx`

**Files Modified**:
- `teacher-assistant/frontend/src/components/ChatView.tsx`
- `teacher-assistant/frontend/src/components/AgentResultView.tsx`
- `teacher-assistant/frontend/src/components/ProfileView.tsx`
- `teacher-assistant/frontend/src/components/OnboardingWizard.tsx`

---

#### TASK 3.2.2: Loading Skeleton Screens
**Priority**: P0 - Critical
**Estimated Time**: 3 hours
**Agent**: `react-frontend-developer`

**Subtasks**:
- [ ] **T2.1** Install dependencies
  ```bash
  npm install react-loading-skeleton
  ```

- [ ] **T2.2** Create skeleton components
  - `components/ChatSkeleton.tsx`: Message bubble placeholders
  - `components/LibrarySkeleton.tsx`: Material card placeholders
  - `components/HomeSkeleton.tsx`: Calendar + prompt tiles placeholders

- [ ] **T2.3** Integrate skeletons into existing pages
  - `ChatView.tsx`: Show while `isLoading` from `useChat` hook
  - `Library.tsx`: Show while materials fetching from InstantDB
  - `Home.tsx`: Show while initial data loads

- [ ] **T2.4** Configure skeleton styling
  - Base color: `#D3E4E6` (Gemini teal)
  - Highlight color: `#FFFFFF`
  - Border radius matching design system (`rounded-2xl`, `rounded-xl`)

- [ ] **T2.5** Add smooth fade transition
  - Skeleton → Real content animation (300ms fade)
  - Use Framer Motion `AnimatePresence`

**Acceptance Criteria**:
- ✅ Skeletons accurately represent final content structure
- ✅ Smooth transition from skeleton to real content
- ✅ No layout shift (CLS = 0)
- ✅ 15-30% perceived performance improvement

**Files Created**:
- `teacher-assistant/frontend/src/components/ChatSkeleton.tsx`
- `teacher-assistant/frontend/src/components/LibrarySkeleton.tsx`
- `teacher-assistant/frontend/src/components/HomeSkeleton.tsx`

**Files Modified**:
- `teacher-assistant/frontend/src/components/ChatView.tsx`
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`
- `teacher-assistant/frontend/src/pages/Home/Home.tsx`
- `teacher-assistant/frontend/package.json` (new dependency)

---

### Day 2 - Celebrations & Progress

#### TASK 3.2.3: Success Celebrations (Confetti)
**Priority**: P1 - High
**Estimated Time**: 4 hours
**Agent**: `emotional-design-specialist`

**Subtasks**:
- [ ] **T3.1** Install dependencies
  ```bash
  npm install canvas-confetti
  ```

- [ ] **T3.2** Create `components/Confetti.tsx`
  - Implement `triggerConfetti()` function
  - Detect device performance class
  - Adjust particle count: low=30, medium/high=100
  - Use Gemini colors: `['#FB6542', '#FFBB00', '#D3E4E6']`

- [ ] **T3.3** Create `components/SuccessAnimation.tsx`
  - Combine confetti + checkmark animation
  - Scale animation (0 → 1) with spring physics
  - Auto-complete after 2 seconds

- [ ] **T3.4** Integrate celebrations into workflows
  - `AgentResultView.tsx`: Trigger on successful agent completion
  - `OnboardingWizard.tsx`: Trigger on wizard completion
  - `ChatView.tsx`: Trigger when agent suggests high-value prompt

- [ ] **T3.5** Add performance detection
  - Create `utils/performance.ts`
  - Implement `getDevicePerformanceClass()`
  - Skip complex animations on low-end devices

**Acceptance Criteria**:
- ✅ Confetti triggers only on success events
- ✅ Performance-adaptive particle count
- ✅ Gemini color palette used
- ✅ No performance impact on low-end devices

**Files Created**:
- `teacher-assistant/frontend/src/components/Confetti.tsx`
- `teacher-assistant/frontend/src/components/SuccessAnimation.tsx`
- `teacher-assistant/frontend/src/utils/performance.ts`

**Files Modified**:
- `teacher-assistant/frontend/src/components/AgentResultView.tsx`
- `teacher-assistant/frontend/src/components/OnboardingWizard.tsx`
- `teacher-assistant/frontend/src/components/ChatView.tsx`
- `teacher-assistant/frontend/package.json` (new dependency)

---

#### TASK 3.2.4: Progress Visualization (Streaks & Rings)
**Priority**: P1 - High
**Estimated Time**: 4 hours
**Agent**: `emotional-design-specialist`

**Subtasks**:
- [ ] **T4.1** Create `components/StreakCounter.tsx`
  - Flame icon (🔥) with rotation animation
  - Day count with gradient background
  - Spring animation on mount
  - Gemini gradient: `from-secondary to-primary`

- [ ] **T4.2** Create `components/ProgressRing.tsx`
  - SVG circular progress indicator
  - Gradient stroke: `#FB6542` → `#FFBB00`
  - Animate `strokeDashoffset` over 1 second
  - Display percentage in center

- [ ] **T4.3** Add InstantDB schema for streaks
  - Add `userStats` collection
  - Fields: `currentStreak`, `longestStreak`, `lastActiveDate`, `totalXP`
  - Create `useUserStats` hook

- [ ] **T4.4** Implement streak calculation logic
  - Calculate on app launch
  - Check if today !== lastActiveDate
  - Increment streak if consecutive, reset if gap > 1 day
  - Store in InstantDB

- [ ] **T4.5** Integrate into UI
  - `ProfileView.tsx`: Show `StreakCounter` at top
  - `AgentResultView.tsx`: Show `ProgressRing` for completion
  - `Home.tsx`: Show streak in header

**Acceptance Criteria**:
- ✅ Streak increments daily on app usage
- ✅ Streak resets if gap > 24 hours
- ✅ Progress ring animates smoothly
- ✅ Gemini gradient applied correctly

**Files Created**:
- `teacher-assistant/frontend/src/components/StreakCounter.tsx`
- `teacher-assistant/frontend/src/components/ProgressRing.tsx`
- `teacher-assistant/frontend/src/hooks/useUserStats.ts`

**Files Modified**:
- `teacher-assistant/frontend/src/components/ProfileView.tsx`
- `teacher-assistant/frontend/src/components/AgentResultView.tsx`
- `teacher-assistant/frontend/src/pages/Home/Home.tsx`
- `teacher-assistant/frontend/src/lib/instantdb.ts` (schema update)

---

### Day 3 - Transitions & Polish

#### TASK 3.2.5: Page Transitions with LazyMotion
**Priority**: P1 - High
**Estimated Time**: 3 hours
**Agent**: `react-frontend-developer`

**Subtasks**:
- [ ] **T5.1** Create `lib/motion-features.ts`
  - Export `domAnimation` from `framer-motion`
  - Reduces bundle size from 34KB → 4.6KB

- [ ] **T5.2** Update `App.tsx` with LazyMotion wrapper
  - Import `LazyMotion` and `m` from Framer Motion
  - Wrap entire app in `<LazyMotion features={loadFeatures} strict>`

- [ ] **T5.3** Create `components/PageTransition.tsx`
  - Fade in/out with slide up (20px)
  - Duration: 300ms (or 10ms if `prefers-reduced-motion`)
  - Use `m.div` instead of `motion.div`

- [ ] **T5.4** Wrap page components with PageTransition
  - `Chat.tsx`
  - `Home.tsx`
  - `Library.tsx`
  - `ProfileView.tsx`

- [ ] **T5.5** Update modal animations
  - `AgentModal.tsx`: Scale in from 0.95
  - `MaterialPreviewModal.tsx`: Scale in from center
  - Duration: 200ms with ease-out curve

**Acceptance Criteria**:
- ✅ Bundle size reduction verified (check with `npm run build`)
- ✅ Page transitions smooth and consistent
- ✅ Modals animate elegantly
- ✅ Respects `prefers-reduced-motion`

**Files Created**:
- `teacher-assistant/frontend/src/lib/motion-features.ts`
- `teacher-assistant/frontend/src/components/PageTransition.tsx`

**Files Modified**:
- `teacher-assistant/frontend/src/App.tsx`
- `teacher-assistant/frontend/src/pages/Chat/Chat.tsx`
- `teacher-assistant/frontend/src/pages/Home/Home.tsx`
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`
- `teacher-assistant/frontend/src/components/ProfileView.tsx`
- `teacher-assistant/frontend/src/components/AgentModal.tsx`
- `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx`

---

#### TASK 3.2.6: Performance Optimization & Accessibility
**Priority**: P0 - Critical
**Estimated Time**: 2 hours
**Agent**: `react-frontend-developer`

**Subtasks**:
- [ ] **T6.1** Create `hooks/useWillChange.ts`
  - Add `will-change` 200ms before animation
  - Remove after animation completes
  - Optimize GPU usage

- [ ] **T6.2** Update animation config
  - Use `utils/performance.ts` for device detection
  - Adjust durations: low=200ms, medium/high=400ms
  - Disable complex animations on low-end devices

- [ ] **T6.3** Verify `useReducedMotion` integration
  - Check all Framer Motion components respect hook
  - Fallback to instant transitions (0.01s duration)
  - Test with browser DevTools accessibility settings

- [ ] **T6.4** Run Lighthouse audit
  - Performance score > 85
  - Accessibility score = 100
  - Best Practices = 100
  - Fix any regressions

- [ ] **T6.5** Test on real devices
  - iPhone 12 Pro: 60fps check
  - Pixel 5: 60fps check
  - Low-end Android (4GB RAM): Performance check

**Acceptance Criteria**:
- ✅ All animations run at 60fps
- ✅ Zero layout shift (CLS = 0)
- ✅ Lighthouse Performance > 85
- ✅ Lighthouse Accessibility = 100

**Files Created**:
- `teacher-assistant/frontend/src/hooks/useWillChange.ts`

**Files Modified**:
- All animation components (verify `useReducedMotion`)

---

## 🌐 Phase 3.3: PWA Implementation (Days 4-6)

### Day 4 - PWA Foundation

#### TASK 3.3.1: Service Worker Setup with Vite PWA
**Priority**: P0 - Critical
**Estimated Time**: 4 hours
**Agent**: `react-frontend-developer`

**Subtasks**:
- [ ] **T7.1** Install Vite PWA plugin
  ```bash
  npm install -D vite-plugin-pwa workbox-window
  ```

- [ ] **T7.2** Configure `vite.config.ts`
  - Add `VitePWA` plugin with full config (see `plan.md`)
  - Configure caching strategies:
    - Cache First: Static assets (JS, CSS, images)
    - Network First: API routes, InstantDB
    - Stale-While-Revalidate: Profiles
  - Set up runtime caching rules

- [ ] **T7.3** Create PWA manifest
  - Name: "Teacher Assistant - EduHu"
  - Theme color: `#FB6542` (Gemini orange)
  - Icons: 192x192, 512x512, maskable icon
  - Shortcuts: "Neuer Chat", "Bibliothek"
  - Categories: education, productivity

- [ ] **T7.4** Create app icons
  - Generate icons using PWA Asset Generator
  - Sizes: 192x192, 512x512
  - Create maskable icon with safe zone
  - Store in `public/icons/`

- [ ] **T7.5** Register service worker in `main.tsx`
  - Use `registerSW` from `virtual:pwa-register`
  - Handle `onNeedRefresh` event
  - Handle `onOfflineReady` event

- [ ] **T7.6** Test service worker
  - Verify registration in DevTools
  - Check caching in Application tab
  - Test offline mode

**Acceptance Criteria**:
- ✅ Service worker registers successfully
- ✅ Static assets cached on first load
- ✅ App works offline (basic functionality)
- ✅ Manifest loads correctly

**Files Created**:
- `teacher-assistant/frontend/public/manifest.webmanifest`
- `teacher-assistant/frontend/public/icons/icon-192x192.png`
- `teacher-assistant/frontend/public/icons/icon-512x512.png`
- `teacher-assistant/frontend/public/icons/maskable-512x512.png`

**Files Modified**:
- `teacher-assistant/frontend/vite.config.ts`
- `teacher-assistant/frontend/src/main.tsx`
- `teacher-assistant/frontend/package.json` (new dependencies)
- `teacher-assistant/frontend/index.html` (add manifest link)

---

#### TASK 3.3.2: IndexedDB with Dexie.js
**Priority**: P0 - Critical
**Estimated Time**: 4 hours
**Agent**: `react-frontend-developer`

**Subtasks**:
- [ ] **T8.1** Install Dexie dependencies
  ```bash
  npm install dexie dexie-react-hooks
  ```

- [ ] **T8.2** Create `db/schema.ts`
  - Define TypeScript interfaces (see `plan.md`)
  - Tables: `lessons`, `chatMessages`, `pendingSync`, `userStats`
  - Create `EduHuDB` class extending Dexie
  - Export singleton `db` instance

- [ ] **T8.3** Create React hooks for offline data
  - `hooks/useOfflineLessons.ts`: Lesson caching + queries
  - `hooks/useOfflineChat.ts`: Chat message persistence
  - `hooks/useOfflineSync.ts`: Pending sync queue
  - Use `useLiveQuery` from `dexie-react-hooks`

- [ ] **T8.4** Integrate offline chat
  - `ChatView.tsx`: Save messages to IndexedDB
  - Mark messages as `synced: false` when offline
  - Load from IndexedDB on mount
  - Merge with InstantDB when online

- [ ] **T8.5** Integrate offline library
  - `Library.tsx`: Cache materials in IndexedDB
  - Show cached materials when offline
  - Sync updates when online

- [ ] **T8.6** Add offline indicator
  - Create `components/OfflineIndicator.tsx`
  - Show banner when `navigator.onLine === false`
  - Display pending sync count

**Acceptance Criteria**:
- ✅ Messages persist across page reloads
- ✅ Library materials accessible offline
- ✅ Clear offline indicator when disconnected
- ✅ No data loss during offline usage

**Files Created**:
- `teacher-assistant/frontend/src/db/schema.ts`
- `teacher-assistant/frontend/src/hooks/useOfflineLessons.ts`
- `teacher-assistant/frontend/src/hooks/useOfflineChat.ts`
- `teacher-assistant/frontend/src/hooks/useOfflineSync.ts`
- `teacher-assistant/frontend/src/components/OfflineIndicator.tsx`

**Files Modified**:
- `teacher-assistant/frontend/src/components/ChatView.tsx`
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`
- `teacher-assistant/frontend/package.json` (new dependencies)

---

### Day 5 - Background Sync & Install Prompt

#### TASK 3.3.3: Background Sync Implementation
**Priority**: P1 - High
**Estimated Time**: 4 hours
**Agent**: `backend-node-developer` (service worker logic)

**Subtasks**:
- [ ] **T9.1** Create `services/backgroundSync.ts`
  - Implement `registerBackgroundSync()`
  - Implement `queueForSync(action, payload)`
  - Implement `processSyncQueue()`
  - Handle retry logic (max 3 attempts)

- [ ] **T9.2** Add sync event listener to service worker
  - Create custom service worker file
  - Listen for `sync` event with tag `sync-pending-actions`
  - Call `processSyncQueue()` on sync

- [ ] **T9.3** Integrate into chat workflow
  - `ChatView.tsx`: Queue message creation when offline
  - Auto-sync when connectivity returns
  - Show sync status to user

- [ ] **T9.4** Integrate into library workflow
  - Queue material creation/updates when offline
  - Sync on reconnect

- [ ] **T9.5** Add sync status UI
  - Update `OfflineIndicator.tsx` with sync progress
  - Show "Syncing..." state
  - Show success/error messages

**Acceptance Criteria**:
- ✅ Offline actions queue automatically
- ✅ Sync triggers when back online
- ✅ Failed syncs retry up to 3 times
- ✅ User informed of sync status

**Files Created**:
- `teacher-assistant/frontend/src/services/backgroundSync.ts`
- `teacher-assistant/frontend/public/sw.js` (custom service worker)

**Files Modified**:
- `teacher-assistant/frontend/src/components/ChatView.tsx`
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`
- `teacher-assistant/frontend/src/components/OfflineIndicator.tsx`
- `teacher-assistant/frontend/vite.config.ts` (register custom SW)

---

#### TASK 3.3.4: Install Prompt & iOS Handling
**Priority**: P1 - High
**Estimated Time**: 4 hours
**Agent**: `emotional-design-specialist`

**Subtasks**:
- [ ] **T10.1** Create `hooks/useInstallPrompt.ts`
  - Listen for `beforeinstallprompt` event
  - Store prompt event in state
  - Implement `promptInstall()` function
  - Track install analytics

- [ ] **T10.2** Create `components/InstallBanner.tsx`
  - Show after 2+ visits OR 30+ seconds
  - Gemini design styling
  - "Installieren" / "Nicht jetzt" buttons
  - Slide up animation from bottom

- [ ] **T10.3** Add visit tracking
  - Use `localStorage` to count visits
  - Increment on app launch
  - Show banner logic based on visits

- [ ] **T10.4** Create iOS-specific install instructions
  - Create `components/IOSInstallPrompt.tsx`
  - Detect iOS Safari
  - Show "Add to Home Screen" instructions
  - Include visual guide (Share icon → Add to Home Screen)

- [ ] **T10.5** Request persistent storage (iOS)
  - Call `navigator.storage.persist()` on mount
  - Prevent 7-day storage expiry

- [ ] **T10.6** Add to Home screen
  - Integrate `InstallBanner` into `App.tsx`
  - Position: `fixed bottom-20` (above tab bar)
  - Animate in after delay

**Acceptance Criteria**:
- ✅ Install prompt shows at optimal time
- ✅ iOS users see custom install guide
- ✅ 20-30% acceptance rate target
- ✅ Persistent storage requested on iOS

**Files Created**:
- `teacher-assistant/frontend/src/hooks/useInstallPrompt.ts`
- `teacher-assistant/frontend/src/components/InstallBanner.tsx`
- `teacher-assistant/frontend/src/components/IOSInstallPrompt.tsx`

**Files Modified**:
- `teacher-assistant/frontend/src/App.tsx`

---

### Day 6 - Mobile Polish & Gestures

#### TASK 3.3.5: Safe Area Handling
**Priority**: P0 - Critical
**Estimated Time**: 2 hours
**Agent**: `react-frontend-developer`

**Subtasks**:
- [ ] **T11.1** Add safe area CSS variables to `index.css`
  - Define `--safe-area-inset-top/right/bottom/left`
  - Use `env(safe-area-inset-*)` with fallbacks

- [ ] **T11.2** Update viewport meta tag in `index.html`
  - Add `viewport-fit=cover`
  - Enable safe area on iOS

- [ ] **T11.3** Apply safe area padding to header
  - `App.tsx` or layout component
  - `padding-top: max(16px, var(--safe-area-inset-top))`

- [ ] **T11.4** Apply safe area padding to bottom navigation
  - Tab bar component
  - `padding-bottom: max(16px, var(--safe-area-inset-bottom))`

- [ ] **T11.5** Test on iPhone with notch
  - iPhone 12 Pro or newer
  - Verify content doesn't hide behind notch
  - Check bottom safe area (home indicator)

**Acceptance Criteria**:
- ✅ No content hidden behind iOS notch
- ✅ Bottom nav clear of home indicator
- ✅ Works on all iPhone models
- ✅ Graceful fallback on Android

**Files Modified**:
- `teacher-assistant/frontend/src/index.css`
- `teacher-assistant/frontend/index.html`
- `teacher-assistant/frontend/src/App.tsx`

---

#### TASK 3.3.6: Pull-to-Refresh
**Priority**: P2 - Medium
**Estimated Time**: 3 hours
**Agent**: `react-frontend-developer`

**Subtasks**:
- [ ] **T12.1** Create `hooks/usePullRefresh.ts`
  - Track touch events (start, move, end)
  - Calculate pull distance with max threshold
  - Trigger refresh callback at threshold (100px)
  - Spring animation back to top

- [ ] **T12.2** Create pull-to-refresh indicator
  - Circular loading spinner
  - Gemini orange color
  - Appears when pulling down
  - Animates while refreshing

- [ ] **T12.3** Integrate into Library view
  - `Library.tsx`: Wrap content with pull-to-refresh
  - Refresh materials on pull
  - Show loading indicator

- [ ] **T12.4** Integrate into Chat view
  - `ChatView.tsx`: Refresh messages on pull
  - Only when scrolled to top

- [ ] **T12.5** Test on iOS standalone mode
  - Native pull-to-refresh disabled in standalone
  - Custom implementation should work

**Acceptance Criteria**:
- ✅ Pull-to-refresh works in standalone mode
- ✅ Smooth spring animation
- ✅ Visual feedback during pull
- ✅ Triggers data refresh

**Files Created**:
- `teacher-assistant/frontend/src/hooks/usePullRefresh.ts`
- `teacher-assistant/frontend/src/components/PullRefreshIndicator.tsx`

**Files Modified**:
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`
- `teacher-assistant/frontend/src/components/ChatView.tsx`

---

#### TASK 3.3.7: Swipe Gestures
**Priority**: P2 - Medium
**Estimated Time**: 3 hours
**Agent**: `react-frontend-developer`

**Subtasks**:
- [ ] **T13.1** Install gesture library
  ```bash
  npm install @use-gesture/react
  ```

- [ ] **T13.2** Create `components/SwipeableChat.tsx`
  - Use `useDrag` from `@use-gesture/react`
  - Track swipe velocity and direction
  - Trigger callbacks on fast swipe (velocity > 0.2)
  - Spring animation on release

- [ ] **T13.3** Integrate swipe-to-delete in Library
  - `Library.tsx`: Swipe left on material to delete
  - Show delete confirmation
  - Animate card out on delete

- [ ] **T13.4** Add swipe navigation (optional)
  - Swipe right to go back
  - Only in standalone mode

- [ ] **T13.5** Test gesture feel
  - Natural rubberband effect
  - Smooth spring physics
  - No lag during drag

**Acceptance Criteria**:
- ✅ Swipe gestures feel natural
- ✅ Velocity detection accurate
- ✅ Spring physics smooth
- ✅ Works on touch devices

**Files Created**:
- `teacher-assistant/frontend/src/components/SwipeableChat.tsx`

**Files Modified**:
- `teacher-assistant/frontend/src/pages/Library/Library.tsx`
- `teacher-assistant/frontend/package.json` (new dependency)

---

## 🧪 Testing & QA Tasks

### TASK 3.Q.1: Unit Tests for Phase 3.2
**Priority**: P1 - High
**Estimated Time**: 4 hours
**Agent**: `qa-integration-reviewer`

**Subtasks**:
- [ ] **TQ1.1** Test `useHaptic` hook
  - Verify vibration calls
  - Test feature detection
  - Test silent fallback

- [ ] **TQ1.2** Test `StreakCounter` component
  - Verify correct day display
  - Test animation triggers
  - Test gradient colors

- [ ] **TQ1.3** Test `ProgressRing` component
  - Verify percentage calculation
  - Test SVG rendering
  - Test animation timing

- [ ] **TQ1.4** Test `useReducedMotion` integration
  - Mock `matchMedia` API
  - Verify animations disabled
  - Test instant transitions

**Acceptance Criteria**:
- ✅ All unit tests pass
- ✅ > 80% code coverage
- ✅ Edge cases handled

**Files Created**:
- `teacher-assistant/frontend/src/hooks/__tests__/useHaptic.test.ts`
- `teacher-assistant/frontend/src/components/__tests__/StreakCounter.test.tsx`
- `teacher-assistant/frontend/src/components/__tests__/ProgressRing.test.tsx`

---

### TASK 3.Q.2: E2E Tests for Phase 3.3
**Priority**: P1 - High
**Estimated Time**: 4 hours
**Agent**: `qa-integration-reviewer`

**Subtasks**:
- [ ] **TQ2.1** Test PWA installation
  - Verify manifest loads
  - Check service worker registration
  - Test install prompt

- [ ] **TQ2.2** Test offline functionality
  - Load app online, go offline
  - Verify cached content accessible
  - Test offline indicator

- [ ] **TQ2.3** Test background sync
  - Create message offline
  - Go back online
  - Verify message syncs

- [ ] **TQ2.4** Test pull-to-refresh
  - Emulate touch events
  - Verify refresh triggers
  - Check loading state

- [ ] **TQ2.5** Test swipe gestures
  - Emulate swipe left/right
  - Verify callbacks trigger
  - Check animation

**Acceptance Criteria**:
- ✅ All E2E tests pass
- ✅ PWA functionality verified
- ✅ Offline mode works correctly

**Files Created**:
- `teacher-assistant/frontend/e2e-tests/pwa-installation.spec.ts`
- `teacher-assistant/frontend/e2e-tests/offline-functionality.spec.ts`
- `teacher-assistant/frontend/e2e-tests/background-sync.spec.ts`
- `teacher-assistant/frontend/e2e-tests/mobile-gestures.spec.ts`

---

### TASK 3.Q.3: Lighthouse Audits
**Priority**: P0 - Critical
**Estimated Time**: 2 hours
**Agent**: `qa-integration-reviewer`

**Subtasks**:
- [ ] **TQ3.1** Run desktop Lighthouse audit
  - Performance > 85
  - PWA = 100
  - Accessibility = 100
  - Best Practices = 100

- [ ] **TQ3.2** Run mobile Lighthouse audit
  - Performance > 85 (mobile)
  - First Contentful Paint < 1.8s
  - Time to Interactive < 3.8s

- [ ] **TQ3.3** Check Core Web Vitals
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

- [ ] **TQ3.4** Fix any regressions
  - Document issues
  - Implement fixes
  - Re-audit

**Acceptance Criteria**:
- ✅ Lighthouse Performance > 85
- ✅ Lighthouse PWA = 100
- ✅ All Core Web Vitals pass

**Files Created**:
- `teacher-assistant/frontend/lighthouse-report-desktop.html`
- `teacher-assistant/frontend/lighthouse-report-mobile.html`
- `docs/quality-assurance/lighthouse-audit-phase-3.md`

---

### TASK 3.Q.4: Real Device Testing
**Priority**: P0 - Critical
**Estimated Time**: 3 hours
**Agent**: `qa-integration-reviewer`

**Subtasks**:
- [ ] **TQ4.1** Test on iPhone 12 Pro (iOS 17+)
  - Install to home screen
  - Verify safe area handling
  - Test offline mode
  - Check animations (60fps)

- [ ] **TQ4.2** Test on Pixel 5 (Android 13+)
  - Install PWA
  - Verify haptic feedback
  - Test background sync
  - Check performance

- [ ] **TQ4.3** Test on low-end Android (4GB RAM)
  - Verify performance-adaptive animations
  - Check reduced particle count
  - Ensure 60fps maintained

- [ ] **TQ4.4** Document device-specific issues
  - Create bug reports
  - Prioritize fixes

**Acceptance Criteria**:
- ✅ Works on all target devices
- ✅ 60fps maintained on all devices
- ✅ No critical device-specific bugs

**Files Created**:
- `docs/testing/device-testing-phase-3.md`

---

## 📊 Documentation Tasks

### TASK 3.D.1: Session Documentation
**Priority**: P2 - Medium
**Estimated Time**: 1 hour per day
**Agent**: All agents (collaborative)

**Subtasks**:
- [ ] **TD1.1** Create session logs for each day
  - `docs/development-logs/sessions/2025-10-04/session-01-phase-3.2-day-1.md`
  - Document implementations, blockers, decisions

- [ ] **TD1.2** Update bug tracking
  - Document any new bugs discovered
  - Update `docs/quality-assurance/bug-tracking.md`

- [ ] **TD1.3** Create implementation summary
  - Write `PHASE-3-EMOTIONAL-DESIGN-SUMMARY.md` at end
  - Include screenshots, metrics, lessons learned

**Acceptance Criteria**:
- ✅ Daily session logs created
- ✅ Bug tracking up to date
- ✅ Final summary comprehensive

---

## 🎯 Definition of Done (Overall)

### Phase 3.2 Complete When:
- [x] All button interactions have haptic feedback
- [x] All loading states show skeleton screens
- [x] Success events trigger celebrations
- [x] Streak counter integrated and functional
- [x] Progress rings animate smoothly
- [x] Page transitions feel smooth
- [x] Lighthouse Performance > 85
- [x] 60fps maintained on all devices
- [x] Unit tests pass (> 80% coverage)

### Phase 3.3 Complete When:
- [x] PWA installable on iOS and Android
- [x] App works offline (chat, library)
- [x] Background sync functional
- [x] Install prompt shows at optimal time
- [x] Safe areas handled correctly
- [x] Pull-to-refresh implemented
- [x] Swipe gestures feel natural
- [x] Lighthouse PWA score = 100
- [x] E2E tests pass
- [x] Real device testing complete

---

## 📅 Implementation Schedule

| Day | Phase | Tasks | Estimated Hours |
|-----|-------|-------|-----------------|
| **1** | 3.2.1 - 3.2.2 | Button feedback, Haptic, Skeletons | 6h |
| **2** | 3.2.3 - 3.2.4 | Celebrations, Streaks, Progress rings | 8h |
| **3** | 3.2.5 - 3.2.6 | Page transitions, Performance optimization | 5h |
| **4** | 3.3.1 - 3.3.2 | Service worker, IndexedDB | 8h |
| **5** | 3.3.3 - 3.3.4 | Background sync, Install prompt | 8h |
| **6** | 3.3.5 - 3.3.7 | Safe areas, Pull-to-refresh, Gestures | 8h |
| **QA** | Testing | Unit tests, E2E tests, Lighthouse, Device testing | 13h |

**Total Estimated Time**: ~56 hours (7 working days with testing)

---

**Next Steps**:
1. Review this task list with user
2. Assign tasks to appropriate agents
3. Begin implementation with Day 1 tasks
4. Track progress in `docs/development-logs/sessions/`
