# Image Generation Improvements - Specification

**Feature Name**: Image Generation UX/Library Improvements
**Version**: 1.0
**Status**: Draft
**Created**: 2025-10-04
**Owner**: Frontend + Backend Team

---

## 1. Overview

### 1.1 Problem Statement

Die aktuelle Bildgenerierungs-Funktion hat mehrere UX-Probleme und fehlende Features:

1. **Keine Library-Integration**: Generierte Bilder werden nicht in der Library unter "Bilder" angezeigt
2. **Doppelte UI-Elemente**: Im Progress-Screen sind Texte redundant
3. **Zu restriktive Validierung**: 10 Zeichen Minimum ist unpraktisch (z.B. "ein Baum")
4. **Kein Gemini-Style für Confirmation**: Agent-Bestätigung nicht im Gemini-Design
5. **Kein Chat-Verlauf**: Generierte Bilder erscheinen nicht im Chat-Verlauf
6. **Kein Prompt-Prefill**: Chat-Nachrichten füllen Form nicht vor
7. **Style-Mapping fehlt**: "realistisch" wird nicht korrekt an DALL-E 3 übertragen
8. **Keine Re-Generation**: Man kann nicht mit gleichen Parametern neu generieren

### 1.2 Goals

**Primary Goals:**
- Generierte Bilder in Library unter "Bilder" anzeigen ✅
- Bilder im Chat-Verlauf anzeigen (als Assistant-Message mit Bild + Text) ✅
- Re-Generation mit vorherigen Parametern ermöglichen ✅
- Style-Mapping korrekt implementieren (realistisch → DALL-E 3 natural) ✅

**Secondary Goals:**
- Progress-View UI bereinigen (doppelte Texte entfernen) ✅
- Mindestzeichenzahl auf 3 reduzieren ✅
- Agent Confirmation im Gemini-Style gestalten ✅
- Prompt-Prefill aus Chat-Nachricht implementieren ✅

### 1.3 Non-Goals

- Bildgenerierung im Hintergrund laufen lassen (zu komplex für jetzt)
- Bilder bearbeiten/beschneiden
- Mehrere Bilder gleichzeitig generieren

---

## 2. User Stories

### Story 1: Bilder in Library speichern und anzeigen
**Als** Lehrer
**möchte ich** alle generierten Bilder in meiner Library unter "Bilder" sehen
**damit** ich sie später wiederfinden und für verschiedene Unterrichtsstunden verwenden kann.

**Acceptance Criteria:**
- [ ] Library hat neue Kategorie "Bilder" (neben Materialien)
- [ ] Generierte Bilder werden automatisch in `library_materials` mit `type: 'image'` gespeichert
- [ ] Bilder zeigen Vorschau-Thumbnail, Titel und Datum
- [ ] Klick auf Bild öffnet Preview-Modal (gleich wie nach Generierung)

---

### Story 2: Bilder im Chat-Verlauf sehen
**Als** Lehrer
**möchte ich** generierte Bilder im Chat-Verlauf sehen
**damit** ich mich in folgenden Nachrichten darauf beziehen kann (z.B. "Mach das Bild bunter").

**Acceptance Criteria:**
- [ ] Nach Bildgenerierung erscheint Assistant-Message im Chat mit:
  - Bild-Vorschau (klickbar für Vollbild)
  - Text: "Ich habe ein Bild für dich erstellt."
  - **KEIN Prompt/Metadata sichtbar** (Clean UI)
- [ ] Bild bleibt im Chat-Verlauf beim Scrollen sichtbar
- [ ] User kann weiter chatten und sich auf das Bild beziehen

---

### Story 3: Bild mit gleichen Parametern neu generieren
**Als** Lehrer
**möchte ich** im Preview-Modal "Neu generieren" klicken können
**damit** ich eine alternative Version mit denselben Vorgaben erhalte (z.B. andere Komposition).

**Acceptance Criteria:**
- [ ] Preview-Modal hat Button "Neu generieren 🔄"
- [ ] Klick öffnet Agent-Form mit vorgefüllten Parametern (Beschreibung + Style)
- [ ] Beide Bilder (Original + Neu-generiert) werden in Library gespeichert
- [ ] Beide Bilder erscheinen im Chat-Verlauf

---

### Story 4: Prompt aus Chat vorausfüllen
**Als** Lehrer
**möchte ich** dass meine Chat-Nachricht automatisch im Image-Form erscheint
**damit** ich nicht zweimal tippen muss.

**Acceptance Criteria:**
- [ ] User schreibt: "Erstelle ein Bild von einem Baum"
- [ ] Agent wird erkannt → Confirmation Modal
- [ ] Nach "Ja" öffnet sich Form mit "ein Baum" vorgefüllt
- [ ] User kann Text anpassen vor Generierung

---

### Story 5: Gemini-Style Agent Confirmation mit 2 Optionen
**Als** Lehrer
**möchte ich** wählen können, ob ich ein Bild erstellen oder einfach weiter chatten möchte
**damit** ich die Kontrolle über den Workflow behalte.

**Acceptance Criteria:**
- [ ] Confirmation Modal hat Gemini-Farben (Orange/Teal)
- [ ] Card-basiertes Layout mit Icon
- [ ] **Zwei Buttons:**
  - "Ja, Bild erstellen 🎨" (Orange Primary) → Öffnet Agent Form
  - "Weiter im Chat 💬" (Gray Secondary) → Schließt Modal, Chat geht weiter
- [ ] Smooth Slide-Up Animation beim Öffnen
- [ ] User kann beide Optionen klar unterscheiden

---

### Story 6: Bessere Validierung (3 Zeichen Minimum)
**Als** Lehrer
**möchte ich** kurze Prompts wie "ein Löwe" eingeben können
**damit** ich schnell Bilder generieren kann.

**Acceptance Criteria:**
- [ ] Minimum: 3 Zeichen (statt 10)
- [ ] Fehlermeldung: "Bitte mindestens 3 Zeichen eingeben"
- [ ] Submit-Button wird bei < 3 Zeichen disabled

---

### Story 7: Deutscher Bildtitel via ChatGPT
**Als** System
**muss ich** einen deutschen, prägnanten Titel für das Bild generieren
**damit** Lehrer in Library und Chat einen verständlichen Titel sehen (nicht den englischen DALL-E Titel).

**Acceptance Criteria:**
- [ ] Nach DALL-E Bildgenerierung: ChatGPT-Call für Titel
- [ ] Prompt: "Erstelle einen kurzen deutschen Titel (max 3-5 Wörter) für dieses Bild: {revised_prompt}"
- [ ] Beispiel: Input "A lion in the savannah" → Output "Löwe in der Savanne"
- [ ] Titel wird in `library_materials.title` und `messages.metadata.title` gespeichert
- [ ] Fallback: Wenn ChatGPT fehlschlägt, nutze DALL-E Titel

---

### Story 8: Korrektes Style-Mapping (realistisch → natural)
**Als** System
**muss ich** Frontend-Styles korrekt zu DALL-E 3 Parametern mappen
**damit** das generierte Bild dem gewünschten Stil entspricht.

**Acceptance Criteria:**
- [ ] Mapping implementiert:
  - `realistic` → DALL-E `style: natural` + Enhanced Prompt "realistic illustration"
  - `cartoon` → DALL-E `style: vivid` + Enhanced Prompt "cartoon style"
  - `illustrative` → DALL-E `style: natural` + Enhanced Prompt "educational illustration"
  - `abstract` → DALL-E `style: vivid` + Enhanced Prompt "abstract art"
- [ ] Backend loggt Mapping zur Verifikation

---

### Story 9: Progress-View UI Cleanup
**Als** User
**möchte ich** keine doppelten Texte im Loading-Screen sehen
**damit** die UI clean und professionell aussieht.

**Acceptance Criteria:**
- [ ] Footer-Bereich (Lines 201-209) entfernt
- [ ] Nur noch Loading-Box mit "Dein Bild wird erstellt..." und "Das kann bis zu 1 Minute dauern"
- [ ] Cancel-Button bleibt erhalten

---

## 3. Technical Requirements

### 3.1 Frontend Changes

**AgentProgressView.tsx:**
- Remove duplicate footer text (lines 201-209)

**AgentFormView.tsx:**
- Change `minLength` from 10 to 3 (line 28)
- Implement prompt prefill from `state.formData.description`

**AgentConfirmationModal (NEW/UPDATE):**
- Redesign in Gemini Style (orange primary, teal background)
- Card-based layout with icon
- Slide-up animation

**ChatView.tsx:**
- Add logic to display generated images in chat history
- Render image messages with thumbnail + metadata
- Allow clicking image to open preview

**Library.tsx:**
- Add "Bilder" category filter
- Query `library_materials` with `type: 'image'`
- Display image thumbnails in grid

**AgentResultView.tsx:**
- Add "Neu generieren" button
- Pass current formData to re-open Agent Form

### 3.2 Backend Changes

**imageGenerationAgent.ts:**
- Implement style mapping (realistic → natural, etc.)
- Add enhanced prompt suffix based on style
- Log mapping for debugging

**langGraphAgents.ts (route):**
- Save generated image to `library_materials` (not just `generated_artifacts`)
- Create chat message with image URL and metadata
- Return both `library_materials.id` and `generated_artifacts.id`

**InstantDB Schema:**
- Ensure `library_materials` supports `type: 'image'`
- Add fields: `image_url`, `image_metadata` (optional)

### 3.3 Data Flow

```
User Input (Chat): "Erstelle ein Bild von einem Baum"
    ↓
Agent Detection → Confirmation Modal (Gemini Style)
    ↓
User clicks "Ja" → Open AgentFormView with prefilled "ein Baum"
    ↓
User adjusts + clicks "Bild generieren" → AgentProgressView
    ↓
Backend: DALL-E 3 Generation (with style mapping)
    ↓
Save to:
  1. generated_artifacts (type: 'image')
  2. library_materials (type: 'image')
  3. messages (as assistant message with image)
    ↓
Frontend: AgentResultView (Preview Modal)
    ↓
User clicks "Weiter im Chat" → Image appears in ChatView
    ↓
User can:
  - Continue chatting (refer to image)
  - Click image → Re-open Preview Modal
  - Click "Neu generieren" → Re-run with same params
```

---

## 4. Success Metrics

**Quantitative:**
- [ ] 100% der generierten Bilder erscheinen in Library
- [ ] 100% der generierten Bilder erscheinen im Chat-Verlauf
- [ ] Style-Mapping hat 0% Fehlerrate (realistisch → natural)
- [ ] Prompt-Prefill funktioniert in 100% der Fälle

**Qualitative:**
- [ ] User können sich in Follow-up-Nachrichten auf Bilder beziehen
- [ ] Re-Generation mit gleichen Params spart Zeit
- [ ] Gemini-Style Confirmation fühlt sich konsistent an
- [ ] Keine doppelten Texte in Progress-View

---

## 5. Security & Privacy

- Bilder sind user-spezifisch (InstantDB permissions: `auth.id == creator.id`)
- Image URLs werden via DALL-E 3 generiert (Azure Blob Storage, öffentlich aber obfuskiert)
- Keine sensiblen Daten in Prompts (User ist verantwortlich)

---

## 6. Dependencies

- InstantDB (already integrated)
- OpenAI DALL-E 3 API (already integrated)
- Backend Agent System (already implemented)

---

## 7. Open Questions

- [ ] **Q1**: Sollen Bilder auch in "Materialien" Hauptliste erscheinen oder nur in separatem "Bilder" Tab?
  - **A**: Separater Tab "Bilder" (beschlossen)

- [ ] **Q2**: Wie soll das Image im Chat-Verlauf aussehen? (Größe, Position, Metadaten)
  - **A**: Thumbnail (max 300px width), links aligned (Assistant), klickbar für Vollbild

- [ ] **Q3**: Soll "Neu generieren" auch den Style ändern können oder fix?
  - **A**: Vorgefüllt aber änderbar (User kann anpassen)

---

## 8. Future Enhancements (Out of Scope)

- Bildbearbeitung (Crop, Filter, etc.)
- Mehrere Bilder gleichzeitig generieren
- Bildgenerierung im Hintergrund (Background Jobs)
- Image-to-Image (Upload + Modify)
- AI-gestützte Prompt-Verbesserung (Suggestions)

---

## 9. Approval

**Reviewed by**: [TBD]
**Approved by**: [TBD]
**Approval Date**: [TBD]
