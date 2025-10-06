# Comprehensive P0 Fixes - Task Breakdown

**Created**: 2025-10-05
**Status**: Ready for Execution
**Related**: [spec.md](spec.md) | [plan.md](plan.md)

---

## 🎯 Execution Strategy - 3 Parallel Agents + 1 QA Agent

**Launch Command**:
```bash
# Launch 4 agents in parallel:
# 1. backend-node-developer (Workstream A)
# 2. react-frontend-developer (Workstream B)
# 3. react-frontend-developer (Workstream C)
# 4. qa-integration-reviewer (Workstream D)
```

---

## 📋 Workstream A: Backend (Agent: backend-node-developer)

### Task A.1: Enable Backend Routes
**Priority**: P0 - BLOCKING
**Estimated Time**: 2 hours
**Dependencies**: None

**Subtasks**:
- [x] **A.1.1**: Uncomment `chatSummaryRouter` in `routes/index.ts` (5 min)
- [x] **A.1.2**: Uncomment `profileRouter` in `routes/index.ts` (5 min)
- [x] **A.1.3**: Run `npm run build` to check for TypeScript errors (15 min)
- [x] **A.1.4**: Fix TypeScript errors in `chat-summary.ts` (if any) (30 min)
- [x] **A.1.5**: Fix TypeScript errors in `profile.ts` (if any) (30 min)
- [x] **A.1.6**: Test `/api/chat/summary` endpoint with curl (10 min)
- [x] **A.1.7**: Test `/api/profile/characteristics` endpoints with curl (10 min)
- [x] **A.1.8**: Restart backend server (5 min)

**Acceptance Criteria**:
- ✅ `npm run build` succeeds (no TypeScript errors)
- ✅ Backend server starts without crashes
- ✅ `/api/chat/summary` returns 200 (not 404)
- ✅ `/api/profile/characteristics/add` returns 200 (not 404)

**Prompt for Agent**:
```
Enable chat-summary and profile routes in backend:

1. Uncomment lines 9-10 and 32-33 in teacher-assistant/backend/src/routes/index.ts
2. Run `npm run build` and fix any TypeScript errors in:
   - routes/chat-summary.ts
   - routes/profile.ts
3. Common fixes needed (from langGraphAgents debugging):
   - Replace deprecated `getInstantDB()` with `db`
   - Fix `ApiResponse<Record<string, unknown>>` type mismatches
   - Add missing imports
4. Test endpoints with curl:
   - POST http://localhost:3006/api/chat/summary (should return 200)
   - POST http://localhost:3006/api/profile/characteristics/add (should return 200)
5. Restart server

DO NOT proceed until all TypeScript errors are fixed and endpoints return 200.
```

---

### Task A.2: Enhance Image Generation with InstantDB
**Priority**: P0 - BLOCKING
**Estimated Time**: 4 hours
**Dependencies**: None

**Subtasks**:
- [x] **A.2.1**: Add InstantDB imports to `imageGeneration.ts` (5 min)
- [x] **A.2.2**: Add library_materials storage after DALL-E generation (1 hour)
- [x] **A.2.3**: Add messages storage with image metadata (1 hour)
- [x] **A.2.4**: Update response to include `library_id` and `message_id` (30 min)
- [x] **A.2.5**: Add comprehensive error handling (30 min)
- [x] **A.2.6**: Test full workflow with curl (1 hour)

**Acceptance Criteria**:
- ✅ After image generation, new entry in `library_materials` table
- ✅ After image generation, new entry in `messages` table with metadata
- ✅ Response includes `library_id` and `message_id`
- ✅ Error handling prevents data loss (even if storage fails)
- ✅ No server crashes

**Prompt for Agent**:
```
Enhance imageGeneration.ts with InstantDB integration:

IMPORTANT: Follow spec.md FR-3 exactly. Do NOT skip InstantDB storage.

1. Import: `import { db } from '../services/instantdbService';`

2. After DALL-E generates image, add:
   a) Save to library_materials:
      ```typescript
      const libraryMaterialId = db.id();
      await db.transact([
        db.tx.library_materials[libraryMaterialId].update({
          title: parameters.theme || 'Generiertes Bild',
          type: 'image',
          url: imageUrl,
          description: revisedPrompt || enhancedPrompt,
          created_at: Date.now(),
          metadata: JSON.stringify({
            dalle_title: parameters.theme,
            revised_prompt: revisedPrompt,
            model: 'dall-e-3',
            size: '1024x1024',
            quality: 'standard',
          })
        })
      ]);
      ```

   b) Save to messages (if sessionId provided):
      ```typescript
      let messageId = null;
      if (sessionId) {
        messageId = db.id();
        await db.transact([
          db.tx.messages[messageId].update({
            content: `Bild generiert: ${parameters.theme}`,
            role: 'assistant',
            chat_session_id: sessionId,
            created_at: Date.now(),
            metadata: JSON.stringify({
              type: 'image',
              image_url: imageUrl,
              library_id: libraryMaterialId,
              revised_prompt: revisedPrompt,
            })
          })
        ]);
      }
      ```

3. Update response to include library_id and message_id

4. Test with curl:
   curl -X POST http://localhost:3006/api/langgraph/agents/execute \
     -H "Content-Type: application/json" \
     -d '{"agentType":"image-generation","parameters":{"theme":"Test"},"sessionId":"test-123"}'

5. Verify in InstantDB:
   - library_materials has new entry
   - messages has new entry with metadata

DO NOT use quick hacks. Full integration required.
```

---

## 📋 Workstream B: Frontend Home/Chat (Agent: react-frontend-developer)

### Task B.1: Chat Summary on Home
**Priority**: P0
**Estimated Time**: 2 hours
**Dependencies**: Task A.1 (backend route enabled)

**Subtasks**:
- [x] **B.1.1**: Verify `useChatSummary` hook exists (10 min)
- [x] **B.1.2**: Create hook if missing (30 min)
- [x] **B.1.3**: Import hook in `Home.tsx` (5 min)
- [x] **B.1.4**: Add summary display in "Letzte Chats" section (1 hour)
- [x] **B.1.5**: Add loading/error states (15 min)

**Acceptance Criteria**:
- ✅ Summary displays for each chat in "Letzte Chats"
- ✅ Loading state shows while fetching
- ✅ Fallback text if no summary available
- ✅ No console errors

**Prompt for Agent**:
```
Add chat summary to Home view:

1. Check if teacher-assistant/frontend/src/hooks/useChatSummary.ts exists
   - If missing, create minimal version (see plan.md Phase B1.2)

2. Update teacher-assistant/frontend/src/pages/Home/Home.tsx:
   - Import `useChatSummary` hook
   - In "Letzte Chats" section, for each chat:
     ```typescript
     const { summary, isLoading } = useChatSummary(chat.id);
     ```
   - Display summary below chat title:
     ```typescript
     {isLoading ? (
       <p className="text-sm text-gray-500">Lädt...</p>
     ) : (
       <p className="text-sm text-gray-600 line-clamp-2">{summary || 'Keine Zusammenfassung'}</p>
     )}
     ```

3. Test: Navigate to Home → check "Letzte Chats" → summaries appear

DO NOT proceed if backend route /api/chat/summary returns 404.
Wait for Workstream A to complete Task A.1 first.
```

---

### Task B.2: Auto-Submit Prompt-Vorschläge
**Priority**: P0
**Estimated Time**: 2 hours
**Dependencies**: None

**Subtasks**:
- [x] **B.2.1**: Locate current `PromptTile` onClick handler (10 min)
- [x] **B.2.2**: Implement new chat creation logic (1 hour)
- [x] **B.2.3**: Add auto-submit after navigation (30 min)
- [x] **B.2.4**: Update App.tsx state management (if needed) (20 min)

**Acceptance Criteria**:
- ✅ Click creates NEW chat (not append to existing)
- ✅ Prompt auto-submitted
- ✅ Navigation works (Home → Chat)
- ✅ No loading failures

**Prompt for Agent**:
```
Fix auto-submit prompt tiles to create NEW chat:

CURRENT BUG: Clicking prompt tile appends to existing chat (wrong!)
EXPECTED: Create NEW chat + auto-submit prompt

1. Update teacher-assistant/frontend/src/components/PromptTile.tsx:
   ```typescript
   const handlePromptClick = async () => {
     // 1. Create new chat session
     const newChatId = db.id();
     await db.transact([
       db.tx.chat_sessions[newChatId].update({
         title: title,
         user_id: user?.id,
         created_at: Date.now(),
       })
     ]);

     // 2. Navigate to Chat with new session
     setCurrentChatSessionId(newChatId);
     navigate('/chat');

     // 3. Auto-submit prompt (after navigation)
     setTimeout(() => sendMessage(prompt, newChatId), 300);
   };
   ```

2. Test:
   - Click prompt tile on Home
   - Verify creates NEW chat (check chat list)
   - Verify prompt auto-submitted
   - Verify no errors

DO NOT append to existing chat. Always create new chat.
```

---

### Task B.3: Image in Chat (Display)
**Priority**: P0
**Estimated Time**: 2 hours
**Dependencies**: Task A.2 (backend includes metadata)

**Subtasks**:
- [x] **B.3.1**: Add image message rendering in `ChatView.tsx` (1 hour)
- [x] **B.3.2**: Add image preview modal (30 min)
- [x] **B.3.3**: Add error handling for broken images (15 min)
- [x] **B.3.4**: Test with real image generation (15 min)

**Acceptance Criteria**:
- ✅ Image appears as thumbnail (~200px)
- ✅ Click opens full-size preview
- ✅ Caption + revised prompt shown
- ✅ No broken images

**Prompt for Agent**:
```
Add image display to ChatView:

1. Update teacher-assistant/frontend/src/components/ChatView.tsx:

   In renderMessage function, add:
   ```typescript
   if (message.metadata) {
     const metadata = typeof message.metadata === 'string'
       ? JSON.parse(message.metadata)
       : message.metadata;

     if (metadata.type === 'image' && metadata.image_url) {
       return (
         <div className="image-message-container">
           <img
             src={metadata.image_url}
             className="max-w-[200px] rounded-lg cursor-pointer"
             onClick={() => setPreviewImageUrl(metadata.image_url)}
             onError={(e) => e.currentTarget.src = '/placeholder.png'}
           />
           <p className="text-sm text-gray-700 mt-2">{message.content}</p>
           {metadata.revised_prompt && (
             <p className="text-xs text-gray-500 italic">"{metadata.revised_prompt}"</p>
           )}
         </div>
       );
     }
   }
   ```

2. Add preview modal (full-screen on click)

3. Test: Generate image → verify thumbnail appears → click → preview opens

DO NOT proceed until backend Task A.2 is complete (messages need metadata).
```

---

### Task B.4: Image in Context (AI Awareness)
**Priority**: P1
**Estimated Time**: 2 hours
**Dependencies**: Task A.2, Task B.3

**Subtasks**:
- [x] **B.4.1**: Update backend `chatService.ts` context building (1 hour)
- [x] **B.4.2**: Verify frontend sends metadata in context (30 min)
- [x] **B.4.3**: Test with follow-up question (30 min)

**Acceptance Criteria**:
- ✅ AI receives image URL in context
- ✅ AI can reference images
- ✅ Revised prompt included

**Prompt for Agent**:
```
Add image awareness to chat context:

1. Update teacher-assistant/backend/src/services/chatService.ts:

   In buildChatContext function:
   ```typescript
   return messages.map(msg => {
     let content = msg.content;

     if (msg.metadata) {
       const metadata = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;

       if (metadata.type === 'image' && metadata.image_url) {
         content = `[Generated Image: ${metadata.image_url}]\n${msg.content}`;
         if (metadata.revised_prompt) {
           content += `\n(DALL-E Description: "${metadata.revised_prompt}")`;
         }
       }
     }

     return { role: msg.role, content };
   });
   ```

2. Test:
   - Generate image
   - Ask "Was zeigt das Bild?"
   - Verify AI response references the image

Context should include image URL so AI can reference it.
```

---

## 📋 Workstream C: Frontend Library/Profile (Agent: react-frontend-developer)

### Task C.1: Images in Library
**Priority**: P0
**Estimated Time**: 2 hours
**Dependencies**: Task A.2 (images in library_materials)

**Subtasks**:
- [x] **C.1.1**: Add "Bilder" filter tab (30 min)
- [x] **C.1.2**: Query library_materials with type='image' (30 min)
- [x] **C.1.3**: Render image cards (1 hour)

**Acceptance Criteria**:
- ✅ "Bilder" filter shows only images
- ✅ Image cards display thumbnail + title + description
- ✅ Click opens preview
- ✅ No broken images

**Prompt for Agent**:
```
Add "Bilder" filter to Library view:

1. Update teacher-assistant/frontend/src/pages/Library/Library.tsx:

   a) Add "Bilder" tab:
      ```typescript
      <button onClick={() => setSelectedTab('images')}>Bilder</button>
      ```

   b) Filter query:
      ```typescript
      const { data: libraryMaterials } = useQuery({
        library_materials: {
          $: {
            where: {
              ...(selectedTab === 'images' ? { type: 'image' } : {})
            },
            order: { created_at: 'desc' }
          }
        }
      });
      ```

   c) Render image cards:
      ```typescript
      {materials.map(m => {
        if (m.type === 'image') {
          return (
            <div className="library-image-card">
              <img src={m.url} className="w-full h-48 object-cover" />
              <h3>{m.title}</h3>
              <p>{m.description}</p>
            </div>
          );
        }
      })}
      ```

2. Test: Generate image → go to Library → click "Bilder" → image appears

DO NOT proceed until backend Task A.2 is complete (images must be in library_materials).
```

---

### Task C.2: Chat Summary in Library
**Priority**: P1
**Estimated Time**: 1 hour
**Dependencies**: Task A.1, Task B.1

**Subtasks**:
- [x] **C.2.1**: Reuse `useChatSummary` hook from Task B.1 (10 min)
- [x] **C.2.2**: Add summary display to library chat items (30 min)
- [x] **C.2.3**: Test (20 min)

**Acceptance Criteria**: Same as Task B.1

**Prompt for Agent**:
```
Add chat summary to Library view:

REUSE hook from Workstream B Task B.1.

1. Update teacher-assistant/frontend/src/pages/Library/Library.tsx:
   - Import `useChatSummary`
   - In chat rendering section, use same pattern as Home view
   - Display summary below chat title

2. Test: Go to Library → click "Chats" → summaries appear

DO NOT reimplement hook. Reuse existing `useChatSummary`.
```

---

### Task C.3: Anrede + Bibliothek Rename
**Priority**: P2
**Estimated Time**: 1 hour
**Dependencies**: None

**Subtasks**:
- [x] **C.3.1**: Search & replace "Ihr" → "du" (30 min)
- [x] **C.3.2**: Rename "Library" → "Bibliothek" in UI (30 min)

**Acceptance Criteria**:
- ✅ No "Ihr/Ihre" in UI
- ✅ Tab shows "Bibliothek"
- ✅ Page title shows "Bibliothek"

**Prompt for Agent**:
```
Fix German address (formal → informal) and rename Library:

1. Search & Replace "Ihr" → "du":
   cd teacher-assistant/frontend/src
   grep -rn "Ihr " . --include="*.tsx"

   Manually review each instance and replace:
   - "Ihre" → "Deine"
   - "Ihr" → "Dein"
   - "Ihnen" → "Dir"

2. Rename "Library" → "Bibliothek":
   - App.tsx: Tab label
   - Library.tsx: Page title
   - Keep route `/library` unchanged

3. Test: Check all UI text is now informal "du" and German "Bibliothek"

DO NOT change route paths (breaking change). Only UI labels.
```

---

### Task C.4: Profile Fixes
**Priority**: P0
**Estimated Time**: 3 hours
**Dependencies**: Task A.1 (profile route enabled)

**Subtasks**:
- [x] **C.4.1**: Verify `useProfileCharacteristics` hook (30 min)
- [x] **C.4.2**: Fix button position in ProfileView (1 hour)
- [x] **C.4.3**: Add auto-extraction trigger in ChatView (1.5 hours)

**Acceptance Criteria**:
- ✅ Add characteristic works (no 404)
- ✅ Button visible without scrolling
- ✅ Auto-extraction triggers after 3+ message chat

**Prompt for Agent**:
```
Fix Profile view issues:

1. FR-11: Verify hook calls /api/profile/characteristics/add correctly
   (Should work after Workstream A Task A.1 completes)

2. FR-12: Fix button position in ProfileView.tsx:
   Move "Merkmal hinzufügen +" button ABOVE "Allgemeine Informationen" section
   OR make it sticky: `className="sticky bottom-20 ..."`

3. FR-13: Add auto-extraction to ChatView.tsx:
   ```typescript
   useEffect(() => {
     return () => {
       // On unmount, trigger extraction
       if (messages.length >= 3) {
         api.post('/profile/extract', {
           userId: user?.id,
           messages: messages.slice(0, 10)
         });
       }
     };
   }, []);
   ```

4. Test:
   - Add characteristic → no 404
   - Button visible without scrolling
   - Send 3+ messages → switch tab → profile updated

DO NOT proceed until backend route /api/profile/* is enabled.
```

---

## 📋 Workstream D: QA (Agent: qa-integration-reviewer)

### Task D.1: Write Playwright E2E Tests
**Priority**: P0
**Estimated Time**: 3 hours
**Dependencies**: None (can start immediately)

**Subtasks**:
- [x] **D.1.1**: Create test file `tests/complete.spec.ts` (30 min)
- [x] **D.1.2**: Write FR-1,2 tests (Home) (1 hour)
- [x] **D.1.3**: Write FR-3-6 tests (Image E2E) (1 hour)
- [x] **D.1.4**: Write FR-7-13 tests (Library/Profile) (30 min)

**Acceptance Criteria**:
- ✅ 15+ E2E tests written
- ✅ Test auth bypass configured
- ✅ Screenshots configured
- ✅ Console/network monitoring

**Prompt for Agent**:
```
Write comprehensive Playwright E2E tests:

1. Create .specify/specs/comprehensive-p0-fixes/tests/complete.spec.ts

2. Follow spec.md QA Strategy exactly (copy test code from spec)

3. Include:
   - Test auth bypass setup
   - Screenshot capture for each test
   - Console error monitoring
   - Network 404/500 monitoring

4. Test structure:
   - FR-1: Home chat summary
   - FR-2: Auto-submit prompts
   - FR-3-6: Image generation E2E
   - FR-7-9: Library (summary, anrede, bibliothek)
   - FR-10-13: Profile (route, add, button, auto-extraction)

5. Run tests: npm run test:e2e

DO NOT skip any tests. Full coverage required.
```

---

### Task D.2: Continuous Testing Loop
**Priority**: P0
**Estimated Time**: 5 hours (ongoing)
**Dependencies**: Task D.1 + all implementation tasks

**Process**:
1. As code lands from Workstreams A/B/C, run relevant tests
2. Report failures immediately
3. Iterate until all GREEN

**Prompt for Agent**:
```
Run continuous QA loop:

PROCESS:
1. Wait for implementation tasks to complete
2. Run Playwright test suite: npm run test:e2e
3. For each failure:
   - Screenshot review: qa-screenshots/*.png
   - Console log review
   - Network log review
   - Report to developer with exact error
4. Re-run after fix
5. Repeat until all tests GREEN

ITERATION PROTOCOL:
- Run tests after EACH code merge
- Log failures in QA-ITERATION-LOG.md
- Track fix attempts
- DO NOT approve until 100% GREEN

SUCCESS CRITERIA:
- 15/15 tests passing
- Zero console errors
- Zero 404 errors
- All screenshots match expected behavior
```

---

### Task D.3: Manual QA Verification
**Priority**: P0
**Estimated Time**: 1 hour
**Dependencies**: All tests GREEN

**Prompt for Agent**:
```
Perform manual QA checklist:

1. Use MANUAL-QA-CHECKLIST.md from spec.md

2. Test each feature manually:
   - Home: Chat summary, auto-submit prompts
   - Chat: Image generation E2E
   - Library: Images, chat summary, anrede, bibliothek
   - Profile: Add characteristics, button position, auto-extraction

3. Check:
   - Network tab: No 404/500 errors
   - Console: No red errors
   - Backend: No crashes

4. Save screenshots to manual-qa/ folder

5. Final approval sign-off

DO NOT approve if ANY item fails.
```

---

## 🚀 Execution Instructions

### Step 1: Launch Parallel Agents

**Backend Agent**:
```
Launch backend-node-developer agent with prompt:

"Execute Workstream A from .specify/specs/comprehensive-p0-fixes/tasks.md
- Task A.1: Enable Backend Routes (2 hours)
- Task A.2: Enhance Image Generation (4 hours)

Work independently. Report completion + test results."
```

**Frontend Agent 1 (Home/Chat)**:
```
Launch react-frontend-developer agent with prompt:

"Execute Workstream B from .specify/specs/comprehensive-p0-fixes/tasks.md
- Task B.1: Chat Summary on Home (2 hours)
- Task B.2: Auto-Submit Prompts (2 hours)
- Task B.3: Image in Chat (2 hours)
- Task B.4: Image in Context (2 hours)

Wait for backend Task A.1/A.2 to complete before testing integration.
Work independently. Report completion."
```

**Frontend Agent 2 (Library/Profile)**:
```
Launch react-frontend-developer agent with prompt:

"Execute Workstream C from .specify/specs/comprehensive-p0-fixes/tasks.md
- Task C.1: Images in Library (2 hours)
- Task C.2: Chat Summary in Library (1 hour)
- Task C.3: Anrede + Bibliothek (1 hour)
- Task C.4: Profile Fixes (3 hours)

Wait for backend Task A.1/A.2 to complete before testing integration.
Work independently. Report completion."
```

**QA Agent**:
```
Launch qa-integration-reviewer agent with prompt:

"Execute Workstream D from .specify/specs/comprehensive-p0-fixes/tasks.md
- Task D.1: Write Playwright Tests (3 hours)
- Task D.2: Continuous Testing Loop (5 hours)
- Task D.3: Manual QA Verification (1 hour)

Start Task D.1 immediately.
Start Task D.2 when implementation tasks complete.
Iterate until all tests GREEN.
Report final approval."
```

---

### Step 2: Monitor Progress

**Check Agent Status**:
- Backend: Tasks A.1, A.2 complete?
- Frontend B: Tasks B.1, B.2, B.3, B.4 complete?
- Frontend C: Tasks C.1, C.2, C.3, C.4 complete?
- QA: All tests GREEN?

---

### Step 3: QA Iteration

**Day 2**: QA Loop
- Run full test suite
- Fix failures
- Re-run
- Repeat until GREEN

---

### Step 4: Deployment

**Final Checklist**:
- ✅ 15/15 Playwright tests GREEN
- ✅ Manual QA checklist complete
- ✅ Zero console errors
- ✅ Zero 404 errors
- ✅ Backend stable

**Deploy**: After final approval

---

**Tasks Status**: ✅ Ready for Execution
**Next Step**: Launch 4 parallel agents
