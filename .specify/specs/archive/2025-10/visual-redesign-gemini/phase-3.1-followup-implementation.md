# Phase 3.1 Follow-up - Implementation Plan

**Created**: 2025-10-02
**Status**: Ready for Parallel Execution
**Related**: `phase-3.1-followup-tasks.md`

---

## 🚀 Parallel Execution Strategy

### Agent Assignments (Can run in PARALLEL)

#### 🎨 **react-frontend-developer** Agent #1 - Home View Tasks
**Files**: `Home.tsx`, `CalendarCard.tsx`
**Tasks**:
1. ✅ Header entfernen + Profil Icon rechts oben floating
2. ✅ Willkommensnachricht unter Kalender (`Hallo {user.name}!`)
3. ✅ Kalender Grid hinzufügen (08:30 • Klasse 8a, Mathematik)
4. ✅ Letzte Chats Layout kompakt (Icon Name • Datum, 50% Höhe)
5. ✅ Materialien Hinweis ergänzen

**Estimated Time**: 2-3 hours

---

#### 🎨 **react-frontend-developer** Agent #2 - Chat View Tasks
**Files**: `ChatView.tsx`, `PromptTile.tsx`
**Tasks**:
1. ✅ Chat Input horizontal Layout ([📎] [Input] [▶])
2. ✅ Chat Überschrift ändern ("Wollen wir loslegen, {name}?")
3. ✅ Prompt Tiles Orange Icons (#FB6542)
4. ✅ Send Button Orange Farbe
5. ✅ Floating Plus Button (New Chat, unten rechts)

**Estimated Time**: 2-3 hours

---

#### 🎨 **react-frontend-developer** Agent #3 - Library View Tasks
**Files**: `Library.tsx`
**Tasks**:
1. ✅ Chat Cards Datum rechts neben Überschrift
2. ✅ Nachrichtenanzahl entfernen
3. ✅ Material Buttons entfernen (ALLE)

**Estimated Time**: 1 hour

---

## 📁 File Assignments (No Conflicts)

| Agent | Files | Conflicts? |
|-------|-------|------------|
| Agent #1 | `Home.tsx`, `CalendarCard.tsx`, `App.tsx` | ❌ None |
| Agent #2 | `ChatView.tsx`, `PromptTile.tsx` | ❌ None |
| Agent #3 | `Library.tsx` | ❌ None |

✅ **All agents can work in parallel** - No file conflicts!

---

## 🎯 Agent Prompts

### Agent #1 Prompt (Home View)
```
TASK: Phase 3.1 Gemini Follow-up - Home View Polish

FILES TO MODIFY:
- teacher-assistant/frontend/src/pages/Home/Home.tsx
- teacher-assistant/frontend/src/components/CalendarCard.tsx
- teacher-assistant/frontend/src/App.tsx

REQUIREMENTS:

1. **Header entfernen + Profil Icon floating**
   - Remove Orange Header from App.tsx
   - Add floating Profil Icon (rechts oben, position: fixed)
   - Design: Circular, Orange background, white icon
   - Z-index: Above content

2. **Willkommensnachricht unter Kalender**
   - Add below CalendarCard in Home.tsx
   - Text: "Hallo {user.name}!" (use useAuth() → user.name)
   - Fallback: "Hallo!" (if no name)
   - Style: Orange color (text-primary), text-lg, font-semibold

3. **Kalender Grid**
   - CalendarCard.tsx: Add grid showing appointments
   - Example: "08:30 • Klasse 8a, Mathematik"
   - Example: "10:15 • Klasse 10c, Englisch"
   - Use mock data for now (placeholder)
   - Grid: 2 rows, time left, subject right

4. **Letzte Chats kompakt**
   - Layout: [Icon] Chatname • Datum (horizontal, single line)
   - Remove: Nachrichtenanzahl ("2 Nachrichten")
   - Height: Reduce to 50% (from py-4 to py-2)
   - Gap: Tighter spacing

5. **Materialien Hinweis**
   - Empty state: Add hint below "Noch keine Materialien"
   - Text: "Du kannst Materialien im Chat erstellen"
   - Style: text-gray-600, text-sm

GEMINI DESIGN TOKENS:
- Primary Orange: #FB6542 (bg-primary, text-primary)
- Background Teal: #D3E4E6 (bg-background-teal)
- Use existing design tokens from design-tokens.ts

REFERENCE SCREENSHOT:
.specify/specs/home-screen-redesign/Screenshot 2025-10-01 134625.png
```

---

### Agent #2 Prompt (Chat View)
```
TASK: Phase 3.1 Gemini Follow-up - Chat View Polish

FILES TO MODIFY:
- teacher-assistant/frontend/src/components/ChatView.tsx
- teacher-assistant/frontend/src/components/PromptTile.tsx

REQUIREMENTS:

1. **Chat Input horizontal Layout**
   - Current: Vertical stack (BUG)
   - Target: [📎 Attach] [Nachricht schreiben...] [▶ Send]
   - Use Flexbox: flex flex-row items-center gap-2
   - Full width, sticky bottom

2. **Chat Überschrift ändern**
   - Current: "Starten Sie Ihr Gespräch"
   - Target: "Wollen wir loslegen, {user.name}?" (use useAuth())
   - Fallback: "Wollen wir starten?" (if no name)
   - Style: text-2xl, font-bold, text-gray-900

3. **Prompt Tiles Orange Icons**
   - Current: Yellow/Purple icons
   - Target: Orange #FB6542 (text-primary or bg-primary-100)
   - File: PromptTile.tsx
   - Icon circle: bg-primary-100, icon text-primary

4. **Send Button Orange**
   - Current: Gray/disabled
   - Target: Orange #FB6542 (bg-primary)
   - Active state: enabled when input not empty
   - Hover: bg-primary-600

5. **Floating Plus Button (New Chat)**
   - Position: Fixed, bottom-right, above input field
   - Size: 56px x 56px (FAB standard)
   - Icon: addOutline (Ionic)
   - Color: bg-primary, text-white
   - Shadow: shadow-lg
   - Z-index: 50
   - OnClick: Clear chat, start new session

GEMINI DESIGN TOKENS:
- Primary Orange: #FB6542 (bg-primary)
- Use design-tokens.ts constants

IONIC ICONS:
- import { addOutline } from 'ionicons/icons'
```

---

### Agent #3 Prompt (Library View)
```
TASK: Phase 3.1 Gemini Follow-up - Library View Polish

FILES TO MODIFY:
- teacher-assistant/frontend/src/pages/Library/Library.tsx

REQUIREMENTS:

1. **Chat Cards Datum rechts**
   - Current: Datum below title
   - Target: [Icon] Chatname                Datum (right-aligned)
   - Use Flexbox: justify-between
   - Remove line break, single line

2. **Nachrichtenanzahl entfernen**
   - Remove: "2 Nachrichten", "5 Nachrichten"
   - Keep: Chatname + Datum only

3. **Material Buttons entfernen (ALLE)**
   - Remove: "+ Button" oben rechts (if exists)
   - Remove: "Material erstellen" in empty state
   - Remove: Any "Neues Material" buttons
   - Reason: Materials should only be created in Chat

GEMINI DESIGN:
- Keep existing Orange icons (text-primary)
- Maintain compact card design
```

---

## 🔄 Execution Flow

### Step 1: Launch Agents in Parallel
```bash
# Launch all 3 agents simultaneously
claude-code task --agent react-frontend-developer --prompt "[Agent #1 Prompt]"
claude-code task --agent react-frontend-developer --prompt "[Agent #2 Prompt]"
claude-code task --agent react-frontend-developer --prompt "[Agent #3 Prompt]"
```

### Step 2: QA Review (After All Complete)
```bash
# Run QA-Agent for visual regression testing
claude-code task --agent qa-integration-reviewer --prompt "Review Phase 3.1 Follow-up implementation"
```

### Step 3: Session Logs
Each agent creates session log:
- `/docs/development-logs/sessions/2025-10-02/session-XX-phase-3.1-followup-[view].md`

---

## ✅ Success Criteria

### Visual Verification
- [ ] No Orange Header (Profil Icon floating rechts oben)
- [ ] Willkommensnachricht unter Kalender
- [ ] Kalender zeigt Grid (08:30 • Klasse 8a)
- [ ] Chats kompakt (Icon Name • Datum, 50% Höhe)
- [ ] Chat Input horizontal ([📎] [Input] [▶])
- [ ] Prompt Tiles Orange Icons
- [ ] Send Button Orange
- [ ] Floating Plus Button (Chat)
- [ ] Library Datum rechts
- [ ] Keine Material Buttons in Library

### Technical Verification
- [ ] 0 TypeScript errors
- [ ] Build succeeds
- [ ] No console errors
- [ ] All Gemini design tokens used (no hardcoded colors)

---

**Ready for Parallel Execution**: YES ✅
**Estimated Total Time**: 3-4 hours (parallel), 6-7 hours (sequential)
**Time Saved**: 50% via parallelization
