# Image Generation Modal - Parallel Work Plan

**Feature**: Gemini-Workflow für Bildgenerierung
**Created**: 2025-10-02
**Estimated Time**: 13 hours sequential → **9-10 hours parallel**

---

## 🚀 Parallelisierungs-Strategie

### Übersicht

Mit **3 Agents parallel** können wir die Implementierung von **13 Stunden auf 9-10 Stunden** reduzieren.

**Agents:**
- **Frontend-Agent 1** (React-Frontend-Developer)
- **Frontend-Agent 2** (React-Frontend-Developer)
- **Backend-Agent** (Backend-Node-Developer)

---

## 📅 Timeline (Parallel)

### Phase 1: Foundation (2 Stunden) - PARALLEL

#### Agent 1: Confirmation Message
**Tasks**: TASK-001, TASK-002, TASK-003
**Time**: 2 hours

```
[Agent 1: Frontend]
├─ TASK-001: Create AgentConfirmationMessage.tsx (1h)
├─ TASK-002: Unit Tests (30min)
└─ TASK-003: ChatView Integration (30min)

✅ Deliverable: Confirmation message works in Chat
```

#### Agent 2: Type Definition + Form Start
**Tasks**: TASK-004, TASK-005 (partial)
**Time**: 2 hours

```
[Agent 2: Frontend]
├─ TASK-004: Update ImageGenerationFormData Type (15min)
└─ TASK-005: Redesign AgentFormView (1h 45min)
    ├─ Header & Title ✅
    ├─ Thema field ✅
    ├─ Lerngruppe dropdown ✅
    └─ Toggles (partial, finish in Phase 2)

✅ Deliverable: Form skeleton ready
```

#### Agent 3: Backend Enhancement
**Tasks**: TASK-012
**Time**: 45 minutes

```
[Agent 3: Backend]
└─ TASK-012: Update Prompt Engineering (45min)
    ├─ buildPrompt() function
    ├─ DaZ logic
    ├─ Lernschwierigkeiten logic
    └─ Unit tests

✅ Deliverable: Backend ready for new parameters
```

**⏱️ Phase 1 Total: 2 hours (all agents working simultaneously)**

---

### Phase 2: Components (2 Stunden) - PARTIAL PARALLEL

#### Agent 1: Form Completion + Tests
**Tasks**: TASK-005 (finish), TASK-006
**Time**: 1.5 hours

```
[Agent 1: Frontend]
├─ TASK-005: Complete AgentFormView (45min)
│   ├─ Finish Toggles
│   ├─ CTA Button
│   └─ Validation
└─ TASK-006: Form Unit Tests (45min)

✅ Deliverable: Form complete with tests
```

#### Agent 2: Result View Enhancement
**Tasks**: TASK-007, TASK-008
**Time**: 1.5 hours

```
[Agent 2: Frontend]
├─ TASK-007: Add Buttons to ResultView (1h)
│   ├─ "Teilen" button + logic
│   └─ "Weiter im Chat" button (trigger only)
└─ TASK-008: Button Unit Tests (30min)

✅ Deliverable: Result buttons work
```

**⏱️ Phase 2 Total: 1.5 hours (2 agents parallel, Backend idle)**

---

### Phase 3: Animation (2 Stunden) - SEQUENTIAL

#### Agent 1: Animation Implementation
**Tasks**: TASK-009, TASK-010, TASK-011
**Time**: 2 hours

```
[Agent 1: Frontend]
├─ TASK-009: Implement animateToLibrary() (1h 30min)
│   ├─ Clone logic
│   ├─ Position calculation
│   ├─ Web Animations API
│   └─ Cleanup
├─ TASK-010: Add CSS (15min)
└─ TASK-011: Animation Tests (15min)

✅ Deliverable: Animation works at 60fps
```

**Why Sequential?**
- Animation ist komplex und braucht Fokus
- Nur 1 Agent kann effizient daran arbeiten
- Andere Agents machen Pause oder Prep für QA

**⏱️ Phase 3 Total: 2 hours (1 agent, others idle)**

---

### Phase 4: QA & Integration (3 Stunden) - PARALLEL

#### Agent 1: Integration Tests
**Tasks**: TASK-013
**Time**: 1 hour

```
[Agent 1: Frontend]
└─ TASK-013: Full Workflow Integration Test (1h)
    ├─ Mock SSE
    ├─ Mock Agent execution
    └─ Verify animation trigger

✅ Deliverable: Integration test passing
```

#### Agent 2: E2E Tests
**Tasks**: TASK-014
**Time**: 1.5 hours

```
[Agent 2: QA/Playwright]
└─ TASK-014: Playwright E2E Tests (1h 30min)
    ├─ Full workflow test
    ├─ Share button test
    ├─ Animation verification
    └─ Mobile viewport test

✅ Deliverable: E2E tests passing
```

#### Agent 3: Final QA
**Tasks**: TASK-015
**Time**: 30 minutes (after Agent 1 & 2 finish)

```
[Agent 3: QA]
└─ TASK-015: Run Full Suite + Documentation (30min)
    ├─ npm run test (all)
    ├─ npm run test:e2e
    ├─ Type-check
    └─ Create Session Log

✅ Deliverable: All tests passing, docs ready
```

**⏱️ Phase 4 Total: 1.5 hours (agents work in sequence within phase)**

---

## 📊 Time Comparison

### Sequential (1 Agent)
```
Phase 1: Confirmation         2h
Phase 2: Gemini Form          3h
Phase 3: Result Enhancement   2h
Phase 4: Animation            2h
Phase 5: Backend              1h
Phase 6: QA                   3h
───────────────────────────────
TOTAL:                       13h
```

### Parallel (3 Agents)
```
Phase 1: Foundation           2h  (3 agents parallel)
Phase 2: Components           1.5h (2 agents parallel)
Phase 3: Animation            2h  (1 agent, focused)
Phase 4: QA & Integration     3h  (2-3 agents, mixed)
───────────────────────────────
TOTAL:                       8.5h - 10h
```

**⏱️ Time Saved: 3-4.5 hours (26-35% faster)**

---

## 🔀 Detailed Task Assignment

### Sprint 1 (2h) - Parallel Kickoff

| Agent | Tasks | Duration |
|-------|-------|----------|
| **Frontend-1** | TASK-001 → TASK-002 → TASK-003 | 2h |
| **Frontend-2** | TASK-004 → TASK-005 (partial) | 2h |
| **Backend** | TASK-012 | 45min |

**After 2 hours:**
- ✅ Confirmation message in Chat works
- ✅ Form skeleton exists
- ✅ Backend ready for new params

---

### Sprint 2 (1.5h) - Partial Parallel

| Agent | Tasks | Duration |
|-------|-------|----------|
| **Frontend-1** | TASK-005 (finish) → TASK-006 | 1.5h |
| **Frontend-2** | TASK-007 → TASK-008 | 1.5h |
| **Backend** | ⏸️ Idle (or prep QA) | - |

**After 3.5 hours total:**
- ✅ Form complete with tests
- ✅ Result buttons work
- ✅ Backend ready

---

### Sprint 3 (2h) - Focused Animation

| Agent | Tasks | Duration |
|-------|-------|----------|
| **Frontend-1** | TASK-009 → TASK-010 → TASK-011 | 2h |
| **Frontend-2** | ⏸️ Idle (or start QA prep) | - |
| **Backend** | ⏸️ Idle | - |

**After 5.5 hours total:**
- ✅ Animation works at 60fps
- ✅ All components ready

---

### Sprint 4 (3h) - QA Parallel

| Agent | Tasks | Duration | Start Time |
|-------|-------|----------|------------|
| **Frontend-1** | TASK-013 | 1h | 0:00 |
| **Frontend-2** | TASK-014 | 1.5h | 0:00 |
| **QA-Agent** | TASK-015 | 30min | 1:30 (after others) |

**After 8.5 hours total:**
- ✅ Integration tests passing
- ✅ E2E tests passing
- ✅ All tests verified
- ✅ Documentation complete

---

## 🎯 Coordination Points

### Handoff 1: After Phase 1 (2h mark)
**Frontend-1 → Frontend-2**
- Frontend-1 finishes Confirmation (TASK-003)
- Frontend-2 has Form skeleton (TASK-005 partial)
- **Sync**: Confirm Confirmation works before moving on

### Handoff 2: After Phase 2 (3.5h mark)
**Frontend-1 & Frontend-2 → Frontend-1 (Animation)**
- Frontend-1 finishes Form (TASK-006)
- Frontend-2 finishes Result buttons (TASK-008)
- **Sync**: Verify both components work before Animation
- Frontend-1 takes over for Animation (TASK-009)

### Handoff 3: After Phase 3 (5.5h mark)
**Frontend-1 → All Agents (QA)**
- Frontend-1 finishes Animation (TASK-011)
- **Sync**: Run quick manual test of full workflow
- All agents start QA tasks in parallel

### Handoff 4: During Phase 4 (QA)
**Frontend-1 & Frontend-2 → QA-Agent**
- Frontend-1 finishes Integration test (TASK-013)
- Frontend-2 finishes E2E test (TASK-014)
- **Handoff**: QA-Agent runs full suite (TASK-015)

---

## 🛠️ Practical Execution

### Option A: Manual Coordination (mit dir als PM)

**Du koordinierst die Agents:**

```bash
# Sprint 1 Start (0:00)
# Terminal 1: Frontend-1
claude-code "Frontend-Agent: Führe TASK-001, TASK-002, TASK-003 aus"

# Terminal 2: Frontend-2 (parallel)
claude-code "Frontend-Agent: Führe TASK-004, TASK-005 (bis Toggles) aus"

# Terminal 3: Backend (parallel)
claude-code "Backend-Agent: Führe TASK-012 aus"

# Nach 2h: Check-in
# Sind alle Tasks fertig? Wenn ja, weiter zu Sprint 2
```

### Option B: Task Tool (automatisch)

**Nutze den Task-Tool für parallele Agent-Starts:**

```typescript
// In einem einzigen Prompt:
"Starte 3 Agents parallel:
- Frontend-Agent 1: TASK-001 → TASK-002 → TASK-003
- Frontend-Agent 2: TASK-004 → TASK-005 (partial)
- Backend-Agent: TASK-012

Koordiniert euch nach 2 Stunden."
```

Claude Code startet dann automatisch alle 3 Agents parallel.

---

## ⚠️ Konflikt-Management

### Mögliche Konflikte

1. **Gleiche Datei-Änderungen**:
   - ❌ Beide Agents ändern `AgentContext.tsx`
   - ✅ Lösung: Sequentialisieren oder klare Abschnitte zuweisen

2. **Merge-Konflikte**:
   - ❌ Agent 1 commited, Agent 2 hat veralteten Branch
   - ✅ Lösung: Frequent pulls, oder finale Merge am Ende

3. **Breaking Changes**:
   - ❌ Backend ändert API, Frontend-Agents wissen es nicht
   - ✅ Lösung: Backend commited zuerst, Frontend pulled dann

### Conflict Resolution Strategy

**Regel 1: No Overlapping Files**
- Frontend-1: `AgentConfirmationMessage.tsx`, `ChatView.tsx`
- Frontend-2: `AgentFormView.tsx`, `types.ts`
- Backend: `langGraphImageGenerationAgent.ts`
- **Kein Agent darf die Datei eines anderen anfassen während Sprint läuft**

**Regel 2: Sequential Integration**
- Phase 1 & 2: Parallel (keine Abhängigkeiten)
- Phase 3: Sequential (Animation braucht Result-Button)
- Phase 4: Parallel (QA-Tasks sind unabhängig)

**Regel 3: Sync Checkpoints**
- Nach jeder Phase: **Sync-Meeting** (2 Minuten)
- Alle Agents reporten Status
- Konflikte werden sofort gelöst

---

## 📋 Checklist für Parallelisierung

### Vor dem Start
- [ ] Alle Agents haben Zugriff auf das Repo
- [ ] Alle Agents haben die SpecKit-Dateien gelesen
- [ ] Task-Assignments sind klar verteilt
- [ ] Kommunikations-Kanal ist etabliert (z.B. Discord, Slack)

### Während der Arbeit
- [ ] Agents commiten nach jedem Task (kleine Commits)
- [ ] Agents pushen regelmäßig (alle 30min)
- [ ] Agents pullen vor jedem neuen Task
- [ ] Agents kommunizieren bei Blockers sofort

### Nach jedem Sprint
- [ ] Sync-Meeting (2min)
- [ ] Merge-Konflikte lösen
- [ ] Smoke-Test: Funktioniert alles zusammen?
- [ ] Weiter zum nächsten Sprint

---

## 🎯 Empfehlung

**Beste Strategie für dich:**

### Variante 1: Claude Code Task Tool (einfachste)
```bash
# Du gibst einen einzigen Befehl:
"Implementiere Image Generation Modal - Gemini Workflow mit 3 Agents parallel:
- Frontend-Agent 1: Confirmation Message (TASK-001-003)
- Frontend-Agent 2: Gemini Form (TASK-004-006)
- Backend-Agent: Prompt Engineering (TASK-012)

Koordiniert euch nach Phase 1."
```

Claude Code orchestriert dann automatisch die Agents.

### Variante 2: Manuelle Terminals (mehr Kontrolle)
```bash
# Terminal 1
claude-code "Frontend-Agent: Implementiere TASK-001 bis TASK-003"

# Terminal 2
claude-code "Frontend-Agent: Implementiere TASK-004 bis TASK-005"

# Terminal 3
claude-code "Backend-Agent: Implementiere TASK-012"
```

Du koordinierst manuell.

### Variante 3: Schrittweise (sicherste)
```bash
# Sprint 1
claude-code "Implementiere Phase 1 mit 3 Agents parallel"
# Warte bis fertig, dann:

# Sprint 2
claude-code "Implementiere Phase 2 mit 2 Agents parallel"
# etc.
```

---

## 📊 Erwartetes Ergebnis

**Nach 8.5-10 Stunden:**
- ✅ Alle 15 Tasks completed
- ✅ Alle Tests passing
- ✅ Gemini-Workflow funktioniert Ende-zu-Ende
- ✅ Animation läuft smooth
- ✅ Session-Log dokumentiert

**vs. 13 Stunden bei sequentieller Arbeit**

**⏰ Zeitersparnis: 3-4.5 Stunden (26-35%)**

---

## Nächster Schritt

**Möchtest du:**

1. **Variante 1**: Ich starte alle 3 Agents jetzt automatisch (Task Tool)
2. **Variante 2**: Du startest manuell in 3 Terminals (ich gebe dir die Commands)
3. **Variante 3**: Wir machen Sprint-für-Sprint (du entscheidest nach jeder Phase)

**Welche Variante bevorzugst du?**
