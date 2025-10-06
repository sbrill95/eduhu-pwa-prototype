# Profile Characteristic Deduplication - Usage Guide

## Quick Start

### 1. Basic Deduplication Flow

#### Step 1: User adds a characteristic manually
```bash
POST /api/profile/characteristics/add
Content-Type: application/json

{
  "userId": "user-123",
  "characteristic": "SOL"
}
```

**What Happens:**
- System checks for similar existing characteristics
- Finds "Selbstorganisiertes Lernen" (similarity: 1.0, reason: abbreviation)
- Instead of creating new, increments existing characteristic count
- **Result**: No duplicate created! ✅

---

### 2. Find Duplicate Groups (Manual Review)

#### Step 2: Get all similarity groups for review
```bash
POST /api/profile/characteristics/deduplicate
Content-Type: application/json

{
  "userId": "user-123",
  "autoMerge": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "keep": {
          "id": "char-1",
          "characteristic": "Selbstorganisiertes Lernen",
          "count": 5,
          "category": "teachingStyle"
        },
        "merge": [
          {
            "id": "char-2",
            "characteristic": "Selbstorganisiretes lernen",
            "count": 2,
            "category": "teachingStyle"
          },
          {
            "id": "char-3",
            "characteristic": "sol",
            "count": 3,
            "category": "teachingStyle"
          }
        ],
        "similarity": 0.95,
        "reason": "typo"
      }
    ],
    "totalGroups": 1
  }
}
```

---

### 3. Auto-Merge All Duplicates

#### Step 3: Automatically merge all found duplicates
```bash
POST /api/profile/characteristics/deduplicate
Content-Type: application/json

{
  "userId": "user-123",
  "autoMerge": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mergedGroups": 1,
    "totalMerged": 2,
    "totalGroups": 1
  }
}
```

**Result:**
- "Selbstorganisiertes Lernen" (count: 10)
  - Merged from: SOL (3) + sol (2) + original (5)
  - first_seen: earliest timestamp
  - last_seen: latest timestamp
- "Selbstorganisiretes lernen" ❌ Deleted
- "sol" ❌ Deleted

---

### 4. Manual Selective Merge

#### Step 4: User chooses specific characteristics to merge
```bash
POST /api/profile/characteristics/merge
Content-Type: application/json

{
  "userId": "user-123",
  "keepId": "char-1",
  "mergeIds": ["char-2", "char-3"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "keepId": "char-1",
    "mergedCount": 2
  }
}
```

---

## Frontend Integration Examples

### React Hook: Auto-Deduplication After Add

```typescript
// hooks/useProfileCharacteristics.ts
import { useState } from 'react';
import { api } from '@/lib/api';

export const useProfileCharacteristics = (userId: string) => {
  const [characteristics, setCharacteristics] = useState([]);
  const [loading, setLoading] = useState(false);

  const addCharacteristic = async (characteristic: string) => {
    setLoading(true);
    try {
      // 1. Add characteristic (auto-deduplication happens here)
      await api.post('/api/profile/characteristics/add', {
        userId,
        characteristic
      });

      // 2. Optional: Run full deduplication to catch any edge cases
      await api.post('/api/profile/characteristics/deduplicate', {
        userId,
        autoMerge: true
      });

      // 3. Refresh characteristics
      const response = await api.get(`/api/profile/characteristics?userId=${userId}`);
      setCharacteristics(response.data.characteristics);
    } catch (error) {
      console.error('Failed to add characteristic:', error);
    } finally {
      setLoading(false);
    }
  };

  return { characteristics, addCharacteristic, loading };
};
```

---

### React Component: Merge Suggestions UI

```tsx
// components/MergeSuggestionsModal.tsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface MergeSuggestionsModalProps {
  userId: string;
  onClose: () => void;
}

export const MergeSuggestionsModal = ({ userId, onClose }: MergeSuggestionsModalProps) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimilarGroups();
  }, [userId]);

  const fetchSimilarGroups = async () => {
    try {
      const response = await api.post('/api/profile/characteristics/deduplicate', {
        userId,
        autoMerge: false
      });
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Failed to fetch similar groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async (group) => {
    try {
      await api.post('/api/profile/characteristics/merge', {
        userId,
        keepId: group.keep.id,
        mergeIds: group.merge.map(m => m.id)
      });

      // Refresh groups
      fetchSimilarGroups();
    } catch (error) {
      console.error('Failed to merge characteristics:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (groups.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Keine Duplikate gefunden</h2>
        <p className="text-gray-600">Alle Merkmale sind eindeutig.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-white rounded">
          Schließen
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Duplikate gefunden</h2>

      {groups.map((group, index) => (
        <div key={index} className="mb-4 p-4 border rounded">
          <div className="mb-2">
            <strong>Behalten:</strong> {group.keep.characteristic} (Count: {group.keep.count})
          </div>

          <div className="mb-2">
            <strong>Zusammenführen:</strong>
            <ul className="ml-4 list-disc">
              {group.merge.map((char) => (
                <li key={char.id}>
                  {char.characteristic} (Count: {char.count})
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-2 text-sm text-gray-600">
            Ähnlichkeit: {(group.similarity * 100).toFixed(0)}% | Grund: {group.reason}
          </div>

          <button
            onClick={() => handleMerge(group)}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Zusammenführen
          </button>
        </div>
      ))}

      <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 rounded">
        Abbrechen
      </button>
    </div>
  );
};
```

---

### Automatic Background Deduplication

```typescript
// services/profileMaintenance.ts

/**
 * Run this on app startup or periodically (e.g., every 24 hours)
 */
export const runBackgroundDeduplication = async (userId: string) => {
  try {
    const response = await api.post('/api/profile/characteristics/deduplicate', {
      userId,
      autoMerge: true
    });

    console.log('[Background Deduplication]', {
      mergedGroups: response.data.mergedGroups,
      totalMerged: response.data.totalMerged
    });
  } catch (error) {
    console.error('[Background Deduplication] Failed:', error);
  }
};

// Example: Run on app startup
useEffect(() => {
  if (user?.id) {
    runBackgroundDeduplication(user.id);
  }
}, [user?.id]);
```

---

## Common Scenarios

### Scenario 1: User Adds Multiple Variations

**Input:**
```
User adds:
- "SOL"
- "sol"
- "Selbstorganisiertes Lernen"
```

**What Happens:**
1. First add: "SOL" → Creates new characteristic (count: 1)
2. Second add: "sol" → Detects similarity with "SOL", increments to (count: 2)
3. Third add: "Selbstorganisiertes Lernen" → Detects abbreviation match, increments to (count: 3)

**Result:** Only 1 characteristic exists with count: 3 ✅

---

### Scenario 2: Typo Detection

**Input:**
```
User adds:
- "Selbstorganisiertes Lernen"
- "Selbstorganisiretes lernen" (typo)
```

**What Happens:**
- Second add detects 95% similarity (typo)
- Increments first characteristic instead of creating duplicate

**Result:** Only 1 characteristic exists ✅

---

### Scenario 3: Mixed Case

**Input:**
```
User adds:
- "Mathematik"
- "mathematik"
- "MATHEMATIK"
```

**What Happens:**
- All variations normalized to lowercase for comparison
- 100% similarity detected (casing difference)
- All increments go to first characteristic

**Result:** Only 1 characteristic exists with count: 3 ✅

---

## Testing Deduplication

### Manual Testing with curl

```bash
# 1. Add some test characteristics
curl -X POST http://localhost:3001/api/profile/characteristics/add \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "characteristic": "SOL"}'

curl -X POST http://localhost:3001/api/profile/characteristics/add \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "characteristic": "Selbstorganisiertes Lernen"}'

curl -X POST http://localhost:3001/api/profile/characteristics/add \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "characteristic": "sol"}'

# 2. Check for duplicates
curl -X POST http://localhost:3001/api/profile/characteristics/deduplicate \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "autoMerge": false}'

# 3. Auto-merge all duplicates
curl -X POST http://localhost:3001/api/profile/characteristics/deduplicate \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "autoMerge": true}'

# 4. Verify result
curl -X GET "http://localhost:3001/api/profile/characteristics?userId=test-user"
```

---

## Configuration

### Adjust Similarity Threshold

Edit `src/services/profileDeduplicationService.ts`:

```typescript
// Default: 0.8 (80% similarity)
const SIMILARITY_THRESHOLD = 0.8;

// More strict (90% similarity)
const SIMILARITY_THRESHOLD = 0.9;

// More lenient (70% similarity)
const SIMILARITY_THRESHOLD = 0.7;
```

### Add Custom Abbreviations

Edit `src/services/profileDeduplicationService.ts`:

```typescript
const ABBREVIATION_MAP: Record<string, string> = {
  'sol': 'Selbstorganisiertes Lernen',
  'pbl': 'Projektbasiertes Lernen',

  // Add your custom abbreviations:
  'deu': 'Deutsch',
  'eng': 'Englisch',
  'fra': 'Französisch',
};
```

---

## Monitoring & Logging

All deduplication operations are logged with:

```typescript
logInfo('Manual characteristic merged with similar existing', {
  userId,
  newCharacteristic: 'SOL',
  existingCharacteristic: 'Selbstorganisiertes Lernen',
  newCount: 6
});
```

Check logs in production to monitor:
- How often deduplication occurs
- Which abbreviations are most common
- Similarity scores for tuning threshold

---

## Error Handling

All endpoints return German error messages:

```json
{
  "success": false,
  "error": "Datenbank ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut."
}
```

Handle errors gracefully in frontend:

```typescript
try {
  await api.post('/api/profile/characteristics/add', { userId, characteristic });
} catch (error) {
  if (error.response?.status === 503) {
    showNotification('Datenbank vorübergehend nicht verfügbar', 'error');
  } else if (error.response?.status === 400) {
    showNotification('Ungültige Eingabe', 'error');
  } else {
    showNotification('Ein Fehler ist aufgetreten', 'error');
  }
}
```

---

## Best Practices

1. **Run deduplication after bulk imports**
   ```typescript
   await importCharacteristics(data);
   await api.post('/api/profile/characteristics/deduplicate', {
     userId,
     autoMerge: true
   });
   ```

2. **Show merge suggestions periodically**
   ```typescript
   // Every 10 characteristic additions
   if (totalCharacteristics % 10 === 0) {
     const { groups } = await api.post('/api/profile/characteristics/deduplicate', {
       userId,
       autoMerge: false
     });
     if (groups.length > 0) {
       showMergeSuggestionsModal(groups);
     }
   }
   ```

3. **Auto-clean on profile save**
   ```typescript
   const handleSaveProfile = async () => {
     await saveProfile();
     await api.post('/api/profile/characteristics/deduplicate', {
       userId,
       autoMerge: true
     });
   };
   ```

---

## Summary

The deduplication system provides:
- ✅ **Automatic** deduplication on characteristic add
- ✅ **Manual** merge suggestions UI
- ✅ **Batch** auto-merge for cleanup
- ✅ **Smart** similarity detection (casing, typos, abbreviations)
- ✅ **German** educational term support

Use it to keep your profile characteristics clean and duplicate-free! 🎉
