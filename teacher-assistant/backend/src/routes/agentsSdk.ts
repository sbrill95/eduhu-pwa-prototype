import { Router, Request, Response } from 'express';
import { testAgent, TestAgentParams } from '../agents/testAgent';
import { routerAgent, RouterAgentParams } from '../agents/routerAgent';
import {
  imageGenerationAgent,
  ImageGenerationParams,
} from '../agents/imageGenerationAgent';
import { logInfo, logError } from '../config/logger';
import { body, validationResult } from 'express-validator';
import { InstantDBService } from '../services/instantdbService';

/**
 * OpenAI Agents SDK API Routes
 *
 * Endpoints for testing and using the OpenAI Agents SDK
 */

const router = Router();

/**
 * POST /api/agents-sdk/test
 *
 * Test endpoint for OpenAI Agents SDK verification
 * Returns "Hello from OpenAI Agents SDK" message
 *
 * Request body: {} (empty object, no parameters required)
 * Response: { success: true, data: { message, timestamp, sdkVersion }, timestamp }
 */
router.post(
  '/test',
  // Input validation middleware
  [
    // Body must be valid JSON (enforced by express.json() middleware)
    // No specific fields required for test endpoint
  ],
  async (req: Request, res: Response): Promise<void> => {
    const requestStartTime = Date.now();

    try {
      logInfo('POST /api/agents-sdk/test - Request received', {
        timestamp: new Date().toISOString(),
        body: req.body,
      });

      // Validate request body is an object
      if (req.body === null || typeof req.body !== 'object') {
        res.status(400).json({
          success: false,
          error: 'Request body must be a valid JSON object',
          timestamp: Date.now(),
        });
        return;
      }

      // Execute test agent
      const params: TestAgentParams = req.body;
      const result = await testAgent.execute(params);

      // Calculate request duration
      const requestDuration = Date.now() - requestStartTime;

      if (result.success) {
        logInfo('POST /api/agents-sdk/test - Success', {
          durationMs: requestDuration,
        });

        res.status(200).json({
          success: true,
          data: result.data,
          timestamp: Date.now(),
        });
      } else {
        logError(
          'POST /api/agents-sdk/test - Agent execution failed',
          new Error(result.error || 'Unknown error')
        );

        res.status(500).json({
          success: false,
          error: result.error || 'Agent execution failed',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;

      logError('POST /api/agents-sdk/test - Internal error', error as Error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: Date.now(),
      });
    }
  }
);

/**
 * GET /api/agents-sdk/health
 *
 * Health check endpoint for Agents SDK
 * Verifies SDK is configured and ready
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const { isAgentsSdkConfigured } = await import('../config/agentsSdk');

    const isConfigured = isAgentsSdkConfigured();

    res.status(200).json({
      success: true,
      data: {
        sdkConfigured: isConfigured,
        sdkVersion: '0.1.10',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logError(
      'GET /api/agents-sdk/health - Health check failed',
      error as Error
    );

    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: Date.now(),
    });
  }
});

/**
 * POST /api/agents-sdk/router/classify
 *
 * Router Agent endpoint for intent classification
 * Classifies image creation vs editing intents and extracts entities
 *
 * Request body: {
 *   prompt: string,        // User's prompt to classify (required)
 *   override?: string      // Manual override: 'create_image' | 'edit_image' | 'unknown' (optional)
 * }
 *
 * Response: {
 *   success: true,
 *   data: {
 *     intent: 'create_image' | 'edit_image' | 'unknown',
 *     confidence: number,    // 0-1
 *     entities: {
 *       subject?: string,
 *       gradeLevel?: string,
 *       topic?: string,
 *       style?: string
 *     },
 *     reasoning?: string,
 *     overridden: boolean
 *   },
 *   timestamp: number
 * }
 */
router.post(
  '/router/classify',
  // Input validation middleware
  [
    body('prompt')
      .isString()
      .withMessage('Prompt muss ein String sein')
      .trim()
      .notEmpty()
      .withMessage('Prompt darf nicht leer sein')
      .isLength({ min: 3, max: 2000 })
      .withMessage('Prompt muss zwischen 3 und 2000 Zeichen lang sein'),
    body('override')
      .optional()
      .isIn(['create_image', 'edit_image', 'unknown'])
      .withMessage('Override muss create_image, edit_image oder unknown sein'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const requestStartTime = Date.now();

    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: errors.array()[0]?.msg || 'Validierungsfehler',
          timestamp: Date.now(),
        });
        return;
      }

      logInfo('POST /api/agents-sdk/router/classify - Request received', {
        timestamp: new Date().toISOString(),
        promptLength: req.body.prompt?.length || 0,
        hasOverride: !!req.body.override,
      });

      // Execute router agent
      const params: RouterAgentParams = {
        prompt: req.body.prompt,
        override: req.body.override,
      };

      const result = await routerAgent.execute(params);

      // Calculate request duration
      const requestDuration = Date.now() - requestStartTime;

      if (result.success) {
        logInfo('POST /api/agents-sdk/router/classify - Success', {
          intent: result.data?.intent,
          confidence: result.data?.confidence,
          overridden: result.data?.overridden,
          durationMs: requestDuration,
        });

        res.status(200).json({
          success: true,
          data: result.data,
          timestamp: Date.now(),
        });
      } else {
        logError(
          'POST /api/agents-sdk/router/classify - Agent execution failed',
          new Error(result.error || 'Unknown error')
        );

        res.status(500).json({
          success: false,
          error: result.error || 'Intent-Klassifizierung fehlgeschlagen',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;

      logError(
        'POST /api/agents-sdk/router/classify - Internal error',
        error as Error
      );

      res.status(500).json({
        success: false,
        error: 'Interner Server-Fehler bei Intent-Klassifizierung',
        timestamp: Date.now(),
      });
    }
  }
);

/**
 * POST /api/agents-sdk/image/generate
 *
 * Image Generation endpoint using OpenAI Agents SDK
 * Generates images with DALL-E 3 for educational purposes
 *
 * Request body: {
 *   prompt: string,             // Image description (required)
 *   size?: string,              // '1024x1024' | '1024x1792' | '1792x1024'
 *   quality?: string,           // 'standard' | 'hd'
 *   style?: string,             // 'vivid' | 'natural'
 *   enhancePrompt?: boolean,    // Whether to enhance German prompts
 *   educationalContext?: string,
 *   targetAgeGroup?: string,
 *   subject?: string,
 *   // OR Gemini form input:
 *   description?: string,       // From Gemini form
 *   imageStyle?: string,        // 'realistic' | 'cartoon' | 'illustrative' | 'abstract'
 *   learningGroup?: string,
 * }
 *
 * Response: {
 *   success: true,
 *   data: {
 *     image_url: string,
 *     revised_prompt: string,
 *     enhanced_prompt?: string,
 *     educational_optimized: boolean,
 *     title: string,
 *     tags: string[],
 *     originalParams: object
 *   },
 *   cost: number,
 *   metadata: object,
 *   artifacts: array,
 *   timestamp: number
 * }
 */
router.post(
  '/image/generate',
  // Input validation middleware
  [
    body('prompt')
      .optional()
      .isString()
      .withMessage('Prompt muss ein String sein')
      .trim()
      .isLength({ min: 3, max: 1000 })
      .withMessage('Prompt muss zwischen 3 und 1000 Zeichen lang sein'),
    body('description')
      .optional()
      .isString()
      .withMessage('Description muss ein String sein')
      .trim()
      .isLength({ min: 3, max: 1000 })
      .withMessage('Description muss zwischen 3 und 1000 Zeichen lang sein'),
    body('size')
      .optional()
      .isIn(['1024x1024', '1024x1792', '1792x1024'])
      .withMessage('Size muss 1024x1024, 1024x1792 oder 1792x1024 sein'),
    body('quality')
      .optional()
      .isIn(['standard', 'hd'])
      .withMessage('Quality muss standard oder hd sein'),
    body('style')
      .optional()
      .isIn(['vivid', 'natural'])
      .withMessage('Style muss vivid oder natural sein'),
    body('imageStyle')
      .optional()
      .isIn(['realistic', 'cartoon', 'illustrative', 'abstract'])
      .withMessage(
        'ImageStyle muss realistic, cartoon, illustrative oder abstract sein'
      ),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const requestStartTime = Date.now();

    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: errors.array()[0]?.msg || 'Validierungsfehler',
          timestamp: Date.now(),
        });
        return;
      }

      // Extract userId from request (auth middleware sets this)
      // In TEST MODE, use the Playwright test user ID
      const userId =
        (req as any).userId ||
        (process.env.VITE_TEST_MODE === 'true'
          ? '38eb3d27-dd97-4ed4-9e80-08fafe18115f'
          : 'test-user-id');
      const sessionId = (req as any).sessionId || undefined;

      logInfo('POST /api/agents-sdk/image/generate - Request received', {
        timestamp: new Date().toISOString(),
        userId,
        hasPrompt: !!req.body.prompt,
        hasDescription: !!req.body.description,
        promptLength:
          req.body.prompt?.length || req.body.description?.length || 0,
      });

      // Validate either prompt or description is provided
      if (!req.body.prompt && !req.body.description) {
        res.status(400).json({
          success: false,
          error: 'Entweder prompt oder description ist erforderlich',
          timestamp: Date.now(),
        });
        return;
      }

      // Execute image generation agent
      const params: ImageGenerationParams = {
        prompt: req.body.prompt || req.body.description,
        size: req.body.size,
        quality: req.body.quality,
        style: req.body.style,
        enhancePrompt: req.body.enhancePrompt,
        educationalContext: req.body.educationalContext,
        targetAgeGroup: req.body.targetAgeGroup,
        subject: req.body.subject,
        // Pass through Gemini form fields
        ...(req.body.description && {
          description: req.body.description,
          imageStyle: req.body.imageStyle,
          learningGroup: req.body.learningGroup,
        }),
      };

      const result = await imageGenerationAgent.execute(
        params,
        userId,
        sessionId
      );

      // Calculate request duration
      const requestDuration = Date.now() - requestStartTime;

      if (result.success) {
        logInfo('POST /api/agents-sdk/image/generate - Success', {
          userId,
          hasImageUrl: !!result.data?.image_url,
          cost: result.cost,
          durationMs: requestDuration,
        });

        // CRITICAL FIX: Save to library_materials in InstantDB
        // Backend must persist images so they appear in Chat and Library
        // IMPORTANT: Generate library_id FIRST, before try/catch, so it's always defined
        const library_id = crypto.randomUUID();
        console.log('[Backend] ✅ Generated library_id:', library_id);

        try {
          console.log(
            '[Backend] 🔍 DEBUG: About to call InstantDBService.db()...'
          );
          const db = InstantDBService.db();
          console.log('[Backend] 🔍 DEBUG: InstantDB db() result:', {
            hasDb: !!db,
            dbType: db ? typeof db : 'null',
            dbKeys: db ? Object.keys(db) : [],
          });

          if (db) {
            console.log(
              '[Backend] ✅ DB instance is available, will save to library_materials'
            );
            console.log(
              '[Backend] 🔍 DEBUG: result.data BEFORE adding library_id:',
              {
                resultDataKeys: Object.keys(result.data || {}),
                hasResultData: !!result.data,
              }
            );

            // Prepare metadata for regeneration (FR-008)
            const originalParams = result.data?.originalParams || {
              description: req.body.description || req.body.prompt || '',
              imageStyle: req.body.imageStyle || 'illustrative',
              learningGroup: req.body.learningGroup || '',
              subject: req.body.subject || '',
            };

            const metadata = {
              originalParams,
              generatedAt: Date.now(),
              agentId: 'image-generation-agent',
              cost: result.cost || 0,
            };

            // Save to library_materials with proper schema
            await db.transact([
              db.tx.library_materials[library_id].update({
                user_id: userId,
                title: result.data?.title || 'Generiertes Bild',
                type: 'image',
                content: result.data?.image_url || '',
                description: result.data?.revised_prompt || '',
                tags: Array.isArray(result.data?.tags)
                  ? result.data.tags.join(', ')
                  : '',
                metadata: JSON.stringify(metadata),
                created_at: Date.now(),
                updated_at: Date.now(),
                is_favorite: false,
                usage_count: 0,
                source_session_id: sessionId || null,
              }),
            ]);

            logInfo('Image saved to library_materials', {
              library_id,
              userId,
              title: result.data?.title,
            });
          } else {
            console.log(
              '[Backend] ⚠️ DB instance is NULL - image will NOT be saved to library_materials'
            );
            logError(
              'InstantDB not available - image will not persist',
              new Error('InstantDB db() returned null')
            );
          }
        } catch (dbError) {
          console.log('[Backend] ❌ EXCEPTION in database save:', dbError);
          logError(
            'Failed to save image to library_materials',
            dbError as Error
          );
          // Don't fail the request - image generation succeeded
        }

        console.log(
          '[Backend] 🔍 DEBUG: After try/catch, library_id =',
          library_id
        );

        // Return success response with library_id
        console.log('[Backend] 🔍 DEBUG: Preparing response with library_id:', {
          library_id,
          hasLibraryId: !!library_id,
          resultDataKeys: Object.keys(result.data || {}),
          willIncludeLibraryId: library_id !== undefined,
        });

        const responseData = {
          ...result.data,
          library_id, // Include library_id for frontend to track
        };

        console.log('[Backend] 🔍 DEBUG: Response data object:', {
          responseDataKeys: Object.keys(responseData),
          library_id: responseData.library_id,
          hasLibraryIdInResponse: 'library_id' in responseData,
        });

        res.status(200).json({
          success: true,
          data: responseData,
          cost: result.cost,
          metadata: result.metadata,
          artifacts: result.artifacts,
          timestamp: Date.now(),
        });
      } else {
        logError(
          'POST /api/agents-sdk/image/generate - Agent execution failed',
          new Error(result.error || 'Unknown error')
        );

        res.status(500).json({
          success: false,
          error: result.error || 'Bildgenerierung fehlgeschlagen',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;

      logError(
        'POST /api/agents-sdk/image/generate - Internal error',
        error as Error
      );

      res.status(500).json({
        success: false,
        error: 'Interner Server-Fehler bei Bildgenerierung',
        timestamp: Date.now(),
      });
    }
  }
);

export default router;
