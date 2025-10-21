/**
 * Progress Streaming Service for LangGraph Agents
 * Provides 3-tier progress system with WebSocket integration and controlled updates
 */

import WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { logInfo, logError, logWarn } from '../config/logger';
import { RedisUtils, RedisKeys } from '../config/redis';

/**
 * Progress levels for different user types
 */
export enum ProgressLevel {
  USER_FRIENDLY = 'user_friendly', // Simple progress for end users
  DETAILED = 'detailed', // More granular steps for power users
  DEBUG = 'debug', // Full technical details for development
}

/**
 * Progress update interface
 */
export interface ProgressUpdate {
  executionId: string;
  level: ProgressLevel;
  step: string;
  message: string;
  progress: number; // 0-100
  estimatedTimeLeft: number | undefined; // seconds
  cancelable: boolean;
  metadata?: Record<string, any>;
  timestamp: number;
}

/**
 * Progress step definition
 */
export interface ProgressStep {
  id: string;
  userFriendly: string;
  detailed: string;
  debug: string;
  weight: number; // Relative weight for progress calculation
  estimatedDuration: number; // seconds
}

/**
 * WebSocket client connection
 */
interface WSClient {
  ws: WebSocket;
  userId: string;
  executionId: string | undefined;
  level: ProgressLevel;
  lastPing: number;
}

/**
 * Pre-defined progress steps for different agent types
 */
const AGENT_PROGRESS_STEPS: Record<string, ProgressStep[]> = {
  'image-generation': [
    {
      id: 'validation',
      userFriendly: '🔍 Überprüfe deine Anfrage...',
      detailed: '🔍 Validiere Eingabeparameter und Benutzerberechtigungen',
      debug:
        'Validating input parameters, checking user quotas, and verifying API access',
      weight: 10,
      estimatedDuration: 2,
    },
    {
      id: 'prompt-enhancement',
      userFriendly: '✨ Optimiere deinen Bildwunsch...',
      detailed: '✨ Verbessere Prompt für bessere Bildqualität',
      debug:
        'Enhancing German prompt with educational context using GPT-4o-mini',
      weight: 15,
      estimatedDuration: 3,
    },
    {
      id: 'image-generation',
      userFriendly: '🎨 Erstelle dein Bild...',
      detailed: '🎨 Generiere Bild mit DALL-E 3',
      debug:
        'Calling OpenAI DALL-E 3 API with enhanced prompt and specified parameters',
      weight: 60,
      estimatedDuration: 15,
    },
    {
      id: 'processing',
      userFriendly: '📸 Bereite dein Bild vor...',
      detailed: '📸 Verarbeite Bilddaten und erstelle Artefakt',
      debug:
        'Processing image data, creating artifact record, and updating user usage statistics',
      weight: 10,
      estimatedDuration: 2,
    },
    {
      id: 'finalization',
      userFriendly: '✅ Fertig! Dein Bild ist bereit.',
      detailed: '✅ Speichere Ergebnis und aktualisiere Bibliothek',
      debug:
        'Storing artifact in InstantDB, updating user library, and cleaning up temporary data',
      weight: 5,
      estimatedDuration: 1,
    },
  ],

  'web-search': [
    {
      id: 'validation',
      userFriendly: '🔍 Überprüfe deine Suchanfrage...',
      detailed: '🔍 Validiere Suchparameter und Benutzerberechtigungen',
      debug:
        'Validating search query, checking rate limits, and preparing Tavily API call',
      weight: 10,
      estimatedDuration: 1,
    },
    {
      id: 'search',
      userFriendly: '🌐 Durchsuche das Internet...',
      detailed: '🌐 Führe Websuche mit Tavily API durch',
      debug:
        'Executing web search via Tavily API with optimized query parameters',
      weight: 50,
      estimatedDuration: 5,
    },
    {
      id: 'processing',
      userFriendly: '📊 Verarbeite Suchergebnisse...',
      detailed: '📊 Analysiere und filtere Suchergebnisse',
      debug:
        'Processing search results, filtering for relevance, and extracting key information',
      weight: 30,
      estimatedDuration: 3,
    },
    {
      id: 'finalization',
      userFriendly: '✅ Suchergebnisse bereit!',
      detailed: '✅ Formatiere Antwort und speichere Ergebnisse',
      debug:
        'Formatting response, caching results, and updating search analytics',
      weight: 10,
      estimatedDuration: 1,
    },
  ],
};

/**
 * Progress Streaming Service
 */
export class ProgressStreamingService {
  private static instance: ProgressStreamingService;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WSClient> = new Map();
  private activeExecutions: Map<string, ProgressTracker> = new Map();
  private wsPort: number = 3004;

  private constructor() {}

  public static getInstance(): ProgressStreamingService {
    if (!ProgressStreamingService.instance) {
      ProgressStreamingService.instance = new ProgressStreamingService();
    }
    return ProgressStreamingService.instance;
  }

  /**
   * Initialize WebSocket server with port fallback
   */
  public initialize(port: number = 3004): void {
    const maxRetries = 10;
    let currentPort = port;
    let initialized = false;

    for (let attempt = 0; attempt < maxRetries && !initialized; attempt++) {
      try {
        this.wss = new WebSocketServer({
          port: currentPort,
          verifyClient: this.verifyClient.bind(this),
        });

        this.wss.on('connection', this.handleConnection.bind(this));
        this.wss.on('error', (error) => {
          logError('WebSocket server error', error);
        });

        // Start cleanup interval
        setInterval(() => this.cleanupConnections(), 30000); // Every 30 seconds

        logInfo(
          `Progress streaming WebSocket server started on port ${currentPort}`
        );
        initialized = true;

        // Store the actual port used
        this.wsPort = currentPort;
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('EADDRINUSE')) {
          logWarn(
            `Port ${currentPort} is in use, trying port ${currentPort + 1}`
          );
          currentPort++;
        } else {
          logError(
            'Failed to initialize progress streaming service',
            error as Error
          );
          throw error;
        }
      }
    }

    if (!initialized) {
      const error = new Error(
        `Failed to find available port after ${maxRetries} attempts starting from port ${port}`
      );
      logError('WebSocket server initialization failed', error);
      throw error;
    }
  }

  /**
   * Get the actual WebSocket port being used
   */
  public getWebSocketPort(): number {
    return this.wsPort;
  }

  /**
   * Verify WebSocket client
   */
  private verifyClient(info: { req: IncomingMessage }): boolean {
    // Add authentication logic here if needed
    return true;
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const userId = url.searchParams.get('userId');
    const level =
      (url.searchParams.get('level') as ProgressLevel) ||
      ProgressLevel.USER_FRIENDLY;
    const executionId = url.searchParams.get('executionId');

    if (!userId) {
      ws.close(1008, 'User ID required');
      return;
    }

    const clientId = `${userId}_${Date.now()}`;
    const client: WSClient = {
      ws,
      userId,
      executionId: executionId || '', // Use empty string instead of undefined
      level,
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);

    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('close', () => this.handleDisconnection(clientId));
    ws.on('error', (error) => {
      logError(`WebSocket client error for ${clientId}`, error);
      this.handleDisconnection(clientId);
    });

    // Send welcome message
    this.sendToClient(client, {
      type: 'connected',
      message: 'Mit Progress-Stream verbunden',
      level,
      timestamp: Date.now(),
    });

    logInfo(
      `Progress streaming client connected: ${clientId} (level: ${level})`
    );
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage(clientId: string, data: WebSocket.Data): void {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'ping':
          client.lastPing = Date.now();
          this.sendToClient(client, { type: 'pong', timestamp: Date.now() });
          break;

        case 'subscribe':
          if (message.executionId) {
            client.executionId = message.executionId;
            logInfo(
              `Client ${clientId} subscribed to execution ${message.executionId}`
            );
          }
          break;

        case 'unsubscribe':
          client.executionId = ''; // Use empty string instead of undefined
          logInfo(`Client ${clientId} unsubscribed from execution updates`);
          break;

        case 'cancel':
          if (message.executionId) {
            this.cancelExecution(message.executionId);
          }
          break;

        default:
          logWarn(
            `Unknown message type from client ${clientId}: ${message.type}`
          );
      }
    } catch (error) {
      logError(
        `Error handling message from client ${clientId}`,
        error as Error
      );
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(clientId: string): void {
    this.clients.delete(clientId);
    logInfo(`Progress streaming client disconnected: ${clientId}`);
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: WSClient, data: any): void {
    try {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(data));
      }
    } catch (error) {
      logError('Error sending message to client', error as Error);
    }
  }

  /**
   * Create progress tracker for an execution
   */
  public createProgressTracker(
    executionId: string,
    agentId: string,
    userId: string,
    estimatedDuration?: number
  ): ProgressTracker {
    const steps =
      AGENT_PROGRESS_STEPS[agentId] ||
      AGENT_PROGRESS_STEPS['image-generation'] ||
      [];
    const tracker = new ProgressTracker(
      executionId,
      agentId,
      userId,
      steps,
      estimatedDuration
    );

    this.activeExecutions.set(executionId, tracker);

    // Send initial progress update
    this.broadcastProgress(
      tracker.getProgressUpdate(ProgressLevel.USER_FRIENDLY)
    );

    return tracker;
  }

  /**
   * Remove progress tracker
   */
  public removeProgressTracker(executionId: string): void {
    this.activeExecutions.delete(executionId);
  }

  /**
   * Broadcast progress update to relevant clients
   */
  public broadcastProgress(update: ProgressUpdate): void {
    const relevantClients = Array.from(this.clients.values()).filter(
      (client) =>
        client.userId === this.getExecutionUserId(update.executionId) &&
        (!client.executionId || client.executionId === update.executionId)
    );

    relevantClients.forEach((client) => {
      const clientUpdate = {
        ...update,
        level: client.level,
        message: this.getMessageForLevel(update, client.level),
      };

      this.sendToClient(client, {
        type: 'progress',
        ...clientUpdate,
      });
    });

    // Store progress in Redis for persistence
    this.storeProgress(update);
  }

  /**
   * Get message appropriate for progress level
   */
  private getMessageForLevel(
    update: ProgressUpdate,
    level: ProgressLevel
  ): string {
    const tracker = this.activeExecutions.get(update.executionId);
    if (!tracker) return update.message;

    const currentStep = tracker.getCurrentStep();
    if (!currentStep) return update.message;

    switch (level) {
      case ProgressLevel.USER_FRIENDLY:
        return currentStep.userFriendly;
      case ProgressLevel.DETAILED:
        return currentStep.detailed;
      case ProgressLevel.DEBUG:
        return currentStep.debug;
      default:
        return update.message;
    }
  }

  /**
   * Get user ID for an execution
   */
  private getExecutionUserId(executionId: string): string {
    const tracker = this.activeExecutions.get(executionId);
    return tracker?.userId || '';
  }

  /**
   * Store progress update in Redis
   */
  private async storeProgress(update: ProgressUpdate): Promise<void> {
    try {
      const key = RedisKeys.agentProgress(update.executionId);
      await RedisUtils.setWithExpiry(key, update, 3600); // 1 hour
    } catch (error) {
      logError('Failed to store progress update', error as Error);
    }
  }

  /**
   * Cancel execution
   */
  private async cancelExecution(executionId: string): Promise<void> {
    try {
      const tracker = this.activeExecutions.get(executionId);
      if (tracker) {
        tracker.cancel();
        logInfo(`Execution cancelled: ${executionId}`);

        // Notify clients
        this.broadcastProgress({
          executionId,
          level: ProgressLevel.USER_FRIENDLY,
          step: 'cancelled',
          message: 'Vorgang abgebrochen',
          progress: 0,
          estimatedTimeLeft: 0,
          cancelable: false,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      logError('Error cancelling execution', error as Error);
    }
  }

  /**
   * Cleanup inactive connections
   */
  private cleanupConnections(): void {
    const now = Date.now();
    const timeout = 60000; // 1 minute

    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastPing > timeout) {
        logInfo(`Cleaning up inactive client: ${clientId}`);
        client.ws.terminate();
        this.clients.delete(clientId);
      }
    }
  }

  /**
   * Get server status
   */
  public getStatus(): {
    isRunning: boolean;
    clientCount: number;
    activeExecutions: number;
    port?: number;
  } {
    return {
      isRunning: this.wss !== null,
      clientCount: this.clients.size,
      activeExecutions: this.activeExecutions.size,
      port: 3004,
    };
  }

  /**
   * Shutdown the service
   */
  public shutdown(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.clients.clear();
    this.activeExecutions.clear();
    logInfo('Progress streaming service shut down');
  }
}

/**
 * Progress Tracker for individual executions
 */
export class ProgressTracker {
  private currentStepIndex: number = 0;
  private startTime: number = Date.now();
  private cancelled: boolean = false;

  constructor(
    public readonly executionId: string,
    public readonly agentId: string,
    public readonly userId: string,
    private readonly steps: ProgressStep[],
    private readonly estimatedDuration?: number
  ) {}

  /**
   * Move to next step
   */
  public nextStep(): void {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
    }
  }

  /**
   * Set specific step by ID
   */
  public setStep(stepId: string): void {
    const index = this.steps.findIndex((step) => step.id === stepId);
    if (index !== -1) {
      this.currentStepIndex = index;
    }
  }

  /**
   * Get current step
   */
  public getCurrentStep(): ProgressStep | null {
    return this.steps[this.currentStepIndex] || null;
  }

  /**
   * Calculate current progress percentage
   */
  public getProgress(): number {
    if (this.steps.length === 0) return 0;

    const completedWeight = this.steps
      .slice(0, this.currentStepIndex)
      .reduce((sum, step) => sum + step.weight, 0);

    const totalWeight = this.steps.reduce((sum, step) => sum + step.weight, 0);

    return Math.min(100, Math.round((completedWeight / totalWeight) * 100));
  }

  /**
   * Estimate time remaining
   */
  public getEstimatedTimeLeft(): number | undefined {
    if (!this.estimatedDuration) return undefined;

    const elapsed = (Date.now() - this.startTime) / 1000;
    const progress = this.getProgress();

    if (progress === 0) return this.estimatedDuration;

    const estimated = (elapsed / progress) * 100;
    return Math.max(0, Math.round(estimated - elapsed));
  }

  /**
   * Mark as cancelled
   */
  public cancel(): void {
    this.cancelled = true;
  }

  /**
   * Check if cancelled
   */
  public isCancelled(): boolean {
    return this.cancelled;
  }

  /**
   * Get progress update for specific level
   */
  public getProgressUpdate(level: ProgressLevel): ProgressUpdate {
    const currentStep = this.getCurrentStep();

    return {
      executionId: this.executionId,
      level,
      step: currentStep?.id || 'unknown',
      message: currentStep
        ? this.getMessageForLevel(currentStep, level)
        : 'Processing...',
      progress: this.getProgress(),
      estimatedTimeLeft: this.getEstimatedTimeLeft(),
      cancelable:
        !this.cancelled && this.currentStepIndex < this.steps.length - 1,
      timestamp: Date.now(),
    };
  }

  /**
   * Get message for specific level
   */
  private getMessageForLevel(step: ProgressStep, level: ProgressLevel): string {
    switch (level) {
      case ProgressLevel.USER_FRIENDLY:
        return step.userFriendly;
      case ProgressLevel.DETAILED:
        return step.detailed;
      case ProgressLevel.DEBUG:
        return step.debug;
      default:
        return step.userFriendly;
    }
  }
}

/**
 * Export singleton instance
 */
export const progressStreamingService = ProgressStreamingService.getInstance();
