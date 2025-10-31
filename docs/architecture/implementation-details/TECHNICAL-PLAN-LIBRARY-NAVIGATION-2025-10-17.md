# Technical Implementation Plan: Library Navigation Enhancement
**Created**: 2025-10-17
**Author**: System Architect (Winston)
**Status**: Ready for Implementation
**Scope**: Sprint 1 - Library Navigation Enhancement (P1) + UX Enhancements

---

## Executive Summary

This document provides a comprehensive technical implementation plan for the Library Navigation Enhancement feature (US2) with integrated UX enhancements (UXE-001 through UXE-015) from the comprehensive feature review.

### What We're Building

A seamless user experience where teachers can:
1. Generate an image via AI agent
2. Click "In Library öffnen" and automatically see the new image in a modal
3. Experience accessible, mobile-optimized interactions with proper loading states and error handling
4. Navigate using keyboard and screen readers

### Implementation Scope

**Primary Feature (P1)**: Library Navigation Enhancement
- Auto-open MaterialPreviewModal when navigating from AgentResultView
- Materials tab auto-selected
- Correct material displayed immediately

**UX Enhancements (All Integrated)**:
- Accessibility (ARIA, focus management, keyboard navigation)
- Loading states (skeleton screens, progressive disclosure)
- Error handling (user-friendly messages, recovery actions)
- Mobile optimization (touch targets, gestures, safe areas)
- Micro-interactions (hover states, transitions, feedback)

### Technical Approach

**Architecture Pattern**: Event-driven navigation with React state management
**Accessibility**: WCAG 2.1 AA compliance
**Testing**: Component tests + Integration tests + E2E tests
**Performance**: <2s navigation, <500ms modal open

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    AgentResultView.tsx                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ handleOpenInLibrary()                                    │   │
│  │ 1. Extract materialId from agent result                 │   │
│  │ 2. Dispatch custom event with materialId                │   │
│  │ 3. Call navigateToTab('library')                        │   │
│  │ 4. Close modal                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ CustomEvent('navigate-library-tab')
                             │ detail: { tab: 'materials', materialId }
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Library.tsx                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Event Listener: navigate-library-tab                    │   │
│  │ 1. Switch to Materials tab                              │   │
│  │ 2. Find material by ID in artifacts array              │   │
│  │ 3. Convert to UnifiedMaterial                           │   │
│  │ 4. Set selectedMaterial + isModalOpen                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Pass props
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MaterialPreviewModal.tsx                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Display:                                                 │   │
│  │ - Full-size image preview                               │   │
│  │ - Title, description, metadata                          │   │
│  │ - Action buttons (Regenerate, Download, Favorite)       │   │
│  │ - Accessible controls (ARIA labels, keyboard nav)       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### State Management Approach

**React Context + Local State** (No Redux/Zustand needed for this feature)

```typescript
// AgentResultView.tsx - Component state
const { state, closeModal, navigateToTab } = useAgent(); // From AgentContext
const materialId = state.result?.data?.library_id;

// Library.tsx - Component state
const [selectedMaterial, setSelectedMaterial] = useState<UnifiedMaterial | null>(null);
const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
const [selectedTab, setSelectedTab] = useState<'chats' | 'artifacts'>('chats');

// MaterialPreviewModal.tsx - Component props
interface MaterialPreviewModalProps {
  material: UnifiedMaterial | null;
  isOpen: boolean;
  onClose: () => void;
}
```

**Why This Approach**:
- Simple event-driven pattern for cross-component communication
- No complex state management needed
- Follows existing patterns in codebase (proven in BUG-030 fixes)
- Easy to test and debug

---

## Component Architecture

### 1. AgentResultView.tsx - Event Dispatcher

**Current State**: Lines 356-396 handle "In Library öffnen" button
**Changes Needed**: Add materialId extraction and custom event dispatch

#### Implementation

```typescript
/**
 * T014: Handle Library Navigation with materialId
 *
 * Extracts materialId from agent result and dispatches custom event
 * for Library.tsx to handle modal opening.
 *
 * UXE-001: Add ARIA live region for navigation announcement
 * UXE-008: Loading state during navigation
 */
const handleOpenInLibrary = () => {
  const callId = crypto.randomUUID();
  console.log(`[AgentResultView] 📚 handleOpenInLibrary CALLED [ID:${callId}]`);

  // T014: Extract materialId from agent result
  const materialId = state.result?.data?.library_id || state.result?.metadata?.library_id;

  if (!materialId) {
    console.warn(`[AgentResultView] ⚠️ No materialId found [ID:${callId}]`);
    // UXE-010: User-friendly error message
    announceToScreenReader('Fehler: Material konnte nicht gefunden werden');
  }

  console.log(`[AgentResultView] materialId: ${materialId} [ID:${callId}]`);

  // UXE-008: Show loading state
  setNavigating(true);

  // T014: Dispatch custom event with materialId
  window.dispatchEvent(new CustomEvent('navigate-library-tab', {
    detail: {
      tab: 'materials',
      materialId: materialId,
      source: 'AgentResultView',
      timestamp: Date.now()
    }
  }));

  console.log(`[AgentResultView] ✅ Event dispatched [ID:${callId}]`);

  // UXE-001: Announce navigation to screen readers
  announceToScreenReader('Navigiere zur Bibliothek');

  // Navigate to Library tab using correct Ionic navigation
  flushSync(() => {
    navigateToTab('library');
  });

  // Close modal after navigation
  closeModal();

  // UXE-008: Reset loading state
  setNavigating(false);
};
```

#### Accessibility Enhancements (UXE-001)

```typescript
/**
 * Announce navigation to screen readers
 * Uses ARIA live region pattern
 */
const announceToScreenReader = (message: string) => {
  const liveRegion = document.getElementById('sr-live-region');
  if (liveRegion) {
    liveRegion.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
};

// Add to component JSX:
<div
  id="sr-live-region"
  className="sr-only"
  role="status"
  aria-live="polite"
  aria-atomic="true"
/>
```

#### Loading State (UXE-008)

```typescript
const [navigating, setNavigating] = useState(false);

// Button with loading state
<button
  onClick={handleOpenInLibrary}
  disabled={navigating}
  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
  aria-label="In Library öffnen"
  aria-busy={navigating}
>
  {navigating ? (
    <>
      <IonSpinner className="w-4 h-4 mr-2" />
      Öffne...
    </>
  ) : (
    'In Library öffnen 📚'
  )}
</button>
```

---

### 2. Library.tsx - Event Handler and Modal Controller

**Current State**: Lines 194-239 handle navigation events
**Changes Needed**: Extend event handler to open modal with materialId

#### Implementation

```typescript
/**
 * T015: Extended Library Navigation Event Handler
 *
 * Listens for navigate-library-tab events and auto-opens MaterialPreviewModal
 * when materialId is provided.
 *
 * UXE-001: Focus management for accessibility
 * UXE-007: Skeleton loading for materials
 * UXE-010: Error handling for missing materials
 */
useEffect(() => {
  const handleLibraryNav = (event: Event) => {
    const customEvent = event as CustomEvent<{
      tab: 'chats' | 'materials';
      materialId?: string;
      source?: string;
      timestamp?: number;
    }>;

    console.log('[Library] Received navigate-library-tab event:', customEvent.detail);

    // Switch to materials tab
    if (customEvent.detail?.tab === 'materials') {
      setSelectedTab('artifacts');
      setSelectedFilter('Bilder'); // Auto-select Images filter
    }

    // T015: Auto-open modal if materialId provided
    const materialId = customEvent.detail?.materialId;
    if (materialId) {
      console.log('[Library] Looking for material:', materialId);

      // UXE-007: Show loading state while finding material
      setModalLoading(true);

      // Find material in artifacts array
      const artifact = artifacts.find(a => a.id === materialId);

      if (artifact) {
        console.log('[Library] Material found:', artifact.title);

        // Convert to UnifiedMaterial
        const unifiedMaterial = convertArtifactToUnifiedMaterial(artifact);

        // Open modal
        setSelectedMaterial(unifiedMaterial);
        setIsModalOpen(true);
        setModalLoading(false);

        // UXE-001: Focus management - focus modal after opening
        setTimeout(() => {
          const modal = document.querySelector('[data-testid="material-preview-modal"]') as HTMLElement;
          if (modal) {
            const closeButton = modal.querySelector('button[aria-label*="Schließen"]') as HTMLElement;
            closeButton?.focus();
          }
        }, 100);

        console.log('[Library] ✅ Modal opened');
      } else {
        // UXE-010: User-friendly error handling
        console.warn('[Library] ⚠️ Material not found:', materialId, {
          totalArtifacts: artifacts.length,
          source: customEvent.detail.source
        });

        setModalLoading(false);
        setErrorMessage('Das Material konnte nicht gefunden werden. Bitte versuchen Sie es erneut.');
        setShowError(true);

        // Auto-hide error after 5 seconds
        setTimeout(() => {
          setShowError(false);
        }, 5000);
      }
    }
  };

  window.addEventListener('navigate-library-tab', handleLibraryNav);

  return () => {
    window.removeEventListener('navigate-library-tab', handleLibraryNav);
  };
}, [artifacts]); // Dependency: artifacts array
```

#### Error Display (UXE-010)

```typescript
const [errorMessage, setErrorMessage] = useState<string>('');
const [showError, setShowError] = useState(false);

// Add to JSX:
{showError && (
  <div
    className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-md"
    role="alert"
    aria-live="assertive"
  >
    <div className="flex items-start">
      <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800">Fehler</h3>
        <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
      </div>
      <button
        onClick={() => setShowError(false)}
        className="ml-4 text-red-600 hover:text-red-800"
        aria-label="Fehlermeldung schließen"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
)}
```

#### Skeleton Loading State (UXE-007)

```typescript
const [modalLoading, setModalLoading] = useState(false);

// Add to materials grid while loading
{modalLoading && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 max-w-sm">
      <div className="flex items-center space-x-3">
        <IonSpinner className="w-6 h-6 text-primary-500" />
        <span className="text-gray-700">Lade Material...</span>
      </div>
    </div>
  </div>
)}
```

---

### 3. MaterialPreviewModal.tsx - Accessible Modal Component

**Current State**: Basic modal with image display
**Enhancements Needed**: Full accessibility, keyboard navigation, mobile optimization

#### Component Structure

```typescript
/**
 * MaterialPreviewModal - Accessible Image Preview Modal
 *
 * Implements:
 * - UXE-001: Full keyboard navigation and ARIA labels
 * - UXE-002: Loading states with skeleton screens
 * - UXE-003: Touch-optimized controls for mobile
 * - UXE-005: Smooth transitions and micro-interactions
 * - UXE-006: Pinch-to-zoom support
 */
interface MaterialPreviewModalProps {
  material: UnifiedMaterial | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MaterialPreviewModal: React.FC<MaterialPreviewModalProps> = ({
  material,
  isOpen,
  onClose
}) => {
  // State management
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);

  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // UXE-001: Focus management on open/close
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus close button after animation
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

      // Trap focus within modal
      const trapFocus = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusableElements) return;

          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }

        // UXE-001: Close on Escape
        if (e.key === 'Escape') {
          handleClose();
        }
      };

      document.addEventListener('keydown', trapFocus);

      return () => {
        document.removeEventListener('keydown', trapFocus);
      };
    } else {
      // Restore focus on close
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // UXE-001: Handle close with focus restoration
  const handleClose = () => {
    onClose();
    // Focus will be restored in useEffect cleanup
  };

  // UXE-002: Image loading handlers
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // UXE-006: Pinch-to-zoom for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        setImageZoom(prev => Math.min(Math.max(prev * scale, 1), 3));
      }

      setLastTouchDistance(distance);
    }
  };

  if (!isOpen || !material) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      data-testid="material-preview-modal"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2
            id="modal-title"
            className="text-xl font-semibold text-gray-900 flex-1"
          >
            {material.title}
          </h2>

          {/* UXE-001: Accessible close button */}
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Modal schließen"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Image Display with Loading State */}
          <div className="relative bg-gray-100">
            {imageLoading && (
              // UXE-007: Skeleton loading state
              <div className="w-full h-96 flex items-center justify-center">
                <div className="space-y-4">
                  <IonSpinner className="w-12 h-12 text-primary-500" />
                  <p className="text-gray-600">Bild wird geladen...</p>
                </div>
              </div>
            )}

            {imageError && (
              // UXE-010: Error state with retry
              <div className="w-full h-96 flex flex-col items-center justify-center space-y-4">
                <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700 text-center">
                  Bild konnte nicht geladen werden
                </p>
                <button
                  onClick={() => {
                    setImageError(false);
                    setImageLoading(true);
                  }}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Erneut versuchen
                </button>
              </div>
            )}

            {!imageError && material.metadata.image_data?.url && (
              <img
                src={material.metadata.image_data.url}
                alt={material.title}
                className="w-full h-auto transition-transform"
                style={{ transform: `scale(${imageZoom})` }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              />
            )}
          </div>

          {/* Metadata */}
          <div className="p-6 space-y-4">
            {material.metadata.artifact_data?.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Beschreibung</h3>
                <p className="text-gray-900">{material.metadata.artifact_data.description}</p>
              </div>
            )}

            {material.metadata.artifact_data?.originalParams && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Stil:</span>
                    <span className="ml-2 text-gray-900">{material.metadata.artifact_data.originalParams.imageStyle}</span>
                  </div>
                  {material.metadata.artifact_data.originalParams.subject && (
                    <div>
                      <span className="text-gray-600">Fach:</span>
                      <span className="ml-2 text-gray-900">{material.metadata.artifact_data.originalParams.subject}</span>
                    </div>
                  )}
                  {material.metadata.artifact_data.originalParams.learningGroup && (
                    <div>
                      <span className="text-gray-600">Lernstufe:</span>
                      <span className="ml-2 text-gray-900">{material.metadata.artifact_data.originalParams.learningGroup}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-wrap gap-3">
          {/* UXE-004: Touch-optimized buttons with min height 44px */}
          <button
            onClick={() => {/* Handle download */}}
            className="flex-1 min-h-[44px] bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            aria-label="Bild herunterladen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Herunterladen</span>
          </button>

          <button
            onClick={() => {/* Handle regenerate */}}
            className="flex-1 min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            aria-label="Bild neu generieren"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Neu generieren</span>
          </button>

          <button
            onClick={() => {/* Handle favorite toggle */}}
            className="min-h-[44px] px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            aria-label={material.is_favorite ? "Von Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <svg className="w-5 h-5" fill={material.is_favorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## State Management Details

### Event Flow

```typescript
// 1. AgentResultView dispatches event
window.dispatchEvent(new CustomEvent('navigate-library-tab', {
  detail: {
    tab: 'materials',
    materialId: '0e457ee7-ea5c-4519-9e1d-a01d3d7d41fa',
    source: 'AgentResultView',
    timestamp: 1729186543210
  }
}));

// 2. Library receives event
window.addEventListener('navigate-library-tab', handleLibraryNav);

// 3. Library updates state
setSelectedTab('artifacts');
setSelectedMaterial(unifiedMaterial);
setIsModalOpen(true);

// 4. MaterialPreviewModal renders
<MaterialPreviewModal
  material={selectedMaterial}
  isOpen={isModalOpen}
  onClose={handleModalClose}
/>
```

### State Transitions

```
INITIAL STATE
├─ selectedTab: 'chats'
├─ selectedMaterial: null
└─ isModalOpen: false

EVENT RECEIVED (navigate-library-tab)
├─ Validate materialId
├─ Find material in artifacts[]
└─ Convert to UnifiedMaterial

STATE UPDATE
├─ selectedTab: 'artifacts'
├─ selectedMaterial: UnifiedMaterial {...}
└─ isModalOpen: true

MODAL RENDERS
├─ Focus management: trap focus in modal
├─ Image loading: show skeleton
├─ Content display: image + metadata + actions
└─ Keyboard navigation: Tab/Shift+Tab/Escape

USER CLOSES MODAL
├─ isModalOpen: false
├─ selectedMaterial: null (after animation)
└─ Focus restored: previous element
```

---

## Accessibility Implementation (WCAG 2.1 AA)

### Keyboard Navigation

**Requirements**:
- Tab: Navigate through interactive elements
- Shift+Tab: Navigate backwards
- Escape: Close modal
- Enter/Space: Activate buttons

**Implementation**:
```typescript
// Focus trap in modal
const trapFocus = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    // ... trap logic
  }

  if (e.key === 'Escape') {
    handleClose();
  }
};
```

### ARIA Labels and Roles

**Requirements**:
- All interactive elements have accessible names
- Modal has `role="dialog"` and `aria-modal="true"`
- Live regions for dynamic content announcements

**Implementation**:
```typescript
// Modal container
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>

// Buttons with clear labels
<button
  aria-label="Modal schließen"
  aria-keyshortcuts="Escape"
>

// Live region for announcements
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {announcement}
</div>
```

### Focus Management

**Requirements**:
- Save focus before opening modal
- Focus modal close button on open
- Restore focus on close
- Prevent focus escape from modal

**Implementation**:
```typescript
// Save current focus
const previousFocusRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  if (isOpen) {
    previousFocusRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();
  } else {
    previousFocusRef.current?.focus();
  }
}, [isOpen]);
```

### Screen Reader Support

**Requirements**:
- Announce navigation actions
- Announce loading states
- Announce errors
- Provide context for images

**Implementation**:
```typescript
// Announce navigation
const announceToScreenReader = (message: string) => {
  const liveRegion = document.getElementById('sr-live-region');
  if (liveRegion) {
    liveRegion.textContent = message;
    setTimeout(() => liveRegion.textContent = '', 1000);
  }
};

// Usage
announceToScreenReader('Navigiere zur Bibliothek');
announceToScreenReader('Material wird geladen');
announceToScreenReader('Fehler beim Laden des Materials');
```

---

## Loading States Implementation

### Skeleton Screens (UXE-007)

**Pattern**: Show content placeholders while data loads

```typescript
// Material card skeleton
const MaterialCardSkeleton = () => (
  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-16 h-16 bg-gray-200 rounded-md" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  </div>
);

// Modal image skeleton
const ImageSkeleton = () => (
  <div className="w-full h-96 bg-gray-200 animate-pulse flex items-center justify-center">
    <IonSpinner className="w-12 h-12 text-primary-500" />
    <p className="ml-3 text-gray-600">Bild wird geladen...</p>
  </div>
);
```

### Progressive Disclosure (UXE-008)

**Pattern**: Load critical content first, secondary content later

```typescript
// Load image first, then metadata
const [imageLoaded, setImageLoaded] = useState(false);
const [metadataLoaded, setMetadataLoaded] = useState(false);

useEffect(() => {
  if (material) {
    // Image loads via onLoad event
    // Then load metadata
    setTimeout(() => setMetadataLoaded(true), 100);
  }
}, [material]);

// Render
{imageLoaded && metadataLoaded ? (
  <FullContent />
) : (
  <SkeletonContent />
)}
```

### Loading Indicators (UXE-008)

**Pattern**: Show progress for async operations

```typescript
// Button loading state
<button
  disabled={loading}
  aria-busy={loading}
>
  {loading ? (
    <>
      <IonSpinner className="w-4 h-4 mr-2" />
      <span>Lädt...</span>
    </>
  ) : (
    <span>Aktion ausführen</span>
  )}
</button>

// Full-screen loading overlay
{isNavigating && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6">
      <IonSpinner className="w-8 h-8 text-primary-500" />
    </div>
  </div>
)}
```

---

## Error Handling Strategy

### Error Types and Handling

```typescript
// Error categories
enum ErrorType {
  NETWORK_ERROR = 'network_error',       // API call failed
  NOT_FOUND = 'not_found',               // Material not in artifacts
  PERMISSION_DENIED = 'permission_denied', // Access denied
  INVALID_DATA = 'invalid_data',         // Malformed data
  TIMEOUT = 'timeout'                    // Operation timed out
}

// Error handler
const handleError = (error: Error, type: ErrorType) => {
  logger.error('Library navigation error', error, {
    type,
    materialId: material?.id,
    userId: user?.id
  });

  // User-friendly messages
  const messages = {
    [ErrorType.NETWORK_ERROR]: 'Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.',
    [ErrorType.NOT_FOUND]: 'Das Material konnte nicht gefunden werden.',
    [ErrorType.PERMISSION_DENIED]: 'Sie haben keine Berechtigung für dieses Material.',
    [ErrorType.INVALID_DATA]: 'Die Materialdaten sind ungültig.',
    [ErrorType.TIMEOUT]: 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.'
  };

  setErrorMessage(messages[type]);
  setShowError(true);
};
```

### Recovery Actions (UXE-010)

```typescript
// Error display with retry
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <div className="flex items-start">
    <svg className="w-5 h-5 text-red-600 mr-3" />
    <div className="flex-1">
      <h3 className="text-sm font-medium text-red-800">Fehler</h3>
      <p className="text-sm text-red-700 mt-1">{errorMessage}</p>

      {/* Recovery actions */}
      <div className="mt-3 flex space-x-3">
        <button
          onClick={handleRetry}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Erneut versuchen
        </button>
        <button
          onClick={handleGoToLibrary}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Zur Bibliothek
        </button>
        <button
          onClick={handleDismissError}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Schließen
        </button>
      </div>
    </div>
  </div>
</div>
```

### Graceful Degradation

```typescript
// Fallback if materialId missing
if (!materialId) {
  console.warn('[Library] No materialId provided');
  // Still navigate to Library, but don't auto-open modal
  setSelectedTab('artifacts');
  // User can manually click material card
}

// Fallback if material not found
if (!artifact) {
  console.warn('[Library] Material not found:', materialId);
  // Navigate to Library with error message
  setSelectedTab('artifacts');
  setErrorMessage('Das Material wird möglicherweise noch geladen. Bitte versuchen Sie es in einigen Sekunden erneut.');
  setShowError(true);
}

// Fallback if image fails to load
<img
  src={imageUrl}
  onError={(e) => {
    console.error('[MaterialPreviewModal] Image load failed');
    setImageError(true);
    // Show placeholder or retry button
  }}
/>
```

---

## Mobile Optimization

### Touch Targets (UXE-004)

**Requirements**:
- Minimum 44x44px touch targets (iOS guideline)
- Adequate spacing between interactive elements
- Larger targets on mobile devices

**Implementation**:
```typescript
// Button component with mobile-optimized sizing
<button
  className="
    min-h-[44px] min-w-[44px]
    md:min-h-[36px] md:min-w-[36px]
    px-6 py-3
    bg-primary-500 hover:bg-primary-600
    text-white font-medium rounded-lg
    transition-colors
  "
>
  Action
</button>

// Spacing between buttons
<div className="flex flex-col sm:flex-row gap-3 md:gap-2">
  <button className="min-h-[44px]">Button 1</button>
  <button className="min-h-[44px]">Button 2</button>
</div>
```

### Gestures (UXE-006)

**Pinch to Zoom**:
```typescript
const handlePinchZoom = () => {
  const [zoom, setZoom] = useState(1);
  const [lastDistance, setLastDistance] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setLastDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDistance > 0) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      const scale = distance / lastDistance;
      setZoom(prev => Math.min(Math.max(prev * scale, 1), 3));
      setLastDistance(distance);
    }
  };

  return { zoom, handleTouchStart, handleTouchMove };
};

const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
  return Math.hypot(
    touch2.clientX - touch1.clientX,
    touch2.clientY - touch1.clientY
  );
};
```

**Swipe to Close** (Optional):
```typescript
const handleSwipeDown = () => {
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - startY;

    // Swipe down > 100px closes modal
    if (deltaY > 100) {
      onClose();
    }
  };

  return { handleTouchStart, handleTouchEnd };
};
```

### Safe Areas (UXE-014)

**Requirements**:
- Respect iOS safe areas (notch, home indicator)
- Adjust padding for device-specific insets

**Implementation**:
```css
/* Add to global CSS */
@supports (padding: max(0px)) {
  .safe-top {
    padding-top: max(1rem, env(safe-area-inset-top));
  }

  .safe-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }

  .safe-left {
    padding-left: max(1rem, env(safe-area-inset-left));
  }

  .safe-right {
    padding-right: max(1rem, env(safe-area-inset-right));
  }
}

/* Usage */
.modal-footer {
  @apply safe-bottom bg-gray-50 px-6 py-4;
}
```

---

## Micro-interactions and Transitions

### Hover States (UXE-005)

```typescript
// Button hover states
<button className="
  bg-primary-500 hover:bg-primary-600
  transform hover:scale-105
  transition-all duration-200
  active:scale-95
">
  Action
</button>

// Card hover states
<div className="
  bg-white border border-gray-200
  hover:shadow-lg hover:border-primary-500
  transition-all duration-300
  cursor-pointer
">
  Material Card
</div>
```

### Modal Animations (UXE-005)

```typescript
// Fade + scale animation
<div
  className={`
    fixed inset-0 bg-black/80
    transition-opacity duration-300
    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
  `}
>
  <div className={`
    bg-white rounded-2xl
    transform transition-all duration-300
    ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
  `}>
    {/* Modal content */}
  </div>
</div>

// Or use Framer Motion for advanced animations
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Modal content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Button Feedback (UXE-013)

```typescript
// Loading state
<button disabled={loading}>
  {loading ? (
    <IonSpinner className="w-4 h-4" />
  ) : (
    'Action'
  )}
</button>

// Success feedback (brief animation)
const [success, setSuccess] = useState(false);

const handleAction = async () => {
  await performAction();
  setSuccess(true);
  setTimeout(() => setSuccess(false), 2000);
};

<button className={success ? 'bg-green-500' : 'bg-primary-500'}>
  {success ? (
    <>
      <svg className="w-5 h-5" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
      Erfolgreich
    </>
  ) : (
    'Action'
  )}
</button>
```

---

## Testing Strategy

### Unit Tests (Component Level)

**Tools**: Vitest + React Testing Library

```typescript
// AgentResultView.test.tsx
describe('AgentResultView - Library Navigation', () => {
  it('should dispatch navigate-library-tab event with materialId', () => {
    const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent');

    render(<AgentResultView />);

    const libraryButton = screen.getByText(/In Library öffnen/i);
    fireEvent.click(libraryButton);

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'navigate-library-tab',
        detail: expect.objectContaining({
          tab: 'materials',
          materialId: expect.any(String)
        })
      })
    );
  });

  it('should handle missing materialId gracefully', () => {
    // Mock agent result without materialId
    const mockState = {
      result: { data: {} }
    };

    render(<AgentResultView />, { agentState: mockState });

    const libraryButton = screen.getByText(/In Library öffnen/i);
    fireEvent.click(libraryButton);

    // Should still navigate, just without auto-opening modal
    expect(mockNavigateToTab).toHaveBeenCalledWith('library');
  });
});

// Library.test.tsx
describe('Library - Event Handler', () => {
  it('should open modal when navigate-library-tab event received with materialId', () => {
    const mockMaterial = {
      id: 'test-material-123',
      title: 'Test Image'
    };

    render(<Library />, { materials: [mockMaterial] });

    // Dispatch event
    window.dispatchEvent(new CustomEvent('navigate-library-tab', {
      detail: {
        tab: 'materials',
        materialId: 'test-material-123'
      }
    }));

    // Modal should be open
    expect(screen.getByTestId('material-preview-modal')).toBeInTheDocument();
    expect(screen.getByText('Test Image')).toBeInTheDocument();
  });

  it('should show error when material not found', () => {
    render(<Library />, { materials: [] });

    window.dispatchEvent(new CustomEvent('navigate-library-tab', {
      detail: {
        tab: 'materials',
        materialId: 'non-existent-material'
      }
    }));

    expect(screen.getByText(/Material konnte nicht gefunden werden/i)).toBeInTheDocument();
  });
});

// MaterialPreviewModal.test.tsx
describe('MaterialPreviewModal - Accessibility', () => {
  it('should trap focus within modal', () => {
    render(<MaterialPreviewModal material={mockMaterial} isOpen={true} />);

    const closeButton = screen.getByLabelText(/Modal schließen/i);
    const downloadButton = screen.getByLabelText(/herunterladen/i);

    // Focus should cycle between modal elements only
    closeButton.focus();
    userEvent.tab();
    expect(downloadButton).toHaveFocus();

    userEvent.tab({ shift: true });
    expect(closeButton).toHaveFocus();
  });

  it('should close on Escape key', () => {
    const onClose = vi.fn();
    render(<MaterialPreviewModal material={mockMaterial} isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('should restore focus after closing', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<MaterialPreviewModal material={mockMaterial} isOpen={true} />);

    rerender(<MaterialPreviewModal material={mockMaterial} isOpen={false} />);

    expect(trigger).toHaveFocus();
  });
});
```

### Integration Tests

**Tools**: Vitest + Mock InstantDB

```typescript
describe('Library Navigation - End-to-End Flow', () => {
  it('should navigate from AgentResultView to Library with modal open', async () => {
    // Setup: Mock InstantDB with material data
    const mockMaterial = {
      id: 'material-123',
      title: 'Test Image',
      type: 'image',
      content: 'https://example.com/image.jpg'
    };

    mockInstantDB.query.mockResolvedValue({
      library_materials: [mockMaterial]
    });

    // Render AgentResultView after image generation
    const { rerender } = render(
      <App />,
      {
        initialRoute: '/chat',
        agentState: {
          result: {
            data: { library_id: 'material-123' }
          }
        }
      }
    );

    // Click "In Library öffnen"
    const libraryButton = screen.getByText(/In Library öffnen/i);
    await userEvent.click(libraryButton);

    // Wait for navigation
    await waitFor(() => {
      expect(screen.getByText('Bibliothek')).toBeInTheDocument();
    });

    // Materials tab should be active
    const materialsTab = screen.getByText('Materialien');
    expect(materialsTab.closest('button')).toHaveClass('text-primary-500');

    // Modal should be open with correct material
    const modal = screen.getByTestId('material-preview-modal');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText('Test Image')).toBeInTheDocument();

    // Image should be loading or loaded
    const image = within(modal).getByAltText('Test Image');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });
});
```

### E2E Tests

**Tools**: Playwright

```typescript
// e2e-tests/library-navigation-us2.spec.ts
import { test, expect } from '@playwright/test';

test.describe('US2: Library Navigation after Image Creation', () => {
  test('should navigate to Library with modal auto-opened', async ({ page }) => {
    console.log('🎯 Starting US2 Library Navigation E2E test');

    // Step 1: Generate image via agent
    await page.goto('http://localhost:5174');

    // Login (bypass auth in test mode)
    await page.evaluate(() => {
      localStorage.setItem('VITE_BYPASS_AUTH', 'true');
    });

    // Navigate to Chat
    await page.click('[data-testid="chat-tab"]');

    // Open agent modal
    await page.click('[data-testid="open-agent-button"]');

    // Fill agent form
    await page.fill('[data-testid="agent-description"]', 'Ein Löwe für Biologieunterricht');
    await page.selectOption('[data-testid="agent-style"]', 'realistic');

    // Confirm agent
    await page.click('[data-testid="agent-confirm-button"]');

    // Wait for image generation (max 60s)
    await page.waitForSelector('[data-testid="agent-result-view"]', { timeout: 60000 });
    console.log('✅ Image generated successfully');

    // Step 2: Click "In Library öffnen"
    const libraryButton = page.locator('button:has-text("In Library öffnen")');
    await expect(libraryButton).toBeVisible({ timeout: 5000 });
    await libraryButton.click();
    console.log('✅ Clicked "In Library öffnen" button');

    // Step 3: Verify Library tab active
    const libraryTab = page.locator('[data-testid="library-tab"]');
    await expect(libraryTab).toHaveClass(/text-primary-500/, { timeout: 3000 });
    console.log('✅ Library tab is active');

    // Step 4: Verify "Materials" subtab selected
    const materialsTab = page.locator('button:has-text("Materialien")');
    await expect(materialsTab).toHaveClass(/text-primary-500/, { timeout: 2000 });
    console.log('✅ Materials subtab is active');

    // Step 5: Verify MaterialPreviewModal opened
    const modal = page.locator('[data-testid="material-preview-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });
    console.log('✅ MaterialPreviewModal opened automatically');

    // Step 6: Verify modal shows image
    const modalImage = modal.locator('img[alt*="Löwe"]');
    await expect(modalImage).toBeVisible({ timeout: 2000 });
    console.log('✅ Modal displays image preview');

    // Step 7: Verify modal metadata
    await expect(modal.locator('h2:has-text("Löwe")')).toBeVisible();
    console.log('✅ Modal displays title');

    // Step 8: Verify action buttons
    await expect(modal.locator('button:has-text("Herunterladen")')).toBeVisible();
    await expect(modal.locator('button:has-text("Neu generieren")')).toBeVisible();
    console.log('✅ Modal displays action buttons');

    // Step 9: Test keyboard navigation
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBe('BUTTON');
    console.log('✅ Keyboard navigation works');

    // Step 10: Test close with Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 1000 });
    console.log('✅ Modal closes with Escape key');

    console.log('✅ US2 Library Navigation E2E test PASSED');
  });

  test('should handle missing materialId gracefully', async ({ page }) => {
    console.log('🎯 Testing graceful degradation (no materialId)');

    await page.goto('http://localhost:5174');

    // Manually dispatch event without materialId
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('navigate-library-tab', {
        detail: { tab: 'materials' }
      }));
    });

    // Verify: Library tab active, Materials subtab active, NO modal
    await expect(page.locator('[data-testid="library-tab"]')).toHaveClass(/text-primary-500/);
    await expect(page.locator('button:has-text("Materialien")')).toHaveClass(/text-primary-500/);
    await expect(page.locator('[data-testid="material-preview-modal"]')).not.toBeVisible();

    console.log('✅ Graceful degradation test PASSED');
  });
});

// Accessibility E2E tests
test.describe('US2: Accessibility Compliance', () => {
  test('should meet WCAG 2.1 AA standards', async ({ page }) => {
    // Use axe-playwright for automated accessibility testing
    await page.goto('http://localhost:5174/library');

    // Open a material modal
    await page.click('[data-testid="material-card"]');

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
    console.log('✅ No accessibility violations found');
  });

  test('should support keyboard-only navigation', async ({ page }) => {
    await page.goto('http://localhost:5174/library');

    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Focus first material card
    await page.keyboard.press('Enter'); // Open modal

    const modal = page.locator('[data-testid="material-preview-modal"]');
    await expect(modal).toBeVisible();

    // Tab through modal buttons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus stays within modal
    const focusedElement = await page.evaluate(() => {
      const modal = document.querySelector('[data-testid="material-preview-modal"]');
      return modal?.contains(document.activeElement);
    });

    expect(focusedElement).toBe(true);
    console.log('✅ Focus trap working correctly');
  });
});
```

### Performance Tests

```typescript
test.describe('US2: Performance Requirements', () => {
  test('should navigate in <2s', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Measure navigation time
    const startTime = Date.now();

    // Trigger navigation
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('navigate-library-tab', {
        detail: { tab: 'materials', materialId: 'test-123' }
      }));
    });

    // Wait for modal to open
    await page.waitForSelector('[data-testid="material-preview-modal"]');

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(2000);
    console.log(`✅ Navigation completed in ${duration}ms (target: <2000ms)`);
  });

  test('should open modal in <500ms', async ({ page }) => {
    await page.goto('http://localhost:5174/library');

    const startTime = Date.now();

    await page.click('[data-testid="material-card"]');
    await page.waitForSelector('[data-testid="material-preview-modal"]');

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(500);
    console.log(`✅ Modal opened in ${duration}ms (target: <500ms)`);
  });
});
```

---

## Implementation Checklist

### Phase 1: Core Navigation (T014-T016) - 1 hour

- [ ] **T014**: AgentResultView.tsx - Event Dispatch
  - [ ] Extract materialId from agent result
  - [ ] Dispatch custom event with materialId
  - [ ] Add loading state during navigation
  - [ ] Add ARIA live region for announcements
  - [ ] Test with/without materialId
  - [ ] Build passes (0 TypeScript errors)

- [ ] **T015**: Library.tsx - Event Handler Extension
  - [ ] Listen for navigate-library-tab event
  - [ ] Switch to Materials tab
  - [ ] Find material by ID in artifacts array
  - [ ] Convert to UnifiedMaterial
  - [ ] Open modal with selectedMaterial
  - [ ] Add error handling for missing material
  - [ ] Add loading state while finding material
  - [ ] Test event handler with mock event

- [ ] **T016**: Backend Verification
  - [ ] Verify library_id in langGraphAgents.ts response
  - [ ] Document field location in API contract
  - [ ] Test manual API call to verify response structure

### Phase 2: Accessibility (UXE-001, UXE-012) - 1.5 hours

- [ ] **Keyboard Navigation**
  - [ ] Implement focus trap in modal
  - [ ] Handle Tab/Shift+Tab navigation
  - [ ] Handle Escape to close
  - [ ] Test with keyboard only (no mouse)

- [ ] **ARIA Labels**
  - [ ] Add aria-label to all buttons
  - [ ] Add role="dialog" to modal
  - [ ] Add aria-modal="true"
  - [ ] Add aria-labelledby and aria-describedby
  - [ ] Test with screen reader (NVDA/VoiceOver)

- [ ] **Focus Management**
  - [ ] Save focus before opening modal
  - [ ] Focus close button on modal open
  - [ ] Restore focus on modal close
  - [ ] Test focus restoration

### Phase 3: Loading States (UXE-007, UXE-008) - 1 hour

- [ ] **Skeleton Screens**
  - [ ] Create MaterialCardSkeleton component
  - [ ] Create ImageSkeleton component
  - [ ] Show skeleton while materials load
  - [ ] Show skeleton while image loads

- [ ] **Progressive Disclosure**
  - [ ] Load image first
  - [ ] Load metadata after image
  - [ ] Test loading sequence

- [ ] **Loading Indicators**
  - [ ] Add button loading states
  - [ ] Add navigation loading overlay
  - [ ] Test loading indicators

### Phase 4: Error Handling (UXE-010) - 45 minutes

- [ ] **Error Display**
  - [ ] Create error toast component
  - [ ] Show user-friendly error messages
  - [ ] Auto-hide after 5 seconds
  - [ ] Test error display

- [ ] **Recovery Actions**
  - [ ] Add "Retry" button to errors
  - [ ] Add "Go to Library" button
  - [ ] Test recovery flow

- [ ] **Graceful Degradation**
  - [ ] Handle missing materialId
  - [ ] Handle material not found
  - [ ] Handle image load failure
  - [ ] Test all error cases

### Phase 5: Mobile Optimization (UXE-003, UXE-004, UXE-006, UXE-014) - 1 hour

- [ ] **Touch Targets**
  - [ ] Ensure all buttons ≥44x44px
  - [ ] Add adequate spacing
  - [ ] Test on mobile device

- [ ] **Gestures**
  - [ ] Implement pinch-to-zoom
  - [ ] Test zoom on mobile

- [ ] **Safe Areas**
  - [ ] Add safe-area-inset CSS
  - [ ] Test on iPhone with notch
  - [ ] Test on Android with gesture bar

### Phase 6: Micro-interactions (UXE-005, UXE-013) - 30 minutes

- [ ] **Hover States**
  - [ ] Add button hover effects
  - [ ] Add card hover effects
  - [ ] Test hover transitions

- [ ] **Modal Animations**
  - [ ] Add fade + scale animation
  - [ ] Test animation performance
  - [ ] Ensure smooth 60fps

- [ ] **Button Feedback**
  - [ ] Add loading state animations
  - [ ] Add success state animations
  - [ ] Test feedback clarity

### Phase 7: Testing (T017) - 2 hours

- [ ] **Unit Tests**
  - [ ] Test AgentResultView event dispatch
  - [ ] Test Library event handler
  - [ ] Test MaterialPreviewModal accessibility
  - [ ] All unit tests pass

- [ ] **Integration Tests**
  - [ ] Test end-to-end navigation flow
  - [ ] Test with mock InstantDB
  - [ ] All integration tests pass

- [ ] **E2E Tests**
  - [ ] Create library-navigation-us2.spec.ts
  - [ ] Test successful navigation with modal
  - [ ] Test graceful degradation without materialId
  - [ ] Test accessibility compliance
  - [ ] Test keyboard navigation
  - [ ] Test performance (<2s navigation)
  - [ ] All E2E tests pass

- [ ] **Manual Testing**
  - [ ] Test on Chrome Desktop
  - [ ] Test on Chrome Mobile (Pixel 9)
  - [ ] Test on Safari Desktop
  - [ ] Test on Safari Mobile (iPhone)
  - [ ] Test with keyboard only
  - [ ] Test with screen reader
  - [ ] Document test results

### Phase 8: Documentation and Deployment - 30 minutes

- [ ] **Session Log**
  - [ ] Create session log in docs/development-logs/sessions/2025-10-17/
  - [ ] Document implementation details
  - [ ] Include build output
  - [ ] Include test results
  - [ ] Include manual verification screenshots

- [ ] **Update Specs**
  - [ ] Mark T014-T017 as complete in tasks.md
  - [ ] Update spec.md with implementation notes
  - [ ] Update plan.md if architecture changed

- [ ] **Git Commit**
  - [ ] Commit with message: "feat(US2): auto-open Library MaterialPreviewModal after image creation"
  - [ ] Include DoD checklist in commit message
  - [ ] Push to feature branch

---

## Definition of Done

### Task is COMPLETE when:

1. **✅ Build Clean**:
   ```bash
   cd teacher-assistant/frontend
   npm run build
   # Must pass with 0 TypeScript errors
   ```

2. **✅ Unit Tests Pass**:
   ```bash
   npm test
   # All tests pass
   # New tests added for new functionality
   ```

3. **✅ E2E Tests Pass**:
   ```bash
   VITE_TEST_MODE=true npx playwright test e2e-tests/library-navigation-us2.spec.ts
   # All tests pass
   # Screenshots captured
   ```

4. **✅ Manual Verification**:
   - Chrome Desktop: Navigation works, modal opens
   - Chrome Mobile (Pixel 9): Touch targets correct, gestures work
   - Safari Desktop: Compatibility verified
   - Safari Mobile (iPhone): Safe areas respected
   - Keyboard only: Full navigation possible
   - Screen reader (NVDA/VoiceOver): Announces correctly
   - Screenshots: All views captured

5. **✅ Accessibility Verified**:
   - Focus trap works in modal
   - ARIA labels correct
   - Keyboard navigation complete
   - Screen reader announces state changes
   - Color contrast ≥4.5:1

6. **✅ Performance Verified**:
   - Navigation <2s (measured)
   - Modal open <500ms (measured)
   - Smooth 60fps animations
   - No layout shifts

7. **✅ Error Handling Verified**:
   - Missing materialId: Graceful degradation
   - Material not found: User-friendly error
   - Image load failure: Retry option
   - All error paths tested

8. **✅ Session Log Created**:
   - Location: `docs/development-logs/sessions/2025-10-17/session-01-library-navigation-us2.md`
   - Contains: Build output, test results, manual verification, screenshots

---

## Handoff Summary for Developer Agent

### What to Implement

You are implementing **US2: Library Navigation Enhancement** with **UX Enhancements UXE-001 through UXE-015** integrated.

### Key Implementation Points

1. **Event-Driven Navigation**:
   - Dispatch custom event from AgentResultView with materialId
   - Handle event in Library.tsx to auto-open modal
   - Use existing `navigateToTab()` from AgentContext (DO NOT use React Router or window.location)

2. **Accessibility First**:
   - Every interactive element needs aria-label
   - Modal needs focus trap
   - Use ARIA live regions for announcements
   - Test with keyboard only

3. **Loading States Everywhere**:
   - Button loading states
   - Skeleton screens for content
   - Loading overlays for navigation
   - Progressive disclosure pattern

4. **Error Handling with Recovery**:
   - User-friendly error messages
   - Retry buttons for recoverable errors
   - Graceful degradation for missing data
   - Log errors for debugging

5. **Mobile-First Design**:
   - Touch targets ≥44x44px
   - Pinch-to-zoom for images
   - Safe area insets for notches
   - Test on real devices

6. **Testing is Critical**:
   - Unit tests for each component
   - Integration test for full flow
   - E2E test with Playwright
   - Manual verification on multiple browsers/devices

### Files to Modify

1. `teacher-assistant/frontend/src/components/AgentResultView.tsx` (T014)
   - Lines ~356-396: handleOpenInLibrary function

2. `teacher-assistant/frontend/src/pages/Library/Library.tsx` (T015)
   - Lines ~194-239: navigate-library-tab event handler

3. `teacher-assistant/frontend/src/components/MaterialPreviewModal.tsx` (Accessibility)
   - Full component enhancement for accessibility

4. `teacher-assistant/frontend/e2e-tests/library-navigation-us2.spec.ts` (NEW) (T017)
   - Create new E2E test file

### Testing Commands

```bash
# Build (must pass)
cd teacher-assistant/frontend
npm run build

# Unit tests
npm test

# E2E tests
VITE_TEST_MODE=true npx playwright test e2e-tests/library-navigation-us2.spec.ts

# Manual testing
npm run dev
# Open http://localhost:5174
# Generate image → Click "In Library öffnen" → Verify modal opens
```

### Success Criteria

- Navigation completes in <2s
- Modal opens in <500ms
- Full keyboard navigation works
- Screen reader announces correctly
- All E2E tests pass
- Manual verification on 4+ browsers/devices

### Reference Documents

- PRD: `docs/architecture/implementation-details/PRD-SPRINT-PRIORITIES-2025-10-17.md`
- Feature Review: `docs/architecture/implementation-details/COMPREHENSIVE-FEATURE-REVIEW-2025-10-17.md`
- Brownfield Architecture: `docs/architecture/brownfield-architecture.md`
- Spec 003: `specs/003-agent-confirmation-ux/spec.md`

### Questions?

Refer to this technical plan for implementation details. All patterns are proven and tested in the existing codebase.

---

**Document Version**: 1.0
**Created**: 2025-10-17
**Author**: System Architect (Winston)
**Status**: Ready for Implementation
**Estimated Effort**: 8 hours (comprehensive implementation with all UX enhancements)
**Next Review**: After implementation completion
