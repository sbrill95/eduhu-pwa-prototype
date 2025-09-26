import { Router, Request, Response } from 'express';
import { ChatService } from '../services/chatService';
import { chatLimiter } from '../middleware/rateLimiter';
import {
  chatValidationRules,
  handleValidationErrors,
  validateRequestSize,
  validateApiKey,
} from '../middleware/validation';
import { ChatRequest, ChatErrorResponse } from '../types';
import { logDebug, logError } from '../config/logger';
import { isDevelopment } from '../config';

const router = Router();

/**
 * POST /chat - Create a chat completion
 *
 * This endpoint handles chat completion requests using OpenAI API.
 * It includes rate limiting, request validation, and comprehensive error handling.
 *
 * @route POST /api/chat
 * @param {ChatRequest} req.body - The chat request object
 * @returns {ChatResponse | ChatErrorResponse} - Chat completion response or error
 *
 * Rate Limiting: 30 requests per 15 minutes per IP
 * Request Size Limit: 10MB
 *
 * Example Request:
 * {
 *   "messages": [
 *     { "role": "user", "content": "Help me create a lesson plan for 5th grade math" }
 *   ],
 *   "model": "gpt-4o-mini",
 *   "temperature": 0.7,
 *   "max_tokens": 1000
 * }
 */
router.post(
  '/chat',
  // Apply middleware in order
  chatLimiter, // Rate limiting
  validateRequestSize, // Request size validation
  validateApiKey, // API key validation
  chatValidationRules, // Input validation rules
  handleValidationErrors, // Handle validation errors
  async (req: Request, res: Response): Promise<void> => {
    try {
      const chatRequest: ChatRequest = req.body;

      // Log request in development mode
      if (isDevelopment) {
        logDebug('Chat request received', {
          messageCount: chatRequest.messages.length,
          messages: chatRequest.messages,
          model: chatRequest.model,
          temperature: chatRequest.temperature,
          max_tokens: chatRequest.max_tokens,
        });
      }

      // Process chat completion
      const response = await ChatService.createChatCompletion(chatRequest);

      // Set appropriate status code
      const statusCode = response.success
        ? 200
        : response.error_type === 'validation'
          ? 400
          : response.error_type === 'rate_limit'
            ? 429
            : response.error_type === 'openai_api'
              ? 502
              : 500;

      res.status(statusCode).json(response);
    } catch (error) {
      logError('Chat endpoint error', error as Error, { body: req.body });

      const errorResponse: ChatErrorResponse = {
        success: false,
        error:
          'An unexpected error occurred while processing your chat request',
        error_type: 'server_error',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  }
);

/**
 * GET /chat/models - Get available OpenAI models
 *
 * Returns a list of available OpenAI models that can be used for chat completions.
 *
 * @route GET /api/chat/models
 * @returns {Object} - List of available models with descriptions
 */
router.get('/chat/models', (req: Request, res: Response) => {
  const models = {
    success: true,
    data: {
      models: [
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          description:
            'Fast and cost-effective model, great for most teacher assistant tasks',
          max_tokens: 4096,
          recommended: true,
        },
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          description:
            'Most capable model, best for complex educational content creation',
          max_tokens: 4096,
          recommended: false,
        },
        {
          id: 'gpt-4',
          name: 'GPT-4',
          description: 'High-quality model for detailed educational planning',
          max_tokens: 4096,
          recommended: false,
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'Fast and efficient for simple tasks',
          max_tokens: 4096,
          recommended: false,
        },
      ],
      default_model: 'gpt-4o-mini',
    },
    timestamp: new Date().toISOString(),
  };

  res.json(models);
});

/**
 * GET /chat/health - Health check for chat service
 *
 * Tests the chat service connectivity and OpenAI API availability.
 *
 * @route GET /api/chat/health
 * @returns {Object} - Health status of chat service
 */
router.get('/chat/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await ChatService.testService();

    const healthResponse = {
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        openai_connection: isHealthy,
        service_available: true,
      },
      timestamp: new Date().toISOString(),
    };

    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json(healthResponse);
  } catch (error) {
    logError('Chat health check error', error as Error);

    const errorResponse = {
      success: false,
      error: 'Chat service health check failed',
      data: {
        status: 'unhealthy',
        openai_connection: false,
        service_available: false,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(503).json(errorResponse);
  }
});

export default router;
