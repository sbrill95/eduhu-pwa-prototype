# Documentation Structure Overview

**Letzte Aktualisierung**: 2025-10-17 (BMad PRD Migration completed)
**Methodik**: BMad Method (Agile AI-Driven Development)
**Status**: ✅ Clean und organisiert
**Gesamtanzahl Dateien**: 200+ Markdown-Dateien

---

## 📁 Hauptverzeichnisse (BMad Structure)

### 1. `/docs/prd.md` - Product Requirements Document
Zentrale Produkt-Requirements nach BMad PM-Template

**Erstellt von**: `/bmad-pm` (Product Manager Agent)

**Inhalt**:
- Product Vision & Goals
- Functional Requirements (FRs)
- Non-Functional Requirements (NFRs)
- Epics Definition
- Success Criteria

**Verwendung**: Single Source of Truth für Product Requirements

**Technical Reference**: Detailed technical PRD für Multi-Agent System in `/docs/architecture/multi-agent-system-prd.md`

---

### 2. `/docs/architecture.md` - System Architecture
Technische Systemarchitektur nach BMad Architect-Template

**Erstellt von**: `/bmad-architect` (System Architect Agent)

**Inhalt**:
- System Overview
- Technology Stack
- Component Architecture
- API Design
- Data Architecture
- Security Design
- Performance Strategy
- Deployment Architecture

**Verwendung**: Technical Reference für alle Implementation Decisions

**Für Brownfield**: Generiert via `/bmad.document-project` Command

---

### 3. `/docs/epics/` - Sharded Epics
Epic-Definitionen (aus PRD geshardet)

**Struktur**:
```
epics/
├── README.md                    # Epics Overview & BMad Workflow
├── epic-3.0.md                  # Foundation & Migration (Weeks 1-4)
├── epic-3.1.md                  # Image Agent Enhancement (Weeks 5-8)
├── epic-3.2.md                  # Production Deployment (Weeks 9-12)
└── epic-4.0.md                  # Calendar Integration (Weeks 9-12, Parallel)
```

**Erstellt von**: `/bmad-po` (Product Owner Agent) via Sharding

**Verwendung**: High-level Feature Grouping für Story Creation

**Aktuelle Phase**: Phase 3 - Multi-Agent System Enhancement

---

### 4. `/docs/stories/` - Development Stories
Story-Definitionen mit Acceptance Criteria (BMad Story Format)

**Struktur**:
```
stories/
├── README.md                   # Stories Overview & BMad Workflow
├── epic-3.0.story-1.md         # OpenAI Agents SDK Setup (zu erstellen)
├── epic-3.0.story-2.md         # Router Agent Implementation (zu erstellen)
├── epic-3.1.story-1.md         # Gemini API Integration (zu erstellen)
└── ... (weitere Stories via /bmad-sm)
```

**Erstellt von**: `/bmad-sm` (Scrum Master Agent)

**Story Format**:
- Story Description
- Acceptance Criteria (Given-When-Then)
- Technical Approach
- Implementation Tasks
- Definition of Done
- QA Results (nach Review)

**Verwendung**: Development Unit - Jede Story ist eine implementierbare Einheit

**Status**: Epics erstellt, Stories werden via `/bmad-sm` generiert

---

### 5. `/docs/qa/` - Quality Assurance (BMad QA Structure)
Comprehensive Quality Management mit Test Architect (Quinn)

**Struktur**:
```
qa/
├── assessments/                           # QA Assessment Reports
│   ├── epic-1.story-1-risk-20251017.md   # Risk Assessment
│   ├── epic-1.story-1-test-design-20251017.md  # Test Strategy
│   ├── epic-1.story-1-trace-20251017.md  # Requirements Tracing
│   └── epic-1.story-1-nfr-20251017.md    # NFR Assessment
└── gates/                                 # Quality Gate Decisions (YAML)
    ├── epic-1.story-1-user-registration.yml
    └── epic-2.story-3-agent-confirmation.yml
```

**Erstellt von**: `/bmad-qa` (Test Architect - Quinn)

**QA Commands**:
- `/bmad.risk` → Risk Assessment (vor Development)
- `/bmad.test-design` → Test Strategy (vor Development)
- `/bmad.trace` → Requirements Tracing (während Development)
- `/bmad.nfr` → NFR Assessment (während Development)
- `/bmad.review` → Comprehensive Review (nach Development)
- `/bmad.gate` → Gate Update (nach Fixes)

**Quality Gate Decisions**:
- **PASS**: Alle kritischen Requirements erfüllt
- **CONCERNS**: Nicht-kritische Issues
- **FAIL**: Kritische Issues (Security, fehlende P0 Tests)
- **WAIVED**: Issues akzeptiert mit Begründung

**Verwendung**: Quality Control für alle Stories

---

### 6. `/docs/architecture/` - System Architecture & Technical Design
Technische Systemdokumentation und API-Referenzen

**Struktur**:
```
architecture/
├── README.md (TODO: Erstellen)
├── system-overview.md                    # High-level System Design
├── project-structure.md                   # Complete Project Structure
├── langgraph-implementation-guide.md      # LangGraph Usage Guide
├── api-documentation/                     # API Reference Documentation
│   ├── backend-api.md                    # Backend REST API
│   ├── instantdb.md                      # InstantDB Schema & Queries
│   ├── langchain-docu.md                 # LangChain Integration
│   ├── open-ai-api.md                    # OpenAI Integration
│   └── tavily.md                         # Tavily API Documentation
└── implementation-details/                # Detailed Feature Implementations
    ├── README.md                         # Implementation Details Overview
    ├── data-persistence-implementation.md # InstantDB Data Layer
    ├── langgraph-implementation-log.md   # LangGraph Agent System
    ├── phase4-onboarding-context.md      # Onboarding & Context System
    └── profile-ui-refactor.md            # Profile Navigation Refactor
```

**Verwendung**: Als Referenz für System-Design, API-Nutzung und technische Implementierungen

---

### 7. `/docs/development-logs/` - Agent Sessions & Development History
Chronologische Entwicklungsaktivitäten in sessions-basierter Struktur

**Struktur**:
```
development-logs/
├── README.md                              # Navigation Guide
├── agent-sessions-overview.md             # Timeline Overview aller Sessions
└── sessions/                              # Session-based Organization
    ├── 2025-09-26/                       # Foundation Day (11 Sessions)
    │   ├── session-01-frontend-foundation-setup.md
    │   ├── session-02-backend-architecture-setup.md
    │   ├── session-03-navigation-layout.md
    │   └── ...
    ├── 2025-10-17/                       # BMad Migration Day
    │   └── session-XX-bmad-migration.md
    └── ...
```

**Verwendung**: Chronologische Verfolgung aller Entwicklungsaktivitäten und technischen Entscheidungen

---

### 8. `/docs/project-management/` - Planning & Task Management
Projektplanung, Todo-Listen und Milestones

**Struktur**:
```
project-management/
├── master-todo.md              # Unified Task Management (Single Source of Truth)
├── implementation-plan.md      # Implementation Roadmap
├── product-requirements.md     # Legacy PRD (replaced by /docs/prd.md)
└── project-phases.md          # Project Phase Definitions
```

**Verwendung**: Für Projektplanung, Task-Tracking und Milestone-Management

**Note**: Mit BMad ersetzt durch `/docs/prd.md` + `/docs/stories/` + `/docs/qa/gates/`

---

### 9. `/docs/quality-assurance/` - Bug Tracking & Historical QA
Legacy Bug-Tracking und QA Documentation (Pre-BMad)

**Struktur**:
```
quality-assurance/
├── README.md                   # QA Process Overview
├── bug-tracking.md            # Comprehensive Issue Management (8/8 resolved)
├── known-issues.md            # Current System Status
├── resolved-issues/           # Detailed Resolution Documentation
│   ├── chat-fixes-implementation.md
│   └── missing-api-endpoints-fix.md
└── verification-reports/      # QA Verification Reports
    └── 2025-10-14/
        └── T034-T035-automatic-tagging-e2e-tests-QA-REPORT.md
```

**Verwendung**: Historical Issue-Tracking und Quality-Metrics

**Note**: Mit BMad werden neue QA Reports in `/docs/qa/assessments/` und `/docs/qa/gates/` erstellt

---

### 10. `/docs/testing/` - Testing Strategy & Reports
Test-Strategien, Scripts, Artifacts und Reports

**Struktur**:
```
testing/
├── README.md (TODO: Erstellen)
├── test-strategy.md            # Comprehensive Testing Approach
├── testing-documentation.md    # Testing Documentation Overview
├── agent-integration-examples.md # Agent Testing Examples
├── E2E-TEST-PLAN-US5-COMPLETE-WORKFLOW.md # E2E Test Plans
├── scripts/                    # Test Scripts (17 Scripts organized)
│   └── README.md
├── artifacts/                  # Test Results & Screenshots
│   ├── test-results/          # Test Execution Results
│   └── test-videos/           # Video Recordings of Tests
├── screenshots/               # Test Screenshots (organized by date)
│   ├── 2025-10-07/
│   ├── 2025-10-12/
│   └── 2025-10-14/
└── test-reports/              # Comprehensive Test Reports (organized by date)
    ├── 2025-10-01/            # E2E Test Reports
    ├── 2025-10-12/            # Bug Investigation Reports
    ├── 2025-10-14/            # Agent Styling Investigation
    └── 2025-10-15/            # US5 Manual Test Results
```

**Verwendung**: Test-Execution, Test-Artifacts und Quality-Reports

**Note**: Mit BMad werden Test Designs in `/docs/qa/assessments/` erstellt

---

### 11. `/docs/guides/` - Setup, Deployment & User Guides
Praktische Anleitungen für Setup, Deployment und Troubleshooting

**Struktur**:
```
guides/
├── setup-guide.md              # Development Environment Setup
├── deployment-guide.md         # Production Deployment Instructions
└── ui-ux-design-guide.md      # UI/UX Design Standards
```

**Verwendung**: Für Entwickler-Onboarding, Deployment und Design-Guidelines

---

### 12. `.bmad-core/` - BMad Method Configuration
BMad Method System Files (nicht editieren!)

**Struktur**:
```
.bmad-core/
├── core-config.yaml           # BMad Configuration
├── agents/                    # Agent Definitions
│   ├── bmad-architect.md
│   ├── bmad-pm.md
│   ├── bmad-qa.md
│   ├── bmad-dev.md
│   ├── bmad-sm.md
│   └── bmad-po.md
├── tasks/                     # Task Workflows
│   ├── document-project.md
│   ├── risk-profile.md
│   ├── test-design.md
│   ├── review-story.md
│   └── ...
├── templates/                 # Document Templates
│   ├── prd-tmpl.yaml
│   ├── architecture-tmpl.yaml
│   ├── story-tmpl.yaml
│   └── qa-gate-tmpl.yaml
├── checklists/                # Quality Checklists
├── data/                      # BMad Knowledge Base
└── user-guide.md             # BMad User Guide
```

**Verwendung**: BMad Method Infrastructure (readonly)

---

### 13. `/specs/` - Legacy SpecKit Features (Deprecated)
Alte Feature-Spezifikationen nach SpecKit-Methodik (vor BMad Migration)

**Status**: 🔴 DEPRECATED - Wird durch BMad `/docs/stories/` ersetzt

**Migration Path**:
- Aktive Features → In BMad Stories konvertieren
- Abgeschlossene Features → Archivieren nach `.specify/specs/archive/`

**Legacy Struktur** (nur zur Referenz):
```
specs/
├── 001-bug-fixes-2025-10-11/
├── 002-library-ux-fixes/
└── 003-agent-confirmation-ux/  # Letzte SpecKit-Feature
```

---

## 📊 Struktur-Statistik (BMad)

### Dokument-Verteilung
- **Gesamtanzahl Verzeichnisse**: 45+
- **Gesamtanzahl MD-Dateien**: 220+
- **BMad Stories**: Wächst mit Development
- **BMad QA Assessments**: Wächst mit Reviews
- **Development Sessions**: 60+ (chronologisch organisiert)
- **API Documentation Files**: 5
- **Test Reports**: 30+
- **Implementation Details**: 5

### BMad-Specific
- **PRD**: 1 (zentral in `/docs/prd.md`) ✅ Created 2025-10-17
- **Technical PRD**: 1 (in `/docs/architecture/multi-agent-system-prd.md`) ✅ Existing
- **Architecture**: 1 (zentral in `/docs/architecture.md`) ⏳ To be created
- **Epics**: 4 geshardet in `/docs/epics/` ✅ Created 2025-10-17
  - Epic 3.0: Foundation & Migration
  - Epic 3.1: Image Agent Enhancement
  - Epic 3.2: Production Deployment
  - Epic 4.0: Calendar Integration
- **Stories**: In `/docs/stories/` (via `/bmad-sm` zu erstellen)
- **QA Assessments**: In `/docs/qa/assessments/`
- **Quality Gates**: In `/docs/qa/gates/`

---

## ✅ BMad Migration (2025-10-17)

### Umstellung von SpecKit → BMad

1. **CLAUDE.md aktualisiert**:
   - SpecKit-Referenzen entfernt
   - BMad Workflow dokumentiert
   - BMad Agents und Commands hinzugefügt
   - Quality Gates erklärt

2. **Neue BMad Struktur etabliert**:
   - `/docs/prd.md` als zentrale Requirements
   - `/docs/architecture.md` als zentrale Tech Doku
   - `/docs/epics/` für geshardte Epics
   - `/docs/stories/` für Development Stories
   - `/docs/qa/` für Quality Assurance

3. **BMad Agents aktiviert**:
   - `/bmad-pm` - Product Manager
   - `/bmad-architect` - System Architect
   - `/bmad-sm` - Scrum Master
   - `/bmad-qa` - Test Architect (Quinn)
   - `/bmad-dev` - Developer
   - `/bmad-po` - Product Owner

4. **Quality Gates eingeführt**:
   - Risk Assessment (`/bmad.risk`)
   - Test Design (`/bmad.test-design`)
   - Requirements Tracing (`/bmad.trace`)
   - NFR Assessment (`/bmad.nfr`)
   - Story Review (`/bmad.review`)
   - Gate Updates (`/bmad.gate`)

5. **Legacy SpecKit**:
   - `/specs/` markiert als DEPRECATED
   - Migration Path dokumentiert
   - Archivierung geplant

---

## 🔗 BMad Navigation

### Workflow-Übersicht

```
1. Planung
   → PM erstellt PRD (/docs/prd.md)
   → Architect erstellt Architecture (/docs/architecture.md)
   → PO shardet Epics (/docs/epics/)

2. Story Creation
   → SM erstellt Stories (/docs/stories/)
   → QA führt Risk Assessment durch (/docs/qa/assessments/)
   → QA erstellt Test Design (/docs/qa/assessments/)

3. Development
   → Dev implementiert Story
   → QA führt Mid-Dev Checks durch (Trace, NFR)
   → Tests werden geschrieben

4. Review
   → QA führt comprehensive Review durch
   → Quality Gate Decision (/docs/qa/gates/)
   → Story wird als Complete markiert oder zurück zu Dev

5. Abschluss
   → Build clean (0 TypeScript errors)
   → Tests passing
   → Quality Gate ≥ PASS
   → Commit & Documentation
```

---

## 🎯 Nächste Schritte

### ✅ Completed (2025-10-17):
- [x] `/docs/prd.md` erstellt (BMad central PRD)
- [x] `/docs/epics/README.md` erstellt
- [x] `/docs/epics/epic-3.0.md` erstellt (Foundation & Migration)
- [x] `/docs/epics/epic-3.1.md` erstellt (Image Agent Enhancement)
- [x] `/docs/epics/epic-3.2.md` erstellt (Production Deployment)
- [x] `/docs/epics/epic-4.0.md` erstellt (Calendar Integration)
- [x] `/docs/stories/README.md` erstellt

### Fehlende Dokumentation erstellen:
- [ ] `/docs/architecture/README.md`
- [ ] `/docs/testing/README.md`
- [ ] `/docs/qa/README.md` (mit QA-Prozess)

### BMad Phase 3 - Multi-Agent System:
- [ ] Stories erstellen via `/bmad-sm` agent
  - [ ] Epic 3.0 Stories (5 stories)
  - [ ] Epic 3.1 Stories (5 stories)
  - [ ] Epic 3.2 Stories (5 stories)
  - [ ] Epic 4.0 Stories (4 stories)
- [ ] Risk Assessment via `/bmad.risk` für erste Story
- [ ] Test Design via `/bmad.test-design` für erste Story
- [ ] Implementation starten via `/bmad-dev`

### BMad Migration fortsetzen:
- [ ] Aktive SpecKit Features in BMad Stories konvertieren
- [ ] `/specs/003-agent-confirmation-ux/` → Story-Format
- [ ] Legacy `/specs/` nach `.specify/specs/archive/` verschieben

### Kontinuierliche Pflege:
- Development Sessions nach jedem Sprint hinzufügen
- BMad Stories nach Feature Creation hinzufügen
- QA Assessments nach jedem Review hinzufügen
- Quality Gates nach jedem Review aktualisieren

---

## 📚 Referenzen

- **BMad User Guide**: `.bmad-core/user-guide.md`
- **BMad Brownfield Guide**: `.bmad-core/working-in-the-brownfield.md`
- **CLAUDE.md**: Projekt-spezifische BMad Instructions
- **BMad Commands**: Run `/bmad-orchestrator` dann `*help`

---

**Dokumentations-Qualität**: ✅ Professional-Grade (BMad-Enhanced)
**Navigierbarkeit**: ✅ Excellent (BMad Structure)
**Wartbarkeit**: ✅ Sustainable (Quality Gates)
**Team-Readiness**: ✅ Production-Ready (Test Architect)
**Methodology**: ✅ BMad Method Active
