# Feature Specification: Library UX Fixes

**Feature Branch**: `002-library-ux-fixes`
**Created**: 2025-10-12
**Status**: Draft
**Input**: Library UX Fixes - Material Preview Modal Integration and Design Improvements

## Clarifications

### Session 2025-10-12

- Q: Library Material Click Handler Implementation - Welches HTML/React Element soll clickable sein? → A: Make the entire material card div clickable with onClick handler
- Q: MaterialPreviewModal Type Mapping - Soll die Mapping-Logik in Library.tsx oder als separate Utility-Funktion sein? → A: Create separate utility function in `lib/materialMappers.ts`
- Q: Library State Management - Wo soll der modal state (selectedMaterial, isModalOpen) verwaltet werden? → A: Component-level state with useState at top of Library component
- Q: MaterialPreviewModal Rendering Location - Wo im JSX soll MaterialPreviewModal gerendert werden? → A: Render outside IonContent, as sibling to IonHeader/IonContent at IonPage level (allows proper modal overlay and Ionic animations)
- Q: Modal Close Handler Behavior - Was soll passieren wenn Modal geschlossen wird? → A: Close modal and clear selected material immediately (setIsModalOpen(false) + setSelectedMaterial(null)) to prevent stale state

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Generated Image in Library (Priority: P1)

Teachers navigate to the Library to review previously generated images. When they click on an image thumbnail, they expect to see a full preview modal with the complete image and metadata.

**Why this priority**: This is the core functionality of the Library - being able to view saved materials. Without this, the Library is essentially unusable for images. This blocks all other image-related features (BUG-020).

**Independent Test**: Teacher generates an image, navigates to Library → Bilder tab, clicks on thumbnail → Full preview modal opens showing the complete image with all details.

**Acceptance Scenarios**:

1. **Given** a teacher has generated images in their library, **When** they navigate to Library → Bilder tab, **Then** they see a grid of image thumbnails
2. **Given** image thumbnails are displayed, **When** teacher clicks on any thumbnail, **Then** a full-screen modal opens showing the complete image
3. **Given** the preview modal is open, **When** teacher views the image, **Then** they see the image title, creation date, and image type information
4. **Given** the preview modal is open, **When** teacher wants to close it, **Then** they can click the close button or tap outside the modal

---

### User Story 2 - Regenerate Image with Original Parameters (Priority: P1)

Teachers reviewing an image in their library want to create a variation using the same parameters (description, style, grade level, subject). They click "Neu generieren" and expect the image generation form to pre-fill with the original parameters.

**Why this priority**: This is directly tied to BUG-019 and is a critical workflow for teachers iterating on teaching materials. The code exists but is blocked by User Story 1.

**Independent Test**: Teacher opens any saved image → Clicks "Neu generieren" → Agent form opens with all original parameters pre-filled (description, image style, learning group, subject).

**Acceptance Scenarios**:

1. **Given** a teacher views an image in the preview modal, **When** they click "Neu generieren" button, **Then** the image generation agent form opens
2. **Given** the agent form opens for regeneration, **When** the form loads, **Then** all fields are pre-filled with the original parameters (description, imageStyle, learningGroup, subject)
3. **Given** the form is pre-filled, **When** teacher modifies any parameter and submits, **Then** a new image is generated with the modified parameters
4. **Given** metadata is missing or invalid for an image, **When** teacher clicks "Neu generieren", **Then** the form opens with empty fields (graceful degradation)

---

### User Story 3 - Improve Agent Confirmation Button Visibility (Priority: P2)

When teachers send a message that triggers an agent suggestion, they need to clearly see the confirmation button to accept the agent's help. Currently, the button has poor visibility and teachers may miss it.

**Why this priority**: This affects the discoverability of the agent system, but doesn't block existing workflows once users find the button. It's a UX improvement rather than a broken feature.

**Independent Test**: Teacher types "Erstelle ein Bild von einem Löwen" → Agent suggestion appears → Confirmation button is clearly visible and styled distinctively.

**Acceptance Scenarios**:

1. **Given** a teacher sends a message that triggers an agent, **When** the agent confirmation appears, **Then** the button is highly visible with appropriate contrast and styling
2. **Given** the confirmation button appears, **When** teacher views it on mobile, **Then** the button is large enough to tap easily (minimum 44x44px touch target)
3. **Given** the confirmation button appears, **When** teacher uses accessibility tools, **Then** the button has proper ARIA labels and keyboard navigation

---

### User Story 4 - Improve Loading View Design (Priority: P3)

When an image is being generated, teachers see a loading screen. Currently, this screen shows redundant text ("Bild erstellen" header + "In Bearbeitung..." message) and doesn't match the overall design language.

**Why this priority**: This is purely cosmetic and doesn't affect functionality. It improves polish but can be addressed after core features work.

**Independent Test**: Teacher starts image generation → Loading view appears with clean, non-redundant text that matches the app's design language.

**Acceptance Scenarios**:

1. **Given** a teacher starts image generation, **When** the loading view appears, **Then** it shows a single, clear message without redundant text
2. **Given** the loading view is displayed, **When** teacher views it, **Then** the design matches the app's overall visual language (fonts, colors, spacing)
3. **Given** the loading view is shown, **When** generation takes 30+ seconds, **Then** the view provides appropriate feedback (progress indicator, estimated time)

---

### User Story 5 - Improve Result View Design (Priority: P3)

After an image is generated, teachers see a result view with options to save to library or continue in chat. Currently, this view's layout doesn't match the app's design system.

**Why this priority**: Like User Story 4, this is a design polish issue that doesn't affect core functionality. It can wait until after critical bugs are fixed.

**Independent Test**: Teacher completes image generation → Result view appears with layout matching the app's design system and clear action buttons.

**Acceptance Scenarios**:

1. **Given** image generation completes, **When** the result view appears, **Then** the layout matches the app's design system (spacing, typography, button styles)
2. **Given** the result view is displayed, **When** teacher views the generated image, **Then** the image preview is clearly visible and properly sized
3. **Given** the result view shows action buttons, **When** teacher views them, **Then** buttons are clearly labeled and follow the app's button design patterns

---

### Edge Cases

- What happens when a teacher clicks on an image in the library but the image URL is expired or invalid?
- How does the system handle regeneration when the metadata field is null or corrupted?
- What happens if a teacher tries to open multiple preview modals simultaneously?
- How does the preview modal behave on very small mobile screens (<320px width)?
- What happens when an image takes longer than 60 seconds to generate - does the loading view timeout?

## Requirements *(mandatory)*

### Functional Requirements

#### User Story 1: Library Preview Modal
- **FR-001**: System MUST display a MaterialPreviewModal component when a teacher clicks on an image thumbnail in the Library; the entire material card div MUST have an onClick handler that triggers the modal
- **FR-002**: Library component MUST maintain state for currently selected material (selectedMaterial) and modal visibility (isModalOpen) using useState hooks at component top level
- **FR-003**: System MUST pass the complete material object (including id, title, type, metadata, created_at) to the MaterialPreviewModal
- **FR-004**: Preview modal MUST display the full-size image from the material's metadata
- **FR-005**: Preview modal MUST show material metadata (title, creation date, type, source)
- **FR-006**: Users MUST be able to close the preview modal via close button or clicking outside the modal

#### User Story 2: Image Regeneration
- **FR-007**: Preview modal MUST display a "Neu generieren" button for images with source "agent-generated"
- **FR-008**: System MUST extract originalParams from material metadata (description, imageStyle, learningGroup, subject)
- **FR-009**: When "Neu generieren" is clicked, system MUST open the image-generation agent modal with pre-filled form fields
- **FR-010**: System MUST handle missing metadata gracefully by opening an empty form (no errors thrown)
- **FR-011**: System MUST support backward compatibility with old metadata structure (fallback to prompt/image_style fields)

#### User Story 3: Button Visibility
- **FR-012**: Agent confirmation button MUST have high contrast ratio (minimum 4.5:1 for normal text, 3:1 for large text per WCAG AA)
- **FR-013**: Agent confirmation button MUST have clear visual hierarchy (prominent color, adequate size, proper spacing)
- **FR-014**: Agent confirmation button MUST meet minimum touch target size of 44x44px on mobile devices

#### User Story 4: Loading View Design
- **FR-015**: Loading view MUST display a single, non-redundant message during image generation
- **FR-016**: Loading view design MUST match the app's design system (typography, colors, spacing from Tailwind config)
- **FR-017**: Loading view MUST provide progress feedback for operations longer than 10 seconds

#### User Story 5: Result View Design
- **FR-018**: Result view layout MUST follow the app's design system patterns
- **FR-019**: Result view MUST display the generated image with appropriate sizing and aspect ratio preservation
- **FR-020**: Result view action buttons MUST follow consistent button styling throughout the app

### Key Entities

- **LibraryMaterial**: Represents a saved teaching material in the library
  - Attributes: id, title, type (image/document/worksheet/etc), description, created_at, chat_session_id, metadata (JSON)
  - Metadata contains: originalParams (description, imageStyle, learningGroup, subject), image_url, type

- **MaterialPreviewModal**: Component for viewing and interacting with library materials
  - Receives: material object, isOpen state, onClose callback
  - Displays: full image, metadata, action buttons (download, favorite, share, delete, regenerate)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Teachers can view full image previews in the library with 100% success rate (no broken modals)
- **SC-002**: Teachers can regenerate images with original parameters in under 10 seconds (time from "Neu generieren" click to form appearing)
- **SC-003**: 95% of teachers discover the agent confirmation button without assistance (measured via usability testing or analytics)
- **SC-004**: Loading and result views match the app's design system with 100% consistency (verified via design review checklist)
- **SC-005**: Preview modal interaction completes in under 2 seconds (click thumbnail → modal fully rendered)


## Scope *(mandatory)*

### In Scope

- Integration of MaterialPreviewModal into Library.tsx for image materials
- State management for modal visibility and selected material
- Click handlers on library image thumbnails
- Testing image preview functionality end-to-end
- Regeneration flow with metadata extraction and form pre-filling
- Agent confirmation button visibility improvements
- Loading view text and design cleanup
- Result view layout alignment with design system

### Out of Scope

- Preview modals for non-image materials (documents, worksheets, etc.) - these may have different requirements
- Download functionality improvements beyond what exists in MaterialPreviewModal
- Favorite/share functionality - these are already implemented
- Backend metadata structure changes - we work with existing metadata format
- Image URL refresh logic - separate concern from preview
- Library grid layout changes - focus is on preview modal integration only

## Assumptions

- MaterialPreviewModal component is fully implemented and functional (verified during code review)
- Material metadata follows the structure defined in BUG-025 fix (JSON field with originalParams)
- InstantDB query in useLibraryMaterials hook returns materials with complete metadata
- Ionic framework components (IonModal, IonButton) are available and properly configured
- Tailwind CSS classes are available for design consistency
- Agent form (AgentFormView) supports pre-filling via openModal(agentId, prefillData) signature

## Dependencies

- BUG-025 fix must be deployed (metadata field in InstantDB schema)
- MaterialPreviewModal component must exist at the expected import path
- AgentContext must expose openModal function with pre-fill capability
- useLibraryMaterials hook must return materials in expected format

## Constraints

- Must maintain backward compatibility with old metadata structure (some images may not have new metadata format)
- Must not break existing library functionality (chat history, search, filters)
- Design changes must use only existing Tailwind classes (no new custom CSS)
- Button visibility improvements must meet WCAG AA accessibility standards
