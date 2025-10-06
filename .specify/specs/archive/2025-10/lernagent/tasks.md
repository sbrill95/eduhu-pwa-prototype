# Lernagent - Implementation Tasks

**Feature**: Lernagent Creator & Student Learning Interface
**Version**: 1.0
**Status**: Ready for Implementation
**Erstellt**: 2025-10-04

---

## 📋 Task Overview

**Total Tasks**: 45
**Estimated Duration**: 3-4 Wochen (2 Entwickler)

### Phase Breakdown

- **Phase 1: Backend Foundation** (8 Tage) - Backend-Agent
- **Phase 2: Frontend Creator** (6 Tage) - Frontend-Agent
- **Phase 3: Student Experience** (5 Tage) - Frontend-Agent
- **Phase 4: Integration & Testing** (4 Tage) - QA-Agent + Playwright-Agent
- **Phase 5: Polish & Launch** (3 Tage) - Emotional-Design-Agent + QA-Agent

---

## 🔧 Phase 1: Backend Foundation

**Agent**: backend-node-developer
**Duration**: 8 Tage
**Dependencies**: None

### Task 1.1: Setup Email Service ⚙️

**Priority**: High
**Estimated Time**: 2h
**Agent**: backend-node-developer

- [ ] Install Resend: `npm install resend`
- [ ] Add environment variables to `.env.example` and `.env`:
  ```
  RESEND_API_KEY=
  RESEND_FROM_EMAIL=noreply@eduhu.app
  ```
- [ ] Create `teacher-assistant/backend/src/services/emailService.ts`
- [ ] Implement `sendSubmissionEmail()` function
- [ ] Implement `sendAgentCreationConfirmation()` function
- [ ] Write unit tests: `emailService.test.ts`
- [ ] Test with real email addresses

**Acceptance Criteria**:
- Emails sent successfully
- Templates render correctly
- Error handling works (retry logic)

---

### Task 1.2: QR Code Service ⚙️

**Priority**: High
**Estimated Time**: 2h
**Agent**: backend-node-developer

- [ ] Install QR Code library: `npm install qrcode @types/qrcode`
- [ ] Create `teacher-assistant/backend/src/services/qrCodeService.ts`
- [ ] Implement `generateQRCode(url: string): Promise<string>` (returns base64)
- [ ] Add configuration: 512x512px, 2px margin
- [ ] Write unit tests: `qrCodeService.test.ts`
- [ ] Test with various URLs

**Acceptance Criteria**:
- QR codes generate as base64 PNG
- Scannable with smartphone cameras
- Performance: <500ms per generation

---

### Task 1.3: Short ID Generation Service ⚙️

**Priority**: High
**Estimated Time**: 3h
**Agent**: backend-node-developer

- [ ] Install nanoid: `npm install nanoid`
- [ ] Create `teacher-assistant/backend/src/services/shortIdService.ts`
- [ ] Implement `generateUniqueShortId()` with collision check
- [ ] Use alphabet without ambiguous chars (exclude 0, O, I, l)
- [ ] Add retry logic (max 10 attempts)
- [ ] Write unit tests with collision simulation
- [ ] Performance test: 1000 IDs in <1s

**Acceptance Criteria**:
- IDs are 6 characters long
- No collisions in 10,000 generations
- Easy to read/type (no ambiguous chars)

---

### Task 1.4: InstantDB Schema Update 📊

**Priority**: High
**Estimated Time**: 2h
**Agent**: backend-node-developer

- [ ] Add `learningAgents` collection to `teacher-assistant/backend/src/schemas/instantdb.ts`
- [ ] Add `learningAgentSessions` collection (for Phase 2 analytics)
- [ ] Define TypeScript interfaces in `teacher-assistant/backend/src/types/index.ts`:
  - `LearningAgent`
  - `LearningAgentSession`
  - `AgentConfig`
- [ ] Add indexes:
  - `learningAgents.shortId` (unique)
  - `learningAgents.teacherId`
  - `learningAgentSessions.agentId + studentName`
- [ ] Test schema with mock data

**Acceptance Criteria**:
- Schema compiles without errors
- All required fields present
- Indexes created successfully

---

### Task 1.5: Agent CRUD Service ⚙️

**Priority**: High
**Estimated Time**: 4h
**Agent**: backend-node-developer

- [ ] Create `teacher-assistant/backend/src/services/agentService.ts`
- [ ] Implement `createAgent(config: AgentConfig, teacherId: string): Promise<LearningAgent>`
  - Upload files to OpenAI Files API
  - Generate short ID
  - Generate QR code
  - Create InstantDB entry
  - Send confirmation email
- [ ] Implement `getAgentByShortId(shortId: string): Promise<LearningAgent | null>`
- [ ] Implement `updateAgent(agentId: string, updates: Partial<AgentConfig>): Promise<LearningAgent>`
- [ ] Implement `deleteAgent(agentId: string): Promise<void>`
- [ ] Implement `listTeacherAgents(teacherId: string): Promise<LearningAgent[]>`
- [ ] Write comprehensive tests: `agentService.test.ts`

**Acceptance Criteria**:
- All CRUD operations work
- OpenAI file uploads handle errors gracefully
- Transactions rollback on failures

---

### Task 1.6: Session Management Service ⚙️

**Priority**: High
**Estimated Time**: 3h
**Agent**: backend-node-developer

- [ ] Create `teacher-assistant/backend/src/services/sessionService.ts`
- [ ] Implement `createSession(agentId: string, studentName: string): Promise<Session>`
  - Check for existing session (recovery)
  - Generate session token (JWT)
  - Store in InstantDB
- [ ] Implement `getSession(sessionToken: string): Promise<Session | null>`
- [ ] Implement `updateSessionActivity(sessionToken: string): Promise<void>`
- [ ] Implement `recordSubmission(sessionToken: string): Promise<void>`
- [ ] Write tests: `sessionService.test.ts`

**Acceptance Criteria**:
- Session recovery works correctly
- Tokens expire after 30 days
- Activity tracking updates timestamps

---

### Task 1.7: API Routes - Agent Management 🌐

**Priority**: High
**Estimated Time**: 4h
**Agent**: backend-node-developer

- [ ] Create `teacher-assistant/backend/src/routes/agents.ts`
- [ ] Implement `POST /api/agents/create`
  - Validation with Zod schema
  - File upload middleware (multer)
  - Call `agentService.createAgent()`
  - Return agent with QR code + share URL
- [ ] Implement `GET /api/agents/:shortId`
  - Public endpoint (no auth)
  - Check validity
  - Return agent config
- [ ] Implement `PATCH /api/agents/:agentId`
  - Auth required (teacher only)
  - Validate editable fields
  - Call `agentService.updateAgent()`
- [ ] Implement `DELETE /api/agents/:agentId`
  - Auth required (teacher only)
  - Show warning if active sessions
  - Call `agentService.deleteAgent()`
- [ ] Implement `GET /api/agents`
  - Auth required (teacher)
  - Return teacher's agents
- [ ] Add validation schemas to `teacher-assistant/backend/src/middleware/agentValidation.ts`
- [ ] Write integration tests: `agents.test.ts`

**Acceptance Criteria**:
- All endpoints return correct status codes
- Validation errors return helpful messages
- File uploads work with multipart/form-data
- Rate limiting applied (10 agents/hour per teacher)

---

### Task 1.8: API Routes - Student Session & Chat 🌐

**Priority**: High
**Estimated Time**: 5h
**Agent**: backend-node-developer

- [ ] Add to `teacher-assistant/backend/src/routes/agents.ts`
- [ ] Implement `POST /api/agents/:agentId/session`
  - Validate student name (min 2 chars)
  - Call `sessionService.createSession()`
  - Return session token + recovery info
- [ ] Implement `POST /api/agents/:agentId/chat`
  - Validate session token
  - Build custom system prompt from agent config
  - Attach OpenAI file IDs for knowledge base
  - Stream response (SSE)
  - Update session activity
- [ ] Implement `POST /api/agents/:agentId/submit`
  - Validate session token
  - Get chat history from request
  - Send email via `emailService.sendSubmissionEmail()`
  - Record submission in session
  - Return success
- [ ] Add rate limiting:
  - 50 messages per session
  - 10 submissions per student per day
- [ ] Write integration tests: `agents.session.test.ts`

**Acceptance Criteria**:
- Session creation works with/without recovery
- Chat streams responses correctly
- System prompt includes agent configuration
- Submission emails sent successfully
- Rate limits enforced

---

### Task 1.9: Prompt Engineering for Pedagogical Strategies 📝

**Priority**: High
**Estimated Time**: 3h
**Agent**: backend-node-developer

- [ ] Create `teacher-assistant/backend/src/services/promptService.ts`
- [ ] Implement `buildLearningAgentPrompt(agent: LearningAgent): string`
- [ ] Define prompts for each strategy:
  - **Sokratisch**: "Stelle Fragen, lass den Schüler selbst denken. Gib keine direkten Lösungen."
  - **Geführt**: "Gib klare Schritt-für-Schritt Anleitungen. Erkläre jeden Schritt ausführlich."
  - **Adaptiv**: "Beginne mit Fragen. Wenn der Schüler nicht weiterkommt, gib mehr Hilfe."
- [ ] Add goal-specific instructions based on `learningGoalType`
- [ ] Add knowledge base context formatting
- [ ] Write tests with sample agents: `promptService.test.ts`
- [ ] Manual testing with real OpenAI API

**Acceptance Criteria**:
- Each strategy produces distinct behavior
- Prompts stay within token limits
- Knowledge base correctly referenced

---

### Task 1.10: Error Handling & Logging 📊

**Priority**: Medium
**Estimated Time**: 2h
**Agent**: backend-node-developer

- [ ] Add error logging to all services
- [ ] Implement retry logic for external APIs:
  - OpenAI API (3 retries with exponential backoff)
  - Resend API (2 retries)
- [ ] Add error monitoring (Sentry or similar)
- [ ] Create error response standardization:
  ```typescript
  {
    success: false,
    error: {
      code: 'AGENT_NOT_FOUND',
      message: 'Dieser Lernagent existiert nicht',
      details: {}
    }
  }
  ```
- [ ] Document error codes in `teacher-assistant/backend/docs/error-codes.md`

**Acceptance Criteria**:
- All errors logged with context
- Retry logic works correctly
- User-friendly error messages

---

## 🎨 Phase 2: Frontend Creator (Teacher Interface)

**Agent**: react-frontend-developer
**Duration**: 6 Tage
**Dependencies**: Phase 1 complete

### Task 2.1: Intent Detection for Agent Creation 🧠

**Priority**: High
**Estimated Time**: 2h
**Agent**: react-frontend-developer

- [ ] Create `teacher-assistant/frontend/src/lib/intentDetection.ts`
- [ ] Implement `detectAgentCreationIntent(message: string): boolean`
- [ ] Add patterns:
  - "lernagent erstellen"
  - "lernbot erstellen"
  - "chatbot für schüler"
  - "agent für klasse"
- [ ] Write comprehensive tests: `intentDetection.test.ts`
- [ ] Integrate into `ChatView.tsx` message handler

**Acceptance Criteria**:
- 95%+ accuracy on test cases
- No false positives on normal chat messages
- Modal opens on positive detection

---

### Task 2.2: Agent Creation Modal - Setup 🎨

**Priority**: High
**Estimated Time**: 4h
**Agent**: react-frontend-developer

- [ ] Create `teacher-assistant/frontend/src/components/AgentCreationModal.tsx`
- [ ] Implement form with 5 sections:
  1. Lernziel (Goal Type + Text)
  2. Wissensbasis (Knowledge Text + File Upload)
  3. Pädagogische Strategie (3 options)
  4. Abgabe (Toggle + Email)
  5. Gültigkeit (Date Picker)
- [ ] Add form state management (useState or react-hook-form)
- [ ] Add validation:
  - Goal text: min 10 chars
  - Email: valid format (if submission enabled)
  - Valid until: min 1 day, max 90 days
- [ ] Style with Gemini Design System (Tailwind)
- [ ] Add loading states
- [ ] Write component tests: `AgentCreationModal.test.tsx`

**Acceptance Criteria**:
- Form validates all inputs
- Visual design matches Gemini style
- Responsive on mobile
- Keyboard navigation works

---

### Task 2.3: Strategy Selection Cards 🎨

**Priority**: Medium
**Estimated Time**: 3h
**Agent**: react-frontend-developer

- [ ] Create `teacher-assistant/frontend/src/components/StrategyCard.tsx`
- [ ] Design 3 visually distinct cards:
  - **Sokratisch**: Icon 🤔, Blue accent, Description
  - **Geführt**: Icon 🧭, Green accent, Description
  - **Adaptiv**: Icon 🎯, Orange accent, Description
- [ ] Add tooltip/info icons with detailed explanations
- [ ] Implement selection state (border highlight)
- [ ] Add hover animations (subtle scale)
- [ ] Write component tests: `StrategyCard.test.tsx`

**Acceptance Criteria**:
- Cards are visually appealing
- Clear descriptions help teachers choose
- Selection state obvious
- Accessible (keyboard + screen reader)

---

### Task 2.4: File Upload Component Enhancement 📁

**Priority**: High
**Estimated Time**: 3h
**Agent**: react-frontend-developer

- [ ] Enhance existing `FileUpload` component or create new variant
- [ ] Support multiple files
- [ ] Show upload progress
- [ ] Display file previews:
  - PDF: First page thumbnail
  - DOCX: Document icon
  - TXT: File icon
- [ ] Add remove button per file
- [ ] Validate:
  - Max 10MB per file
  - Total max 50MB
  - Supported formats (OpenAI API)
- [ ] Write tests: `FileUpload.agent.test.tsx`

**Acceptance Criteria**:
- Multiple files can be selected
- Progress bars show upload status
- Files can be removed before submission
- Validation errors show clearly

---

### Task 2.5: useAgentCreation Hook 🔧

**Priority**: High
**Estimated Time**: 2h
**Agent**: react-frontend-developer

- [ ] Create `teacher-assistant/frontend/src/hooks/useAgentCreation.ts`
- [ ] Implement `createAgent(config: AgentConfig)` function
- [ ] Handle FormData construction (files + JSON)
- [ ] Add loading, error, success states
- [ ] Implement retry logic (1 retry on network error)
- [ ] Write tests: `useAgentCreation.test.ts`

**Acceptance Criteria**:
- FormData correctly structured
- Loading states update correctly
- Errors handled gracefully
- Success returns agent data

---

### Task 2.6: Agent Result View 🎉

**Priority**: High
**Estimated Time**: 4h
**Agent**: react-frontend-developer

- [ ] Create `teacher-assistant/frontend/src/components/AgentResultView.tsx`
- [ ] Display:
  - Success message with celebration
  - QR Code (centered, large)
  - Share URL (with copy button)
  - Share buttons (WhatsApp, Email, Generic Share API)
  - Download QR button
  - Validity info
  - "Zu meinen Agenten" CTA
- [ ] Implement copy-to-clipboard with feedback
- [ ] Implement QR download (as PNG)
- [ ] Implement share functionality:
  - WhatsApp: `https://wa.me/?text=${encodeURIComponent(shareUrl)}`
  - Email: `mailto:?subject=Lernbot&body=${encodeURIComponent(shareUrl)}`
  - Native Share API (if available)
- [ ] Style with Gemini Design (Orange accents)
- [ ] Write tests: `AgentResultView.test.tsx`

**Acceptance Criteria**:
- QR code displays clearly
- All share methods work
- Copy button shows success feedback
- Download QR saves as PNG
- Mobile-friendly

---

### Task 2.7: Agent Management View (Library Integration) 📚

**Priority**: High
**Estimated Time**: 5h
**Agent**: react-frontend-developer

- [ ] Create `teacher-assistant/frontend/src/pages/Library/AgentManagementView.tsx`
- [ ] Add new tab to Library page: "Lernagenten"
- [ ] Implement filter tabs: Aktiv, Abgelaufen
- [ ] Create `AgentCard.tsx` component:
  - Display: Goal, Strategy, Status Badge, Valid Until, Session Count
  - Actions: Bearbeiten, Löschen, Teilen
- [ ] Implement useAgents hook: `teacher-assistant/frontend/src/hooks/useAgents.ts`
  - Fetch agents from InstantDB
  - Real-time updates
  - Filter by status
- [ ] Implement edit modal (reuse AgentCreationModal with edit mode)
- [ ] Implement delete confirmation dialog
- [ ] Implement share sheet (reuse from AgentResultView)
- [ ] Write tests: `AgentManagementView.test.tsx`

**Acceptance Criteria**:
- Agents load from InstantDB
- Real-time updates work
- Edit only allows knowledge base + validity changes
- Delete shows warning if active sessions
- Share functionality works

---

### Task 2.8: Agent Edit Functionality 🛠️

**Priority**: Medium
**Estimated Time**: 3h
**Agent**: react-frontend-developer

- [ ] Add `editMode` prop to `AgentCreationModal`
- [ ] In edit mode:
  - Pre-fill form with agent data
  - Disable: Goal Type, Goal Text, Strategy (non-editable)
  - Enable: Knowledge Text, Files, Email, Valid Until
- [ ] Show existing files with remove option
- [ ] Allow adding new files
- [ ] Call `PATCH /api/agents/:agentId` on submit
- [ ] Show success notification
- [ ] Refresh agent list

**Acceptance Criteria**:
- Edit mode pre-fills correctly
- Non-editable fields are disabled
- Files can be added/removed
- Updates persist to backend

---

## 👨‍🎓 Phase 3: Student Experience

**Agent**: react-frontend-developer
**Duration**: 5 Tage
**Dependencies**: Phase 1 complete

### Task 3.1: Learning Chat Route & Page Setup 🌐

**Priority**: High
**Estimated Time**: 2h
**Agent**: react-frontend-developer

- [ ] Create route in `teacher-assistant/frontend/src/App.tsx`: `/learn/:shortId`
- [ ] Create page: `teacher-assistant/frontend/src/pages/Learn/LearningChatView.tsx`
- [ ] Implement page structure:
  - Header with "Lernbot" title
  - Subtle indicator: "🤖 Von deiner Lehrkraft erstellt"
  - Chat interface (reuse ChatView components)
  - Submit button (if enabled)
- [ ] Handle loading state while fetching agent
- [ ] Handle expired agent state (404-like page)
- [ ] Write tests: `LearningChatView.test.tsx`

**Acceptance Criteria**:
- Route works with shortId parameter
- Loading states display correctly
- Expired agents show error message

---

### Task 3.2: Student Name Dialog 📝

**Priority**: High
**Estimated Time**: 3h
**Agent**: react-frontend-developer

- [ ] Create `teacher-assistant/frontend/src/components/StudentNameDialog.tsx`
- [ ] Implement modal:
  - Welcome message
  - "Deine Lehrkraft hat diesen Lernbot erstellt"
  - Name input field
  - Validation: min 2 chars, max 50 chars
  - Submit button: "Los geht's!"
- [ ] Show recovery dialog if existing session found:
  - "Willkommen zurück, [Name]!"
  - "Möchtest du deine vorherige Session fortsetzen?"
  - Buttons: "Fortsetzen" / "Neu starten"
- [ ] Store session token in localStorage
- [ ] Write tests: `StudentNameDialog.test.tsx`

**Acceptance Criteria**:
- Name validation works
- Recovery dialog appears for existing sessions
- Session token stored correctly
- Cannot bypass name entry (if submission enabled)

---

### Task 3.3: useLearningSession Hook 🔧

**Priority**: High
**Estimated Time**: 3h
**Agent**: react-frontend-developer

- [ ] Create `teacher-assistant/frontend/src/hooks/useLearningSession.ts`
- [ ] Implement `startSession(agentId: string, studentName: string)`
  - Call `POST /api/agents/:agentId/session`
  - Store session token
  - Return session data
- [ ] Implement `loadAgent(shortId: string)`
  - Call `GET /api/agents/:shortId`
  - Handle expired/not found
- [ ] Implement `sendMessage(message: string)`
  - Call `POST /api/agents/:agentId/chat`
  - Handle streaming responses
- [ ] Implement `submitWork(chatHistory: Message[])`
  - Call `POST /api/agents/:agentId/submit`
  - Handle success/error
- [ ] Write tests: `useLearningSession.test.ts`

**Acceptance Criteria**:
- All API calls work correctly
- Session token persists across page reloads
- Error handling works
- Streaming responses display in real-time

---

### Task 3.4: Submit Intent Detection (Student Side) 🧠

**Priority**: High
**Estimated Time**: 2h
**Agent**: react-frontend-developer

- [ ] Add to `teacher-assistant/frontend/src/lib/intentDetection.ts`
- [ ] Implement `detectSubmitIntent(message: string): boolean`
- [ ] Add patterns:
  - "ich möchte abgeben"
  - "abgeben"
  - "fertig"
  - "ich bin fertig"
  - "submit"
- [ ] Write tests with various phrasings
- [ ] Integrate into LearningChatView message handler
- [ ] Trigger confirmation dialog on detection

**Acceptance Criteria**:
- High accuracy (90%+)
- Works with variations/typos
- Doesn't trigger on unrelated messages
- Shows confirmation dialog

---

### Task 3.5: Submit Confirmation Dialog 📤

**Priority**: High
**Estimated Time**: 3h
**Agent**: react-frontend-developer

- [ ] Create `teacher-assistant/frontend/src/components/SubmitConfirmationDialog.tsx`
- [ ] Display:
  - "Möchtest du wirklich abgeben?"
  - Info: "Deine Lehrkraft bekommt den gesamten Chat-Verlauf"
  - Preview: Dein Name, Anzahl Nachrichten, Zeitstempel
  - Buttons: "Abgeben" (Orange), "Abbrechen" (Gray)
- [ ] On confirm:
  - Call `submitWork()` hook
  - Show loading spinner
  - Display success state
- [ ] On success:
  - Show celebration animation (optional)
  - Message: "✅ Abgegeben! Deine Lehrkraft hat deine Arbeit erhalten."
  - Allow continuing chat
- [ ] Handle errors gracefully
- [ ] Write tests: `SubmitConfirmationDialog.test.tsx`

**Acceptance Criteria**:
- Dialog shows correct preview info
- Submission works
- Success state displays
- Can continue chatting after submit
- Error handling works

---

### Task 3.6: Mobile Optimization for Student View 📱

**Priority**: Medium
**Estimated Time**: 2h
**Agent**: react-frontend-developer

- [ ] Test on real mobile devices (iOS + Android)
- [ ] Optimize touch targets (min 44px)
- [ ] Fix keyboard overlapping issues
- [ ] Test QR code scanning flow
- [ ] Optimize chat message rendering (virtualization if needed)
- [ ] Test submit button accessibility on mobile
- [ ] Document findings in `/docs/testing/mobile-testing-report.md`

**Acceptance Criteria**:
- Works on iOS Safari + Chrome
- Works on Android Chrome
- QR scanning redirects correctly
- Keyboard doesn't cover input
- All buttons easily tappable

---

## 🧪 Phase 4: Integration & Testing

**Agent**: qa-integration-reviewer + playwright-agent
**Duration**: 4 Tage
**Dependencies**: Phases 1-3 complete

### Task 4.1: E2E Test - Full Teacher Flow 🤖

**Priority**: High
**Estimated Time**: 4h
**Agent**: qa-integration-reviewer (delegates to playwright-agent)

- [ ] Create `teacher-assistant/frontend/e2e-tests/agent-creation-flow.spec.ts`
- [ ] Test steps:
  1. Login as teacher
  2. Send message triggering agent creation
  3. Fill agent creation form
  4. Upload test file
  5. Submit form
  6. Verify result view shows
  7. Copy share URL
  8. Verify agent appears in Library
  9. Edit agent (update knowledge)
  10. Verify edit saved
  11. Delete agent
  12. Verify deletion
- [ ] Take screenshots at each step
- [ ] Document test in session log

**Acceptance Criteria**:
- Test passes end-to-end
- No console errors
- Screenshots show correct UI states
- All CRUD operations work

---

### Task 4.2: E2E Test - Full Student Flow 🤖

**Priority**: High
**Estimated Time**: 4h
**Agent**: qa-integration-reviewer (delegates to playwright-agent)

- [ ] Create `teacher-assistant/frontend/e2e-tests/student-learning-flow.spec.ts`
- [ ] Test steps:
  1. Navigate to share URL
  2. Enter student name
  3. Verify welcome message
  4. Send learning message
  5. Verify assistant responds with correct strategy
  6. Send submit intent message
  7. Verify confirmation dialog
  8. Confirm submission
  9. Verify success message
  10. Continue chatting (verify session persists)
- [ ] Test session recovery:
  1. Close browser
  2. Reopen same URL
  3. Enter same name
  4. Verify recovery dialog
  5. Verify chat history restored
- [ ] Take screenshots
- [ ] Document test

**Acceptance Criteria**:
- Full flow works without errors
- Session recovery works
- Submit sends email (verify manually)
- Can continue after submission

---

### Task 4.3: E2E Test - Error Scenarios 🤖

**Priority**: High
**Estimated Time**: 3h
**Agent**: qa-integration-reviewer

- [ ] Create `teacher-assistant/frontend/e2e-tests/agent-error-scenarios.spec.ts`
- [ ] Test scenarios:
  1. **Expired Agent**: Access agent after valid-until date → Show error
  2. **Invalid Short ID**: Access non-existent shortId → 404 page
  3. **File Upload Too Large**: Upload 15MB file → Validation error
  4. **Invalid Email**: Enter invalid email → Validation error
  5. **Network Failure**: Simulate offline → Retry logic + error message
  6. **Rate Limit**: Send 51 messages in one session → Rate limit error
  7. **Multiple Submissions**: Submit 11 times in one day → Rate limit
- [ ] Document each error state
- [ ] Verify error messages are user-friendly

**Acceptance Criteria**:
- All error scenarios handled gracefully
- Error messages are helpful
- No app crashes
- Retry logic works

---

### Task 4.4: Unit Test Coverage Review 📊

**Priority**: Medium
**Estimated Time**: 3h
**Agent**: qa-integration-reviewer

- [ ] Run coverage report: `npm run test:coverage`
- [ ] Ensure coverage targets:
  - Services: 80%+
  - Hooks: 75%+
  - Components: 70%+
  - Utils: 90%+
- [ ] Identify gaps
- [ ] Write missing tests
- [ ] Document coverage in `/docs/testing/coverage-report.md`

**Acceptance Criteria**:
- Coverage targets met
- Critical paths 100% covered
- Edge cases tested

---

### Task 4.5: Performance Testing 🚀

**Priority**: Medium
**Estimated Time**: 3h
**Agent**: qa-integration-reviewer

- [ ] Test QR code generation time (should be <500ms)
- [ ] Test file upload performance (10MB file <5s)
- [ ] Test email delivery time (should be <2s)
- [ ] Test chat response latency (first token <1s)
- [ ] Test agent creation end-to-end time (should be <10s)
- [ ] Load test: 10 concurrent agent creations
- [ ] Load test: 100 concurrent student sessions
- [ ] Document results in `/docs/testing/performance-report.md`

**Acceptance Criteria**:
- All operations meet target times
- No timeouts under normal load
- Graceful degradation under heavy load

---

### Task 4.6: Security Review 🔐

**Priority**: High
**Estimated Time**: 4h
**Agent**: qa-integration-reviewer

- [ ] Review checklist:
  - [ ] File upload validation (type, size, content)
  - [ ] Input sanitization (XSS prevention)
  - [ ] Rate limiting on all endpoints
  - [ ] CORS configuration
  - [ ] Session token validation
  - [ ] Email validation
  - [ ] SQL injection prevention (InstantDB handles this)
  - [ ] HTTPS enforcement
  - [ ] CSP headers
- [ ] Test file upload with malicious files:
  - Executables (.exe)
  - Scripts (.sh, .js)
  - Oversized files
- [ ] Test XSS vectors in text inputs
- [ ] Document findings in `/docs/quality-assurance/security-review.md`

**Acceptance Criteria**:
- No security vulnerabilities found
- All inputs validated
- Rate limits enforced
- Malicious files rejected

---

## 🎨 Phase 5: Polish & Launch

**Agent**: emotional-design-specialist + qa-integration-reviewer
**Duration**: 3 Tage
**Dependencies**: Phase 4 complete

### Task 5.1: UX Polish - Teacher Interface ✨

**Priority**: Medium
**Estimated Time**: 4h
**Agent**: emotional-design-specialist

- [ ] Review agent creation flow for friction points
- [ ] Add micro-interactions:
  - Button hover states
  - Form field focus animations
  - Loading skeletons (instead of spinners)
  - Success state animations
- [ ] Optimize copy:
  - Form labels and placeholders
  - Help text and tooltips
  - Error messages (friendly, actionable)
- [ ] Add empty states:
  - Library with no agents: Prompt to create first one
  - No files uploaded: Show example use cases
- [ ] Test with real teachers (if possible)
- [ ] Document improvements in session log

**Acceptance Criteria**:
- Flow feels smooth and intuitive
- Copy is clear and helpful
- Animations enhance (not distract)
- Empty states guide users

---

### Task 5.2: UX Polish - Student Interface ✨

**Priority**: Medium
**Estimated Time**: 3h
**Agent**: emotional-design-specialist

- [ ] Review student flow for confusion points
- [ ] Optimize name dialog:
  - Friendly, encouraging tone
  - Clear instructions
  - Visual hierarchy
- [ ] Optimize chat interface:
  - Clear message bubbles
  - Typing indicators
  - Smooth scrolling
- [ ] Optimize submit flow:
  - Clear confirmation
  - Celebration on success (subtle)
  - Encouragement to continue
- [ ] Test with students (if possible)
- [ ] Document improvements

**Acceptance Criteria**:
- Flow feels welcoming and easy
- No confusion about next steps
- Success feels rewarding
- Students feel supported

---

### Task 5.3: Accessibility Audit ♿

**Priority**: High
**Estimated Time**: 3h
**Agent**: qa-integration-reviewer

- [ ] Run automated tools:
  - axe DevTools
  - Lighthouse Accessibility
- [ ] Manual testing:
  - Keyboard navigation (all flows)
  - Screen reader (NVDA/JAWS)
  - Color contrast (WCAG AA)
  - Focus indicators
- [ ] Test with assistive technologies:
  - Tab navigation only
  - Voice control
- [ ] Fix issues found
- [ ] Document compliance in `/docs/quality-assurance/accessibility-report.md`

**Acceptance Criteria**:
- WCAG 2.1 Level AA compliant
- Keyboard navigation works everywhere
- Screen reader announces correctly
- No accessibility errors in audit

---

### Task 5.4: Documentation - User Guides 📚

**Priority**: Medium
**Estimated Time**: 3h
**Agent**: react-frontend-developer

- [ ] Create teacher guide: `/docs/guides/creating-learning-agents.md`
  - How to create an agent
  - Choosing pedagogical strategies
  - Best practices for knowledge base
  - Managing agents
- [ ] Create student guide: `/docs/guides/using-learning-agents.md`
  - How to access via QR/link
  - How to use the chat
  - How to submit work
- [ ] Add FAQ section
- [ ] Add screenshots/GIFs
- [ ] Add to main README

**Acceptance Criteria**:
- Guides are clear and comprehensive
- Screenshots show current UI
- FAQs cover common questions
- README links to guides

---

### Task 5.5: Analytics Setup (Phase 2 Prep) 📊

**Priority**: Low
**Estimated Time**: 2h
**Agent**: backend-node-developer

- [ ] Add analytics event tracking (Plausible or PostHog)
- [ ] Track events:
  - `agent_created`
  - `agent_shared`
  - `student_session_started`
  - `student_message_sent`
  - `student_submitted`
- [ ] Add to backend routes
- [ ] Test events fire correctly
- [ ] Document in `/docs/architecture/analytics.md`

**Acceptance Criteria**:
- Events tracked without PII
- Dashboard shows aggregated data
- No performance impact

---

### Task 5.6: Final QA Review 🎯

**Priority**: High
**Estimated Time**: 4h
**Agent**: qa-integration-reviewer

- [ ] Full regression test:
  - Run all E2E tests
  - Manual testing of all flows
  - Cross-browser testing (Chrome, Safari, Firefox)
  - Mobile testing (iOS, Android)
- [ ] Verify all tasks marked complete
- [ ] Check for console errors/warnings
- [ ] Review session logs for any issues
- [ ] Create bug list if issues found
- [ ] Sign-off for production deployment

**Acceptance Criteria**:
- All tests pass
- No critical bugs
- All browsers/devices work
- Ready for production

---

### Task 5.7: Deployment to Production 🚀

**Priority**: High
**Estimated Time**: 2h
**Agent**: backend-node-developer + react-frontend-developer

- [ ] Backend deployment:
  - Set environment variables in Vercel
  - Deploy backend to production
  - Verify API endpoints work
  - Test email sending (real addresses)
- [ ] Frontend deployment:
  - Update environment variables
  - Build production bundle
  - Deploy to Vercel
  - Verify all routes work
- [ ] Post-deployment checks:
  - Test full teacher flow in production
  - Test full student flow in production
  - Test QR code scanning
  - Test email delivery
- [ ] Monitor for errors (Sentry)
- [ ] Document deployment in session log

**Acceptance Criteria**:
- Production deployment successful
- All features work in production
- No errors in monitoring
- Email delivery works

---

## 📊 Progress Tracking

### Phase Completion

- [ ] **Phase 1: Backend Foundation** (10 tasks)
- [ ] **Phase 2: Frontend Creator** (8 tasks)
- [ ] **Phase 3: Student Experience** (6 tasks)
- [ ] **Phase 4: Integration & Testing** (6 tasks)
- [ ] **Phase 5: Polish & Launch** (7 tasks)

**Total**: 37 tasks

---

## 🔄 Iteration & Feedback

After MVP launch:

### Week 1 Post-Launch
- [ ] Collect teacher feedback
- [ ] Collect student feedback (if possible)
- [ ] Monitor usage analytics
- [ ] Fix critical bugs
- [ ] Document issues in `/docs/quality-assurance/bug-tracking.md`

### Week 2 Post-Launch
- [ ] Prioritize top 3 improvement requests
- [ ] Implement quick wins
- [ ] Plan Phase 2 features (Analytics Dashboard)

---

## 📝 Notes

**Agent Assignment Strategy**:
- **Backend-Agent** handles all backend tasks (Phase 1)
- **Frontend-Agent** handles all frontend tasks (Phases 2-3)
- **QA-Agent** coordinates testing (Phase 4)
- **Playwright-Agent** writes E2E tests (Phase 4)
- **Emotional-Design-Agent** polishes UX (Phase 5)

**Parallel Work Opportunities**:
- Phase 1 and Phase 2 can overlap (after Task 1.7 complete)
- Phase 3 can start after Task 1.8 complete
- Testing can be written alongside development (TDD approach encouraged)

**Estimated Timeline**:
- **Week 1**: Phase 1 (Backend Foundation)
- **Week 2**: Phase 2 (Frontend Creator)
- **Week 3**: Phase 3 (Student Experience) + Phase 4 (Testing)
- **Week 4**: Phase 5 (Polish & Launch)

---

**Status**: Ready for implementation
**Next Step**: Assign Phase 1 to backend-node-developer agent
