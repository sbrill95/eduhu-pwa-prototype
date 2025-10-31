# Multi-Agent Workflow Orchestration Plan

**Created**: 2025-10-20
**Purpose**: Define all possible agent combinations and workflows
**Priority**: Based on Steffen's feedback (Research > Image > Field Trips)

---

## Agent Inventory

### Currently Implemented/Planned
1. **Image Creation Agent** (DALL-E) - P0
2. **Image Editing Agent** (Gemini) - P0
3. **Research Agent** (Perplexity) - P0
4. **Music Agent** (Suno) - P1
5. **Field Trip Agent** (Maps) - P2
6. **Calendar Agent** (Google Calendar) - P1

### Future Potential
7. **Document Agent** (Templates, PDFs)
8. **Quiz Agent** (Assessment generation)
9. **Translation Agent** (Multi-language)

---

## Workflow Categories

### 1. Single Agent Workflows (Simple)
No orchestration needed, direct routing:
- Create image
- Edit image
- Research topic
- Create song
- Check calendar

### 2. Two-Agent Workflows (Common)

#### Research + Image (HIGH PRIORITY)
```
Input: "Recherchiere und erstelle Bild über Photosynthese"
Flow:
1. Research Agent → Facts about photosynthesis
2. Image Agent → Create diagram using research context
Output: Factual image with accurate details
```

#### Research + Music
```
Input: "Recherchiere und erstelle Song über Französische Revolution"
Flow:
1. Research Agent → Key dates and events
2. Music Agent → Historical song with facts
Output: Educational song with correct information
```

#### Image + Music
```
Input: "Erstelle Poster und Song für Schulfest"
Flow:
1. Image Agent → Event poster design
2. Music Agent → Event theme song
Output: Visual and audio materials
```

#### Calendar + Research
```
Input: "Was steht morgen an und was muss ich dafür vorbereiten?"
Flow:
1. Calendar Agent → Tomorrow's events
2. Research Agent → Prep materials for topics
Output: Schedule with preparation materials
```

### 3. Three-Agent Workflows (Complex)

#### Research + Image + Music (EDUCATION PACKAGE)
```
Input: "Erstelle Lernpaket über Sonnensystem"
Flow:
1. Research Agent → Age-appropriate facts
2. Parallel:
   - Image Agent → Planet diagrams
   - Music Agent → Memory song
Output: Complete learning package
```

#### Calendar + Research + Image
```
Input: "Bereite morgen Biologiestunde vor"
Flow:
1. Calendar Agent → Check tomorrow's biology class
2. Research Agent → Topic research
3. Image Agent → Visual materials
Output: Prepared lesson materials
```

#### Research + Maps + Image (FIELD TRIP - Lower Priority)
```
Input: "Plane Museumsbesuch mit Materialien"
Flow:
1. Maps Agent → Find museums
2. Research Agent → Educational value
3. Image Agent → Permission slips
Output: Complete trip package
```

### 4. Four+ Agent Workflows (Advanced)

#### Complete Event Planning
```
Input: "Plane Schulfest Nachhaltigkeit"
Flow:
1. Research Agent → Sustainability activities
2. Maps Agent → Local eco partners
3. Image Agent → Posters and flyers
4. Music Agent → Environmental songs
Output: Full event package
```

#### Thematic Week Planning
```
Input: "Plane Projektwoche Mittelalter"
Flow:
1. Research Agent → Medieval topics
2. Calendar Agent → Week schedule
3. Image Agent → Visual materials
4. Music Agent → Medieval-style songs
5. Maps Agent → Castle visits nearby
Output: Complete week program
```

---

## Orchestration Rules

### Parallel Execution
Can run simultaneously when no dependencies:
- Research + Calendar (different data sources)
- Image + Music (different creation types)
- Multiple Research (different topics)

### Sequential Execution
Must run in order when dependent:
- Research → Image (needs facts for accuracy)
- Research → Music (needs content for lyrics)
- Calendar → Research (needs to know what to research)
- Maps → Image (needs location for materials)

### Context Sharing Rules
```typescript
interface SharedContext {
  research: {
    facts: string[];
    keyTerms: string[];
    sources: Citation[];
  };
  calendar: {
    events: CalendarEvent[];
    relevantDates: Date[];
  };
  maps: {
    locations: Place[];
    routes: Route[];
  };
  userPreferences: {
    gradeLevel: string;
    subject: string;
    language: string;
  };
}
```

---

## Priority Implementation Order

Based on Steffen's feedback:

### Phase 1: Core Research + Image (HIGHEST VALUE)
1. **Research + Image** workflow
2. **Research alone** improvements
3. **Image alone** refinements

### Phase 2: Creative Enhancement
1. **Research + Music** workflow
2. **Image + Music** workflow
3. **Music alone** implementation

### Phase 3: Planning Integration
1. **Calendar + Research** workflow
2. **Calendar + Image** workflow
3. **Three-agent education packages

### Phase 4: Complex Orchestration (LOWER PRIORITY)
1. Field trip planning (Maps integration)
2. Event planning (4+ agents)
3. Thematic weeks

---

## Cost Optimization Strategies

### Smart Routing
```typescript
// Estimate cost before execution
const estimateCost = (workflow: Workflow): number => {
  const costs = {
    research: 0.02,
    image_create: 0.04,
    image_edit: 0.039,
    music: 0.006,
    maps: 0.025,
  };

  return workflow.agents.reduce((total, agent) =>
    total + costs[agent.type], 0
  );
};

// Warn if expensive
if (estimateCost(workflow) > 0.10) {
  return "This will cost ~$0.10, continue?";
}
```

### Caching Strategy
- Research: Cache 7 days (facts don't change quickly)
- Maps: Cache 24 hours (hours might change)
- Images: Never cache (always unique)
- Music: Never cache (always unique)
- Calendar: Cache 30 minutes

### Fallback Patterns
```typescript
// If one agent fails, try alternatives
const fallbacks = {
  'perplexity': 'basic_search',
  'dalle': 'gemini_image',
  'suno': 'simple_rhyme_generator',
  'maps': 'static_location_db'
};
```

---

## User Experience Patterns

### Progressive Disclosure
```
Simple: "Recherchiere Photosynthese"
→ Single agent

Medium: "Recherchiere und erstelle Bild"
→ Two agents, automatic

Complex: "Erstelle komplettes Lernpaket mit allem"
→ Multiple agents, show progress
```

### Confirmation for Complex Tasks
```typescript
if (workflow.agents.length > 2) {
  showConfirmation({
    agents: workflow.agents,
    estimatedTime: "~2 minutes",
    estimatedCost: "$0.08",
    actions: ["Research", "Create Image", "Generate Song"]
  });
}
```

### Partial Results
```typescript
// Deliver results as they complete
onAgentComplete((agent, result) => {
  streamResult({
    agent: agent.name,
    status: 'complete',
    preview: result.preview
  });
});
```

---

## Success Metrics

### Workflow Performance
- 2-agent workflows: <30 seconds
- 3-agent workflows: <60 seconds
- 4+ agent workflows: <90 seconds

### Accuracy Targets
- Correct agent selection: 95%
- Successful orchestration: 90%
- Context sharing effectiveness: 85%

### User Satisfaction
- Less repeated information requests
- Comprehensive results first try
- Clear progress indication

---

## Next Steps

1. **Implement Research + Image** workflow first (highest value)
2. **Build orchestration engine** for 2-agent scenarios
3. **Add Music agent** for creative enhancement
4. **Expand to 3+ agent** workflows gradually

---

**Note**: Field trips and complex planning are deprioritized per Steffen's feedback. Focus on Research + Image as the killer feature.