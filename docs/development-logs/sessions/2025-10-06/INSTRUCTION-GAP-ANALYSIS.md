# Instruction Gap Analysis: Was fehlt in CLAUDE.md & Agent-Beschreibungen?

**Datum**: 2025-10-06
**Analysiert**: CLAUDE.md, .specify/README.md, Agent-Beschreibungen (backend, frontend, QA)
**Frage**: Welche Lücken in den Instruktionen **begünstigen die 7 systematischen Fehler**?

---

## 🎯 ZUSAMMENFASSUNG

**KRITISCHE LÜCKEN GEFUNDEN**:

| Systematischer Fehler | Was fehlt in Instruktionen | Impact |
|----------------------|----------------------------|--------|
| 1. Quick-Fix Kultur | ❌ Keine Definition "Was ist Quick-Fix" | Agents wissen nicht was verboten ist |
| 2. Field Name Mismatch | ❌ Keine Shared Types Requirement | Frontend/Backend divergieren |
| 3. Feature Flag Chaos | ❌ Keine TODO-Verbote | TODOs stapeln sich |
| 4. Test-Bypass Broken | ❌ Keine "Tests MÜSSEN laufen" Regel | Broken tests acceptable |
| 5. Partial Implementation | ❌ Keine "Task komplett" Definition | Half-done commits OK |
| 6. TypeScript Errors Ignored | ❌ Keine "Build muss passen" Regel | Broken builds committable |
| 7. No Integration Verification | ❌ Keine "E2E vor Commit" Regel | Integration bugs in prod |

---

## FEHLER #1: Quick-Fix Kultur

### Was FEHLT in Instruktionen:

#### ❌ CLAUDE.md schweigt zu Quick-Fixes
**Aktuell**:
```markdown
## Arbeitsweise - SpecKit VERPFLICHTEND
...
### Ausnahmen (nur mit User-Freigabe):
- Kritische Hotfixes (< 15 Minuten Arbeit)
```

**Problem**: "Kritische Hotfixes" ist nicht definiert! Agent denkt:
- Leerer String als `lastMessage` ist "quick fix" → OK
- Feature disablen mit TODO ist "hotfix" → OK

#### ❌ Agents haben keine "Proper Fix" Definition
**Backend-Agent** sagt:
> "Ask clarifying questions when requirements are ambiguous"

**Fehlt**: Was tun wenn Problem komplex ist? → Quick-Fix oder Root Cause?

### Was SOLLTE da stehen:

```markdown
## Anti-Patterns: VERBOTEN

### ❌ Quick-Fixes (Symptom-Behandlung)
**Definition**: Code-Änderung die Symptom versteckt statt Root Cause behebt

**Beispiele**:
- `lastMessage: ''` statt echte Message aus DB holen
- Feature mit `// TODO` disablen statt implementieren
- `try { ... } catch { /* ignore */ }` statt Error-Handling

**Regel**: Bei jedem Fix frage:
1. Behebt das den Root Cause? → JA: OK, NEIN: STOPP
2. Ist der User mit Workaround einverstanden? → JA: dokumentiere, NEIN: Proper Fix

**Proper Fix Checklist**:
- [ ] Root Cause identifiziert (nicht nur Symptom)
- [ ] Fix behebt alle Fälle (nicht nur Reproduktions-Fall)
- [ ] Tests verifizieren Fix
- [ ] Keine TODOs im Fix (entweder komplett oder gar nicht)
```

---

## FEHLER #2: Field Name Mismatch (Frontend ↔ Backend)

### Was FEHLT in Instruktionen:

#### ❌ CLAUDE.md erwähnt NICHT "Shared Types"
**Aktuell**:
```markdown
## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind + InstantDB
- **Backend**: Node.js + Express + TypeScript + OpenAI
```

**Problem**: Kein Wort über "wie synchronisieren wir Types?"

#### ❌ Backend-Agent: Keine "API Contract" Erwähnung
**Aktuell**:
> "Design and implement Express.js APIs with TypeScript for type safety"

**Fehlt**: "Type safety" nur innerhalb Backend, nicht zwischen Frontend/Backend!

#### ❌ Frontend-Agent: Keine "Backend Types importieren" Regel
**Aktuell**:
> "Use proper TypeScript interfaces for props, state, and API responses"

**Fehlt**: WOHER kommen "API response types"? Selbst definieren → Divergenz!

### Was SOLLTE da stehen:

```markdown
## Shared Types - VERPFLICHTEND

### Struktur
```
teacher-assistant/
├── shared/
│   └── types/
│       ├── api.ts        # API Request/Response Types
│       ├── agents.ts     # Agent Types (prefillData, etc.)
│       ├── materials.ts  # Material Types
│       └── index.ts      # Re-exports
├── frontend/
│   └── package.json      # depends on "../shared"
└── backend/
    └── package.json      # depends on "../shared"
```

### Regel für Backend-Agent:
**Bei JEDEM neuen API Endpoint**:
1. ✅ Type definieren in `teacher-assistant/shared/types/api.ts`
2. ✅ Backend importiert: `import { MyRequest } from '../shared/types'`
3. ✅ Frontend importiert: `import { MyRequest } from '../shared/types'`
4. ❌ NIEMALS Types duplizieren zwischen Frontend/Backend

### Regel für Frontend-Agent:
**Bei JEDEM API Call**:
1. ✅ Type aus `shared/types` importieren
2. ❌ NIEMALS eigene API Response Types definieren
3. ✅ Wenn Type fehlt: Backend-Agent bitten Type zu erstellen

### Beispiel:
```typescript
// teacher-assistant/shared/types/agents.ts
export interface ImageGenerationPrefillData {
  description: string;  // ← SINGLE SOURCE OF TRUTH
  imageStyle?: 'realistic' | 'artistic' | 'cartoon';
  learningGroup?: string;
}

// Backend nutzt diesen Type
export interface AgentSuggestion {
  agentType: string;
  prefillData: ImageGenerationPrefillData;  // ← shared
}

// Frontend nutzt GLEICHEN Type
const [formData, setFormData] = useState<ImageGenerationPrefillData>({
  description: state.formData.description || '',  // ← no mismatch possible!
});
```
```

---

## FEHLER #3: Feature Flag Chaos

### Was FEHLT in Instruktionen:

#### ❌ CLAUDE.md erlaubt TODOs ohne Konsequenz
**Aktuell**: Keine Erwähnung von TODOs!

**Problem**: Agents nutzen TODOs frei:
```typescript
// TODO: Enable when worksheet agent is implemented
// TODO: Fix TypeScript errors before enabling
// TODO: Implement backend cancel endpoint
```

**Result**: 15+ TODOs, keiner weiß welche wichtig sind

#### ❌ Agents haben keine "Feature Flag" Anweisung
**Fehlt komplett**: Wie disabled man Features richtig?

### Was SOLLTE da stehen:

```markdown
## Feature Flags & TODOs - STRENGE REGELN

### ❌ TODOs im Code sind VERBOTEN
**Regel**: Statt `// TODO: ...` → **GitHub Issue erstellen**

**Warum**: TODOs sind unsichtbar, werden nie getrackt, häufen sich an

**Richtig**:
```typescript
// BEFORE (❌):
// TODO: Enable when worksheet agent is implemented
// const worksheetIntent = this.detectWorksheetIntent(...);

// AFTER (✅):
// Disabled: worksheet agent not implemented (Issue #42)
if (FEATURE_FLAGS.WORKSHEET_AGENT) {
  const worksheetIntent = this.detectWorksheetIntent(...);
}
```

### ✅ Feature Flags: Zentrale Verwaltung
**Location**: `teacher-assistant/shared/featureFlags.ts`

**Template**:
```typescript
export const FEATURE_FLAGS = {
  // Feature Name: Enabled? // Reason if disabled + Issue link
  WORKSHEET_AGENT: false,     // Not implemented (Issue #42)
  LESSON_PLAN_AGENT: false,   // Not implemented (Issue #43)
  CHAT_TAGS_API: false,       // TypeScript errors (Issue #44)
  CONTEXT_API: false,         // TypeScript errors (Issue #45)
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
```

### Regel für Agents:
**Wenn Feature nicht fertig**:
1. ❌ NICHT: `// TODO: ...` + Code auskommentieren
2. ✅ SONDERN:
   - GitHub Issue erstellen mit Details
   - Feature Flag in `featureFlags.ts` auf `false` setzen
   - Code mit `if (FEATURE_FLAGS.X)` wrappen
   - Issue-Link im Kommentar
```

---

## FEHLER #4: Test-Bypass Broken

### Was FEHLT in Instruktionen:

#### ❌ CLAUDE.md: Keine "Tests müssen laufen" Regel
**Aktuell**:
```markdown
## Code Standards
- **TypeScript everywhere** - keine .js files
- **Funktionale Komponenten** mit React Hooks
- **Tailwind CSS** für alle Styles
```

**Fehlt**: Keine Erwähnung von Tests! Agent denkt: Tests sind optional.

#### ❌ Agents: Keine "Test before Commit" Instruction
**Backend-Agent**:
> "Implement unit tests for critical business logic"

**Problem**: "critical" ist subjektiv! Und: E2E Tests nicht erwähnt.

**Frontend-Agent**:
> "Test the implementation thoroughly"

**Problem**: "thoroughly" ist vage! Was heißt das konkret?

### Was SOLLTE da stehen:

```markdown
## Testing - VERPFLICHTEND vor Commit

### Regel: Kein Commit ohne Tests
**Alle Agents MÜSSEN**:
1. ✅ Unit Tests für neue Funktionen schreiben
2. ✅ E2E Tests für User-Flows schreiben (wenn UI betroffen)
3. ✅ Tests lokal ausführen: `npm test`
4. ✅ E2E Tests lokal ausführen: `npm run test:e2e`
5. ✅ **Alle Tests müssen PASSEN** vor Commit

### ❌ VERBOTEN:
- Commits mit failing tests
- Commits mit broken E2E test infrastructure
- Commits mit disabled tests (außer mit Issue-Link)
- Commits die bestehende Tests brechen

### Tests-Checklist vor Commit:
```bash
# 1. Unit Tests
cd teacher-assistant/backend && npm test      # ✅ All pass?
cd teacher-assistant/frontend && npm test     # ✅ All pass?

# 2. TypeScript Build
cd teacher-assistant/backend && npm run build  # ✅ No errors?
cd teacher-assistant/frontend && npm run build # ✅ No errors?

# 3. E2E Tests (critical paths)
cd teacher-assistant/frontend && npm run test:e2e  # ✅ All pass?

# 4. Nur wenn ALLE ✅ → git commit allowed
```

### Wenn Tests FAIL:
1. ❌ NICHT committen ("will fix later")
2. ✅ Tests fixen bis sie passen
3. ✅ Wenn Test-Infra broken: STOPP, melde User
4. ✅ Wenn Test falsch: Test korrigieren
5. ✅ Wenn Code falsch: Code korrigieren

### E2E Test Infrastructure Requirements:
**Frontend-Agent**: Wenn E2E Tests nicht laufen:
1. ✅ Check: Ist `VITE_TEST_MODE` korrekt gesetzt?
2. ✅ Check: Ist Test-Auth-Bypass implementiert?
3. ✅ Check: Können Tests überhaupt starten?
4. ✅ Wenn NEIN: **STOPP**, melde User "E2E infra broken"

**Rule**: **Broken test infrastructure ist P0-Bug**, nicht ignorieren!
```

---

## FEHLER #5: Partial Implementation

### Was FEHLT in Instruktionen:

#### ❌ CLAUDE.md: Keine "Task Completion" Definition
**Aktuell**:
```markdown
2. **Tasks aus tasks.md abarbeiten**:
   - Einen Task nehmen (z.B. TASK-001)
   - `spec.md` und `plan.md` für Kontext lesen
   - Task implementieren
   - Task in `tasks.md` als ✅ markieren
```

**Problem**: "Task implementieren" ist vage! Wann ist Task "fertig"?

**Evidenz**: TASK-001 bis TASK-005 als ✅ markiert, aber Prefill funktioniert nicht!

#### ❌ SpecKit README: Keine "Definition of Done"
**Aktuell**:
```markdown
### Phase 4: Implementation
1. Task aus `tasks.md` auswählen
2. Implementation durchführen
3. Tests schreiben
4. Session-Log erstellen
5. Task als erledigt markieren
```

**Problem**: Reihenfolge suggeriert "Tests nach Implementation", aber wann ist Task "done"?

### Was SOLLTE da stehen:

```markdown
## Task Completion - Definition of Done

### ❌ Task ist NICHT done wenn:
- Code kompiliert aber Feature nicht funktioniert E2E
- Tests geschrieben aber Tests failen
- Feature funktioniert aber TypeScript Errors bleiben
- Frontend fertig aber Backend API fehlt
- Commit gemacht aber Build bricht

### ✅ Task ist Done wenn ALLE erfüllt:
1. **Feature funktioniert E2E**
   - Manuelle Verifikation: User-Flow durchgespielt
   - Keine Console-Errors
   - Keine visuellen Bugs

2. **Tests passen**
   - Unit Tests: `npm test` → ✅ ALL PASS
   - E2E Tests (wenn UI): `npm run test:e2e` → ✅ PASS
   - Keine disabled/skipped tests

3. **Build sauber**
   - Frontend: `npm run build` → ✅ SUCCESS, 0 errors
   - Backend: `npm run build` → ✅ SUCCESS, 0 errors
   - Keine TypeScript Errors
   - Keine ESLint Errors

4. **Dokumentation komplett**
   - Session-Log geschrieben in `docs/development-logs/sessions/YYYY-MM-DD/`
   - Task in `tasks.md` als ✅ markiert
   - Wenn Blocker: Issue erstellt + verlinkt

5. **Code Review Ready**
   - Code formatiert (Prettier)
   - Keine TODOs (stattdessen Issues)
   - Keine Quick-Fixes (nur Proper Fixes)
   - Keine `console.log` debug statements

### Workflow - Task Completion:
```bash
# 1. Implementierung
# ... code, code, code ...

# 2. Verifikation (BEFORE marking ✅)
npm test                    # ✅ Pass?
npm run build              # ✅ Success?
npm run test:e2e           # ✅ Pass?
# Manual test user flow     # ✅ Works E2E?

# 3. Nur wenn ALLE ✅:
# - Task in tasks.md markieren als ✅
# - Session-Log schreiben
# - git commit

# 4. Wenn NICHT alle ✅:
# - Nicht als ✅ markieren
# - Nicht committen
# - Weiter fixen bis alle ✅
```

### Partial Implementation - VERBOTEN:
```markdown
❌ "Feature ist 80% fertig, commit mal" → NEIN
❌ "Tests schreibe ich später" → NEIN
❌ "Build hat Fehler aber Feature geht" → NEIN
❌ "Frontend fertig, Backend machen wir morgen" → NEIN

✅ Task komplett (100% Definition of Done) → DANN commit
```
```

---

## FEHLER #6: TypeScript Errors Ignored

### Was FEHLT in Instruktionen:

#### ❌ CLAUDE.md: "TypeScript everywhere" aber keine "Build must pass" Regel
**Aktuell**:
```markdown
## Code Standards
- **TypeScript everywhere** - keine .js files
```

**Problem**: "TypeScript überall nutzen" ≠ "TypeScript Errors beheben"

**Evidenz**: 12 Frontend Errors, 40+ Backend Errors, aber Code committed!

#### ❌ Agents: "Type safety" erwähnt, aber nicht enforced
**Backend-Agent**:
> "Always use TypeScript with strict type checking"

**Frontend-Agent**:
> "Always use TypeScript with strict mode enabled"

**Problem**: "nutzen" ≠ "Errors beheben"! Agent denkt: Warnings sind OK.

### Was SOLLTE da stehen:

```markdown
## TypeScript - ZERO TOLERANCE Policy

### Regel: KEIN Commit mit TypeScript Errors
**Definition**: `npm run build` darf KEINE `error TS` messages zeigen

**Workflow**:
```bash
# 1. Nach Code-Änderung
cd teacher-assistant/frontend && npm run build

# 2. Output checken
# ❌ Wenn "error TS..." → COMMIT VERBOTEN
# ✅ Wenn "0 errors" → Commit erlaubt

# 3. Alle Errors MÜSSEN behoben werden:
src/App.tsx(383,13): error TS2322: Type mismatch
→ STOP, fix this error NOW

src/pages/Home.tsx(86,19): error TS2345: Type not assignable
→ STOP, fix this error NOW
```

### Keine "Warnings sind OK" Mentalität:
**Agents MÜSSEN verstehen**:
- ❌ TypeScript Errors sind NICHT "nur Warnings"
- ❌ "Build funktioniert trotzdem" ist KEIN Argument
- ❌ "Errors in anderen Dateien" ist KEINE Ausrede
- ✅ `npm run build` MUSS sauber sein

### Bei TypeScript Errors:
**Option 1**: Error beheben (preferred)
```typescript
// Error: Type 'string | null' not assignable to 'string | undefined'
sessionId: string | null

// Fix: Adjust type
sessionId: string | null | undefined
// OR
sessionId: sessionId || undefined
```

**Option 2**: Wenn Error kompliziert → User fragen
```markdown
❌ NICHT: `// @ts-ignore` oder `as any`
✅ SONDERN: "User, TypeScript Error zu komplex für mich, bitte helfen"
```

**Option 3**: Wenn Error in fremdem Code → Issue erstellen
```markdown
# Error in src/lib/oldLegacyCode.ts
→ Nicht direkt fixen (Risiko)
→ Issue erstellen: "TypeScript errors in oldLegacyCode.ts"
→ User informieren
```

### TypeScript Strict Mode - IMMER aktiviert:
```json
// tsconfig.json - REQUIRED settings
{
  "compilerOptions": {
    "strict": true,                    // ✅ MUST be true
    "noImplicitAny": true,            // ✅ No 'any' without explicit
    "strictNullChecks": true,         // ✅ null/undefined handling
    "strictFunctionTypes": true,      // ✅ Function type checking
    "strictPropertyInitialization": true  // ✅ Class property init
  }
}
```

### Pre-Commit Hook (zukünftig):
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run typecheck && npm run lint"
    }
  },
  "scripts": {
    "typecheck": "tsc --noEmit"  // Check without building
  }
}
```
```

---

## FEHLER #7: No Integration Verification

### Was FEHLT in Instruktionen:

#### ❌ CLAUDE.md: Keine "Integration Test" Erwähnung
**Aktuell**: Nur "Session-Log erstellen" nach Arbeit

**Problem**: Unit Tests passen, aber Integration broken!

**Evidenz**:
- AgentFormView unit test: ✅ PASS
- AgentConfirmationMessage unit test: ✅ PASS
- **Zusammen**: ❌ BROKEN (Field Name Mismatch)

#### ❌ Agents: "Test thoroughly" ist vage
**Alle Agents**: "Test the implementation"

**Problem**: Was heißt "test"? Unit? Integration? E2E?

### Was SOLLTE da stehen:

```markdown
## Integration Verification - VERPFLICHTEND

### Test-Pyramide (in dieser Reihenfolge):
```
         /\
        /E2E\         ← FEW: Critical user paths (slow)
       /------\
      /Integr.\      ← SOME: Component integration (medium)
     /----------\
    / Unit Tests \   ← MANY: Individual functions (fast)
   /--------------\
```

### Regel: Alle 3 Ebenen MÜSSEN passen

#### 1. Unit Tests (MANY - fast)
**Zweck**: Einzelne Funktionen/Komponenten isoliert testen

**Beispiel**:
```typescript
// AgentFormView.test.tsx
test('form initializes with empty description', () => {
  render(<AgentFormView formData={{}} />);
  expect(input.value).toBe('');  // ✅ Isolated test
});
```

**Wann schreiben**: Nach jeder neuen Funktion/Komponente

#### 2. Integration Tests (SOME - medium speed)
**Zweck**: Mehrere Komponenten zusammen testen

**Beispiel**:
```typescript
// AgentFlow.integration.test.tsx
test('AgentConfirmation → AgentFormView data flow', () => {
  // 1. Backend returns agentSuggestion
  const suggestion = { prefillData: { description: 'Test' } };

  // 2. AgentConfirmation receives it
  render(<AgentConfirmation message={suggestion} />);

  // 3. User clicks "Confirm"
  click('Confirm');

  // 4. AgentFormView should receive prefillData
  expect(formInput.value).toBe('Test');  // ✅ Integration verified
});
```

**Wann schreiben**: Wenn Task mehrere Komponenten betrifft

#### 3. E2E Tests (FEW - slow)
**Zweck**: Kompletter User-Flow End-to-End

**Beispiel**:
```typescript
// image-generation-flow.e2e.ts
test('User can generate image from chat', async () => {
  // 1. User types in chat
  await page.type('[data-testid="chat-input"]', 'Generate image of tree');

  // 2. Agent suggestion appears
  await page.waitForSelector('[data-testid="agent-confirmation"]');

  // 3. User confirms
  await page.click('button:has-text("Start Generation")');

  // 4. Form appears pre-filled
  const description = await page.inputValue('[name="description"]');
  expect(description).toContain('tree');  // ✅ E2E flow works

  // 5. Image appears in library
  await page.click('button:has-text("Generate")');
  await page.waitForSelector('[data-testid="library-image"]');
  // ✅ Complete user journey verified
});
```

**Wann schreiben**: Für jeden kritischen User-Flow (User Stories)

### Integration Verification Checklist:
**Vor jedem Commit**:
- [ ] Unit Tests: `npm test` → ✅ ALL PASS
- [ ] Integration Tests: `npm test:integration` → ✅ PASS (wenn vorhanden)
- [ ] E2E Tests: `npm run test:e2e` → ✅ CRITICAL PATHS PASS
- [ ] Manual Test: User-Flow durchgespielt → ✅ WORKS

### ❌ VERBOTEN:
- "Unit Tests passen, ship it!" → NEIN (Integration nicht getestet)
- "E2E Tests broken, aber Feature geht" → NEIN (keine Regression-Safety)
- "Ich teste lokal, Tests schreib ich später" → NEIN (Test decay)

### Regel für komplexe Features:
**Wenn Task > 3 Komponenten betrifft**:
1. ✅ Integration Test schreiben (BEFORE marking done)
2. ✅ E2E Test für User-Flow schreiben (BEFORE marking done)
3. ✅ Beide Tests müssen passen (BEFORE commit)

**Warum**: Integration-Bugs sind die häufigsten und teuersten!
```

---

## 🎯 ZUSAMMENFASSUNG: Was muss in Instruktionen rein?

### Critical Additions (MUST HAVE):

#### 1. In CLAUDE.md:
```markdown
## Anti-Patterns - VERBOTEN
- Quick-Fixes (Symptom-Behandlung ohne Root Cause)
- TODOs im Code (stattdessen GitHub Issues)
- Commits mit failing tests
- Commits mit TypeScript Errors
- Partial Implementation (Task < 100% done)

## Shared Types - VERPFLICHTEND
- teacher-assistant/shared/types/ für alle API Types
- Backend + Frontend nutzen GLEICHE Types
- Field Name Mismatches unmöglich

## Testing - Zero Tolerance
- Kein Commit ohne passing tests
- Unit + Integration + E2E (wo applicable)
- E2E Infrastructure broken = P0 Bug

## Definition of Done (Task Completion)
- Feature funktioniert E2E (manual verification)
- Tests passen (npm test, npm run test:e2e)
- Build sauber (npm run build, 0 errors)
- Dokumentation komplett (session log)
- Code review ready (formatted, no TODOs)
```

#### 2. In Agent-Beschreibungen:
```markdown
## Quality Gates - BEFORE marking task ✅
1. TypeScript Build: npm run build → 0 errors
2. Unit Tests: npm test → ALL PASS
3. E2E Tests: npm run test:e2e → PASS (if UI)
4. Manual Test: User flow works E2E
5. Integration: Components work together (not just isolated)

## When to STOP and ask User:
- TypeScript Error zu komplex (no @ts-ignore!)
- E2E Test Infrastructure broken
- Spec unclear (no assumptions!)
- Root Cause not found (no Quick-Fix!)
- Integration broken between Frontend/Backend
```

#### 3. In .specify/README.md:
```markdown
## Definition of Done - Task Completion
[Full checklist from above]

## Anti-Patterns to Avoid
[Quick-Fixes, TODOs, Partial Implementation]

## Integration Testing Requirements
[Test pyramid, when to write which tests]
```

---

## 🚀 NÄCHSTE SCHRITTE

### Immediate:
1. ✅ Gap Analysis dokumentiert (dieses Dokument)
2. ⏳ User-Approval für Updates
3. ⏳ CLAUDE.md, Agent-Beschreibungen, SpecKit README updaten

### After Updates:
4. Neue Instruktionen testen (mit Test-Feature)
5. Validieren dass Fehler nicht mehr auftreten
6. Dokumentieren welche Improvements gemessen werden

---

**Erstellt**: 2025-10-06
**Author**: Claude (General-Purpose Agent)
**Status**: ⏳ Awaiting User Approval für Instruction Updates
