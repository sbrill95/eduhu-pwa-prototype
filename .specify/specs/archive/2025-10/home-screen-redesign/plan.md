# Home Screen Redesign - Technical Plan

**Feature**: Custom Prompt Tiles
**Created**: 2025-10-01
**Status**: Technical Planning
**Related**: [spec.md](spec.md)

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Home View                                            │  │
│  │  └─ PromptTilesGrid Component                        │  │
│  │     └─ PromptTile Component (x4-6)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ API Call                          │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Hook: usePromptSuggestions()                        │  │
│  │  - Fetches prompts on mount                          │  │
│  │  - Handles refresh                                    │  │
│  │  - Caching (React Query or useMemo)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP POST
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                      Backend API                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  POST /api/prompts/generate-suggestions              │ │
│  │  ├─ Fetch User Profile (InstantDB)                   │ │
│  │  ├─ Fetch Manual Context (InstantDB)                 │ │
│  │  ├─ Generate Prompts (Template Engine)               │ │
│  │  └─ Return PromptSuggestion[]                        │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
                          │
                          │ Query
                          │
┌─────────────────────────▼─────────────────────────────────┐
│                    InstantDB                               │
│  - teacher_profiles (user_id, fach, klassenstufe, ...)    │
│  - context_items (manual context)                         │
└───────────────────────────────────────────────────────────┘
```

---

## 🗄️ Data Model

### Frontend Types

```typescript
// teacher-assistant/frontend/src/lib/types.ts

export interface PromptSuggestion {
  id: string; // UUID v4
  title: string; // "Erstelle ein Mathe-Quiz"
  description: string; // "Bruchrechnung für 7. Klasse"
  prompt: string; // Full prompt text for chat
  category: PromptCategory;
  icon: string; // Ionic icon name (e.g., 'calculatorOutline')
  color: string; // Hex color (e.g., '#FB6542')
  estimatedTime: string; // "2-3 Minuten"
  metadata?: {
    templateId?: string; // Which template was used
    personalized: boolean; // Is this context-based?
  };
}

export type PromptCategory =
  | 'quiz'
  | 'worksheet'
  | 'lesson-plan'
  | 'image'
  | 'search'
  | 'explanation'
  | 'other';

export interface PromptSuggestionsResponse {
  suggestions: PromptSuggestion[];
  generatedAt: string; // ISO timestamp
  seed: string; // Seed used for randomization (date-based)
}
```

### Backend Types

```typescript
// teacher-assistant/backend/src/types/index.ts

export interface GeneratePromptsRequest {
  userId: string;
  limit?: number; // Default: 6
  excludeIds?: string[]; // Recently used prompts to exclude
  seed?: string; // For reproducibility (default: current date)
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  promptTemplate: string; // With placeholders like {{fach}}, {{klasse}}
  category: PromptCategory;
  icon: string;
  color: string;
  estimatedTime: string;
  requiresContext: string[]; // ['fach', 'klassenstufe']
  weight: number; // For randomization (higher = more likely)
}
```

---

## 🔧 Backend Implementation

### 1. Prompt Templates (Static Data)

**File**: `backend/src/data/promptTemplates.ts`

```typescript
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'quiz-basic',
    title: 'Erstelle ein Quiz',
    description: '{{fach}} für {{klassenstufe}}. Klasse',
    promptTemplate: 'Erstelle ein Quiz für {{fach}}, {{klassenstufe}}. Klasse zum Thema {{topic}}. Das Quiz soll 10 Fragen enthalten mit Multiple Choice Antworten.',
    category: 'quiz',
    icon: 'helpCircleOutline',
    color: '#FB6542',
    estimatedTime: '2-3 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 10
  },
  {
    id: 'worksheet-exercises',
    title: 'Erstelle Arbeitsblatt',
    description: 'Übungsaufgaben für {{fach}}',
    promptTemplate: 'Erstelle ein Arbeitsblatt mit Übungsaufgaben für {{fach}}, {{klassenstufe}}. Klasse. Schwierigkeitsgrad: mittel. Format: PDF-ready.',
    category: 'worksheet',
    icon: 'documentTextOutline',
    color: '#FFBB00',
    estimatedTime: '3-4 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 8
  },
  {
    id: 'image-generation',
    title: 'Erstelle ein Bild',
    description: 'Visuelles Material für Unterricht',
    promptTemplate: 'Erstelle ein illustratives Bild für {{fach}}-Unterricht, {{klassenstufe}}. Klasse. Stil: pädagogisch, klar, ansprechend.',
    category: 'image',
    icon: 'imageOutline',
    color: '#4CAF50',
    estimatedTime: '1-2 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 6
  },
  {
    id: 'lesson-plan',
    title: 'Erstelle Unterrichtsplan',
    description: 'Strukturierte Stundenvorbereitung',
    promptTemplate: 'Erstelle einen Unterrichtsplan für {{fach}}, {{klassenstufe}}. Klasse, Dauer: 45 Minuten. Thema: {{topic}}. Inklusive: Einstieg, Erarbeitung, Sicherung.',
    category: 'lesson-plan',
    icon: 'calendarOutline',
    color: '#9C27B0',
    estimatedTime: '4-5 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 7
  },
  {
    id: 'web-search',
    title: 'Suche Materialien',
    description: 'Aktuelle Ressourcen finden',
    promptTemplate: 'Suche im Web nach aktuellen Unterrichtsmaterialien für {{fach}}, {{klassenstufe}}. Klasse zum Thema {{topic}}.',
    category: 'search',
    icon: 'searchOutline',
    color: '#2196F3',
    estimatedTime: '1-2 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 5
  },
  {
    id: 'explanation',
    title: 'Erkläre ein Konzept',
    description: 'Schülergerechte Erklärung',
    promptTemplate: 'Erkläre {{topic}} für {{klassenstufe}}. Klasse im Fach {{fach}}. Nutze einfache Sprache und Beispiele.',
    category: 'explanation',
    icon: 'bulbOutline',
    color: '#FF9800',
    estimatedTime: '1-2 Minuten',
    requiresContext: ['fach', 'klassenstufe'],
    weight: 6
  }
];
```

### 2. Prompt Generation Service

**File**: `backend/src/services/promptService.ts`

```typescript
import { PROMPT_TEMPLATES } from '../data/promptTemplates';
import { GeneratePromptsRequest, PromptSuggestion, PromptTemplate } from '../types';
import db from '../config/instantdb';

export class PromptService {
  /**
   * Generate personalized prompt suggestions for a user
   */
  async generateSuggestions(req: GeneratePromptsRequest): Promise<PromptSuggestion[]> {
    const { userId, limit = 6, excludeIds = [], seed } = req;

    // 1. Fetch user profile
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    // 2. Fetch manual context (optional enhancement)
    const contextItems = await this.getManualContext(userId);

    // 3. Filter templates based on profile
    const eligibleTemplates = PROMPT_TEMPLATES.filter(template => {
      // Check if user has required context
      return template.requiresContext.every(key => profile[key]);
    });

    // 4. Weighted random selection
    const selectedTemplates = this.selectTemplates(
      eligibleTemplates,
      limit,
      seed || new Date().toISOString().split('T')[0] // Use date as seed
    );

    // 5. Fill templates with user data
    const suggestions: PromptSuggestion[] = selectedTemplates.map(template =>
      this.fillTemplate(template, profile, contextItems)
    );

    return suggestions;
  }

  /**
   * Fetch user profile from InstantDB
   */
  private async getUserProfile(userId: string) {
    const { data } = await db.query({
      teacher_profiles: {
        $: { where: { user_id: userId } }
      }
    });

    return data?.teacher_profiles?.[0] || null;
  }

  /**
   * Fetch manual context items (optional)
   */
  private async getManualContext(userId: string) {
    const { data } = await db.query({
      context_items: {
        $: { where: { user_id: userId } }
      }
    });

    return data?.context_items || [];
  }

  /**
   * Weighted random template selection
   */
  private selectTemplates(
    templates: PromptTemplate[],
    limit: number,
    seed: string
  ): PromptTemplate[] {
    // Seeded shuffle for reproducibility (same seed = same order)
    const shuffled = this.seededShuffle([...templates], seed);

    // Weighted selection
    const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
    const selected: PromptTemplate[] = [];

    for (let i = 0; i < Math.min(limit, shuffled.length); i++) {
      selected.push(shuffled[i]);
    }

    return selected;
  }

  /**
   * Fill template placeholders with user data
   */
  private fillTemplate(
    template: PromptTemplate,
    profile: any,
    contextItems: any[]
  ): PromptSuggestion {
    let filledPrompt = template.promptTemplate;
    let filledTitle = template.title;
    let filledDescription = template.description;

    // Replace placeholders
    const replacements: Record<string, string> = {
      '{{fach}}': profile.fach || 'Mathematik',
      '{{klassenstufe}}': profile.klassenstufe || '7',
      '{{schultyp}}': profile.schultyp || 'Gymnasium',
      '{{topic}}': this.getRandomTopic(profile.fach) // Fallback topic
    };

    for (const [key, value] of Object.entries(replacements)) {
      filledPrompt = filledPrompt.replace(new RegExp(key, 'g'), value);
      filledTitle = filledTitle.replace(new RegExp(key, 'g'), value);
      filledDescription = filledDescription.replace(new RegExp(key, 'g'), value);
    }

    return {
      id: `${template.id}-${Date.now()}`,
      title: filledTitle,
      description: filledDescription,
      prompt: filledPrompt,
      category: template.category,
      icon: template.icon,
      color: template.color,
      estimatedTime: template.estimatedTime,
      metadata: {
        templateId: template.id,
        personalized: true
      }
    };
  }

  /**
   * Get a random topic based on subject (fallback)
   */
  private getRandomTopic(fach?: string): string {
    const topics: Record<string, string[]> = {
      'Mathematik': ['Bruchrechnung', 'Geometrie', 'Algebra', 'Prozentrechnung'],
      'Deutsch': ['Grammatik', 'Aufsatz schreiben', 'Literaturanalyse'],
      'Englisch': ['Present Perfect', 'Vokabeln', 'Textverständnis'],
      'Biologie': ['Zellbiologie', 'Ökosysteme', 'Genetik']
    };

    const subjectTopics = topics[fach || 'Mathematik'] || topics['Mathematik'];
    return subjectTopics[Math.floor(Math.random() * subjectTopics.length)];
  }

  /**
   * Seeded shuffle for reproducibility
   */
  private seededShuffle<T>(array: T[], seed: string): T[] {
    let currentIndex = array.length;
    let randomIndex: number;

    // Simple hash function for seed
    const hashCode = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    let seedValue = hashCode(seed);

    // Seeded random generator
    const seededRandom = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };

    while (currentIndex > 0) {
      randomIndex = Math.floor(seededRandom() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
  }
}

export const promptService = new PromptService();
```

### 3. API Route

**File**: `backend/src/routes/prompts.ts`

```typescript
import express from 'express';
import { promptService } from '../services/promptService';

const router = express.Router();

/**
 * POST /api/prompts/generate-suggestions
 * Generate personalized prompt suggestions for current user
 */
router.post('/generate-suggestions', async (req, res) => {
  try {
    const userId = req.user?.id; // From auth middleware
    if (!userId) {
      return res.status(401).json({ error: 'Nicht autorisiert' });
    }

    const { limit, excludeIds, seed } = req.body;

    const suggestions = await promptService.generateSuggestions({
      userId,
      limit,
      excludeIds,
      seed
    });

    res.json({
      suggestions,
      generatedAt: new Date().toISOString(),
      seed: seed || new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error generating prompts:', error);
    res.status(500).json({
      error: 'Fehler beim Generieren der Vorschläge',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

**Register in** `backend/src/routes/index.ts`:
```typescript
import promptsRouter from './prompts';
app.use('/api/prompts', promptsRouter);
```

---

## 🎨 Frontend Implementation

### 1. Custom Hook: usePromptSuggestions

**File**: `frontend/src/hooks/usePromptSuggestions.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import type { PromptSuggestion } from '../lib/types';

export interface UsePromptSuggestionsResult {
  suggestions: PromptSuggestion[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePromptSuggestions(): UsePromptSuggestionsResult {
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/prompts/generate-suggestions', {
        limit: 6
      });

      setSuggestions(response.data.suggestions);
    } catch (err) {
      console.error('Error fetching prompt suggestions:', err);
      setError('Fehler beim Laden der Vorschläge');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    refresh: fetchSuggestions
  };
}
```

### 2. PromptTile Component

**File**: `frontend/src/components/PromptTile.tsx`

```typescript
import React from 'react';
import { IonIcon, IonCard, IonCardContent } from '@ionic/react';
import * as icons from 'ionicons/icons';
import type { PromptSuggestion } from '../lib/types';

interface PromptTileProps {
  suggestion: PromptSuggestion;
  onClick: (prompt: string) => void;
}

export const PromptTile: React.FC<PromptTileProps> = ({ suggestion, onClick }) => {
  const iconName = icons[suggestion.icon as keyof typeof icons] || icons.helpCircleOutline;

  return (
    <IonCard
      className="prompt-tile cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg"
      onClick={() => onClick(suggestion.prompt)}
      style={{ borderLeft: `4px solid ${suggestion.color}` }}
    >
      <IonCardContent className="p-4">
        {/* Header with Icon and Category */}
        <div className="flex justify-between items-start mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
               style={{ backgroundColor: `${suggestion.color}20` }}>
            <IonIcon icon={iconName} className="text-2xl" style={{ color: suggestion.color }} />
          </div>
          <span className="text-xs uppercase font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            {suggestion.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2 text-gray-900">
          {suggestion.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3">
          {suggestion.description}
        </p>

        {/* Estimated Time */}
        <div className="flex items-center text-xs text-gray-500">
          <IonIcon icon={icons.timeOutline} className="mr-1" />
          {suggestion.estimatedTime}
        </div>
      </IonCardContent>
    </IonCard>
  );
};
```

### 3. PromptTilesGrid Component

**File**: `frontend/src/components/PromptTilesGrid.tsx`

```typescript
import React from 'react';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';
import { PromptTile } from './PromptTile';
import type { PromptSuggestion } from '../lib/types';

interface PromptTilesGridProps {
  suggestions: PromptSuggestion[];
  loading: boolean;
  error: string | null;
  onPromptClick: (prompt: string) => void;
  onRefresh: () => void;
}

export const PromptTilesGrid: React.FC<PromptTilesGridProps> = ({
  suggestions,
  loading,
  error,
  onPromptClick,
  onRefresh
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <IonSpinner name="crescent" />
        <span className="ml-3 text-gray-600">Lade Vorschläge...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <IonButton onClick={onRefresh} fill="outline">
          <IonIcon slot="start" icon={refreshOutline} />
          Erneut versuchen
        </IonButton>
      </div>
    );
  }

  return (
    <div className="prompt-tiles-container">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Vorschläge für dich
        </h2>
        <IonButton onClick={onRefresh} fill="clear" size="small">
          <IonIcon slot="icon-only" icon={refreshOutline} />
        </IonButton>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((suggestion) => (
          <PromptTile
            key={suggestion.id}
            suggestion={suggestion}
            onClick={onPromptClick}
          />
        ))}
      </div>
    </div>
  );
};
```

### 4. Integration in Home View

**File**: `frontend/src/pages/Home/Home.tsx`

```typescript
import React from 'react';
import { usePromptSuggestions } from '../../hooks/usePromptSuggestions';
import { PromptTilesGrid } from '../../components/PromptTilesGrid';

interface HomeProps {
  onNavigateToChat: (prefilledPrompt?: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigateToChat }) => {
  const { suggestions, loading, error, refresh } = usePromptSuggestions();

  const handlePromptClick = (prompt: string) => {
    // Navigate to chat tab with pre-filled prompt
    onNavigateToChat(prompt);
  };

  return (
    <div className="home-view p-4">
      <PromptTilesGrid
        suggestions={suggestions}
        loading={loading}
        error={error}
        onPromptClick={handlePromptClick}
        onRefresh={refresh}
      />
    </div>
  );
};

export default Home;
```

### 5. Update App.tsx for Navigation

**File**: `frontend/src/App.tsx`

Add state for pre-filled prompt:
```typescript
const [prefilledChatPrompt, setPrefilledChatPrompt] = useState<string | null>(null);

const handleNavigateToChat = (prompt?: string) => {
  if (prompt) {
    setPrefilledChatPrompt(prompt);
  }
  setActiveTab('chat');
};

// Pass to Home component
<Home onNavigateToChat={handleNavigateToChat} />

// Pass to ChatView
<ChatView
  sessionId={currentChatSessionId}
  prefilledPrompt={prefilledChatPrompt}
  onClearPrefill={() => setPrefilledChatPrompt(null)}
/>
```

---

## 🧪 Testing Strategy

### Unit Tests

**Backend**:
- `promptService.test.ts`:
  - ✅ Template selection with seed (reproducibility)
  - ✅ Placeholder replacement (fach, klasse, topic)
  - ✅ Weighted randomization
  - ✅ Error handling (no profile)

**Frontend**:
- `usePromptSuggestions.test.ts`:
  - ✅ Fetches suggestions on mount
  - ✅ Refresh functionality
  - ✅ Error handling
  - ✅ Loading states

- `PromptTile.test.tsx`:
  - ✅ Renders suggestion data
  - ✅ Click handler called with prompt
  - ✅ Icon and color rendering

- `PromptTilesGrid.test.tsx`:
  - ✅ Grid layout renders correctly
  - ✅ Loading state
  - ✅ Error state with retry button

### Integration Tests

- API Integration:
  - ✅ `/api/prompts/generate-suggestions` returns 6 prompts
  - ✅ Prompts are personalized based on profile
  - ✅ Seed produces same order

- Frontend Integration:
  - ✅ Click tile → Navigate to chat
  - ✅ Prompt is pre-filled in chat input
  - ✅ Refresh updates grid

### E2E Tests (Playwright)

- Happy Path:
  1. Login → See Home Screen
  2. Home Screen shows 6 prompt tiles
  3. Click tile → Navigate to Chat
  4. Chat shows pre-filled prompt
  5. Can edit and submit prompt

---

## 🚀 Deployment Plan

### Phase 1: Backend (1 day)
1. Create prompt templates data file
2. Implement PromptService
3. Create API route
4. Unit tests
5. Deploy to staging

### Phase 2: Frontend (1 day)
1. Create usePromptSuggestions hook
2. Create PromptTile component
3. Create PromptTilesGrid component
4. Integrate in Home view
5. Update navigation in App.tsx
6. Unit tests

### Phase 3: Integration & Polish (0.5 days)
1. Integration tests
2. Visual polish (animations, hover states)
3. Mobile testing
4. QA approval

### Phase 4: Deployment (0.5 days)
1. Deploy backend to production
2. Deploy frontend to production
3. Smoke tests
4. Monitor analytics

**Total**: 2-3 days

---

## 📊 Success Metrics

- Click-Through-Rate: 70%+ users click at least 1 tile
- Time-to-First-Interaction: < 3 seconds after home load
- Prompt Usage Rate: 60%+ of clicked prompts are submitted
- Error Rate: < 1%

---

## 🔄 Future Enhancements

- AI-generated prompts (OpenAI prompt generation)
- User feedback ("War das hilfreich?")
- Favorite tiles (bookmarking)
- Adaptive learning (better suggestions over time)

---

**Status**: ✅ Ready for Implementation
**Next Step**: Create `tasks.md`

---

**Created**: 2025-10-01
**Author**: General-Purpose Agent
