# Agent UI Modal - Parallel Work Plan

**Created**: 2025-09-30
**Purpose**: Coordinate parallel agent work to minimize conflicts and maximize efficiency
**Total Agents Available**: 3+ (multiple Claude Code windows)

---

## 🎯 Executive Summary

**Total Time Sequential**: 8-10 hours
**Total Time with 3 Parallel Agents**: ~4-5 hours
**Efficiency Gain**: 50% time reduction

---

## 📋 Task Dependency Analysis

### Complete Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND TASKS (Optional Pre-work)        │
│  BACKEND-001: Agent Detection (1-2h) ── Independent         │
│  BACKEND-002: Update Chat Route (30m) ── Depends on 001    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND PHASE 1                        │
│  TASK-001: Feature Flag (15m) ────── Independent            │
│  TASK-002: AgentContext (1h) ──────── Independent           │
│      └──→ TASK-003: Context Tests (45m) ─ Depends on 002   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND PHASE 2                        │
│  TASK-004: Modal Container (30m) ──── Depends on 002        │
│      ├──→ TASK-005: FormView (1.5h) ── Independent          │
│      │      └──→ TASK-006: FormView Tests (30m) ────────┐   │
│      │                                                   │   │
│      ├──→ TASK-007: ProgressView (1h) ── Independent    │   │
│      │      └──→ TASK-008: ProgressView Tests (30m) ────┤   │
│      │                                                   │   │
│      └──→ TASK-009: ResultView (1h) ── Independent      │   │
│           └──→ TASK-010: ResultView Tests (30m) ────────┘   │
│                                                              │
│  All tests can run in parallel after components done        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND PHASE 3                        │
│  TASK-011: AgentSuggestionMessage (45m) ─── Independent     │
│  TASK-012: AgentResultMessage (45m) ──────── Independent    │
│  TASK-013: ChatView Integration (30m) ───── Depends on 011, 012 │
│  TASK-014: Wrap App (15m) ───────────────── Depends on 002, 004 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND PHASE 4                        │
│  TASK-015: Integration Tests (1h) ──── Depends on ALL       │
│  TASK-016: E2E Tests (1.5h) ───────────── Optional          │
│  TASK-017: Run Existing Tests (15m) ───── Depends on 015    │
│  TASK-018: Documentation (30m) ────────── Depends on ALL    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔥 Parallelization Strategy: 3-Agent Setup

### Agent Roles

#### **Agent 1 (Backend-Agent)**
- Focus: Backend Agent Detection
- Window: Separate backend-focused session
- Risk: LOW (separate codebase)

#### **Agent 2 (Frontend-Agent A)**
- Focus: Core State & Modal Components
- Window: Primary frontend session
- Risk: MEDIUM (central files)

#### **Agent 3 (Frontend-Agent B)**
- Focus: Chat Integration & Tests
- Window: Secondary frontend session
- Risk: LOW (independent components)

---

## 📅 Parallel Work Phases

### **PHASE 0: Backend Pre-work (Optional - Run First)**

**Duration**: 1.5-2 hours
**Agent**: Backend-Agent (Agent 1)
**Can Start**: Immediately

| Task | Agent | Files Modified | Duration |
|------|-------|----------------|----------|
| BACKEND-001: Agent Detection | Agent 1 | `backend/src/services/chatService.ts` | 1-2h |
| BACKEND-002: Update Chat Route | Agent 1 | `backend/src/routes/index.ts` | 30m |

**Files Modified**:
- `backend/src/services/chatService.ts`
- `backend/src/routes/index.ts`

**No Conflicts**: Backend is separate from frontend

**Recommendation**:
- ✅ Start this FIRST if you want the full workflow ready
- ⚠️ Or skip and start with frontend (mock backend responses)

---

### **PHASE 1: Foundation (Parallel Start)**

**Duration**: 1-1.5 hours
**Start**: After Phase 0 OR immediately if skipping backend

#### Agent 2 (Frontend-Agent A): Core State

| Task | Files | Duration | Conflicts |
|------|-------|----------|-----------|
| TASK-001: Feature Flag | `featureFlags.ts`, `.env`, `.env.example` | 15m | ❌ None |
| TASK-002: AgentContext | `lib/AgentContext.tsx` (NEW) | 1h | ❌ None |

**Total**: 1h 15m

#### Agent 3 (Frontend-Agent B): Wait for TASK-002

⏳ **TASK-003: Context Tests** depends on TASK-002
- Wait for Agent 2 to finish TASK-002
- Then start TASK-003 (45m)

**Actual Start Time**: After 1h 15m

---

### **PHASE 2A: Modal Components (Max Parallelization)**

**Duration**: 1.5 hours (parallel)
**Start**: After TASK-002 is complete

#### Agent 2 (Frontend-Agent A): Container + FormView

| Task | Files | Duration | Conflicts |
|------|-------|----------|-----------|
| TASK-004: Modal Container | `components/AgentModal.tsx` (NEW) | 30m | ❌ None |
| TASK-005: FormView | `components/AgentFormView.tsx` (NEW) | 1.5h | ❌ None |

**Total**: 2h (sequential within agent)

#### Agent 3 (Frontend-Agent B): ProgressView

| Task | Files | Duration | Conflicts |
|------|-------|----------|-----------|
| TASK-003: Context Tests | `lib/AgentContext.test.tsx` (NEW) | 45m | ❌ None |
| TASK-007: ProgressView | `components/AgentProgressView.tsx` (NEW) | 1h | ❌ None |

**Total**: 1h 45m (sequential within agent)

#### Agent 1 (Backend-Agent): ResultView

| Task | Files | Duration | Conflicts |
|------|-------|----------|-----------|
| TASK-009: ResultView | `components/AgentResultView.tsx` (NEW) | 1h | ❌ None |

**Total**: 1h

**Why This Works**:
- All 3 components are NEW files (no conflicts)
- Agent 1 switches to frontend work after backend done
- No file collisions

---

### **PHASE 2B: Component Tests (Max Parallelization)**

**Duration**: 30 minutes (parallel)
**Start**: After Phase 2A components are done

#### Agent 2: FormView Tests

| Task | Files | Duration |
|------|-------|----------|
| TASK-006: FormView Tests | `components/AgentFormView.test.tsx` (NEW) | 30m |

#### Agent 3: ProgressView Tests

| Task | Files | Duration |
|------|-------|----------|
| TASK-008: ProgressView Tests | `components/AgentProgressView.test.tsx` (NEW) | 30m |

#### Agent 1: ResultView Tests

| Task | Files | Duration |
|------|-------|----------|
| TASK-010: ResultView Tests | `components/AgentResultView.test.tsx` (NEW) | 30m |

**Why This Works**:
- All test files are NEW (no conflicts)
- Each agent tests their own component

---

### **PHASE 3: Chat Integration (Partial Parallelization)**

**Duration**: 1 hour (partial parallel)
**Start**: After Phase 2B tests are done

#### Agent 2: AgentSuggestionMessage

| Task | Files | Duration | Conflicts |
|------|-------|----------|-----------|
| TASK-011: SuggestionMessage | `components/AgentSuggestionMessage.tsx` (NEW) | 45m | ❌ None |

#### Agent 3: AgentResultMessage

| Task | Files | Duration | Conflicts |
|------|-------|----------|-----------|
| TASK-012: ResultMessage | `components/AgentResultMessage.tsx` (NEW) | 45m | ❌ None |

**Both run in parallel** (different files)

#### Agent 1: Wait, then integrate

⏳ **After TASK-011 & TASK-012 done**:

| Task | Files | Duration | Conflicts |
|------|-------|----------|-----------|
| TASK-013: ChatView Integration | `components/ChatView.tsx` (MODIFY) | 30m | ⚠️ High-risk file |
| TASK-014: Wrap App | `App.tsx` (MODIFY) | 15m | ⚠️ High-risk file |

**Total**: 45m (sequential)

**Why Sequential**:
- `ChatView.tsx` and `App.tsx` are central files
- Only ONE agent should modify them
- Avoids merge conflicts

---

### **PHASE 4: Testing & Documentation (Sequential)**

**Duration**: 2 hours
**Start**: After Phase 3 complete

#### Agent 2 (Lead): Integration Tests

| Task | Files | Duration |
|------|-------|----------|
| TASK-015: Integration Tests | `components/AgentModal.integration.test.tsx` (NEW) | 1h |
| TASK-017: Run Existing Tests | N/A (verification) | 15m |

**Total**: 1h 15m

#### Agent 3 (Optional): E2E Tests

| Task | Files | Duration |
|------|-------|----------|
| TASK-016: E2E Tests (Optional) | `e2e-tests/agent-ui-modal.spec.ts` (NEW) | 1.5h |

**Total**: 1.5h (optional, can be done later)

#### Agent 1: Documentation

| Task | Files | Duration |
|------|-------|----------|
| TASK-018: Documentation | `README.md`, session logs | 30m |

**Total**: 30m

**Can Run in Parallel**:
- Agent 2: Integration tests
- Agent 3: E2E tests (optional)
- Agent 1: Documentation

---

## 🚦 File Conflict Matrix

### ❌ NO CONFLICTS (Safe for Parallelization)

| Agent 1 Files | Agent 2 Files | Agent 3 Files |
|---------------|---------------|---------------|
| `chatService.ts` (backend) | `AgentContext.tsx` (NEW) | `AgentContext.test.tsx` (NEW) |
| `index.ts` (backend routes) | `AgentModal.tsx` (NEW) | `AgentProgressView.tsx` (NEW) |
| `AgentResultView.tsx` (NEW) | `AgentFormView.tsx` (NEW) | `AgentProgressView.test.tsx` (NEW) |
| `AgentResultView.test.tsx` (NEW) | `AgentFormView.test.tsx` (NEW) | `AgentSuggestionMessage.tsx` (NEW) |
| `featureFlags.ts` (MODIFY) | N/A | `AgentResultMessage.tsx` (NEW) |

### ⚠️ HIGH CONFLICT RISK (Sequential Only)

| File | Why Risky | Who Modifies | When |
|------|-----------|--------------|------|
| `ChatView.tsx` | Central chat rendering logic | Agent 1 ONLY | TASK-013 |
| `App.tsx` | Root component with providers | Agent 1 ONLY | TASK-014 |
| `instantdb.ts` (frontend) | Schema definition | Agent 2 ONLY | TASK-001 (optional) |

---

## 📊 Time Savings Breakdown

### Sequential Execution (1 Agent)

```
Phase 1: 2h
Phase 2: 3h
Phase 3: 2h
Phase 4: 2h
───────────
Total: 9h
```

### 2-Agent Parallel Execution

```
Phase 1: 1.5h (Agent 1: 1.25h, Agent 2: 45m wait)
Phase 2: 2h (Agent 1 & 2 parallel)
Phase 3: 1.5h (partial parallel)
Phase 4: 1.5h (Agent 1: tests, Agent 2: docs)
──────────────
Total: 6.5h
Savings: 2.5h (28%)
```

### 3-Agent Parallel Execution (Recommended)

```
Phase 0: 1.5h (Agent 1: backend, Agents 2&3: idle)
Phase 1: 1.5h (Agent 2: state, Agent 3: wait + tests)
Phase 2: 2h (All 3 parallel: components + tests)
Phase 3: 1h (Agents 2&3: messages parallel, Agent 1: integration)
Phase 4: 1.5h (All 3 parallel: tests + docs)
──────────────
Total: 4.5-5h (with backend) or 3h (frontend only)
Savings: 4-5h (50%)
```

---

## 🎯 Recommended Execution Plan

### Option A: Full Stack (Backend + Frontend)

**Best for**: Complete feature with agent detection

**Timeline**: 4.5-5 hours

1. **Start Agent 1 (Backend)**: BACKEND-001, BACKEND-002 (1.5h)
2. **Parallel Start Agents 2&3 (Frontend)**: TASK-001, TASK-002 (1.5h)
3. **All 3 Parallel**: Phase 2 components (2h)
4. **All 3 Parallel**: Phase 3 integration (1h)
5. **All 3 Parallel**: Phase 4 testing (1.5h)

### Option B: Frontend First (Skip Backend)

**Best for**: Quick MVP with mocked agent suggestions

**Timeline**: 3-3.5 hours

1. **Agent 2 & 3 Start**: TASK-001, TASK-002, TASK-003 (1.5h)
2. **All 3 Parallel**: Phase 2 components (2h)
3. **All 3 Parallel**: Phase 3 integration (1h)
4. **All 3 Parallel**: Phase 4 testing (1.5h)

**Mock backend responses** in frontend for testing

---

## 🛡️ Conflict Prevention Rules

### Rule 1: File Ownership

Each agent "owns" specific files during their tasks:
- **Agent 1**: Backend files + ResultView + ChatView/App integration
- **Agent 2**: AgentContext + Modal + FormView
- **Agent 3**: Tests + ProgressView + Chat messages

### Rule 2: Communication Checkpoints

Before modifying shared files:
1. Agent announces: "Starting TASK-XXX, modifying `file.tsx`"
2. Other agents acknowledge: "OK, I'm not touching that file"
3. After task: "Finished TASK-XXX, `file.tsx` is free"

### Rule 3: Commit Discipline

- Commit after EACH task (not batch)
- Use branch per agent if needed
- Pull before starting new task

---

## 📝 Agent Handoff Template

### Starting a Task

```markdown
**Agent X Starting**: TASK-XXX - [Task Name]
**Files**: `path/to/file1.tsx`, `path/to/file2.tsx`
**Duration**: ~XXm
**Status**: 🟡 In Progress
**Other Agents**: Please avoid these files
```

### Completing a Task

```markdown
**Agent X Completed**: TASK-XXX - [Task Name]
**Files Modified**: `path/to/file1.tsx`, `path/to/file2.tsx`
**Status**: ✅ Done
**Next**: TASK-YYY or idle
**Files Now Free**: All files released
```

---

## 🚀 Quick Start Commands

### Agent 1 (Backend) - Window 1

```bash
cd teacher-assistant/backend
# Start BACKEND-001: Agent Detection
# Files: src/services/chatService.ts, src/routes/index.ts
```

### Agent 2 (Frontend A) - Window 2

```bash
cd teacher-assistant/frontend
# Start TASK-001: Feature Flag
# Then TASK-002: AgentContext
# Files: src/lib/featureFlags.ts, src/lib/AgentContext.tsx
```

### Agent 3 (Frontend B) - Window 3

```bash
cd teacher-assistant/frontend
# Wait for Agent 2 TASK-002 to complete
# Then start TASK-003: Context Tests
# Files: src/lib/AgentContext.test.tsx
```

---

## ✅ Pre-flight Checklist

Before starting parallel work:

- [ ] All agents have latest code (`git pull`)
- [ ] All agents know their assigned tasks
- [ ] Communication channel established (this chat)
- [ ] Backup branch created (`git checkout -b agent-ui-modal`)
- [ ] Each agent confirms file ownership
- [ ] Conflict prevention rules understood

---

## 🔄 Sync Points (Required)

**Sync Point 1**: After Phase 1
- All agents commit and push
- Verify: AgentContext exists and compiles

**Sync Point 2**: After Phase 2
- All agents commit and push
- Verify: All components exist and tests pass

**Sync Point 3**: After Phase 3
- All agents commit and push
- Verify: ChatView integration works

**Sync Point 4**: Final
- All agents commit and push
- Verify: Full workflow works end-to-end

---

## 📞 Communication Protocol

### Conflict Detected

```
⚠️ CONFLICT: Agent X and Agent Y both editing `file.tsx`
→ Agent Y: STOP work immediately
→ Agent X: Finish and commit
→ Agent Y: Pull and resume
```

### Blocker Encountered

```
🚫 BLOCKED: Agent X needs output from Agent Y
→ Agent X: Switch to alternative task or idle
→ Agent Y: Prioritize blocking task
→ Resume when unblocked
```

### Emergency Stop

```
🛑 STOP ALL: Critical issue found
→ All agents: Commit current work
→ Regroup and reassess
→ Resume with updated plan
```

---

**Maintained by**: General-Purpose Agent
**Status**: Ready for Execution
**Last Updated**: 2025-09-30

**Next Step**: User decides Option A (Full Stack) or Option B (Frontend First)