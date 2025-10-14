# Feature Specification: Agent Confirmation UX Fixes und Automatisches Bildtagging

**Feature Branch**: `003-agent-confirmation-ux`
**Created**: 2025-10-14
**Status**: Draft
**Input**: User description: "Agent Confirmation UX Fixes und Automatisches Bildtagging - Multiple visibility and navigation issues with agent workflow"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent Confirmation Card Visibility (Priority: P1) 🎯 MVP

Als Lehrkraft möchte ich die Agent Confirmation Card deutlich sichtbar sehen, damit ich verstehe, was der AI-Agent vorschlägt und die Aktion bestätigen kann.

**Aktuelles Problem**:
- Agent Confirmation erscheint als weiße Box auf weißem Hintergrund
- Konturen sind erkennbar, aber Text ist nicht lesbar
- "Weiter im Chat" Button (grau) ist sichtbar, aber Hauptbutton nicht

**Warum P1**: Kernfunktionalität blockiert - Nutzer können Agents nicht starten wenn UI nicht sichtbar

**Independent Test**:
1. Chatte mit AI und frage nach Bilderstellung
2. Agent Confirmation Card muss mit oranger Gradient-Hintergrund sichtbar sein
3. Beide Buttons müssen lesbar sein ("Bild-Generierung starten" orange + "Weiter im Chat" grau)
4. Karte muss sich visuell vom Chat-Hintergrund abheben

**Acceptance Scenarios**:

1. **Given** ich chatte mit dem AI-Assistenten und frage nach Bilderstellung, **When** AI schlägt Agent vor, **Then** sehe ich eine orangefarbene Gradient-Karte mit Border, zwei deutlich lesbare Buttons, und Reasoning-Text
2. **Given** Agent Confirmation Card wird angezeigt, **When** ich die Seite bei verschiedenen Lichtverhältnissen betrachte, **Then** ist der Kontrast ausreichend (min. WCAG AA 4.5:1 für Text)
3. **Given** Agent Confirmation Card ist sichtbar, **When** ich auf Mobile wechsle, **Then** sind beide Buttons untereinander gestapelt und vollständig lesbar

---

### User Story 2 - Library Navigation nach Bilderstellung (Priority: P1) 🎯 MVP

Als Lehrkraft möchte ich nach der Bilderstellung direkt zur Library mit dem konkreten Bild navigiert werden, damit ich das erstellte Material sofort sehen und nutzen kann.

**Aktuelles Problem**:
- Nach "Weiter im Chat" Button-Click öffnet sich Library Tab
- Aber: Lande im Chat-Fenster, nicht in Library-Ansicht
- Bild wird nicht angezeigt

**Erwartetes Verhalten**:
- Navigation zu Library Tab → Materials Section
- Automatische Preview des neu erstellten Bildes
- Modal mit Bild, Titel, Metadaten, Buttons sichtbar

**Warum P1**: Unterbricht Nutzer-Workflow unmittelbar nach Kernfunktion (Bilderstellung)

**Independent Test**:
1. Erstelle Bild via Agent
2. Klicke "Weiter im Chat" in AgentResultView
3. Verifiziere: Library Tab aktiv, Materials-Ansicht sichtbar, Bild-Preview geöffnet
4. Modal zeigt: Thumbnail, Titel, "Regenerieren" + "Herunterladen" Buttons

**Acceptance Scenarios**:

1. **Given** Bild wurde erfolgreich generiert, **When** ich auf "Weiter im Chat" klicke, **Then** öffnet sich Library Tab UND MaterialPreviewModal zeigt das neue Bild
2. **Given** Library öffnet sich nach Bilderstellung, **When** Modal erscheint, **Then** sehe ich Bild-Thumbnail, Titel, Erstellungsdatum, und Action-Buttons (Regenerieren, Herunterladen)
3. **Given** ich bin in der Library-Preview, **When** ich Modal schließe, **Then** bleibe ich in Library-Ansicht mit Material-Grid sichtbar

---

### User Story 3 - Bild in Chat-Verlauf anzeigen (Priority: P1) 🎯 MVP

Als Lehrkraft möchte ich das generierte Bild direkt im Chat-Verlauf sehen, damit ich den Kontext behalte und mich auf das Bild beziehen kann.

**Aktuelles Problem**:
- Nach Agent Confirmation erstellt sich neue Chat-Session
- Bild erscheint nicht im Chat-Verlauf
- Verlauf der Konversation verschwindet
- Vision-Kontext geht verloren

**Warum P1**: Kernerlebnis der kontinuierlichen Konversation geht verloren, Vision-Feature kann nicht genutzt werden

**Independent Test**:
1. Chatte: "Erstelle ein Bild von einem Löwen für Biologieunterricht"
2. Bestätige Agent, Bild wird generiert
3. Verifiziere: Bild erscheint als Thumbnail in Chat-Historie
4. Chatte weiter: "Ändere die Perspektive auf Frontalansicht"
5. Verifiziere: AI bezieht sich auf vorheriges Bild (Vision-Kontext funktioniert)

**Acceptance Scenarios**:

1. **Given** Agent generiert Bild erfolgreich, **When** ich zum Chat zurückkehre, **Then** sehe ich das Bild als Message mit Thumbnail im Chat-Verlauf
2. **Given** Bild ist im Chat-Verlauf, **When** ich weitere Nachrichten schreibe, **Then** bleibt Chat-Session gleich (keine neue Session) und Historie ist vollständig sichtbar
3. **Given** Bild ist im Verlauf, **When** ich frage "Was zeigt das Bild?", **Then** antwortet AI basierend auf Vision-Analyse des Bildes
4. **Given** Bild im Verlauf, **When** ich scroll nach oben, **Then** sehe ich alle vorherigen Messages inkl. ursprünglicher Anfrage

---

### User Story 4 - MaterialPreviewModal Content Visibility (Priority: P2)

Als Lehrkraft möchte ich in der MaterialPreviewModal alle Inhalte und Buttons sehen, damit ich das Material bewerten und Aktionen durchführen kann.

**Aktuelles Problem**:
- Modal öffnet sich in Library
- Nur Titel ist sichtbar
- Keine Vorschau des Bildes
- Keine Action-Buttons (Regenerieren, Herunterladen)

**Warum P2**: Beeinträchtigt Library-Nutzung, aber Workaround existiert (direkter Download im Grid)

**Independent Test**:
1. Öffne Library, klicke auf Material-Karte
2. Verifiziere Modal zeigt: Bild-Preview (groß), Titel, Metadaten, Buttons
3. Buttons funktionieren: "Regenerieren" öffnet Agent mit prefill, "Herunterladen" lädt Bild

**Acceptance Scenarios**:

1. **Given** ich bin in Library-Ansicht, **When** ich auf Material-Karte klicke, **Then** öffnet sich Modal mit vollem Bild-Preview (nicht nur Titel)
2. **Given** Modal ist offen, **When** ich nach unten scrolle, **Then** sehe ich Metadaten-Sektion (Beschreibung, Stil, Lerngruppe, Fach) und Action-Buttons
3. **Given** ich sehe Modal-Content, **When** Bild groß ist, **Then** ist Modal scrollbar und alle Elemente erreichbar

---

### User Story 5 - Automatisches Bildtagging via Vision (Priority: P2)

Als Lehrkraft möchte ich dass Bilder automatisch mit relevanten Tags versehen werden, damit ich später über Suche schnell passende Materialien finde.

**Beispiel**:
- Bild: "Anatomischer Löwe für Biologieunterricht"
- Auto-generierte Tags: "anatomie", "biologie", "löwe", "seitenansicht", "säugetier", "muskulatur", "skelett"

**Warum P2**: Verbessert Auffindbarkeit erheblich, aber Feature funktioniert auch ohne

**Independent Test**:
1. Erstelle Bild "Anatomischer Löwe, Seitenansicht, Biologie"
2. Verifiziere: Backend ruft ChatGPT Vision API für Tagging auf
3. Tags werden in library_materials.metadata.tags gespeichert
4. Suche nach "anatomie" → Bild erscheint in Ergebnissen
5. Tags sind NICHT sichtbar in UI (nur für Suche)

**Acceptance Scenarios**:

1. **Given** Bild wurde generiert, **When** Bild in Library gespeichert wird, **Then** wird automatisch Vision API aufgerufen mit Prompt "Analysiere dieses Bild und generiere 5-10 relevante Tags für Bildungskontext"
2. **Given** Tags wurden generiert, **When** ich in Library suche nach einem Tag-Begriff, **Then** werden alle Bilder mit matching Tags angezeigt
3. **Given** Tags existieren, **When** ich Material-Preview öffne, **Then** sind Tags NICHT sichtbar für User (nur intern für Suche)
4. **Given** Vision API schlägt fehl, **When** Tagging fehlschlägt, **Then** wird Bild trotzdem gespeichert mit leeren Tags (kein Blocker)

---

### User Story 6 - Chat-Session Persistenz (Priority: P2)

Als Lehrkraft möchte ich dass meine Chat-Session nach Agent-Nutzung erhalten bleibt, damit ich nahtlos weiter konversieren kann.

**Aktuelles Problem**:
- Nach Agent Confirmation startet neue Chat-Session
- Vorherige Nachrichten verschwinden
- Kontext geht verloren

**Warum P2**: Betrifft Continuity, aber einzelne Bilder sind nutzbar

**Independent Test**:
1. Chatte 5 Nachrichten
2. Starte Image Agent
3. Generiere Bild
4. Verifiziere: sessionId bleibt gleich, alle 5+ Nachrichten sichtbar, neue Nachrichten werden an gleiche Session angehängt

**Acceptance Scenarios**:

1. **Given** ich habe aktive Chat-Session mit sessionId X, **When** ich Agent starte und Bild erstelle, **Then** bleibt sessionId X erhalten (keine neue Session)
2. **Given** Bild wurde erstellt, **When** ich zurück zum Chat gehe, **Then** sehe ich kompletten Verlauf inkl. Nachrichten vor Agent-Start
3. **Given** ich bin zurück im Chat, **When** ich neue Nachricht schreibe, **Then** wird sie an gleiche Session angehängt mit korrektem message_index

---

### Edge Cases

- **Vision API Timeout**: Wenn Vision API >30s dauert, wird Tagging übersprungen, Bild trotzdem gespeichert
- **Vision API Fehler**: Bei 4xx/5xx Errors → Fallback auf leere Tags, Error wird geloggt
- **Duplikat-Tags**: Tags werden dedupliziert und lowercase normalisiert
- **Sehr lange Tag-Liste**: Maximum 15 Tags, Vision-Prompt enthält Limit
- **Modal Scroll auf Mobile**: Bei kleinen Viewports muss Modal-Content scrollbar sein
- **Concurrent Agent Starts**: Wenn User zweimal schnell klickt, wird nur ein Agent geöffnet (Debouncing)
- **Library leer**: Wenn keine Materialien existieren, keine Navigation zur Library nach Bilderstellung
- **Session ID fehlt**: Wenn sessionId undefined, wird neue Session erstellt (Graceful Fallback)

## Requirements *(mandatory)*

### Functional Requirements - Agent Confirmation Visibility

- **FR-001**: Agent Confirmation Card MUSS orangen Gradient-Hintergrund rendern (`bg-gradient-to-r from-primary-50 to-primary-100`)
- **FR-002**: Agent Confirmation Card MUSS orange Border haben (`border-2 border-primary-500`)
- **FR-003**: Bestätigungs-Button MUSS orange Hintergrund haben (`bg-primary-600`) mit weißem Text
- **FR-004**: "Weiter im Chat" Button MUSS grauen Hintergrund haben (`bg-gray-100`) mit dunklem Text
- **FR-005**: Alle Texte in Card MÜSSEN Kontrast-Ratio ≥4.5:1 haben (WCAG AA)
- **FR-006**: Card MUSS sich visuell vom Chat-Hintergrund abheben (Shadow `shadow-lg` UND Border `border-2 border-primary-500` erforderlich)

### Functional Requirements - Library Navigation

- **FR-007**: "Weiter im Chat" Button Click MUSS zu Library Tab navigieren UND MaterialPreviewModal öffnen
- **FR-008**: MaterialPreviewModal MUSS das neu erstellte Bild anzeigen (via materialId aus AgentResult)
- **FR-009**: Navigation MUSS materialId als Parameter übergeben zur automatischen Modal-Öffnung
- **FR-010**: Library-Komponente MUSS materialId-Parameter aus URL/Context lesen und Modal öffnen
- **FR-011**: Modal MUSS Bild-Preview (groß), Titel, Metadaten, Action-Buttons enthalten

### Functional Requirements - Chat-Verlauf Integration

- **FR-012**: Nach Bilderstellung MUSS Bild als Message mit Typ "assistant" und metadata.type="image" in Chat eingefügt werden
- **FR-013**: Message MUSS Thumbnail-URL, Titel, und originalParams in metadata enthalten
- **FR-014**: Chat-Session MUSS gleiche sessionId behalten (keine neue Session)
- **FR-015**: message_index MUSS sequentiell fortgesetzt werden (kein Reset)
- **FR-016**: Bild-Message MUSS in ChatView als Thumbnail mit Titel gerendert werden
- **FR-017**: Bild-Thumbnail MUSS klickbar sein und Full-Size Preview öffnen

### Functional Requirements - Vision Context

- **FR-018**: Bild MUSS an ChatGPT mit Vision gesendet werden wenn User sich auf Bild bezieht
- **FR-019**: Backend MUSS Bild-URL in messages-Array als image_url Content-Type einfügen
- **FR-020**: ChatGPT MUSS Bild analysieren können und auf visuelle Fragen antworten
- **FR-021**: Wenn Bild-URL nicht mehr verfügbar (404), MUSS Fallback-Message angezeigt werden: "Bild nicht mehr verfügbar. Die Konversation wird nur mit Textkontext fortgesetzt."

### Functional Requirements - Automatisches Tagging

- **FR-022**: Nach Bilderstellung MUSS Backend automatisch Vision API aufrufen für Tagging
- **FR-023**: Vision API Prompt MUSS fragen: "Analysiere dieses Bildungsmaterial und generiere 5-10 relevante Tags auf Deutsch für Suchzwecke. Berücksichtige: Fachgebiet, Thema, visuelle Elemente, Bildungskontext, Perspektive."
- **FR-024**: Tags MÜSSEN als Array in library_materials.metadata.tags gespeichert werden
- **FR-025**: Tags MÜSSEN lowercase normalisiert und dedupliziert werden
- **FR-026**: Maximum 15 Tags pro Bild
- **FR-027**: Tagging DARF NICHT Bildspeicherung blockieren (async, Error-tolerant)
- **FR-028**: Tags MÜSSEN durchsuchbar sein in Library-Suchfunktion
- **FR-029**: Tags DÜRFEN NICHT in UI sichtbar sein (nur intern für Suche)

### Functional Requirements - MaterialPreviewModal

- **FR-030**: Modal MUSS vollständiges Bild-Preview rendern (nicht nur Titel)
- **FR-031**: Modal MUSS scrollbar sein wenn Content viewport überschreitet
- **FR-032**: Modal MUSS "Regenerieren" Button zeigen wenn originalParams vorhanden
- **FR-033**: Modal MUSS "Herunterladen" Button immer zeigen
- **FR-034**: "Regenerieren" MUSS Image Agent mit prefilled Form öffnen
- **FR-035**: "Herunterladen" MUSS Bild als File herunterladen mit sinnvollem Filename

### Key Entities

- **library_materials.metadata**:
  - Enthält `tags: string[]` für automatisch generierte Tags
  - Enthält `originalParams` für Regenerierung
  - Enthält `type`, `image_url`, `title`

- **messages.metadata**:
  - Enthält `type: "image"` für Bild-Messages
  - Enthält `image_url`, `thumbnail_url` für Rendering
  - Enthält `title` für Caption

- **ChatSession**:
  - Bleibt persistent über Agent-Nutzung hinweg
  - `sessionId` bleibt gleich
  - `message_index` läuft sequentiell weiter

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Agent Confirmation Card ist zu 100% der Fälle sichtbar mit korrektem Styling (visueller Test)
- **SC-002**: Navigation nach Bilderstellung führt in 100% der Fälle zu Library mit geöffnetem Modal
- **SC-003**: Bild erscheint in 100% der Fälle als Thumbnail im Chat-Verlauf
- **SC-004**: Vision-Context funktioniert: AI kann Bild-bezogene Fragen in ≥90% der Fälle korrekt beantworten
- **SC-005**: Automatisches Tagging generiert durchschnittlich 7-10 relevante Tags pro Bild
- **SC-006**: Tag-basierte Suche findet relevante Bilder mit ≥80% Precision
- **SC-007**: MaterialPreviewModal zeigt alle Elemente (Preview, Buttons) in 100% der Fälle
- **SC-008**: Chat-Session bleibt in 100% der Fälle persistent (keine neuen Sessions)
- **SC-009**: Build erfolgreich ohne TypeScript Errors
- **SC-010**: E2E Tests für alle 6 User Stories bestehen mit ≥90% Pass Rate

## Assumptions

- Tailwind-Konfiguration ist korrekt (primary-50 bis primary-900 sind definiert)
- InstantDB library_materials Schema enthält metadata Feld
- Backend hat Zugriff auf ChatGPT Vision API (GPT-4 Vision oder GPT-4o)
- Bilder werden via InstantDB Storage gespeichert mit permanenten URLs
- MaterialPreviewModal Komponente existiert bereits, braucht nur Content-Fixes
- AgentResultView hat Zugriff auf materialId nach Erstellung

## Dependencies

- **ChatGPT Vision API**: Erforderlich für FR-018 bis FR-021 (Vision Context) und FR-022 bis FR-029 (Auto-Tagging)
- **InstantDB Storage**: Erforderlich für permanente Bild-URLs
- **Tailwind CSS**: primary-* Farbpalette muss definiert sein
- **Backend /api/vision-tagging Endpoint**: Neuer Endpoint erforderlich für Auto-Tagging

## Out of Scope

- Tag-Editing durch User (Tags sind automatisch und nicht editierbar)
- Tag-Vorschläge in UI anzeigen
- Multi-Language Tags (nur Deutsch)
- Batch-Tagging für existierende Bilder (nur neue Bilder)
- Vision-basierte Bildsuche (nur Text-basierte Tag-Suche)
- Custom Tag-Taxonomien oder Kategorien

## Related Documentation

- **Bug Tracking**: `docs/quality-assurance/bug-tracking.md` - BUG-026 (Agent Confirmation Card Not Rendering)
- **Session Logs**:
  - `docs/development-logs/sessions/2025-10-07/session-03-agent-confirmation-fix.md`
  - `docs/development-logs/sessions/2025-10-07/session-01-bug-012-agent-confirmation-metadata-fix.md`
- **Components**:
  - `teacher-assistant/frontend/src/components/AgentConfirmationMessage.tsx`
  - `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx`
  - `teacher-assistant/frontend/src/components/AgentResultView.tsx`
