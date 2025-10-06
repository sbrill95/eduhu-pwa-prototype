# Visual Redesign - Gemini Design Language

**Feature Name**: Visual Redesign (Gemini Mockup)
**Priority**: ⭐⭐⭐ P0 (Critical - Phase 3.1)
**Created**: 2025-10-01
**Status**: Specification
**Related Roadmap**: Phase 3.1 - Emotional Design Polish

---

## 🎯 Problem Statement

**Current State**:
- App nutzt Cyan (`#0dcaf0`) als Primary Color (inkonsistent mit Gemini Mockup)
- Keine konsistente Design Language (Mix aus Ionic Standard + Custom Styles)
- Fehlende Design Tokens (Colors, Typography, Spacing hardcoded)
- Keine Animation System (nur vereinzelte CSS Keyframes)
- Views sehen "functional" aus, nicht "lovable"

**Impact**:
- ❌ Inkonsistentes Branding (Cyan vs. Gemini Orange)
- ❌ Schlechte Developer Experience (keine Design Tokens)
- ❌ Fehlende Emotional Connection (keine Animationen, kein Polish)
- ❌ App fühlt sich "unfinished" an (trotz funktionierender Features)

**User Pain Points**:
> "Die App funktioniert, aber fühlt sich nicht premium an."
> "Die Farben passen nicht zusammen (Cyan vs. Orange im Agent Modal)."
> "Es fehlt das gewisse Etwas - keine Animationen, keine Freude."

---

## 💡 Solution Vision

**Desired State**:
Eine **konsistente, visuell ansprechende App** mit dem **Gemini Design Language**:
1. **Gemini Colors**: Orange (`#FB6542`), Yellow (`#FFBB00`), Teal (`#D3E4E6`)
2. **Design Token System**: Zentrale Verwaltung aller Design-Werte
3. **Inter Font**: Google Font für moderne, klare Typografie
4. **Motion System**: Framer Motion für smooth, 60fps Animationen
5. **Ionic Components**: Behalten, aber mit Gemini-Styling

**User Journey**:
1. User öffnet App → **Sieht konsistentes Orange/Yellow/Teal Design**
2. User navigiert durch Views → **Smooth Transitions, einheitliches Look & Feel**
3. User interagiert mit Buttons/Cards → **Subtle Hover-Animationen, Tactile Feedback**
4. User nutzt Agent → **Agent Modal passt perfekt zum Rest der App**
5. **Wow-Moment**: "Die App sieht jetzt richtig professionell aus!"

---

## 🎨 User Stories

### US-1: Als Developer will ich Design Tokens verwenden
**Als** Frontend Developer
**möchte ich** zentrale Design Tokens für Colors, Typography, Spacing
**damit** ich keine Werte hardcoden muss und konsistent bleibe

**Acceptance Criteria**:
- [ ] TypeScript Constants in `frontend/src/lib/designTokens.ts`
- [ ] CSS Variables in `frontend/src/index.css`
- [ ] Gemini Colors definiert: Primary (`#FB6542`), Secondary (`#FFBB00`), Background (`#D3E4E6`)
- [ ] Typography Scale: `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`
- [ ] Spacing Scale: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`
- [ ] Border Radius Scale: `sm`, `md`, `lg`, `xl`, `2xl`
- [ ] Shadow Scale: `sm`, `md`, `lg`, `xl`

### US-2: Als User will ich konsistente Gemini-Farben sehen
**Als** Teacher
**möchte ich** überall in der App die gleichen Farben (Orange/Yellow/Teal) sehen
**damit** die App professionell und konsistent wirkt

**Acceptance Criteria**:
- [ ] Cyan (`#0dcaf0`) komplett entfernt
- [ ] Primary Color: Orange (`#FB6542`) überall
- [ ] Secondary Color: Yellow (`#FFBB00`) für Highlights
- [ ] Background: Teal (`#D3E4E6`) für Surfaces
- [ ] Tailwind Config updated mit Gemini Colors
- [ ] Tab Bar: Orange Active State
- [ ] Chat Bubbles: User = Orange, Bot = Gray
- [ ] Prompt Tiles: Gradient Cards mit Gemini Colors

### US-3: Als Developer will ich Framer Motion nutzen
**Als** Frontend Developer
**möchte ich** Framer Motion für Animationen verwenden
**damit** ich smooth, deklarative Animationen bauen kann

**Acceptance Criteria**:
- [ ] `framer-motion` installiert
- [ ] Motion System in `frontend/src/lib/motionSystem.ts`
- [ ] Durations definiert: `fast: 150ms`, `normal: 300ms`, `slow: 500ms`
- [ ] Easings definiert: `smooth`, `bounce`
- [ ] Common Variants: `fadeIn`, `slideUp`, `scaleIn`
- [ ] Documentation für Agents (wie man Framer Motion nutzt)

### US-4: Als User will ich eine schöne Home View sehen
**Als** Teacher
**möchte ich** beim Öffnen der App eine schön gestaltete Home View sehen
**damit** ich mich sofort wohl fühle und inspiriert bin

**Acceptance Criteria**:
- [ ] Prompt Tiles: Gemini Design (Gradient Cards, Icons, Farben)
- [ ] "Neuigkeiten & Updates": Deaktiviert (CSS oder Feature Flag)
- [ ] "Letzte Chats": Gemini Cards statt Ionic Standard
- [ ] "Materialien": Gemini Cards statt Ionic Standard
- [ ] **Neue Card**: "Kalender" Placeholder (für zukünftige Events)
- [ ] Inter Font überall
- [ ] Responsive: Mobile & Desktop

### US-5: Als User will ich schöne Chat-Bubbles sehen
**Als** Teacher
**möchte ich** im Chat klare, schön gestaltete Nachrichten sehen
**damit** die Kommunikation mit dem Assistenten angenehm ist

**Acceptance Criteria**:
- [ ] User Bubbles: Orange Background (`#FB6542`), White Text
- [ ] Bot Bubbles: Gray Background (`#f3f4f6`), Dark Text
- [ ] Rounded Corners: `rounded-2xl` (wie Gemini Mockup)
- [ ] Agent Messages: Gemini Styling beibehalten (bereits gut)
- [ ] Chat Input: Gemini Styling (Orange Send-Button)

### US-6: Als User will ich eine konsistente Tab Bar sehen
**Als** Teacher
**möchte ich** eine klar erkennbare Navigation sehen
**damit** ich immer weiß, wo ich bin

**Acceptance Criteria**:
- [ ] Tab Namen bleiben: Home, Chat, Library
- [ ] Active State: Orange (`#FB6542`)
- [ ] Inactive State: Gray (`#9ca3af`)
- [ ] Icons: Ionic Icons (beibehalten)
- [ ] Smooth Transition zwischen Tabs

### US-7: Als User will ich eine schöne Library sehen
**Als** Teacher
**möchte ich** meine Materialien in einer schön gestalteten Bibliothek sehen
**damit** ich gerne damit arbeite

**Acceptance Criteria**:
- [ ] Library Aufbau: Wie aktuell (aus Phase 3: Materials Unification)
- [ ] Gemini Colors: Orange Accents, Teal Backgrounds
- [ ] Cards: Gemini Design (statt Ionic Standard)
- [ ] Filter Chips: Orange/Yellow statt Cyan
- [ ] Material Preview Modal: Gemini Styling

---

## 🔍 Requirements

### Functional Requirements

#### FR-1: Design Token System
**File**: `frontend/src/lib/designTokens.ts`
```typescript
export const colors = {
  primary: {
    50: '#fef7f0',
    500: '#FB6542', // Main
    700: '#c53727',
  },
  secondary: {
    500: '#FFBB00',
  },
  background: {
    teal: '#D3E4E6',
    gray: '#f3f4f6',
  },
  text: {
    dark: '#1f2937',
    medium: '#6b7280',
    light: '#9ca3af',
  }
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
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  }
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const;
```

#### FR-2: Motion System (Framer Motion)
**File**: `frontend/src/lib/motionSystem.ts`
```typescript
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
} as const;

export const easings = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// Common Animation Variants (for later use)
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};
```

#### FR-3: CSS Variables Update
**File**: `frontend/src/index.css`
```css
:root {
  /* Gemini Colors */
  --color-primary: #FB6542;
  --color-primary-50: #fef7f0;
  --color-primary-500: #FB6542;
  --color-primary-700: #c53727;

  --color-secondary: #FFBB00;

  --color-background-teal: #D3E4E6;
  --color-background-gray: #f3f4f6;

  /* Update Ionic Colors */
  --ion-color-primary: #FB6542;
  --ion-color-primary-rgb: 251, 101, 66;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-shade: #c53727;
  --ion-color-primary-tint: #fb7556;

  --ion-color-secondary: #FFBB00;

  /* Typography (Inter Font) */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Tab Bar */
  --ion-tab-bar-color: #9ca3af;
  --ion-tab-bar-color-selected: #FB6542;
}

/* Inter Font Import */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: var(--font-family-primary);
}
```

#### FR-4: Tailwind Config Update
**File**: `frontend/tailwind.config.js`
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary': {
          50: '#fef7f0',
          100: '#feeedb',
          200: '#fbd9b7',
          300: '#f8c088',
          400: '#f49e57',
          500: '#FB6542', // Main
          600: '#ec4c30',
          700: '#c53727',
          800: '#9d2d25',
          900: '#802724',
        },
        'secondary': {
          500: '#FFBB00',
        },
        'background-teal': '#D3E4E6',
        'background-gray': '#f3f4f6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

#### FR-5: Home View Redesign
- **Prompt Tiles**: Gemini Gradient Cards
- **Neuigkeiten**: Deaktivieren (Feature Flag oder CSS `display: none`)
- **Kalender Card**: Placeholder für zukünftige Events
- **Letzte Chats**: Gemini Cards
- **Materialien**: Gemini Cards

#### FR-6: Chat View Redesign
- **User Bubbles**: Orange (`#FB6542`), White Text, `rounded-2xl`
- **Bot Bubbles**: Gray (`#f3f4f6`), Dark Text, `rounded-2xl`
- **Agent Messages**: Gemini Styling beibehalten
- **Input**: Orange Send-Button

#### FR-7: Library View Redesign
- **Aufbau**: Wie aktuell (Phase 3)
- **Colors**: Gemini (Orange Accents, Teal Backgrounds)
- **Cards**: Gemini Design
- **Filter Chips**: Orange/Yellow

#### FR-8: Tab Bar Redesign
- **Active State**: Orange (`#FB6542`)
- **Inactive State**: Gray (`#9ca3af`)
- **Tab Namen**: Home, Chat, Library (bleiben)
- **Icons**: Ionic Icons (bleiben)

### Non-Functional Requirements

#### NFR-1: Performance
- **Framer Motion**: 60fps Animationen
- **CSS**: Hardware-accelerated (transform, opacity)
- **Bundle Size**: Framer Motion ~60kb (akzeptabel)

#### NFR-2: Accessibility
- **Color Contrast**: WCAG AA compliant (Orange/White, Gray/Dark)
- **Font Sizes**: Min 16px für Mobile (iOS zoom prevention)
- **Focus States**: Visible outlines

#### NFR-3: Mobile-First
- **Responsive**: Tailwind Breakpoints (`sm:`, `md:`, `lg:`)
- **Touch Targets**: Min 44px
- **Safe Areas**: iOS Notch Support

#### NFR-4: Developer Experience
- **Type Safety**: TypeScript Constants für Design Tokens
- **Autocomplete**: IntelliSense für Colors, Spacing, etc.
- **Documentation**: Agent-friendly Docs

---

## 🔗 Dependencies

### New Dependencies
- **Framer Motion**: `npm install framer-motion`
- **Inter Font**: Google Fonts CDN (kein npm package)

### Existing Dependencies
- ✅ Tailwind CSS (bereits installiert)
- ✅ Ionic Components (bereits installiert)
- ✅ Ionic Icons (bereits installiert)

---

## 🚀 Success Criteria

### Definition of Done
- [ ] Design Token System implementiert (TypeScript + CSS)
- [ ] Framer Motion installiert
- [ ] Motion System definiert (Durations, Easings, Variants)
- [ ] Gemini Colors überall (Cyan entfernt)
- [ ] Inter Font überall
- [ ] Home View: Gemini Design
- [ ] Chat View: Gemini Bubbles
- [ ] Library View: Gemini Colors
- [ ] Tab Bar: Orange Active State
- [ ] All Components responsive (Mobile & Desktop)
- [ ] QA Approval: No visual bugs

### Key Metrics
- **Visual Consistency**: 100% Gemini Colors (kein Cyan mehr)
- **Type Safety**: 100% Design Tokens (keine hardcoded Werte)
- **Performance**: 60fps Animationen (Framer Motion)
- **Bundle Size**: <100kb Increase (Framer Motion ~60kb)

### User Satisfaction
> "Wow, die App sieht jetzt richtig professionell aus!"
> "Endlich konsistente Farben - alles passt zusammen."
> "Die Animationen machen die App so viel angenehmer."

---

## 🔄 Future Enhancements (Out of Scope for v1)

### Phase 3.2 - Micro-Interactions (Later)
- [ ] Framer Motion Animationen aktivieren (aktuell nur installiert)
- [ ] Hover States mit Scale/Shadow
- [ ] Success Celebrations (Confetti, Bounce)
- [ ] Loading Skeletons (Framer Motion)
- [ ] Page Transitions (Smooth Fade)

### Phase 3.3 - Advanced Animations (Later)
- [ ] Stagger Animations (Listen)
- [ ] Gesture Animations (Swipe, Drag)
- [ ] Parallax Effects
- [ ] Lottie Animations (Illustrations)

---

## 📊 Analytics & Monitoring

### Events to Track (Optional)
- `visual_redesign_completed` - Redesign deployed
- `gemini_colors_applied` - User sieht neue Farben
- `framer_motion_loaded` - Library geladen

### Metrics to Monitor
- Bundle Size (vor/nach Framer Motion)
- Performance (FPS bei Animationen)
- User Feedback (qualitativ)

---

## 🎯 Constraints & Assumptions

### Constraints
- **Time**: 2-3 Tage (Step-by-Step)
- **Scope**: Visual Redesign only (keine neuen Features)
- **Tech Stack**: Ionic Components behalten (nicht ersetzen)

### Assumptions
- Ionic Components lassen sich gut mit Gemini-Styling anpassen
- Framer Motion funktioniert gut mit Ionic/React
- Inter Font lädt schnell über Google Fonts CDN
- User haben moderne Browser (Framer Motion Support)

---

## 📚 References

- **Gemini Mockup**: `/docs/guides/gemini-prototype.txt`
- **Roadmap**: `/docs/project-management/roadmap-redesign-2025.md` (Phase 3.1)
- **Framer Motion Docs**: https://www.framer.com/motion/
- **Inter Font**: https://fonts.google.com/specimen/Inter

---

## ✅ Approval

**Specification Status**: ✅ Ready for Planning
**Next Step**: Create `plan.md` (Technical Design)
**Assigned Agents**:
- Frontend-Agent: Component Redesign, Styling
- Emotional-Design-Agent: Polish, Animations (Phase 3.2)
- QA-Agent: Visual Testing, Approval

---

**Created**: 2025-10-01
**Author**: General-Purpose Agent
**Review Status**: User Approved
