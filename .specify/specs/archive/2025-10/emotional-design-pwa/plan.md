# Technical Plan: Emotional Design & PWA Implementation

**Feature ID**: `emotional-design-pwa`
**Status**: Planning
**Related Spec**: `spec.md`
**Created**: 2025-10-04
**Implementation Timeline**: 6 days (Phase 3.2 + Phase 3.3)

---

## 🏗️ Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Teacher Assistant PWA                     │
├─────────────────────────────────────────────────────────────┤
│  Phase 3.2: Micro-Interactions & Animations                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Framer Motion + LazyMotion (4.6KB)                   │  │
│  │  ├─ Button Feedback (scale + haptic)                  │  │
│  │  ├─ Loading Skeletons (react-loading-skeleton)        │  │
│  │  ├─ Celebrations (confetti + bounce)                  │  │
│  │  ├─ Page Transitions (fadeIn, slideUp)                │  │
│  │  └─ Progress Visualization (streaks, rings)           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Phase 3.3: PWA Implementation                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Service Worker (Vite PWA Plugin + Workbox)           │  │
│  │  ├─ Cache First: Static assets (JS, CSS, images)      │  │
│  │  ├─ Network First: Dynamic content (lessons, chat)    │  │
│  │  ├─ Stale-While-Revalidate: Profiles, avatars         │  │
│  │  └─ Background Sync: Progress updates                 │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  IndexedDB (Dexie.js + dexie-react-hooks)             │  │
│  │  ├─ Lessons: Content, progress, metadata              │  │
│  │  ├─ Chat History: Messages, context                   │  │
│  │  ├─ Pending Sync: Offline actions queue               │  │
│  │  └─ User State: Preferences, streaks, achievements    │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Mobile Polish                                         │  │
│  │  ├─ @use-gesture/react: Swipe gestures                │  │
│  │  ├─ Vibration API: Haptic feedback                    │  │
│  │  ├─ Safe Area Handling: iOS notches                   │  │
│  │  ├─ Pull-to-Refresh: Custom implementation            │  │
│  │  └─ Install Prompt: Context-aware timing              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Dependencies & Libraries

### New Dependencies (Phase 3.2)

```json
{
  "dependencies": {
    "react-loading-skeleton": "^3.4.0",
    "sonner": "^1.4.0",
    "canvas-confetti": "^1.9.2",
    "@use-gesture/react": "^10.3.0"
  }
}
```

**Rationale**:
- `react-loading-skeleton`: Skeleton screens (15-30% better perceived performance)
- `sonner`: Modern toast notifications (5KB, swipe-to-dismiss)
- `canvas-confetti`: Celebration animations (7KB, performant)
- `@use-gesture/react`: Touch gestures (15KB, 60fps)

### New Dependencies (Phase 3.3)

```json
{
  "dependencies": {
    "dexie": "^4.0.1",
    "dexie-react-hooks": "^1.1.7",
    "react-spring-bottom-sheet": "^3.4.1"
  },
  "devDependencies": {
    "vite-plugin-pwa": "^0.19.0",
    "workbox-window": "^7.0.0"
  }
}
```

**Rationale**:
- `dexie`: Type-safe IndexedDB wrapper (elegant React hooks)
- `vite-plugin-pwa`: Zero-config PWA setup (auto service worker)
- `react-spring-bottom-sheet`: Accessible bottom sheets (snap points, drag-to-dismiss)

### Already Installed ✅
- `framer-motion`: Animations (installed in Phase 3.1)
- `@tanstack/react-query`: Server state (with offline support)
- `tailwindcss`: Styling with Gemini Design Language

---

## 🎨 Phase 3.2: Micro-Interactions Implementation

### 3.2.1: Button Feedback & Haptic (Day 1 Morning)

**Components to Create**:
```typescript
// hooks/useHaptic.ts
export const useHaptic = () => {
  const tap = () => vibrate(10);
  const success = () => vibrate([50, 50, 100]);
  const error = () => vibrate([100, 50, 100, 50, 100]);
  return { tap, success, error };
};

// components/TapButton.tsx
import { motion } from 'framer-motion';
export const TapButton = ({ children, onClick }) => {
  const { tap } = useHaptic();
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.1 }}
      onTouchStart={tap}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};
```

**Files to Modify**:
- `ChatView.tsx`: Replace submit button with `TapButton`
- `AgentResultView.tsx`: Replace action buttons with `TapButton`
- `ProfileView.tsx`: Replace save button with `TapButton`

**Acceptance Criteria**:
- Buttons scale to 0.95 within 100ms on tap
- Haptic feedback triggers on Android/Chrome (silent fail on iOS)
- No lag, maintains 60fps

---

### 3.2.2: Loading Skeletons (Day 1 Afternoon)

**Components to Create**:
```typescript
// components/ChatSkeleton.tsx
import Skeleton from 'react-loading-skeleton';
export const ChatSkeleton = () => (
  <div className="flex justify-start mb-3">
    <Skeleton height={60} width="70%" borderRadius={16} />
  </div>
);

// components/LibrarySkeleton.tsx
export const LibrarySkeleton = () => (
  <div className="p-4">
    <Skeleton height={24} width="40%" className="mb-2" />
    <Skeleton height={16} width="90%" />
    <Skeleton height={16} width="60%" />
  </div>
);

// components/HomeSkeleton.tsx
export const HomeSkeleton = () => (
  <>
    <Skeleton height={200} borderRadius={24} className="mb-4" />
    <Skeleton height={120} borderRadius={16} className="mb-4" />
    <Skeleton height={80} borderRadius={12} count={3} />
  </>
);
```

**Files to Modify**:
- `ChatView.tsx`: Show `ChatSkeleton` while messages load
- `Library.tsx`: Show `LibrarySkeleton` while materials load
- `Home.tsx`: Show `HomeSkeleton` while initial data loads

**Acceptance Criteria**:
- Skeletons show content structure accurately
- Smooth transition from skeleton → real content
- 15-30% perceived performance improvement

---

### 3.2.3: Success Celebrations (Day 2 Morning)

**Components to Create**:
```typescript
// components/Confetti.tsx
import confetti from 'canvas-confetti';
export const triggerConfetti = (performanceClass: 'low' | 'medium' | 'high') => {
  const count = performanceClass === 'low' ? 30 : 100;
  confetti({
    particleCount: count,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FB6542', '#FFBB00', '#D3E4E6']
  });
};

// components/SuccessAnimation.tsx
export const SuccessAnimation = ({ onComplete }) => {
  useEffect(() => {
    triggerConfetti(getDevicePerformanceClass());
    setTimeout(onComplete, 2000);
  }, []);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className="success-checkmark"
    >
      ✓
    </motion.div>
  );
};
```

**Files to Modify**:
- `AgentResultView.tsx`: Trigger confetti on successful agent completion
- `OnboardingWizard.tsx`: Celebrate onboarding completion
- `ChatView.tsx`: Celebrate when agent suggests useful prompt

**Acceptance Criteria**:
- Confetti triggers only on high/medium performance devices
- Colors use Gemini palette (#FB6542, #FFBB00, #D3E4E6)
- Animation completes in < 2 seconds

---

### 3.2.4: Progress Visualization (Day 2 Afternoon)

**Components to Create**:
```typescript
// components/StreakCounter.tsx
export const StreakCounter = ({ days }: { days: number }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 500 }}
    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-secondary to-primary rounded-full"
  >
    <motion.span
      animate={{ rotate: [0, -10, 10, -10, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-3xl"
    >
      🔥
    </motion.span>
    <div>
      <div className="text-2xl font-bold text-white">{days}</div>
      <div className="text-xs text-white/90">day streak</div>
    </div>
  </motion.div>
);

// components/ProgressRing.tsx
export const ProgressRing = ({ percentage }: { percentage: number }) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#D3E4E6" strokeWidth="8" />
      <motion.circle
        cx="50" cy="50" r="45"
        fill="none"
        stroke="url(#gradient)"
        strokeWidth="8"
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{
          strokeDasharray: circumference,
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%'
        }}
      />
      <defs>
        <linearGradient id="gradient">
          <stop offset="0%" stopColor="#FB6542" />
          <stop offset="100%" stopColor="#FFBB00" />
        </linearGradient>
      </defs>
      <text x="50" y="50" textAnchor="middle" dy="7" fontSize="20" fontWeight="700" fill="#333">
        {Math.round(percentage)}%
      </text>
    </svg>
  );
};
```

**Files to Modify**:
- `ProfileView.tsx`: Add `StreakCounter` showing usage streak
- `AgentResultView.tsx`: Add `ProgressRing` for completion percentage
- `OnboardingWizard.tsx`: Add progress indicator

**Integration with InstantDB**:
```typescript
// Add to InstantDB schema
interface UserStats {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  totalLessonsCompleted: number;
}

// Calculate streak on app launch
const updateStreak = async (userId: string) => {
  const stats = await db.query({ userStats: { userId } });
  const today = new Date().toDateString();
  const lastActive = new Date(stats.lastActiveDate).toDateString();

  if (today !== lastActive) {
    const daysDiff = daysBetween(new Date(lastActive), new Date());
    const newStreak = daysDiff === 1 ? stats.currentStreak + 1 : 1;

    await db.transact([
      db.userStats.update(stats.id, {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, stats.longestStreak),
        lastActiveDate: new Date()
      })
    ]);
  }
};
```

---

### 3.2.5: Page Transitions (Day 3 Morning)

**Implementation Strategy**:
```typescript
// App.tsx - Add LazyMotion wrapper
import { LazyMotion, m } from 'framer-motion';
import loadFeatures from './lib/motion-features';

export const App = () => (
  <LazyMotion features={loadFeatures} strict>
    {/* Existing app content */}
  </LazyMotion>
);

// lib/motion-features.ts
import { domAnimation } from 'framer-motion';
export default domAnimation;

// components/PageTransition.tsx
export const PageTransition = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <m.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -20 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.3 }}
    >
      {children}
    </m.div>
  );
};
```

**Files to Modify**:
- `Chat.tsx`: Wrap with `PageTransition`
- `Home.tsx`: Wrap with `PageTransition`
- `Library.tsx`: Wrap with `PageTransition`
- `ProfileView.tsx`: Wrap with `PageTransition`

**Modal Animations**:
```typescript
// components/AgentModal.tsx - Update animation
<m.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
  className="modal-content"
>
  {/* Modal content */}
</m.div>
```

---

### 3.2.6: Performance Optimization (Day 3 Afternoon)

**Device Performance Detection**:
```typescript
// utils/performance.ts
export const getDevicePerformanceClass = (): 'low' | 'medium' | 'high' => {
  const cpuCount = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;

  if (cpuCount >= 8 && memory >= 6) return 'high';
  if (cpuCount >= 4 && memory >= 4) return 'medium';
  return 'low';
};

export const animationConfig = {
  duration: getDevicePerformanceClass() === 'low' ? 200 : 400,
  particleCount: getDevicePerformanceClass() === 'low' ? 10 : 50,
  enableComplexAnimations: getDevicePerformanceClass() !== 'low'
};
```

**useReducedMotion Hook** (already exists in Phase 3.1):
```typescript
// Verify all animations respect this hook
const shouldReduceMotion = useReducedMotion();
```

**will-change Optimization**:
```typescript
// hooks/useWillChange.ts
export const useWillChange = (property: string, isAnimating: boolean) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (isAnimating) {
      ref.current.style.willChange = property;
    } else {
      setTimeout(() => {
        if (ref.current) ref.current.style.willChange = 'auto';
      }, 300);
    }
  }, [property, isAnimating]);

  return ref;
};
```

---

## 🌐 Phase 3.3: PWA Implementation

### 3.3.1: Service Worker Setup (Day 4 Morning)

**Vite PWA Configuration**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'eduhu-logo.svg', 'icons/*.png'],

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [
          // API Routes - Network First
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },

          // Images - Cache First
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 2592000 // 30 days
              }
            }
          },

          // InstantDB - Network First with offline fallback
          {
            urlPattern: ({ url }) => url.hostname === 'api.instantdb.com',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'instantdb-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 3600 // 1 hour
              }
            }
          }
        ]
      },

      manifest: {
        name: 'Teacher Assistant - EduHu',
        short_name: 'EduHu',
        description: 'AI-powered teaching assistant with German localization',
        theme_color: '#FB6542',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',

        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],

        shortcuts: [
          {
            name: "Neuer Chat",
            short_name: "Chat",
            description: "Starte einen neuen Chat",
            url: '/chat',
            icons: [{ src: '/icons/chat.png', sizes: '96x96' }]
          },
          {
            name: "Bibliothek",
            short_name: "Library",
            description: "Öffne deine Materialien",
            url: '/library',
            icons: [{ src: '/icons/library.png', sizes: '96x96' }]
          }
        ],

        categories: ['education', 'productivity'],
        lang: 'de',
        dir: 'ltr'
      },

      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ]
});
```

**Service Worker Registration**:
```typescript
// main.tsx - Add SW registration
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Neue Version verfügbar! Jetzt aktualisieren?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ist offline-bereit');
  }
});
```

---

### 3.3.2: IndexedDB Setup (Day 4 Afternoon)

**Database Schema**:
```typescript
// db/schema.ts
import Dexie, { Table } from 'dexie';

export interface Lesson {
  id: string;
  title: string;
  content: string;
  progress: number;
  completed: boolean;
  lastAccessed: Date;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  synced: boolean;
}

export interface PendingSync {
  id?: number;
  action: 'createMessage' | 'updateProgress' | 'createMaterial';
  payload: any;
  timestamp: Date;
  retries: number;
}

export interface UserStats {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  totalLessonsCompleted: number;
  totalXP: number;
}

class EduHuDB extends Dexie {
  lessons!: Table<Lesson, string>;
  chatMessages!: Table<ChatMessage, string>;
  pendingSync!: Table<PendingSync, number>;
  userStats!: Table<UserStats, string>;

  constructor() {
    super('EduHuDB');

    this.version(1).stores({
      lessons: 'id, title, completed, lastAccessed',
      chatMessages: 'id, chatId, timestamp, synced',
      pendingSync: '++id, timestamp, action',
      userStats: 'id, userId, lastActiveDate'
    });
  }
}

export const db = new EduHuDB();
```

**React Hooks for Dexie**:
```typescript
// hooks/useOfflineLessons.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export const useOfflineLessons = () => {
  const lessons = useLiveQuery(
    () => db.lessons
      .where('completed').equals(0)
      .reverse()
      .sortBy('lastAccessed')
  );

  const updateLessonProgress = async (id: string, progress: number) => {
    return await db.lessons.update(id, {
      progress,
      completed: progress >= 100,
      lastAccessed: new Date()
    });
  };

  const cacheLesson = async (lesson: Lesson) => {
    return await db.lessons.put(lesson);
  };

  return { lessons, updateLessonProgress, cacheLesson };
};

// hooks/useOfflineChat.ts
export const useOfflineChat = (chatId: string) => {
  const messages = useLiveQuery(
    () => db.chatMessages
      .where('chatId').equals(chatId)
      .sortBy('timestamp')
  );

  const addMessage = async (message: Omit<ChatMessage, 'id'>) => {
    const id = `msg_${Date.now()}_${Math.random()}`;
    return await db.chatMessages.add({ ...message, id, synced: false });
  };

  const markSynced = async (messageIds: string[]) => {
    return await db.chatMessages.bulkUpdate(
      messageIds.map(id => ({ key: id, changes: { synced: true } }))
    );
  };

  return { messages, addMessage, markSynced };
};
```

---

### 3.3.3: Background Sync (Day 5 Morning)

**Sync Service**:
```typescript
// services/backgroundSync.ts
export const registerBackgroundSync = async () => {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('Background Sync not supported');
    return false;
  }

  const registration = await navigator.serviceWorker.ready;

  try {
    await registration.sync.register('sync-pending-actions');
    return true;
  } catch (err) {
    console.error('Background Sync registration failed:', err);
    return false;
  }
};

export const queueForSync = async (action: string, payload: any) => {
  await db.pendingSync.add({
    action,
    payload,
    timestamp: new Date(),
    retries: 0
  });

  await registerBackgroundSync();
};

// Process sync queue
export const processSyncQueue = async () => {
  const pending = await db.pendingSync.toArray();

  for (const item of pending) {
    try {
      switch (item.action) {
        case 'createMessage':
          await api.createMessage(item.payload);
          break;
        case 'updateProgress':
          await api.updateProgress(item.payload);
          break;
        case 'createMaterial':
          await api.createMaterial(item.payload);
          break;
      }

      await db.pendingSync.delete(item.id!);
    } catch (err) {
      // Retry logic
      if (item.retries < 3) {
        await db.pendingSync.update(item.id!, { retries: item.retries + 1 });
      } else {
        console.error('Sync failed after 3 retries:', item);
      }
    }
  }
};
```

**Service Worker Sync Handler**:
```typescript
// public/sw.js (custom service worker)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(processSyncQueue());
  }
});
```

---

### 3.3.4: Install Prompt (Day 5 Afternoon)

**Install Prompt Hook**:
```typescript
// hooks/useInstallPrompt.ts
export const useInstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!promptEvent) return null;

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
      // Track analytics
      gtag?.('event', 'pwa_installed');
    }

    setPromptEvent(null);
    setIsInstallable(false);

    return outcome;
  }, [promptEvent]);

  return { isInstallable, promptInstall };
};
```

**Install Banner Component**:
```typescript
// components/InstallBanner.tsx
export const InstallBanner = () => {
  const { isInstallable, promptInstall } = useInstallPrompt();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isInstallable) return;

    // Show after 2+ visits OR 30+ seconds
    const visits = parseInt(localStorage.getItem('visit-count') || '0');
    localStorage.setItem('visit-count', (visits + 1).toString());

    if (visits >= 2) {
      setTimeout(() => setShowBanner(true), 30000);
    }
  }, [isInstallable]);

  if (!showBanner) return null;

  return (
    <m.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-20 left-4 right-4 bg-white border border-primary rounded-2xl shadow-lg p-4 z-50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/eduhu-logo.svg" alt="EduHu" className="w-12 h-12" />
          <div>
            <h3 className="font-semibold text-gray-900">App installieren</h3>
            <p className="text-sm text-gray-600">Schnellerer Zugriff, offline nutzbar</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBanner(false)}
            className="px-3 py-1 text-sm text-gray-600"
          >
            Nicht jetzt
          </button>
          <button
            onClick={() => {
              promptInstall();
              setShowBanner(false);
            }}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm"
          >
            Installieren
          </button>
        </div>
      </div>
    </m.div>
  );
};
```

---

### 3.3.5: Mobile Polish (Day 6)

**Safe Area Handling**:
```css
/* index.css - Add safe area variables */
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}

/* Apply to header */
.app-header {
  padding-top: max(16px, var(--safe-area-inset-top));
  padding-left: max(16px, var(--safe-area-inset-left));
  padding-right: max(16px, var(--safe-area-inset-right));
}

/* Apply to bottom navigation */
.bottom-nav {
  padding-bottom: max(16px, var(--safe-area-inset-bottom));
}
```

**Pull-to-Refresh**:
```typescript
// hooks/usePullRefresh.ts
export const usePullRefresh = ({
  onRefresh,
  triggerThreshold = 100,
  maxPullDown = 150
}: {
  onRefresh: () => Promise<void>;
  triggerThreshold?: number;
  maxPullDown?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0) return;

      const currentY = e.touches[0].clientY;
      const dy = Math.min(currentY - startY, maxPullDown);

      if (dy > 0) {
        e.preventDefault();
        setPullDistance(dy);
        container.style.transform = `translateY(${dy}px)`;
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > triggerThreshold) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }

      container.style.transition = 'transform 0.3s ease-in-out';
      container.style.transform = 'translateY(0)';

      setTimeout(() => {
        container.style.transition = '';
        setPullDistance(0);
        startY = 0;
      }, 300);
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, triggerThreshold, maxPullDown, onRefresh]);

  return { containerRef, isRefreshing, pullDistance };
};
```

**Swipe Gestures** (for chat navigation):
```typescript
// components/SwipeableChat.tsx
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

export const SwipeableChat = ({ chatId, onSwipeLeft, onSwipeRight }) => {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(({ down, movement: [mx], velocity: [vx], direction: [xDir] }) => {
    const trigger = Math.abs(vx) > 0.2;
    const isLeft = xDir < 0;

    if (!down && trigger) {
      if (isLeft && onSwipeLeft) {
        onSwipeLeft();
      } else if (!isLeft && onSwipeRight) {
        onSwipeRight();
      }
    }

    api.start({
      x: down ? mx : trigger ? xDir * 400 : 0,
      immediate: down
    });
  }, {
    axis: 'x',
    bounds: { left: -400, right: 400 },
    rubberband: true
  });

  return (
    <animated.div {...bind()} style={{ x, touchAction: 'none' }}>
      {/* Chat content */}
    </animated.div>
  );
};
```

---

## 🧪 Testing Strategy

### Unit Tests (Phase 3.2)
```typescript
// __tests__/useHaptic.test.ts
describe('useHaptic', () => {
  it('should call vibrate on tap', () => {
    const { result } = renderHook(() => useHaptic());
    const vibrateSpy = jest.spyOn(navigator, 'vibrate');

    result.current.tap();

    expect(vibrateSpy).toHaveBeenCalledWith(10);
  });
});

// __tests__/StreakCounter.test.tsx
describe('StreakCounter', () => {
  it('should display correct streak days', () => {
    const { getByText } = render(<StreakCounter days={7} />);

    expect(getByText('7')).toBeInTheDocument();
    expect(getByText('day streak')).toBeInTheDocument();
  });
});
```

### E2E Tests (Phase 3.3)
```typescript
// e2e-tests/pwa-installation.spec.ts
import { test, expect } from '@playwright/test';

test('PWA should be installable', async ({ page, context }) => {
  await page.goto('http://localhost:5175');

  // Wait for service worker registration
  await page.waitForTimeout(2000);

  // Check manifest
  const manifestLink = await page.locator('link[rel="manifest"]');
  expect(await manifestLink.getAttribute('href')).toBe('/manifest.webmanifest');

  // Check service worker
  const swRegistered = await page.evaluate(() => {
    return 'serviceWorker' in navigator;
  });
  expect(swRegistered).toBe(true);
});

// e2e-tests/offline-functionality.spec.ts
test('should work offline', async ({ page, context }) => {
  await page.goto('http://localhost:5175');
  await page.waitForLoadState('networkidle');

  // Go offline
  await context.setOffline(true);

  // Navigate to library
  await page.locator('ion-tab-button[tab="library"]').click();

  // Should still show cached content
  await expect(page.locator('.library-material')).toBeVisible();
});
```

### Lighthouse Audits
```bash
# Run Lighthouse from CLI
lighthouse http://localhost:5175 --view --preset=desktop
lighthouse http://localhost:5175 --view --preset=mobile --emulated-form-factor=mobile

# CI Integration
npm run lighthouse:ci
```

---

## 📊 Performance Budgets

```json
{
  "budgets": [
    {
      "path": "/*",
      "timings": [
        { "metric": "interactive", "budget": 3800 },
        { "metric": "first-contentful-paint", "budget": 1800 }
      ],
      "resourceSizes": [
        { "resourceType": "script", "budget": 300 },
        { "resourceType": "stylesheet", "budget": 50 },
        { "resourceType": "image", "budget": 200 },
        { "resourceType": "total", "budget": 600 }
      ]
    }
  ]
}
```

---

## 🚀 Deployment Checklist

### Before Deployment
- [ ] Run Lighthouse audits (target: Performance > 85, PWA = 100)
- [ ] Test on real iOS device (iPhone 12+)
- [ ] Test on real Android device (Pixel 5+)
- [ ] Verify offline functionality
- [ ] Test install prompt on both platforms
- [ ] Check bundle size (< 300KB gzipped)
- [ ] Verify all animations run at 60fps
- [ ] Test with `prefers-reduced-motion` enabled
- [ ] Verify safe area handling on iOS notch devices

### Deployment Steps
1. Build production bundle: `npm run build`
2. Run Lighthouse CI: `npm run lighthouse:ci`
3. Deploy to Vercel/Netlify
4. Verify PWA manifest loads correctly
5. Test service worker updates
6. Monitor Core Web Vitals

---

## 🔄 Migration Strategy

### Existing Features Integration

**Chat Context Preservation** (BUG-017 fix):
- Offline chat messages stored in IndexedDB
- Background sync when connectivity returns
- Context preserved across app restarts

**Agent System Integration**:
- Agent results trigger celebration confetti
- Progress rings show agent completion
- Haptic feedback on agent actions

**InstantDB Integration**:
- Network First caching for InstantDB API
- Optimistic UI updates with rollback
- Background sync for mutations

---

## 📚 Reference Documentation

### Internal Docs
- `.specify/specs/emotional-design-pwa/spec.md` (Requirements)
- `docs/project-management/roadmap-redesign-2025.md` (Phase 3 goals)
- `teacher-assistant/frontend/src/lib/motion-tokens.ts` (Animation constants)
- `teacher-assistant/frontend/src/lib/design-tokens.ts` (Gemini colors)

### External Resources
- Framer Motion: https://www.framer.com/motion/
- Vite PWA: https://vite-pwa-org.netlify.app/
- Dexie.js: https://dexie.org/
- @use-gesture: https://use-gesture.netlify.app/
- Workbox: https://developer.chrome.com/docs/workbox/

---

**Next Steps**: Create `tasks.md` with actionable implementation tasks
