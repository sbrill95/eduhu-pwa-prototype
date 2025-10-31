# Epic 5.0: Advanced Educational Agents - Field Trip & Research

**Epic ID**: Epic 5.0
**Parent PRD**: [docs/prd.md](../prd.md)
**Timeline**: Phase 5 (Weeks 13-16)
**Status**: Planning
**Priority**: P1 (High Value Features)
**Depends On**: Epic 3.0, 3.1, 3.2 (Core Agent System)

---

## Epic Goal

Implement two new specialized agents for teachers: Field Trip Planning Agent (Google Maps) and Research Agent (Perplexity) to expand beyond image generation into practical educational planning and research.

---

## Epic Context

**Current State**:
- Image generation and editing agents working
- OpenAI Agents SDK integrated
- Router agent classifies intents

**Target State**:
- Teachers can plan field trips with real location data
- Teachers can research educational topics with citations
- Router expanded to detect research and planning intents
- Cost-optimized with usage tracking

---

## Business Value

**Field Trip Planning**: Save 2-3 hours per trip planning
**Research Agent**: Save 1-2 hours per lesson preparation
**User Retention**: Expand beyond image tools to daily teacher needs
**Differentiation**: Unique educational planning features

---

## Technical Integration

### Google Maps Grounding (Gemini API)
- **Cost**: $25 per 1,000 grounded prompts ($0.025/prompt)
- **Models**: Gemini 2.5 Flash, 2.5 Pro support grounding
- **Features**: 250M+ places, reviews, hours, ratings
- **Widgets**: Interactive maps with photos and details

### Perplexity API
- **Cost**: Token-based + request fees (exact pricing TBD)
- **Credit**: Pro users get $5/month free credits
- **Features**: Real-time web research, citations, structured answers
- **Models**: pplx-7b-online, pplx-70b-online

---

## Stories

### Story 5.0.1: Field Trip Planning Agent - Google Maps Integration
**Goal**: Teachers can plan field trips with real location data

**Acceptance Criteria**:
1. Natural language trip planning: "Plan a biology field trip to museums in Berlin"
2. Google Maps grounding returns:
   - Relevant educational locations
   - Opening hours and admission fees
   - Reviews from other schools/teachers
   - Distance and travel time calculations
3. Generate itinerary with:
   - Timeline with travel buffers
   - Educational value per location
   - Cost estimation
   - Safety considerations
4. Interactive map widget in response
5. Export as PDF itinerary

**Technical Requirements**:
```typescript
// Enable Maps grounding in Gemini request
{
  tools: [{
    googleMaps: {
      userLocation: { lat, lng }, // School location
      enableWidget: true
    }
  }]
}
```

**Story File**: [docs/stories/epic-5.0.story-1.md](../stories/epic-5.0.story-1.md)

---

### Story 5.0.2: Research Agent - Perplexity Integration
**Goal**: Teachers can research topics with citations for lessons

**Acceptance Criteria**:
1. Natural language research: "Research renewable energy for 8th grade"
2. Perplexity returns:
   - Structured, factual information
   - Age-appropriate content
   - Verifiable citations
   - Recent information (2024 data)
3. Format results for education:
   - Key concepts highlighted
   - Learning objectives extracted
   - Discussion questions generated
   - Additional resources linked
4. Save research to library with tags
5. Track API usage and costs

**Technical Requirements**:
```typescript
// Perplexity API call
const research = await perplexityClient.search({
  query: enhancedEducationalQuery,
  model: 'pplx-70b-online',
  context: 'educational_research',
  grade_level: gradeLevel
});
```

**Story File**: [docs/stories/epic-5.0.story-2.md](../stories/epic-5.0.story-2.md)

---

### Story 5.0.3: Router Enhancement for New Agents
**Goal**: Router detects planning and research intents

**Acceptance Criteria**:
1. Detect field trip planning keywords:
   - "Ausflug", "Klassenfahrt", "Exkursion", "Besuch"
   - Location mentions trigger Maps agent
2. Detect research keywords:
   - "recherchiere", "erkläre", "was ist", "informationen über"
   - Academic topics trigger Perplexity
3. Classification accuracy ≥95%
4. Multi-agent chaining:
   - Research + Image: "Research and create image about solar system"
   - Planning + Image: "Plan zoo trip and create permission slip"
5. Confidence-based routing with manual override

**Story File**: [docs/stories/epic-5.0.story-3.md](../stories/epic-5.0.story-3.md)

---

### Story 5.0.4: Cost Management & Usage Tracking
**Goal**: Track and optimize API costs for new services

**Acceptance Criteria**:
1. Add to admin dashboard:
   - Google Maps costs ($0.025/prompt)
   - Perplexity costs (variable)
   - Usage by agent type
2. Usage limits:
   - 100 Maps prompts/day ($2.50)
   - 200 Perplexity searches/day
3. Smart caching:
   - Cache Maps results for 24 hours
   - Cache research for 7 days
4. Cost optimization:
   - Use lighter models for simple queries
   - Batch similar requests
5. User notifications at 80% limit

**Story File**: [docs/stories/epic-5.0.story-4.md](../stories/epic-5.0.story-4.md)

---

### Story 5.0.5: Educational Templates & Presets
**Goal**: Streamline common educational planning tasks

**Acceptance Criteria**:
1. Field Trip Templates:
   - Museum visit (Kunst, Geschichte, Naturkunde)
   - Nature excursion (Wald, Park, Zoo)
   - City tour (Historisch, Kulturell)
   - STEM locations (Technikmuseum, Planetarium)
2. Research Templates:
   - Lesson introduction
   - Homework help
   - Project research
   - Current events analysis
3. Grade-appropriate filtering:
   - Grundschule (1-4)
   - Mittelstufe (5-10)
   - Oberstufe (11-13)
4. Save custom templates
5. Share templates with colleagues

**Story File**: [docs/stories/epic-5.0.story-5.md](../stories/epic-5.0.story-5.md)

---

## Implementation Details

### Field Trip Planning Workflow
```
1. Teacher: "Plan a day trip to science museums"
2. Router → Field Trip Agent
3. Extract parameters:
   - Subject: Science
   - Duration: Day trip
   - Location: Current city
4. Google Maps grounding:
   - Find science museums within 50km
   - Get reviews, hours, prices
5. Generate itinerary:
   - 9:00 Departure from school
   - 9:45 Arrival Museum A
   - 11:30 Lunch break
   - 13:00 Museum B
   - 15:30 Return to school
6. Include practical info:
   - Total cost per student
   - Required permissions
   - Emergency contacts
7. Return with interactive map widget
```

### Research Workflow
```
1. Teacher: "Research climate change for 7th grade"
2. Router → Research Agent
3. Enhance query:
   - Add: "age 12-13, German curriculum"
   - Focus: causes, effects, solutions
4. Perplexity search:
   - Get latest scientific data
   - Find educational resources
   - Verify facts with citations
5. Format for education:
   - Simplify complex terms
   - Add visual suggestions
   - Create quiz questions
6. Cross-reference with curriculum
7. Save to library with tags
```

---

## Dependencies

**Technical**:
- Gemini API with Maps grounding enabled
- Perplexity API key and credits
- Google Maps Platform account (for widgets)

**External Services**:
- Google Places API (via Gemini)
- Perplexity Search API
- OpenStreetMap (fallback)

---

## Success Criteria

Epic complete when:
- ✅ Field trip planning generates complete itineraries
- ✅ Research agent provides cited, educational content
- ✅ Router correctly identifies planning/research intents
- ✅ Costs tracked and within budget
- ✅ Templates accelerate common tasks
- ✅ Teachers save 2+ hours per week

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| API costs exceed budget | HIGH | Strict limits, caching, monitoring |
| Maps data incomplete for German schools | MEDIUM | Fallback to OpenStreetMap |
| Perplexity rate limits | MEDIUM | Queue requests, use Pro credits |
| Information accuracy | HIGH | Always show citations, disclaimer |

---

## Cost Projections

**Monthly Estimates**:
- Google Maps: 2000 prompts × $0.025 = $50
- Perplexity: Variable, ~$30-40
- Total: ~$80-90/month

**Optimization**:
- Cache popular destinations
- Batch similar research
- Use free tier where possible

---

## Out of Scope

- Booking/payment for trips
- Live navigation during trips
- Parent communication features
- Grade/assignment creation

---

**Epic Owner**: Product Manager
**Technical Lead**: Dev Agent
**QA**: Quinn (Test Architect)
**Created**: 2025-10-20
**Status**: DRAFT - Pending Approval