# Home Screen Gemini Redesign - Implementation Tasks

**Status**: Ready for Implementation
**Created**: 2025-10-01
**Related**: Based on Gemini Prototype Analysis and User Requirements

---

## 🎯 Ziel

Redesign der Home Screen Komponente, um exakt dem Gemini Prototype zu entsprechen:
- "Hallo + Name" Header aus InstantDB Profil
- Standard Message Bubble mit personalisierten Prompt-Vorschlägen (Teal Background)
- Prompt-Vorschläge klickbar → Weiterleitung zu Chat Tab mit vorausgefülltem Prompt
- Kalender mit neuem Layout (Datenstruktur für zukünftige API vorbereitet)
- "Letzte Chats" und "Materialien" Sections mit Gemini Styling

---

## 📊 Task Overview

**Total Tasks**: 7
**Completed**: 0
**In Progress**: 0
**Priority**: P0 (Critical)

**Estimated Total Time**: 6-8 hours

---

## Task List

### TASK-001: Greeting Header "Hallo + [Name]"
**Status**: `pending`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent (react-frontend-developer)
**Estimate**: 1 hour

**Description**:
Implementiere einen Greeting Header der den Namen des Nutzers aus dem InstantDB Profil lädt und mit Fallback anzeigt.

**Acceptance Criteria**:
- [ ] File modified: `frontend/src/pages/Home/Home.tsx`
- [ ] Greeting Text: "Hallo [Name]" wenn Name vorhanden
- [ ] Fallback: "Hallo" (ohne Name) wenn kein Name im Profil
- [ ] Name aus InstantDB User Profil geladen via `db.useQuery`
- [ ] Styling: Gemini Typography (Inter font, text-2xl, font-semibold)
- [ ] Position: Oberhalb der Standard Message Bubble
- [ ] Mobile & Desktop responsive

**User Story**:
> "Als Lehrer/in möchte ich beim Öffnen der App mit meinem Namen begrüßt werden, damit die App persönlicher wirkt."

**Implementation Details**:
```typescript
// Query für User Profil
const { data: profileData } = db.useQuery(
  user ? {
    teacher_profiles: {
      $: {
        where: { user_id: user.id }
      }
    }
  } : null
);

const userName = profileData?.teacher_profiles?.[0]?.name || null;

// Rendering
<div className="mb-4">
  <h1 className="text-2xl font-semibold text-gray-900">
    Hallo{userName ? ` ${userName}` : ''}
  </h1>
</div>
```

**Tests Required**:
- [ ] Visual: Greeting zeigt Name an wenn vorhanden
- [ ] Visual: Greeting zeigt nur "Hallo" wenn kein Name
- [ ] Unit Test: Fallback funktioniert korrekt
- [ ] E2E Test: Greeting lädt nach Login

**Rückfragen**:
- ✅ Welches Feld aus InstantDB: `teacher_profiles.name`?
- ✅ Fallback-Text: Nur "Hallo" oder "Hallo Gast"? → **Nur "Hallo"**
- ✅ Position: Direkt unter Header oder mit Abstand? → **Mit Abstand (mb-4)**

---

### TASK-002: Standard Message Bubble mit Prompt-Vorschlägen
**Status**: `pending`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent (react-frontend-developer)
**Estimate**: 2 hours

**Description**:
Erstelle eine Teal-farbige Message Bubble mit fester Standardnachricht und 2-3 personalisierten Prompt-Vorschlägen wie im Gemini Prototype.

**Acceptance Criteria**:
- [ ] Component created: `frontend/src/components/WelcomeMessageBubble.tsx`
- [ ] File modified: `frontend/src/pages/Home/Home.tsx`
- [ ] Bubble Background: Teal (`bg-background-teal` = `#D3E4E6`)
- [ ] Rounded Corners: `rounded-2xl` (24px)
- [ ] Standard Message Text:
  ```
  "Ich bin Ihr persönlicher KI-Assistent für Unterrichtsplanung.
  Womit kann ich Ihnen heute helfen?"
  ```
- [ ] 2-3 Prompt-Vorschläge darunter angezeigt:
  - Als Pills/Chips dargestellt
  - Orange/Yellow Styling (`bg-primary-100`, `text-primary-700`)
  - Klickbar mit Hover-Effekt
  - Min 44px Touch Target
- [ ] Prompts aus `usePromptSuggestions` Hook geladen
- [ ] Nur erste 2-3 Prompts angezeigt (slice)
- [ ] Mobile & Desktop responsive
- [ ] Exported from `components/index.ts`

**User Story**:
> "Als Lehrer/in möchte ich beim Öffnen der App sofort sehen, wobei mir der Assistent helfen kann, damit ich schnell starten kann."

**Implementation Details**:
```typescript
// WelcomeMessageBubble.tsx
interface WelcomeMessageBubbleProps {
  suggestions: string[];
  onPromptClick: (prompt: string) => void;
}

export const WelcomeMessageBubble: React.FC<WelcomeMessageBubbleProps> = ({
  suggestions,
  onPromptClick
}) => {
  const displayedSuggestions = suggestions.slice(0, 3);

  return (
    <div className="bg-background-teal rounded-2xl p-6 mb-6 shadow-sm">
      {/* Standard Message */}
      <p className="text-gray-900 text-base mb-4 leading-relaxed">
        Ich bin Ihr persönlicher KI-Assistent für Unterrichtsplanung.
        Womit kann ich Ihnen heute helfen?
      </p>

      {/* Prompt Suggestions */}
      <div className="flex flex-wrap gap-2">
        {displayedSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(suggestion)}
            className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full
                       hover:bg-primary-200 transition-all duration-200
                       text-sm font-medium min-h-[44px]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
```

**Tests Required**:
- [ ] Visual: Bubble hat Teal Background
- [ ] Visual: Standard Message wird angezeigt
- [ ] Visual: 2-3 Prompt Pills werden angezeigt
- [ ] Interaction: Klick auf Prompt funktioniert
- [ ] Unit Test: Nur max 3 Prompts angezeigt
- [ ] E2E Test: Bubble rendert auf Home Screen

**Rückfragen**:
- ✅ Standardnachricht: Ist der Text oben korrekt? → **Ja, oder aus Gemini übernehmen**
- ✅ Anzahl Prompts: Genau 2 oder 2-3? → **2-3 (flexibel, max 3)**
- ✅ Prompt Quelle: Aus `usePromptSuggestions` Hook? → **Ja**

---

### TASK-003: Prompt-Vorschlag Click → Chat Navigation mit Pre-filled Prompt
**Status**: `pending`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent (react-frontend-developer)
**Estimate**: 1.5 hours

**Description**:
Implementiere Click-Handler für Prompt-Vorschläge: Weiterleitung zum Chat Tab mit vorausgefülltem Prompt im Input-Feld.

**Acceptance Criteria**:
- [ ] File modified: `frontend/src/pages/Home/Home.tsx`
- [ ] File modified: `frontend/src/App.tsx` (oder Routing-Datei)
- [ ] File modified: `frontend/src/components/ChatView.tsx`
- [ ] Click auf Prompt-Vorschlag:
  1. Wechselt zu Chat Tab (`onTabChange('chat')`)
  2. Übergibt Prompt-Text an ChatView
  3. Füllt Chat Input mit Prompt-Text vor
  4. Fokussiert Input-Feld (optional)
- [ ] State Management: Prompt-Text wird über Props/Context übergeben
- [ ] ChatView akzeptiert `initialPrompt?: string` Prop
- [ ] Nach Prompt-Eingabe wird Input geleert (nach Send)
- [ ] Smooth Navigation ohne Flackern

**User Story**:
> "Als Lehrer/in möchte ich auf einen Prompt-Vorschlag klicken können und direkt im Chat landen mit dem Prompt vorausgefüllt, damit ich schnell starten kann."

**Implementation Details**:
```typescript
// Home.tsx
const handlePromptClick = (prompt: string) => {
  if (onNavigateToChat) {
    onNavigateToChat(prompt); // Callback an App.tsx
  }
};

// App.tsx
const [prefilledPrompt, setPrefilledPrompt] = useState<string | null>(null);

const handleNavigateToChat = (prompt?: string) => {
  setPrefilledPrompt(prompt || null);
  setCurrentTab('chat');
};

// ChatView.tsx
interface ChatViewProps {
  initialPrompt?: string | null;
  onPromptCleared?: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ initialPrompt, onPromptCleared }) => {
  const [userInput, setUserInput] = useState('');

  // Auto-fill prompt when initialPrompt changes
  useEffect(() => {
    if (initialPrompt) {
      setUserInput(initialPrompt);
      // Clear after setting
      if (onPromptCleared) {
        onPromptCleared();
      }
    }
  }, [initialPrompt]);

  // Rest of ChatView logic...
};
```

**Tests Required**:
- [ ] E2E Test: Click auf Prompt → Chat Tab öffnet
- [ ] E2E Test: Prompt ist im Input vorausgefüllt
- [ ] E2E Test: Nach Send wird Input geleert
- [ ] Unit Test: State Management funktioniert
- [ ] Manual Test: Navigation smooth ohne Flackern

**Rückfragen**:
- ✅ Input fokussieren nach Navigation? → **Optional (nice-to-have)**
- ✅ Prompt nach Send löschen? → **Ja, Input soll geleert werden**
- ✅ State Management: Props oder Context? → **Props (einfacher)**

---

### TASK-004: Kalender Layout Redesign (Gemini Style)
**Status**: `pending`
**Priority**: `P0` (Critical)
**Agent**: Frontend-Agent (react-frontend-developer)
**Estimate**: 2 hours

**Description**:
Redesign der CalendarCard Komponente mit neuem Layout basierend auf Gemini Prototype und Vorbereitung der Datenstruktur für zukünftige Kalender-API.

**Acceptance Criteria**:
- [ ] File modified: `frontend/src/components/CalendarCard.tsx`
- [ ] Layout Analysis: Screenshot/Analyse des Gemini Kalenders durchgeführt
- [ ] Neues Layout implementiert (exakt wie Gemini Prototype)
- [ ] Placeholder-Daten vorbereitet:
  ```typescript
  interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    time?: string;
    type: 'lesson' | 'meeting' | 'deadline' | 'other';
    color?: string; // Orange/Yellow für Gemini
  }
  ```
- [ ] Komponente zeigt aktuell "Keine anstehenden Termine"
- [ ] Komponente ist bereit für dynamische Events (Prop: `events?: CalendarEvent[]`)
- [ ] Gemini Styling:
  - Rounded Corners: `rounded-2xl`
  - Background: White oder Teal (wie im Prototype)
  - Orange Icons für Event Types
  - Datum prominent angezeigt
- [ ] Mobile & Desktop responsive
- [ ] TypeScript Interfaces exportiert für spätere API-Integration

**User Story**:
> "Als Lehrer/in möchte ich meine anstehenden Termine auf der Home Screen sehen können, damit ich den Überblick behalte."

**Implementation Details**:
```typescript
// CalendarCard.tsx
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: 'lesson' | 'meeting' | 'deadline' | 'other';
  color?: string;
}

interface CalendarCardProps {
  events?: CalendarEvent[];
}

export const CalendarCard: React.FC<CalendarCardProps> = ({ events = [] }) => {
  // Gemini Layout hier implementieren
  // Aktuell: Placeholder ohne Events

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-primary">
          Deine Termine
        </h2>
        <IonIcon icon={calendarOutline} className="text-primary text-2xl" />
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 text-sm">
            Keine anstehenden Termine
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            // Event Card hier (Gemini Style)
            <div key={event.id} className="...">
              {/* Event Details */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

**Tests Required**:
- [ ] Visual: Layout sieht aus wie Gemini Prototype
- [ ] Visual: Placeholder-State zeigt "Keine Termine"
- [ ] Unit Test: Event-Props werden korrekt verarbeitet
- [ ] TypeScript: Interface kompiliert ohne Fehler
- [ ] Future-Ready: Komponente kann Events anzeigen (Test mit Mock-Daten)

**Rückfragen**:
- ❓ **KRITISCH: Kannst du bitte den Gemini Kalender analysieren?**
  - Screenshot vorhanden? → **Nein, nur Login-Page**
  - Alternative: Beschreibung vom User oder Web-Recherche?
- ❓ Welche Event-Typen sind wichtig? → **lesson, meeting, deadline, other**
- ❓ Farb-Coding: Orange für alle oder verschiedene? → **Orange/Yellow (Gemini Palette)**

---

### TASK-005: "Letzte Chats" Section Gemini Styling
**Status**: `pending`
**Priority**: `P1` (High)
**Agent**: Frontend-Agent (react-frontend-developer)
**Estimate**: 0.5 hours

**Description**:
Überprüfe und verfeinere das Gemini Styling der "Letzte Chats" Section basierend auf dem Gemini Prototype.

**Acceptance Criteria**:
- [ ] File modified: `frontend/src/pages/Home/Home.tsx`
- [ ] Vergleich mit Gemini Prototype durchgeführt
- [ ] Styling exakt wie Gemini:
  - Card Background: White
  - Rounded Corners: `rounded-2xl`
  - Title: Orange (`text-primary`)
  - Icon Circles: Orange Background (`bg-primary/10`)
  - "Alle anzeigen" Link: Orange mit Hover
  - Shadows: Subtle (`shadow-sm`)
- [ ] Spacing & Padding überprüft
- [ ] Mobile & Desktop responsive
- [ ] Keine Regressions (bestehende Funktionalität bleibt)

**User Story**:
> "Als Lehrer/in möchte ich dass die 'Letzte Chats' Section genauso aussieht wie im Gemini Prototype, damit das Design konsistent ist."

**Implementation Details**:
```typescript
// Bereits größtenteils implementiert (siehe Home.tsx Zeile 176-262)
// Nur kleinere Anpassungen basierend auf Gemini Prototype-Vergleich nötig
```

**Tests Required**:
- [ ] Visual Regression: Vergleich Vorher/Nachher
- [ ] Visual: Exakt wie Gemini Prototype
- [ ] Interaction: Alle Buttons funktionieren
- [ ] Mobile: Responsive

**Rückfragen**:
- ❓ **Gibt es Unterschiede zum aktuellen Design?** → **Vergleich mit Gemini Screenshot nötig**
- ✅ Sind größere Änderungen nötig? → **Wahrscheinlich nur kleine Tweaks**

---

### TASK-006: "Materialien" Section Gemini Styling
**Status**: `pending`
**Priority**: `P1` (High)
**Agent**: Frontend-Agent (react-frontend-developer)
**Estimate**: 0.5 hours

**Description**:
Überprüfe und verfeinere das Gemini Styling der "Materialien" Section basierend auf dem Gemini Prototype.

**Acceptance Criteria**:
- [ ] File modified: `frontend/src/pages/Home/Home.tsx`
- [ ] Vergleich mit Gemini Prototype durchgeführt
- [ ] Styling exakt wie Gemini:
  - Card Background: White
  - Rounded Corners: `rounded-2xl`
  - Title: Orange (`text-primary`)
  - Icon Circles: Yellow Background (`bg-secondary/10`) oder Orange
  - "Alle anzeigen" Link: Orange mit Hover
  - Shadows: Subtle (`shadow-sm`)
- [ ] Spacing & Padding überprüft
- [ ] Loading State mit Gemini Styling
- [ ] Mobile & Desktop responsive
- [ ] Keine Regressions

**User Story**:
> "Als Lehrer/in möchte ich dass die 'Materialien' Section genauso aussieht wie im Gemini Prototype, damit das Design konsistent ist."

**Implementation Details**:
```typescript
// Bereits größtenteils implementiert (siehe Home.tsx Zeile 264-361)
// Nur kleinere Anpassungen basierend auf Gemini Prototype-Vergleich nötig
```

**Tests Required**:
- [ ] Visual Regression: Vergleich Vorher/Nachher
- [ ] Visual: Exakt wie Gemini Prototype
- [ ] Interaction: Alle Buttons funktionieren
- [ ] Loading State: Skeleton korrekt
- [ ] Mobile: Responsive

**Rückfragen**:
- ❓ **Icon Color: Yellow oder Orange?** → **Vergleich mit Gemini Screenshot nötig**
- ❓ Sind größere Änderungen nötig? → **Wahrscheinlich nur kleine Tweaks**

---

### TASK-007: Remove/Hide Old Elements (Cleanup)
**Status**: `pending`
**Priority**: `P1` (High)
**Agent**: Frontend-Agent (react-frontend-developer)
**Estimate**: 0.5 hours

**Description**:
Entferne oder verstecke alte UI-Elemente die nicht im Gemini Prototype vorhanden sind.

**Acceptance Criteria**:
- [ ] File modified: `frontend/src/pages/Home/Home.tsx`
- [ ] Alte "Introduction Section" entfernt:
  ```typescript
  // LÖSCHEN: Zeile 113-118
  <div style={{ marginBottom: '32px', textAlign: 'center' }}>
    <IonText color="medium">
      <p>Ihr persönlicher KI-Assistent für Unterrichtsplanung...</p>
    </IonText>
  </div>
  ```
- [ ] Alte PromptTilesGrid entfernt oder auskommentiert:
  ```typescript
  // LÖSCHEN oder AUSKOMMENTIEREN: Zeile 121-129
  <div style={{ marginBottom: '24px' }}>
    <PromptTilesGrid ... />
  </div>
  ```
  → Ersetzt durch neue WelcomeMessageBubble (TASK-002)
- [ ] Alle `style={{...}}` Inline-Styles durch Tailwind Classes ersetzt
- [ ] Code ist clean und lesbar
- [ ] Keine toten Code-Abschnitte mehr

**User Story**:
> "Als Entwickler möchte ich dass der Code clean und wartbar ist, ohne alte UI-Elemente die nicht mehr verwendet werden."

**Implementation Details**:
```typescript
// Vorher (aktuell):
<div style={{ padding: '16px' }}>
  <div style={{ marginBottom: '32px', textAlign: 'center' }}>
    <IonText color="medium">
      <p>Ihr persönlicher KI-Assistent...</p>
    </IonText>
  </div>
  <div style={{ marginBottom: '24px' }}>
    <PromptTilesGrid ... />
  </div>
  ...
</div>

// Nachher (neu):
<div className="p-4">
  {/* Greeting Header - TASK-001 */}
  <div className="mb-4">
    <h1 className="text-2xl font-semibold text-gray-900">
      Hallo{userName ? ` ${userName}` : ''}
    </h1>
  </div>

  {/* Welcome Message Bubble - TASK-002 */}
  <WelcomeMessageBubble
    suggestions={suggestions}
    onPromptClick={handlePromptClick}
  />

  {/* Calendar Card - TASK-004 */}
  <CalendarCard events={[]} />

  {/* Letzte Chats - TASK-005 */}
  <div className="bg-white rounded-2xl shadow-sm mb-6">
    ...
  </div>

  {/* Materialien - TASK-006 */}
  <div className="bg-white rounded-2xl shadow-sm mb-6">
    ...
  </div>
</div>
```

**Tests Required**:
- [ ] Visual: Keine alten Elemente mehr sichtbar
- [ ] Code Review: Kein toter Code
- [ ] Build: Kompiliert ohne Errors
- [ ] E2E Test: Home Screen funktioniert einwandfrei

**Rückfragen**:
- ✅ PromptTilesGrid komplett löschen? → **Ja, durch WelcomeMessageBubble ersetzt**
- ✅ Introduction Text komplett löschen? → **Ja, durch Greeting Header + Bubble ersetzt**

---

## 🔗 Task Dependencies

```
TASK-001 (Greeting Header)
    ↓
TASK-002 (Welcome Message Bubble) ──┐
    ↓                                │
TASK-003 (Prompt Click Navigation)  │
    ↓                                │
TASK-004 (Calendar Redesign) ───────┤ (parallel möglich)
    ↓                                │
TASK-005 (Letzte Chats Styling) ────┤ (parallel möglich)
    ↓                                │
TASK-006 (Materialien Styling) ─────┘ (parallel möglich)
    ↓
TASK-007 (Cleanup)
```

**Parallel Work Möglich**:
- TASK-004, TASK-005, TASK-006 können parallel bearbeitet werden
- TASK-001, TASK-002, TASK-003 müssen sequenziell (hängen voneinander ab)

---

## 📋 Checklist: Before Starting

- [ ] Gemini Prototype Screenshot analysiert? → **❌ FEHLT - nur Login-Page verfügbar**
- [ ] Gemini Kalender Layout bekannt? → **❌ FEHLT - benötigt für TASK-004**
- [ ] User Profil Schema bekannt (`teacher_profiles.name`)? → **✅ Ja, aus InstantDB**
- [ ] `usePromptSuggestions` Hook funktioniert? → **✅ Ja, vorhanden**
- [ ] Chat Navigation Callback vorhanden? → **✅ Ja, `onNavigateToChat` Prop**

---

## ❓ Offene Rückfragen (KRITISCH)

### 1. **Gemini Prototype Zugang** (BLOCKING)
- ❓ Kann ich den echten Gemini Chat Home Screen sehen?
  - Aktuell nur Login-Page Screenshot verfügbar
  - Benötigt für TASK-004 (Kalender Layout)
  - Benötigt für TASK-005/006 (exaktes Styling)

**Optionen**:
  - A) User stellt Screenshot vom Gemini Home Screen bereit
  - B) User beschreibt Kalender Layout detailliert
  - C) Ich recherchiere Gemini Design online (wenn öffentlich)

### 2. **Kalender Layout** (TASK-004)
- ❓ Wie sieht der Kalender im Gemini Prototype aus?
  - Listenansicht oder Grid?
  - Event Cards horizontal oder vertikal?
  - Datum-Formatierung?
  - Icon-Position?

### 3. **Standard Message Text** (TASK-002)
- ❓ Ist der Text korrekt?
  ```
  "Ich bin Ihr persönlicher KI-Assistent für Unterrichtsplanung.
  Womit kann ich Ihnen heute helfen?"
  ```
  - Oder soll ich den exakten Text aus Gemini Prototype übernehmen?

### 4. **Material Icons Farbe** (TASK-006)
- ❓ Sollen Material-Icons Yellow (`bg-secondary/10`) oder Orange (`bg-primary/10`) sein?
  - Im aktuellen Code: Yellow
  - Im Gemini Prototype: ???

---

## 🎯 Next Steps

**Empfohlener Workflow**:

1. **User beantwortet Rückfragen** (besonders Gemini Screenshot)
2. **Start mit TASK-001** (Greeting Header) - keine Abhängigkeiten
3. **Dann TASK-002** (Welcome Message Bubble)
4. **Parallel starten**:
   - Agent 1: TASK-003 (Navigation)
   - Agent 2: TASK-005 + TASK-006 (Styling Tweaks)
5. **TASK-004 (Kalender)** - sobald Gemini Layout bekannt
6. **Abschließend TASK-007** (Cleanup)

**Geschätzte Gesamtzeit**: 6-8 Stunden (mit Parallelisierung: 4-5 Stunden)

---

## 📸 Screenshots für Vergleich

**Benötigt**:
- [ ] Gemini Prototype Home Screen (FEHLT - KRITISCH)
- [ ] Gemini Kalender Detail View (FEHLT - für TASK-004)
- [ ] Aktueller Teacher Assistant Home Screen (VORHANDEN: `teacher-assistant-home.png`)

**Vorhanden**:
- ✅ `teacher-assistant-home.png` - Aktueller Zustand
- ✅ `teacher-assistant-library.png` - Library View
- ✅ `gemini-prototype-full.png` - Nur Login Page (nicht hilfreich)

---

## 🚀 Ready to Implement?

**Status**: ⚠️ **BLOCKED - Warte auf User Input**

**Blocking Items**:
1. Gemini Prototype Home Screen Screenshot
2. Kalender Layout Beschreibung
3. Standard Message Text Bestätigung

**Sobald unblocked**: Kann direkt mit TASK-001 starten ✅

---

**Last Updated**: 2025-10-01
**Created By**: General-Purpose Agent
**Next Assignee**: react-frontend-developer (nach User-Antwort)
