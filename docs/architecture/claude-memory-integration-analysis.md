# Claude Memory Integration Analysis - ClassMate AI Memory System

**Document Type**: Architecture Decision Record (ADR)
**Status**: Proposal
**Date**: 2025-10-25
**Author**: System Architect
**Relates To**: Epic 4.5 (NEW - Claude Memory Integration)

---

## Executive Summary

Based on user requirements and ClassMate AI PRD v1.4, we recommend **hybrid memory architecture** combining:
1. **Claude Memory Tool** - Dynamic, personal context (episodes, preferences, learning)
2. **OpenAI Vector Store** - Static, universal knowledge (playbooks, pedagogy)

This matches the user's explicit requirements:
- ✅ Personal teacher context remembered (Q1: yes)
- ✅ Session continuity across days/weeks (Q2: yes)
- ✅ Learning from interactions over time (Q3: yes)
- ✅ Priority: B > C > D > A (Personalized > Continuity > Learning > Generic)

---

## Background: User Requirements

### User's Explicit Answers
```yaml
questions:
  1_personal_context: YES
  2_session_continuity: YES
  3_learning_from_interactions: YES
  5_priority_ranking:
    1st: B - Personalized to teacher's context
    2nd: C - Project continuity
    3rd: D - Learning from interactions
    4th: A - Generic pedagogical advice
```

### ClassMate AI PRD v1.4 Memory Model
```
6) Memory-Modell

STM (Short-Term):
  - Sitzungszustand
  - letzte Turns
  - temporäre Slots (TTL)

LTM (Long-Term):
  - InstantDB-Einträge
  - Episodes (Klassenkontext)
  - Playbooks (Prozesswissen)
  - Artefakte
  - Preferences (Teacher profile)
  - Router-Profile
  - Audit

7.2 Layer-Reihenfolge (Priorität ↓)
  1. User-Eingabe (höchste Autorität)
  2. Kontext (situativ)
  3. Profil/Preferences
  4. Playbook-Defaults (niedrigste)
```

---

## Problem Statement

### Original Plan (OpenAI Vector Store Only)
**Capabilities**:
- ✅ Static knowledge search (Bloom's Taxonomy, curriculum PDFs)
- ✅ Semantic search via embeddings
- ✅ Free tier (1GB storage)

**Limitations**:
- ❌ No automatic session continuity
- ❌ No learning from interactions (static after upload)
- ❌ No personal teacher context retention
- ❌ No context layering (User > Context > Profile)
- ❌ No freshness/trust scoring
- ❌ Requires manual re-indexing after each interaction

### Gap Analysis

| ClassMate AI Requirement | Vector Store | Gap? |
|--------------------------|-------------|------|
| **Episodes** (ongoing class context) | ❌ Not designed for this | **CRITICAL GAP** |
| **Preferences** (teacher profile evolution) | ❌ Static only | **CRITICAL GAP** |
| **Learning** (improve from feedback) | ❌ Manual re-index needed | **CRITICAL GAP** |
| **Context Layering** (7.2 priority logic) | ❌ Flat similarity search | **CRITICAL GAP** |
| **Trust & Salienz** (freshness matters) | ⚠️ Similarity only, no time | **MAJOR GAP** |
| **Playbooks** (static templates) | ✅ Perfect fit | No gap |
| **Static pedagogy** (research PDFs) | ✅ Perfect fit | No gap |

**Conclusion**: Vector Store alone cannot fulfill 5/7 core requirements.

---

## Proposed Solution: Hybrid Memory Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                CLASSMATE AI MEMORY SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │  CLAUDE MEMORY       │      │  OPENAI VECTOR STORE │   │
│  │  (Dynamic LTM)       │      │  (Static Knowledge)  │   │
│  ├──────────────────────┤      ├──────────────────────┤   │
│  │                      │      │                      │   │
│  │ PRD MAPPING:         │      │ PRD MAPPING:         │   │
│  │                      │      │                      │   │
│  │ ✅ Episodes          │      │ ✅ Playbooks         │   │
│  │    (class context)   │      │    (templates)       │   │
│  │                      │      │                      │   │
│  │ ✅ Preferences       │      │ ✅ Static Pedagogy   │   │
│  │    (teacher profile) │      │    (Bloom, methods)  │   │
│  │                      │      │                      │   │
│  │ ✅ Router-Profile    │      │ ✅ Curriculum Stds   │   │
│  │    (intent learning) │      │    (Bildungsserver)  │   │
│  │                      │      │                      │   │
│  │ ✅ Artefakte (refs)  │      │                      │   │
│  │    (past materials)  │      │                      │   │
│  │                      │      │                      │   │
│  │ Storage: Files (.md) │      │ Storage: Embeddings  │   │
│  │ Updates: Automatic   │      │ Updates: Manual      │   │
│  │ Learns: YES          │      │ Learns: NO           │   │
│  │ Freshness: Built-in  │      │ Freshness: N/A       │   │
│  │ Cost: $15-20/mo      │      │ Cost: FREE (1GB)     │   │
│  └──────────────────────┘      └──────────────────────┘   │
│           │                              │                  │
│           └──────────┬───────────────────┘                  │
│                      ▼                                       │
│         ┌────────────────────────────┐                      │
│         │  ORCHESTRATOR AGENT        │                      │
│         │  (Layer Decision Logic)    │                      │
│         │                            │                      │
│         │  Implements PRD 7.2:       │                      │
│         │  1. User input             │                      │
│         │  2. Claude Context         │                      │
│         │  3. Claude Profile         │                      │
│         │  4. Vector Store Defaults  │                      │
│         └────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Claude Memory Tool Features (2025)

### 1. File-Based Persistent Memory
```
memory/teacher-{userId}/
  teacher-profile.md          # Stable preferences
  router-profile.md           # Intent learning
  episodes/
    2025-10-21-7b-bruchrechnung.md
    2025-10-23-8a-ernährung.md
  class-contexts/
    7b-context.md             # Current class state
    8a-context.md
  playbooks/
    ppt-creation-prefs.md     # Personal template preferences
```

**Key Features**:
- ✅ **Automatic Loading**: All files loaded into Claude's context every session
- ✅ **Auto-Updates**: Claude decides what to remember, updates files autonomously
- ✅ **Transparent**: Markdown files, human-readable, teacher can edit
- ✅ **Persistent**: Survives across sessions (days/weeks/months)
- ✅ **Client-Side**: You control storage backend

### 2. Context Editing (Automatic Stale Content Removal)
- Removes old tool calls/results as conversation approaches token limit
- Preserves conversation flow
- **Performance**: 84% token reduction in 100-turn evaluations

### 3. Automatic Compaction
- When context reaches 95% capacity, auto-summarizes older messages
- Keeps: intent, decisions, open threads
- Removes: verbatim history, old outputs

### 4. CLAUDE.md Project Memory
```markdown
# .claude/CLAUDE.md

## Teacher Profile
- Name: [Anonymized]
- School: Gymnasium Berlin
- Subjects: Mathematik, Biologie
- Classes: 7b, 8a, 9c

## Teaching Preferences
- Style: Visual learning emphasis
- Gamification: Preferred
- Differentiation: Always 3 levels

## Current Units
- 7b: Bruchrechnung (Week 5/8)
- 8a: Ernährung (Week 2/6)
- 9c: Stochastik (Week 1/10)
```

**Performance Improvement**: +39% with memory + context editing (Anthropic benchmarks)

---

## Implementation Mapping: PRD Requirements → Solutions

### 1. Episodes (Klassenkontext)

**PRD Requirement**:
> "Episodes: abrufen/speichern (anonymisiert)"

**Claude Memory Implementation**:
```typescript
// memory/episodes/2025-10-21-7b-bruchrechnung.md
---
date: 2025-10-21
class: 7b
topic: Bruchrechnung
approach: Montessori (Bruchkreise, Cuisenaire-Stäbe)
status: Planning
created_materials: []
next_steps:
  - Materialien besorgen
  - Übungsaufgaben erstellen
  - Differenzierung für Lisa & Tom (anonymized)
---

# Bruchrechnung-Einheit Klasse 7b

## Planung
Ansatz: Montessori mit konkreten Materialien (Bruchkreise, Cuisenaire).

## Schüler-Notizen (anonymisiert)
- Schüler A: braucht mehr visuelle Hilfen
- Schüler B: arbeitet gerne mit Manipulativen

## Status
Week 1: Material-Einführung
Week 2: Kürzen und Erweitern (geplant)
```

**Auto-Loading**: Claude reads this file when teacher mentions "7b" or "Bruchrechnung"

---

### 2. Preferences (Teacher Profile)

**PRD Requirement**:
> "Preferences (Teacher profile)"

**Claude Memory Implementation**:
```typescript
// memory/teacher-profile.md
---
last_updated: 2025-10-25
---

# Teacher Profile

## Subjects & Classes
- Primary: Mathematik (7b, 9c)
- Secondary: Biologie (8a)

## PPT Preferences
- Template: clean_classic
- Slides: 12-15 (learned from feedback: user often changes 10→15)
- Duration: 45 min standard
- Style: Visuell, mit Beispielen

## Teaching Style
- Differentiation: ALWAYS 3 levels
- Gamification: Preferred for motivation
- Tonalität: Freundlich, ermutigend

## Most Used Features
- PPT creation (45%)
- Research (30%)
- Material generation (25%)
```

**Learning Example**:
```typescript
// User submits modal with slides=15 (suggested was 12)
→ Claude Memory auto-updates teacher-profile.md:
  "Slides: 12-15 (learned: user prefers upper range)"
```

---

### 3. Router-Profile (Intent Learning)

**PRD Requirement**:
> "Router-Profile" + "Phase 1: regelbasiertes Re-Ranking (per-User router_profiles)"

**Claude Memory Implementation**:
```typescript
// memory/router-profile.md
---
learning_enabled: true
---

# Intent Recognition Profile

## Confirmed Patterns (learned from user feedback)
- "Erstelle" → PPT creation (95% confidence after 20 confirmations)
- "Recherchiere" → Research agent (90% confidence)
- "Differenzierung" → Pedagogical agent (85% confidence)

## Disambiguation History
- "Material" → Could be PPT or Research
  - User chose: Research (3x), PPT (1x)
  - Next time: Suggest Research first

## False Positives (learned to avoid)
- "Plane" → Initially routed to Calendar, user corrected to PPT (2x)
  - Adjustment: Check for "Unterricht" context before Calendar route
```

**Auto-Learning**: After each modal confirmation, Claude updates confidence scores

---

### 4. Context Layering (PRD 7.2)

**PRD Requirement**:
```
7.2 Layer-Reihenfolge (Priorität ↓)
  1. User-Eingabe (höchste Autorität)
  2. Kontext (situativ)
  3. Profil/Preferences
  4. Playbook-Defaults (niedrigste)
```

**Implementation**:
```typescript
async function prefillModal(userInput: string, userId: string) {
  // Layer 1: User input (highest priority)
  const userSlots = parseUserInput(userInput);
  // → { subject: "Ernährung", class: "8b" }

  // Layer 2: Context (situativ) - from Claude Memory
  const contextSlots = await claudeMemory.getRecentEpisode(userId, userSlots.class);
  // → reads memory/class-8b-context.md
  // → { currentTopic: "Stoffwechsel", preferredStyle: "visuell" }

  // Layer 3: Profile - from Claude Memory
  const profileSlots = await claudeMemory.getProfile(userId);
  // → reads memory/teacher-profile.md
  // → { defaultSlides: 12, template: "clean_classic", duration: 45 }

  // Layer 4: Playbook defaults - from OpenAI Vector Store
  const playbookSlots = await vectorStore.search('ppt-creation-defaults');
  // → { minSlides: 8, maxSlides: 20, defaultDuration: 30 }

  // Merge with priority (PRD 7.2 spec)
  return mergeWithPriority(userSlots, contextSlots, profileSlots, playbookSlots);
}
```

---

### 5. Trust & Salienz (PRD 7.4)

**PRD Requirement**:
```
7.4 Trust & Salienz
- Relevanz (semantische Nähe zur Anfrage)
- Aktualität (Zeitstempel)
- Häufigkeit (wie oft genutzt/bestätigt)
- Quelle/Vertrauen
```

**Claude Memory Features**:
- ✅ **Freshness**: File timestamps built-in
- ✅ **Relevance**: Claude's LLM determines semantic similarity
- ✅ **Frequency**: Track usage in metadata
- ✅ **Trust**: Source annotations in YAML frontmatter

**Implementation**:
```typescript
// memory/episodes/2025-10-21-7b-bruchrechnung.md
---
date: 2025-10-21
last_accessed: 2025-10-25
access_count: 5
trust_score: 0.95  # High (user confirmed multiple times)
source: user_planning
---

// Orchestrator uses this to prioritize
const relevantEpisodes = await claudeMemory.searchEpisodes({
  query: userInput,
  minTrustScore: 0.55,
  sortBy: ['freshness', 'access_count', 'trust_score']
});
```

---

### 6. PII-Guard Integration

**PRD Requirement**:
> "PII-Guard lokal → Detektion & Redaction vor Persistenz"

**Implementation** (unchanged, works with both systems):
```typescript
// Before persisting to Claude Memory OR Vector Store
const sanitized = await piiGuard.redact(content);

// Claude Memory
await claudeMemory.write('episodes/2025-10-25-7b.md', sanitized);

// Audit trail
await auditLog.record({
  action: 'memory_write',
  pii_detected: piiGuard.detections,
  redacted: true
});
```

**Compatible**: Claude Memory is client-side, you control redaction before storage

---

## Use Case Examples

### Use Case 1: Modal Pre-fill (PRD 7.2 Layering)

**Scenario**: Teacher asks "Erstelle PPT über Ernährung für meine 8b"

**Step-by-Step**:
```typescript
// 1. Claude Memory auto-loads context
const teacherProfile = await claudeMemory.read('teacher-profile.md');
const class8bContext = await claudeMemory.read('class-contexts/8b-context.md');

// 2. Layer merging (PRD 7.2)
const prefill = {
  class: '8b',              // Layer 1: User input
  subject: 'Ernährung',     // Layer 1: User input
  slides: 12,               // Layer 3: Profile default
  template: 'clean_classic',// Layer 3: Profile
  duration: 45,             // Layer 3: Profile
  style: 'visuell',         // Layer 2: Context (8b class prefers visual)
  niveau: 'Mittelstufe'     // Layer 2: Context (Klasse 8 = Mittelstufe)
};

// 3. UI badges (PRD 7.3 transparency)
const badges = {
  class: 'aus Eingabe',
  subject: 'aus Eingabe',
  slides: 'aus Profil',
  template: 'aus Profil',
  style: 'aus Kontext (Klasse 8b)',
  niveau: 'aus Kontext'
};
```

**Result**: Modal is 90%+ pre-filled, teacher just confirms/tweaks

---

### Use Case 2: Session Continuity (PRD requirement 2)

**Monday**:
```
Teacher: "Ich plane Bruchrechnung-Einheit für 7b, Montessori-Ansatz"

→ Claude Memory writes:
  memory/episodes/2025-10-21-7b-bruchrechnung.md:
    - Thema: Bruchrechnung
    - Ansatz: Montessori
    - Status: Planung läuft
    - Next: Materialien + Übungsaufgaben
```

**Wednesday** (2 days later):
```
Teacher: "Erstelle Übungsaufgaben für die Einheit"

→ Orchestrator:
  1. Claude Memory finds recent episode (2025-10-21-7b-bruchrechnung.md)
  2. Freshness score: HIGH (only 2 days old)
  3. Trust score: HIGH (user created it)
  4. Loads context: "Bruchrechnung, Montessori, 7b"

→ Modal pre-fill:
  Class: 7b (from episode)
  Topic: Bruchrechnung (from episode)
  Approach: Montessori (from episode)
  Type: Übungsaufgaben

→ Confirmation: "Fortsetzung der Bruchrechnung-Planung vom 21.10. – richtig?"

→ Teacher: "Ja" ✅
```

**Without Claude Memory**: Teacher would have to re-explain "7b, Bruchrechnung, Montessori" every session

---

### Use Case 3: Learning from Interactions (PRD requirement 3)

**Interaction 1**:
```
System suggests: slides=10
Teacher changes to: slides=15
```

**Interaction 2** (next week):
```
System suggests: slides=10
Teacher changes to: slides=15
```

**Interaction 3**:
```
System suggests: slides=12 (learned average)
Teacher confirms ✅
```

**Interaction 5**:
```
System suggests: slides=12-15 (learned range)
Teacher confirms ✅
```

**Claude Memory Auto-Update**:
```markdown
# teacher-profile.md (after 5 interactions)

## PPT Preferences
- Slides: 12-15 (learned from feedback)
  - History: 10→15 (2x), 12→confirmed (3x)
  - Confidence: 0.85
  - Last updated: 2025-10-25
```

---

## OpenAI Vector Store Role (Complementary)

### What Vector Store DOES Handle

**1. Static Playbooks (Templates)**
```typescript
// Upload once, search many times
const vectorStore = await openai.vectorStores.create({
  name: 'Playbook Templates',
  files: [
    'playbooks/ppt-creation-template.md',
    'playbooks/research-playbook.md',
    'playbooks/material-generation.md'
  ]
});

// Search when needed
const playbookDefaults = await vectorStore.search({
  query: 'PowerPoint creation defaults',
  topK: 1
});
// Returns: { minSlides: 8, maxSlides: 20, defaultTemplate: 'standard' }
```

**2. Pedagogical Knowledge (Static Research)**
```typescript
// Upload educational research PDFs
const pedagogyStore = await openai.vectorStores.create({
  name: 'Pedagogical Knowledge',
  files: [
    'pedagogy/bloom-taxonomy-de.pdf',
    'pedagogy/differentiation-strategies.pdf',
    'pedagogy/montessori-math-didactics.pdf',
    'pedagogy/german-curriculum-standards.pdf'
  ]
});

// Search when teacher needs pedagogical advice
const pedagogyAdvice = await pedagogyStore.search({
  query: 'Differentiation strategies for fractions Klasse 7',
  topK: 3
});
```

**3. Curriculum Standards**
```typescript
// German Bildungsstandards by subject/state
const curriculumStore = await openai.vectorStores.create({
  name: 'Curriculum Standards',
  files: [
    'curriculum/bildungsstandards-mathematik.pdf',
    'curriculum/berlin-lehrplan-biologie.pdf',
    // ... per state
  ]
});
```

---

## Cost Analysis

### Current Plan (OpenAI Only)
| Service | Monthly Cost |
|---------|-------------|
| OpenAI GPT-4o-mini | ~$5 |
| DALL-E 3 | ~$4 |
| Gemini | ~$10 |
| Perplexity | ~$10 |
| OpenAI Vector Store | FREE (1GB) |
| **TOTAL** | **~$29/month** |

**Limitations**:
- ❌ No session continuity
- ❌ No learning from interactions
- ❌ No personal teacher context
- ❌ Teachers re-explain preferences every session

---

### Proposed Plan (Hybrid)
| Service | Use Case | Monthly Cost |
|---------|----------|-------------|
| OpenAI Agents SDK | Router, Orchestrator | ~$5 |
| DALL-E 3 | Image creation | ~$4 |
| Gemini | Image editing, Maps | ~$10 |
| Perplexity | Research | ~$10 |
| **Claude Sonnet 4.5** | **Episodes, Preferences, Learning** | **~$20** |
| OpenAI Vector Store | Static playbooks/pedagogy | FREE (1GB) |
| **TOTAL** | | **~$49/month** |

**Benefits**:
- ✅ **Complete ClassMate AI vision** (all PRD features)
- ✅ **Modal pre-fill with layering** (PRD 7.2)
- ✅ **Session continuity** (episodes across days)
- ✅ **Learning from interactions** (auto-improves)
- ✅ **Personalized to teacher context** (priority B)
- ✅ **Transparent sourcing** (file-based, auditable)

**Cost Increase**: +$20/month (+69%)

**ROI Analysis**:
- **Time Saved**: 30% reduction in modal filling time (PRD KPI target)
- **User Satisfaction**: Higher (fewer repeated explanations)
- **Retention**: Stronger (system "remembers" each teacher)
- **Differentiation**: Unique feature (competitors don't have this)

---

## Technical Integration Points

### 1. Orchestrator Agent (Primary Integration Point)

```typescript
// teacher-assistant/backend/src/agents/orchestrator.ts

export class OrchestratorAgent {
  private claudeMemory: ClaudeMemoryClient;
  private vectorStore: OpenAIVectorStore;

  async prefillModal(userInput: string, userId: string): Promise<ModalPrefill> {
    // PRD 7.2 Layer implementation

    // Layer 1: User input
    const userSlots = await this.parseUserInput(userInput);

    // Layer 2: Context (Claude Memory - Episodes)
    const recentEpisode = await this.claudeMemory.searchEpisodes({
      userId,
      query: userInput,
      maxAge: '2 weeks',
      limit: 1
    });

    // Layer 3: Profile (Claude Memory - Preferences)
    const profile = await this.claudeMemory.getProfile(userId);

    // Layer 4: Defaults (Vector Store - Playbooks)
    const playbook = await this.vectorStore.search({
      query: `${userSlots.intent} playbook defaults`,
      topK: 1
    });

    // Merge with priority
    return this.mergeWithPriority(userSlots, recentEpisode, profile, playbook);
  }

  async learnFromFeedback(userId: string, submitted: any, suggested: any) {
    // PRD requirement 3: Learning
    const changes = this.detectChanges(suggested, submitted);

    if (changes.length > 0) {
      await this.claudeMemory.updateProfile(userId, {
        changes,
        reason: 'User feedback',
        confidence: this.calculateConfidence(changes)
      });
    }
  }
}
```

---

### 2. Claude Memory Client (NEW Service)

```typescript
// teacher-assistant/backend/src/services/claudeMemoryClient.ts

import { ClaudeAgent } from '@anthropic-ai/claude-agent-sdk';

export class ClaudeMemoryClient {
  private agent: ClaudeAgent;

  constructor() {
    this.agent = new ClaudeAgent({
      model: 'claude-sonnet-4-5',
      memory: {
        enabled: true,
        directory: './memory/' // Configurable per user
      }
    });
  }

  async getProfile(userId: string): Promise<TeacherProfile> {
    const memoryPath = `./memory/teacher-${userId}/teacher-profile.md`;
    const content = await this.agent.memory.read(memoryPath);
    return this.parseProfile(content);
  }

  async searchEpisodes(params: {
    userId: string;
    query: string;
    maxAge?: string;
    limit?: number;
  }): Promise<Episode[]> {
    const episodesDir = `./memory/teacher-${params.userId}/episodes/`;
    const episodes = await this.agent.memory.list(episodesDir);

    // Filter by age
    const filtered = this.filterByAge(episodes, params.maxAge);

    // Rank by relevance + freshness + trust
    const ranked = await this.rankEpisodes(filtered, params.query);

    return ranked.slice(0, params.limit || 3);
  }

  async updateProfile(userId: string, update: ProfileUpdate) {
    const currentProfile = await this.getProfile(userId);
    const updatedProfile = this.mergeUpdate(currentProfile, update);

    const memoryPath = `./memory/teacher-${userId}/teacher-profile.md`;
    await this.agent.memory.write(memoryPath, this.serializeProfile(updatedProfile));
  }

  async createEpisode(userId: string, episode: Episode) {
    const sanitized = await this.piiGuard.redact(episode);
    const fileName = `${episode.date}-${episode.class}-${slugify(episode.topic)}.md`;
    const memoryPath = `./memory/teacher-${userId}/episodes/${fileName}`;

    await this.agent.memory.write(memoryPath, this.serializeEpisode(sanitized));
  }
}
```

---

### 3. PII-Guard Integration (Unchanged)

```typescript
// PII redaction happens BEFORE writing to Claude Memory
const sanitized = await piiGuard.redact(content);
await claudeMemory.write(path, sanitized);

// Same for Vector Store
const sanitizedDoc = await piiGuard.redact(document);
await vectorStore.upload(sanitizedDoc);
```

---

## Migration Strategy

### Phase 1: Parallel Run (4 weeks)
**Goal**: Add Claude Memory WITHOUT breaking existing functionality

**Implementation**:
1. Install Claude Agent SDK
2. Implement ClaudeMemoryClient service
3. Add memory writes (episodes, profile updates)
4. **DO NOT** use for modal pre-fill yet (still use existing logic)
5. Validate memory persistence works correctly

**Acceptance Criteria**:
- ✅ Memory files created correctly
- ✅ PII redaction working
- ✅ No impact on existing features
- ✅ Audit logs show memory writes

---

### Phase 2: Modal Pre-fill Migration (2 weeks)
**Goal**: Replace existing pre-fill logic with layered approach

**Implementation**:
1. Implement PRD 7.2 layering in Orchestrator
2. A/B test: 50% users use Claude Memory, 50% use old logic
3. Compare metrics:
   - % fields auto-filled
   - % manual changes
   - Time to submit
   - User satisfaction

**Success Criteria**:
- ✅ Claude Memory version ≥ 90% auto-fill
- ✅ ≤ 10% manual overrides
- ✅ ≥ 80% user satisfaction
- ✅ No increase in errors

---

### Phase 3: Learning Loop (2 weeks)
**Goal**: Enable automatic profile updates from feedback

**Implementation**:
1. Track modal changes (submitted vs suggested)
2. Update Claude Memory profile automatically
3. Monitor confidence scores
4. Validate improvements over time

**Success Criteria**:
- ✅ Profile updates happening automatically
- ✅ Suggestion accuracy improves over time
- ✅ Users notice fewer manual corrections needed

---

### Phase 4: Full Production (1 week)
**Goal**: 100% traffic on Claude Memory system

**Implementation**:
1. Remove old pre-fill logic
2. 100% users on new system
3. Monitor for 1 week
4. Gather user feedback

**Success Criteria**:
- ✅ No regressions
- ✅ Performance within SLA
- ✅ ≥ 80% user satisfaction (PRD KPI)

---

## Risks & Mitigation

### Risk 1: Cost Overrun
**Risk**: Claude API costs exceed $20/month estimate

**Likelihood**: Medium
**Impact**: Medium

**Mitigation**:
- Implement token budgets per user
- Cache memory reads (files don't change often)
- Use Claude Haiku (cheaper) for simple memory operations
- Monitor usage with alerts at 80% budget

---

### Risk 2: Memory Drift (Incorrect Learning)
**Risk**: Claude learns wrong patterns from user behavior

**Likelihood**: Medium
**Impact**: High

**Mitigation**:
- Confidence thresholds (only update if confidence > 0.7)
- User can manually edit memory files (transparent)
- Audit logs track all memory changes
- "Reset memory" option for teachers
- Regular review of learned patterns

---

### Risk 3: PII Leakage
**Risk**: Personal data ends up in Claude Memory despite PII-Guard

**Likelihood**: Low
**Impact**: Critical

**Mitigation**:
- PII-Guard runs BEFORE Claude Memory writes
- Audit logs track all memory writes with PII scan results
- Regular audits of memory files
- Delete memory files after X months
- Teacher can view/delete their memory anytime

---

### Risk 4: Migration Complexity
**Risk**: Migrating existing users to new memory system is complex

**Likelihood**: Medium
**Impact**: Medium

**Mitigation**:
- Gradual rollout (Phase 1-4 strategy)
- A/B testing before full migration
- Fallback to old system if issues detected
- Clear user communication about new features

---

## Success Metrics (PRD Alignment)

### From PRD Section 11: Qualitätskriterien

| PRD Metric | Target | How Claude Memory Helps |
|------------|--------|------------------------|
| **Autovervollständigte Pflichtfelder** | ≥ 90% vollständig | Claude Memory provides context + profile for auto-fill |
| **Falsche Vorbefüllungen** | ≤ 10% | Learning from feedback reduces errors over time |
| **Zeit bis submit** | ≤ 20s median | Fewer manual corrections = faster submit |
| **Akzeptanz Modal** | ≥ 80% "hilft & spart Zeit" | Personalized pre-fill increases satisfaction |

### Additional Metrics (Memory-Specific)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Session Continuity** | ≥ 80% correct context recall | % episodes correctly loaded for follow-up queries |
| **Learning Accuracy** | ≥ 85% profile updates are helpful | User accepts vs rejects learned preferences |
| **Memory Freshness** | ≤ 2 days median age | How old is the context used for pre-fill |
| **PII Protection** | 0 leaks | Audit logs show 100% redaction before memory write |

---

## Decision Recommendation

### ✅ APPROVE Hybrid Architecture

**Rationale**:
1. **User Requirements**: Explicitly needs personal context (Q1), session continuity (Q2), learning (Q3)
2. **PRD Alignment**: ClassMate AI PRD v1.4 describes exactly what Claude Memory provides
3. **Technical Fit**: Claude Memory designed for episodes, preferences, learning (Vector Store is NOT)
4. **Cost Justified**: +$20/month enables complete ClassMate AI vision
5. **Competitive Advantage**: No competitor has this level of personalization

**Alternative (NOT RECOMMENDED)**:
- Build custom memory system with InstantDB
- **Effort**: 8-12 weeks development
- **Complexity**: High (freshness tracking, conflict resolution, learning algorithms)
- **Cost**: Developer time > $20/month API cost
- **Risk**: Custom system likely inferior to Claude's production-tested solution

---

## Next Steps

1. **Architect Review**: Analyze potential conflicts with existing architecture (NEXT TASK)
2. **User Approval**: Confirm hybrid approach aligns with vision
3. **Epic Creation**: Create Epic 4.5 (Claude Memory Integration)
4. **Story Breakdown**: Draft stories for Phase 1-4 migration
5. **Prototype**: Build PoC with 1 teacher to validate approach

---

## Appendix A: Claude Memory File Structure Example

```
memory/teacher-12345/
  teacher-profile.md              # Stable preferences
  router-profile.md               # Intent learning

  episodes/
    2025-10-21-7b-bruchrechnung.md
    2025-10-23-8a-ernährung.md
    2025-10-25-9c-stochastik.md

  class-contexts/
    7b-context.md                 # Current state of Klasse 7b
    8a-context.md
    9c-context.md

  playbooks/
    ppt-creation-prefs.md         # Personal PPT preferences
    research-prefs.md             # Research preferences

  artefacts/
    generated-materials.md        # References to past materials
```

---

## Appendix B: Comparison Matrix

| Feature | Vector Store Only | Hybrid (Vector + Claude) | Winner |
|---------|------------------|-------------------------|--------|
| **Static knowledge** | ✅ Excellent | ✅ Excellent | Tie |
| **Personal context** | ❌ Not designed | ✅ Designed for this | **Hybrid** |
| **Session continuity** | ❌ Manual retrieval | ✅ Automatic | **Hybrid** |
| **Learning** | ❌ Static after upload | ✅ Auto-updates | **Hybrid** |
| **Context layering** | ❌ Flat search | ✅ File hierarchy + priority | **Hybrid** |
| **Freshness** | ⚠️ Similarity only | ✅ Timestamps built-in | **Hybrid** |
| **Transparency** | ⚠️ Embeddings opaque | ✅ Markdown files | **Hybrid** |
| **Cost** | FREE | +$20/month | Vector Store |
| **Setup complexity** | Low | Medium | Vector Store |

**Conclusion**: Hybrid architecture wins 6/9 categories. Cost and complexity are acceptable trade-offs for complete PRD implementation.

---

**Document Status**: DRAFT - Awaiting Architect Review for Conflict Analysis
**Next Action**: Call BMad Architect Agent
**Related Documents**:
- ClassMate AI PRD v1.4
- docs/prd.md
- docs/architecture/multi-agent-system-prd.md
