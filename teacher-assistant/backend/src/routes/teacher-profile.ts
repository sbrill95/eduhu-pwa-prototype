import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { TeacherProfileService } from '../services/teacherProfileService';
import { chatLimiter } from '../middleware/rateLimiter';
import {
  KnowledgeExtractionRequest,
  KnowledgeExtractionResponse,
  ChatErrorResponse,
  ChatMessage,
} from '../types';
import { logInfo, logError } from '../config/logger';

const router = Router();

/**
 * Validation middleware for knowledge extraction requests
 */
const validateExtractionRequest = [
  body('messages')
    .isArray({ min: 1 })
    .withMessage(
      'Messages array is required and must contain at least one message'
    ),

  body('messages.*.role')
    .isIn(['system', 'user', 'assistant'])
    .withMessage(
      'Each message must have a valid role: system, user, or assistant'
    ),

  body('messages.*.content')
    .isString()
    .isLength({ min: 1, max: 10000 })
    .withMessage(
      'Each message content must be a non-empty string (max 10000 characters)'
    ),

  body('userId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('UserId must be a string (max 100 characters)'),

  body('conversationId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('ConversationId must be a string (max 100 characters)'),
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: () => void
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map(
        (error) =>
          `${error.msg} (field: ${error.type === 'field' ? error.path : 'unknown'})`
      )
      .join('; ');

    const response: ChatErrorResponse = {
      success: false,
      error: `Validation failed: ${errorMessages}`,
      error_type: 'validation',
      error_code: 'invalid_input',
      user_message: 'Ungültige Eingabedaten für die Wissensextraktion',
      suggested_action:
        'Überprüfen Sie die Nachrichtenstruktur und versuchen Sie es erneut',
      timestamp: new Date().toISOString(),
    };

    logError(
      'Validation error in teacher profile extraction',
      new Error(errorMessages),
      {
        body: req.body,
      }
    );

    res.status(400).json(response);
    return;
  }
  next();
};

/**
 * POST /api/teacher-profile/extract
 * Extract teacher knowledge from chat conversation messages
 */
router.post(
  '/teacher-profile/extract',
  chatLimiter, // Apply rate limiting (30 requests per 15 minutes)
  validateExtractionRequest,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      logInfo('Received knowledge extraction request', {
        messagesCount: req.body.messages?.length,
        userId: req.body.userId,
        conversationId: req.body.conversationId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Prepare the extraction request
      const extractionRequest: KnowledgeExtractionRequest = {
        messages: req.body.messages as ChatMessage[],
        userId: req.body.userId,
        conversationId: req.body.conversationId,
      };

      // Additional validation for message content length
      const totalContentLength = extractionRequest.messages.reduce(
        (total, msg) => total + msg.content.length,
        0
      );

      if (totalContentLength > 50000) {
        const response: ChatErrorResponse = {
          success: false,
          error: 'Total message content exceeds maximum allowed length',
          error_type: 'validation',
          error_code: 'content_too_long',
          user_message: 'Der Gesprächsinhalt ist zu lang für die Analyse',
          suggested_action:
            'Teilen Sie die Analyse in mehrere kleinere Anfragen auf',
          timestamp: new Date().toISOString(),
        };

        logError(
          'Content too long for extraction',
          new Error('Content length exceeded'),
          {
            totalLength: totalContentLength,
            maxLength: 50000,
          }
        );

        res.status(400).json(response);
        return;
      }

      // Call the teacher profile service for knowledge extraction
      const result =
        await TeacherProfileService.extractKnowledge(extractionRequest);

      // Handle successful extraction
      if (result.success) {
        const successResponse = result as KnowledgeExtractionResponse;

        logInfo('Knowledge extraction completed successfully', {
          messagesAnalyzed: successResponse.data.messagesAnalyzed,
          confidence: successResponse.data.confidence,
          extractedFields: {
            subjects: successResponse.data.extractedKnowledge.subjects.length,
            grades: successResponse.data.extractedKnowledge.grades.length,
            schoolType: !!successResponse.data.extractedKnowledge.schoolType,
            methods:
              successResponse.data.extractedKnowledge.teachingMethods.length,
            topics: successResponse.data.extractedKnowledge.topics.length,
            challenges:
              successResponse.data.extractedKnowledge.challenges.length,
          },
        });

        res.status(200).json(successResponse);
        return;
      }

      // Handle extraction errors
      const errorResponse = result as ChatErrorResponse;
      let statusCode = 500;

      // Map error types to appropriate HTTP status codes
      switch (errorResponse.error_type) {
        case 'validation':
          statusCode = 400;
          break;
        case 'rate_limit':
          statusCode = 429;
          break;
        case 'openai_api':
          // OpenAI API errors are generally server-side from client perspective
          if (errorResponse.error_code === 'invalid_api_key') {
            statusCode = 503; // Service unavailable
          } else if (errorResponse.error_code === 'rate_limit_exceeded') {
            statusCode = 429; // Too many requests
          } else {
            statusCode = 502; // Bad gateway
          }
          break;
        default:
          statusCode = 500;
      }

      logError('Knowledge extraction failed', new Error(errorResponse.error), {
        errorType: errorResponse.error_type,
        errorCode: errorResponse.error_code,
        statusCode,
      });

      res.status(statusCode).json(errorResponse);
    } catch (error) {
      // Catch any unexpected errors
      logError(
        'Unexpected error in teacher profile extraction endpoint',
        error as Error,
        {
          body: req.body,
        }
      );

      const response: ChatErrorResponse = {
        success: false,
        error: 'An unexpected server error occurred',
        error_type: 'server_error',
        error_code: 'unexpected_error',
        user_message: 'Ein unerwarteter Serverfehler ist aufgetreten',
        suggested_action:
          'Bitte versuchen Sie es erneut oder kontaktieren Sie den Support',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/teacher-profile/extract/health
 * Health check endpoint for the teacher profile extraction service
 */
router.get(
  '/teacher-profile/extract/health',
  async (req: Request, res: Response): Promise<void> => {
    try {
      logInfo('Health check requested for teacher profile extraction service');

      // Test the service with a simple extraction
      const isHealthy = await TeacherProfileService.testService();

      if (isHealthy) {
        res.status(200).json({
          success: true,
          data: {
            status: 'healthy',
            service: 'teacher-profile-extraction',
            timestamp: new Date().toISOString(),
            message: 'Teacher profile extraction service is operational',
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          success: false,
          error:
            'Teacher profile extraction service is not responding correctly',
          error_type: 'server_error',
          error_code: 'service_unhealthy',
          user_message:
            'Der Wissensextraktionsservice ist momentan nicht verfügbar',
          suggested_action: 'Bitte versuchen Sie es später erneut',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logError(
        'Health check failed for teacher profile extraction',
        error as Error
      );

      res.status(503).json({
        success: false,
        error: 'Health check failed for teacher profile extraction service',
        error_type: 'server_error',
        error_code: 'health_check_failed',
        user_message: 'Gesundheitsprüfung des Services fehlgeschlagen',
        suggested_action: 'Kontaktieren Sie den Administrator',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/teacher-profile/extract/info
 * Information endpoint about the extraction service capabilities
 */
router.get(
  '/teacher-profile/extract/info',
  (req: Request, res: Response): void => {
    const info = {
      success: true,
      data: {
        service: 'Teacher Profile Knowledge Extraction',
        version: '1.0.0',
        capabilities: {
          extractionFields: [
            'subjects',
            'grades',
            'schoolType',
            'teachingMethods',
            'topics',
            'challenges',
          ],
          maxMessagesPerRequest: 100,
          maxContentLength: 50000,
          supportedMessageRoles: ['user', 'assistant'],
          language: 'German (Deutsch)',
        },
        rateLimits: {
          requestsPerWindow: 30,
          windowSizeMinutes: 15,
        },
        usage: {
          endpoint: '/api/teacher-profile/extract',
          method: 'POST',
          requiredFields: ['messages'],
          optionalFields: ['userId', 'conversationId'],
        },
      },
      timestamp: new Date().toISOString(),
    };

    logInfo('Service info requested for teacher profile extraction');
    res.status(200).json(info);
  }
);

export default router;
