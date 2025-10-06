# Library & Materials Unification - Technical Plan

**Status**: Draft
**Created**: 2025-09-30
**Related Spec**: [spec.md](spec.md)
**Agents**: Backend-Agent (Lead), Frontend-Agent, QA-Agent

---

## 1. Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                      Library Component                       │
│  ┌──────────────┐                  ┌──────────────────────┐ │
│  │  Chats Tab   │                  │   Materialien Tab    │ │
│  │              │                  │                      │ │
│  │ chat_sessions│                  │ Unified Materials:   │ │
│  │   (InstantDB)│                  │  - artifacts         │ │
│  └──────────────┘                  │  - generated_artifacts│ │
│                                    │  - uploads (messages)│ │
│                                    └──────────────────────┘ │
│                                              │              │
│                                              ▼              │
│                                    ┌──────────────────────┐ │
│                                    │ Material Preview     │ │
│                                    │ Modal:               │ │
│                                    │  - Edit Title        │ │
│                                    │  - Delete            │ │
│                                    │  - Share             │ │
│                                    │  - Download          │ │
│                                    └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

Data Flow:
┌──────────────────┐
│ InstantDB        │
│  - artifacts     │───┐
│  - generated_    │   │
│    artifacts     │   ├──▶ useMaterials Hook ──▶ Unified Data ──▶ Library UI
│  - messages      │   │    (Data Transform)
│    (uploads)     │───┘
└──────────────────┘
```

### System Components Affected

| Component | Type | Impact | Changes Required |
|-----------|------|--------|------------------|
| Library.tsx | Frontend | Major Refactor | Remove Uploads Tab, Merge into Materialien |
| useMaterials Hook | Frontend | New Hook | Aggregate 3 data sources into unified interface |
| Material Preview Modal | Frontend | New Component | View/Edit/Delete/Share Material |
| formatRelativeDate | Frontend | New Utility | Smart date formatting |
| Chat Title Generation | Backend | Optional API | POST /api/chat/generate-title |
| InstantDB Schema | Backend | None | No changes needed ✅ |

---

## 2. Frontend Implementation

### New Hooks

#### `useMaterials.ts` - Unified Materials Data Hook

```typescript
// Location: teacher-assistant/frontend/src/hooks/useMaterials.ts

import { useMemo } from 'react';
import db from '../lib/instantdb';
import { useAuth } from '../lib/auth-context';

export type MaterialSource = 'manual' | 'upload' | 'agent-generated';

export type MaterialType =
  | 'lesson-plan'
  | 'worksheet'
  | 'quiz'
  | 'document'
  | 'image'
  | 'upload-pdf'
  | 'upload-image'
  | 'upload-doc'
  | 'resource';

export interface UnifiedMaterial {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  source: MaterialSource;
  created_at: number;
  updated_at: number;
  metadata: {
    // For uploads
    filename?: string;
    file_url?: string;
    file_type?: string;
    image_data?: string;

    // For generated artifacts
    agent_id?: string;
    agent_name?: string;
    prompt?: string;
    model_used?: string;
    artifact_data?: Record<string, any>;

    // For manual materials
    tags?: string[];
    subject?: string;
    grade?: string;
    content?: string;
  };
  is_favorite: boolean;
  usage_count?: number;
}

export function useMaterials() {
  const { user } = useAuth();

  // Fetch all 3 data sources
  const { data: artifactsData } = db.useQuery(
    user ? {
      artifacts: {
        $: {
          where: { creator: user.id },
          order: { serverCreatedAt: 'desc' }
        }
      }
    } : null
  );

  const { data: generatedData } = db.useQuery(
    user ? {
      generated_artifacts: {
        $: {
          where: { creator: user.id },
          order: { serverCreatedAt: 'desc' }
        }
      }
    } : null
  );

  const { data: messagesData } = db.useQuery(
    user ? {
      messages: {
        $: {
          where: { user_id: user.id, role: 'user' },
          order: { serverCreatedAt: 'desc' }
        }
      }
    } : null
  );

  // Transform and combine data
  const materials = useMemo<UnifiedMaterial[]>(() => {
    const result: UnifiedMaterial[] = [];

    // 1. Transform manual artifacts
    if (artifactsData?.artifacts) {
      artifactsData.artifacts.forEach(artifact => {
        result.push({
          id: artifact.id,
          title: artifact.title,
          description: artifact.content?.substring(0, 200), // First 200 chars
          type: artifact.type as MaterialType,
          source: 'manual',
          created_at: artifact.created_at,
          updated_at: artifact.updated_at,
          metadata: {
            tags: artifact.tags ? JSON.parse(artifact.tags) : [],
            subject: artifact.subject,
            grade: artifact.grade_level,
            content: artifact.content
          },
          is_favorite: artifact.is_favorite,
          usage_count: artifact.usage_count
        });
      });
    }

    // 2. Transform generated artifacts
    if (generatedData?.generated_artifacts) {
      generatedData.generated_artifacts.forEach(generated => {
        const artifactData = typeof generated.artifact_data === 'string'
          ? JSON.parse(generated.artifact_data)
          : generated.artifact_data;

        result.push({
          id: generated.id,
          title: generated.title,
          description: generated.prompt?.substring(0, 200),
          type: generated.type as MaterialType,
          source: 'agent-generated',
          created_at: generated.created_at,
          updated_at: generated.updated_at,
          metadata: {
            agent_id: generated.agent_id,
            agent_name: generated.agent?.name,
            prompt: generated.prompt,
            model_used: generated.model_used,
            artifact_data: artifactData
          },
          is_favorite: generated.is_favorite,
          usage_count: generated.usage_count
        });
      });
    }

    // 3. Transform uploads from messages
    if (messagesData?.messages) {
      messagesData.messages.forEach(message => {
        try {
          const parsedContent = JSON.parse(message.content);

          // Handle image uploads
          if (parsedContent.image_data) {
            result.push({
              id: `upload-img-${message.id}`,
              title: `Bild vom ${new Date(message.timestamp).toLocaleDateString('de-DE')}`,
              type: 'upload-image',
              source: 'upload',
              created_at: message.timestamp,
              updated_at: message.timestamp,
              metadata: {
                filename: `image_${message.id}.jpg`,
                file_type: 'image/jpeg',
                image_data: parsedContent.image_data
              },
              is_favorite: false
            });
          }

          // Handle file uploads
          if (parsedContent.fileIds && parsedContent.filenames) {
            parsedContent.fileIds.forEach((fileId: string, index: number) => {
              const filename = parsedContent.filenames[index] || `file_${index + 1}`;
              const isPdf = filename.toLowerCase().endsWith('.pdf');
              const isDoc = filename.toLowerCase().match(/\.(doc|docx|txt)$/);

              result.push({
                id: `upload-file-${fileId}`,
                title: filename,
                type: isPdf ? 'upload-pdf' : isDoc ? 'upload-doc' : 'document',
                source: 'upload',
                created_at: message.timestamp,
                updated_at: message.timestamp,
                metadata: {
                  filename,
                  file_url: fileId, // InstantDB file ID
                  file_type: isPdf ? 'application/pdf' : 'application/octet-stream'
                },
                is_favorite: false
              });
            });
          }
        } catch (e) {
          // Not JSON, skip
        }
      });
    }

    // Sort by updated_at descending
    return result.sort((a, b) => b.updated_at - a.updated_at);
  }, [artifactsData, generatedData, messagesData]);

  return {
    materials,
    loading: !artifactsData && !generatedData && !messagesData,
  };
}
```

### Modified Components

#### `Library.tsx` - Major Refactor

**Changes**:
1. Remove `uploads` tab from IonSegment
2. Replace `selectedTab` state: `'chats' | 'artifacts' | 'uploads'` → `'chats' | 'artifacts'`
3. Remove Uploads Tab Content section (lines 400-475)
4. Integrate uploads into Materialien Tab using `useMaterials` hook
5. Update Filter Chips to include "Uploads" and "KI-generiert"

**Before**:
```typescript
const [selectedTab, setSelectedTab] = useState<'chats' | 'artifacts' | 'uploads'>('chats');
```

**After**:
```typescript
const [selectedTab, setSelectedTab] = useState<'chats' | 'artifacts'>('chats');
const { materials, loading: materialsLoading } = useMaterials();
```

**Filter Chips Update**:
```typescript
const artifactTypes = [
  { key: 'all', label: 'Alle', icon: documentOutline },
  { key: 'manual', label: 'Erstellt', icon: createOutline }, // Manual materials
  { key: 'upload', label: 'Uploads', icon: addOutline }, // NEW
  { key: 'ai-generated', label: 'KI-generiert', icon: sparklesOutline }, // NEW
  { key: 'quiz', label: 'Quiz', icon: helpOutline },
  { key: 'lesson_plan', label: 'Stundenpläne', icon: calendarOutline },
];
```

#### New Component: `MaterialPreviewModal.tsx`

```typescript
// Location: teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx

import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonChip,
  IonAlert
} from '@ionic/react';
import {
  closeOutline,
  downloadOutline,
  heartOutline,
  heart,
  trashOutline,
  shareOutline,
  createOutline
} from 'ionicons/icons';
import type { UnifiedMaterial } from '../hooks/useMaterials';

interface MaterialPreviewModalProps {
  material: UnifiedMaterial | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (materialId: string) => Promise<void>;
  onUpdateTitle?: (materialId: string, newTitle: string) => Promise<void>;
  onToggleFavorite?: (materialId: string) => Promise<void>;
}

export const MaterialPreviewModal: React.FC<MaterialPreviewModalProps> = ({
  material,
  isOpen,
  onClose,
  onDelete,
  onUpdateTitle,
  onToggleFavorite
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  if (!material) return null;

  const handleSaveTitle = async () => {
    if (editedTitle && editedTitle !== material.title && onUpdateTitle) {
      await onUpdateTitle(material.id, editedTitle);
      setIsEditingTitle(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(material.id);
      setShowDeleteAlert(false);
      onClose();
    }
  };

  const handleDownload = () => {
    // Implementation depends on material type
    if (material.source === 'upload' && material.metadata.image_data) {
      // Download image
      const link = document.createElement('a');
      link.href = material.metadata.image_data;
      link.download = material.metadata.filename || 'download.jpg';
      link.click();
    } else if (material.metadata.artifact_data?.url) {
      // Download generated artifact
      window.open(material.metadata.artifact_data.url, '_blank');
    }
    // Add more download logic for other types
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={onClose}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>
              {isEditingTitle ? (
                <IonInput
                  value={editedTitle}
                  onIonChange={e => setEditedTitle(e.detail.value!)}
                  placeholder="Titel eingeben..."
                />
              ) : (
                material.title
              )}
            </IonTitle>
            <IonButtons slot="end">
              {isEditingTitle ? (
                <IonButton onClick={handleSaveTitle}>Speichern</IonButton>
              ) : (
                <IonButton onClick={() => {
                  setEditedTitle(material.title);
                  setIsEditingTitle(true);
                }}>
                  <IonIcon icon={createOutline} />
                </IonButton>
              )}
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {/* Material Preview Content */}
          <div style={{ padding: '16px' }}>
            {/* Show material based on type */}
            {material.type === 'upload-image' && material.metadata.image_data && (
              <img
                src={material.metadata.image_data}
                alt={material.title}
                style={{ width: '100%', borderRadius: '8px' }}
              />
            )}

            {material.type === 'image' && material.metadata.artifact_data?.url && (
              <img
                src={material.metadata.artifact_data.url}
                alt={material.title}
                style={{ width: '100%', borderRadius: '8px' }}
              />
            )}

            {material.metadata.content && (
              <div style={{ marginTop: '16px' }}>
                <IonLabel>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{material.metadata.content}</p>
                </IonLabel>
              </div>
            )}

            {/* Metadata */}
            <div style={{ marginTop: '24px' }}>
              <IonItem>
                <IonLabel>
                  <h3>Typ</h3>
                  <p>{material.type}</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <h3>Quelle</h3>
                  <p>{material.source === 'manual' ? 'Manuell erstellt' : material.source === 'upload' ? 'Hochgeladen' : 'KI-generiert'}</p>
                </IonLabel>
              </IonItem>
              {material.metadata.agent_name && (
                <IonItem>
                  <IonLabel>
                    <h3>Agent</h3>
                    <p>{material.metadata.agent_name}</p>
                  </IonLabel>
                </IonItem>
              )}
            </div>

            {/* Actions */}
            <div style={{ marginTop: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <IonButton expand="block" onClick={handleDownload}>
                <IonIcon icon={downloadOutline} slot="start" />
                Download
              </IonButton>
              <IonButton expand="block" fill="outline" onClick={() => onToggleFavorite?.(material.id)}>
                <IonIcon icon={material.is_favorite ? heart : heartOutline} slot="start" />
                {material.is_favorite ? 'Favorit entfernen' : 'Als Favorit'}
              </IonButton>
              <IonButton expand="block" fill="outline">
                <IonIcon icon={shareOutline} slot="start" />
                Teilen
              </IonButton>
              <IonButton expand="block" color="danger" fill="outline" onClick={() => setShowDeleteAlert(true)}>
                <IonIcon icon={trashOutline} slot="start" />
                Löschen
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Delete Confirmation */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Material löschen"
        message={`Möchten Sie "${material.title}" wirklich löschen?`}
        buttons={[
          { text: 'Abbrechen', role: 'cancel' },
          { text: 'Löschen', role: 'destructive', handler: handleDelete }
        ]}
      />
    </>
  );
};
```

### New Utilities

#### `formatRelativeDate.ts` - Smart Date Formatting

```typescript
// Location: teacher-assistant/frontend/src/lib/formatRelativeDate.ts

/**
 * Formats timestamp to human-readable relative date
 * - Today: "Heute 14:30"
 * - Yesterday: "Gestern 10:15"
 * - 2-7 days: "vor X Tagen"
 * - >7 days: "25. Sep" or "25.09.25"
 */
export function formatRelativeDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  // Reset time to midnight for date comparison
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysDiff = Math.floor((todayMidnight.getTime() - dateMidnight.getTime()) / (1000 * 60 * 60 * 24));

  // Today
  if (daysDiff === 0) {
    return `Heute ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // Yesterday
  if (daysDiff === 1) {
    return `Gestern ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
  }

  // 2-7 days ago
  if (daysDiff >= 2 && daysDiff <= 7) {
    return `vor ${daysDiff} Tagen`;
  }

  // 8-365 days ago (without year)
  if (daysDiff > 7 && daysDiff <= 365) {
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  }

  // > 1 year ago (with year)
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
```

---

## 3. Backend Implementation

### Optional: Chat Title Generation API

**Endpoint**: `POST /api/chat/generate-title`

**Purpose**: Generate meaningful chat title from first user message

**Implementation Options**:

#### Option A: OpenAI-based (Better, but costs tokens)
```typescript
// Location: teacher-assistant/backend/src/routes/chat.ts

router.post('/api/chat/generate-title', async (req, res) => {
  try {
    const { firstMessage } = req.body;

    if (!firstMessage) {
      return res.status(400).json({
        success: false,
        error: 'firstMessage is required'
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Generate a short, descriptive German title (max 50 characters) for a teacher\'s chat based on their first message. Return only the title, nothing else.'
        },
        {
          role: 'user',
          content: firstMessage
        }
      ],
      max_tokens: 20,
      temperature: 0.7
    });

    const title = completion.choices[0].message.content?.trim() || 'Neuer Chat';

    res.json({ success: true, title });
  } catch (error) {
    console.error('Error generating chat title:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate title',
      fallback: firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '')
    });
  }
});
```

#### Option B: Heuristic-based (Free, simpler)
```typescript
router.post('/api/chat/generate-title', async (req, res) => {
  try {
    const { firstMessage } = req.body;

    if (!firstMessage) {
      return res.status(400).json({
        success: false,
        error: 'firstMessage is required'
      });
    }

    // Simple heuristic: First sentence or first 50 characters
    let title = firstMessage.split(/[.!?]/)[0].trim();

    if (title.length > 50) {
      title = title.substring(0, 50) + '...';
    }

    res.json({ success: true, title });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate title'
    });
  }
});
```

**Recommendation**: Start with Option B (heuristic), upgrade to Option A if needed.

### Material CRUD Operations

**Extend existing endpoints**:

#### Update Material Title
```typescript
// POST /api/materials/update-title
router.post('/api/materials/update-title', async (req, res) => {
  const { materialId, newTitle, source } = req.body;

  try {
    // Update based on source
    if (source === 'manual') {
      // Update artifacts table
      await db.artifacts.update(materialId, { title: newTitle });
    } else if (source === 'agent-generated') {
      // Update generated_artifacts table
      await db.generated_artifacts.update(materialId, { title: newTitle });
    } else if (source === 'upload') {
      // Uploads don't have direct title field
      // Could store custom titles in separate table or metadata
      // For now, return error
      return res.status(400).json({
        success: false,
        error: 'Upload titles cannot be changed (filename is title)'
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### Delete Material
```typescript
// DELETE /api/materials/:id
router.delete('/api/materials/:id', async (req, res) => {
  const { id } = req.params;
  const { source } = req.query;

  try {
    if (source === 'manual') {
      await db.artifacts.delete(id);
    } else if (source === 'agent-generated') {
      await db.generated_artifacts.delete(id);
    } else if (source === 'upload') {
      // Uploads are stored in messages, cannot delete
      // Could mark as hidden/deleted in metadata
      return res.status(400).json({
        success: false,
        error: 'Uploads cannot be deleted directly'
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 4. Data Model

### No Schema Changes Required ✅

Existing schemas remain unchanged:
- `artifacts` (manual materials)
- `generated_artifacts` (agent outputs)
- `messages` (contains uploads)
- `chat_sessions` (chats)

Frontend combines data via `useMaterials` hook.

---

## 5. Testing Strategy

### Unit Tests

#### `useMaterials.test.ts`
```typescript
describe('useMaterials Hook', () => {
  it('should combine all 3 data sources', () => {
    // Test data transformation
  });

  it('should sort materials by updated_at descending', () => {
    // Test sorting logic
  });

  it('should handle uploads with images correctly', () => {
    // Test image upload transformation
  });

  it('should handle uploads with files correctly', () => {
    // Test file upload transformation
  });
});
```

#### `formatRelativeDate.test.ts`
```typescript
describe('formatRelativeDate', () => {
  it('should format today with time', () => {
    const now = new Date();
    expect(formatRelativeDate(now.getTime())).toContain('Heute');
  });

  it('should format yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatRelativeDate(yesterday.getTime())).toContain('Gestern');
  });

  it('should format 2-7 days as "vor X Tagen"', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(formatRelativeDate(threeDaysAgo.getTime())).toBe('vor 3 Tagen');
  });
});
```

### Integration Tests

#### `Library.test.tsx`
```typescript
describe('Library Component', () => {
  it('should display materials from all sources', () => {
    // Test unified materials display
  });

  it('should filter materials by type', () => {
    // Test filter chips functionality
  });

  it('should open preview modal on material click', () => {
    // Test modal opening
  });
});
```

### E2E Tests (Playwright)

```typescript
test('Library Materials Unification', async ({ page }) => {
  // 1. Upload file in chat
  await page.goto('/chat');
  await page.setInputFiles('input[type="file"]', 'test.pdf');

  // 2. Navigate to library
  await page.click('[data-testid="library-tab"]');

  // 3. Verify upload appears in Materialien tab
  await page.click('[data-testid="materialien-tab"]');
  await expect(page.locator('text=test.pdf')).toBeVisible();

  // 4. Test filter
  await page.click('[data-testid="filter-uploads"]');
  await expect(page.locator('text=test.pdf')).toBeVisible();

  // 5. Test preview modal
  await page.click('text=test.pdf');
  await expect(page.locator('[data-testid="material-preview-modal"]')).toBeVisible();
});
```

---

## 6. Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Only load first 20 materials, "Load More" button
2. **Virtual Scrolling**: Use `IonVirtualScroll` for 100+ materials
3. **Memoization**: `useMemo` for data transformation
4. **Debounced Search**: 300ms debounce on search input
5. **Image Lazy Loading**: Load thumbnails on demand

### Caching Strategy

- InstantDB handles real-time caching
- Frontend: Keep transformed materials in React state
- Re-fetch only on explicit user action (pull-to-refresh)

---

## 7. Error Handling

### Error Scenarios

| Scenario | Error Type | User Message | Recovery Strategy |
|----------|-----------|--------------|-------------------|
| InstantDB query fails | Network Error | "Materialien konnten nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung." | Retry button, offline mode |
| Material delete fails | API Error | "Material konnte nicht gelöscht werden. Bitte versuchen Sie es erneut." | Rollback UI state, show retry |
| Title update fails | API Error | "Titel konnte nicht aktualisiert werden." | Revert to old title |
| Upload has no data | Data Error | Silent skip | Don't show in list |

### Logging Strategy

- Frontend: Console errors with context
- Backend: Winston logger with request ID
- InstantDB: Built-in error logging

---

## 8. Deployment Strategy

### Deployment Steps

1. ✅ **Backend**: Deploy optional title generation API (non-breaking)
2. ✅ **Frontend**: Deploy new Library component (feature-flagged if needed)
3. ✅ **Test**: Verify materials from all 3 sources appear
4. ✅ **Monitor**: Check for errors in production

### Rollback Plan

If issues occur:
1. Revert frontend deployment
2. Old Library.tsx with 3 tabs still works (no backend changes)
3. No data loss (no schema changes)

---

## 9. Success Criteria

### Technical Success Criteria

- ✅ All 3 data sources combined in single query
- ✅ UI renders < 1 second with 50 materials
- ✅ No console errors
- ✅ All unit tests passing (>90% coverage)
- ✅ Playwright E2E tests passing

### Quality Gates

- ✅ Code review approved (QA-Agent + Backend-Agent)
- ✅ Mobile tested on iOS + Android
- ✅ Accessibility: Screen reader compatible
- ✅ Performance: Lighthouse score > 90

---

## Approval

### Technical Reviewers

- [ ] Backend-Agent
- [ ] Frontend-Agent
- [ ] QA-Agent
- [ ] User (Stefan)

### Approval Date

[Date when plan was approved]

---

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-09-30 | Backend-Agent | Initial technical plan created |

---

## Next Steps

1. [ ] Review and approve this plan
2. [ ] Create `tasks.md` with detailed implementation tasks
3. [ ] Assign tasks to agents (Backend, Frontend, QA)
4. [ ] Begin implementation (Phase 1.2 of Roadmap)