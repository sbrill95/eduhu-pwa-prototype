# Backend Integration Tasks - Agent Suggestion & Modal Workflow

**Created**: 2025-10-02
**Status**: Todo
**Priority**: P0 (Critical for E2E Testing)
**Agent**: Backend-Node-Developer

---

## Übersicht

Das Frontend für die Gemini Agent Modal ist fertig implementiert, aber das Backend fehlt noch die **Agent-Suggestion-Logik**, die erkennt, wann ein Agent vorgeschlagen werden soll.

**Aktueller Status**:
- ✅ Frontend: Agent Modal komplett implementiert
- ✅ Backend: Prompt Engineering für Bildgenerierung (TASK-012)
- ❌ Backend: Agent Suggestion Detection fehlt
- ❌ Backend: Chat Response mit agentSuggestion fehlt

---

## Fehlende Backend-Komponenten

### 1. Agent Intent Detection
**Was fehlt**: Logik, die erkennt, ob eine Chat-Nachricht einen Agent triggern sollte

**Beispiel**:
```
User: "Ich brauche ein Bild zur Photosynthese für meine 7. Klasse"
→ Backend sollte erkennen: Intent = "Bildgenerierung"
→ Backend sollte agentSuggestion zurückgeben
```

### 2. Agent Suggestion in Chat Response
**Was fehlt**: Backend muss `agentSuggestion` in der Chat-Response zurückgeben

**Erwartetes Response-Format**:
```typescript
{
  message: {
    role: 'assistant',
    content: 'Ich kann dir dabei helfen, ein Bild zu erstellen.',
    agentSuggestion: {
      agentType: 'image-generation',
      reasoning: 'Basierend auf deiner Anfrage scheint ein visuelles Material geeignet.',
      prefillData: {
        theme: 'Photosynthese für Klasse 7',
        learningGroup: 'Klasse 7a'
      }
    }
  }
}
```

---

## Tasks

### TASK-016: Implement Agent Intent Detection Service ✅

**Status**: `completed` (2025-10-02)
**Priority**: `P0` (Critical)
**Agent**: Backend-Node-Developer
**Actual Time**: 2 hours

#### Description
Erstelle einen Service, der User-Nachrichten analysiert und erkennt, ob ein Agent vorgeschlagen werden soll.

#### Acceptance Criteria
- [x] File created: `teacher-assistant/backend/src/services/agentIntentService.ts`
- [x] Function: `detectAgentIntent(message: string, context?: TeacherKnowledge): AgentIntent | null`
- [x] Erkennt Intent für:
  - [x] **Bildgenerierung**: Keywords wie "Bild", "Foto", "Illustration", "visuell", "Schaubild"
  - [x] **Arbeitsblatt**: Keywords wie "Arbeitsblatt", "Aufgaben", "Übungen"
  - [x] **Unterrichtsplan**: Keywords wie "Unterricht", "Stunde", "Lehrplan"
- [x] Extrahiert Prefill-Daten aus Message:
  - [x] Thema (z.B. "Photosynthese")
  - [x] Lerngruppe (z.B. "Klasse 7", "7a")
  - [x] Fach (aus Teacher Profile wenn möglich)
- [x] Unit Tests: 10+ Tests für verschiedene Intents (**33 Tests implemented**)
- [x] TypeScript strict mode compliant

#### Implementation Approach

**Option A: Keyword-Based (MVP - Quick)**
```typescript
export class AgentIntentService {
  static detectAgentIntent(message: string, context?: TeacherKnowledge): AgentIntent | null {
    const lowerMessage = message.toLowerCase();

    // Detect image generation intent
    const imageKeywords = ['bild', 'foto', 'illustration', 'visuell', 'schaubild', 'grafik'];
    if (imageKeywords.some(kw => lowerMessage.includes(kw))) {
      return {
        agentType: 'image-generation',
        confidence: 0.8,
        prefillData: this.extractPrefillData(message, context)
      };
    }

    return null;
  }

  private static extractPrefillData(message: string, context?: TeacherKnowledge) {
    // Extract theme from message
    const theme = this.extractTheme(message);

    // Extract learning group (Klasse X)
    const learningGroup = this.extractLearningGroup(message, context);

    return { theme, learningGroup };
  }
}
```

**Option B: OpenAI-Based (Better - Slower)**
```typescript
export class AgentIntentService {
  static async detectAgentIntent(message: string, context?: TeacherKnowledge): Promise<AgentIntent | null> {
    const prompt = `
Du bist ein Intent-Classifier für einen Lehrassistenten.

User-Nachricht: "${message}"
Lehrer-Kontext: ${JSON.stringify(context)}

Antworte mit JSON:
{
  "shouldSuggestAgent": true/false,
  "agentType": "image-generation" | "worksheet" | "lesson-plan" | null,
  "confidence": 0.0-1.0,
  "reasoning": "Warum dieser Agent passt",
  "prefillData": {
    "theme": "Extrahiertes Thema",
    "learningGroup": "Klasse X"
  }
}
`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

#### Recommendation
**Start with Option A (Keyword-Based)** for MVP, dann später zu Option B upgraden.

#### Files to Create
- [ ] `teacher-assistant/backend/src/services/agentIntentService.ts`
- [ ] `teacher-assistant/backend/src/services/agentIntentService.test.ts`

#### Types to Add
```typescript
// teacher-assistant/backend/src/types/index.ts
export interface AgentIntent {
  agentType: 'image-generation' | 'worksheet' | 'lesson-plan';
  confidence: number; // 0.0 - 1.0
  reasoning: string;
  prefillData: {
    theme: string;
    learningGroup?: string;
    subject?: string;
  };
}
```

---

### TASK-017: Integrate Agent Suggestion into Chat Response ✅

**Status**: `completed` (2025-10-02)
**Priority**: `P0` (Critical)
**Agent**: Backend-Node-Developer
**Actual Time**: 1.5 hours

#### Description
Integriere den AgentIntentService in den ChatService, sodass Chat-Responses ein `agentSuggestion` Feld enthalten können.

#### Acceptance Criteria
- [x] File updated: `teacher-assistant/backend/src/services/chatService.ts`
- [x] Nach OpenAI Chat Completion:
  - [x] Call `AgentIntentService.detectAgentIntent(lastUserMessage)`
  - [x] If Intent detected: Add `agentSuggestion` to response
  - [x] If no Intent: Normal response ohne `agentSuggestion`
- [x] Response format matches Frontend expectation
- [x] Unit Tests: 5+ Tests (**24 total ChatService tests, 5 new for Agent Suggestion**)
  - [x] Test: Intent detected → agentSuggestion added
  - [x] Test: No intent → no agentSuggestion
  - [x] Test: Prefill data extracted correctly
- [x] No breaking changes to existing Chat API

#### Implementation

```typescript
// In chatService.ts createChatCompletion()

// After getting completion from OpenAI:
const assistantMessage = completion.choices[0].message.content;

// Detect agent intent from last user message
const lastUserMessage = request.messages.filter(m => m.role === 'user').pop();
let agentSuggestion: AgentSuggestion | undefined;

if (lastUserMessage) {
  const intent = await AgentIntentService.detectAgentIntent(
    lastUserMessage.content as string,
    teacherKnowledge
  );

  if (intent && intent.confidence > 0.7) {
    agentSuggestion = {
      agentType: intent.agentType,
      reasoning: intent.reasoning,
      prefillData: intent.prefillData
    };
  }
}

// Return response with agentSuggestion
const response: ChatResponse = {
  message: {
    role: 'assistant',
    content: assistantMessage,
    agentSuggestion // Only present if intent detected
  },
  usage: completion.usage,
  model: completion.model
};

return response;
```

#### Files to Modify
- [ ] `teacher-assistant/backend/src/services/chatService.ts`
- [ ] `teacher-assistant/backend/src/services/chatService.test.ts`

#### Types Already Exist
```typescript
// teacher-assistant/backend/src/types/index.ts (already defined)
export interface AgentSuggestion {
  agentType: string;
  reasoning: string;
  prefillData: {
    theme: string;
    learningGroup?: string;
    [key: string]: any;
  };
}
```

---

### TASK-018: Add Agent Detection to Chat API Endpoint ✅

**Status**: `completed` (2025-10-02)
**Priority**: `P0` (Critical)
**Agent**: Backend-Node-Developer
**Actual Time**: 15 minutes

#### Description
Stelle sicher, dass die `/api/chat` Route die Agent-Suggestion korrekt zurückgibt.

#### Acceptance Criteria
- [x] File verified: `teacher-assistant/backend/src/routes/index.ts`
- [x] POST `/api/chat` Response includes `agentSuggestion` if detected
- [x] Response structure matches Frontend expectations
- [x] No changes needed (ChatService already returns correct format)
- [x] Integration test: Send message → Verify agentSuggestion in response

#### Manual Test
```bash
# Test Agent Suggestion Detection
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Ich brauche ein Bild zur Photosynthese für Klasse 7"}
    ],
    "userId": "test-user-id"
  }'

# Expected Response:
{
  "message": {
    "role": "assistant",
    "content": "Ich kann dir dabei helfen...",
    "agentSuggestion": {
      "agentType": "image-generation",
      "reasoning": "...",
      "prefillData": {
        "theme": "Photosynthese",
        "learningGroup": "Klasse 7"
      }
    }
  }
}
```

#### Files to Verify/Modify
- [ ] `teacher-assistant/backend/src/routes/index.ts` (verify response format)

---

### TASK-019: Write Integration Tests for Agent Suggestion Flow ✅

**Status**: `completed` (2025-10-02)
**Priority**: `P1` (High)
**Agent**: Backend-Node-Developer
**Actual Time**: 1 hour

#### Description
Erstelle Integration Tests für den kompletten Agent-Suggestion Workflow.

#### Acceptance Criteria
- [x] File created: `teacher-assistant/backend/src/tests/agentSuggestion.integration.test.ts`
- [x] Test 1: Bildgenerierung-Intent wird erkannt ✅
  - [x] Send: "Ich brauche ein Bild zur Photosynthese"
  - [x] Verify: agentType = "image-generation"
  - [x] Verify: prefillData.theme = "Photosynthese"
- [x] Test 2: Kein Intent → keine Suggestion ✅
  - [x] Send: "Wie geht es dir?"
  - [x] Verify: agentSuggestion = undefined
- [x] Test 3: Lerngruppe wird extrahiert ✅
  - [x] Send: "Bild für Klasse 7a zur Photosynthese"
  - [x] Verify: prefillData.learningGroup = "Klasse 7a"
- [x] Test 4: Teacher Context wird verwendet ✅
  - [x] Teacher Profile hat Fach "Biologie"
  - [x] Verify: prefillData berücksichtigt Kontext
- [x] All tests passing (**12 Integration Tests passing**)

#### Files to Create
- [ ] `teacher-assistant/backend/src/tests/agentSuggestion.integration.test.ts`

---

## Dependencies

```
TASK-016 (AgentIntentService)
  ↓
TASK-017 (ChatService Integration)
  ↓
TASK-018 (API Endpoint Verification)
  ↓
TASK-019 (Integration Tests)
```

**Alle Tasks müssen sequentiell abgearbeitet werden.**

---

## Time Estimate

| Task | Estimate |
|------|----------|
| TASK-016: AgentIntentService | 2h |
| TASK-017: ChatService Integration | 1.5h |
| TASK-018: API Endpoint | 30min |
| TASK-019: Integration Tests | 1h |
| **Total** | **5 hours** |

---

## Success Criteria

**Nach Completion aller Tasks**:

✅ Chat-Nachricht "Ich brauche ein Bild zur Photosynthese" triggert Agent-Suggestion

✅ Frontend empfängt `agentSuggestion` und zeigt Confirmation Message

✅ User klickt "Ja, Bild erstellen" → Modal öffnet mit Pre-filled Data

✅ E2E Tests funktionieren ohne Mocks (gegen Live-Backend)

✅ Unit Tests: 15+ neue Tests passing

✅ Integration Tests: 4+ Tests passing

---

## Testing Checklist

### Manual Testing

- [x] Start Backend: `npm run dev` ✅
- [x] Test Backend API with cURL ✅
- [x] Verify: "Bild zur Photosynthese" → agentSuggestion detected ✅
- [x] Verify: "Wie geht es dir?" → no agentSuggestion ✅
- [x] Verify: "Arbeitsblatt" → worksheet agentSuggestion ✅
- [ ] Start Frontend: `npm run dev` (pending)
- [ ] Navigate to Chat (pending)
- [ ] Send: "Ich brauche ein Bild zur Photosynthese für Klasse 7" (pending)
- [ ] Verify: Confirmation Message appears (pending)
- [ ] Click: "Ja, Bild erstellen ✨" (pending)
- [ ] Verify: Modal opens with theme = "Photosynthese" (pending)
- [ ] Verify: learningGroup = "Klasse 7" (or similar) (pending)

### Automated Testing

- [x] Unit Tests: `npm run test` (Backend) ✅ 69 tests passing
- [x] Integration Tests: `npm run test:integration` (Backend) ✅ 12 tests passing
- [ ] E2E Tests: `npx playwright test agent-modal-workflow.spec.ts` (Frontend) (pending)

---

## Related Documentation

- **Frontend Implementation**: `.specify/specs/image-generation-modal-gemini/tasks.md`
- **E2E Testing Status**: `E2E-TESTING-STATUS.md`
- **Deployment Summary**: `GEMINI-MODAL-IMPLEMENTATION-COMPLETE.md`

---

## Next Steps After Completion

1. ✅ Backend Tasks fertig
2. Run E2E Tests gegen Live-Backend
3. Manual Testing durchführen
4. Screenshots für Stakeholder
5. Deploy to Staging
6. Final QA
7. **Production Deployment** 🚀

---

**Last Updated**: 2025-10-02
**Assignee**: Backend-Node-Developer Agent
**Status**: Ready for Implementation
