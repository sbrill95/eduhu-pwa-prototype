# Home Screen Redesign - Specification

**Feature Name**: Custom Prompt Tiles (Kacheln) auf Home Screen
**Priority**: ⭐⭐⭐ P0 (Critical - First Impression)
**Created**: 2025-10-01
**Status**: Specification
**Related Roadmap**: Phase 2.1

---

## 🎯 Problem Statement

**Current State**:
- Home Screen ist aktuell ein einfacher "Home" View ohne echten Content
- User landen nach Login auf leerem/generic Screen
- Keine direkte Inspiration oder Hilfestellung, wie die App genutzt werden kann
- User müssen selbst überlegen, was sie in den Chat schreiben

**Impact**:
- ❌ Schlechte First Impression
- ❌ User wissen nicht, wo sie anfangen sollen
- ❌ Fehlende "Wow, die App versteht mich"-Moment
- ❌ Keine Personalisierung basierend auf Lehrer-Profil

**User Pain Points**:
> "Ich öffne die App und sehe... nichts. Was soll ich jetzt machen?"
> "Ich habe keine Idee, was ich den Assistenten fragen könnte."
> "Die App kennt doch mein Fach und meine Klasse - warum schlägt sie mir nichts vor?"

---

## 💡 Solution Vision

**Desired State**:
Ein **personalisierter Home Screen** mit **Custom Prompt Kacheln**, die:
1. Basierend auf Lehrer-Profil (Fach, Klasse, Kontext) generiert werden
2. Sofort nutzbare Prompts enthalten (1 Click → Chat startet)
3. Visuell ansprechend und einladend sind (Gemini-inspired Design)
4. Dynamisch sind (täglich neue Vorschläge, basierend auf Nutzung)

**User Journey**:
1. User öffnet App → **sieht 4-6 personalisierte Prompt-Kacheln**
2. User liest Kachel-Titel → "Erstelle ein Mathe-Quiz für 7. Klasse"
3. User klickt Kachel → **Chat öffnet sich mit pre-filled Prompt**
4. User kann Prompt direkt absenden oder anpassen
5. **Wow-Moment**: "Die App versteht, was ich brauche!"

---

## 🎨 User Stories

### US-1: Als Lehrer will ich personalisierte Prompt-Vorschläge sehen
**Als** Mathematik-Lehrer für 7. Klasse
**möchte ich** beim Öffnen der App sofort relevante Prompt-Vorschläge sehen (z.B. "Erstelle Übungsaufgaben Bruchrechnung")
**damit** ich nicht selbst überlegen muss, wie ich die App nutzen kann

**Acceptance Criteria**:
- [ ] Home Screen zeigt 4-6 Kacheln mit personalisierten Prompts
- [ ] Prompts berücksichtigen Fach, Klassenstufe, Schultyp aus Profil
- [ ] Prompts sind actionable (keine generischen "Tipps")
- [ ] Kacheln sind visuell unterscheidbar (Icons, Farben)

### US-2: Als Lehrer will ich mit 1 Click einen Chat starten
**Als** Lehrer
**möchte ich** eine Prompt-Kachel anklicken und sofort den Chat mit diesem Prompt öffnen
**damit** ich schnell und effizient arbeiten kann

**Acceptance Criteria**:
- [ ] Click auf Kachel → Chat-Tab öffnet sich
- [ ] Chat zeigt pre-filled Prompt im Input-Feld
- [ ] User kann Prompt direkt absenden oder anpassen
- [ ] Smooth Transition (Animation)

### US-3: Als Lehrer will ich täglich neue Vorschläge sehen
**Als** Lehrer
**möchte ich** nicht immer die gleichen Prompts sehen
**damit** ich neue Ideen bekomme und die App interessant bleibt

**Acceptance Criteria**:
- [ ] Prompts ändern sich täglich (oder basierend auf Nutzung)
- [ ] "Refresh"-Button zum manuellen Neu-Generieren
- [ ] Mix aus Standard-Prompts und kontext-basierten Prompts
- [ ] Zuletzt genutzte Prompts werden nicht wiederholt (7 Tage)

### US-4: Als Lehrer will ich auf Mobile und Desktop die gleiche Experience haben
**Als** Lehrer
**möchte ich** die Kacheln auf allen Geräten gut bedienen können
**damit** ich flexibel von überall arbeiten kann

**Acceptance Criteria**:
- [ ] Responsive Grid-Layout (Mobile: 1-2 Spalten, Desktop: 2-3 Spalten)
- [ ] Touch-friendly Tap-Targets (min 44px)
- [ ] Smooth Scrolling auf Mobile
- [ ] Desktop: Hover States mit Preview

---

## 🔍 Requirements

### Functional Requirements

#### FR-1: Prompt Generation (Backend)
- **Backend API**: Endpoint `POST /api/prompts/generate-suggestions`
- **Input**: User-Profil (Fach, Klassenstufe, Schultyp, Manual Context)
- **Output**: Array von 4-6 Prompt-Objekten
- **Logic**:
  - Template-based Prompt-Generation (mit Variablen)
  - Context-Injection (Fach, Klasse)
  - Mix aus Standard-Prompts und personalisierten Prompts
  - Randomisierung mit Seed (basierend auf Datum für tägliche Änderung)

**Prompt-Objekt Schema**:
```typescript
interface PromptSuggestion {
  id: string;
  title: string; // "Erstelle ein Mathe-Quiz"
  description: string; // "Bruchrechnung für 7. Klasse"
  prompt: string; // Full prompt text für Chat
  category: 'quiz' | 'worksheet' | 'lesson-plan' | 'image' | 'search' | 'other';
  icon: string; // Icon name (Ionic icons)
  color: string; // Hex color für Kachel
  estimatedTime: string; // "2-3 Minuten"
}
```

#### FR-2: Kachel-Display (Frontend)
- **Component**: `PromptTilesGrid` in Home View
- **Layout**: Responsive Grid (2-3 Spalten Desktop, 1-2 Spalten Mobile)
- **Card Design**: Gemini-inspired (Gradient, Shadow, Hover)
- **Content**: Titel, Beschreibung, Icon, Category Badge

#### FR-3: Click-to-Chat Navigation
- **Action**: Click auf Kachel → Navigate zu Chat-Tab
- **Pre-fill**: Prompt wird in Chat-Input gesetzt
- **Focus**: Cursor im Input-Feld (Desktop) oder Keyboard öffnet (Mobile)
- **Animation**: Smooth Transition (200ms fade)

#### FR-4: Refresh Functionality
- **UI**: Floating Action Button (FAB) oder Header-Button "Neue Vorschläge"
- **Action**: Re-fetch Prompts vom Backend
- **Loading**: Skeleton Screens während Fetch
- **Error Handling**: German error message + Retry

### Non-Functional Requirements

#### NFR-1: Performance
- **Initial Load**: < 500ms (Prompts cached wenn möglich)
- **Refresh**: < 300ms
- **Animation**: 60fps (Smooth Scroll, Hover)

#### NFR-2: Accessibility
- **Keyboard Navigation**: Tab-through Kacheln
- **Screen Reader**: Descriptive labels
- **Color Contrast**: WCAG AA compliant

#### NFR-3: Mobile-First
- **Touch Targets**: Min 44px
- **Responsive**: Works on 320px - 1920px
- **Gestures**: Optional Swipe-to-Refresh

#### NFR-4: German Localization
- **All Text**: German (Prompt-Texte, UI-Labels, Errors)
- **Tone**: Freundlich, professionell, hilfreich

---

## 🎨 Design Guidelines

### Visual Design (Gemini-Inspired)

**Colors**:
- Primary: `#FB6542` (Orange)
- Secondary: `#FFBB00` (Yellow)
- Background: `#D3E4E6` (Light Teal)
- Success: `#4CAF50`
- Accent: Gradient `from-[#FB6542] to-[#FFBB00]`

**Typography**:
- Titel: `font-semibold text-lg` (18px)
- Beschreibung: `text-sm text-gray-600` (14px)
- Category Badge: `text-xs uppercase` (12px)

**Spacing**:
- Grid Gap: `gap-4` (16px)
- Card Padding: `p-4` (16px)
- Margin: `mb-6` (24px)

**Shadows & Borders**:
- Card Shadow: `shadow-md hover:shadow-lg`
- Border Radius: `rounded-xl` (12px)
- Hover Scale: `scale-105`

### Card Layout
```
┌─────────────────────────────┐
│  [Icon]         [Category]  │
│                             │
│  Erstelle Mathe-Quiz        │ ← Title (bold)
│  Bruchrechnung für 7. Kl.   │ ← Description
│                             │
│  ⏱️ 2-3 Minuten              │ ← Estimated Time
└─────────────────────────────┘
```

### Grid Layout
- **Mobile (< 768px)**: 1 Spalte
- **Tablet (768px - 1024px)**: 2 Spalten
- **Desktop (> 1024px)**: 3 Spalten

---

## 🔗 Dependencies

### Backend Dependencies
- User-Profil aus InstantDB (`teacher_profiles` table)
- Manual Context aus InstantDB (`context_items` table)
- OpenAI API (optional: AI-generierte Prompts statt Templates)

### Frontend Dependencies
- Home View Component (bereits vorhanden)
- Chat Navigation (bereits vorhanden)
- Ionic Icons (bereits integriert)
- Tailwind CSS (bereits konfiguriert)

### External Dependencies
- Keine neuen Dependencies nötig ✅

---

## 🚀 Success Criteria

### Definition of Done
- [ ] Backend API generiert 4-6 personalisierte Prompts
- [ ] Frontend zeigt Kacheln im Gemini-Design
- [ ] Click auf Kachel öffnet Chat mit pre-filled Prompt
- [ ] Responsive auf Mobile und Desktop
- [ ] Refresh-Button funktioniert
- [ ] German Localization complete
- [ ] Unit Tests: 80%+ Coverage
- [ ] Integration Tests: Happy Path + Error Cases
- [ ] QA Approval: No critical bugs

### Key Metrics
- **User Engagement**: 70%+ der User klicken mindestens 1 Kachel pro Session
- **First Impression**: User sehen Kacheln innerhalb von 500ms nach Login
- **Personalization**: Prompts sind relevant für User-Profil (80%+ Match)

### User Satisfaction
> "Wow, die App schlägt mir genau vor, was ich brauche!"
> "Ich muss nicht mehr überlegen, was ich schreiben soll."
> "Die Vorschläge sind täglich neu - super!"

---

## 🔄 Future Enhancements (Out of Scope for v1)

### Phase 2 (Later)
- [ ] AI-generierte Prompts (statt Templates)
- [ ] User Feedback ("War dieser Vorschlag hilfreich?")
- [ ] Favoriten-Kacheln (User kann Prompts bookmarken)
- [ ] Kachel-Kategorien filtern (nur Quiz, nur Bilder, etc.)
- [ ] Swipe-Gestures für Kachel-Carousel
- [ ] A/B Testing für Prompt-Varianten

### Phase 3 (Nice to Have)
- [ ] Prompt History ("Zuletzt verwendete Prompts")
- [ ] Prompt Sharing (Lehrer teilen Prompts mit Kollegen)
- [ ] Adaptive Learning (je mehr genutzt, desto besser die Vorschläge)

---

## 📊 Analytics & Monitoring

### Events to Track
- `prompt_tile_viewed` - User sieht Home Screen
- `prompt_tile_clicked` - User klickt Kachel
- `prompt_refreshed` - User refresht Vorschläge
- `prompt_used` - User sendet pre-filled Prompt ab
- `prompt_modified` - User ändert Prompt vor Absenden

### Metrics to Monitor
- Click-Through-Rate (CTR) pro Kachel-Kategorie
- Time-to-First-Click (wie schnell klickt User erste Kachel)
- Prompt Modification Rate (wie oft wird Prompt angepasst)
- Error Rate (Backend-Fehler bei Prompt-Generation)

---

## 🎯 Constraints & Assumptions

### Constraints
- **Time**: 2-3 Tage Implementierung
- **Scope**: 4-6 Prompts (nicht mehr, um nicht zu überfordern)
- **Design**: Muss Gemini Mockup folgen (Colors, Spacing)

### Assumptions
- User-Profil ist bereits ausgefüllt (Fach, Klasse, Schultyp)
- Backend kann Prompts schnell generieren (< 200ms)
- User versteht, dass Kacheln clickable sind (visuelles Feedback nötig)

---

## 📚 References

- **Roadmap**: `/docs/project-management/roadmap-redesign-2025.md` (Phase 2.1)
- **Gemini Mockup**: (Link zum HTML-Mockup mit Kachel-Design)
- **Emotional Design**: `.claude/agents/emotional-design-specialist.md`
- **Similar Features**: Duolingo Daily Quests, ChatGPT Prompt Suggestions

---

## ✅ Approval

**Specification Status**: ✅ Ready for Planning
**Next Step**: Create `plan.md` (Technical Design)
**Assigned Agents**:
- Backend-Agent: Prompt Generation API
- Frontend-Agent: Kachel-Grid Component, Navigation
- Emotional-Design-Agent: Hover States, Animations, Visual Polish

---

**Created**: 2025-10-01
**Author**: General-Purpose Agent
**Review Status**: Pending User Approval
