# Library & Materials Unification - Specification

**Status**: Draft
**Created**: 2025-09-30
**Priority**: P0 (Critical - Blocker für UI Redesign)
**Related Roadmap**: Phase 1.2 - Foundation Fix

---

## Problem Statement

### Current Situation ❌

Die Library hat aktuell **3 separate Tabs** mit unterschiedlichen Datenquellen:

1. **Chats Tab**: `chat_sessions` aus InstantDB
   - Funktioniert korrekt
   - Zeigt Chats mit Message Count
   - Kein Problem hier

2. **Materialien Tab**: `artifacts` aus InstantDB
   - Manuelle Materialien (von Lehrkraft erstellt)
   - Typen: `lesson-plan`, `worksheet`, `quiz`, etc.
   - Mit Filter-Chips

3. **Uploads Tab**: Extrahiert aus `messages.content` (JSON-parsed)
   - User-hochgeladene Dateien (PDFs, Bilder)
   - Separate Anzeige
   - **Problem**: Logisch gehören Uploads zu Materialien!

4. **Generated Artifacts (nicht im UI)**: `generated_artifacts` aus InstantDB
   - Von Agents erstellt (z.B. Bilder via DALL-E)
   - Werden im Chat angezeigt, aber **nicht in Library**
   - **Problem**: Sollten auch in Materialien erscheinen!

### Core Issues

1. **Verwirrende UX**: Lehrkräfte verstehen nicht, warum Uploads separat sind
2. **Feature-Inkonsistenz**: Agent-generierte Inhalte fehlen komplett in Library
3. **Datenmodell-Fragmentierung**: 3 Datenquellen für "Materialien"
4. **Unvollständige Datumsinformation**: Uploads haben nur Timestamps, keine formatierte Anzeige

### User Pain Points

> "Ich habe eine PDF hochgeladen, aber finde sie nicht unter Materialien." — Lehrkraft-Feedback (hypothetisch)

> "Der Agent hat mir ein Bild generiert, aber wo ist es jetzt?" — Expected User Journey

---

## Vision & Goals

### Vision

**Eine einzige, umfassende Material-Bibliothek**, die alle von Lehrkräften erstellten, hochgeladenen oder AI-generierten Inhalte an einem Ort zeigt.

### Goals

1. **Simplify**: Von 3 Tabs auf 2 Tabs (Chats + Materialien)
2. **Complete**: Alle Material-Typen an einem Ort
3. **Consistent**: Einheitliche Datums-Anzeige, Filter, UI-Pattern
4. **Automatic**: Agent-Output landet automatisch in Materialien

---

## User Stories

### US-1: Uploads in Materialien sehen

**Als** Lehrkraft
**möchte ich** hochgeladene Dateien unter "Materialien" finden
**damit** ich nicht zwischen Tabs suchen muss

**Acceptance Criteria**:
- ✅ Uploads erscheinen in Materialien-Tab
- ✅ Uploads haben gleiche Card-UI wie andere Materialien
- ✅ Uploads haben Datum (formatiert: "Heute", "Gestern", "vor X Tagen")
- ✅ Uploads sind filterbar (neuer Filter-Chip "Uploads")

### US-2: Agent-Artifacts in Materialien

**Als** Lehrkraft
**möchte ich** von Agents generierte Inhalte (Bilder, Dokumente) in meiner Bibliothek finden
**damit** ich sie wiederverwenden kann

**Acceptance Criteria**:
- ✅ Generated Artifacts erscheinen in Materialien-Tab
- ✅ Generated Artifacts haben Type-Label ("Generiertes Bild", "Quiz", etc.)
- ✅ Generated Artifacts sind downloadbar
- ✅ Generated Artifacts haben Datum

### US-3: Einheitliche Material-Anzeige

**Als** Lehrkraft
**möchte ich** alle Materialien mit gleichem Design sehen
**damit** die Bibliothek übersichtlich ist

**Acceptance Criteria**:
- ✅ Alle Material-Typen nutzen gleiche Card-Component
- ✅ Alle haben Titel, Beschreibung (falls vorhanden), Datum, Icon
- ✅ Alle haben gleiche Aktionen (Download, Favorite, Delete)

### US-4: Chat-Titel und Datum

**Als** Lehrkraft
**möchte ich** Chats mit aussagekräftigen Titeln sehen
**damit** ich schnell den richtigen Chat finde

**Acceptance Criteria**:
- ✅ Chat hat automatisch generierten Titel (Zusammenfassung der ersten User-Message)
- ✅ Datum ist dynamisch formatiert:
  - "Heute 14:30" (wenn heute)
  - "Gestern 10:15" (wenn gestern)
  - "vor 3 Tagen" (wenn 2-7 Tage)
  - "25.09.25" (wenn älter als 7 Tage)

---

## Requirements

### Must Have (P0)

#### Data Model

1. **Unified Materials Query**:
   - Frontend kombiniert 3 Datenquellen:
     - `artifacts` (manual materials)
     - `generated_artifacts` (agent outputs)
     - Uploads (extracted from `messages.content`)
   - Alle haben einheitliche Interface: `UnifiedMaterial`

2. **Material Type System**:
   ```typescript
   type MaterialSource = 'manual' | 'upload' | 'agent-generated';
   type MaterialType =
     | 'lesson-plan'
     | 'worksheet'
     | 'quiz'
     | 'document'
     | 'image'
     | 'upload-pdf'
     | 'upload-image'
     | 'resource';

   interface UnifiedMaterial {
     id: string;
     title: string;
     description?: string;
     type: MaterialType;
     source: MaterialSource;
     created_at: number;
     updated_at: number;
     metadata: {
       // For uploads
       filename?: string;
       file_url?: string;
       file_type?: string;

       // For generated artifacts
       agent_id?: string;
       prompt?: string;
       model_used?: string;

       // For manual materials
       tags?: string[];
       subject?: string;
       grade?: string;
     };
     is_favorite: boolean;
   }
   ```

3. **Chat Title Generation**:
   - Backend: Neue Function `generateChatTitle(firstUserMessage: string): string`
   - Nutzt OpenAI (oder einfache Heuristik) um Titel zu generieren
   - Wird beim ersten User-Message automatisch gesetzt

#### Frontend

1. **Two-Tab Layout**:
   - Tab 1: "Chats" (unverändert)
   - Tab 2: "Materialien" (vereint artifacts + uploads + generated artifacts)
   - Uploads-Tab entfernen

2. **Materials Tab UI**:
   - Filter-Chips erweitert:
     - "Alle"
     - "Dokumente"
     - "Arbeitsblätter"
     - "Quiz"
     - "Uploads" ⭐ NEU
     - "KI-generiert" ⭐ NEU
   - Alle Materialien in chronologischer Reihenfolge
   - Einheitliche Card-Component

3. **Date Formatting**:
   - Utility Function: `formatRelativeDate(timestamp: number): string`
   - Implementiert Smart-Formatting:
     - Heute: "Heute 14:30"
     - Gestern: "Gestern 10:15"
     - 2-7 Tage: "vor X Tagen"
     - >7 Tage: "25. Sep" oder "25.09.25"

4. **Material Actions**:
   - Download (für alle Typen)
   - Favorite Toggle (für alle Typen)
   - Delete (für manual + uploads, nicht für agent-generated?)

#### Backend

1. **No Schema Changes** (❗):
   - Aktuelle Schemas bleiben unverändert
   - `artifacts`, `generated_artifacts`, `messages` wie sie sind
   - Frontend kombiniert die Daten

2. **Optional: Chat Title API**:
   - `POST /api/chat/generate-title`
   - Body: `{ firstMessage: string }`
   - Response: `{ title: string }`
   - Nutzt OpenAI oder simple Heuristik (erste 50 Zeichen)

### Should Have (P1)

1. **Material Preview**:
   - Click auf Material öffnet Preview-Modal
   - Zeigt Content (Text, Bild, PDF-Vorschau)

2. **Bulk Actions**:
   - Multi-Select für Materials
   - Batch-Delete, Batch-Download

3. **Search across all materials**:
   - Suche findet in Uploads, Artifacts, Generated Artifacts

### Nice to Have (P2)

1. **Material Organization**:
   - Folders/Collections für Materials
   - Tags für alle Material-Typen

2. **Sharing**:
   - Materials mit anderen Lehrkräften teilen

---

## Success Criteria

### Functional

- ✅ Uploads erscheinen in Materialien-Tab
- ✅ Generated Artifacts erscheinen in Materialien-Tab
- ✅ Alle Materialien haben einheitliches Design
- ✅ Datum-Formatierung funktioniert korrekt
- ✅ Chat-Titel werden automatisch generiert
- ✅ Filter-Chips funktionieren für alle Material-Typen
- ✅ Download funktioniert für alle Material-Typen

### Non-Functional

- ✅ Performance: Library lädt in <1 Sekunde
- ✅ No Breaking Changes: Bestehende Daten bleiben kompatibel
- ✅ Mobile Responsive: UI funktioniert auf Smartphone

### User Experience

- ✅ Lehrkraft findet Uploads intuitiv
- ✅ Lehrkraft sieht Agent-Output in Library
- ✅ Library fühlt sich "complete" an (keine missing features)

---

## Scope & Constraints

### In Scope ✅

- Frontend UI Unification (Materialien-Tab)
- Data Aggregation (Combine 3 sources)
- Date Formatting Utility
- Chat Title Generation (Backend API + Frontend Integration)
- Filter Chips für neue Material-Typen

### Out of Scope ❌

- InstantDB Schema Changes (bleiben wie sie sind)
- File Upload Backend (funktioniert bereits)
- Agent System Changes (funktioniert bereits)
- Search/Filter-Logik Overhaul (nutzen bestehende Funktionen)

### Constraints

1. **No Breaking Changes**: Bestehende Daten müssen kompatibel bleiben
2. **Performance**: Keine N+1 Queries (effiziente Data-Fetching)
3. **Mobile First**: UI muss auf Smartphone perfekt funktionieren

---

## Risks & Mitigations

### Risk 1: Performance bei vielen Materialien

**Problem**: Wenn Lehrkraft 100+ Uploads + Artifacts hat, könnte Rendering langsam werden

**Mitigation**:
- Virtualized List (React Window / Ion Virtual Scroll)
- Pagination (erste 20 Materialien, dann "Mehr laden")
- Lazy Loading für Thumbnails

**Likelihood**: Medium
**Impact**: Medium

### Risk 2: Datenmodell-Inkonsistenzen

**Problem**: 3 Datenquellen haben unterschiedliche Felder, könnte zu Bugs führen

**Mitigation**:
- Klares TypeScript Interface `UnifiedMaterial`
- Transformer Functions für jede Datenquelle
- Unit Tests für Data Transformation

**Likelihood**: Medium
**Impact**: High

### Risk 3: Chat-Titel-Generierung zu langsam

**Problem**: OpenAI API Call für jeden Chat könnte UX verzögern

**Mitigation**:
- Asynchron im Hintergrund (non-blocking)
- Fallback auf "Chat vom [Datum]" während Generierung
- Simple Heuristik als Alternative (erste 50 Zeichen)

**Likelihood**: Low
**Impact**: Low

---

## Open Questions

1. **Sollen Agent-Generated Artifacts löschbar sein?**
   - Pro: User-Kontrolle
   - Contra: Könnten accidentell gelöscht werden
   - **Decision needed**

2. **Sollen Uploads editierbar sein (Titel ändern)?**
   - Aktuell: Filename ist Titel
   - Alternative: Lehrkraft kann Custom-Titel setzen
   - **Decision needed**

3. **Was passiert mit alten Chats ohne Titel?**
   - Migrieren: Backend-Script generiert Titel für alle bestehenden Chats?
   - Oder: Nur neue Chats haben Titel, alte bleiben "Chat vom [Datum]"
   - **Decision needed**

---

## Dependencies

### Technical Dependencies

- ✅ InstantDB React Hooks (`useQuery`)
- ✅ Existing Backend APIs (no new dependencies)
- ✅ React (TypeScript, Hooks)
- ✅ Ionic Components

### Feature Dependencies

- ✅ File Upload Feature (funktioniert bereits)
- ✅ Agent System (funktioniert bereits)
- ✅ Chat System (funktioniert bereits)

### Blockers

- ❌ None (kann parallel zu anderen Features entwickelt werden)

---

## Next Steps

1. **Review & Approve** diese Spec
2. **Clarify** Open Questions
3. **Create** `plan.md` (Technical Implementation Plan)
4. **Create** `tasks.md` (Actionable Task List)
5. **Implement** (Backend-Agent + Frontend-Agent + QA-Agent)

---

## Appendix

### Current Data Structures (for reference)

#### artifacts (InstantDB Schema)
```typescript
{
  id: string;
  title: string;
  type: 'lesson_plan' | 'quiz' | 'worksheet' | 'template' | 'resource';
  content: string;
  grade_level?: string;
  subject?: string;
  created_at: number;
  updated_at: number;
  is_favorite: boolean;
  tags?: string[];
  usage_count: number;
  source_session?: ChatSession;
  creator: User;
}
```

#### generated_artifacts (InstantDB Schema)
```typescript
{
  id: string;
  title: string;
  type: 'image' | 'document' | 'quiz' | 'lesson-plan' | 'worksheet' | 'template';
  artifact_data: Record<string, any>; // Contains URLs, content, etc.
  prompt: string;
  enhanced_prompt?: string;
  agent_id: string;
  model_used?: string;
  cost?: number;
  metadata: Record<string, any>;
  created_at: number;
  updated_at: number;
  is_favorite: boolean;
  usage_count: number;
  creator: User;
  agent: Agent;
  session?: ChatSession;
}
```

#### Uploads (extracted from messages.content)
```typescript
// Parsed from messages where role='user'
{
  id: string; // Generated: `img-${message.id}` or fileId
  filename: string;
  type: string; // MIME type
  messageId: string;
  timestamp: number;
  hasImage: boolean;
  hasFiles: boolean;
  imageData?: string; // Base64 or URL
  fileAttachments: Array<{id: string, filename: string}>;
}
```

---

**Maintained by**: Backend-Agent, Frontend-Agent
**Status**: Ready for `/plan` (Technical Planning)