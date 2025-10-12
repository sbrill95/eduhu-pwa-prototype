# Feature Specification: Bug Fixes 2025-10-11

**Feature Branch**: `bug-fixes-2025-10-11`
**Created**: 2025-10-11
**Status**: Ready for Implementation
**Input**: 4 active bugs blocking Image Generation UX V2 completion

## Clarifications

### Session 2025-10-11

- Q: Schema migration strategy for BUG-025 field mismatch? → A: Drop old fields, create new fields, migrate all data in single transaction (no production data yet, aggressive approach is safe)
- Q: Metadata JSON validation rules (FR-010)? → A: Validate required fields exist + sanitize string values + enforce size limit (<10KB)
- Q: Error handling for rapid "Weiter im Chat" clicks? → A: Debounce navigation (300ms cooldown)
- Q: Observability & error logging requirements? → A: Error logs + key navigation events (tab changes, agent form opens/closes)
- Q: Handling invalid metadata during validation failures? → A: Log error + save content without metadata + show user warning toast/message

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix Chat Navigation After Image Generation (Priority: P1)

**As a** teacher who just generated an image
**I want to** click "Weiter im Chat" and return to the chat screen
**so that** I can continue my conversation with the generated image visible

**Why this priority**: Critical blocker for E2E workflow completion. Currently blocks 45% of E2E test (Steps 6-11). Users expect smooth navigation after generating images, and page reloads break the SPA experience.

**Independent Test**: Generate an image → Click "Weiter im Chat" → Verify user lands on Chat tab (not Library) and sees the generated image as a thumbnail in the chat history.

**Acceptance Scenarios**:

1. **Given** user completes image generation and sees result preview, **When** user clicks "Weiter im Chat 💬" button, **Then** app navigates to Chat tab without full page reload
2. **Given** user is on Chat tab after clicking "Weiter im Chat", **When** page loads, **Then** the active tab indicator shows "Chat" (not Library)
3. **Given** user navigated back to Chat, **When** scrolling through messages, **Then** the generated image appears as a thumbnail in the correct position
4. **Given** user clicks "Weiter im Chat" rapidly multiple times, **When** debouncing is active (300ms cooldown), **Then** only one navigation occurs and subsequent clicks within cooldown period are ignored

**Related**: BUG-030 (P2 - PARTIALLY RESOLVED)

---

### User Story 2 - Fix Message Persistence in Database (Priority: P1)

**As a** teacher using the chat feature
**I want to** see my messages persist correctly across sessions
**so that** I can review my conversation history reliably

**Why this priority**: Data integrity issue affecting core chat functionality. Messages may not be saved correctly due to schema field mismatch, leading to data loss.

**Independent Test**: Send multiple chat messages → Refresh page → Verify all messages appear in correct order with proper metadata.

**Acceptance Scenarios**:

1. **Given** user sends a text message in chat, **When** message is saved to database, **Then** all required fields (content, userId, timestamp) are stored correctly
2. **Given** user generates an image via agent, **When** result message is saved, **Then** metadata field contains proper JSON with type, image_url, and originalParams
3. **Given** database has messages with old field names, **When** schema migration runs, **Then** all messages are accessible without errors

**Related**: BUG-025 (P1 - ACTIVE)

---

### User Story 3 - Display Materials in Library (Priority: P2)

**As a** teacher with generated materials
**I want to** see my library contents immediately when I open the Library tab
**so that** I can access my teaching materials without confusion

**Why this priority**: UX issue affecting discoverability. Users see a placeholder screen instead of their materials, leading to confusion about whether content was saved.

**Independent Test**: Generate 3 images → Navigate to Library → Verify all 3 images appear in grid view with proper thumbnails.

**Acceptance Scenarios**:

1. **Given** user has generated materials in database, **When** user opens Library tab, **Then** materials display in grid layout (not placeholder message)
2. **Given** Library shows materials, **When** user clicks "Bilder" filter, **Then** only image-type materials are shown
3. **Given** user clicks on a material card, **When** preview modal opens, **Then** full-size image and metadata are displayed correctly

**Related**: BUG-020 (P2 - ACTIVE)

---

### User Story 4 - Persist Image Metadata Correctly (Priority: P2)

**As a** teacher who regenerates images
**I want to** have my original generation parameters saved
**so that** I can regenerate similar images with one click

**Why this priority**: Feature completion issue. The "Neu generieren" button depends on metadata field being populated correctly. Without this, users must manually re-enter all parameters.

**Independent Test**: Generate image with specific parameters (style, subject, description) → Open in Library → Click "Neu generieren" → Verify form pre-fills with original parameters.

**Acceptance Scenarios**:

1. **Given** user generates an image with custom parameters, **When** image is saved to library_materials, **Then** metadata JSON includes originalParams object
2. **Given** library material has metadata, **When** schema update is applied, **Then** metadata field is queryable and accessible via InstantDB
3. **Given** user clicks "Neu generieren" on an image, **When** agent form opens, **Then** description, imageStyle, learningGroup, and subject fields are pre-filled

**Related**: BUG-019 (P2 - ACTIVE)

---

### Edge Cases

- **Rapid clicks on "Weiter im Chat"**: Debouncing with 300ms cooldown prevents race conditions; only first click within cooldown window is processed
- **Invalid metadata JSON**: System logs error, saves core content without metadata, shows user warning toast; prevents data loss while notifying user of issue
- What if Library has 100+ materials - does pagination work?
- What if originalParams is missing from older generated images?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST navigate to Chat tab (not Library) when "Weiter im Chat" is clicked in AgentResultView
- **FR-002**: System MUST use Ionic tab navigation system (not window.location or React Router)
- **FR-002a**: System MUST debounce "Weiter im Chat" navigation with 300ms cooldown to prevent race conditions from rapid clicks
- **FR-003**: System MUST save chat messages with correct field names matching InstantDB schema
- **FR-004**: System MUST store message metadata as JSON string (not object) for InstantDB compatibility
- **FR-005**: System MUST query library_materials and display results in Library.tsx when user has materials
- **FR-006**: System MUST hide "Noch keine Materialien" placeholder when materials exist
- **FR-007**: System MUST apply InstantDB schema updates to make metadata field queryable
- **FR-008**: System MUST preserve originalParams in library_materials metadata for re-generation feature
- **FR-009**: System MUST use InstantDB schema migration to drop old message fields and create new fields in single transaction (no production data exists, aggressive migration safe)
- **FR-010**: System MUST validate metadata JSON before saving: (a) required fields present (type, image_url for images; originalParams for regeneration), (b) sanitize all string values to prevent injection, (c) enforce <10KB size limit
- **FR-010a**: When metadata validation fails, system MUST: (a) log error with details to console, (b) save core content (message or library material) without metadata field, (c) show user warning toast/message explaining metadata was not saved
- **FR-011**: System MUST log errors and key navigation events to browser console: (a) all caught exceptions with stack traces, (b) tab navigation changes with source/destination, (c) agent form lifecycle (open, close, submit)

### Key Entities

- **Message**: Chat message with content, userId, timestamp, metadata (JSON string)
- **LibraryMaterial**: User-generated content (images, chats) with type, url, title, metadata (JSON string)
- **AgentResult**: Image generation output with imageUrl, title, metadata.originalParams
- **TabState**: Active tab indicator ("chat", "library", "home", "profile")

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: E2E test pass rate increases from 54.5% to ≥90% (10/11 steps passing)
- **SC-002**: Zero active bugs in bug-tracking.md after implementation
- **SC-003**: "Weiter im Chat" navigation completes in <500ms without page reload
- **SC-004**: Library displays materials within 1 second of tab activation
- **SC-005**: 100% of newly generated images have originalParams in metadata
- **SC-006**: Zero InstantDB schema errors in console when querying messages or library_materials
- **SC-007**: Manual testing confirms all 4 user stories work end-to-end
- **SC-008**: Build succeeds with 0 TypeScript errors
- **SC-009**: All pre-commit hooks pass (tests, linting, formatting)
