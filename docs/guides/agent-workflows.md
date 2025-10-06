# Agent System - Rollen, Verantwortlichkeiten & Workflows

**Letzte Aktualisierung**: 2025-09-30
**Status**: Active - 5 Agents im Einsatz

---

## 🎯 Übersicht

Das Teacher Assistant Projekt nutzt spezialisierte AI-Agents für verschiedene Entwicklungsphasen. Jeder Agent hat klare Verantwortlichkeiten, Workflows und Integration mit SpecKit.

### Aktive Agents
1. **Backend-Agent** (backend-node-developer)
2. **Frontend-Agent** (react-frontend-developer)
3. **Emotional Design Agent** (emotional-design-specialist) ⭐ NEU
4. **QA-Agent** (qa-integration-reviewer)
5. **Playwright-Agent** (Browser-Test-Automation)

---

## 📋 Agent-Übersicht Matrix

| Agent | Primäre Rolle | SpecKit-Phase | Haupt-Outputs | Typische Dauer |
|-------|---------------|---------------|---------------|----------------|
| **Backend-Agent** | Backend-Implementierung, OpenAI/LangGraph | Plan + Tasks | API Endpoints, Services, Agents | 2-4h pro Feature |
| **Frontend-Agent** | React-Implementierung, InstantDB | Plan + Tasks | Components, Pages, Hooks | 2-3h pro Feature |
| **Emotional Design Agent** ⭐ | UX/UI Optimierung, Emotional Flow | Spec Review + Plan + Polish | Design Guidelines, UX Improvements | 1-3h pro Feature |
| **QA-Agent** | Testing & Quality | Tasks + Validation | Tests, Reports, Reviews | 1-3h pro Feature |
| **Playwright-Agent** | E2E Testing | Tasks (Testing Phase) | E2E Tests, Test Reports | 1-2h pro Feature |

---

## 🔄 Agent-Workflow Integration mit SpecKit

### Phase 1: Spezifikation (Spec)
**Verantwortlich**: Product Owner / User (nicht AI-Agent)
**Output**: `.specify/specs/[feature]/spec.md`

**Agent-Rolle**: Review-Support
- Agents können Specs reviewen und Feedback geben
- Technische Feasibility-Checks durchführen
- Fragen zu Anforderungen klären

---

### Phase 2: Technical Planning (Plan)
**Primär verantwortlich**: Backend-Agent ODER Frontend-Agent
**Output**: `.specify/specs/[feature]/plan.md`

**Workflow**:
```
1. Spec-Review durch zuständigen Agent
2. Architecture Design erstellen
3. Component/Service-Liste definieren
4. Data Models entwerfen
5. Testing Strategy definieren
6. Plan dokumentieren in plan.md
```

**Wann welcher Agent?**
- **Backend-Agent**: API-heavy Features, Datenmodelle, Services
- **Frontend-Agent**: UI-heavy Features, User Flows, Components
- **Beide**: Full-Stack Features (Backend startet mit API-Design)

---

### Phase 3: Task Definition (Tasks)
**Verantwortlich**: Agent der Phase 2 + QA-Agent Input
**Output**: `.specify/specs/[feature]/tasks.md`

**Workflow**:
```
1. Plan in konkrete Tasks aufbrechen
2. Dependencies identifizieren
3. Prioritäten setzen (P0, P1, P2)
4. Testing-Tasks hinzufügen (QA-Agent Input)
5. Time Estimates hinzufügen
6. Tasks dokumentieren in tasks.md
```

**Task-Aufteilung**:
- **Backend-Tasks**: API Endpoints, Services, Migrations
- **Frontend-Tasks**: Components, Pages, State Management
- **QA-Tasks**: Unit Tests, Integration Tests, E2E Tests
- **Integration-Tasks**: Frontend-Backend Integration

---

### Phase 4: Implementation (Parallel Work)
**Alle Agents arbeiten parallel an ihren Tasks**

**Backend-Agent Workflow**:
```
1. Task aus tasks.md auswählen (Backend-relevanter Task)
2. API Endpoint / Service implementieren
3. Unit Tests schreiben (Jest/Supertest)
4. Integration Tests schreiben
5. Session-Log erstellen: docs/development-logs/sessions/YYYY-MM-DD/
6. Task in tasks.md markieren: ✅ completed
7. Nächsten Task auswählen
```

**Frontend-Agent Workflow**:
```
1. Task aus tasks.md auswählen (Frontend-relevanter Task)
2. Component / Page implementieren
3. Unit Tests schreiben (React Testing Library)
4. Integration mit Backend testen
5. Session-Log erstellen: docs/development-logs/sessions/YYYY-MM-DD/
6. Task in tasks.md markieren: ✅ completed
7. Nächsten Task auswählen
```

**QA-Agent Workflow**:
```
1. Testing-Tasks aus tasks.md auswählen
2. Test Strategy validieren
3. Integration Tests schreiben
4. Test Reports erstellen: docs/testing/test-reports/
5. Bug Tracking: docs/quality-assurance/bug-tracking.md
6. Session-Log erstellen
7. Task in tasks.md markieren: ✅ completed
```

**Playwright-Agent Workflow**:
```
1. E2E-Tasks aus tasks.md auswählen
2. E2E Tests implementieren (Playwright)
3. Test durchführen und Reports generieren
4. Screenshots/Videos speichern: docs/testing/artifacts/
5. Session-Log erstellen
6. Task in tasks.md markieren: ✅ completed
```

---

## 🔗 Agent-Koordination & Kommunikation

### Synchronisations-Punkte

#### Daily Check-In (vor Start)
```
Jeder Agent prüft:
1. tasks.md - Welche Tasks sind verfügbar?
2. Was haben andere Agents gestern completed?
3. Gibt es Blocker in tasks.md?
4. Welche Dependencies sind jetzt aufgelöst?
```

#### Task Completion
```
Nach jedem Task:
1. Session-Log in docs/development-logs/sessions/ erstellen
2. Task in tasks.md als completed markieren
3. Nächsten Task kommunizieren (in tasks.md updaten)
4. Blocker dokumentieren falls vorhanden
```

#### Feature Completion
```
Wenn alle Tasks completed:
1. QA-Agent macht Final Review
2. Alle Agents dokumentieren Retrospective
3. Implementation Details (optional): docs/architecture/implementation-details/
4. Feature-Status in tasks.md: completed
```

---

## 📊 Agent-Verantwortlichkeiten im Detail

### Backend-Agent (backend-node-developer)

**Spezialisierung**: Node.js, Express, TypeScript, OpenAI API, LangGraph, InstantDB

**Primäre Verantwortlichkeiten**:
- Express API Endpoints implementieren mit TypeScript strict mode
- Services und Business Logic mit klarer Separation of Concerns
- Datenbank-Schema Design für InstantDB mit educational context
- **OpenAI Integration**: Educational context enhancement, German prompts
- **LangGraph Agent System**: Agent detection, workflows, Redis checkpoints
- Educational Context Prioritization (manual vs AI-extracted)
- German-localized error handling und user-friendly messages
- Redis / Caching Implementation
- API Testing (Unit + Integration)

**Erstellt / Modifiziert**:
- `/teacher-assistant/backend/src/routes/` - RESTful API Endpoints
- `/teacher-assistant/backend/src/services/` - Business Logic
- `/teacher-assistant/backend/src/middleware/` - Logging, Validation, Auth
- `/teacher-assistant/backend/src/config/` - OpenAI, Redis, InstantDB configs
- `/teacher-assistant/backend/src/schemas/` - InstantDB Schema Design
- `/teacher-assistant/backend/src/agents/` - LangGraph Agents

**Educational Focus**:
- German educational terminology und school system specifics
- Teacher context prioritization systems
- Educational material management APIs
- Cost control und usage monitoring für OpenAI/LangGraph

**Testing-Verantwortung**:
- Unit Tests (Jest) für alle Services
- API Integration Tests (Supertest)
- Service Logic Tests mit educational data
- Error Scenario Testing mit German messages

**Dokumentation**:
- Session-Logs nach jedem Task (mit Implementation Details)
- API-Dokumentation in `/architecture/api-documentation.md`
- Technical Decisions in `/development-logs/implementation-decisions.md`
- Implementation Details bei komplexen Features

**SpecKit-Integration**:
- Reviewed `.specify/specs/[feature]/spec.md` vor Planning
- Erstellt `plan.md` für Backend-heavy Features
- Definiert Backend-Tasks in `tasks.md`
- Implementiert Tasks gemäß Spec und Plan
- Dokumentiert Abweichungen und Decisions

**Code-Qualität**:
- TypeScript strict type checking
- Proper interface definitions
- RESTful API design mit consistent response formats
- Middleware für cross-cutting concerns
- Comprehensive error handling mit HTTP status codes

---

### Frontend-Agent (React-Frontend-Developer)

**Primäre Verantwortlichkeiten**:
- React Components entwickeln (TypeScript)
- Pages und Routing implementieren
- State Management (Context, Hooks)
- InstantDB Integration (Auth, Queries, Mutations)
- UI/UX mit Tailwind CSS
- Mobile-First Responsive Design
- Component Testing

**Erstellt / Modifiziert**:
- `/teacher-assistant/frontend/src/components/`
- `/teacher-assistant/frontend/src/pages/`
- `/teacher-assistant/frontend/src/hooks/`
- `/teacher-assistant/frontend/src/lib/`

**Testing-Verantwortung**:
- Component Unit Tests (React Testing Library)
- Hook Tests
- User Interaction Tests

**Dokumentation**:
- Session-Logs nach jedem Task
- UI/UX Design Decisions
- Component Documentation (bei komplexen Components)

**SpecKit-Integration**:
- Erstellt `plan.md` für Frontend-heavy Features
- Definiert Frontend-Tasks in `tasks.md`
- Implementiert Frontend-Tasks aus `tasks.md`

**Koordination**:
- Arbeitet eng mit Emotional Design Agent für UX-Optimierung
- Übernimmt Emotional Design Guidelines in Component-Implementierung

---

### Emotional Design Agent (emotional-design-specialist) ⭐ NEU

**Spezialisierung**: UX/UI Optimization, Emotional Flow, Addictiveness, Ease-of-Use

**Primäre Verantwortlichkeiten**:
- **Emotional Design Principles** anwenden für intuitive, angenehme User Experience
- **Addictiveness**-Faktoren integrieren (ohne Dark Patterns)
  - Micro-interactions und delightful animations
  - Progress indicators und achievement feedback
  - Smooth transitions und flow states
- **Ease-of-Use** maximieren
  - Cognitive load reduzieren
  - Clear information hierarchy
  - Intuitive navigation patterns
- **User Flow Optimization**
  - Friction points identifizieren und eliminieren
  - Emotional journey mapping
  - Moment-of-delight Design
- Mobile-First Emotional Design
- German UX writing und tone-of-voice

**Involvierung in SpecKit-Phasen**:

**Phase 1 - Spec Review**:
- User Stories auf emotional outcomes reviewen
- UX-kritische Requirements identifizieren
- Emotional design opportunities vorschlagen

**Phase 2 - Plan Enhancement**:
- UI-Flow emotional optimieren
- Micro-interaction Opportunities identifizieren
- Design-System Guidelines definieren
- Accessibility und Inclusive Design sicherstellen

**Phase 4 - Implementation Polish**:
- Nach Frontend-Implementation: UX-Review durchführen
- Emotional Design Details hinzufügen:
  - Animations und Transitions
  - Micro-feedbacks (haptics, sounds, visual)
  - Loading states optimieren
  - Error states human-friendly gestalten

**Erstellt / Modifiziert**:
- Design Guidelines in `/docs/guides/emotional-design-principles.md`
- UX Improvements in bestehenden Components
- Animation/Transition Configs
- Tailwind CSS custom utilities für emotional design

**Emotional Design Principles**:
1. **Joy**: Positive emotional responses durch delightful interactions
2. **Trust**: Konsistenz, Verlässlichkeit, keine Überraschungen
3. **Clarity**: Sofort verständlich, kein Rätselraten
4. **Empowerment**: User fühlt sich kompetent und in Kontrolle
5. **Flow**: Seamless transitions, kein cognitive friction
6. **Feedback**: Immediate feedback auf alle Aktionen
7. **Forgiveness**: Fehler sind einfach korrigierbar (undo/redo)

**Addictiveness-Strategien (Ethical)**:
- ✅ **Progress Visualization**: Klare Erfolgserlebnisse zeigen
- ✅ **Micro-Achievements**: Kleine Wins feiern
- ✅ **Smooth Onboarding**: Erste Erfolge schnell erreichen
- ✅ **Habit Formation**: Regelmäßige Nutzung durch Wert, nicht Tricks
- ❌ **Keine Dark Patterns**: Keine manipulative Techniken
- ❌ **Keine Artificial Scarcity**: Keine künstliche Verknappung
- ❌ **Keine Endless Scroll**: Respekt für User's Zeit

**Tools & Frameworks**:
- Framer Motion für React animations
- Tailwind CSS für consistent design system
- GSAP für komplexe animations (falls nötig)
- React Spring für physics-based animations

**Testing-Verantwortung**:
- User Flow Testing (mit Playwright-Agent)
- Emotional Response Evaluation
- Accessibility Testing (WCAG 2.1)
- Mobile UX Testing

**Dokumentation**:
- Session-Logs für UX-Improvements
- Design Decision Documentation
- Before/After UX Comparisons
- User Feedback Integration

**SpecKit-Integration**:
- Reviewt `spec.md` für emotional design opportunities
- Ergänzt `plan.md` mit UX-Optimierungen
- Erstellt Polish-Tasks in `tasks.md`
- Implementiert nach Frontend-Agent als Polish-Phase

**Koordination**:
- Arbeitet nach Frontend-Agent (Polish-Phase)
- Gibt Feedback an Frontend-Agent für kommende Features
- Kooperiert mit QA-Agent für UX-Testing

**Example Improvements**:
```typescript
// BEFORE: Basic button
<button onClick={handleSubmit}>Speichern</button>

// AFTER: Emotional Design Enhanced
<button
  onClick={handleSubmit}
  className="group relative overflow-hidden transition-all duration-300
             hover:scale-105 active:scale-95
             bg-gradient-to-r from-blue-500 to-blue-600
             hover:from-blue-600 hover:to-blue-700
             disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={isLoading}
>
  <span className="relative z-10 flex items-center gap-2">
    {isLoading ? (
      <>
        <Spinner className="animate-spin" />
        Wird gespeichert...
      </>
    ) : (
      <>
        <CheckIcon className="group-hover:scale-110 transition-transform" />
        Speichern
      </>
    )}
  </span>
  {/* Success ripple effect */}
  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20
                   transition-opacity duration-300" />
</button>
```

---

### QA-Agent (QA-Integration-Reviewer)

**Primäre Verantwortlichkeiten**:
- Test Strategy Development
- Integration Testing (Frontend ↔ Backend)
- Test Reports und Quality Metrics
- Bug Tracking und Issue Management
- Production Readiness Reviews
- Performance Testing
- Security Reviews

**Erstellt / Modifiziert**:
- `/docs/testing/test-reports/`
- `/docs/quality-assurance/bug-tracking.md`
- Test files in frontend/backend

**Testing-Verantwortung**:
- Integration Tests (Full Stack)
- System Tests
- Performance Tests
- Security Tests

**Dokumentation**:
- Test Reports nach jedem Testing-Sprint
- Bug-Tracking Updates
- QA Session-Logs
- Production Readiness Checklists

**SpecKit-Integration**:
- Reviewt `plan.md` für Testing Strategy
- Fügt Testing-Tasks zu `tasks.md` hinzu
- Implementiert Testing-Tasks
- Final Feature Review vor Completion

---

### Playwright-Agent (Browser-Test-Automation)

**Primäre Verantwortlichkeiten**:
- End-to-End Tests entwickeln (Playwright)
- User Flow Testing
- Cross-Browser Testing
- Mobile Responsiveness Testing
- Visual Regression Testing
- Test Automation Maintenance

**Erstellt / Modifiziert**:
- `/teacher-assistant/frontend/e2e-tests/`
- `/docs/testing/artifacts/`
- `/docs/testing/test-reports/`

**Testing-Verantwortung**:
- E2E User Flow Tests
- Browser Compatibility Tests
- Mobile Experience Tests
- Regression Tests

**Dokumentation**:
- E2E Test Reports
- Screenshots / Videos von Tests
- Session-Logs für Test Implementation

**SpecKit-Integration**:
- Reviewt `spec.md` für User Flows
- Erstellt E2E-Tasks in `tasks.md` basierend auf User Stories
- Implementiert E2E-Tests parallel zu Feature-Development

---

## 🎯 Workflow-Szenarien

### Szenario 1: Neues Full-Stack Feature

```
Day 1 - Planning:
├── User/PM erstellt spec.md
├── Backend-Agent + Frontend-Agent + Emotional Design Agent reviewen Spec
├── Emotional Design Agent: User Flow und emotional outcomes analysieren
├── Backend-Agent erstellt plan.md (API Design)
├── Frontend-Agent ergänzt plan.md (UI Design)
├── Emotional Design Agent ergänzt plan.md (UX Optimizations)
└── Alle erstellen gemeinsam tasks.md (inkl. Polish-Tasks)

Day 2-4 - Parallel Implementation:
├── Backend-Agent: API Endpoints implementieren
├── Frontend-Agent: UI Components implementieren (mit Basic UX)
├── QA-Agent: Integration Tests schreiben
├── Playwright-Agent: E2E Tests entwickeln
└── Jeder dokumentiert in Session-Logs

Day 5 - Integration & Polish:
├── Frontend-Agent: Backend Integration
├── Emotional Design Agent: UX Polish Phase
│   ├── Animations und Transitions hinzufügen
│   ├── Micro-interactions optimieren
│   ├── Loading/Error states verbessern
│   └── User Flow friction eliminieren
├── QA-Agent: Full Integration Test + UX Testing
├── Playwright-Agent: Complete E2E Flows
└── Bug Fixing durch jeweiligen Agent

Day 6 - Review & Deploy:
├── Emotional Design Agent: Final UX Review
├── QA-Agent: Production Readiness Review
├── Alle Agents: Retrospective in Session-Logs
└── Feature Deployment
```

### Szenario 2: Backend-Only Feature (z.B. neue API)

```
Day 1:
├── Backend-Agent erstellt spec.md + plan.md + tasks.md
└── QA-Agent reviewt Testing Strategy

Day 2-3:
├── Backend-Agent: API Implementation + Unit Tests
├── QA-Agent: API Integration Tests
└── Session-Logs nach jedem Task

Day 4:
├── QA-Agent: Final API Testing
├── Backend-Agent: Dokumentation
└── Production Deployment
```

### Szenario 3: Bug Fix

```
Bug Discovery:
├── Any Agent entdeckt Bug
└── Dokumentiert in docs/quality-assurance/bug-tracking.md

Bug Analysis:
├── Zuständiger Agent analysiert Root Cause
└── Erstellt Fix-Plan (kein vollständiges SpecKit bei kleinen Bugs)

Bug Fix:
├── Agent implementiert Fix + Tests
├── Session-Log mit Root Cause Analysis
└── Bug in bug-tracking.md als resolved markieren
```

---

## 🚫 Anti-Patterns & Common Mistakes

### ❌ Was NICHT tun

**Agent-Overstepping**:
- ❌ Frontend-Agent implementiert Backend-Code
- ❌ Backend-Agent designed komplexe UI
- ✅ Agents bleiben in ihrer Domäne

**Documentation Gaps**:
- ❌ Task completed ohne Session-Log
- ❌ Bug gefixed ohne bug-tracking.md Update
- ✅ Immer dokumentieren nach Task Completion

**SpecKit-Bypass**:
- ❌ Direkt mit Coding beginnen ohne spec.md
- ❌ Tasks implementieren die nicht in tasks.md sind
- ✅ Immer SpecKit-Workflow folgen

**Coordination Failures**:
- ❌ Tasks beginnen die Dependencies haben die nicht resolved sind
- ❌ Nicht in tasks.md kommunizieren
- ✅ tasks.md ist Single Source of Truth

---

## 📈 Success Metrics

### Agent Performance Tracking

**Für jeden Agent**:
- Session-Erfolgsrate: % completed tasks
- Average Time per Task
- Test Coverage der implementierten Features
- Bug Rate (Bugs nach Deployment)

**Team Metrics**:
- Feature Completion Time
- Parallel Work Efficiency
- Documentation Completeness
- Test Pass Rate

---

## 🔮 Zukünftige Agent-Erweiterungen

### Geplante Agents
- **DevOps-Agent**: Deployment, Infrastructure, Monitoring
- **Documentation-Agent**: Technical Writing, API Docs
- **Performance-Agent**: Optimization, Profiling, Benchmarking

---

## 📚 Weitere Ressourcen

- [SpecKit Workflow](./.specify/README.md)
- [CLAUDE.md Arbeitsanweisungen](../CLAUDE.md)
- [Development Sessions](../docs/development-logs/sessions/)
- [Agent Session Overview](../docs/development-logs/agent-sessions-overview.md)

---

**Maintained by**: Development Team
**Review Cycle**: Quarterly oder bei Major Process Changes