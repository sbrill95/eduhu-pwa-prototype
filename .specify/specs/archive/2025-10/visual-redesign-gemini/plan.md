# Visual Redesign - Technical Plan

**Feature**: Gemini Design Language Implementation
**Created**: 2025-10-01
**Status**: Technical Planning
**Related**: [spec.md](spec.md)

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Design System Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Design Tokens (TypeScript)                          │  │
│  │  - frontend/src/lib/designTokens.ts                  │  │
│  │  - Colors, Typography, Spacing, Radius, Shadows      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CSS Variables (Runtime Theming)                     │  │
│  │  - frontend/src/index.css                            │  │
│  │  - CSS Custom Properties                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tailwind Config                                      │  │
│  │  - frontend/tailwind.config.js                       │  │
│  │  - Gemini Colors Extended                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Motion System Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Framer Motion System                                │  │
│  │  - frontend/src/lib/motionSystem.ts                  │  │
│  │  - Durations, Easings, Variants                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ (To be used in Phase 3.2)         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Home View                                            │  │
│  │  - Prompt Tiles (Gemini Cards)                       │  │
│  │  - Calendar Placeholder                               │  │
│  │  - Gemini Sections                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Chat View                                            │  │
│  │  - Gemini Bubbles (Orange User, Gray Bot)           │  │
│  │  - Orange Send Button                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Library View                                         │  │
│  │  - Gemini Cards & Colors                             │  │
│  │  - Orange Filter Chips                                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tab Bar                                              │  │
│  │  - Orange Active State                                │  │
│  │  - Gray Inactive State                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Data Model

### Design Tokens Structure

```typescript
// frontend/src/lib/designTokens.ts

export const colors = {
  primary: {
    50: '#fef7f0',
    100: '#feeedb',
    200: '#fbd9b7',
    300: '#f8c088',
    400: '#f49e57',
    500: '#FB6542', // Main brand color
    600: '#ec4c30',
    700: '#c53727',
    800: '#9d2d25',
    900: '#802724',
  },
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#FFBB00', // Main secondary
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  background: {
    teal: '#D3E4E6',
    gray: '#f3f4f6',
    white: '#ffffff',
  },
  text: {
    dark: '#1f2937',
    medium: '#6b7280',
    light: '#9ca3af',
  },
} as const;

export const typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;

// Type Helpers
export type ColorKey = keyof typeof colors;
export type TypographyKey = keyof typeof typography;
export type SpacingKey = keyof typeof spacing;
```

### Motion System Structure

```typescript
// frontend/src/lib/motionSystem.ts

export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
} as const;

export const easings = {
  smooth: [0.4, 0, 0.2, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  linear: [0, 0, 1, 1] as const,
} as const;

// Animation Variants (for Phase 3.2)
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: durations.normal, ease: easings.smooth },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: durations.normal, ease: easings.smooth },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: durations.normal, ease: easings.smooth },
};

export const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};
```

---

## 🔧 Implementation Details

### Step 1: Foundation (Design Tokens & Motion System)

#### 1.1 Install Dependencies
```bash
cd teacher-assistant/frontend
npm install framer-motion
```

#### 1.2 Create Design Tokens
**File**: `frontend/src/lib/designTokens.ts`
- Export all design constants
- Add TypeScript types for autocomplete
- Document usage for agents

#### 1.3 Create Motion System
**File**: `frontend/src/lib/motionSystem.ts`
- Export durations, easings
- Export animation variants (for Phase 3.2)
- Document Framer Motion usage

#### 1.4 Update CSS Variables
**File**: `frontend/src/index.css`
- Add Gemini colors to `:root`
- Update Ionic color variables
- Import Inter font from Google Fonts
- Remove all Cyan references

#### 1.5 Update Tailwind Config
**File**: `frontend/tailwind.config.js`
- Extend colors with Gemini palette
- Add Inter to font family
- Ensure all custom colors available in Tailwind classes

---

### Step 2: Home View Redesign

#### 2.1 Prompt Tiles Gemini Design
**File**: `frontend/src/components/PromptTile.tsx`

**Changes**:
- Card Background: White with Orange left border
- Gradient Background (optional): `bg-gradient-to-r from-primary-50 to-secondary-50`
- Icon Circle: Orange background (`bg-primary-100`), Primary icon color
- Category Badge: Orange/Yellow (`bg-primary-500` or `bg-secondary-500`)
- Hover: `hover:scale-105 hover:shadow-lg transition-all duration-200`

**Example Structure**:
```tsx
<IonCard className="relative bg-white rounded-xl border-l-4 border-primary-500 hover:scale-105 hover:shadow-lg transition-all duration-200">
  <IonCardContent className="p-4">
    {/* Icon Circle */}
    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
      <IonIcon icon={icon} className="text-2xl text-primary-500" />
    </div>

    {/* Category Badge */}
    <span className="absolute top-4 right-4 px-2 py-1 rounded-full bg-primary-500 text-white text-xs font-semibold uppercase">
      {category}
    </span>

    {/* Title & Description */}
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 mb-3">{description}</p>

    {/* Estimated Time */}
    <div className="flex items-center text-xs text-gray-500">
      <IonIcon icon={timeOutline} className="mr-1" />
      {estimatedTime}
    </div>
  </IonCardContent>
</IonCard>
```

#### 2.2 Deactivate "Neuigkeiten & Updates"
**File**: `frontend/src/pages/Home/Home.tsx`

**Option A - CSS (Preferred)**:
```tsx
<IonCard style={{ display: 'none' }} data-feature="news-updates">
  {/* Keep code intact for future */}
</IonCard>
```

**Option B - Feature Flag**:
```tsx
{featureFlags.newsUpdates && (
  <IonCard>...</IonCard>
)}
```

#### 2.3 Add Calendar Placeholder Card
**File**: `frontend/src/pages/Home/Home.tsx`

**Add after Prompt Tiles**:
```tsx
{/* Calendar Card - Placeholder for Future Events */}
<IonCard className="mb-6 bg-background-teal">
  <IonCardHeader>
    <div className="flex justify-between items-center">
      <IonCardTitle className="text-primary-500">
        Kalender
      </IonCardTitle>
      <IonIcon icon={calendarOutline} className="text-2xl text-primary-500" />
    </div>
  </IonCardHeader>
  <IonCardContent>
    <div className="text-center py-8">
      <IonIcon
        icon={calendarOutline}
        className="text-5xl text-primary-500 opacity-70 mb-4"
      />
      <h3 className="text-lg font-semibold mb-2">
        Termine werden geladen...
      </h3>
      <p className="text-sm text-gray-600">
        Hier werden bald Ihre Kalendereinträge und Termine angezeigt.
      </p>
    </div>
  </IonCardContent>
</IonCard>
```

#### 2.4 Redesign "Letzte Chats" & "Materialien" Sections
**Apply Gemini Cards**:
- White Background
- Orange Title Color (`text-primary-500`)
- Orange Icons
- Subtle Shadow (`shadow-md`)
- Rounded Corners (`rounded-xl`)

---

### Step 3: Tab Bar Redesign

#### 3.1 Update Tab Bar Styling
**File**: `frontend/src/App.tsx` (or where Tab Bar is defined)

**CSS Variables Update** (`index.css`):
```css
:root {
  --ion-tab-bar-background: #ffffff;
  --ion-tab-bar-color: #9ca3af; /* Gray inactive */
  --ion-tab-bar-color-selected: #FB6542; /* Orange active */
}
```

**Component Styling**:
```tsx
<IonTabBar className="border-t border-gray-200">
  <IonTabButton tab="home" className="transition-colors duration-200">
    <IonIcon icon={homeOutline} />
    <IonLabel>Home</IonLabel>
  </IonTabButton>
  {/* Same for Chat, Library */}
</IonTabBar>
```

---

### Step 4: Chat View Redesign

#### 4.1 Gemini Chat Bubbles
**File**: `frontend/src/components/ChatView.tsx`

**User Bubble** (Orange):
```tsx
<div className="flex justify-end mb-4">
  <div className="bg-primary-500 text-white px-4 py-3 rounded-2xl rounded-br-none max-w-xs">
    {message.content}
  </div>
</div>
```

**Bot Bubble** (Gray):
```tsx
<div className="flex justify-start mb-4">
  <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl rounded-bl-none max-w-xs">
    {message.content}
  </div>
</div>
```

#### 4.2 Chat Input Styling
**Orange Send Button**:
```tsx
<IonButton
  type="submit"
  className="bg-primary-500 rounded-xl"
  fill="solid"
>
  <IonIcon icon={sendOutline} />
</IonButton>
```

---

### Step 5: Library View Redesign

#### 5.1 Gemini Cards
**File**: `frontend/src/components/LibraryView.tsx`

**Material Cards**:
```tsx
<IonCard className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
  <IonCardContent className="p-4">
    <div className="flex items-center gap-3">
      {/* Orange Icon */}
      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
        <IonIcon icon={documentOutline} className="text-xl text-primary-500" />
      </div>

      {/* Content */}
      <div className="flex-grow">
        <h3 className="font-semibold text-gray-900">{material.title}</h3>
        <p className="text-sm text-gray-600">{material.type}</p>
      </div>
    </div>
  </IonCardContent>
</IonCard>
```

#### 5.2 Filter Chips Styling
**Orange/Yellow Chips**:
```tsx
<IonChip className="bg-primary-500 text-white">
  <IonLabel>Alle</IonLabel>
</IonChip>

<IonChip className="bg-secondary-500 text-white">
  <IonLabel>Uploads</IonLabel>
</IonChip>
```

---

## 🧪 Testing Strategy

### Unit Tests

**Design Tokens**:
- `designTokens.test.ts`:
  - ✅ All color values are valid hex
  - ✅ All spacing values are valid CSS units
  - ✅ Typography scale is consistent

**Motion System**:
- `motionSystem.test.ts`:
  - ✅ Durations are positive numbers
  - ✅ Easings are valid arrays
  - ✅ Variants have required keys

### Visual Testing

**Manual QA Checklist**:
- [ ] All Cyan colors removed
- [ ] Gemini colors applied everywhere
- [ ] Inter font loaded correctly
- [ ] Tab Bar: Orange active state
- [ ] Chat Bubbles: Orange (user), Gray (bot)
- [ ] Prompt Tiles: Gemini design
- [ ] Library: Gemini cards
- [ ] Responsive: Mobile & Desktop
- [ ] No visual regressions

### Integration Testing

**E2E Tests** (Optional):
- Home View renders with Gemini colors
- Tab Bar changes color on click
- Chat sends message with orange button
- Library displays materials in Gemini cards

---

## 🚀 Deployment Plan

### Step-by-Step Rollout

#### Phase 1: Foundation (4 hours)
1. Install Framer Motion
2. Create `designTokens.ts`
3. Create `motionSystem.ts`
4. Update `index.css` (CSS Variables)
5. Update `tailwind.config.js`
6. Remove all Cyan references

**Deliverables**:
- Design Token System ✅
- Motion System ✅
- Framer Motion installed ✅
- Gemini colors in config ✅

#### Phase 2: Home View (6 hours)
1. Redesign Prompt Tiles (Gemini Cards)
2. Deactivate "Neuigkeiten & Updates"
3. Add Calendar Placeholder Card
4. Redesign "Letzte Chats" section
5. Redesign "Materialien" section
6. Test responsive layout

**Deliverables**:
- Home View: Gemini Design ✅
- Calendar Placeholder ✅
- Sections: Gemini Cards ✅

#### Phase 3: Tab Bar (2 hours)
1. Update CSS Variables (Orange active)
2. Test tab switching
3. Verify mobile & desktop

**Deliverables**:
- Tab Bar: Orange active state ✅

#### Phase 4: Chat View (4 hours)
1. Redesign User Bubbles (Orange)
2. Redesign Bot Bubbles (Gray)
3. Style Chat Input (Orange button)
4. Test message flow

**Deliverables**:
- Chat Bubbles: Gemini Design ✅
- Chat Input: Orange Send Button ✅

#### Phase 5: Library View (2 hours)
1. Redesign Material Cards (Gemini)
2. Update Filter Chips (Orange/Yellow)
3. Test filtering & sorting

**Deliverables**:
- Library: Gemini Cards ✅
- Filter Chips: Orange/Yellow ✅

#### Phase 6: QA & Polish (2 hours)
1. Visual regression testing
2. Mobile testing (real device)
3. Performance check (bundle size)
4. Final approval

**Deliverables**:
- QA Report ✅
- Deployment Approval ✅

**Total**: ~20 hours (2.5 days)

---

## 📊 Success Metrics

- **Visual Consistency**: 100% Gemini Colors (0 Cyan references)
- **Type Safety**: 100% Design Tokens (0 hardcoded values)
- **Bundle Size**: <100kb increase (Framer Motion ~60kb)
- **Performance**: 60fps smooth (Framer Motion animations in Phase 3.2)
- **Mobile**: Works on 320px - 1920px

---

## 🔄 Rollback Plan

If critical bugs occur:
1. **Revert CSS Variables**: Restore old `index.css`
2. **Revert Tailwind Config**: Restore old colors
3. **Hide Redesigned Components**: Use feature flags
4. **Deploy Hotfix**: Revert to previous commit

---

## 📚 Agent Documentation

### For Frontend-Agent

**Design Token Usage**:
```tsx
import { colors, typography, spacing } from '@/lib/designTokens';

// Use TypeScript constants
const myColor = colors.primary[500]; // '#FB6542'

// Or use Tailwind classes
<div className="bg-primary-500 text-white p-md">
```

**Framer Motion Usage** (Phase 3.2):
```tsx
import { motion } from 'framer-motion';
import { fadeIn, slideUp } from '@/lib/motionSystem';

<motion.div {...fadeIn}>
  Content
</motion.div>
```

**Ionic Styling**:
```tsx
// Combine Ionic + Tailwind
<IonButton className="bg-primary-500 rounded-xl">
  Click me
</IonButton>

// Use CSS Parts for deep styling
<IonCard className="custom-card">
  <style>{`
    .custom-card::part(native) {
      background: var(--color-background-teal);
    }
  `}</style>
</IonCard>
```

---

## 🔗 File Structure

```
teacher-assistant/frontend/
├── src/
│   ├── lib/
│   │   ├── designTokens.ts          # NEW - Design Tokens
│   │   ├── motionSystem.ts          # NEW - Motion System
│   │   └── featureFlags.ts          # Existing (for "Neuigkeiten" toggle)
│   ├── components/
│   │   ├── PromptTile.tsx           # MODIFY - Gemini design
│   │   ├── PromptTilesGrid.tsx      # MODIFY - Gemini design
│   │   ├── ChatView.tsx             # MODIFY - Gemini bubbles
│   │   └── LibraryView.tsx          # MODIFY - Gemini cards
│   ├── pages/
│   │   └── Home/
│   │       └── Home.tsx             # MODIFY - Add Calendar, redesign sections
│   ├── App.tsx                      # MODIFY - Tab Bar styling
│   ├── index.css                    # MODIFY - CSS Variables, Inter Font
│   └── App.css                      # MODIFY (if needed)
├── tailwind.config.js               # MODIFY - Gemini colors
├── package.json                     # MODIFY - Add framer-motion
└── package-lock.json                # AUTO-GENERATED
```

---

**Status**: ✅ Ready for Implementation
**Next Step**: Create `tasks.md`

---

**Created**: 2025-10-01
**Author**: General-Purpose Agent
