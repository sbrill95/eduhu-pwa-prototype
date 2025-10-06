# SpecKit - Feature Specification Framework

SpecKit ist unser Framework für strukturierte Feature-Spezifikation und -Implementierung.

## 📁 Verzeichnisstruktur

```
.specify/
├── README.md           # Diese Datei
├── specs/             # Feature Spezifikationen
│   └── [feature-name]/
│       ├── spec.md    # WAS & WARUM (Requirements)
│       ├── plan.md    # WIE (Technical Design)
│       └── tasks.md   # Implementierungs-Aufgaben
└── memory/            # SpecKit Memory/Context
```

## 🔄 SpecKit Workflow

### Phase 1: Spezifikation (`spec.md`)
**Zweck**: Definiert **WAS** gebaut wird und **WARUM**

**Inhalt**:
- **Problem Statement**: Welches Problem lösen wir?
- **User Stories**: Wer profitiert und wie?
- **Requirements**: Funktionale und nicht-funktionale Anforderungen
- **Success Criteria**: Wann ist das Feature erfolgreich?
- **Out of Scope**: Was wird bewusst nicht umgesetzt?

**Wann erstellen**: Bevor mit der technischen Planung begonnen wird

---

### Phase 2: Plan (`plan.md`)
**Zweck**: Definiert **WIE** das Feature technisch umgesetzt wird

**Inhalt**:
- **Architecture**: High-level technisches Design
- **Components**: Zu erstellende/ändernde Komponenten
- **Data Models**: Datenstrukturen und Schema
- **API Endpoints**: Neue oder geänderte APIs
- **Testing Strategy**: Wie wird getestet?
- **Risks & Mitigations**: Technische Risiken und Lösungen

**Wann erstellen**: Nach Genehmigung der Spezifikation

---

### Phase 3: Tasks (`tasks.md`)
**Zweck**: Konkrete Aufgabenliste für die Implementierung

**Inhalt**:
- **Priorisierte Task-Liste**: Konkrete, umsetzbare Aufgaben
- **Dependencies**: Task-Abhängigkeiten
- **Estimates**: Zeitschätzungen
- **Assignees**: Welcher Agent übernimmt welchen Task

**Wann erstellen**: Nach technischem Design-Review

---

### Phase 4: Implementation
**Zweck**: Umsetzung der Tasks mit Tests

**Vorgehen**:
1. Task aus `tasks.md` auswählen
2. Implementation durchführen
3. Tests schreiben
4. Session-Log in `/docs/development-logs/sessions/` erstellen
5. Task in `tasks.md` als erledigt markieren
6. Nächsten Task auswählen

---

## 📝 Beispiel-Feature-Struktur

```
.specify/specs/user-profile-enhancement/
├── spec.md         # User Profile Enhancement Spezifikation
├── plan.md         # Technischer Implementierungsplan
└── tasks.md        # Konkrete Aufgabenliste

Status: [draft|review|approved|in-progress|completed]
```

---

## 🔗 Integration mit Dokumentation

### Wo dokumentiere ich was?

| Dokumentationstyp | Ort | Zweck |
|-------------------|-----|-------|
| **Feature Specs** | `.specify/specs/[feature]/spec.md` | WAS & WARUM |
| **Technical Plans** | `.specify/specs/[feature]/plan.md` | WIE (Design) |
| **Task Lists** | `.specify/specs/[feature]/tasks.md` | Aufgaben |
| **Implementation Logs** | `/docs/development-logs/sessions/` | Chronologische Aktivitäten |
| **Implementation Details** | `/docs/architecture/implementation-details/` | Technische Deep-Dives |
| **Bug Tracking** | `/docs/quality-assurance/bug-tracking.md` | Issues & Fixes |
| **Master Todo** | `/docs/project-management/master-todo.md` | Gesamtprojekt-Tasks |

---

## 🎯 Best Practices

### ✅ DO
- **Spec vor Code**: Immer erst spezifizieren, dann implementieren
- **Review-Prozess**: Specs und Plans reviewen lassen
- **Atomic Tasks**: Tasks klein und konkret halten
- **Tests parallel**: Tests während der Implementation schreiben
- **Continuous Documentation**: Sessions nach jedem Task dokumentieren

### ❌ DON'T
- **Keine Code-first Approaches**: Nicht ohne Spec implementieren
- **Keine Task-Vermischung**: Ein Task = eine logische Einheit
- **Keine Spec-Änderungen während Implementation**: Bei Änderungen Spec updaten
- **Keine unvollständigen Specs**: Alle Sections ausfüllen

---

## 🚀 Quick Start

### Neues Feature beginnen

```bash
# 1. Feature-Verzeichnis erstellen
mkdir -p .specify/specs/[feature-name]

# 2. Spec aus Template erstellen
cp .specify/templates/spec-template.md .specify/specs/[feature-name]/spec.md

# 3. Spezifikation ausfüllen
# Edit spec.md mit allen Requirements

# 4. Plan erstellen (nach Spec-Approval)
cp .specify/templates/plan-template.md .specify/specs/[feature-name]/plan.md

# 5. Tasks definieren (nach Plan-Approval)
cp .specify/templates/tasks-template.md .specify/specs/[feature-name]/tasks.md

# 6. Implementation starten
# Arbeite Tasks ab, dokumentiere in Sessions
```

---

## 📚 Weitere Ressourcen

- [SpecKit Templates](./templates/) - Vorlagen für spec.md, plan.md, tasks.md
- [Development Logs](../docs/development-logs/) - Implementierungs-Historie
- [CLAUDE.md](../CLAUDE.md) - Vollständige Arbeitsanweisungen
- [STRUCTURE.md](../docs/STRUCTURE.md) - Dokumentations-Übersicht

---

**Maintained by**: Development Team
**Last Updated**: 2025-09-30