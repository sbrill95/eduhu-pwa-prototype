/**
 * Logger Utility for FR-011: Error logs + navigation events + agent lifecycle
 *
 * Usage:
 * - logger.navigation('TabChange', { from: 'home', to: 'chat' })
 * - logger.agentLifecycle('open', { agentType: 'imageGeneration' })
 * - logger.error('Failed to save', error, { userId, context })
 */

interface LogContext {
  [key: string]: unknown;
}

interface NavigationContext {
  source?: string;
  destination?: string;
  trigger?: string;
  [key: string]: unknown;
}

interface AgentLifecycleContext {
  agentType?: string;
  action?: string;
  [key: string]: unknown;
}

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = import.meta.env.DEV;
  }

  /**
   * Log navigation events (FR-011b: tab navigation changes with source/destination)
   */
  navigation(event: string, context: NavigationContext): void {
    console.log(`🔄 [Navigation.${event}]`, {
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Log agent lifecycle events (FR-011c: open, close, submit)
   */
  agentLifecycle(event: 'open' | 'close' | 'submit', context: AgentLifecycleContext): void {
    console.log(`🤖 [Agent.${event}]`, {
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Log errors with stack traces (FR-011a: all caught exceptions with stack traces)
   */
  error(message: string, error: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    console.error(`❌ [Error] ${message}`, {
      timestamp: new Date().toISOString(),
      error: errorObj.message,
      stack: errorObj.stack,
      ...context
    });
  }

  /**
   * Log warnings for non-critical issues
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`⚠️  [Warning] ${message}`, {
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * General info logging
   */
  log(message: string, context?: LogContext): void {
    console.log(`ℹ️  [Info] ${message}`, {
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Debug logging (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.log(`🐛 [Debug] ${message}`, {
        timestamp: new Date().toISOString(),
        ...context
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();
