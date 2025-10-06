/**
 * Simplified LangGraph Agent Service - Minimal working implementation
 * Provides basic agent execution without complex LangGraph workflow for now
 */

import {
  IAgent,
  AgentParams,
  AgentResult,
  agentRegistry
} from './agentService';
import { logInfo, logError, logWarn } from '../config/logger';
import { InstantDBService } from './instantdbService';
import { GeneratedArtifact } from '../schemas/instantdb';

/**
 * Basic workflow state interface
 */
export interface AgentWorkflowState {
  executionId: string;
  userId: string;
  agentId: string;
  sessionId: string | undefined;
  params: AgentParams;
  result: AgentResult | undefined;
  error: string | undefined;
  retryCount: number;
  currentStep: string;
  progress: number;
  startTime: number;
  metadata: Record<string, any>;
  cancelled: boolean;
}

/**
 * Basic Agent interface (simplified for now)
 */
export interface ILangGraphAgent extends IAgent {
  // For now, just extend the basic agent interface
  // We can add LangGraph-specific methods later when we have a working version
}

/**
 * Simplified LangGraph Agent Service
 */
export class LangGraphAgentService {
  private static instance: LangGraphAgentService;
  private inMemoryExecutions: Map<string, any> = new Map(); // Temporary in-memory storage
  private bypassInstantDB: boolean = true; // Temporary workaround flag

  private constructor() {
    // Private constructor for singleton
    logInfo('LangGraphAgentService initialized with InstantDB bypass mode');
  }

  public static getInstance(): LangGraphAgentService {
    if (!LangGraphAgentService.instance) {
      LangGraphAgentService.instance = new LangGraphAgentService();
    }
    return LangGraphAgentService.instance;
  }

  /**
   * Initialize service (simplified)
   */
  public async initialize(): Promise<void> {
    try {
      logInfo('LangGraph Agent Service initialized (simplified mode)');
    } catch (error) {
      logError('Failed to initialize LangGraph Agent Service', error as Error);
      throw error;
    }
  }

  /**
   * Execute agent with basic workflow (simplified implementation)
   */
  public async executeAgentWithWorkflow(
    agentId: string,
    params: AgentParams,
    userId: string,
    sessionId?: string
  ): Promise<AgentResult> {
    const executionId = crypto.randomUUID();

    try {
      logInfo(`Starting agent execution: ${agentId} for user ${userId}`);

      // Get agent
      const agent = agentRegistry.getAgent(agentId);
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

      // Create execution record
      const executionRecord = await this.createExecutionRecord(agent, params, userId, executionId);
      if (!executionRecord) {
        throw new Error('Failed to create execution record');
      }

      // Validate parameters
      if (!agent.validateParams(params)) {
        await this.updateExecutionStatus(executionId, 'failed', 'Invalid parameters');
        throw new Error('Invalid parameters provided');
      }

      // Check user limits
      const canExecute = await agent.canExecute(userId);
      if (!canExecute) {
        await this.updateExecutionStatus(executionId, 'failed', 'User limit exceeded');
        throw new Error('User limit exceeded for this agent');
      }

      // Execute agent directly (simplified - no complex workflow for now)
      const result = await agent.execute(params, userId, sessionId);

      // Update execution record
      if (result.success) {
        await this.updateExecutionStatus(executionId, 'completed', undefined, {
          output_data: result.data || {},
          cost: result.cost || 0
        });

        // Store artifacts if any
        if (result.artifacts && result.artifacts.length > 0) {
          await this.storeArtifacts(result.artifacts, userId, sessionId);
        }
      } else {
        await this.updateExecutionStatus(executionId, 'failed', result.error);
      }

      // ✅ FIX: Include executionId in metadata so frontend can track progress
      return {
        ...result,
        metadata: {
          ...result.metadata,
          executionId
        }
      };

    } catch (error) {
      logError(`Agent execution failed: ${agentId}`, error as Error);
      await this.updateExecutionStatus(executionId, 'failed', (error as Error).message);

      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Create execution record (with InstantDB bypass option)
   */
  private async createExecutionRecord(
    agent: IAgent,
    params: AgentParams,
    userId: string,
    executionId: string
  ): Promise<boolean> {
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
      return true;
    }

    try {
      const db = InstantDBService.getDB();
      if (!db) {
        logInfo('InstantDB not available, using in-memory fallback');
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

      return true;
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
  ): boolean {
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
    return true;
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
        logInfo('InstantDB not available for status update');
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
   * Store artifacts (with InstantDB bypass)
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
        logInfo('InstantDB not available for artifact storage');
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

  /**
   * Get execution status and progress (with InstantDB bypass)
   */
  public async getExecutionStatus(executionId: string): Promise<{
    status: string;
    progress: number;
    error?: string;
    result?: any;
  } | null> {
    if (this.bypassInstantDB || this.inMemoryExecutions.has(executionId)) {
      const execution = this.inMemoryExecutions.get(executionId);
      if (execution) {
        return {
          status: execution.status,
          progress: execution.progress || 0,
          error: execution.error_message,
          result: execution.output_data
        };
      }
      return null;
    }

    try {
      const db = InstantDBService.getDB();
      if (!db) {
        logInfo('InstantDB not available for execution status retrieval');
        return null;
      }

      const query = await db.query({
        agent_executions: {
          $: {
            where: { id: executionId }
          }
        }
      });

      const execution = query.agent_executions?.[0];
      if (!execution) {
        return null;
      }

      return {
        status: execution.status,
        progress: execution.progress || 0,
        error: execution.error_message,
        result: execution.output_data
      };
    } catch (error) {
      logError('Failed to get execution status', error as Error);
      return null;
    }
  }

  /**
   * Cancel execution
   */
  public async cancelExecution(executionId: string): Promise<boolean> {
    try {
      await this.updateExecutionStatus(executionId, 'failed', 'Cancelled by user');
      logInfo(`Execution cancelled: ${executionId}`);
      return true;
    } catch (error) {
      logError('Failed to cancel execution', error as Error);
      return false;
    }
  }
}

/**
 * Export singleton instance
 */
export const langGraphAgentService = LangGraphAgentService.getInstance();