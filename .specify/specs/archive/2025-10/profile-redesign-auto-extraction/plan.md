# Technical Plan: Profile Redesign with Auto-Extraction

**Feature**: Smart Profile Auto-Extraction
**Version**: 1.0
**Date**: 2025-10-03

---

## 1. Architecture Overview

### System Components

```
┌────────────────────────────────────────────────────────────────┐
│                          Frontend                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │  ProfileView    │  │  ChatView       │  │  AddTagModal   │ │
│  │  (display tags) │  │  (trigger)      │  │  (manual add)  │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬───────┘ │
│           │                     │                     │         │
│           └─────────────────────┴─────────────────────┘         │
│                                 │                               │
│                                 ▼                               │
│                   ┌──────────────────────────┐                  │
│                   │  useProfileCharacteristics│                 │
│                   │  (custom hook)            │                 │
│                   └─────────────┬─────────────┘                 │
└─────────────────────────────────┼──────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────┐
│                          Backend                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  POST /api/profile/extract                               │  │
│  │  - Triggered after each chat (≥2-3 messages)             │  │
│  │  - Extracts 2-3 characteristics via OpenAI               │  │
│  │  - Increments count for each characteristic              │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  profileExtractionService.ts                             │  │
│  │  - extractCharacteristics(chatMessages, existingProfile) │  │
│  │  - categorizeCharacteristic(text)                        │  │
│  │  - incrementCharacteristicCount(userId, characteristic)  │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   OpenAI ChatGPT     │
              │   (gpt-4o-mini)      │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │     InstantDB        │
              │  profile_characteristics│
              └──────────────────────┘
```

---

## 2. Database Schema

### New InstantDB Table: `profile_characteristics`

```typescript
// teacher-assistant/backend/src/schemas/instantdb.ts

export const instantDBSchema = {
  // ... existing tables

  profile_characteristics: {
    id: string,
    user_id: string,
    characteristic: string,        // e.g., "Mathematik", "SOL", "Gruppenarbeit"
    category: string,               // "subjects" | "gradeLevel" | "teachingStyle" | "schoolType" | "topics" | "uncategorized"
    count: number,                  // How many times this was mentioned
    first_seen: date,               // When first extracted
    last_seen: date,                // When last mentioned
    manually_added: boolean,        // true if user added manually
    created_at: date,
    updated_at: date,
  }
}
```

**Indexes**:
- `user_id` (for querying user's characteristics)
- `user_id + characteristic` (unique constraint - prevent duplicates)
- `count` (for filtering count >= 3)

**Migration Notes**:
- Existing profile data migration script (optional for MVP)
- Default `manually_added: false`

---

## 3. Backend Implementation

### 3.1 Profile Extraction Service

**Location**: `teacher-assistant/backend/src/services/profileExtractionService.ts`

```typescript
import { openai } from '../config/openai';
import { instantdbService } from './instantdbService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ProfileCharacteristic {
  characteristic: string;
  category: string;
}

export class ProfileExtractionService {
  /**
   * Extracts 2-3 profile characteristics from a chat conversation
   * @param userId - User ID
   * @param messages - Chat messages
   * @param existingProfile - User's existing profile characteristics
   * @returns Array of extracted characteristics
   */
  async extractCharacteristics(
    userId: string,
    messages: ChatMessage[],
    existingProfile: ProfileCharacteristic[]
  ): Promise<ProfileCharacteristic[]> {
    const prompt = this.buildExtractionPrompt(messages, existingProfile);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Experte darin, Lehrerprofil-Merkmale aus Gesprächen zu extrahieren.
Extrahiere 2-3 relevante, wiederkehrende Merkmale.
Ignoriere einmalige Erwähnungen (z.B. "Arbeitsblatt" nur weil eins generiert wurde).
Fokus: Fächer, Prinzipien, Klassenstufen, Schultyp, wiederkehrende Themen.
Antworte NUR mit JSON Array: ["Merkmal1", "Merkmal2", ...]`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      });

      const content = response.choices[0].message.content?.trim() || '[]';
      const characteristics: string[] = JSON.parse(content);

      // Categorize and store
      const categorized = await Promise.all(
        characteristics.map(async (char) => {
          const category = await this.categorizeCharacteristic(char);
          return { characteristic: char, category };
        })
      );

      // Increment counts in database
      await this.updateCharacteristicCounts(userId, categorized);

      return categorized;

    } catch (error) {
      console.error('Profile extraction failed:', error);
      return [];
    }
  }

  /**
   * Categorizes a characteristic into a profile category
   */
  private async categorizeCharacteristic(characteristic: string): Promise<string> {
    const prompt = `
Kategorisiere dieses Lehrerprofil-Merkmal:
"${characteristic}"

Kategorien:
- subjects: Unterrichtsfächer (Mathematik, Englisch, etc.)
- gradeLevel: Klassenstufen (Klasse 5, Sekundarstufe I, etc.)
- teachingStyle: Unterrichtsmethoden (Gruppenarbeit, Differenzierung, etc.)
- schoolType: Schulform (Gymnasium, Realschule, etc.)
- topics: Wiederkehrende Themen (Bruchrechnung, Photosynthese, etc.)
- uncategorized: Nicht zuordenbar

Antworte NUR mit der Kategorie (ein Wort).
    `.trim();

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Du bist ein Kategorisierungs-Experte.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 10,
        temperature: 0.2,
      });

      const category = response.choices[0].message.content?.trim() || 'uncategorized';

      // Validate category
      const validCategories = ['subjects', 'gradeLevel', 'teachingStyle', 'schoolType', 'topics', 'uncategorized'];
      return validCategories.includes(category) ? category : 'uncategorized';

    } catch (error) {
      console.error('Categorization failed:', error);
      return 'uncategorized';
    }
  }

  /**
   * Updates characteristic counts in database
   */
  private async updateCharacteristicCounts(
    userId: string,
    characteristics: ProfileCharacteristic[]
  ): Promise<void> {
    for (const { characteristic, category } of characteristics) {
      await instantdbService.incrementProfileCharacteristic(userId, characteristic, category);
    }
  }

  /**
   * Builds prompt for extraction
   */
  private buildExtractionPrompt(
    messages: ChatMessage[],
    existingProfile: ProfileCharacteristic[]
  ): string {
    const conversation = messages
      .map(m => `${m.role === 'user' ? 'Lehrer' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const existing = existingProfile
      .map(p => p.characteristic)
      .join(', ');

    return `
Konversation:
${conversation}

Bestehende Profil-Merkmale:
${existing || 'Keine'}

Extrahiere 2-3 neue oder wiederkehrende Merkmale aus dieser Konversation.
Fokus: Fächer, Prinzipien, Klassenstufen, Schultyp, Themen.
Ignoriere Einzel-Erwähnungen wie "Arbeitsblatt" oder "Bild".

Beispiele guter Merkmale:
- "SOL" (wenn mehrfach erwähnt)
- "Klasse 7"
- "Gruppenarbeit"
- "Differenzierung"
- "Mathematik"

JSON Array (2-3 Merkmale):
    `.trim();
  }
}

export const profileExtractionService = new ProfileExtractionService();
```

### 3.2 InstantDB Service Extensions

**Location**: `teacher-assistant/backend/src/services/instantdbService.ts`

```typescript
// Add to existing InstantDBService class

/**
 * Increments (or creates) a profile characteristic count
 */
async incrementProfileCharacteristic(
  userId: string,
  characteristic: string,
  category: string
): Promise<void> {
  // Check if characteristic exists
  const existing = await db.profile_characteristics
    .where({ user_id: userId, characteristic })
    .first();

  if (existing) {
    // Increment count + update last_seen
    await db.profile_characteristics.update(existing.id, {
      count: existing.count + 1,
      last_seen: new Date(),
      updated_at: new Date(),
    });
  } else {
    // Create new
    await db.profile_characteristics.create({
      user_id: userId,
      characteristic,
      category,
      count: 1,
      first_seen: new Date(),
      last_seen: new Date(),
      manually_added: false,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
}

/**
 * Fetches user's profile characteristics (count >= threshold)
 */
async getProfileCharacteristics(
  userId: string,
  minCount: number = 3
): Promise<ProfileCharacteristic[]> {
  return db.profile_characteristics
    .where({ user_id: userId })
    .where('count', '>=', minCount)
    .orderBy('category', 'asc')
    .orderBy('count', 'desc')
    .get();
}

/**
 * Manually adds a characteristic (user input)
 */
async addManualCharacteristic(
  userId: string,
  characteristic: string
): Promise<void> {
  // Check if exists
  const existing = await db.profile_characteristics
    .where({ user_id: userId, characteristic })
    .first();

  if (existing) {
    // Increment count
    await db.profile_characteristics.update(existing.id, {
      count: existing.count + 1,
      updated_at: new Date(),
    });
  } else {
    // Create with count: 1, category: uncategorized (will be categorized later)
    await db.profile_characteristics.create({
      user_id: userId,
      characteristic,
      category: 'uncategorized',
      count: 1,
      first_seen: new Date(),
      last_seen: new Date(),
      manually_added: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
}
```

### 3.3 API Routes

**Location**: `teacher-assistant/backend/src/routes/profile.ts` (new file)

```typescript
import express from 'express';
import { profileExtractionService } from '../services/profileExtractionService';
import { instantdbService } from '../services/instantdbService';

const router = express.Router();

/**
 * POST /api/profile/extract
 * Triggered after chat ends (≥2-3 messages)
 */
router.post('/extract', async (req, res) => {
  try {
    const { userId, messages } = req.body;

    if (!userId || !messages || messages.length < 2) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Fetch existing profile
    const existingProfile = await instantdbService.getProfileCharacteristics(userId, 0); // Get all

    // Extract characteristics
    const extracted = await profileExtractionService.extractCharacteristics(
      userId,
      messages,
      existingProfile
    );

    res.json({ extracted, count: extracted.length });
  } catch (error) {
    console.error('Profile extraction error:', error);
    res.status(500).json({ error: 'Extraction failed' });
  }
});

/**
 * GET /api/profile/characteristics
 * Fetch user's profile characteristics (for display)
 */
router.get('/characteristics', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Fetch characteristics with count >= 3
    const characteristics = await instantdbService.getProfileCharacteristics(userId as string, 3);

    res.json({ characteristics });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * POST /api/profile/characteristics/add
 * Manually add a characteristic
 */
router.post('/characteristics/add', async (req, res) => {
  try {
    const { userId, characteristic } = req.body;

    if (!userId || !characteristic) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    await instantdbService.addManualCharacteristic(userId, characteristic);

    res.json({ success: true });
  } catch (error) {
    console.error('Manual characteristic add error:', error);
    res.status(500).json({ error: 'Failed to add characteristic' });
  }
});

/**
 * POST /api/profile/characteristics/categorize
 * Background job: Re-categorize uncategorized characteristics
 */
router.post('/characteristics/categorize', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Fetch uncategorized
    const uncategorized = await instantdbService.getProfileCharacteristics(userId, 0)
      .then(chars => chars.filter(c => c.category === 'uncategorized'));

    // Categorize each
    for (const char of uncategorized) {
      const category = await profileExtractionService.categorizeCharacteristic(char.characteristic);
      await db.profile_characteristics.update(char.id, { category });
    }

    res.json({ categorized: uncategorized.length });
  } catch (error) {
    console.error('Categorization error:', error);
    res.status(500).json({ error: 'Categorization failed' });
  }
});

export default router;
```

**Add to main routes** (`routes/index.ts`):
```typescript
import profileRoutes from './profile';

app.use('/api/profile', profileRoutes);
```

---

## 4. Frontend Implementation

### 4.1 Custom Hook: `useProfileCharacteristics`

**Location**: `teacher-assistant/frontend/src/hooks/useProfileCharacteristics.ts`

```typescript
import { useQuery, useMutation } from '@instantdb/react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export const useProfileCharacteristics = () => {
  const { user } = useAuth();

  // Fetch characteristics (count >= 3)
  const { data, isLoading, error, refetch } = useQuery(
    `/api/profile/characteristics?userId=${user?.id}`,
    {
      enabled: !!user?.id
    }
  );

  // Group by category for display
  const groupedCharacteristics = useMemo(() => {
    if (!data?.characteristics) return {};

    return data.characteristics.reduce((acc, char) => {
      const category = char.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(char);
      return acc;
    }, {} as Record<string, ProfileCharacteristic[]>);
  }, [data]);

  // Manual add mutation
  const addCharacteristic = async (characteristic: string) => {
    await api.post('/profile/characteristics/add', {
      userId: user?.id,
      characteristic
    });
    refetch();
  };

  return {
    characteristics: data?.characteristics || [],
    groupedCharacteristics,
    isLoading,
    error,
    addCharacteristic,
    refetch
  };
};
```

### 4.2 Trigger Extraction After Chat

**Location**: `teacher-assistant/frontend/src/components/ChatView.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { api } from '../lib/api';

export const ChatView = () => {
  const { messages, currentChatId } = useChat();
  const { user } = useAuth();
  const hasExtractedRef = useRef(false);

  useEffect(() => {
    // Cleanup: trigger extraction when user leaves chat
    return () => {
      if (!hasExtractedRef.current && messages.length >= 2) {
        extractProfile();
      }
    };
  }, []);

  const extractProfile = async () => {
    if (hasExtractedRef.current) return;
    hasExtractedRef.current = true;

    try {
      await api.post('/profile/extract', {
        userId: user?.id,
        messages: messages.slice(0, 10) // Send first 10 messages for context
      });
    } catch (error) {
      console.error('Profile extraction failed:', error);
    }
  };

  // ... rest of ChatView
}
```

### 4.3 Profile View (Gemini Design)

**Location**: `teacher-assistant/frontend/src/components/ProfileView.tsx`

```typescript
import { useState } from 'react';
import { useProfileCharacteristics } from '../hooks/useProfileCharacteristics';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const ProfileView = () => {
  const { groupedCharacteristics, isLoading, addCharacteristic } = useProfileCharacteristics();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    await addCharacteristic(newTag);
    setNewTag('');
    setShowAddModal(false);
  };

  // Category order for display
  const categoryOrder = ['subjects', 'gradeLevel', 'teachingStyle', 'schoolType', 'topics', 'uncategorized'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-primary">Dein Profil</h1>
        <p className="text-sm text-gray-600 mt-1">
          Passe an, wie eduhu dich unterstützt.
        </p>
      </div>

      {/* Profile Sync Indicator */}
      <div className="bg-background-teal mx-4 mt-4 p-6 rounded-2xl relative overflow-hidden">
        {/* Confetti dots decoration */}
        <div className="absolute inset-0 opacity-40">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative text-center">
          <p className="text-xs font-medium text-gray-600 mb-2">
            DEIN PROFIL-SYNC
          </p>
          <div className="text-6xl font-bold text-gray-800">60%</div>
          <p className="text-sm text-gray-600 mt-2">Lernt dich kennen</p>
        </div>

        {/* Wave decoration */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 300 60">
          <path
            d="M0,30 Q75,10 150,30 T300,30 L300,60 L0,60 Z"
            fill="#FB6542"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Encouraging Microcopy */}
      <p className="text-sm text-gray-600 text-center px-6 mt-4">
        Je mehr du mit eduhu interagierst, desto besser werden die Vorschläge.
      </p>

      {/* Learned Characteristics */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Gelernte Merkmale
        </h2>

        {isLoading ? (
          <div className="text-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {categoryOrder.map(category => {
              const chars = groupedCharacteristics[category];
              if (!chars || chars.length === 0) return null;

              return (
                <div key={category} className="flex flex-wrap gap-2">
                  {chars.map(char => (
                    <div
                      key={char.id}
                      className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-2"
                    >
                      <SparklesIcon className="w-4 h-4 text-primary" />
                      <span className="text-sm text-gray-800">
                        {char.characteristic}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Characteristic Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full mt-4 bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary-600 transition"
        >
          Merkmal hinzufügen +
        </button>
      </div>

      {/* General Info Section */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Allgemeine Informationen
        </h2>
        <div className="bg-white rounded-xl p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500">E-Mail</label>
            <p className="text-sm text-gray-800">{user?.email || 'Nicht angegeben'}</p>
          </div>
          {user?.name && (
            <div>
              <label className="text-xs text-gray-500">Name</label>
              <p className="text-sm text-gray-800">{user.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Tag Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Merkmal hinzufügen</h3>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="z.B. Projektbasiertes Lernen"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddTag}
                className="flex-1 bg-primary text-white py-3 rounded-xl"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 5. Testing Strategy

### 5.1 Unit Tests

**Backend**:
- `profileExtractionService.test.ts`:
  - ✅ Extracts 2-3 characteristics from chat
  - ✅ Handles empty/short chats gracefully
  - ✅ Categorizes characteristics correctly
  - ✅ Increments counts properly
  - ✅ Avoids duplicates

**Frontend**:
- `useProfileCharacteristics.test.ts`:
  - ✅ Fetches and groups characteristics
  - ✅ Manual add works correctly
  - ✅ Handles loading/error states

### 5.2 Integration Tests

- `profile-extraction.integration.test.ts`:
  - ✅ End-to-end: Chat → Extraction → Database → Display
  - ✅ Frequency threshold works (count >= 3)
  - ✅ Manual tags auto-categorize on next load

### 5.3 E2E Tests (Playwright)

**Test Suite**: `profile-redesign.spec.ts`

```typescript
test('Profile displays auto-extracted characteristics', async ({ page }) => {
  // 1. Login
  // 2. Have 3 chats with "Mathematik" mentioned
  // 3. Navigate to Profile
  // 4. Screenshot: profile-auto-extracted.png
  // 5. Verify "Mathematik" tag is visible
  // 6. Compare screenshot to Gemini mockup
});

test('Manual tag addition works', async ({ page }) => {
  // 1. Navigate to Profile
  // 2. Click "Merkmal hinzufügen +"
  // 3. Enter "Projektbasiertes Lernen"
  // 4. Screenshot: profile-manual-tag-added.png
  // 5. Verify tag appears immediately
  // 6. Reload page → verify tag is categorized
});

test('Profile matches Gemini mockup pixel-perfect', async ({ page }) => {
  const viewports = [
    { width: 375, height: 667, name: 'iphone-se' },
    { width: 390, height: 844, name: 'iphone-12' }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    // Screenshot: profile-gemini-${viewport.name}.png
    // Visual regression: compare to .specify/specs/Profil.png
  }
});

test('Frequency threshold filtering works', async ({ page }) => {
  // 1. Mock data: characteristic with count=2
  // 2. Verify NOT visible in profile
  // 3. Increment count to 3
  // 4. Verify NOW visible
  // 5. Screenshot: profile-frequency-threshold.png
});
```

---

## 6. Deployment Plan

### Phase 1: Backend
1. Deploy `profileExtractionService.ts`
2. Deploy profile routes (`/api/profile/*`)
3. Update InstantDB schema (add `profile_characteristics` table)
4. Smoke test extraction endpoint

### Phase 2: Frontend
1. Deploy `useProfileCharacteristics` hook
2. Deploy `ProfileView.tsx` (Gemini design)
3. Integrate extraction trigger in `ChatView.tsx`
4. Deploy manual tag modal

### Phase 3: Testing
1. Run Playwright E2E tests
2. Visual verification: screenshots vs. mockup
3. Manual QA: extraction accuracy
4. Monitor error rates

### Phase 4: Production
1. Feature flag: `ENABLE_PROFILE_AUTO_EXTRACTION=true`
2. Gradual rollout: 10% → 50% → 100%
3. Monitor extraction accuracy
4. Collect user feedback

---

## 7. Migration Strategy (Existing Profile Data)

**Optional for MVP** - Can be done post-launch

```typescript
// Migration script: Convert old profile to new system

async function migrateExistingProfile(userId: string) {
  const oldProfile = await fetchOldProfile(userId);

  // Convert structured data to tags
  const tags = [
    ...oldProfile.subjects.map(s => ({ characteristic: s, category: 'subjects' })),
    ...oldProfile.gradeLevel.map(g => ({ characteristic: g, category: 'gradeLevel' })),
    // ... etc
  ];

  // Insert with count: 3 (threshold met)
  for (const tag of tags) {
    await db.profile_characteristics.create({
      user_id: userId,
      characteristic: tag.characteristic,
      category: tag.category,
      count: 3,
      manually_added: true,
      // ... timestamps
    });
  }
}
```

---

## 8. Performance Considerations

1. **Async Extraction**: Happens after chat ends, non-blocking
2. **Batch Categorization**: Re-categorize uncategorized tags nightly (cron job)
3. **Database Indexes**: On `user_id`, `count` for fast queries
4. **Caching**: Profile characteristics cached for 5 minutes (frontend)

---

## 9. Open Technical Questions

- ❓ Should extraction run after EVERY chat or batch daily? (Decision: After every chat ≥2-3 messages)
- ❓ How to calculate profile sync percentage? (Decision: Hardcoded 60% for MVP, real calc later)
- ❓ Should we show "X" delete button for tags? (Decision: Yes in UI, Phase 2 functionality)
