# Session 01: Backend Prompt Engineering for Gemini Image Generation

**Datum**: 2025-10-02
**Agent**: Backend-Node-Developer
**Dauer**: 45 Minuten
**Status**: ✅ Completed
**Related SpecKit**: `.specify/specs/image-generation-modal-gemini/`

---

## 🎯 Session Ziele

- Implementierung von TASK-012: Backend Prompt Engineering für neue Gemini-Parameter
- Erstellen eines `buildPrompt()` Functions für pädagogische Parameter
- Integration der neuen Parameter (DaZ, Lernschwierigkeiten) in den Bildgenerierungs-Workflow
- Unit Tests für die neue Funktionalität

---

## 🔧 Implementierungen

### 1. Neue TypeScript Interfaces

**Erstellt**: `ImageGenerationInput` Interface
```typescript
export interface ImageGenerationInput {
  theme: string;              // "Satz des Pythagoras"
  learningGroup: string;      // "Klasse 8a"
  dazSupport: boolean;        // DaZ-Unterstützung
  learningDifficulties: boolean; // Lernschwierigkeiten
}
```

**Zweck**: Typsichere Definition der Gemini-Form-Parameter aus dem Frontend.

---

### 2. buildPrompt() Funktion

**Implementiert**: Neue private Methode in `LangGraphImageGenerationAgent`

**Funktionalität**:
- Baut pädagogisch optimierten Prompt aus Gemini-Form-Daten
- **DaZ-Unterstützung** (wenn aktiviert):
  - Einfache, klare visuelle Elemente ohne komplexe Texte
  - Universell verständliche Symbole und Bildsprache
  - Fokus auf visuelle Vermittlung statt Text
  - Kulturell neutrale Darstellung

- **Lernschwierigkeiten** (wenn aktiviert):
  - Klare, strukturierte Darstellung ohne visuelle Überfrachtung
  - Reduzierte Komplexität, Fokus auf Kernkonzept
  - Wenig ablenkende Details
  - Hoher Kontrast und eindeutige Formen

**Beispiel-Output**:
```
Erstelle ein pädagogisch wertvolles Bild für das Thema: Satz des Pythagoras.
Zielgruppe: Klasse 8a.

Berücksichtige DaZ-Lernende (Deutsch als Zweitsprache):
- Einfache, klare visuelle Elemente ohne komplexe Texteinblendungen
- Universell verständliche Symbole und Bildsprache
- Fokus auf visuelle Vermittlung statt Text
- Kulturell neutrale Darstellung

Berücksichtige Lernschwierigkeiten:
- Klare, strukturierte Darstellung ohne visuelle Überfrachtung
- Reduzierte Komplexität, Fokus auf Kernkonzept
- Wenig ablenkende Details
- Hoher Kontrast und eindeutige Formen

Stil: Pädagogisch wertvoll, ansprechend und altersgerecht für Klasse 8a.
Das Bild soll im Unterricht direkt einsetzbar sein.
Format: Klar, professionell, lernförderlich.
```

---

### 3. Integration in execute() Methode

**Modified**: `execute()` Methode mit intelligenter Erkennung

**Logik**:
1. **Erkennung von Gemini-Input**: Prüft auf `theme` und `learningGroup` properties
2. **Wenn Gemini-Input**: Nutzt neue `buildPrompt()` Funktion
3. **Sonst**: Fallback auf bestehende `enhanceGermanPrompt()` Methode

**Code-Snippet**:
```typescript
// Check if this is Gemini form input (Phase 3.2)
const geminiInput = params as any as ImageGenerationInput;
if (geminiInput.theme && geminiInput.learningGroup !== undefined) {
  // Use new Gemini prompt builder
  logInfo(`Using Gemini prompt builder with DaZ: ${geminiInput.dazSupport}, Learning Difficulties: ${geminiInput.learningDifficulties}`);
  finalPrompt = this.buildPrompt(geminiInput);
} else if (imageParams.enhancePrompt !== false && this.config.enhance_german_prompts) {
  // Fallback: Use old enhancement method
  finalPrompt = await this.enhanceGermanPrompt(imageParams.prompt, imageParams);
}
```

**Vorteil**: Backward-compatible - alte API-Calls funktionieren weiterhin.

---

## 📁 Erstellte/Geänderte Dateien

### Erstellt:
- `teacher-assistant/backend/src/agents/langGraphImageGenerationAgent.test.ts`
  - 11 Unit Tests für `buildPrompt()` Funktion
  - Tests für DaZ-Unterstützung, Lernschwierigkeiten, Kombination beider
  - Tests für Gemini-Integration in `execute()`
  - Validierungstests für Prompt-Struktur und Länge

### Modifiziert:
- `teacher-assistant/backend/src/agents/langGraphImageGenerationAgent.ts`
  - Neues Interface: `ImageGenerationInput` (Zeilen 25-33)
  - Neue Methode: `buildPrompt()` (Zeilen 330-358)
  - Modifizierte Methode: `execute()` - Gemini-Detection-Logik (Zeilen 128-137)

---

## 🧪 Tests

### Unit Tests: ✅ Alle 11 Tests bestehen

**Test Coverage**:
1. ✅ Basic prompt ohne DaZ/Lernschwierigkeiten
2. ✅ Prompt mit DaZ-Unterstützung
3. ✅ Prompt mit Lernschwierigkeiten
4. ✅ Prompt mit beiden Features aktiviert
5. ✅ Stil-Richtlinien immer enthalten
6. ✅ Sonderzeichen im Thema korrekt behandelt
7. ✅ Verschiedene Lerngruppen korrekt verarbeitet
8. ✅ Gemini-Input-Erkennung in `execute()`
9. ✅ Fallback auf alte Methode bei Non-Gemini-Input
10. ✅ Prompt-Struktur korrekt
11. ✅ Prompt-Länge unter DALL-E-Limit (2000 Zeichen)

**Test-Output**:
```
PASS src/agents/langGraphImageGenerationAgent.test.ts (15.962 s)
  LangGraphImageGenerationAgent - buildPrompt
    buildPrompt()
      √ should create basic prompt without DaZ or learning difficulties (6 ms)
      √ should include DaZ considerations when enabled (3 ms)
      √ should include learning difficulties considerations when enabled (1 ms)
      √ should include both DaZ and learning difficulties when both enabled (2 ms)
      √ should always include style guidelines (1 ms)
      √ should handle special characters in theme correctly (1 ms)
      √ should handle different learning groups correctly (2 ms)
    execute() - Gemini Integration
      √ should detect Gemini input and use buildPrompt (8 ms)
      √ should use old enhancement method when Gemini params not present (4127 ms)
    Prompt Output Validation
      √ should produce prompt with correct structure (2 ms)
      √ should produce prompt that is not too long for DALL-E (1 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

### TypeScript Compilation: ✅ Erfolgreich
```
npx tsc --noEmit
(no errors)
```

---

## 🔍 Implementierungs-Details

### Design Decisions

**1. Backward Compatibility**
- Alte API-Calls (`prompt` + `enhancePrompt`) funktionieren weiterhin
- Neue Gemini-API-Calls werden automatisch erkannt
- Keine Breaking Changes

**2. Prompt Engineering Strategie**

**DaZ-Fokus (Deutsch als Zweitsprache)**:
- Visuelle Vermittlung > Text
- Kulturell neutrale Symbole
- Einfache, klare Elemente
- Universell verständliche Bildsprache

**Lernschwierigkeiten-Fokus**:
- Reduzierte Komplexität
- Klare Strukturen
- Hoher Kontrast
- Wenig Ablenkung
- Fokus auf Kernkonzept

**3. Prompt-Struktur**
```
1. Einleitung (Thema + Zielgruppe)
2. DaZ-Considerations (optional)
3. Lernschwierigkeiten-Considerations (optional)
4. Stil-Richtlinien (immer)
5. Format-Vorgaben (immer)
```

---

## 🎯 Success Criteria

**Alle Criteria erfüllt** ✅

- [x] `buildPrompt()` Funktion existiert
- [x] Prompt enthält `theme` und `learningGroup`
- [x] Prompt enthält DaZ-Logik wenn enabled
- [x] Prompt enthält Lernschwierigkeiten-Logik wenn enabled
- [x] Agent verwendet `buildPrompt()` für Gemini-Input
- [x] Unit tests passing (11/11)
- [x] TypeScript: No errors
- [x] Backend kompiliert ohne Fehler
- [x] Backward-compatible (keine Breaking Changes)

---

## 📊 Beispiel-Prompts

### Beispiel 1: Nur Thema + Lerngruppe
**Input**:
```json
{
  "theme": "Satz des Pythagoras",
  "learningGroup": "Klasse 8a",
  "dazSupport": false,
  "learningDifficulties": false
}
```

**Output-Prompt**:
```
Erstelle ein pädagogisch wertvolles Bild für das Thema: Satz des Pythagoras.
Zielgruppe: Klasse 8a.

Stil: Pädagogisch wertvoll, ansprechend und altersgerecht für Klasse 8a.
Das Bild soll im Unterricht direkt einsetzbar sein.
Format: Klar, professionell, lernförderlich.
```

---

### Beispiel 2: Mit DaZ-Unterstützung
**Input**:
```json
{
  "theme": "Photosynthese",
  "learningGroup": "Klasse 6b",
  "dazSupport": true,
  "learningDifficulties": false
}
```

**Output-Prompt**:
```
Erstelle ein pädagogisch wertvolles Bild für das Thema: Photosynthese.
Zielgruppe: Klasse 6b.

Berücksichtige DaZ-Lernende (Deutsch als Zweitsprache):
- Einfache, klare visuelle Elemente ohne komplexe Texteinblendungen
- Universell verständliche Symbole und Bildsprache
- Fokus auf visuelle Vermittlung statt Text
- Kulturell neutrale Darstellung

Stil: Pädagogisch wertvoll, ansprechend und altersgerecht für Klasse 6b.
Das Bild soll im Unterricht direkt einsetzbar sein.
Format: Klar, professionell, lernförderlich.
```

---

### Beispiel 3: Beide Features aktiviert
**Input**:
```json
{
  "theme": "Wasserkreislauf",
  "learningGroup": "Klasse 5c",
  "dazSupport": true,
  "learningDifficulties": true
}
```

**Output-Prompt**:
```
Erstelle ein pädagogisch wertvolles Bild für das Thema: Wasserkreislauf.
Zielgruppe: Klasse 5c.

Berücksichtige DaZ-Lernende (Deutsch als Zweitsprache):
- Einfache, klare visuelle Elemente ohne komplexe Texteinblendungen
- Universell verständliche Symbole und Bildsprache
- Fokus auf visuelle Vermittlung statt Text
- Kulturell neutrale Darstellung

Berücksichtige Lernschwierigkeiten:
- Klare, strukturierte Darstellung ohne visuelle Überfrachtung
- Reduzierte Komplexität, Fokus auf Kernkonzept
- Wenig ablenkende Details
- Hoher Kontrast und eindeutige Formen

Stil: Pädagogisch wertvoll, ansprechend und altersgerecht für Klasse 5c.
Das Bild soll im Unterricht direkt einsetzbar sein.
Format: Klar, professionell, lernförderlich.
```

---

## 🐛 Known Issues

**Keine bekannten Issues** ✅

- TypeScript-Kompilierung erfolgreich
- Alle Tests bestehen
- Keine Laufzeitfehler
- Backward-kompatibel

---

## 🚀 Nächste Schritte

### Immediate Next Steps (Frontend-Agent)
1. **TASK-004**: Update Frontend `ImageGenerationFormData` Type
2. **TASK-005**: Redesign `AgentFormView` with Gemini UI
3. **TASK-006**: Write Frontend Unit Tests

### Integration Point
- Frontend sendet Gemini-Form-Daten an Backend
- Backend erkennt automatisch Gemini-Input
- `buildPrompt()` wird verwendet
- DALL-E generiert optimiertes Bild

### QA Verification
- Playwright E2E Test: TASK-014
- Verify Gemini-Workflow end-to-end
- Visual verification: Generated images match pädagogische Requirements

---

## 💡 Lessons Learned

### Was gut funktioniert hat
1. **Modulare Funktion**: `buildPrompt()` ist einfach zu testen und zu warten
2. **TypeScript Types**: `ImageGenerationInput` Interface schafft klare Struktur
3. **Backward Compatibility**: Alte und neue API koexistieren problemlos
4. **Prompt-Engineering**: Klare Struktur mit optional sections (DaZ, Lernschwierigkeiten)

### Was verbessert werden könnte
1. **Prompt-Optimierung**: Testen mit echten DALL-E-Generierungen
2. **Internationalisierung**: Englische Prompts für bessere DALL-E-Ergebnisse?
3. **Parameter-Erweiterung**: Evtl. weitere pädagogische Parameter (z.B. Schulform, Fach)

---

## 📚 Technical References

### Related Files
- **Implementation**: `teacher-assistant/backend/src/agents/langGraphImageGenerationAgent.ts`
- **Tests**: `teacher-assistant/backend/src/agents/langGraphImageGenerationAgent.test.ts`
- **SpecKit**: `.specify/specs/image-generation-modal-gemini/`
  - `spec.md`: Requirements
  - `plan.md`: Technical Design
  - `tasks.md`: TASK-012

### API Contract
```typescript
// Frontend sendet:
POST /api/langgraph-agents/execute
{
  "agentId": "langgraph-image-generation",
  "params": {
    "theme": "Satz des Pythagoras",
    "learningGroup": "Klasse 8a",
    "dazSupport": true,
    "learningDifficulties": false,
    "prompt": "Satz des Pythagoras" // Fallback für Validation
  }
}

// Backend Response:
{
  "success": true,
  "data": {
    "image_url": "https://...",
    "revised_prompt": "...",
    "enhanced_prompt": "..." // Der buildPrompt() Output
  },
  "cost": 4,
  "artifacts": [...]
}
```

---

## ✅ Task Completion

**TASK-012: Backend Prompt Engineering** - ✅ **COMPLETED**

**Implementation Time**: 45 Minuten
**Test Coverage**: 11/11 Tests passing
**Code Quality**: TypeScript strict mode, no errors
**Documentation**: Comprehensive session log

**Ready for**:
- Frontend Integration (TASK-004, TASK-005)
- E2E Testing (TASK-014)
- Production Deployment

---

**Session Ende**: 2025-10-02
**Status**: ✅ Erfolgreich abgeschlossen
**Nächster Agent**: Frontend-Agent (TASK-004)
