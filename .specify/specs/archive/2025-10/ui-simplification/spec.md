# UI Simplification - Specification

**Status**: Draft
**Created**: 2025-09-30
**Priority**: P0 (Critical - Foundation Fix)
**Related Roadmap**: Phase 1.1 - Simplification

---

## Problem Statement

### Current Situation ❌

Die App zeigt aktuell den **Onboarding Wizard** bei jedem neuen User, der aber:
1. Nicht fertig/polished ist
2. Den User-Flow unterbricht
3. Zeit kostet bevor User zur App kommt

**Code-Inventory Findings**:
- `OnboardingWizard.tsx`: 690 Zeilen Component
- `useOnboarding.ts`: Hook für Onboarding Logic
- `App.tsx`: Zeigt Onboarding wenn `!isOnboardingComplete`
- **Currently ENABLED** ✅ (wird verwendet)

### Core Issues

1. **Friction beim First Use**: Neuer User muss Wizard durchlaufen bevor App-Nutzung
2. **Unpolished Experience**: Wizard ist funktional aber nicht "lovable"
3. **Development Overhead**: Wartung von unfertigem Feature
4. **Blockiert andere Features**: Library/Chat können nicht sofort genutzt werden

### User Pain Points

> "Ich möchte einfach loslegen, nicht erst 5 Schritte ausfüllen." — Erwartetes Feedback

> "Was muss ich hier alles eingeben bevor ich die App sehen kann?" — Friction Point

---

## Vision & Goals

### Vision

**Direct-to-App Experience**: User sieht nach Login sofort Home Screen und kann direkt Chat/Library nutzen. Onboarding kann später reaktiviert werden wenn es polished ist.

### Goals

1. **Remove Friction**: Kein Wizard-Zwang beim First Use
2. **Quick Access**: User ist in <5 Sekunden produktiv nach Login
3. **Clean Codebase**: Onboarding Code bleibt, wird aber deaktiviert (Feature Flag)
4. **Reversible**: Kann später wieder aktiviert werden

---

## User Stories

### US-1: Direkter Zugang nach Login

**Als** neue Lehrkraft
**möchte ich** nach dem Login direkt zur App kommen
**damit** ich sofort produktiv sein kann

**Acceptance Criteria**:
- ✅ Nach Login → Redirect zu `/home` (nicht `/onboarding`)
- ✅ Home Screen ist sofort sichtbar
- ✅ Chat und Library sind direkt nutzbar
- ✅ Kein Wizard erscheint automatisch

### US-2: Optionales Profil später ausfüllen

**Als** Lehrkraft
**möchte ich** mein Profil später vervollständigen können
**damit** ich nicht gezwungen bin das sofort zu tun

**Acceptance Criteria**:
- ✅ Profile Modal ist zugänglich (über Tab/Button)
- ✅ Profile kann jederzeit ausgefüllt werden
- ✅ App funktioniert auch ohne ausgefülltes Profil
- ✅ Sanfter Hinweis: "Profil vervollständigen für bessere Vorschläge" (optional)

---

## Requirements

### Must Have (P0)

#### Code Changes

1. **Feature Flag System**:
   ```typescript
   // teacher-assistant/frontend/src/lib/featureFlags.ts
   export const FEATURE_FLAGS = {
     ENABLE_ONBOARDING: false,  // ⭐ Hauptschalter
     ENABLE_PROFILE_MODAL: true,
     ENABLE_CHAT: true,
     ENABLE_LIBRARY: true
   };
   ```

2. **App.tsx Modifications**:
   - Remove/Bypass Onboarding Check:
     ```typescript
     // OLD (Zeile 50):
     const { onboardingStatus, checkOnboardingStatus, isOnboardingComplete } = useOnboarding();

     // NEW:
     const SKIP_ONBOARDING = !FEATURE_FLAGS.ENABLE_ONBOARDING;
     const isOnboardingComplete = SKIP_ONBOARDING ? true : checkOnboardingStatus();
     ```

   - Redirect Logic:
     ```typescript
     // Nach Login → immer zu Home (nicht Onboarding)
     if (user && !authLoading) {
       if (SKIP_ONBOARDING || isOnboardingComplete) {
         // Show main app
       } else {
         // Show onboarding (nur wenn Feature Flag = true)
       }
     }
     ```

3. **Keep Onboarding Code** (nicht löschen!):
   - `OnboardingWizard.tsx` bleibt unverändert
   - `useOnboarding.ts` bleibt unverändert
   - Nur Aufruf wird übersprungen via Feature Flag

#### Navigation Cleanup

1. **Tab Bar** (bereits sauber):
   - ✅ 3 Tabs: Home, Chat, Library (funktionieren alle)
   - ✅ Profile als Modal (nicht als Tab)
   - **No changes needed** ✅

2. **Routes** (bereits sauber):
   - ✅ Kein `/onboarding` Route registriert (nur Component)
   - ✅ Tabs via State Management (nicht Routes)
   - **No changes needed** ✅

### Should Have (P1)

1. **Optional Welcome Toast**:
   - Nach Login: "Willkommen bei eduhu! 👋"
   - Dismissable
   - Nur beim allerersten Login

2. **Profile Completion Nudge**:
   - Kleiner Badge auf Profile Icon: "Profil vervollständigen"
   - Verschwindet wenn Profil ausgefüllt

### Nice to Have (P2)

1. **Progressive Profiling**:
   - App fragt nach Profil-Infos während Nutzung (nicht upfront)
   - Z.B. nach 3 Chats: "Welche Fächer unterrichtest du?"

---

## Success Criteria

### Functional

- ✅ Feature Flag `ENABLE_ONBOARDING = false` deaktiviert Wizard
- ✅ Nach Login → Home Screen (kein Onboarding)
- ✅ Chat, Library, Profile sind sofort nutzbar
- ✅ Onboarding Code bleibt intakt (kann später reaktiviert werden)

### Non-Functional

- ✅ Keine Console Errors durch deaktivierten Onboarding
- ✅ App Load Time unverändert
- ✅ Alle Tests passen (anpassen für skipOnboarding)

### User Experience

- ✅ User kann in <5 Sekunden nach Login Chat nutzen
- ✅ Kein "Where do I start?"-Gefühl (Home Screen ist klar)
- ✅ App fühlt sich "ready to use" an

---

## Scope & Constraints

### In Scope ✅

- Feature Flag System erstellen
- Onboarding Bypass Logic
- App.tsx Anpassungen
- Optional: Welcome Toast
- Tests anpassen

### Out of Scope ❌

- Onboarding Code löschen (bleibt!)
- Profil-Logik ändern
- Neue Features entwickeln
- Design Änderungen (kommt in Phase 3)

### Constraints

1. **No Code Deletion**: Onboarding bleibt im Code (Feature Flag only)
2. **Quick Win**: Muss in 0.5-1 Tag machbar sein
3. **Reversible**: Feature Flag kann jederzeit auf `true` gesetzt werden
4. **No Breaking Changes**: Bestehende Profile-Funktionalität bleibt unverändert

---

## Technical Architecture

### Feature Flag Pattern

```typescript
// lib/featureFlags.ts (NEW)
export const FEATURE_FLAGS = {
  ENABLE_ONBOARDING: import.meta.env.VITE_ENABLE_ONBOARDING === 'true' || false,
  ENABLE_PROFILE_MODAL: true,
  ENABLE_CHAT: true,
  ENABLE_LIBRARY: true
};

// Usage:
import { FEATURE_FLAGS } from './lib/featureFlags';

if (FEATURE_FLAGS.ENABLE_ONBOARDING && !isOnboardingComplete) {
  // Show onboarding
}
```

### App.tsx Flow (Updated)

```
User Login (InstantDB)
  ↓
Check: FEATURE_FLAGS.ENABLE_ONBOARDING?
  ↓
NO → Show Home Screen ✅
  ↓
YES → Check: isOnboardingComplete?
    ↓
    NO → Show Onboarding Wizard
    ↓
    YES → Show Home Screen
```

---

## Risks & Mitigations

### Risk 1: User ohne Profil bekommt schlechte AI-Antworten

**Impact**: Medium
**Mitigation**:
- Optional Nudge: "Profil vervollständigen"
- Chat funktioniert auch ohne Profil (generische Antworten)
- Profile Modal ist jederzeit zugänglich

### Risk 2: Tests brechen durch Onboarding-Skip

**Impact**: Low
**Mitigation**:
- Tests anpassen: Mock `FEATURE_FLAGS.ENABLE_ONBOARDING = false`
- Integration Tests für beide Szenarien (ON/OFF)

---

## Open Questions

1. **Environment Variable oder Hardcoded?**
   - Option A: `VITE_ENABLE_ONBOARDING` in `.env` (flexibel)
   - Option B: Hardcoded `false` in Code (einfacher)
   - **Empfehlung**: Option A (reversibel ohne Code-Change)

2. **Welcome Toast?**
   - Zeigen oder nicht?
   - **Empfehlung**: Nein (keep it simple), optional für später

3. **Profile Completion Badge?**
   - Nutzen oder zu pushy?
   - **Empfehlung**: Nein für Phase 1.1, später in Phase 2

---

## Dependencies

### Technical Dependencies

- ✅ React (Feature Flag Hook)
- ✅ Vite Environment Variables
- ✅ Existing Onboarding Components (bleiben unverändert)

### Feature Dependencies

- ✅ None - kann unabhängig entwickelt werden

### Blockers

- ❌ None

---

## Implementation Plan (High-Level)

### Step 1: Feature Flag System (30 min)
- Create `lib/featureFlags.ts`
- Add `.env` variable
- Export flags

### Step 2: App.tsx Modifications (1 hour)
- Import Feature Flags
- Add Bypass Logic
- Update Redirect Flow
- Test both scenarios

### Step 3: Testing (1 hour)
- Update existing tests
- Add Feature Flag tests
- Integration tests (ON/OFF)

### Step 4: Documentation (30 min)
- Update README mit Feature Flags
- Session Log erstellen

**Total Time**: 3 hours

---

## Next Steps

1. **Review & Approve** diese Spec
2. **Create** `plan.md` (Detailed Technical Implementation)
3. **Create** `tasks.md` (Actionable Task List)
4. **Implement** (Frontend-Agent)
5. **Test** (QA-Agent)

---

## Appendix

### Current Code References

**App.tsx** (Zeile 47-60):
```typescript
const AppContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile } = useTeacherProfile();
  const { onboardingStatus, checkOnboardingStatus, isOnboardingComplete, loading: onboardingLoading } = useOnboarding();
  // ... Onboarding Logic hier
```

**OnboardingWizard.tsx** (Zeile 40-44):
```typescript
export interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
  allowSkip?: boolean;
}
```

---

**Maintained by**: Frontend-Agent
**Status**: Ready for `/plan` (Technical Planning)