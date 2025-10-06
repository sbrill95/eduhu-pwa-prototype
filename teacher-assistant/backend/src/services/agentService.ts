/**
 * Agent Service - Core framework for the agentic workflow system
 * Handles agent registration, execution, and lifecycle management
 */

import { InstantDBService } from './instantdbService';
import { logInfo, logError, logWarn } from '../config/logger';
import { GeneratedArtifact, UserUsage, AgentExecution } from '../schemas/instantdb';

/**
 * Standard interface that all agents must implement
 */
export interface IAgent {
  id: string;
  name: string;
  description: string;
  type: string;
  triggers: string[];
  enabled: boolean;
  config: Record<string, any>;

  /**
   * Execute the agent with given parameters
   * @param params - Input parameters for agent execution
   * @param userId - ID of the user requesting execution
   * @param sessionId - Optional chat session ID for context
   * @returns Promise with agent execution result
   */
  execute(params: AgentParams, userId: string, sessionId?: string): Promise<AgentResult>;

  /**
   * Validate input parameters before execution
   * @param params - Parameters to validate
   * @returns true if valid, false otherwise
   */
  validateParams(params: any): boolean;

  /**
   * Estimate cost for execution (in USD cents)
   * @param params - Input parameters
   * @returns Estimated cost in cents
   */
  estimateCost(params: AgentParams): number;

  /**
   * Check if user can execute this agent (quota, limits, etc.)
   * @param userId - User ID to check
   * @returns Promise<boolean> indicating if execution is allowed
   */
  canExecute(userId: string): Promise<boolean>;
}

/**
 * Parameters passed to agent execution
 */
export interface AgentParams {
  prompt: string;
  [key: string]: any;
}

/**
 * Result returned from agent execution
 */
export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  cost?: number; // In USD cents
  metadata?: Record<string, any>;
  artifacts?: GeneratedArtifact[];
}

/**
 * Agent execution progress callback
 */
export type ProgressCallback = (status: string, progress?: number) => void;

/**
 * Agent Registry - Manages all available agents
 */
export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, IAgent> = new Map();

  private constructor() {}

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register a new agent
   */
  public register(agent: IAgent): void {
    if (this.agents.has(agent.id)) {
      logError(`Agent with ID ${agent.id} is already registered`, new Error('Duplicate agent ID'));
      return;
    }

    this.agents.set(agent.id, agent);
    logInfo(`Agent registered: ${agent.id} (${agent.name})`);
  }

  /**
   * Get an agent by ID
   */
  public getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all available agents
   */
  public getAllAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get enabled agents only
   */
  public getEnabledAgents(): IAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.enabled);
  }

  /**
   * Find agents by trigger keywords
   */
  public findAgentsByTrigger(text: string): IAgent[] {
    const lowerText = text.toLowerCase();
    return this.getEnabledAgents().filter(agent =>
      agent.triggers.some(trigger => lowerText.includes(trigger.toLowerCase()))
    );
  }

  /**
   * Unregister an agent
   */
  public unregister(agentId: string): boolean {
    const removed = this.agents.delete(agentId);
    if (removed) {
      logInfo(`Agent unregistered: ${agentId}`);
    }
    return removed;
  }
}

/**
 * Agent Execution Service - Handles agent execution with tracking
 */
export class AgentExecutionService {
  private static instance: AgentExecutionService;
  private registry: AgentRegistry;
  private inMemoryExecutions: Map<string, any> = new Map(); // Temporary in-memory storage
  private bypassInstantDB: boolean = true; // Temporary workaround flag

  private constructor() {
    this.registry = AgentRegistry.getInstance();
    logInfo('AgentExecutionService initialized with InstantDB bypass mode');
  }

  public static getInstance(): AgentExecutionService {
    if (!AgentExecutionService.instance) {
      AgentExecutionService.instance = new AgentExecutionService();
    }
    return AgentExecutionService.instance;
  }

  /**
   * Execute an agent with full tracking and error handling
   */
  public async executeAgent(
    agentId: string,
    params: AgentParams,
    userId: string,
    sessionId?: string,
    progressCallback?: ProgressCallback
  ): Promise<AgentResult> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      return {
        success: false,
        error: `Agent not found: ${agentId}`
      };
    }

    if (!agent.enabled) {
      return {
        success: false,
        error: `Agent is disabled: ${agentId}`
      };
    }

    // Create execution record (with InstantDB bypass)
    const executionId = await this.createExecutionRecord(agent, params, userId);
    if (!executionId) {
      return {
        success: false,
        error: 'Failed to create execution record'
      };
    }

    try {
      // Update progress
      progressCallback?.('Validating parameters...', 10);
      await this.updateExecutionStatus(executionId, 'in_progress');

      // Validate parameters
      if (!agent.validateParams(params)) {
        await this.updateExecutionStatus(executionId, 'failed', 'Invalid parameters');
        return {
          success: false,
          error: 'Invalid parameters provided'
        };
      }

      // Check user limits
      progressCallback?.('Checking user limits...', 20);
      const canExecute = await agent.canExecute(userId);
      if (!canExecute) {
        await this.updateExecutionStatus(executionId, 'failed', 'User limit exceeded');
        return {
          success: false,
          error: 'User limit exceeded for this agent'
        };
      }

      // Execute agent
      progressCallback?.('Executing agent...', 30);
      const startTime = Date.now();
      const result = await agent.execute(params, userId, sessionId);
      const processingTime = Date.now() - startTime;

      // Update execution record with results
      if (result.success) {
        await this.updateExecutionStatus(executionId, 'completed', undefined, {
          output_data: result.data || {},
          processing_time: processingTime,
          cost: result.cost || 0
        });

        // Update user usage
        if (result.cost && result.cost > 0) {
          await this.updateUserUsage(userId, agentId, result.cost);
        }

        // Store artifacts if any
        if (result.artifacts && result.artifacts.length > 0) {
          progressCallback?.('Storing artifacts...', 90);
          await this.storeArtifacts(result.artifacts, userId, sessionId);
        }

        progressCallback?.('Completed successfully', 100);
      } else {
        await this.updateExecutionStatus(executionId, 'failed', result.error);
      }

      return result;

    } catch (error) {
      logError(`Agent execution failed: ${agentId}`, error as Error);
      await this.updateExecutionStatus(executionId, 'failed', (error as Error).message);

      return {
        success: false,
        error: `Execution failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get user's usage for an agent in current month (with InstantDB bypass)
   */
  public async getUserUsage(userId: string, agentId: string): Promise<UserUsage | null> {
    if (this.bypassInstantDB) {
      // For bypass mode, return minimal usage to allow execution
      logInfo(`Bypassing usage check for user ${userId} and agent ${agentId}`);
      return {
        id: crypto.randomUUID(),
        user_id: userId,
        agent_id: agentId,
        month: new Date().toISOString().slice(0, 7),
        usage_count: 0, // Allow execution
        total_cost: 0,
        last_used: Date.now(),
        created_at: Date.now(),
        updated_at: Date.now(),
        user: {} as any,
        agent: {} as any
      };
    }

    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // "2024-09"

      const db = InstantDBService.getDB();
      if (!db) {
        logWarn('InstantDB not available for usage check, allowing execution');
        return null; // Allows execution when InstantDB is unavailable
      }

      const query = await db.query({
        user_usage: {
          $: {
            where: {
              user_id: userId,
              agent_id: agentId,
              month: currentMonth
            }
          }
        }
      });

      return query.user_usage?.[0] || null;
    } catch (error) {
      logError('Failed to get user usage', error as Error);
      return null;
    }
  }

  /**
   * Get user's artifacts for an agent (with InstantDB bypass)
   */
  public async getUserArtifacts(userId: string, agentId?: string): Promise<GeneratedArtifact[]> {
    if (this.bypassInstantDB) {
      logInfo(`Bypassing artifact retrieval for user ${userId}`);
      return [];
    }

    try {
      const db = InstantDBService.getDB();
      if (!db) {
        logWarn('InstantDB not available for artifact retrieval');
        return [];
      }

      const whereClause: any = { user_id: userId };
      if (agentId) {
        whereClause.agent_id = agentId;
      }

      const query = await db.query({
        generated_artifacts: {
          $: {
            where: whereClause,
            order: { created_at: 'desc' }
          }
        }
      });

      return query.generated_artifacts || [];
    } catch (error) {
      logError('Failed to get user artifacts', error as Error);
      return [];
    }
  }

  /**
   * Create execution record in database (with InstantDB bypass option)
   */
  private async createExecutionRecord(
    agent: IAgent,
    params: AgentParams,
    userId: string
  ): Promise<string | null> {
    const executionId = crypto.randomUUID();

    if (this.bypassInstantDB) {
      // Temporary in-memory storage for executions
      const executionData = {
        id: executionId,
        agent_id: agent.id,
        status: 'pending',
        input_params: JSON.stringify(params),
        started_at: Date.now(),
        user_id: userId,
        agent_name: agent.name
      };

      this.inMemoryExecutions.set(executionId, executionData);
      logInfo(`Created in-memory execution record: ${executionId} for agent ${agent.id}`);
      return executionId;
    }

    try {
      const db = InstantDBService.getDB();
      if (!db) {
        logWarn('InstantDB not available, falling back to in-memory storage');
        return this.createInMemoryExecution(executionId, agent, params, userId);
      }

      const executionData = {
        id: executionId,
        agent_id: agent.id,
        status: 'pending',
        input_params: JSON.stringify(params),
        started_at: Date.now(),
        user: userId,
        agent: agent.id
      };

      await db.transact([
        db.tx.agent_executions[executionId].update(executionData)
      ]);

      return executionId;
    } catch (error) {
      logError('Failed to create execution record in InstantDB, using in-memory fallback', error as Error);
      return this.createInMemoryExecution(executionId, agent, params, userId);
    }
  }

  /**
   * Create in-memory execution fallback
   */
  private createInMemoryExecution(
    executionId: string,
    agent: IAgent,
    params: AgentParams,
    userId: string
  ): string {
    const executionData = {
      id: executionId,
      agent_id: agent.id,
      status: 'pending',
      input_params: JSON.stringify(params),
      started_at: Date.now(),
      user_id: userId,
      agent_name: agent.name
    };

    this.inMemoryExecutions.set(executionId, executionData);
    logInfo(`Created in-memory execution record: ${executionId} for agent ${agent.id}`);
    return executionId;
  }

  /**
   * Update execution status (with InstantDB bypass option)
   */
  private async updateExecutionStatus(
    executionId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    errorMessage?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    if (this.bypassInstantDB || this.inMemoryExecutions.has(executionId)) {
      // Update in-memory execution
      const execution = this.inMemoryExecutions.get(executionId);
      if (execution) {
        const updateData = {
          ...execution,
          status,
          updated_at: Date.now(),
          ...(errorMessage && { error_message: errorMessage }),
          ...(status === 'completed' && { completed_at: Date.now() }),
          ...additionalData
        };
        this.inMemoryExecutions.set(executionId, updateData);
        logInfo(`Updated in-memory execution ${executionId} status to: ${status}`);
      }
      return;
    }

    try {
      const db = InstantDBService.getDB();
      if (!db) {
        logWarn('InstantDB not available for status update');
        return;
      }

      const updateData: any = {
        status,
        updated_at: Date.now(),
        ...(errorMessage && { error_message: errorMessage }),
        ...(status === 'completed' && { completed_at: Date.now() }),
        ...additionalData
      };

      await db.transact([
        db.tx.agent_executions[executionId].update(updateData)
      ]);
    } catch (error) {
      logError('Failed to update execution status', error as Error);
    }
  }

  /**
   * Update user usage tracking (with InstantDB bypass)
   */
  private async updateUserUsage(userId: string, agentId: string, cost: number): Promise<void> {
    if (this.bypassInstantDB) {
      logInfo(`Bypassing usage tracking for user ${userId}, agent ${agentId}, cost ${cost} cents`);
      return;
    }

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const existingUsage = await this.getUserUsage(userId, agentId);

      const db = InstantDBService.getDB();
      if (!db) {
        logWarn('InstantDB not available for usage tracking');
        return;
      }

      if (existingUsage && existingUsage.id) {
        // Update existing usage record
        await db.transact([
          db.tx.user_usage[existingUsage.id].update({
            usage_count: existingUsage.usage_count + 1,
            total_cost: existingUsage.total_cost + cost,
            last_used: Date.now(),
            updated_at: Date.now()
          })
        ]);
      } else {
        // Create new usage record
        const usageData = {
          user_id: userId,
          agent_id: agentId,
          month: currentMonth,
          usage_count: 1,
          total_cost: cost,
          last_used: Date.now(),
          created_at: Date.now(),
          updated_at: Date.now(),
          user: userId,
          agent: agentId
        };

        await db.transact([
          db.tx.user_usage[crypto.randomUUID()].update(usageData)
        ]);
      }
    } catch (error) {
      logError('Failed to update user usage', error as Error);
    }
  }

  /**
   * Store generated artifacts (with InstantDB bypass)
   */
  private async storeArtifacts(
    artifacts: GeneratedArtifact[],
    userId: string,
    sessionId?: string
  ): Promise<void> {
    if (this.bypassInstantDB) {
      logInfo(`Bypassing artifact storage for ${artifacts.length} artifacts`);
      artifacts.forEach(artifact => {
        logInfo(`Generated artifact: ${artifact.title} (${artifact.type})`);
      });
      return;
    }

    try {
      const db = InstantDBService.getDB();
      if (!db) {
        logWarn('InstantDB not available for artifact storage');
        return;
      }

      const transactions = artifacts.map(artifact => {
        const artifactData = {
          ...artifact,
          creator: userId,
          ...(sessionId && { session: sessionId })
        };

        return db.tx.generated_artifacts[artifact.id || crypto.randomUUID()].update(artifactData);
      });

      await db.transact(transactions);
    } catch (error) {
      logError('Failed to store artifacts', error as Error);
    }
  }
}

/**
 * Export singleton instances
 */
export const agentRegistry = AgentRegistry.getInstance();
export const agentExecutionService = AgentExecutionService.getInstance();