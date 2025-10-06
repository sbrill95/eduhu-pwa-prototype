# Image Generation Improvements - Technical Plan

**Feature**: Image Generation UX/Library Improvements
**Version**: 1.0
**Created**: 2025-10-04

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│  ChatView.tsx                                                │
│    ├─── Display image messages (Assistant)                  │
│    ├─── Click image → Open Preview Modal                    │
│    └─── Continue chat after image generation                │
│                                                              │
│  AgentConfirmationModal.tsx (NEW/UPDATE)                     │
│    ├─── Gemini-Style Card Design                            │
│    ├─── Orange Primary Button                               │
│    └─── Slide-Up Animation                                  │
│                                                              │
│  AgentFormView.tsx                                           │
│    ├─── Prefill from state.formData.description             │
│    ├─── Min length: 3 characters (was 10)                   │
│    └─── Map style to backend format                         │
│                                                              │
│  AgentProgressView.tsx                                       │
│    ├─── Remove duplicate footer (lines 201-209)             │
│    └─── Keep cancel button + main loading card              │
│                                                              │
│  AgentResultView.tsx                                         │
│    ├─── Add "Neu generieren" button                         │
│    ├─── Pass formData to re-open AgentFormView              │
│    └─── Keep "Weiter im Chat" button                        │
│                                                              │
│  Library.tsx                                                 │
│    ├─── Add "Bilder" filter category                        │
│    ├─── Query library_materials with type: 'image'          │
│    └─── Display grid of image thumbnails                    │
│                                                              │
│  AgentContext.tsx                                            │
│    ├─── Handle image message creation                       │
│    ├─── Store image in library_materials                    │
│    └─── Support re-generation workflow                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                          Backend                             │
├─────────────────────────────────────────────────────────────┤
│  imageGenerationAgent.ts                                     │
│    ├─── Style Mapping Logic                                 │
│    │    ├─── realistic → natural + "realistic illustration" │
│    │    ├─── cartoon → vivid + "cartoon style"              │
│    │    ├─── illustrative → natural + "educational ill..."  │
│    │    └─── abstract → vivid + "abstract art"              │
│    ├─── Enhanced Prompt Generation                          │
│    ├─── ChatGPT Title Generation (NEW)                      │
│    │    ├─── Call ChatGPT with revised_prompt               │
│    │    ├─── Prompt: "Kurzer deutscher Titel (3-5 Wörter)"  │
│    │    └─── Fallback: Use DALL-E title if fails            │
│    └─── Logging for verification                            │
│                                                              │
│  langGraphAgents.ts (Route)                                  │
│    ├─── Save to library_materials (type: 'image')           │
│    ├─── Save to generated_artifacts (backward compat)       │
│    ├─── Create chat message with image (NO PROMPT shown)    │
│    └─── Return both IDs + image URL + german_title          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         InstantDB                            │
├─────────────────────────────────────────────────────────────┤
│  library_materials                                           │
│    ├─── type: 'image' (NEW)                                 │
│    ├─── content: image_url                                  │
│    ├─── title: AI-generated title                           │
│    ├─── description: revised_prompt (optional)              │
│    └─── tags: extracted from prompt                         │
│                                                              │
│  messages                                                    │
│    ├─── role: 'assistant'                                   │
│    ├─── content: "Ich habe ein Bild erstellt: [title]"      │
│    └─── metadata: { image_url, library_id, artifact_id }    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Data Models

### 2.1 InstantDB Schema Changes

**library_materials** (existing, add support for images):
```typescript
{
  id: string;
  user_id: string;
  title: string; // e.g. "Löwenbild erstellen"
  type: 'image' | 'lesson_plan' | 'quiz' | ...; // ADD 'image'
  content: string; // For images: image_url from DALL-E
  description?: string; // Optional: revised_prompt
  tags: string; // JSON array: ["Natur", "Tiere", "Biologie"]
  created_at: number;
  updated_at: number;
  is_favorite: boolean;
  image_metadata?: string; // JSON: { style, size, model, cost }
}
```

**messages** (existing, add image support):
```typescript
{
  id: string;
  session_id: string;
  user_id: string;
  content: string; // "Ich habe ein Bild für dich erstellt: Löwenbild"
  role: 'assistant';
  timestamp: number;
  metadata?: string; // JSON: { image_url, library_id, artifact_id, type: 'image' }
}
```

**generated_artifacts** (existing, keep for backward compatibility):
```typescript
{
  id: string;
  creator_id: string;
  agent_id: 'image-generation';
  title: string;
  type: 'image';
  artifact_data: string; // JSON: { imageUrl, revisedPrompt, tags }
  prompt: string; // Original prompt
  enhanced_prompt?: string; // AI-enhanced
  model_used: 'dall-e-3';
  cost: number; // USD cents
  created_at: number;
}
```

### 2.2 API Response Structure

**POST /api/langgraph/agents/execute** (enhanced):
```typescript
{
  success: true,
  data: {
    image_url: string; // DALL-E URL
    revised_prompt: string; // English DALL-E prompt
    title: string; // German title from ChatGPT
    dalle_title: string; // Original English title (backup)
    tags: string[];
    library_id: string; // NEW: ID of library_materials entry
    artifact_id: string; // Existing: generated_artifacts ID
    message_id: string; // NEW: ID of created chat message
  },
  metadata: {
    executionId: string;
    model: 'dall-e-3';
    processing_time: number;
    cost: number;
    title_generation_cost: number; // ChatGPT title cost
  }
}
```

---

## 3. Component Design

### 3.1 AgentConfirmationModal (Gemini Style mit 2 Optionen)

**Layout:**
```
┌─────────────────────────────────────────┐
│  [Teal Background]                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [White Card with Shadow]       │   │
│  │                                 │   │
│  │  🎨 [Orange Gradient Icon]      │   │
│  │                                 │   │
│  │  Möchtest du ein Bild           │   │
│  │  erstellen?                     │   │
│  │  (text-lg font-semibold)        │   │
│  │                                 │   │
│  │  Ich generiere ein Bild für     │   │
│  │  deinen Unterricht.             │   │
│  │  (text-sm text-gray-600)        │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐   │   │
│  │  │ Ja, Bild erstellen 🎨   │   │   │ ← Orange Primary
│  │  └──────────────────────────┘   │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐   │   │
│  │  │ Weiter im Chat 💬       │   │   │ ← Gray Secondary
│  │  └──────────────────────────┘   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Tailwind Classes:**
- Card: `bg-white rounded-2xl shadow-lg p-6`
- Icon: `bg-gradient-to-br from-primary to-secondary w-12 h-12 rounded-full`
- Primary Button: `bg-primary text-white rounded-xl px-6 py-3 font-medium hover:bg-primary-600`
- Secondary Button: `bg-gray-100 text-gray-700 rounded-xl px-6 py-3 font-medium hover:bg-gray-200`
- Animation: Framer Motion `slideUp` (from `motion-tokens.ts`)

### 3.2 ChatView Image Message (Clean, NO Prompt)

**Layout:**
```
┌────────────────────────────────────────┐
│  [Assistant Message Bubble]           │
│                                        │
│  ┌──────────────────────────────┐     │
│  │  [Image Thumbnail]           │     │
│  │  (max-w-[300px] rounded-lg)  │     │
│  │  Click to enlarge            │     │
│  └──────────────────────────────┘     │
│                                        │
│  Ich habe ein Bild für dich           │
│  erstellt.                            │
│                                        │
│  [NO PROMPT / NO METADATA shown]      │
└────────────────────────────────────────┘
```

**Component Hierarchy:**
```tsx
<div className="flex justify-start mb-3">
  <div className="bg-background-teal rounded-2xl rounded-bl-md p-4 max-w-[80%]">
    {/* Image */}
    <img
      src={message.metadata.image_url}
      alt="AI-generiertes Bild"
      className="w-full max-w-[300px] rounded-lg mb-3 cursor-pointer"
      onClick={() => openPreviewModal(message.metadata)}
    />

    {/* Simple Text - NO TITLE, NO PROMPT */}
    <p className="text-gray-900">
      Ich habe ein Bild für dich erstellt.
    </p>
  </div>
</div>
```

**Key Change**: Entfernt `<details>` und Titel-Anzeige im Chat. Clean UI!

### 3.3 Library "Bilder" Tab

**Layout:**
```
┌─────────────────────────────────────────┐
│  Library                                │
│                                         │
│  [Alle] [Materialien] [Bilder] ← NEW   │
│  ─────────────────────────────────────  │
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ IMG  │  │ IMG  │  │ IMG  │          │
│  │      │  │      │  │      │          │
│  └──────┘  └──────┘  └──────┘          │
│  Löwenbild  Baum     Photosyn...       │
│  Heute      Gestern  3.10.2025         │
│                                         │
│  ┌──────┐  ┌──────┐                    │
│  │ IMG  │  │ IMG  │                    │
│  │      │  │      │                    │
│  └──────┘  └──────┘                    │
└─────────────────────────────────────────┘
```

**Filter Logic:**
```typescript
const [activeFilter, setActiveFilter] = useState<'all' | 'materials' | 'images'>('all');

const { data } = useQuery({
  library_materials: {
    $: {
      where: {
        user_id: user?.id,
        ...(activeFilter === 'images' && { type: 'image' }),
        ...(activeFilter === 'materials' && { type: { $ne: 'image' } })
      }
    }
  }
});
```

---

## 4. Implementation Strategy

### Phase 1: Quick Wins (High Impact, Low Effort)
**Estimated**: 2-3 hours

1. **AgentProgressView UI Cleanup** ✅ EASY
   - Remove lines 201-209 (duplicate footer)
   - Test visually

2. **AgentFormView Validation** ✅ EASY
   - Change line 28: `>= 10` → `>= 3`
   - Update error message
   - Test with 1, 2, 3 character inputs

3. **Backend Style Mapping** ✅ MEDIUM
   - Add mapping function in `imageGenerationAgent.ts`
   - Log mapped values for debugging
   - Test all 4 styles (realistic, cartoon, illustrative, abstract)

### Phase 2: Core Features (Medium Effort, High Impact)
**Estimated**: 6-8 hours

4. **Library Integration** 🔧 MEDIUM-HIGH
   - Update `langGraphAgents.ts` route to save to `library_materials`
   - Add "Bilder" filter in `Library.tsx`
   - Query and display images in grid
   - Test: Generate image → Check Library → Image appears

5. **Chat Message Integration** 🔧 COMPLEX
   - Create assistant message with image after generation
   - Render image messages in `ChatView.tsx`
   - Make image clickable (open preview modal)
   - Test: Generate → Image appears in chat → Click → Preview opens

6. **Prompt Prefill** 🔧 MEDIUM
   - Parse user chat message in `AgentContext.tsx`
   - Extract prompt after agent detection
   - Set `state.formData.description` before opening form
   - Test: "Erstelle Bild von Baum" → Form shows "Bild von Baum"

### Phase 3: Polish & UX Enhancements (Medium Effort)
**Estimated**: 4-6 hours

7. **Agent Confirmation Gemini Style** 🎨 MEDIUM
   - Design Gemini-style card modal
   - Add Framer Motion slide-up animation
   - Style buttons (orange primary, gray secondary)
   - Test: Trigger agent → Modal looks like Gemini

8. **Re-Generation Feature** 🔧 MEDIUM-HIGH
   - Add "Neu generieren" button in `AgentResultView.tsx`
   - Pass current formData to `AgentContext`
   - Re-open AgentFormView with prefilled data
   - Generate new image → Both appear in Library + Chat
   - Test: Generate → Preview → Neu generieren → Check both in Library

### Phase 4: Testing & QA
**Estimated**: 3-4 hours

9. **E2E Testing** 🧪
   - Playwright test for full flow
   - Visual regression testing (screenshots)
   - Test edge cases (long prompts, special characters, etc.)

10. **Backend Verification** 🧪
    - Verify style mapping logs
    - Check InstantDB entries (library_materials + messages)
    - Verify both images saved on re-generation

---

## 5. Testing Strategy

### 5.1 Unit Tests

**Frontend:**
- `AgentFormView.test.tsx`: Validate min length = 3
- `Library.test.tsx`: Filter images correctly
- `ChatView.test.tsx`: Render image messages

**Backend:**
- `imageGenerationAgent.test.ts`: Style mapping function
- `langGraphAgents.test.ts`: Save to library_materials + messages

### 5.2 Integration Tests

**Scenario 1: End-to-End Image Generation**
```typescript
test('Full image generation flow', async () => {
  // 1. User sends chat message
  await sendMessage('Erstelle ein Bild von einem Baum');

  // 2. Agent confirmation appears
  expect(screen.getByText('Bildgenerierung starten?')).toBeVisible();
  await click('Ja, starten');

  // 3. Form opens with prefilled prompt
  expect(input.value).toBe('ein Bild von einem Baum');
  await click('Bild generieren');

  // 4. Progress view appears
  expect(screen.getByText('Dein Bild wird erstellt...')).toBeVisible();

  // 5. Result view appears
  await waitFor(() => expect(screen.getByRole('img')).toBeVisible());
  await click('Weiter im Chat');

  // 6. Image appears in chat
  expect(chatView.querySelector('img[src*="blob.core.windows.net"]')).toBeVisible();

  // 7. Image appears in library
  await navigateTo('/library');
  await click('[data-filter="images"]');
  expect(screen.getByText('Baumbild')).toBeVisible();
});
```

**Scenario 2: Re-Generation**
```typescript
test('Re-generate image with same params', async () => {
  // 1. Generate first image
  await generateImage({ prompt: 'Löwe', style: 'realistic' });

  // 2. Click "Neu generieren" in preview
  await click('Neu generieren');

  // 3. Form pre-filled
  expect(input.value).toBe('Löwe');
  expect(select.value).toBe('realistic');

  // 4. Generate again
  await click('Bild generieren');
  await waitForResult();

  // 5. Both images in library
  await navigateTo('/library?filter=images');
  expect(screen.getAllByRole('img')).toHaveLength(2);
});
```

### 5.3 Visual Regression Tests

**Playwright Screenshots:**
1. Agent Confirmation Modal (Gemini Style)
2. Progress View (after cleanup)
3. Chat View with Image Message
4. Library "Bilder" Tab
5. Agent Form with Prefilled Prompt

---

## 6. Deployment Plan

### 6.1 Feature Flags

```typescript
// teacher-assistant/frontend/src/lib/featureFlags.ts
export const FEATURE_FLAGS = {
  IMAGE_LIBRARY_INTEGRATION: true,
  IMAGE_CHAT_MESSAGES: true,
  GEMINI_CONFIRMATION: true,
  RE_GENERATION: true,
  PROMPT_PREFILL: true
};
```

### 6.2 Rollback Strategy

**If issues occur:**
1. Disable feature flag
2. Revert `library_materials` queries to exclude images
3. Revert `messages` to exclude image metadata
4. Keep existing flow (Preview Modal → Close → No chat/library)

### 6.3 Monitoring

**Metrics to track:**
- Image generation success rate (before/after style mapping)
- Library images count per user
- Chat messages with images count
- Re-generation usage rate
- Error rate in image save/display

---

## 7. Performance Considerations

### 7.1 Image Loading

**Problem**: Large images slow down chat/library rendering

**Solution**:
- Use DALL-E 3 URLs directly (Azure CDN, fast)
- Lazy load images in Library grid (`loading="lazy"`)
- Use thumbnail size for chat (max 300px width, browser auto-resize)

### 7.2 InstantDB Query Optimization

**Problem**: Library query includes all materials + images

**Solution**:
- Add index on `library_materials.type`
- Filter client-side after initial query
- Cache results with React Query (if needed later)

### 7.3 Message History

**Problem**: Chat messages grow over time

**Solution**:
- Implement pagination (load last 50 messages)
- Use InstantDB `$limit` parameter
- Lazy load older messages on scroll

---

## 8. Security & Privacy

### 8.1 InstantDB Permissions

**Ensure user can only see own images:**
```typescript
library_materials: {
  allow: {
    view: "auth.id == data.user_id",
    create: "auth.id == data.user_id",
    delete: "auth.id == data.user_id"
  }
}
```

### 8.2 Image URL Security

- DALL-E 3 URLs are public but obfuscated (Azure SAS token)
- URLs expire after ~1 hour (NOT stored long-term)
- **TODO**: Implement image upload to own storage (Phase 2)

---

## 9. Open Technical Questions

### Q1: Image Storage Long-Term
**Problem**: DALL-E URLs expire after ~1 hour
**Options**:
1. Download + upload to own S3/Cloud Storage (costs money)
2. Accept expiry (users must re-generate if needed)
3. Use InstantDB file storage (if available)

**Decision**: TBD (for now, accept expiry)

### Q2: Duplicate Image Detection
**Problem**: Re-generation might create duplicate entries
**Options**:
1. Allow duplicates (user intent is new version)
2. Group as "versions" (complex UI)
3. Replace original (loses history)

**Decision**: Allow duplicates (user's choice)

### Q3: Image Metadata Consistency
**Problem**: `generated_artifacts` vs `library_materials` have different schemas
**Options**:
1. Sync both on every save (extra writes)
2. Use only `library_materials`, deprecate `generated_artifacts`
3. Keep separate (backward compatibility)

**Decision**: Keep both for now, plan migration later

---

## 10. Migration Plan (If Needed)

**If existing `generated_artifacts` need to be shown in Library:**

```sql
-- Migrate existing images to library_materials
INSERT INTO library_materials (user_id, title, type, content, tags, created_at, ...)
SELECT
  creator_id as user_id,
  title,
  'image' as type,
  JSON_EXTRACT(artifact_data, '$.imageUrl') as content,
  JSON_EXTRACT(artifact_data, '$.tags') as tags,
  created_at,
  ...
FROM generated_artifacts
WHERE type = 'image'
AND creator_id NOT IN (
  SELECT user_id FROM library_materials WHERE type = 'image'
);
```

**Estimated**: 1 hour (write migration script + test)

---

## 11. Documentation Updates

### 11.1 User Documentation

- Update "Bildgenerierung" guide in `/docs/guides/`
- Add screenshots of new "Bilder" Library tab
- Document "Neu generieren" workflow

### 11.2 Developer Documentation

- Update API documentation for `/langgraph/agents/execute`
- Document style mapping in `imageGenerationAgent.ts`
- Add InstantDB schema changes to `/docs/architecture/`

---

## 12. Timeline Estimate

**Total**: 15-21 hours

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| Phase 1 | Quick Wins (UI cleanup, validation, style mapping) | 2-3h | P0 |
| Phase 2 | Core Features (Library, Chat, Prefill) | 6-8h | P0 |
| Phase 3 | Polish (Gemini Style, Re-Generation) | 4-6h | P1 |
| Phase 4 | Testing & QA | 3-4h | P0 |

**Recommended Sprint**: 1 week (2-3 days development + 1-2 days testing)

---

## 13. Dependencies & Risks

### Dependencies
- ✅ InstantDB (already integrated)
- ✅ OpenAI DALL-E 3 API (already integrated)
- ✅ Framer Motion (already installed)
- ✅ Agent System (already implemented)

### Risks
- **Risk 1**: DALL-E 3 URLs expire → Mitigation: Document limitation, plan S3 upload later
- **Risk 2**: InstantDB schema change breaks existing queries → Mitigation: Test thoroughly before deploy
- **Risk 3**: Chat performance degrades with many images → Mitigation: Pagination + lazy loading

---

## 14. Success Criteria

**Feature is complete when:**
- [ ] All 8 user stories pass acceptance criteria
- [ ] E2E tests pass (image generation → library → chat → re-generation)
- [ ] Visual regression tests show Gemini-style consistency
- [ ] Performance metrics within acceptable range (< 2s image load)
- [ ] Code review approved
- [ ] Documentation updated
- [ ] User testing feedback incorporated

---

## 15. Follow-Up Features (Future)

After this implementation, consider:
- Image upload to persistent storage (S3/Cloud)
- Batch image generation (multiple at once)
- Image editing (crop, filters, text overlay)
- AI-suggested prompts based on subject/grade
- Image collections/albums in Library
