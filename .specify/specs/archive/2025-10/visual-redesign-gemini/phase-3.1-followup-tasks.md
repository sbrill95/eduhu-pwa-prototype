# Phase 3.1 Visual Redesign - Follow-up Tasks

**Created**: 2025-10-02
**Status**: Pending
**Related SpecKit**: `.specify/specs/visual-redesign-gemini/`

---

## 📋 Scope-Kategorisierung

### ✅ IN SCOPE (Phase 3.1 - Visual Polish)
Diese Tasks gehören zur visuellen Umsetzung des Gemini Designs und sollten JETZT erledigt werden:

#### High Priority (P0 - Blocking)
1. **Header Orange entfernen** ❗
   - Gemini Mockup hat **keinen orangenen Header**
   - Profil Icon muss neu positioniert werden (rechts oben, kein Header)
   - File: `App.tsx` oder `Layout.tsx`

2. **Willkommensnachricht unter Kalender** ❗
   - Text: "Hallo [Profilname]!" oder Fallback: "Hallo!"
   - Position: Unter dem Kalender-Card
   - File: `Home.tsx`

3. **Kalender Card - Grid fehlt** ❗
   - Gemini Mockup Vergleich: Kalender hat Grid-Layout
   - File: `CalendarCard.tsx`

4. **Letzte Chats - Layout horizontal** ❗
   - Icon | Chatname | Datum (nebeneinander, nicht untereinander)
   - Anzahl Nachrichten entfernen
   - Höhe reduzieren (50% kleiner, kompakter)
   - File: `Home.tsx`

5. **Materialien Hinweis ergänzen** ❗
   - Text: "Du kannst Materialien im Chat erstellen"
   - Position: In Empty State unter "Noch keine Materialien"
   - File: `Home.tsx`

6. **Chat Input - Layout horizontal** ❗
   - Anhang-Button | Input-Feld | Send-Button (nebeneinander)
   - Aktuell: vertikal angeordnet (BUG)
   - File: `ChatView.tsx`

7. **Chat Überschrift personalisieren** ❗
   - Text: "Wollen wir loslegen, [Name]?" (mit Profilname)
   - Fallback: "Wollen wir starten?" (ohne Name)
   - File: `ChatView.tsx`

8. **Prompt Tiles - Gemini Orange Farbe** ❗
   - Icons sind aktuell gelb/lila statt Orange (#FB6542)
   - File: `PromptTile.tsx` oder `ChatView.tsx`

9. **Send Button - Orange Farbe** ❗
   - Aktuell grau/disabled
   - Soll: Orange (#FB6542)
   - File: `ChatView.tsx`

10. **Library Chats - Datum Layout** ❗
    - Datum rechts neben Überschrift (nicht darunter)
    - Anzahl Nachrichten entfernen
    - File: `Library.tsx`

11. **Library - Material Button entfernen** ❗
    - "Material erstellen" Button soll NICHT in Library sein
    - Nur im Chat sollen Materialien erstellt werden
    - File: `Library.tsx`

12. **Chat - Plus Button für New Chat** ❗
    - Position: Unten rechts, oberhalb Input-Feld
    - Funktion: Neuen Chat starten
    - File: `ChatView.tsx`

---

### ⏳ OUT OF SCOPE (Phase 2.x - Backend/Content)
Diese Tasks erfordern Backend-Änderungen oder Content-Generierung und gehören NICHT zu Phase 3.1:

1. **Chat Summary/Name dynamisch generieren**
   - Aktuell: "New Chat"
   - Gewünscht: ChatGPT Summary des Chatverlaufs
   - **Scope**: Phase 2.1 (Home Screen Redesign - Backend)
   - **SpecKit**: `.specify/specs/home-screen-redesign/` (noch nicht erstellt)
   - **Backend API**: `/api/chat/summary` oder via OpenAI Completion

2. **Prompt Tiles - Synchronisation Home/Chat**
   - Gewünscht: Gleiche Prompts auf Home Screen UND Chat View
   - **Scope**: Phase 2.1 (Home Screen Redesign - Backend)
   - **Backend API**: `/api/prompts/generate-suggestions` (bereits vorhanden)

---

## 🎯 Recommended Execution Order

### Batch 1: Layout Fixes (Critical)
1. Header entfernen + Profil Icon neu positionieren
2. Chat Input - horizontal Layout
3. Letzte Chats - horizontal Layout + Höhe reduzieren

### Batch 2: Color Fixes (Critical)
4. Prompt Tiles - Orange Icons
5. Send Button - Orange Farbe

### Batch 3: Content Additions (High)
6. Willkommensnachricht unter Kalender
7. Materialien Hinweis ergänzen
8. Chat Überschrift personalisieren

### Batch 4: Component Enhancements (Medium)
9. Kalender Card - Grid hinzufügen
10. Library Chats - Datum rechts
11. Chat - Plus Button für New Chat
12. Library - Material Button entfernen

---

## 📁 Files to Modify

### High Impact (Multiple Changes)
- `teacher-assistant/frontend/src/pages/Home/Home.tsx` (6 changes)
- `teacher-assistant/frontend/src/components/ChatView.tsx` (5 changes)
- `teacher-assistant/frontend/src/pages/Library/Library.tsx` (2 changes)

### Medium Impact
- `teacher-assistant/frontend/src/App.tsx` (Header removal)
- `teacher-assistant/frontend/src/components/CalendarCard.tsx` (Grid)
- `teacher-assistant/frontend/src/components/PromptTile.tsx` (Colors)

---

## 🚀 Next Steps

1. **Confirm Scope**: User approval for IN SCOPE tasks
2. **Create Tasks**: Add to `.specify/specs/visual-redesign-gemini/tasks.md`
3. **Execute**: Frontend-Agent implements Batch 1-4
4. **QA**: QA-Agent visual regression testing
5. **Document OUT OF SCOPE**: Create new SpecKit for Phase 2.1 (Home Screen Redesign)

---

**Maintained by**: General-Purpose Agent
**Approved by**: User
**Next Review**: After Phase 3.1 completion
