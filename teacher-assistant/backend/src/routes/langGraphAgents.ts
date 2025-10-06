/**
 * LangGraph Agent Routes - Enhanced API endpoints for the LangGraph agentic workflow system
 * Handles agent execution with workflow management, progress streaming, and comprehensive error handling
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { z } from 'zod';
import { agentRegistry } from '../services/agentService';
import { langGraphAgentService } from '../services/langGraphAgentService';
import { langGraphImageGenerationAgent } from '../agents/langGraphImageGenerationAgent';
import { ProgressLevel, progressStreamingService } from '../services/progressStreamingService';
import { checkRedisHealth } from '../config/redis';
import { ApiResponse } from '../types';
import { logInfo, logError } from '../config/logger';

/**
 * Zod Validation Schemas for Agent Execution
 */

// Gemini Image Generation Form Data Schema (Phase 3.2 - CORRECT)
const ImageGenerationFormSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters').max(500, 'Description too long'),
  imageStyle: z.enum(['realistic', 'cartoon', 'illustrative', 'abstract']),
  // Optional legacy fields for backward compatibility
  prompt: z.string().optional(), // Will be set from description if missing
});

// Legacy params format
const LegacyParamsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  size: z.enum(['1024x1024', '1024x1792', '1792x1024']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  style: z.enum(['vivid', 'natural']).optional(),
  enhancePrompt: z.boolean().optional(),
  educationalContext: z.string().max(200).optional(),
  targetAgeGroup: z.string().max(50).optional(),
  subject: z.string().max(100).optional(),
});

// Agent Execution Request Schema
const AgentExecutionRequestSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  input: z.union([
    z.string(), // Simple string input
    ImageGenerationFormSchema, // Gemini form
    LegacyParamsSchema // Legacy format
  ]).optional(),
  params: LegacyParamsSchema.optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  progressLevel: z.enum(['user_friendly', 'detailed', 'debug']).optional().default('user_friendly'),
  confirmExecution: z.boolean().optional().default(false),
});

type AgentExecutionRequest = z.infer<typeof AgentExecutionRequestSchema>;

const router = Router();

// Register LangGraph agents
agentRegistry.register(langGraphImageGenerationAgent);

/**
 * GET /api/langgraph-agents/status
 * Get LangGraph system status and health
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const redisHealth = await checkRedisHealth();
    const agentServiceStatus = { initialized: true };

    const response: ApiResponse = {
      success: true,
      data: {
        system: {
          langgraph_enabled: true,
          redis_status: redisHealth.status,
          redis_latency: redisHealth.latency,
          agent_service: agentServiceStatus
        },
        agents: {
          total: agentRegistry.getAllAgents().length,
          enabled: agentRegistry.getEnabledAgents().length,
          langgraph_compatible: agentRegistry.getEnabledAgents().filter(
            agent => 'createWorkflow' in agent
          ).length
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logError('Failed to get LangGraph system status', error as Error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve system status',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/langgraph-agents/execute
 * Execute an agent with LangGraph workflow and enhanced features
 *
 * Accepts both legacy format (params.prompt) and new Gemini form format (input object)
 */
router.post('/execute',
  [
    body('agentId').isString().notEmpty().withMessage('Agent ID is required'),
    // Accept both 'params' (legacy) and 'input' (new Gemini format)
    body('input').optional(),
    body('params').optional(),
    body('userId').optional().isString(),
    body('sessionId').optional().isString(),
    body('progressLevel').optional().isIn(['user_friendly', 'detailed', 'debug'])
      .withMessage('Invalid progress level'),
    body('confirmExecution').optional().isBoolean()
      .withMessage('Confirm execution must be boolean')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request with Zod
      const validationResult = AgentExecutionRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const response: ApiResponse = {
          success: false,
          error: 'Validierung fehlgeschlagen',
          details: errorMessages,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      const validatedData = validationResult.data;
      const {
        agentId,
        params: legacyParams,
        input,
        userId,
        sessionId,
        progressLevel = 'user_friendly',
        confirmExecution = false
      } = validatedData;

      // Support both legacy format (params.prompt) and new Gemini format (input object)
      let params: any;

      if (input) {
        // New Gemini format: input can be string or object
        if (typeof input === 'string') {
          params = { prompt: input };
        } else if (typeof input === 'object' && input !== null) {
          // Gemini form data with theme, learningGroup, etc.
          params = { ...input };

          const inputObj = input as Record<string, any>;

          // CRITICAL FIX: Support both 'theme' (worksheet) and 'description' (image generation)
          if (!('prompt' in inputObj)) {
            if ('description' in inputObj) {
              // Image generation form: description -> prompt
              params.prompt = inputObj.description;
              console.log('[langGraphAgents] Using description as prompt:', inputObj.description);
            } else if ('theme' in inputObj) {
              // Worksheet form: theme -> prompt
              params.prompt = inputObj.theme;
              console.log('[langGraphAgents] Using theme as prompt:', inputObj.theme);
            }
          }

          // Log Gemini form data for debugging
          if ('theme' in inputObj || 'description' in inputObj) {
            logInfo(`Received Gemini form data: ${JSON.stringify(inputObj)}`);
          }
        } else {
          const response: ApiResponse = {
            success: false,
            error: 'Input muss ein String oder Objekt sein',
            timestamp: new Date().toISOString()
          };
          res.status(400).json(response);
          return;
        }
      } else if (legacyParams) {
        // Legacy format
        params = legacyParams;
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Entweder "input" oder "params" ist erforderlich',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      // Ensure we have a prompt (either directly or from theme/description)
      if (!params.prompt || typeof params.prompt !== 'string' || params.prompt.trim().length === 0) {
        console.log('[langGraphAgents] ❌ Missing prompt. Received params:', params);
        const response: ApiResponse = {
          success: false,
          error: 'Prompt ist erforderlich (als String, input.prompt, input.description, input.theme oder params.prompt)',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      // Provide default userId if not provided (for testing/development)
      const effectiveUserId = userId || 'anonymous';

      logInfo(`LangGraph agent execution request: ${agentId} for user ${effectiveUserId}`);

      // Check if agent supports LangGraph
      const agent = agentRegistry.getAgent(agentId);
      if (!agent) {
        const response: ApiResponse = {
          success: false,
          error: `Agent not found: ${agentId}`,
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
      return;
      }

      const isLangGraphAgent = 'createWorkflow' in agent;
      if (!isLangGraphAgent) {
        const response: ApiResponse = {
          success: false,
          error: `Agent ${agentId} does not support LangGraph workflows`,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      // If not confirmed, return execution preview
      if (!confirmExecution) {
        const estimatedCost = agent.estimateCost(params);
        const canExecute = await agent.canExecute(effectiveUserId);

        const response: ApiResponse = {
          success: true,
          data: {
            execution_preview: {
              agent_id: agentId,
              agent_name: agent.name,
              agent_description: agent.description,
              estimated_cost: estimatedCost,
              can_execute: canExecute,
              requires_confirmation: true,
              progress_level: progressLevel,
              workflow_enabled: true
            }
          },
          timestamp: new Date().toISOString()
        };

        res.json(response);
        return; // Add return to prevent execution code from running
      }

      // Execute agent with LangGraph workflow
      const result = await langGraphAgentService.executeAgentWithWorkflow(
        agentId,
        params,
        effectiveUserId,
        sessionId
      );

      // TASK-004 & TASK-005: Save image to library_materials and create chat message (for image generation)
      let libraryId: string | undefined;
      let messageId: string | undefined;

      console.log('[langGraphAgents] Agent execution result:', {
        success: result.success,
        agentId,
        hasImageUrl: !!result.data?.image_url,
        imageUrl: result.data?.image_url?.substring(0, 60),
        hasTitle: !!result.data?.title,
        title: result.data?.title,
        sessionId,
        effectiveUserId
      });

      if (result.success && (agentId === 'image-generation' || agentId === 'langgraph-image-generation') && result.data?.image_url) {
        console.log('[langGraphAgents] ✅ SAVING TO LIBRARY - conditions met!');
        try {
          const { getInstantDB } = await import('../services/instantdbService');
          const db = getInstantDB();

          console.log('[langGraphAgents] InstantDB status:', {
            dbAvailable: !!db,
            dbType: db ? typeof db : 'undefined'
          });

          if (db) {
            const now = Date.now();
            const imageLibraryId = db.id();
            const imageChatMessageId = db.id();

            const titleToUse = result.data.title || result.data.dalle_title || 'AI-generiertes Bild';

            console.log('[langGraphAgents] Preparing to save image:', {
              libraryId: imageLibraryId,
              title: titleToUse,
              userId: effectiveUserId,
              imageUrlPreview: result.data.image_url.substring(0, 60),
              hasSessionId: !!sessionId
            });

            // TASK-004: Save image to library_materials with German title
            await db.transact([
              db.tx.library_materials[imageLibraryId].update({
                user_id: effectiveUserId,
                title: titleToUse,
                type: 'image',
                content: result.data.image_url,
                description: result.data.revised_prompt || params.prompt,
                tags: JSON.stringify([]),
                created_at: now,
                updated_at: now,
                is_favorite: false,
                usage_count: 0,
                source_session_id: sessionId || null
              })
            ]);

            libraryId = imageLibraryId;
            console.log('[langGraphAgents] ✅ Image saved to library_materials:', {
              libraryId,
              userId: effectiveUserId,
              title: titleToUse
            });
            logInfo(`Image saved to library_materials`, { libraryId, userId: effectiveUserId, title: titleToUse });

            // TASK-005: Create chat message with image (clean UI - no prompt/metadata)
            if (sessionId) {
              console.log('[langGraphAgents] Creating chat message with image:', {
                messageId: imageChatMessageId,
                sessionId,
                libraryId: imageLibraryId
              });

              await db.transact([
                db.tx.messages[imageChatMessageId].update({
                  content: `Ich habe ein Bild für dich erstellt.`,
                  role: 'assistant',
                  user_id: effectiveUserId,
                  session_id: sessionId,
                  message_index: 0, // Will be updated by frontend
                  created_at: now,
                  updated_at: now,
                  is_edited: false,
                  metadata: JSON.stringify({
                    type: 'image',
                    image_url: result.data.image_url,
                    library_id: imageLibraryId
                  })
                })
              ]);

              messageId = imageChatMessageId;
              console.log('[langGraphAgents] ✅ Chat message created:', {
                messageId,
                sessionId,
                libraryId
              });
              logInfo(`Image chat message created`, { messageId, sessionId, libraryId });
            } else {
              console.log('[langGraphAgents] ⚠️ No sessionId - skipping chat message creation');
            }
          } else {
            console.error('[langGraphAgents] ❌ InstantDB not available');
            logError('InstantDB not available for saving image to library', new Error('DB not initialized'));
          }
        } catch (error) {
          console.error('[langGraphAgents] ❌ Failed to save to library/message:', {
            error: (error as Error).message,
            stack: (error as Error).stack
          });
          logError('Failed to save image to library/message', error as Error);
          // Continue - don't fail the whole request if library save fails
        }
      }

      const statusCode = result.success ? 200 : 400;
      const response: ApiResponse = {
        success: result.success,
        data: result.success ? {
          ...result.data,
          library_id: libraryId, // NEW: Library ID for frontend
          message_id: messageId, // NEW: Message ID for frontend
          workflow_execution: true,
          progress_level: progressLevel
        } : undefined,
        error: result.success ? undefined : result.error,
        metadata: {
          ...result.metadata,
          langgraph_enabled: true,
          progress_streaming: true
        },
        timestamp: new Date().toISOString()
      };

      res.status(statusCode).json(response);

    } catch (error) {
      logError('LangGraph agent execution failed', error as Error);
      const response: ApiResponse = {
        success: false,
        error: 'Agent execution failed',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/langgraph-agents/image/generate
 * Enhanced image generation with LangGraph workflow
 */
router.post('/image/generate',
  [
    body('prompt').isString().notEmpty().withMessage('Prompt is required')
      .isLength({ max: 1000 }).withMessage('Prompt must be less than 1000 characters'),
    body('size').optional().isIn(['1024x1024', '1024x1792', '1792x1024'])
      .withMessage('Invalid size option'),
    body('quality').optional().isIn(['standard', 'hd'])
      .withMessage('Invalid quality option'),
    body('style').optional().isIn(['vivid', 'natural'])
      .withMessage('Invalid style option'),
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('sessionId').optional().isString(),
    body('enhancePrompt').optional().isBoolean(),
    body('educationalContext').optional().isString().isLength({ max: 200 }),
    body('targetAgeGroup').optional().isString().isLength({ max: 50 }),
    body('subject').optional().isString().isLength({ max: 100 }),
    body('progressLevel').optional().isIn(['user_friendly', 'detailed', 'debug']),
    body('confirmExecution').optional().isBoolean()
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      const {
        prompt,
        size,
        quality,
        style,
        userId,
        sessionId,
        enhancePrompt,
        educationalContext,
        targetAgeGroup,
        subject,
        progressLevel = 'user_friendly',
        confirmExecution = false
      } = req.body;

      // Prepare enhanced parameters for LangGraph image generation
      const params = {
        prompt,
        ...(size && { size }),
        ...(quality && { quality }),
        ...(style && { style }),
        ...(enhancePrompt !== undefined && { enhancePrompt }),
        ...(educationalContext && { educationalContext }),
        ...(targetAgeGroup && { targetAgeGroup }),
        ...(subject && { subject })
      };

      logInfo(`Enhanced image generation request for user ${userId}: "${prompt}"`);

      // If not confirmed, return execution preview
      if (!confirmExecution) {
        const agent = agentRegistry.getAgent('langgraph-image-generation');
        if (!agent) {
          const response: ApiResponse = {
            success: false,
            error: 'LangGraph image generation agent not found',
            timestamp: new Date().toISOString()
          };
          res.status(404).json(response);
      return;
        }

        const estimatedCost = agent.estimateCost(params);
        const canExecute = await agent.canExecute(userId);

        const response: ApiResponse = {
          success: true,
          data: {
            execution_preview: {
              agent_id: 'langgraph-image-generation',
              agent_name: agent.name,
              agent_description: agent.description,
              estimated_cost: estimatedCost,
              can_execute: canExecute,
              requires_confirmation: true,
              enhanced_features: {
                prompt_enhancement: enhancePrompt !== false,
                educational_optimization: !!(educationalContext || targetAgeGroup || subject),
                workflow_management: true,
                progress_streaming: true,
                error_recovery: true
              },
              progress_level: progressLevel
            }
          },
          timestamp: new Date().toISOString()
        };

        res.json(response);
        return;  // ✅ FIX: Add return to prevent execution code from running
      }

      // Execute enhanced image generation with LangGraph workflow
      const result = await langGraphAgentService.executeAgentWithWorkflow(
        'langgraph-image-generation',
        params,
        userId,
        sessionId
      );

      // TASK-004 & TASK-005: Save image to library_materials and create chat message
      let libraryId: string | undefined;
      let messageId: string | undefined;

      if (result.success && result.data?.image_url) {
        try {
          const { getInstantDB } = await import('../services/instantdbService');
          const db = getInstantDB();

          if (db) {
            const now = Date.now();
            const imageLibraryId = db.id();
            const imageChatMessageId = db.id();

            // TASK-004: Save image to library_materials with German title
            await db.transact([
              db.tx.library_materials[imageLibraryId].update({
                user_id: userId,
                title: result.data.title || result.data.dalle_title || 'AI-generiertes Bild',
                type: 'image',
                content: result.data.image_url,
                description: result.data.revised_prompt || params.prompt,
                tags: JSON.stringify([]),
                created_at: now,
                updated_at: now,
                is_favorite: false,
                usage_count: 0,
                source_session_id: sessionId || null
              })
            ]);

            libraryId = imageLibraryId;
            logInfo(`Image saved to library_materials`, { libraryId, userId, title: result.data.title });

            // TASK-005: Create chat message with image (clean UI - no prompt/metadata)
            if (sessionId) {
              await db.transact([
                db.tx.messages[imageChatMessageId].update({
                  content: `Ich habe ein Bild für dich erstellt.`,
                  role: 'assistant',
                  user_id: userId,
                  session_id: sessionId,
                  message_index: 0, // Will be updated by frontend
                  created_at: now,
                  updated_at: now,
                  is_edited: false,
                  metadata: JSON.stringify({
                    type: 'image',
                    image_url: result.data.image_url,
                    library_id: imageLibraryId
                  })
                })
              ]);

              messageId = imageChatMessageId;
              logInfo(`Image chat message created`, { messageId, sessionId, libraryId });
            }
          } else {
            logError('InstantDB not available for saving image to library', new Error('DB not initialized'));
          }
        } catch (error) {
          logError('Failed to save image to library/message', error as Error);
          // Continue - don't fail the whole request if library save fails
        }
      }

      const statusCode = result.success ? 200 : 400;
      const response: ApiResponse = {
        success: result.success,
        data: result.success ? {
          executionId: result.metadata?.executionId,  // ✅ FIX: Include executionId for frontend tracking
          image_url: result.data?.image_url,
          revised_prompt: result.data?.revised_prompt,
          enhanced_prompt: result.data?.enhanced_prompt,
          title: result.data?.title, // German title from ChatGPT
          dalle_title: result.data?.dalle_title, // English fallback
          quality_score: result.data?.quality_score,
          educational_optimized: result.data?.educational_optimized,
          cost: result.cost,
          library_id: libraryId, // NEW: Library ID for frontend
          message_id: messageId, // NEW: Message ID for frontend
          metadata: {
            ...result.metadata,
            langgraph_workflow: true,
            educational_context: educationalContext,
            target_age_group: targetAgeGroup,
            subject: subject
          }
        } : undefined,
        error: result.success ? undefined : result.error,
        timestamp: new Date().toISOString()
      };

      res.status(statusCode).json(response);

    } catch (error) {
      logError('Enhanced image generation failed', error as Error);
      const response: ApiResponse = {
        success: false,
        error: 'Enhanced image generation failed',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/langgraph-agents/execution/:executionId/status
 * Get execution status and progress
 */
router.get('/execution/:executionId/status',
  [
    param('executionId').isString().notEmpty().withMessage('Execution ID is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      const { executionId } = req.params;

      // Additional validation for executionId parameter
      if (!executionId) {
        const response: ApiResponse = {
          success: false,
          error: 'Execution ID is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      const executionStatus = await langGraphAgentService.getExecutionStatus(executionId);

      if (!executionStatus) {
        const response: ApiResponse = {
          success: false,
          error: 'Execution not found',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
      return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          execution_id: executionId,
          ...executionStatus,
          langgraph_managed: true
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      logError('Failed to get execution status', error as Error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to retrieve execution status',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/langgraph-agents/execution/:executionId/cancel
 * Cancel an ongoing execution
 */
router.post('/execution/:executionId/cancel',
  [
    param('executionId').isString().notEmpty().withMessage('Execution ID is required'),
    body('userId').isString().notEmpty().withMessage('User ID is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      const { executionId } = req.params;
      const { userId } = req.body;

      // Additional validation for executionId parameter
      if (!executionId) {
        const response: ApiResponse = {
          success: false,
          error: 'Execution ID is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      logInfo(`Cancellation request for execution ${executionId} by user ${userId}`);

      const cancelled = await langGraphAgentService.cancelExecution(executionId);

      if (!cancelled) {
        const response: ApiResponse = {
          success: false,
          error: 'Failed to cancel execution',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          execution_id: executionId,
          cancelled: true,
          cancelled_by: userId,
          cancelled_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      logError('Failed to cancel execution', error as Error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to cancel execution',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/langgraph-agents/progress/websocket-info
 * Get WebSocket connection information for progress streaming
 */
router.get('/progress/websocket-info', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, executionId, level = 'user_friendly' } = req.query;

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    const wsUrl = new URL(`ws://localhost:${progressStreamingService.getWebSocketPort()}`);
    wsUrl.searchParams.set('userId', userId as string);
    wsUrl.searchParams.set('level', level as string);

    if (executionId) {
      wsUrl.searchParams.set('executionId', executionId as string);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        websocket_url: wsUrl.toString(),
        protocols: ['progress-streaming'],
        connection_info: {
          user_id: userId,
          progress_level: level,
          execution_id: executionId || null,
          auto_reconnect: true,
          heartbeat_interval: 30000
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    logError('Failed to get WebSocket info', error as Error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get WebSocket connection information',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/langgraph-agents/available
 * Get all available LangGraph agents with complete information
 */
router.get('/available', async (req: Request, res: Response): Promise<void> => {
  try {
    const allAgents = agentRegistry.getAllAgents();
    const langGraphAgents = allAgents.filter(agent => 'createWorkflow' in agent);

    const availableAgents = langGraphAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: agent.type,
      triggers: agent.triggers,
      isAvailable: agent.enabled,
      enabled: agent.enabled,
      config: {
        supports_workflows: true,
        supports_streaming: true,
        supports_checkpoints: true,
        cost_estimation: true
      },
      capabilities: {
        workflow_management: true,
        progress_tracking: true,
        state_persistence: true,
        error_recovery: true,
        real_time_updates: true
      },
      metadata: {
        langgraph_version: '0.4.9',
        last_updated: new Date().toISOString(),
        execution_count: 0 // Could be retrieved from usage stats
      }
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        agents: availableAgents,
        total_count: availableAgents.length,
        enabled_count: availableAgents.filter(agent => agent.enabled).length,
        system_info: {
          langgraph_enabled: true,
          redis_connected: true, // Should check redis health
          workflow_support: true,
          streaming_support: true
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logError('Failed to get available LangGraph agents', error as Error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve available agents',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/langgraph-agents/agents/langgraph-compatible
 * Get all LangGraph-compatible agents
 */
router.get('/agents/langgraph-compatible', async (req: Request, res: Response) => {
  try {
    const allAgents = agentRegistry.getEnabledAgents();
    const langGraphAgents = allAgents.filter(agent => 'createWorkflow' in agent);

    const agentSummaries = langGraphAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: agent.type,
      triggers: agent.triggers,
      enabled: agent.enabled,
      langgraph_features: {
        workflow_enabled: true,
        checkpoint_storage: true,
        progress_streaming: true,
        error_recovery: true,
        state_persistence: true
      }
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        agents: agentSummaries,
        total_count: agentSummaries.length,
        langgraph_system: {
          enabled: true,
          version: '0.4.9',
          features: [
            'State Management',
            'Redis Checkpointing',
            'Progress Streaming',
            'Error Recovery',
            'Workflow Orchestration'
          ]
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logError('Failed to get LangGraph-compatible agents', error as Error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve LangGraph agents',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

export default router;