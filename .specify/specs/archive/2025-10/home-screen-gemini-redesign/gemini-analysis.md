# Gemini Prototype - Design Analysis

**Datum**: 2025-10-01
**Quelle**: Screenshots aus Gemini Prototype (eduhu App)

---

## 📸 Screenshot Analyse

### Screenshot 1 (134625.png) - Oberer Bereich

**1. Greeting Header**
```
"Hallo Michelle!"
```
- **Font**: Sans-serif (ähnlich Inter)
- **Size**: Groß (ca. 32px / text-3xl)
- **Color**: Orange (#FB6542 oder ähnlich)
- **Weight**: Bold/Semibold (700)
- **Position**: Ganz oben, links aligned
- **Icon**: Orange Profil-Icon rechts oben (rund)

**2. Subheading**
```
"Dein KI-Assistent ist bereit."
```
- **Font**: Sans-serif
- **Size**: Kleiner (ca. 16px / text-base)
- **Color**: Dark gray (#374151)
- **Weight**: Normal (400)
- **Position**: Direkt unter Greeting

**3. Kalender Card**
```
Donnerstag
09. Okt

08:30  •  Klasse 8a, Mathematik
10:15  •  Klasse 10c, Englisch
```

**Layout**:
- **Background**: Light gray/white (#F9FAFB)
- **Border**: Subtle border oder shadow
- **Rounded Corners**: rounded-2xl (24px)
- **Padding**: ca. 16px-24px
- **Icon**: Kalender Icon rechts oben (gray)

**Header**:
- "Donnerstag" - Text klein, gray
- "09. Okt" - Text groß, bold, dark

**Event Items**:
- Zeit: "08:30" - Medium weight, dark
- Separator: "•" (Bullet point)
- Details: "Klasse 8a, Mathematik" - Normal weight, dark
- Spacing: ca. 12px zwischen Events

**4. Message Bubble (eduhu Assistent)**
```
eduhu
Hallo Michelle! Ich habe einen Blick auf deinen Tag geworfen
und ein paar Ideen vorbereitet. Wollen wir loslegen?

Planung Mathe starten →
```

**Layout**:
- **Background**: Light gray (#F3F4F6)
- **Border**: Keine oder sehr subtle
- **Rounded Corners**: rounded-2xl (24px)
- **Padding**: ca. 16px-20px

**Branding Label**:
- "eduhu" - Orange text (#FB6542), klein, semibold
- Position: Oben links in der Bubble

**Message Text**:
- Font: Sans-serif
- Size: ca. 16px (text-base)
- Color: Dark gray/black (#1F2937)
- Weight: Normal (400)
- Line height: Relaxed (1.6)

**Prompt Suggestion Button**:
- "Planung Mathe starten →"
- Background: None (transparent)
- Text color: Dark (#1F2937)
- Weight: Medium (500)
- Arrow icon: "→" rechts
- Underline oder hover effect wahrscheinlich
- Spacing: ca. 12px margin-top

---

### Screenshot 2 (134654.png) - Unterer Bereich

**5. Weitere Prompt Suggestions**
```
Planung Mathe starten →
Planung Englisch starten →
```

**Layout**:
- Liste von Links/Buttons
- Gleicher Style wie erster Prompt
- Spacing: ca. 8px-12px zwischen Items
- Kein Background, nur Text + Arrow

**6. Input Field (unten)**
```
"Deine Nachricht..."
```

**Layout**:
- **Background**: Light gray (#F3F4F6)
- **Border**: Keine oder subtle
- **Rounded Corners**: rounded-full (9999px) - sehr rund
- **Padding**: ca. 12px-16px horizontal
- **Placeholder**: Gray text (#9CA3AF)
- **Send Button**: Orange circle button rechts
  - Icon: Arrow up "↑"
  - Background: Orange (#FB6542)
  - Size: ca. 48px diameter
  - Rounded: Full circle

**7. Bottom Navigation**
```
Home | Generieren | Automatisieren | Profil
```

**Layout**:
- 4 Tabs
- Active: "Home" - Orange color (#FB6542)
- Inactive: Gray (#9CA3AF)
- Icons: Simple outline icons
- Labels: Klein, unter Icons
- Background: White
- Border-top: Subtle gray border

---

## 🎨 Design Tokens (abgeleitet)

### Colors
```typescript
{
  primary: '#FB6542',        // Orange - Greeting, Icons, Active Tab
  text: {
    heading: '#1F2937',      // Dark gray - Headings
    body: '#374151',         // Medium gray - Body text
    muted: '#9CA3AF',        // Light gray - Placeholders, inactive
  },
  background: {
    card: '#F9FAFB',         // Very light gray - Calendar card
    bubble: '#F3F4F6',       // Light gray - Message bubble
    input: '#F3F4F6',        // Light gray - Input field
    white: '#FFFFFF',        // White - Page background
  },
  border: '#E5E7EB',         // Gray border
}
```

### Typography
```typescript
{
  greeting: {
    size: '32px',            // text-3xl
    weight: 700,             // font-bold
    color: primary,          // Orange
  },
  subheading: {
    size: '16px',            // text-base
    weight: 400,             // font-normal
    color: '#374151',        // text-gray-700
  },
  body: {
    size: '16px',            // text-base
    weight: 400,             // font-normal
    lineHeight: 1.6,         // leading-relaxed
  },
  label: {
    size: '14px',            // text-sm
    weight: 600,             // font-semibold
    color: primary,          // Orange (for "eduhu" label)
  }
}
```

### Spacing
```typescript
{
  card: {
    padding: '16px-24px',    // p-4 to p-6
    gap: '12px',             // gap-3
  },
  bubble: {
    padding: '16px-20px',    // p-4 to p-5
    gap: '12px',             // gap-3
  },
  sections: {
    gap: '16px-24px',        // mb-4 to mb-6
  }
}
```

### Border Radius
```typescript
{
  card: '24px',              // rounded-2xl
  bubble: '24px',            // rounded-2xl
  input: '9999px',           // rounded-full
  button: '9999px',          // rounded-full (send button)
}
```

---

## ✅ Antworten auf Rückfragen

### 1. **Greeting Header Format**
```
"Hallo Michelle!"
```
- ✅ Großes Orange "Hallo + Name!"
- ✅ Darunter Subheading: "Dein KI-Assistent ist bereit."
- ✅ Name aus User Profil
- ✅ Fallback: "Hallo!" (ohne Name)

### 2. **Kalender Layout**
**Struktur**:
- Light gray/white Card
- Header: Wochentag + Datum (groß)
- Event Liste (vertikal):
  - Zeit links
  - Bullet separator "•"
  - Klasse + Fach rechts
- Kalender Icon rechts oben

**Datenstruktur**:
```typescript
interface CalendarEvent {
  time: string;        // "08:30"
  class: string;       // "Klasse 8a"
  subject: string;     // "Mathematik"
}

interface CalendarDay {
  weekday: string;     // "Donnerstag"
  date: string;        // "09. Okt"
  events: CalendarEvent[];
}
```

### 3. **Standard Message Text**
```
"Hallo Michelle! Ich habe einen Blick auf deinen Tag geworfen
und ein paar Ideen vorbereitet. Wollen wir loslegen?"
```

**Komponenten**:
- Label: "eduhu" (Orange, klein, oben links)
- Personalisierte Nachricht mit Name
- Kontext-bezogen (Bezug auf Kalender/Tag)
- Call-to-Action: "Wollen wir loslegen?"

**Für unsere App** (ohne Namen):
```
"eduhu
Ich habe einen Blick auf deinen Tag geworfen und ein paar
Ideen vorbereitet. Wollen wir loslegen?"
```

Oder generischer:
```
"eduhu
Hallo! Ich bin bereit, dich bei der Unterrichtsplanung
zu unterstützen. Womit möchtest du starten?"
```

### 4. **Prompt Suggestions Format**
```
Planung Mathe starten →
Planung Englisch starten →
```

**Style**:
- ❌ KEINE Pills/Chips
- ✅ Simple Text Links mit Arrow "→"
- ✅ Dark text (#1F2937)
- ✅ Medium weight (500)
- ✅ Kein Background
- ✅ Untereinander gestackt (vertical list)
- ✅ ca. 8-12px spacing zwischen Items

### 5. **Material Icons Farbe**
- Nicht im Screenshot sichtbar
- Empfehlung: Orange (#FB6542) für Konsistenz

---

## 🔄 Key Differences zu aktuellem Design

### Was ANDERS ist als erwartet:

1. **Message Bubble Background**:
   - ❌ NICHT Teal (#D3E4E6)
   - ✅ Light Gray (#F3F4F6)

2. **Prompt Suggestions Style**:
   - ❌ KEINE Pills/Chips mit Background
   - ✅ Simple Text Links mit Arrow "→"
   - ✅ Vertikal gestackt, nicht horizontal

3. **Subheading vorhanden**:
   - ✅ "Dein KI-Assistent ist bereit."
   - Position: Direkt unter Greeting

4. **"eduhu" Branding Label**:
   - ✅ Orange Label oben in Message Bubble
   - Klein, semibold

5. **Kalender zeigt konkrete Events**:
   - ✅ Zeit + Klasse + Fach
   - ✅ Wochentag + Datum Header
   - ✅ Light background, subtle border

6. **Input Field am unteren Rand**:
   - ✅ Rounded full (sehr rund)
   - ✅ Orange Send Button (circle)
   - ✅ Light gray background

---

## 🎯 Implementation Priorities (Updated)

### TASK-001: Greeting Header ✅
```tsx
<div className="mb-2">
  <h1 className="text-3xl font-bold text-primary">
    Hallo{userName ? ` ${userName}` : ''}!
  </h1>
  <p className="text-base text-gray-700 mt-1">
    Dein KI-Assistent ist bereit.
  </p>
</div>
```

### TASK-002: Message Bubble ⚠️ UPDATED
```tsx
<div className="bg-gray-100 rounded-2xl p-5 mb-6">
  {/* Branding Label */}
  <div className="text-sm font-semibold text-primary mb-2">
    eduhu
  </div>

  {/* Message */}
  <p className="text-base text-gray-900 leading-relaxed mb-4">
    Ich habe einen Blick auf deinen Tag geworfen und ein paar
    Ideen vorbereitet. Wollen wir loslegen?
  </p>

  {/* Prompt Suggestions - NOT Pills, just links! */}
  <div className="space-y-2">
    {suggestions.slice(0, 3).map((suggestion, i) => (
      <button
        key={i}
        onClick={() => onPromptClick(suggestion)}
        className="flex items-center gap-2 text-gray-900 font-medium
                   hover:text-primary transition-colors text-left w-full"
      >
        <span>{suggestion}</span>
        <span>→</span>
      </button>
    ))}
  </div>
</div>
```

### TASK-004: Calendar Card ✅
```tsx
<div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
  {/* Header */}
  <div className="flex justify-between items-start mb-4">
    <div>
      <p className="text-sm text-gray-600">Donnerstag</p>
      <h3 className="text-2xl font-bold text-gray-900">09. Okt</h3>
    </div>
    <IonIcon icon={calendarOutline} className="text-gray-400 text-2xl" />
  </div>

  {/* Events */}
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <span className="text-gray-900 font-medium">08:30</span>
      <span className="text-gray-400">•</span>
      <span className="text-gray-900">Klasse 8a, Mathematik</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-gray-900 font-medium">10:15</span>
      <span className="text-gray-400">•</span>
      <span className="text-gray-900">Klasse 10c, Englisch</span>
    </div>
  </div>
</div>
```

---

## 📝 Updated Design Tokens

```typescript
// frontend/src/lib/design-tokens.ts - UPDATES

export const colors = {
  primary: {
    500: '#FB6542', // Main - für Greeting, Icons, Active States
  },

  // NEW: Gray scale for Gemini style
  gray: {
    50: '#F9FAFB',   // Calendar card background
    100: '#F3F4F6',  // Message bubble, input background
    200: '#E5E7EB',  // Borders
    400: '#9CA3AF',  // Muted text, placeholders
    600: '#4B5563',  // Medium text
    700: '#374151',  // Subheading text
    900: '#1F2937',  // Heading, body text
  },

  background: {
    teal: '#D3E4E6',  // NICHT für Message Bubble! (old)
    gray: {
      light: '#F3F4F6',  // Message bubble (NEW)
      card: '#F9FAFB',   // Calendar card (NEW)
    }
  }
} as const;
```

---

## 🚀 Ready to Implement

**Status**: ✅ **ALLE FRAGEN BEANTWORTET**

**Kann jetzt starten mit**:
1. TASK-001: Greeting Header + Subheading
2. TASK-002: Message Bubble (UPDATED: Gray background, text links)
3. TASK-003: Prompt Click Navigation
4. TASK-004: Calendar Card (exakte Struktur bekannt)
5. TASK-005-007: Styling Tweaks

**Keine Blocker mehr!** 🎉

---

**Last Updated**: 2025-10-01
**Screenshots**:
- `.specify/specs/home-screen-redesign/Screenshot 2025-10-01 134625.png`
- `.specify/specs/home-screen-redesign/Screenshot 2025-10-01 134654.png`
