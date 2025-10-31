# Agent Confirmation Workflow Specifications

**Created**: 2025-10-20
**Based on**: Steffen's requirements
**Core Principle**: Sequential execution with user confirmation modals

---

## Core Architecture Decisions

### 1. Sequential Execution Only
- **NO parallel execution** - all agents run one after another
- Each agent completion triggers next agent confirmation
- User maintains control throughout the process

### 2. Agent Confirmation Modal Pattern
- Every agent action requires confirmation (unless high confidence)
- Consistent UI pattern across all agent types
- Clear cost and time estimates shown

### 3. Session-based Memory
- Context shared within current chat session
- Long-term memory separate system
- Artifacts (Research results) available for extraction

---

## Agent Confirmation Modal Design

### Modal Structure

```typescript
interface AgentConfirmationModal {
  // Header
  agentType: 'research' | 'image' | 'music' | 'edit';
  agentIcon: IconComponent;
  title: string;                    // "Bild-Generierung bestätigen"

  // Confidence Section
  confidence: {
    score: number;                  // 0-100
    level: 'high' | 'medium' | 'low';
    autoExecute: boolean;           // true if confidence > threshold
  };

  // Parameters Section (User can modify)
  parameters: {
    // Research Agent
    topic?: string;
    depth?: 'quick' | 'standard' | 'comprehensive';
    sources?: 'academic' | 'general' | 'news';

    // Image Agent
    style?: 'diagram' | 'illustration' | 'realistic' | 'cartoon';
    labels?: 'german' | 'english' | 'none';
    complexity?: 'simple' | 'detailed';

    // Music Agent
    duration?: 30 | 120 | 240;      // seconds
    musicStyle?: string;             // User selection
    tempo?: 'slow' | 'medium' | 'fast';
    lyrics?: string;                 // Editable lyrics preview
  };

  // Context Display
  context: {
    fromPreviousAgent?: {
      type: string;
      preview: string;               // First 200 chars
      fullData: any;                 // Available for extraction
    };
    userQuery: string;
    sessionHistory: string[];        // Previous actions this session
  };

  // Cost & Time
  estimates: {
    cost: number;                    // In dollars
    time: string;                    // "~15 seconds"
    apiCalls: number;
  };

  // Actions
  actions: {
    confirm: () => void;
    modify: () => void;              // Opens parameter editor
    cancel: () => void;
    help: () => void;                // Explains what agent will do
  };
}
```

### Visual Example

```
┌─────────────────────────────────────────────────────────┐
│ 🎨 Bild-Generierung bestätigen                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Confidence: ●●●●●●●●○○ 85% (High)                     │
│                                                         │
│ Basierend auf Research:                                │
│ ┌─────────────────────────────────────────┐           │
│ │ "Photosynthese findet in Chloroplasten..." │         │
│ └─────────────────────────────────────────┘           │
│                                                         │
│ Geplante Bildgenerierung:                              │
│ • Stil: Educational Diagram                            │
│ • Beschriftung: Deutsch                                │
│ • Komplexität: Mittel (7. Klasse)                     │
│                                                         │
│ [Anpassen]                                             │
│                                                         │
│ Zeit: ~15 Sekunden | Kosten: $0.04                    │
│                                                         │
│ [Abbrechen]  [Hilfe]  [✓ Generieren]                  │
└─────────────────────────────────────────────────────────┘
```

---

## Confidence Thresholds

### Threshold Definitions

```typescript
const CONFIDENCE_THRESHOLDS = {
  // Auto-execute thresholds
  autoExecute: {
    research: 90,        // Very clear research intent
    image: 85,          // Clear visual requirements
    music: 80,          // Music is more subjective
    edit: 85,           // Clear edit instructions
  },

  // Minimum thresholds (below = always ask)
  minimum: {
    research: 60,
    image: 50,
    music: 50,
    edit: 60,
  },

  // Warning thresholds (show yellow warning)
  warning: {
    research: 70,
    image: 65,
    music: 65,
    edit: 70,
  }
};

// Usage
function shouldAutoExecute(agent: string, confidence: number): boolean {
  return confidence >= CONFIDENCE_THRESHOLDS.autoExecute[agent];
}

function needsUserConfirmation(agent: string, confidence: number): boolean {
  return confidence < CONFIDENCE_THRESHOLDS.autoExecute[agent];
}
```

### Confidence Calculation Examples

```typescript
// Research confidence based on query clarity
function calculateResearchConfidence(query: string): number {
  let confidence = 50; // Base

  // Clear topic mentioned
  if (hasSpecificTopic(query)) confidence += 20;

  // Grade level specified
  if (hasGradeLevel(query)) confidence += 15;

  // Clear action verb
  if (query.match(/recherchiere|erkläre|was ist/i)) confidence += 15;

  // Has context from previous message
  if (hasPreviousContext()) confidence += 10;

  return Math.min(confidence, 100);
}

// Image confidence based on description
function calculateImageConfidence(query: string, context?: any): number {
  let confidence = 40; // Base

  // Has research context
  if (context?.fromResearch) confidence += 30;

  // Specific visual requirements
  if (hasVisualKeywords(query)) confidence += 20;

  // Style specified
  if (hasStyleKeywords(query)) confidence += 10;

  return Math.min(confidence, 100);
}
```

---

## Sequential Workflow Execution

### Workflow Controller

```typescript
class SequentialWorkflowController {
  private currentSession: SessionMemory;
  private executionQueue: AgentTask[];
  private currentIndex: number = 0;

  async executeWorkflow(tasks: AgentTask[]): Promise<WorkflowResult> {
    this.executionQueue = tasks;
    const results: AgentResult[] = [];

    for (let i = 0; i < tasks.length; i++) {
      this.currentIndex = i;
      const task = tasks[i];

      // Calculate confidence
      const confidence = await this.calculateConfidence(task);

      // Check if needs confirmation
      if (confidence < CONFIDENCE_THRESHOLDS.autoExecute[task.agent]) {
        // Show confirmation modal
        const confirmed = await this.showConfirmationModal(task, confidence);

        if (!confirmed) {
          return {
            results,
            status: 'cancelled_by_user',
            completedTasks: i
          };
        }

        // User might have modified parameters
        task = await this.getModifiedTask();
      }

      // Execute agent
      const result = await this.executeAgent(task);
      results.push(result);

      // Update session memory
      this.updateSessionMemory(task, result);

      // Show result in chat
      await this.displayResult(result);

      // Check if next task should be triggered
      if (i < tasks.length - 1) {
        const shouldContinue = await this.checkContinuation(result, tasks[i + 1]);
        if (!shouldContinue) break;
      }
    }

    return { results, status: 'completed' };
  }

  private async showConfirmationModal(
    task: AgentTask,
    confidence: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new AgentConfirmationModal({
        agent: task.agent,
        confidence,
        parameters: task.parameters,
        context: this.currentSession.getContext(),
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        onModify: (params) => {
          task.parameters = params;
          resolve(true);
        }
      });

      modal.show();
    });
  }
}
```

---

## Context Extraction from Artifacts

### Artifact Extraction Service

```typescript
interface Artifact {
  id: string;
  type: 'research' | 'image' | 'music' | 'document';
  content: any;
  metadata: {
    created: Date;
    agent: string;
    query: string;
  };
}

class ArtifactExtractionService {
  // Extract relevant data from research for image generation
  extractForImage(researchArtifact: Artifact): ImageContext {
    const research = researchArtifact.content;

    return {
      visualElements: this.extractVisualConcepts(research.facts),
      labels: this.extractGermanLabels(research.terms),
      scientificAccuracy: research.citations,
      complexity: research.gradeLevel,
      keyFacts: research.facts.slice(0, 5), // Top 5 facts
    };
  }

  // Extract from research for music
  extractForMusic(researchArtifact: Artifact): MusicContext {
    const research = researchArtifact.content;

    return {
      factualContent: research.facts,
      keyTerms: research.terms,
      rhymeWords: this.findRhymableWords(research.terms),
      memoryHooks: this.createMemoryHooks(research.facts),
      gradeLevel: research.gradeLevel,
    };
  }

  // Generic extraction for any agent
  extractRelevantContext(
    artifacts: Artifact[],
    targetAgent: string
  ): ExtractedContext {
    const relevant = artifacts.filter(a =>
      this.isRelevantForAgent(a, targetAgent)
    );

    return {
      primary: relevant[0] ? this.extractPrimary(relevant[0], targetAgent) : null,
      secondary: relevant.slice(1).map(a => this.extractSecondary(a)),
      sessionQuery: this.currentSession.originalQuery,
    };
  }
}
```

---

## Session Memory Management

### Session Memory Structure

```typescript
class SessionMemory {
  private sessionId: string;
  private startTime: Date;
  private artifacts: Map<string, Artifact>;
  private executionHistory: AgentExecution[];
  private userPreferences: UserPreferences;

  constructor(userId: string) {
    this.sessionId = generateSessionId();
    this.startTime = new Date();
    this.artifacts = new Map();
    this.executionHistory = [];
    this.loadUserPreferences(userId);
  }

  // Add artifact from agent execution
  addArtifact(agentResult: AgentResult): void {
    const artifact: Artifact = {
      id: generateId(),
      type: agentResult.type,
      content: agentResult.data,
      metadata: {
        created: new Date(),
        agent: agentResult.agent,
        query: agentResult.originalQuery
      }
    };

    this.artifacts.set(artifact.id, artifact);
    this.addToHistory(agentResult);
  }

  // Get context for next agent
  getContextForAgent(agentType: string): AgentContext {
    const relevantArtifacts = this.findRelevantArtifacts(agentType);
    const lastExecution = this.getLastExecution();

    return {
      artifacts: relevantArtifacts,
      lastAction: lastExecution,
      sessionQuery: this.getOriginalQuery(),
      userPreferences: this.userPreferences,
      suggestions: this.generateSuggestions(agentType)
    };
  }

  // Check for duplicate queries
  checkDuplicateQuery(query: string): DuplicateCheck {
    const normalized = this.normalizeQuery(query);
    const similar = this.executionHistory.find(e =>
      this.similarity(e.query, normalized) > 0.9
    );

    if (similar) {
      return {
        isDuplicate: true,
        previousResult: similar.result,
        timestamp: similar.timestamp,
        suggestion: "Möchten Sie die vorherige Recherche verwenden oder neu recherchieren?"
      };
    }

    return { isDuplicate: false };
  }
}
```

---

## User Confirmation Patterns

### Smart Confirmation Rules

```typescript
class ConfirmationRules {
  // Determine what needs user input
  static getRequiredConfirmations(
    agent: string,
    context: AgentContext
  ): ConfirmationRequirement[] {
    const requirements: ConfirmationRequirement[] = [];

    switch(agent) {
      case 'research':
        if (!context.topic) {
          requirements.push({
            field: 'topic',
            question: 'Zu welchem Thema soll recherchiert werden?',
            type: 'text',
            required: true
          });
        }
        if (!context.gradeLevel && context.confidence < 80) {
          requirements.push({
            field: 'gradeLevel',
            question: 'Für welche Klassenstufe?',
            type: 'select',
            options: ['1-4', '5-6', '7-8', '9-10', '11-13'],
            required: false
          });
        }
        break;

      case 'image':
        if (!context.style && context.confidence < 85) {
          requirements.push({
            field: 'style',
            question: 'Welcher Bildstil?',
            type: 'select',
            options: ['Diagramm', 'Illustration', 'Realistisch', 'Cartoon'],
            required: false,
            default: 'auto'
          });
        }
        break;

      case 'music':
        // Always ask for music preferences
        requirements.push({
          field: 'style',
          question: 'Welcher Musikstil?',
          type: 'select',
          options: ['Pop', 'Rock', 'Klassisch', 'Rap', 'Kinder'],
          required: true
        });
        requirements.push({
          field: 'duration',
          question: 'Wie lang soll der Song sein?',
          type: 'select',
          options: ['30 Sekunden', '2 Minuten', '4 Minuten'],
          required: false,
          default: '2 Minuten'
        });
        break;
    }

    return requirements;
  }
}
```

---

## Cost Monitoring (Admin Only)

### Cost Tracking Service

```typescript
class CostMonitoringService {
  private adminOnly: boolean = true;

  // Track per user and feature
  async trackExecution(
    userId: string,
    agent: string,
    cost: number,
    metadata: any
  ): Promise<void> {
    await db.transaction([
      db.tx.agent_usage.create({
        userId,
        agent,
        cost,
        timestamp: Date.now(),
        sessionId: this.currentSession.id,
        metadata
      })
    ]);

    // Update admin dashboard
    if (this.isAdmin(userId)) {
      await this.updateAdminDashboard({
        totalToday: await this.getTodayTotal(),
        byAgent: await this.getCostByAgent(),
        byUser: await this.getCostByUser()
      });
    }
  }

  // No limits for now, just monitoring
  async checkLimits(userId: string): Promise<LimitCheck> {
    return {
      hasLimit: false,
      canProceed: true,
      message: null
    };
  }
}
```

---

## Implementation Examples

### Example 1: Research + Image Workflow

```typescript
// User: "Recherchiere Photosynthese und erstelle ein Bild"

// Step 1: Parse into sequential tasks
const tasks = [
  {
    agent: 'research',
    confidence: 92,  // High - clear intent
    parameters: { topic: 'Photosynthese' }
  },
  {
    agent: 'image',
    confidence: 75,  // Medium - needs style confirmation
    parameters: { base: 'from_research' }
  }
];

// Step 2: Execute Research (auto because confidence > 90)
const researchResult = await executeResearch(tasks[0]);

// Step 3: Show Image Confirmation (confidence < 85)
const imageConfirmation = await showModal({
  title: 'Bild-Generierung bestätigen',
  context: researchResult.preview,
  parameters: {
    style: 'Diagramm',  // Suggested
    labels: 'Deutsch',
    complexity: 'Mittel'
  }
});

// Step 4: Execute if confirmed
if (imageConfirmation.confirmed) {
  const imageResult = await executeImage({
    ...tasks[1],
    context: extractForImage(researchResult)
  });
}
```

### Example 2: Music Generation with User Input

```typescript
// User: "Mache einen Song über das Einmaleins"

// Always ask for music details
const musicConfirmation = await showModal({
  title: 'Song-Details festlegen',
  confidence: 70,
  parameters: {
    content: '7er-Reihe',
    style: null,  // User must choose
    duration: '2 Minuten',
    tempo: 'medium'
  },
  requiredFields: ['style', 'content']
});

// Generate with user preferences
if (musicConfirmation.confirmed) {
  await executeMusic(musicConfirmation.parameters);
}
```

---

## Key Implementation Notes

1. **Always Sequential**: Even if technically possible to parallelize, we execute one by one
2. **Confirmation Modals**: Consistent UI pattern, reusable component
3. **Context Passing**: Previous agent results available for extraction
4. **Session Memory**: Lives for chat session, separate from long-term
5. **No Hard Limits**: Monitor costs but don't block users (admin visibility)
6. **Extensibility**: All patterns designed to accommodate future agents

---

**Next Steps**:
1. Implement base `AgentConfirmationModal` component
2. Create `SequentialWorkflowController`
3. Build confidence calculators per agent
4. Setup session memory system
5. Integrate with existing chat UI