# Multi-Agent System PRD - Phase 3
**Product Requirements Document**

**Project**: Teacher Assistant - Multi-Agent System
**Version**: 1.0
**Date**: 2025-10-17
**Author**: Product Management
**Status**: ✅ APPROVED - Ready for Implementation

---

## 1. Executive Summary

### Vision
Enhance Teacher Assistant with an intelligent Image Agent (creation + editing) and external calendar integration, establishing foundation for future multi-agent expansion.

### Current State (Phase 2)
- **Single Agent**: Image generation only (DALL-E 3)
- **Manual Selection**: Users manually trigger agent
- **LangGraph Framework**: State machine-based workflows
- **Limited Capabilities**: No editing capability
- **Mock Calendar**: CalendarCard shows hardcoded mock data

### Target State (Phase 3 - MVP)
- **Enhanced Image Agent**: Creation (DALL-E 3) + Editing (Gemini 2.5 Flash)
- **Intelligent Router**: Auto-detect creation vs editing intent
- **OpenAI Agents SDK**: Migration from LangGraph to OpenAI's native framework
- **External Calendar Sync**: Display real calendar data from Google Calendar/Outlook
- **Foundation for Future**: Architecture ready for Research & Pedagogical agents (Phase 5)

### Business Impact
- **Improved Image Workflow**: Teachers can edit images without recreating them
- **Time Savings**: 50% reduction in image iteration time (edit vs regenerate)
- **Better Planning**: Real calendar data instead of mock data
- **Scalable Architecture**: Easy to add Research & Pedagogical agents later

---

## 2. Objectives & Success Metrics

### Primary Goals (Phase 3 MVP)

| Goal | Metric | Target |
|------|--------|--------|
| **Image Routing Accuracy** | % of creation vs editing correctly detected | ≥ 95% |
| **Image Editing Success** | % of successful Gemini edits | ≥ 90% |
| **Time Savings** | Reduction in image iteration time | ≥ 50% |
| **Calendar Data Accuracy** | Real events displayed correctly | 100% |
| **Calendar Sync Reliability** | Sync success rate | ≥ 99% |

### Secondary Goals
- Reduce image regeneration costs (edit instead of recreate)
- Establish OpenAI Agents SDK foundation for future agents
- Enable teachers to see real schedule data
- Architecture ready for Research & Pedagogical agents (Phase 5)

---

## 3. Technical Architecture

### 3.1 Framework Migration: LangGraph → OpenAI Agents SDK

#### Why OpenAI Agents SDK?

**Official Documentation**:
- SDK Homepage: https://openai.github.io/openai-agents-python/
- API Guide: https://platform.openai.com/docs/guides/agents-sdk
- GitHub: https://github.com/openai/openai-agents-python
- Tracing Dashboard: https://platform.openai.com/traces

**Status**: Production-ready (evolved from experimental "Swarm")

**Core Primitives**:
```python
from openai_agents import Agent

# 1. Agents: LLMs with instructions + tools
agent = Agent(
    name="ImageCreation",
    model="gpt-4o-mini",
    instructions="You create educational images...",
    tools=[dalle_tool, save_library_tool]
)

# 2. Handoffs: Agent-to-agent delegation
research_agent = Agent(
    name="Research",
    model="gpt-4o-mini",
    tools=[tavily_tool],
    handoffs=[image_agent]  # Can delegate
)

# 3. Guardrails: Input/output validation
@agent.guardrail("input")
def validate_input(input_data):
    if not input_data.get("description"):
        raise ValueError("Description required")
    return input_data

# 4. Sessions: Auto conversation history
response = await agent.run(
    "Erstelle ein Bild von DNA",
    session_id="user-123-session-456"
)
```

**Key Features**:
- ✅ Lightweight (few abstractions, easy to learn)
- ✅ Built-in tracing + debugging
- ✅ Python SDK available NOW (Node.js coming Q1 2025)
- ✅ Works with OpenAI + other providers (Chat Completions API)
- ✅ Production-grade error handling

**Rationale for Migration**:
- ✅ Native OpenAI integration (simpler, faster)
- ✅ Built-in function calling and tool use
- ✅ Handoffs enable complex multi-agent workflows
- ✅ Guardrails for safety and validation
- ✅ Better fit for OpenAI-centric use cases
- ✅ Active development and support from OpenAI

**Migration Strategy** (UPDATED - Simplified):
1. **Phase 2.5** (Weeks 1-2): Testing & Bug Fixes for existing features
2. **Phase 3.0** (Weeks 3-6): OpenAI SDK setup + Router (image only)
3. **Phase 3.1** (Weeks 7-10): Image Agent (Creation + Editing with Gemini)
4. **Phase 3.2** (Weeks 11-14): Production deployment + monitoring
5. **Phase 4.0** (Weeks 11-14, PARALLEL): Calendar Integration (read-only sync)
6. **Phase 5** (Future): Research Agent, Pedagogical Agent, Multi-agent orchestration

**Backward Compatibility**:
- Keep existing `/api/langgraph/agents/execute` during migration
- Dual-path support: LangGraph (deprecated) + OpenAI SDK (new)
- Gradual traffic shift over 4 weeks
- Full LangGraph removal after 100% migration verified

---

### 3.2 System Architecture Diagram (Phase 3 MVP)

```
┌─────────────────────────────────────────────────────────────┐
│                     User Request (Chat)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │   Router Agent              │
         │   (OpenAI Agents SDK)       │
         │                             │
         │  - Intent Classification    │
         │  - Creation vs Editing?     │
         │  - Image Agent Selection    │
         └──────────┬──────────────────┘
                    │
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   ┌─────────┐           ┌─────────┐
   │ Create  │           │  Edit   │
   │  Image  │           │  Image  │
   │ (DALL-E)│           │(Gemini) │
   └────┬────┘           └────┬────┘
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
         ┌──────────────────────┐
         │  Save to Library     │
         │  + Auto-Tag          │
         └──────────┬───────────┘
                    │
                    ▼
              ┌──────────┐
              │   User   │
              └──────────┘


┌─────────────────────────────────────────────────────────────┐
│                  External Calendar Sync                      │
└─────────────────────────────────────────────────────────────┘

  Google Calendar / Outlook
         │
         ▼
  ┌─────────────┐
  │ Sync Service│  (Read-only)
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  InstantDB  │
  │ (cache only)│
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │CalendarCard │  (Home Screen)
  └─────────────┘
```

---

### 3.3 Router Agent (Image Orchestrator)

**Responsibilities** (Phase 3 MVP):
1. **Intent Classification**: Determine if user wants image creation or editing
2. **Entity Extraction**: Extract parameters (topic, subject, style, editing instructions)
3. **Agent Selection**: Route to DALL-E (creation) or Gemini (editing)
4. **Context Awareness**: Detect if editing request references existing image
5. **Response Handling**: Save result to library with auto-tagging

**Implementation**:
```typescript
// OpenAI Agents SDK - Router Agent (Phase 3 MVP)
const routerAgent = new OpenAI.Agent({
  name: "ImageRouter",
  description: "Routes image requests to creation or editing",
  instructions: `
    You are a router for educational image generation. Analyze teacher requests and:
    1. Classify intent: image_creation or image_editing
    2. Extract entities: subject, grade_level, topic, image_style, editing_instructions
    3. Route to agents:
       - NEW image needed → ImageCreationAgent (DALL-E 3)
       - EDIT existing image → ImageEditingAgent (Gemini 2.5 Flash)
    4. Context detection: Does user reference "this image", "das Bild", or previous image?
    5. Respond in German for teachers
  `,
  tools: [
    { type: "function", function: imageCreationTool },
    { type: "function", function: imageEditingTool }
  ]
});
```

**Example Routing Logic** (Phase 3 MVP):

| User Request | Detected Intent | Routed To | API |
|--------------|----------------|-----------|-----|
| "Erstelle ein Bild von DNA-Replikation" | image_creation | ImageCreation | DALL-E 3 |
| "Ändere das Bild: Füge ein Etikett hinzu" | image_editing | ImageEditing | Gemini 2.5 Flash |
| "Mache das Bild bunter" | image_editing | ImageEditing | Gemini 2.5 Flash |
| "Erstelle eine Variation im Cartoon-Stil" | image_creation | ImageCreation | DALL-E 3 |
| "Entferne den Hintergrund" | image_editing | ImageEditing | Gemini 2.5 Flash |

---

## 4. Agent Specifications

### 4.1 Image Agent (Priority P0 - Complex Workflow Example)

**Goal**: Demonstrate multi-step orchestration with creation vs. editing detection

#### Workflow Decision Tree

```
User Request about Images
         │
         ▼
    ┌────────────────┐
    │ Router Analyzes│
    │ - New creation?│
    │ - Edit existing│
    └────┬───────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
 NEW IMAGE   EDIT IMAGE
    │          │
    ▼          ▼
 DALL-E 3   Gemini 2.5
            Flash Image
    │          │
    └────┬─────┘
         │
         ▼
    Save to Library
    + Auto-Tag (Vision)
```

#### 4.1.1 Image Creation Sub-Agent (DALL-E 3)

**Use Case**: Create entirely new educational images

**Capabilities**:
- Text-to-image generation
- Educational context optimization (German prompts)
- Style control (realistic, cartoon, illustrative, abstract)
- Resolution: up to 1024x1024 (standard), 1792x1024 (wide)

**API**: OpenAI DALL-E 3
**Cost**: $0.040 per image (standard), $0.080 (HD)

**Example Request**:
```json
{
  "intent": "image_creation",
  "params": {
    "description": "Anatomischer Löwe, Seitenansicht für Biologieunterricht",
    "style": "realistic",
    "subject": "Biologie",
    "gradeLevel": "Klasse 7",
    "size": "1024x1024",
    "quality": "hd"
  }
}
```

**Implementation**:
```typescript
const imageCreationAgent = new OpenAI.Agent({
  name: "ImageCreation",
  model: "gpt-4o-mini",
  tools: [
    {
      type: "function",
      function: {
        name: "generate_image_dalle",
        description: "Generate educational images with DALL-E 3",
        parameters: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "Enhanced German educational prompt" },
            size: { type: "string", enum: ["1024x1024", "1792x1024", "1024x1792"] },
            quality: { type: "string", enum: ["standard", "hd"] }
          }
        }
      }
    }
  ]
});
```

---

#### 4.1.2 Image Editing Sub-Agent (Gemini 2.5 Flash Image "Nano Banana")

**Use Case**: Edit existing images with natural language instructions

**Capabilities**:
- **Targeted Edits**: Add, remove, or modify elements
- **Character Consistency**: Maintain consistency across edits
- **Blend Images**: Combine multiple images
- **Transformations**: Change style, color, composition
- **Educational Enhancements**: Add labels, arrows, annotations

**API**: Google Gemini 2.5 Flash Image (via Vertex AI or AI Studio)
**Cost**: $0.039 per image (paid tier) OR 100 images/day free tier
**Privacy Note**: Free tier data used for learning (recommend paid for teacher data)

**Example Request**:
```json
{
  "intent": "image_editing",
  "params": {
    "imageUrl": "https://storage.../existing-lion-anatomy.png",
    "editInstructions": "Füge deutsche Beschriftungen für Muskelgruppen hinzu",
    "subject": "Biologie",
    "gradeLevel": "Klasse 7"
  }
}
```

**Workflow**:
```typescript
const imageEditingAgent = new OpenAI.Agent({
  name: "ImageEditing",
  model: "gpt-4o-mini",
  tools: [
    {
      type: "function",
      function: {
        name: "edit_image_gemini",
        description: "Edit images with Gemini 2.5 Flash Image (Nano Banana)",
        parameters: {
          type: "object",
          properties: {
            imageUrl: { type: "string", description: "URL of image to edit" },
            editPrompt: { type: "string", description: "Natural language editing instructions in German" },
            aspectRatio: { type: "string", enum: ["1:1", "3:4", "4:3", "9:16", "16:9"] }
          }
        }
      }
    }
  ]
});

// Function implementation
async function editImageWithGemini(imageUrl: string, editPrompt: string) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image"  // "Nano Banana"
  });

  const imageParts = [
    {
      inlineData: {
        data: await fetchImageAsBase64(imageUrl),
        mimeType: "image/png"
      }
    }
  ];

  const result = await model.generateContent([
    editPrompt,
    ...imageParts
  ]);

  return result.response.candidates[0].content.parts[0].text;
}
```

---

#### 4.1.3 Image Agent Router Logic

**Decision Flow**:

```typescript
// Router determines: Creation vs. Editing
async function routeImageRequest(userMessage: string, context: any) {
  const analysis = await routerAgent.analyzeIntent(userMessage, context);

  if (analysis.intent === "image_creation") {
    // No existing image, create new
    return await imageCreationAgent.execute({
      description: analysis.params.description,
      style: analysis.params.style,
      subject: analysis.params.subject,
      gradeLevel: analysis.params.gradeLevel
    });
  }

  else if (analysis.intent === "image_editing") {
    // Has existing image (from context or upload)
    return await imageEditingAgent.execute({
      imageUrl: analysis.params.existingImageUrl,
      editInstructions: analysis.params.editInstructions,
      subject: analysis.params.subject
    });
  }

  else if (analysis.intent === "image_variation") {
    // Wants variation: Edit existing OR create similar new one
    // Router decides based on edit complexity
    if (analysis.params.editComplexity === "high") {
      // Complex edit → Use Gemini editing
      return await imageEditingAgent.execute({...});
    } else {
      // Simple variation → Create new with modified prompt
      return await imageCreationAgent.execute({...});
    }
  }
}
```

**Example Scenarios**:

| User Request | Router Decision | Agent Used | API |
|--------------|----------------|------------|-----|
| "Erstelle ein Bild von Mitose für Klasse 9" | image_creation | ImageCreation | DALL-E 3 |
| "Füge Pfeile und Labels zu diesem Bild hinzu" | image_editing | ImageEditing | Gemini 2.5 Flash |
| "Mache das Bild bunter und kinderfreundlicher" | image_editing | ImageEditing | Gemini 2.5 Flash |
| "Erstelle eine Variation dieses Bildes im Cartoon-Stil" | image_variation → creation | ImageCreation | DALL-E 3 |
| "Entferne den Hintergrund von diesem Bild" | image_editing | ImageEditing | Gemini 2.5 Flash |

---

## 5. Phase 4: External Calendar Integration

### 5.1 Overview

**Current Problem**: CalendarCard shows hardcoded mock data (lines 61-64 in `CalendarCard.tsx`)

**Solution**: Read-only sync from external calendars (Google Calendar, Outlook)

**Scope**:
- ✅ Sync calendar events FROM external calendar
- ✅ Display real events in CalendarCard (Home screen)
- ✅ Cache in InstantDB for offline/performance
- ❌ NO internal calendar management (no CRUD UI)
- ❌ NO manual event creation in app
- ❌ NO editing in app

**Future (Phase 6)**: Two-way sync, internal calendar management

---

### 5.2 Calendar Sync Architecture

**Option A: Google Calendar API** (Recommended)
```typescript
// OAuth2 flow for teacher authentication
// Read-only scope: calendar.readonly
// Periodic sync: Every 30 minutes

interface CalendarSyncService {
  // Authenticate with Google
  authenticateGoogle(userId: string): Promise<string>; // Returns auth token

  // Sync events (read-only)
  syncCalendarEvents(userId: string, authToken: string): Promise<CalendarEvent[]>;

  // Store in InstantDB cache
  cacheEvents(events: CalendarEvent[]): Promise<void>;

  // Fetch from cache for UI
  getCachedEvents(userId: string, date: string): Promise<CalendarEvent[]>;
}
```

**Option B: Microsoft Graph API** (Outlook/Office 365)
- Similar OAuth2 flow
- `Calendars.Read` permission
- Integration for schools using Office 365

**Option C: iCal/CalDAV** (Universal fallback)
- Works with any calendar provider
- Less features but more compatible

---

### 5.3 Implementation Stories

#### **Story 4.0.1: Google Calendar OAuth Integration**
**Goal**: Teachers can connect their Google Calendar

**Requirements**:
- OAuth2 consent screen setup (Google Cloud Console)
- Scopes: `https://www.googleapis.com/auth/calendar.readonly`
- Store auth tokens securely in InstantDB
- Handle token refresh (60-day expiry)

**UI**:
- Profile page: "Kalender verbinden" button
- Google OAuth popup → Grant permissions
- Success: "Google Calendar verbunden ✓"

**Acceptance Criteria**:
- ✅ Teacher can authenticate with Google
- ✅ Auth token stored securely
- ✅ Token auto-refreshes before expiry
- ✅ Error handling for auth failures

---

#### **Story 4.0.2: Calendar Sync Service**
**Goal**: Fetch events from Google Calendar and cache in InstantDB

**Sync Logic**:
```typescript
// Sync every 30 minutes (background job)
async function syncCalendar(userId: string) {
  // 1. Get auth token
  const token = await getAuthToken(userId);

  // 2. Fetch events from Google Calendar API
  const events = await googleCalendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    timeMax: addDays(new Date(), 30).toISOString(), // Next 30 days
    singleEvents: true,
    orderBy: 'startTime'
  });

  // 3. Transform to our schema
  const transformedEvents = events.items.map(event => ({
    id: event.id,
    userId: userId,
    date: format(event.start.dateTime, 'yyyy-MM-dd'),
    time: format(event.start.dateTime, 'HH:mm'),
    class: extractClassName(event.summary), // Parse from title
    subject: extractSubject(event.summary),
    duration: calculateDuration(event.start, event.end),
    location: event.location || '',
    notes: event.description || '',
    externalId: event.id,
    source: 'google_calendar'
  }));

  // 4. Upsert to InstantDB (cache)
  await db.calendar_events.upsert(transformedEvents);
}
```

**InstantDB Schema**:
```typescript
// instant.schema.ts
calendar_events: entity({
  id: string(),
  userId: string(),
  date: string(),
  time: string(),
  class: string(),
  subject: string(),
  duration: number(),
  location: string(),
  notes: string(),
  externalId: string(),    // Google Calendar event ID
  source: string(),        // "google_calendar", "outlook", etc.
  syncedAt: date(),
  createdAt: date()
}),

calendar_connections: entity({
  id: string(),
  userId: string(),
  provider: string(),      // "google", "outlook"
  accessToken: string(),   // Encrypted
  refreshToken: string(),  // Encrypted
  expiresAt: date(),
  lastSyncAt: date(),
  createdAt: date()
})
```

**Acceptance Criteria**:
- ✅ Background sync runs every 30 minutes
- ✅ Events cached in InstantDB
- ✅ Next 30 days of events synced
- ✅ Duplicate prevention (upsert by externalId)
- ✅ Sync status visible in Profile

---

#### **Story 4.0.3: Update CalendarCard to Use Real Data**
**Goal**: Replace mock data with synced calendar events

**Before** (lines 61-64 in CalendarCard.tsx):
```typescript
const displayEvents = events || [
  { id: '1', time: '08:30', class: 'Klasse 8a', subject: 'Mathematik' },
  { id: '2', time: '10:15', class: 'Klasse 10c', subject: 'Englisch' }
];
```

**After**:
```typescript
const { data: calendarEvents, isLoading } = useQuery({
  calendar_events: {
    $: {
      where: {
        userId: user?.id,
        date: format(new Date(), 'yyyy-MM-dd')
      },
      order: { time: 'asc' }
    }
  }
});

const displayEvents = calendarEvents?.calendar_events || [];
```

**UI Enhancements**:
- Loading spinner while syncing
- "Zuletzt aktualisiert: vor 5 Minuten"
- Empty state: "Keine Termine heute" (if no events)
- Error state: "Kalender nicht verbunden" → Link to Profile

**Acceptance Criteria**:
- ✅ CalendarCard shows real synced events
- ✅ Today's events displayed by default
- ✅ Loading state shown
- ✅ Empty state when no events
- ✅ E2E test: Connect calendar → See events on Home

---

#### **Story 4.0.4: Calendar Management in Profile** (Optional P1)
**Goal**: View/manage calendar connection in Profile page

**UI Components**:
1. **Connection Status**
   - "Google Calendar verbunden ✓" or "Kalender nicht verbunden"
   - Last sync time: "Zuletzt synchronisiert: vor 12 Minuten"
   - Manual sync button: "Jetzt synchronisieren"

2. **Event Preview**
   - Show next 7 days of events
   - Read-only view (no editing)

3. **Settings**
   - Disconnect calendar button
   - Sync frequency (30 min, 1 hour, manual)

**Acceptance Criteria**:
- ✅ Profile shows calendar connection status
- ✅ Manual sync button works
- ✅ Can disconnect calendar
- ✅ Event preview shows upcoming events

---

### 5.4 Timeline (Parallel with Phase 3)

| Week | Story | Deliverable |
|------|-------|-------------|
| **15** | 4.0.1 | Google OAuth integration |
| **16** | 4.0.2 | Calendar sync service + InstantDB cache |
| **17** | 4.0.3 | CalendarCard uses real data |
| **18** | 4.0.4 | Profile calendar management (optional) |

**Works in parallel with**:
- Week 15-16: Epic 3.4 (Multi-agent orchestration)
- Week 17-18: Epic 3.5 (Production deployment)

---

### 5.5 Cost & Complexity

**Google Calendar API**:
- **Cost**: FREE (generous quota: 1M requests/day)
- **Complexity**: Medium (OAuth2, token management)
- **Maintenance**: Low (well-documented API)

**InstantDB Storage**:
- **Cost**: FREE (within existing tier)
- **Storage**: ~1 KB per event × 30 days × 1000 users = ~30 MB (negligible)

**Development Time**: 4 weeks (parallel with Phase 3 wrap-up)

---

## 6. Phase 5: Future Agents (NOT in Phase 3 MVP)

### 6.1 Research Agent (Future)

**Goal**: Provide teachers with curated, up-to-date educational research and resources

#### Capabilities
- Web search for educational content
- Academic paper retrieval
- Current events and trends
- Source citation and verification
- Summarization for teacher consumption

#### API Integration Options

| Provider | Strengths | Cost | Recommendation |
|----------|-----------|------|----------------|
| **Tavily** | Built for AI agents, structured results | $5/1000 searches | ✅ **Primary** |
| **Perplexity API** | Academic focus, citations | Pay-per-use | ✅ **Secondary** |
| Brave Search | Privacy-focused, no tracking | Free tier limited | ⚠️ Backup |
| SerpAPI | Google search results | $50/5000 searches | ❌ Too expensive |

**Recommended**: **Tavily API** (Primary) + **Perplexity** (Academic fallback)

#### Implementation

```typescript
const researchAgent = new OpenAI.Agent({
  name: "Research",
  model: "gpt-4o-mini",
  instructions: `
    You are a research assistant for teachers. When given a topic:
    1. Search for high-quality educational resources using Tavily API
    2. Prioritize: peer-reviewed research, government education sites, trusted publishers
    3. Summarize findings in German
    4. Provide citations in APA format
    5. Extract key takeaways for classroom application
  `,
  tools: [
    {
      type: "function",
      function: {
        name: "search_educational_resources",
        description: "Search web for educational content with Tavily",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            domains: {
              type: "array",
              items: { type: "string" },
              description: "Trusted educational domains to prioritize"
            },
            maxResults: { type: "number", default: 5 }
          }
        }
      }
    }
  ]
});

// Tavily integration
async function searchEducationalResources(query: string, domains?: string[]) {
  const tvly = new TavilyClient({ apiKey: process.env.TAVILY_API_KEY });

  const response = await tvly.search(query, {
    searchDepth: "advanced",
    includeDomains: domains || [
      "*.edu",
      "scholar.google.com",
      "eric.ed.gov",
      "*.gov",
      "bildungsserver.de"
    ],
    maxResults: 5
  });

  return response.results.map(r => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
    score: r.score
  }));
}
```

**Example Query**:
```json
{
  "intent": "research",
  "params": {
    "topic": "Gamification im Mathematikunterricht",
    "focusArea": "Empirische Studien zu Lernerfolg",
    "gradeLevel": "Sekundarstufe I",
    "language": "German preferred, English acceptable"
  }
}
```

**Expected Output**:
```markdown
## Recherche: Gamification im Mathematikunterricht

### Zusammenfassung
Gamification zeigt nachweislich positive Effekte auf Motivation und Lernerfolg...

### Wichtige Studien
1. **"Game-Based Learning in Mathematics" (2024)**
   - Quelle: Journal of Educational Psychology
   - Ergebnis: +15% Verbesserung in Problemlösungskompetenz
   - Link: https://...

2. **"Spielelemente im Matheunterricht" (2023)**
   - Quelle: Bildungsserver Deutschland
   - Praxisbeispiele für Klasse 7-9
   - Link: https://...

### Empfehlungen für die Praxis
- Punktesysteme für Aufgaben-Challenges
- Level-basierte Progression im Curriculum
- Peer-Wettbewerbe zur Motivation

### Quellen
[5 zitierte Quellen in APA-Format]
```

---

### 4.3 Pedagogical Knowledge Agent (Priority P1)

**Goal**: Provide expert didactic and pedagogical guidance using a curated knowledge base

#### Knowledge Base Architecture

**Vector Database**: Pinecone (recommended) or Weaviate

**Data Sources** (Option A: Curated Database):
1. **Didactic Frameworks**
   - Bloom's Taxonomy (German)
   - Constructivist learning theory
   - Differentiation strategies

2. **Subject-Specific Pedagogy**
   - Math didactics (Montessori, Dienes blocks)
   - Science inquiry methods
   - Language teaching approaches

3. **German Curriculum Standards**
   - Bildungsstandards by subject
   - Lehrpläne for each state

4. **Educational Research Summaries**
   - Meta-analyses of teaching methods
   - Evidence-based practices

**Initial Data Loading**:
```typescript
// Vector DB schema
interface PedagogicalKnowledgeEntry {
  id: string;
  title: string;
  content: string;          // Main pedagogical text
  subject: string;          // Math, Science, Language, etc.
  topic: string;            // Specific topic (e.g., "Bruchrechnen")
  gradeLevel: string[];     // ["Klasse 5", "Klasse 6"]
  didacticApproach: string; // "Konstruktivismus", "Inquiry-based", etc.
  embedding: number[];      // Vector embedding for semantic search
  sources: string[];        // Citations
}

// Example entry
{
  id: "ped-001",
  title: "Didaktischer Ansatz: Bruchrechnen mit Montessori-Material",
  content: `
    Bruchrechnen kann durch konkrete Materialien (Bruchkreise,
    Cuisenaire-Stäbe) visualisiert werden. Montessori-Ansatz:
    1. Konkrete Manipulation vor symbolischer Darstellung
    2. Selbstentdeckendes Lernen durch Material
    3. Progression: Ganzes → Hälften → Viertel → komplexere Brüche
    ...
  `,
  subject: "Mathematik",
  topic: "Bruchrechnen",
  gradeLevel: ["Klasse 5", "Klasse 6"],
  didacticApproach: "Montessori",
  embedding: [0.234, -0.123, ...],  // Generated via OpenAI embeddings
  sources: ["Montessori Math Manual (2021)", "Bildungsserver.de"]
}
```

#### Implementation (RAG Pattern)

```typescript
const pedagogicalAgent = new OpenAI.Agent({
  name: "PedagogicalKnowledge",
  model: "gpt-4o-mini",
  instructions: `
    You are a pedagogical expert for German teachers. When asked:
    1. Use knowledge base (vector DB) to find relevant didactic approaches
    2. Provide evidence-based recommendations
    3. Tailor advice to grade level and subject
    4. Cite sources from knowledge base
    5. Respond in professional German for educators
  `,
  tools: [
    {
      type: "function",
      function: {
        name: "search_pedagogical_knowledge",
        description: "Search vector DB for didactic guidance",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            subject: { type: "string" },
            gradeLevel: { type: "string" },
            maxResults: { type: "number", default: 3 }
          }
        }
      }
    }
  ]
});

// RAG implementation
async function searchPedagogicalKnowledge(
  query: string,
  subject: string,
  gradeLevel: string
) {
  // 1. Generate query embedding
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  // 2. Query Pinecone
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.index("pedagogical-knowledge");

  const results = await index.query({
    vector: queryEmbedding,
    topK: 3,
    filter: {
      subject: { $eq: subject },
      gradeLevel: { $in: [gradeLevel] }
    },
    includeMetadata: true
  });

  // 3. Return relevant knowledge
  return results.matches.map(match => ({
    title: match.metadata.title,
    content: match.metadata.content,
    didacticApproach: match.metadata.didacticApproach,
    sources: match.metadata.sources,
    relevanceScore: match.score
  }));
}
```

**Example Query**:
```json
{
  "intent": "pedagogical_question",
  "params": {
    "question": "Wie unterrichte ich Bruchrechnen für Klasse 5 mit unterschiedlichen Leistungsniveaus?",
    "subject": "Mathematik",
    "gradeLevel": "Klasse 5",
    "context": "Heterogene Lerngruppe"
  }
}
```

**Expected Output**:
```markdown
## Didaktische Empfehlung: Bruchrechnen Klasse 5 (Differenzierung)

### Ansatz: Dreistufige Differenzierung mit Montessori-Material

**Für schwächere Lerner**:
- Start mit konkretem Material (Bruchkreise, Pizza-Modell)
- Fokus auf Hälften und Viertel
- Viel Zeit für Manipulation und Exploration

**Für mittleres Niveau**:
- Kombination Material + bildliche Darstellung
- Einführung Bruchstreifen für Vergleiche
- Erste symbolische Notation

**Für stärkere Lerner**:
- Challenge: Brüche selbst darstellen ohne Vorlage
- Äquivalente Brüche entdecken
- Transfer auf Dezimalzahlen

### Quellen
- Montessori Math Manual (2021)
- Bildungsstandards Mathematik Primarstufe
- "Differenzierung im Mathematikunterricht" (2023)
```

---

## 5. Infrastructure & Integration

### 5.1 Vector Database (Pedagogical Knowledge)

**CRITICAL DECISION**: InstantDB does NOT support vector embeddings or semantic search.

**Recommendation**: **OpenAI Vector Store** (via Assistants API)

**Why OpenAI Vector Store?**
- ✅ **Native Integration**: Already using OpenAI for GPT-4, DALL-E, embeddings
- ✅ **Simpler Architecture**: No separate service to manage
- ✅ **Built-in RAG**: Assistants API has `file_search` tool
- ✅ **Easy Data Upload**: File-based upload (no manual embedding loop)
- ✅ **One Billing Source**: Consolidated OpenAI invoice
- ✅ **Free Tier**: 1 GB storage included with OpenAI account

**Why Not Pinecone?**
- ⚠️ Separate service (extra API keys, billing)
- ⚠️ Manual embedding pipeline required
- ⚠️ More complexity for similar functionality
- ℹ️ Can migrate to Pinecone later if needed (not locked in)

**Architecture**:
```
┌─────────────────────────────────────────────┐
│ Data Layer                                  │
├─────────────────────────────────────────────┤
│                                             │
│  InstantDB              OpenAI Vector Store │
│  ─────────────────────  ───────────────     │
│  • chat_sessions        • pedagogical       │
│  • messages             • knowledge base    │
│  • library_materials    • embeddings        │
│  • users                • semantic search   │
│  • auth                 • RAG (file_search) │
│                                             │
│  Purpose: Real-time     Purpose: Semantic,  │
│  app data               Knowledge retrieval │
└─────────────────────────────────────────────┘
```

**Setup**:
```bash
# Install OpenAI SDK (already installed)
npm install openai

# No additional service setup needed!
```

**Data Loading Pipeline**:
```typescript
// scripts/load-pedagogical-knowledge.ts
import OpenAI from 'openai';
import fs from 'fs';

async function loadKnowledgeBase() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // 1. Create vector store
  const vectorStore = await openai.beta.vectorStores.create({
    name: "Pedagogical Knowledge Base"
  });

  // 2. Upload knowledge files (simple!)
  const files = [
    'data/pedagogical/math-didactics.txt',
    'data/pedagogical/science-inquiry.txt',
    'data/pedagogical/differentiation-strategies.txt',
    // ... more files
  ];

  await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {
    files: files.map(f => fs.createReadStream(f))
  });

  console.log(`Vector store created: ${vectorStore.id}`);
  return vectorStore.id;
}
```

**Pedagogical Assistant Integration**:
```typescript
// Using Assistants API with built-in vector store
const pedagogicalAssistant = await openai.beta.assistants.create({
  name: "PedagogicalKnowledge",
  model: "gpt-4o-mini",
  instructions: `
    You are a pedagogical expert for German teachers.
    Use the knowledge base to provide evidence-based recommendations.
  `,
  tools: [{ type: "file_search" }],  // Built-in RAG!
  tool_resources: {
    file_search: {
      vector_store_ids: [vectorStoreId]
    }
  }
});
```

**Initial Knowledge Base Size**:
- **Target**: 500-1000 entries (as text files)
- **Subjects**: Math, Science, German, English, Social Studies
- **Coverage**: Grades 1-13 (Grundschule + Sekundarstufe I + II)
- **Format**: .txt or .md files (1 topic per file)

**Costs**:
- OpenAI Vector Store: **1 GB free** (sufficient for 10,000+ documents)
- Storage beyond 1 GB: $0.10/GB/day
- Search queries: $0.10 per 1,000 queries
- **Estimated**: $10-20/month for typical usage

---

### 5.2 API Integrations Summary

| Service | Purpose | Cost (Monthly Estimate) | Priority |
|---------|---------|------------------------|----------|
| **OpenAI Agents SDK** | Router + Image agent | $30-50 | P0 |
| **DALL-E 3** | Image creation | $20 (500 images) | P0 |
| **Gemini 2.5 Flash Image** | Image editing | **FREE** (3000 images/month) | P0 |
| **Google Calendar API** | Calendar sync | **FREE** (1M requests/day) | P0 |
| **InstantDB** | Database + storage | Existing (no additional cost) | P0 |

**Total Estimated Cost**: ~$50-70/month (Phase 3 MVP)

**Significant Cost Reduction**:
- ❌ No Tavily ($10/month saved)
- ❌ No OpenAI Vector Store ($10-20/month saved)
- ❌ No Research agent API costs
- ✅ Gemini free tier (100 edits/day)
- ✅ Google Calendar free tier

---

## 7. Phase 2.5: Testing & Bug Fixes (CRITICAL - Before Phase 3)

### Overview

**Problem**: Before building new features (Phase 3), we need to ensure **existing features** (Phase 1-2) work correctly.

**Goal**: Comprehensive testing + bug fixing for all features developed to date.

---

### 7.1 Testing Scope

#### Features to Test (Phase 1-2):

1. **Authentication** (InstantDB)
   - Magic link email login
   - Session persistence
   - Logout functionality

2. **Chat Interface** (LangGraph + GPT-4)
   - Text message send/receive
   - Image upload + analysis (GPT-4 Vision)
   - Message persistence
   - Real-time updates

3. **Library** (US2 - Library Navigation)
   - Filter by content type
   - Search functionality
   - Material details view
   - Image preview

4. **Image Generation** (US5 - DALL-E 3)
   - Text-to-image generation
   - Prompt enhancement
   - Save to library
   - Agent confirmation modal

5. **Home Screen**
   - CalendarCard (currently mock data)
   - Navigation
   - User profile

---

### 7.2 Epic 2.5: Comprehensive Testing & Bug Fixes (Weeks 1-2)

#### **Story 2.5.1: Test Coverage Analysis** (Day 1-2)
**Goal**: Map all existing features to test coverage

**Tasks**:
1. List all user stories from Phase 1-2
2. Identify which have E2E tests
3. Identify which have NO tests
4. Create test coverage report

**Deliverables**:
- Test coverage matrix (feature → test status)
- List of untested features
- Priority list (P0 features without tests)

---

#### **Story 2.5.2: E2E Test Suite Execution** (Day 3-4)
**Goal**: Run ALL existing Playwright tests + document failures

**Tasks**:
```bash
# Run full E2E suite
npx playwright test

# Run specific test suites
npx playwright test e2e-tests/image-generation-complete-workflow.spec.ts
npx playwright test e2e-tests/library-navigation.spec.ts
npx playwright test e2e-tests/chat-functionality.spec.ts
```

**Document**:
- ✅ Passing tests (screenshot proof)
- ❌ Failing tests (failure logs)
- ⚠️ Flaky tests (intermittent failures)
- 🔴 Missing tests (no test file exists)

**Deliverables**:
- Test execution report (docs/testing/test-reports/2025-10-17/phase-2-test-report.md)
- Screenshots of all test runs
- Prioritized bug list

---

#### **Story 2.5.3: Manual Testing (User Stories Verification)** (Day 5-6)
**Goal**: Manually verify each user story acceptance criteria

**Process**:
1. Open each user story (docs/stories/)
2. Follow acceptance criteria step-by-step
3. Test in browser (Desktop Chrome + Mobile Safari)
4. Document pass/fail with screenshots

**Test Matrix**:
| User Story | Feature | Status | Issues Found |
|------------|---------|--------|--------------|
| US1 | Authentication | ⚠️ | Session timeout too short |
| US2 | Library Navigation | ✅ | Working |
| US3 | Chat Interface | ❌ | Image upload fails on mobile |
| US4 | Agent Confirmation | ⚠️ | Modal doesn't dismiss |
| US5 | Image Generation | ✅ | Working |

**Deliverables**:
- Manual test report with screenshots
- Bug tickets for each issue
- Priority classification (P0, P1, P2)

---

#### **Story 2.5.4: Bug Fixing Sprint** (Day 7-10)
**Goal**: Fix all P0 and P1 bugs found in testing

**Process**:
1. Create story for each bug
2. Fix + add regression test
3. Verify fix with QA review
4. Document in session log

**Acceptance Criteria**:
- ✅ ALL P0 bugs fixed
- ✅ 90% of P1 bugs fixed
- ✅ Regression tests added
- ✅ Full E2E suite passing (100%)

**Deliverables**:
- Bug fix commits
- Updated E2E tests
- Clean test run (all green)

---

### 7.3 Testing Tools & Commands

```bash
# Frontend E2E Tests
cd teacher-assistant/frontend
npx playwright test                    # Run all tests
npx playwright test --headed           # Watch tests run
npx playwright test --debug            # Debug mode
npx playwright test --project="Mobile Safari"  # Mobile tests

# Type Checking
npm run type-check                     # TypeScript validation

# Linting
npm run lint                           # ESLint

# Build Verification
npm run build                          # Production build (0 errors)

# Backend Tests (if any)
cd teacher-assistant/backend
npm test                               # Unit tests
```

---

### 7.4 Success Criteria (Phase 2.5 Complete)

**Phase 2.5 is ONLY complete when**:
- ✅ Test coverage ≥ 80% for P0 features
- ✅ ALL E2E tests passing (100%)
- ✅ ALL P0 bugs fixed
- ✅ ≥ 90% P1 bugs fixed
- ✅ Build clean (0 TypeScript errors)
- ✅ Manual testing complete (all user stories verified)
- ✅ Documentation updated (test reports, bug fixes)

**ONLY THEN** can we start Phase 3 (OpenAI SDK migration)

---

## 8. Implementation Plan (Phase 3 MVP)

### Epic Breakdown (Simplified Scope)

#### **Epic 3.0: Foundation & Migration** (Weeks 1-4)
- **Story 3.0.1**: OpenAI Agents SDK setup + authentication
- **Story 3.0.2**: Router Agent implementation (image intent classification only)
- **Story 3.0.3**: Migrate existing DALL-E image agent to OpenAI SDK
- **Story 3.0.4**: Dual-path support (LangGraph deprecated, OpenAI SDK active)
- **Story 3.0.5**: E2E tests for router + basic image agent

**Deliverables**:
- ✅ OpenAI SDK integrated
- ✅ Router agent routes to image creation
- ✅ Existing functionality migrated
- ✅ Tests passing

---

#### **Epic 3.1: Image Agent - Creation + Editing** (Weeks 5-8)
- **Story 3.1.1**: Google AI Studio setup + Gemini API integration
- **Story 3.1.2**: Image Editing Sub-Agent (Gemini 2.5 Flash)
- **Story 3.1.3**: Router logic: Creation vs. Editing detection
- **Story 3.1.4**: Image workflow E2E tests (creation + editing)
- **Story 3.1.5**: Cost optimization (Gemini free tier management)

**Deliverables**:
- ✅ Teachers can edit images with natural language
- ✅ Router auto-detects creation vs. editing
- ✅ Gemini integration working
- ✅ 100 free edits/day budget monitored

---

#### **Epic 3.2: Production Deployment** (Weeks 9-12)
- **Story 3.2.1**: LangGraph deprecation (remove old code)
- **Story 3.2.2**: Production monitoring + logging
- **Story 3.2.3**: Cost tracking dashboard
- **Story 3.2.4**: Error handling + fallback strategies
- **Story 3.2.5**: Documentation + handoff

**Deliverables**:
- ✅ 100% traffic on OpenAI SDK
- ✅ LangGraph removed
- ✅ Monitoring in place
- ✅ Production-ready Phase 3 system

---

#### **Epic 4.0: External Calendar Sync** (Weeks 9-12, PARALLEL)
*Runs in parallel with Epic 3.2*

- **Story 4.0.1**: Google Calendar OAuth integration (Week 9)
- **Story 4.0.2**: Calendar sync service + InstantDB cache (Week 10)
- **Story 4.0.3**: Update CalendarCard to use real data (Week 11)
- **Story 4.0.4**: Profile calendar connection UI (Week 12)

**Deliverables**:
- ✅ Teachers can connect Google Calendar
- ✅ Real events displayed on Home screen
- ✅ Read-only sync (no internal CRUD)
- ✅ Background sync every 30 minutes

---

### Combined Timeline

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 3 MVP: 12 WEEKS TOTAL                            │
└─────────────────────────────────────────────────────────┘

Weeks 1-4:   Epic 3.0 (Foundation & Migration)
             - OpenAI SDK setup
             - Router for image agent
             - Migrate existing DALL-E agent

Weeks 5-8:   Epic 3.1 (Image Agent - Creation + Editing)
             - Gemini 2.5 Flash integration
             - Edit detection logic
             - E2E tests

Weeks 9-12:  ┌──────────────────────────────────────┐
             │ Epic 3.2 (Production Deployment)     │
             │ - Remove LangGraph                   │
             │ - Monitoring & logging               │
             └──────────────────────────────────────┘
                             ║
             ┌───────────────║──────────────────────┐
             │ Epic 4.0 (Calendar Sync) PARALLEL   │
             │ - Google OAuth                       │
             │ - Read-only sync                     │
             │ - CalendarCard displays real data    │
             └──────────────────────────────────────┘

Week 13:     🚀 LAUNCH: Image Agent + Calendar
```

---

### What's NOT in Phase 3 MVP (Moved to Phase 5)

❌ **Research Agent** (Tavily integration)
❌ **Pedagogical Knowledge Agent** (OpenAI Vector Store)
❌ **Multi-Agent Orchestration** (multiple agents working together)
❌ **Internal Calendar Management** (CRUD UI in Profile)
❌ **Two-way Calendar Sync** (write back to Google Calendar)

**Rationale**: Start with image editing (highest user demand) + basic calendar display. Validate before building complex multi-agent system.

---

## 7. Success Metrics & KPIs

### Phase 3 Launch Criteria (All MUST Pass)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Router Accuracy** | ≥ 90% correct routing | Manual review of 100 requests |
| **Image Agent Success Rate** | ≥ 95% | (Successful generations + edits) / Total requests |
| **Research Quality** | ≥ 4.5/5 user rating | User feedback survey |
| **Pedagogical Relevance** | ≥ 4.5/5 user rating | Teacher feedback on advice quality |
| **Multi-Agent Orchestration** | ≥ 80% success | Complex workflows complete end-to-end |
| **Response Time** | < 15s median | From request to final response |
| **API Cost per User** | < $2/month | OpenAI + Gemini + Tavily combined |
| **Zero Critical Bugs** | 0 P0 bugs | QA verification |

### Post-Launch Metrics (30 days)

- **Adoption**: ≥ 60% of active teachers use multi-agent features
- **Retention**: ≥ 75% return within 7 days
- **Time Savings**: ≥ 30% reduction in task completion time (self-reported)
- **Feature Mix**: Image (40%), Research (30%), Pedagogical (20%), Multi-agent (10%)

---

## 8. Risks & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **OpenAI SDK migration breaks existing functionality** | HIGH | MEDIUM | Dual-path support, gradual rollout, extensive E2E tests |
| **Gemini free tier exhausted (> 100 images/day)** | MEDIUM | HIGH | Monitor usage, automatic fallback to DALL-E, upgrade to paid if needed |
| **Router misclassifies intent frequently** | HIGH | MEDIUM | Extensive training data, user feedback loop, manual override option |
| **Vector DB costs exceed budget** | MEDIUM | LOW | Start with Pinecone free tier, optimize embeddings, lazy loading |
| **Tavily API rate limits** | MEDIUM | MEDIUM | Cache results, batch requests, fallback to Perplexity |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Teachers don't adopt multi-agent features** | HIGH | LOW | User onboarding, clear value communication, progressive disclosure |
| **API costs spiral out of control** | HIGH | MEDIUM | Cost dashboard, usage limits per user, alerts at 80% budget |
| **Pedagogical knowledge base incomplete** | MEDIUM | MEDIUM | Prioritize high-demand subjects first, user-submitted content later |
| **Gemini API changes pricing/terms** | MEDIUM | LOW | Contract review, budget buffer, fallback to GPT-4 Vision |

---

## 9. Dependencies & Assumptions

### External Dependencies
- OpenAI Agents SDK availability (GA: Q4 2024)
- Google Gemini 2.5 Flash Image API access (Available now)
- Tavily API reliability (99.9% uptime SLA)
- Pinecone free tier limits (100K vectors sufficient for MVP)

### Assumptions
- Teachers have basic understanding of AI capabilities
- Network connectivity sufficient for API calls (< 500ms latency)
- German educational content available for knowledge base
- User consent for image processing with Gemini

### Blockers
- **If OpenAI Agents SDK delayed**: Extend LangGraph usage temporarily
- **If Gemini free tier removed**: Switch to paid tier ($30/month acceptable)
- **If Tavily unavailable**: Fallback to Perplexity or Brave

---

## 10. Phase 4: Calendar Integration (Weeks 19-22)

### Epic 4.0: Teacher Schedule Management

**Current State**:
- Home screen shows CalendarCard with **mock data** (lines 61-64 in `CalendarCard.tsx`)
- No real calendar integration
- No profile management for schedule

**Target State**:
- Real calendar data from InstantDB
- Profile page with schedule management (add/edit/delete events)
- Optional: External calendar sync (Google Calendar, Outlook)
- AI-powered schedule suggestions

---

### 4.1 Feature Specifications

#### **Story 4.0.1: InstantDB Calendar Schema**
```typescript
// instant.schema.ts - Add calendar_events entity
calendar_events: entity({
  id: string(),
  userId: string(),        // FK to users
  date: string(),          // ISO date: "2025-10-17"
  time: string(),          // "08:30"
  class: string(),         // "Klasse 8a"
  subject: string(),       // "Mathematik"
  duration: number(),      // Minutes (default: 45)
  location: string(),      // "Raum 204"
  notes: string(),         // Optional notes
  createdAt: date(),
  updatedAt: date()
}),
```

**Acceptance Criteria**:
- ✅ Schema pushed to InstantDB
- ✅ Queries work for fetching user events
- ✅ Mutations work (create/update/delete)

---

#### **Story 4.0.2: Replace Mock Data in CalendarCard**
Update `CalendarCard.tsx` to fetch real data from InstantDB instead of mock data.

```typescript
// Before (lines 61-64): Mock data
const displayEvents = events || [
  { id: '1', time: '08:30', class: 'Klasse 8a', subject: 'Mathematik' },
  { id: '2', time: '10:15', class: 'Klasse 10c', subject: 'Englisch' }
];

// After: Real data from InstantDB
const { data, isLoading } = useQuery({
  calendar_events: {
    $: {
      where: {
        userId: user?.id,
        date: format(new Date(), 'yyyy-MM-dd')
      },
      order: { time: 'asc' }
    }
  }
});
```

**Acceptance Criteria**:
- ✅ CalendarCard fetches real events from InstantDB
- ✅ Shows today's events by default
- ✅ Loading state displayed while fetching
- ✅ Empty state when no events
- ✅ E2E test: Create event → Appears on Home screen

---

#### **Story 4.0.3: Profile - Schedule Management UI**
Add "Mein Stundenplan" section to Profile page.

**UI Requirements**:
- Weekly calendar view (Monday-Friday)
- List view option (all events chronologically)
- Add Event button → Modal form
- Edit/Delete actions per event
- Recurring events support (optional P2)

**Form Fields**:
- Date (date picker)
- Time (time picker)
- Class/Grade (text input with suggestions)
- Subject (dropdown: Math, Science, German, English, etc.)
- Duration (dropdown: 30, 45, 60, 90 minutes)
- Location (text input)
- Notes (textarea, optional)

**Acceptance Criteria**:
- ✅ Profile page shows "Mein Stundenplan" section
- ✅ Can create new event via form
- ✅ Can edit existing event
- ✅ Can delete event (with confirmation)
- ✅ Events persist to InstantDB
- ✅ Changes reflect immediately on Home screen
- ✅ E2E test: Full CRUD workflow

---

#### **Story 4.0.4: AI-Powered Schedule Suggestions** (Optional P1)
Use chat agents to suggest schedule optimizations.

**Example**:
```
Teacher: "Ich habe Montag zu viele Mathestunden hintereinander"
Agent: "Ich sehe 3 Mathestunden am Montag (08:30, 10:15, 13:00).
       Vorschlag: Verschiebe 13:00 Mathe auf Dienstag 10:15?
       Möchtest du diese Änderung übernehmen?"
```

**Acceptance Criteria**:
- ✅ Agent can read calendar_events from InstantDB
- ✅ Agent suggests schedule improvements
- ✅ User can accept/reject suggestions
- ✅ Accepted suggestions update calendar

---

#### **Story 4.0.5: External Calendar Sync** (Optional P2)
Integrate with Google Calendar or Outlook.

**Options**:
- **Google Calendar API**: OAuth2, two-way sync
- **Outlook Calendar API**: Microsoft Graph API
- **iCal Export/Import**: Simple file-based sync

**Recommendation**: Start with **iCal export** (simplest), add two-way sync later.

**Acceptance Criteria**:
- ✅ Export schedule as .ics file
- ✅ Import .ics file to InstantDB
- ✅ (P2) Two-way sync with Google Calendar

---

### 4.2 Timeline

| Week | Story | Deliverable |
|------|-------|-------------|
| **19** | 4.0.1 | InstantDB schema + CRUD operations |
| **20** | 4.0.2 | CalendarCard uses real data |
| **21** | 4.0.3 | Profile schedule management UI |
| **22** | 4.0.4 | AI schedule suggestions (optional) |
| **TBD** | 4.0.5 | External calendar sync (P2) |

---

### 4.3 Timeline: ✅ Parallel Track (Option B)

**Decision**: Calendar integration runs **in parallel** with Phase 3 wrap-up.

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 3 + 4 COMBINED TIMELINE (19 weeks)               │
└─────────────────────────────────────────────────────────┘

Weeks 1-4:   Epic 3.0 (Foundation & Migration)
Weeks 5-8:   Epic 3.1 (Image Agent Ecosystem)
Weeks 9-10:  Epic 3.2 (Research Agent)
Weeks 11-14: Epic 3.3 (Pedagogical Knowledge Agent)
             ┌──────────────────────────────────┐
Weeks 15-16: │ Epic 3.4 (Multi-Agent)          │ ← Phase 3
Weeks 17-18: │ Epic 3.5 (Production Deploy)    │
             └──────────────────────────────────┘
                      ║
             ┌────────║───────────────────────┐
Weeks 15-16: │ Story 4.0.1-4.0.2 (Schema +    │ ← Phase 4
Weeks 17-18: │ Story 4.0.3-4.0.4 (Profile UI) │   (Parallel)
             └────────────────────────────────┘
                      ║
Week 19:     🚀 LAUNCH: Multi-Agent + Calendar Together
```

**Why Parallel?**
- ✅ Calendar is simple (CRUD operations, UI work)
- ✅ Independent code paths (no conflicts with multi-agent)
- ✅ Saves 4 weeks (vs sequential)
- ✅ Same launch date, more features

**Work Distribution**:
- **Weeks 15-16**: Different developer/agent can work on Calendar while multi-agent orchestration finalizes
- **Weeks 17-18**: Calendar UI work while Phase 3 production deployment happens
- **Week 19**: Combined QA + Launch

---

## 11. Future Enhancements (Phase 5+)

### Potential New Agents
1. **Quiz Generation Agent**: Create assessments from curriculum topics
2. **Lesson Planning Agent**: Generate complete lesson plans
3. **Assessment Agent**: Grade assignments with rubrics
4. **Translation Agent**: Multi-language support for multilingual classrooms
5. **Accessibility Agent**: Generate alt-text, simplified language versions

### Advanced Features
- **Agent Learning**: Agents improve based on teacher feedback
- **Classroom Integration**: LMS/SIS connections
- **Collaborative Workflows**: Multiple teachers co-create content
- **Student-Facing Agents**: Tutoring agents for students (separate product)

---

## 12. Appendix

### A. Glossary

- **Router Agent**: Orchestrator that classifies intent and routes to sub-agents
- **Sub-Agent**: Specialized agent for specific tasks (Image, Research, Pedagogical)
- **RAG**: Retrieval-Augmented Generation (vector DB + LLM)
- **Nano Banana**: Google's nickname for Gemini 2.5 Flash Image
- **Intent Classification**: Determining user's goal from natural language
- **Entity Extraction**: Pulling structured data from unstructured text

### B. Related Documents

- Main PRD: `teacher-assistant/docs/PRD.md`
- LangGraph Implementation (Deprecated): `docs/architecture/langgraph-implementation-guide.md`
- Current Sprint Priorities: `docs/architecture/implementation-details/PRD-SPRINT-PRIORITIES-2025-10-17.md`
- Brownfield Architecture: `docs/architecture/brownfield-architecture.md`

### C. Decisions Made (2025-10-17)

1. **Knowledge Base Content**: ✅ **Manual curation** from educational resources
   - Will curate high-quality entries from trusted German educational sources
   - Focus on subjects with highest demand (Math, Science, German)
   - Target: 500 entries by end of Epic 3.3

2. **Gemini Privacy**: ✅ **Free tier** ($0/month)
   - Accept that data may be used for Google's model training
   - Monitor for privacy concerns, can upgrade to paid tier if needed
   - Budget: 100 images/day free limit (3000/month)

3. **Priority Order**: ✅ **Current proposal confirmed**
   - Epic 3.1: Image Agent (P0) - Creation + Editing
   - Epic 3.2: Research Agent (P1)
   - Epic 3.3: Pedagogical Knowledge Agent (P1)

4. **Vector Database**: ✅ **OpenAI Vector Store confirmed**
   - Two-database architecture (InstantDB + OpenAI Vector Store) approved
   - InstantDB: Real-time app data
   - OpenAI Vector Store: Semantic search for pedagogical knowledge
   - Simpler than Pinecone (native OpenAI integration, file-based upload)
   - Free tier: 1 GB storage (sufficient for 10,000+ documents)

5. **Timeline**: ✅ **19 weeks approved (with parallel Calendar work)**
   - Phase 3: Epics 3.0 - 3.5 (Weeks 1-18)
   - Phase 4: Epic 4.0 Calendar Integration (Weeks 15-18, PARALLEL)
   - Combined launch: Week 19

6. **Calendar Integration**: ✅ **Added to roadmap**
   - Replace mock data in CalendarCard with real InstantDB data
   - Profile page: Schedule management UI (CRUD operations)
   - AI-powered schedule suggestions (optional)
   - External calendar sync (P2, future)

---

**Document Status**: ✅ APPROVED (2025-10-17)
**Next Steps**:
1. ✅ User approval received
2. Create Epic 3.0 story tickets
3. Kick off Epic 3.0.1: OpenAI Agents SDK setup
4. Schedule weekly review meetings during Phase 3 implementation

**Maintained By**: Product Management
**Review Cycle**: Weekly during Phase 3, Monthly post-launch
