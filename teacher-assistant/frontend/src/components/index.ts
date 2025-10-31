// Export all components from this directory
export { ProtectedRoute } from './ProtectedRoute';
export { Dashboard } from './Dashboard';
export * from './auth';

// Export view components
export { default as HomeView } from './HomeView';
export { default as ChatView } from './ChatView';
export { default as LibraryView } from './LibraryView';
export { default as ProfileView } from './ProfileView';
export { default as OnboardingWizard } from './OnboardingWizard';
export { default as LoadingSpinner } from './LoadingSpinner';

// Export chat-related components
export { default as AgentConfirmationMessage } from './AgentConfirmationMessage';
export { default as AgentProgressMessage } from './AgentProgressMessage';
export { AgentResultMessage } from './AgentResultMessage'; // Named export
export { default as ProgressiveMessage } from './ProgressiveMessage';
export { MaterialPreviewModal } from './MaterialPreviewModal'; // Named export
export { RouterOverride } from './RouterOverride'; // Named export - Story 3.1.3
