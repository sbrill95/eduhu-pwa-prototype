# Teacher Assistant - Claude Code Instructions

## Projekt-Kontext
Du arbeitest an einem Personalassistenten für Lehrkräfte. Es ist ein Chat-Interface mit AI-Memory und Agenten-Funktionalitäten.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind + InstantDB
- **Backend**: Node.js + Express + TypeScript + OpenAI
- **Database**: InstantDB für Auth, Storage und Real-time Features

## Arbeitsweise - SpecKit VERPFLICHTEND

### Für ALLE Aufgaben (Features, Bugs, Refactoring):
1. **IMMER zuerst** SpecKit prüfen: `.specify/specs/[feature-name]/`
   - Wenn SpecKit existiert: `tasks.md` öffnen für konkrete Aufgaben
   - Wenn KEIN SpecKit: **STOPP** - Frage User ob SpecKit erstellt werden soll
2. **Tasks aus tasks.md abarbeiten**:
   - Einen Task nehmen (z.B. TASK-001)
   - `spec.md` und `plan.md` für Kontext lesen
   - Task implementieren
   - Task in `tasks.md` als ✅ markieren
3. **Nach jeder Arbeit** Session-Log erstellen:
   - **Ort**: `/docs/development-logs/sessions/YYYY-MM-DD/session-XX-taskname.md`
   - **Inhalt**: Welcher Task, was implementiert, Dateien geändert, Tests
4. **Bei Problemen** in `/docs/quality-assurance/bug-tracking.md` dokumentieren

### SpecKit-Struktur (IMMER diese Dateien):
```
.specify/specs/[feature-name]/
├── spec.md     # WAS & WARUM (Requirements, User Stories)
├── plan.md     # WIE technisch (Architecture, Components)
└── tasks.md    # Konkrete Aufgaben mit Checkboxen
```

### Ausnahmen (nur mit User-Freigabe):
- Kritische Hotfixes (< 15 Minuten Arbeit)
- Dokumentations-Updates
- Code-Cleanup ohne Logik-Änderungen

## Definition of Done - VERPFLICHTEND

### Task ist NUR complete wenn:

1. **Build Clean**: `npm run build` → 0 TypeScript errors
2. **Tests Pass**: `npm test` → all pass
3. **Manual Test**: Feature funktioniert E2E (dokumentiert in session log)
4. **Pre-Commit Pass**: `git commit` geht durch

### Agent darf Task als ✅ markieren NUR wenn:
- Alle 4 Kriterien erfüllt
- Session log erstellt in `docs/development-logs/sessions/YYYY-MM-DD/`
- Session log enthält: Build output, Test results, Manual verification

### Wenn blockiert:
- Task bleibt ⏳ in_progress
- Blocker in session log dokumentieren
- Neuen Task für Blocker erstellen

**Siehe**: `.specify/templates/DEFINITION-OF-DONE.md` für vollständige Checkliste

## WICHTIG: Dateiablage-Regeln
**NIEMALS Dateien im Root-Verzeichnis erstellen** (außer CLAUDE.md existiert bereits)

### Wo dokumentiere ich was?
- **Bug-Reports**: `docs/quality-assurance/resolved-issues/YYYY-MM-DD/`
- **QA-Reports**: `docs/quality-assurance/verification-reports/YYYY-MM-DD/`
- **Session-Logs**: `docs/development-logs/sessions/YYYY-MM-DD/`
- **Test-Reports**: `docs/testing/test-reports/YYYY-MM-DD/`
- **Implementation Details**: `docs/architecture/implementation-details/`

### Session-Log Namenskonvention:
`session-XX-feature-name.md` (z.B. `session-01-image-generation-fix.md`)

**Bei jedem Create/Write von .md Dateien**: Prüfe ZUERST den richtigen Pfad gemäß docs/STRUCTURE.md!

## Code Standards
- **TypeScript everywhere** - keine .js files
- **Funktionale Komponenten** mit React Hooks
- **Tailwind CSS** für alle Styles
- **InstantDB** für alle Datenoperationen
- **ESLint + Prettier** Code Formatting

## Ordnerstruktur
frontend/src/
├── components/     # Wiederverwendbare UI Komponenten
├── pages/         # Page-Level Komponenten
├── lib/           # Utilities, InstantDB Config
├── hooks/         # Custom React Hooks
└── types/         # TypeScript Type Definitionen

## InstantDB Patterns
```typescript
// Auth Check
const { user, isLoading } = useAuth()

// Data Query
const { data, error } = useQuery({
  messages: {
    $: {
      where: { userId: user?.id }
    }
  }
})

// Mutation
const [createMessage] = useMutation(db.messages)
```
