# Teacher Assistant - Claude Code Instructions

## Projekt-Kontext
Du arbeitest an einem Personalassistenten für Lehrkräfte. Es ist ein Chat-Interface mit AI-Memory und Agenten-Funktionalitäten.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind + InstantDB
- **Backend**: Node.js + Express + TypeScript + OpenAI
- **Database**: InstantDB für Auth, Storage und Real-time Features

## Arbeitsweise
1. **IMMER zuerst** `/docs/todo.md` checken für deine spezifischen Tasks
2. **Nach jeder Arbeit** `/docs/agent-logs.md` updaten mit:
   - Was wurde implementiert
   - Welche Dateien erstellt/geändert
   - Nächste Schritte oder Blocker
3. **Bei Problemen** in `/docs/bug-tracking.md` dokumentieren

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