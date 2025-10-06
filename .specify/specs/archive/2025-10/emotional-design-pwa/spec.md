# Spec: Emotional Design & PWA Features

**Feature ID**: `emotional-design-pwa`
**Status**: Draft
**Priority**: P1 - HIGH (Phase 3.2 & 3.3 - Makes app "lovable")
**Created**: 2025-10-04
**Owner**: emotional-design-specialist + react-frontend-developer

---

## 🎯 Vision & Goals

**Transform the Teacher Assistant from "functional" to "beloved"** by implementing Duolingo-level engagement through:
- **60fps micro-interactions** that make every touch feel alive
- **PWA capabilities** enabling offline learning and app-like installation
- **Emotional feedback loops** celebrating wins and maintaining habit streaks

**Success Metric**: Teachers say **"Wow, das fühlt sich gut an!"** (Phase 3 goal from roadmap-redesign-2025.md)

---

## 📊 Problem Statement

### Current State ❌
- App is functional but feels "dead"
- No animation feedback on interactions
- No offline support (fails in poor connectivity)
- No installation capability (always requires browser)
- No celebration of achievements
- Generic UI without personality

### Research Insights ✅
**From successful PWAs:**
- Pinterest: 843% increase in signups through performance + offline
- Twitter Lite: 65% more engagement via micro-interactions
- Duolingo: Habit formation through streaks + celebrations
- Uber PWA: 50KB core bundle for 2G networks

**Key Findings:**
1. **Performance = Engagement**: Every 100ms delay = 1% drop in engagement
2. **Offline-First = Critical**: Students learn with spotty WiFi
3. **Micro-Interactions = Lovable**: Immediate feedback creates delight
4. **Streaks = Retention**: Loss aversion drives daily usage

---

## 🎨 Solution Overview

### Phase 3.2: Micro-Interactions & Animations
**Goal**: Make every interaction feel alive

**Components:**
1. **Button Feedback** (Framer Motion)
   - Tap scale to 0.95 (100ms)
   - Haptic feedback on touch (10ms vibration)
   - Color shift on hover/press

2. **Loading States** (React Loading Skeleton)
   - Skeleton screens (15-30% better perceived perf vs spinners)
   - Progressive reveal animations
   - Shimmer effect during load

3. **Success Celebrations** (Confetti + Motion)
   - Confetti on quiz completion
   - Bounce animations for achievements
   - Progress ring fills with Gemini Orange gradient

4. **Smooth Transitions** (Framer Motion LazyMotion)
   - Page transitions (fadeIn, slideUp)
   - Modal animations (scaleIn from center)
   - Card hover states (scale 1.05, shadow increase)

5. **Progress Visualization**
   - Streak counter with flame icon 🔥
   - XP progress bars with gradient fills
   - Achievement badges with unlock animations

### Phase 3.3: PWA Implementation
**Goal**: Native-like experience with offline support

**Components:**
1. **Service Worker** (Vite PWA Plugin)
   - Cache static assets (Cache First strategy)
   - Lesson content (Network First with offline fallback)
   - Background sync for progress updates

2. **Offline Storage** (Dexie.js + IndexedDB)
   - Lesson data persistence
   - Student progress queue
   - Chat history cache

3. **Install Prompt** (BeforeInstallPrompt API)
   - Show after 2+ visits OR 30+ seconds engagement
   - Context-aware (after lesson completion)
   - 20-30% acceptance rate target

4. **App Manifest** (PWA manifest.json)
   - Standalone display mode
   - Gemini Orange theme color (#FB6542)
   - App shortcuts (Today's Lesson, Library, Chat)
   - Maskable icons for adaptive display

5. **Mobile Polish**
   - 44px minimum tap targets (WCAG 2.1 AA)
   - Safe area handling (iOS notches)
   - Pull-to-refresh (custom implementation)
   - Swipe gestures (@use-gesture/react)

---

## 💡 User Stories

### Micro-Interactions (Phase 3.2)

**Story 1: Button Feedback**
```
AS A teacher using the app
WHEN I tap any button
THEN I see immediate visual feedback (scale 0.95) + feel haptic vibration
SO THAT every interaction feels responsive and alive
```

**Story 2: Loading Experience**
```
AS A teacher loading lesson content
WHEN I navigate to a new page
THEN I see skeleton placeholders showing content structure
SO THAT I understand what's loading and perceived wait time is reduced
```

**Story 3: Achievement Celebrations**
```
AS A teacher completing a tutorial or task
WHEN I finish successfully
THEN I see confetti animation + progress ring fills + success toast
SO THAT I feel rewarded and motivated to continue
```

**Story 4: Streak Tracking**
```
AS A teacher using the app daily
WHEN I return each day
THEN I see my streak counter increment with flame icon animation
SO THAT I'm motivated to maintain daily habits (loss aversion)
```

### PWA Features (Phase 3.3)

**Story 5: Offline Access**
```
AS A teacher in a classroom with poor WiFi
WHEN I lose internet connection
THEN I can still access cached lessons and continue working
SO THAT connectivity issues don't interrupt my workflow
```

**Story 6: App Installation**
```
AS A teacher who frequently uses the app
WHEN I've visited 2+ times or spent 30+ seconds
THEN I see a subtle install banner
SO THAT I can install the app to my home screen for quicker access
```

**Story 7: Background Sync**
```
AS A teacher creating content offline
WHEN I complete work and connectivity returns
THEN my changes automatically sync to the server
SO THAT I never lose progress due to network issues
```

**Story 8: Mobile-Native Feel**
```
AS A teacher on mobile
WHEN I use the app
THEN touch targets are large (44px), gestures work intuitively, and safe areas are respected
SO THAT the app feels native, not web-based
```

---

## ✅ Success Criteria

### Performance Metrics
- **60fps animations** on all interactions (verified with Chrome DevTools)
- **Time to Interactive < 3.8s** on mobile (Lighthouse audit)
- **First Contentful Paint < 1.8s** (Lighthouse audit)
- **Lighthouse PWA score = 100** (perfect PWA compliance)
- **Lighthouse Performance score > 85** (acceptable mobile perf)

### Engagement Metrics
- **Install acceptance rate > 20%** (after prompt shown)
- **Streak retention > 30%** (users return daily)
- **Perceived performance improvement** (subjective user feedback)

### Technical Criteria
- **Zero layout shift** during animations (CLS = 0)
- **Offline support for core features** (lesson viewing, chat history)
- **Service worker updates < 5s** on app reload
- **IndexedDB storage < 50MB** (iOS limit compatibility)

### Accessibility Criteria
- **prefers-reduced-motion respected** (disable animations if set)
- **44px minimum touch targets** (WCAG 2.1 AA compliance)
- **Color contrast ratio > 4.5:1** (maintained through interactions)
- **Keyboard navigation works** (for desktop users)

---

## 🚫 Non-Goals (Out of Scope)

- **Push Notifications**: Requires backend infra (future enhancement)
- **Dark Mode**: Separate visual design feature (later phase)
- **Desktop PWA Window Controls**: Low priority (mobile-first focus)
- **Advanced Gesture Recognition**: Keep swipe simple (complexity vs value)
- **Animated Mascot Character**: Resource-intensive (Duolingo owl style later)

---

## 🔗 Dependencies

### Technical
- **Framer Motion** (already installed in Phase 3.1)
- **Motion Tokens** (already defined in `motion-tokens.ts`)
- **Design Tokens** (Gemini colors ready)
- **React 18+** (useTransition, Suspense)

### Phase Dependencies
- **Requires**: Phase 3.1 Visual Redesign ✅ COMPLETE
- **Blocks**: None (can implement independently)
- **Enables**: Phase 2.1 Home Screen Redesign (better with animations)

---

## 📏 Constraints & Assumptions

### Technical Constraints
- **Mobile Performance**: Target low-end Android (4 CPU cores, 4GB RAM)
- **Bundle Size**: Total JS < 300KB gzipped (current: 508KB - need reduction)
- **iOS PWA Limitations**: No push notifications (iOS 16.4+ only), 7-day storage expiry
- **Browser Support**: Modern browsers only (Chrome 90+, Safari 14+, Firefox 88+)

### Design Constraints
- **Gemini Colors**: Maintain Orange (#FB6542), Yellow (#FFBB00), Teal (#D3E4E6)
- **Animation Duration**: 100ms (micro), 200-300ms (standard), 500ms (celebratory)
- **Accessibility First**: Never sacrifice WCAG compliance for animations

### Resource Constraints
- **Development Time**: Phase 3.2 = 2-3 days, Phase 3.3 = 2-3 days
- **Testing Devices**: Need real iOS/Android for PWA testing
- **Performance Budget**: Enforce via Lighthouse CI (already setup in Phase 3.1)

---

## 🎯 Target Users

**Primary**: German Teachers (Lehrkräfte)
- **Context**: Classroom with spotty WiFi, mobile-first usage
- **Pain Points**: Slow apps, lost progress, clunky interactions
- **Expectations**: Native app feel, instant feedback, works offline

**Behavior Patterns:**
- **Daily Usage**: 15-30 min sessions
- **Device**: 70% mobile (iOS/Android), 30% desktop
- **Network**: 40% WiFi, 30% 4G, 30% 3G/2G (Germany)

---

## 📚 References

### Research Documents
- PWA Implementation Guide (provided in prompt)
- `roadmap-redesign-2025.md` (Phase 3 goals)
- `master-todo.md` (Phase 3.2, 3.3 tasks)
- `.claude/agents/emotional-design-specialist.md` (agent reference)

### Design Inspiration
- Duolingo: Streaks, celebrations, habit loops
- Pinterest PWA: Offline-first, performance focus
- Twitter Lite: Micro-interactions, virtualized lists
- Gemini Mockup: Color palette, visual language

### Technical Docs
- Framer Motion: https://www.framer.com/motion/
- Vite PWA Plugin: https://vite-pwa-org.netlify.app/
- Dexie.js: https://dexie.org/
- React Use Gesture: https://use-gesture.netlify.app/

---

## 📊 Risk Assessment

### HIGH RISK ⚠️
- **iOS PWA Storage Expiry**: 7-day limit may clear data → Mitigate with persistent storage request
- **Performance Regression**: Animations may slow low-end devices → Mitigate with performance detection
- **Bundle Size Increase**: New libraries may exceed budget → Mitigate with lazy loading

### MEDIUM RISK ⚡
- **Browser Compatibility**: Some APIs not universal → Graceful degradation
- **Testing Complexity**: Real device testing required → Playwright mobile emulation + manual
- **Service Worker Bugs**: Caching issues hard to debug → Thorough testing, clear cache API

### LOW RISK ✅
- **Animation Design**: Subjective preference → User feedback iteration
- **Install Prompt Timing**: May annoy users → A/B test optimal timing
- **Haptic API Support**: Limited browser support → Feature detection, silent fallback

---

## 🔄 Iteration Plan

### Phase 3.2.1: Core Micro-Interactions (Day 1)
- Button tap feedback (scale + haptic)
- Loading skeletons (3 components)
- Toast notifications (Sonner integration)
- Verify 60fps performance

### Phase 3.2.2: Celebrations & Progress (Day 2)
- Confetti on success
- Progress rings with gradient
- Streak counter with flame
- Achievement badge animations

### Phase 3.2.3: Transitions & Polish (Day 3)
- Page transitions (Framer Motion LazyMotion)
- Modal animations (bottom sheet style)
- Card hover states
- Motion tokens application

### Phase 3.3.1: PWA Foundation (Day 1)
- Vite PWA plugin setup
- Service worker generation
- Offline caching strategies
- App manifest configuration

### Phase 3.3.2: Offline Storage (Day 2)
- Dexie.js integration
- IndexedDB schema design
- Background sync implementation
- Offline indicator UI

### Phase 3.3.3: Mobile Polish (Day 3)
- Safe area handling
- Touch target sizing
- Pull-to-refresh
- Install prompt logic
- Swipe gestures

---

**Next Steps**: Create `plan.md` with technical architecture
**Agents**: emotional-design-specialist (lead), react-frontend-developer (implementation)
**Timeline**: 6 days total (Phase 3.2 + 3.3)
