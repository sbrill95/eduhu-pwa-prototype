/**
 * Navigation Event Logging Schemas for Bug Fixes 2025-10-11
 *
 * This file defines TypeScript interfaces for logging navigation events,
 * agent lifecycle events, and errors for observability purposes.
 *
 * Related Requirements:
 * - FR-011: Error and navigation event logging
 * - FR-002a: Debounce navigation events
 * - BUG-030: Chat navigation after image generation
 */

/**
 * Tab identifiers used in the Ionic tab navigation system
 */
export type TabId = 'chat' | 'library' | 'home' | 'profile';

/**
 * Source identifiers for navigation events
 * Includes special sources like agent result views
 */
export type NavigationSource =
  | TabId
  | 'agent-result'
  | 'agent-modal'
  | 'deep-link';

/**
 * Trigger types for navigation events
 */
export type NavigationTrigger =
  | 'user-click'        // User clicked a tab or navigation button
  | 'programmatic'      // Navigation triggered by code
  | 'deep-link'         // Navigation from external URL
  | 'back-button'       // Browser back button
  | 'debounced';        // Navigation delayed by debounce logic

/**
 * Navigation event logged when user navigates between tabs or pages
 *
 * Usage: Log every tab change for debugging navigation issues
 */
export interface NavigationEvent {
  /** Event timestamp */
  timestamp: Date;

  /** Where the navigation originated from */
  source: NavigationSource;

  /** Where the navigation is going to */
  destination: TabId;

  /** How the navigation was triggered */
  trigger: NavigationTrigger;

  /** Additional context (e.g., agent type if source is 'agent-result') */
  context?: {
    agentType?: string;
    previousUrl?: string;
    nextUrl?: string;
    debounceDelay?: number;
  };
}

/**
 * Agent types supported in the application
 */
export type AgentType =
  | 'image-generation'
  | 'lesson-plan'
  | 'quiz-creation'
  | 'general';

/**
 * Agent lifecycle event types
 */
export type AgentEventType =
  | 'modal-open'        // Agent modal opened
  | 'modal-close'       // Agent modal closed (without submission)
  | 'form-submit'       // Agent form submitted
  | 'result-view'       // Agent result displayed
  | 'result-action';    // User took action on result (e.g., "Weiter im Chat")

/**
 * Agent lifecycle event for tracking agent usage and flow
 *
 * Usage: Log agent interactions for debugging and analytics
 */
export interface AgentLifecycleEvent {
  /** Event timestamp */
  timestamp: Date;

  /** Type of agent */
  agentType: AgentType;

  /** Lifecycle event type */
  event: AgentEventType;

  /** Form data when submitted (omit sensitive info) */
  formData?: Record<string, unknown>;

  /** Result data when displayed */
  resultData?: {
    success: boolean;
    hasImage?: boolean;
    imageUrl?: string;
    error?: string;
  };

  /** Action taken on result */
  action?: {
    type: 'navigate-to-chat' | 'regenerate' | 'save-to-library' | 'share' | 'close';
    trigger: 'button-click' | 'keyboard' | 'gesture';
  };
}

/**
 * Error severity levels
 */
export type ErrorSeverity =
  | 'error'             // Critical error that breaks functionality
  | 'warning'           // Non-critical issue that may impact UX
  | 'info';             // Informational message for debugging

/**
 * Error context identifiers
 */
export type ErrorContext =
  | 'navigation'        // Navigation-related errors
  | 'database'          // InstantDB query/mutation errors
  | 'validation'        // Metadata or form validation errors
  | 'network'           // API or network errors
  | 'agent'             // Agent execution errors
  | 'unknown';          // Uncategorized errors

/**
 * Error log event for tracking failures and debugging issues
 *
 * Usage: Log all caught exceptions with context
 */
export interface ErrorLogEvent {
  /** Event timestamp */
  timestamp: Date;

  /** Error severity level */
  severity: ErrorSeverity;

  /** Error context/category */
  context: ErrorContext;

  /** Error message */
  message: string;

  /** Original error object */
  error?: Error;

  /** Stack trace (when available) */
  stackTrace?: string;

  /** Additional context data */
  metadata?: {
    userId?: string;
    sessionId?: string;
    componentName?: string;
    actionAttempted?: string;
    [key: string]: unknown;
  };
}

/**
 * Logger interface for consistent logging across the application
 */
export interface EventLogger {
  /** Log a navigation event */
  logNavigation(event: Omit<NavigationEvent, 'timestamp'>): void;

  /** Log an agent lifecycle event */
  logAgentEvent(event: Omit<AgentLifecycleEvent, 'timestamp'>): void;

  /** Log an error */
  logError(event: Omit<ErrorLogEvent, 'timestamp'>): void;
}

/**
 * Console-based event logger implementation (FR-011)
 * Logs all events to browser console with structured formatting
 */
export class ConsoleEventLogger implements EventLogger {
  private static readonly PREFIX = '[Event]';

  logNavigation(event: Omit<NavigationEvent, 'timestamp'>): void {
    const fullEvent: NavigationEvent = {
      ...event,
      timestamp: new Date(),
    };

    console.log(
      `${ConsoleEventLogger.PREFIX} Navigation:`,
      `${event.source} → ${event.destination}`,
      `(${event.trigger})`,
      event.context ? event.context : ''
    );

    // Store in session for debugging
    this.storeEvent('navigation', fullEvent);
  }

  logAgentEvent(event: Omit<AgentLifecycleEvent, 'timestamp'>): void {
    const fullEvent: AgentLifecycleEvent = {
      ...event,
      timestamp: new Date(),
    };

    console.log(
      `${ConsoleEventLogger.PREFIX} Agent:`,
      `${event.agentType} - ${event.event}`,
      event.formData ? `with data: ${JSON.stringify(event.formData)}` : '',
      event.resultData ? `result: ${JSON.stringify(event.resultData)}` : '',
      event.action ? `action: ${JSON.stringify(event.action)}` : ''
    );

    // Store in session for debugging
    this.storeEvent('agent', fullEvent);
  }

  logError(event: Omit<ErrorLogEvent, 'timestamp'>): void {
    const fullEvent: ErrorLogEvent = {
      ...event,
      timestamp: new Date(),
    };

    const consoleMethod = event.severity === 'error' ? console.error :
                         event.severity === 'warning' ? console.warn :
                         console.log;

    consoleMethod(
      `${ConsoleEventLogger.PREFIX} ${event.severity.toUpperCase()}:`,
      `[${event.context}]`,
      event.message,
      event.error ? `\n${event.error.message}` : '',
      event.stackTrace ? `\nStack: ${event.stackTrace}` : '',
      event.metadata ? `\nMetadata: ${JSON.stringify(event.metadata, null, 2)}` : ''
    );

    // Store in session for debugging
    this.storeEvent('error', fullEvent);
  }

  /**
   * Stores event in sessionStorage for debugging
   * Limited to 100 events per type to prevent memory issues
   */
  private storeEvent(type: 'navigation' | 'agent' | 'error', event: any): void {
    try {
      const key = `event_log_${type}`;
      const stored = sessionStorage.getItem(key);
      const events = stored ? JSON.parse(stored) : [];

      events.push(event);

      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }

      sessionStorage.setItem(key, JSON.stringify(events));
    } catch (error) {
      // Fail silently if sessionStorage is full or unavailable
      console.warn('Failed to store event in sessionStorage:', error);
    }
  }
}

/**
 * Singleton logger instance
 */
export const eventLogger: EventLogger = new ConsoleEventLogger();

/**
 * Helper function to retrieve stored events for debugging
 *
 * @param type - Event type to retrieve
 * @returns Array of stored events
 */
export const getStoredEvents = (type: 'navigation' | 'agent' | 'error'): any[] => {
  try {
    const key = `event_log_${type}`;
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Helper function to clear stored events
 */
export const clearStoredEvents = (): void => {
  try {
    sessionStorage.removeItem('event_log_navigation');
    sessionStorage.removeItem('event_log_agent');
    sessionStorage.removeItem('event_log_error');
  } catch {
    console.warn('Failed to clear stored events');
  }
};

/**
 * Usage Examples:
 *
 * // Log navigation event
 * eventLogger.logNavigation({
 *   source: 'agent-result',
 *   destination: 'chat',
 *   trigger: 'user-click',
 *   context: { agentType: 'image-generation' }
 * });
 *
 * // Log agent lifecycle event
 * eventLogger.logAgentEvent({
 *   agentType: 'image-generation',
 *   event: 'form-submit',
 *   formData: { description: 'A red apple', imageStyle: 'realistic' }
 * });
 *
 * // Log error
 * eventLogger.logError({
 *   severity: 'error',
 *   context: 'database',
 *   message: 'Failed to save message to InstantDB',
 *   error: error,
 *   stackTrace: error.stack,
 *   metadata: { userId: user.id, messageContent: 'Hello' }
 * });
 *
 * // Retrieve stored events for debugging
 * const navigationEvents = getStoredEvents('navigation');
 * console.table(navigationEvents);
 */
