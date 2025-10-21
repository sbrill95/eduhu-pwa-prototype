import { Router, Request, Response } from 'express';
import { openaiClient as openai } from '../config/openai'; // Use shared client with 90s timeout
import { isInstantDBAvailable } from '../services/instantdbService';
import { logInfo, logError } from '../config/logger';

const router = Router();

/**
 * GET /api/langgraph/agents/available
 * Returns list of available agents
 */
router.get('/agents/available', async (req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      data: {
        agents: [
          {
            id: 'langgraph-image-generation',
            name: 'Bild-Generierung',
            description: 'Erstellt hochwertige Bilder für den Unterricht',
            type: 'image-generation',
            available: true,
          },
        ],
      },
    });
  } catch (error: any) {
    logError('[ImageGen] Error fetching available agents', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch available agents',
    });
  }
});

/**
 * Simple Image Generation Route (Fallback for broken langGraphAgents)
 * POST /api/agents/execute
 */
router.post('/agents/execute', async (req: Request, res: Response) => {
  // 🔍 DIAGNOSTIC LOGGING (BUG-027)
  console.log('[ImageGen] 🎯 ROUTE HIT - /agents/execute', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    contentType: req.get('Content-Type'),
    headers: {
      origin: req.get('Origin'),
      referer: req.get('Referer'),
    },
  });

  try {
    // BUG-027 FIX: Support BOTH API contracts
    // Legacy format: { agentType, parameters }
    // New format: { agentId, input }
    const {
      agentType: legacyAgentType,
      agentId: newAgentId,
      parameters: legacyParameters,
      input: newInput,
      sessionId,
      userId,
    } = req.body;

    // Accept either agentType (legacy) or agentId (new)
    const agentType = legacyAgentType || newAgentId;

    // Accept either parameters (legacy) or input (new)
    const inputData = legacyParameters || newInput;

    logInfo('[ImageGen] Request received', {
      agentType,
      inputData,
      sessionId,
      userId,
    });

    if (agentType !== 'image-generation') {
      return res.status(400).json({
        success: false,
        error: 'Only image-generation agent is supported',
      });
    }

    // Map new format fields to legacy fields
    // New format: { description, imageStyle, learningGroup }
    // Legacy format: { theme, style, educationalLevel }
    const theme = (inputData as any)?.description || (inputData as any)?.theme;
    const style =
      (inputData as any)?.imageStyle ||
      (inputData as any)?.style ||
      'realistic';
    const educationalLevel =
      (inputData as any)?.learningGroup || (inputData as any)?.educationalLevel;

    if (!theme) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: theme',
      });
    }

    // Generate enhanced prompt
    const enhancedPrompt = `Educational illustration about "${theme}". Style: ${style}. Clear, detailed, suitable for ${educationalLevel || 'students'}.`;

    logInfo('[ImageGen] Calling DALL-E 3', { enhancedPrompt });

    // Call DALL-E 3
    let imageUrl: string;
    let revisedPrompt: string | undefined;

    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No data returned from DALL-E');
      }

      const url = response.data[0]?.url;
      if (!url) {
        throw new Error('No image URL returned from DALL-E');
      }

      imageUrl = url;
      revisedPrompt = response.data[0]?.revised_prompt;

      logInfo('[ImageGen] Image generated successfully (temporary URL)', {
        imageUrl: imageUrl.substring(0, 60) + '...',
      });

      // Upload to permanent storage with public read permissions
      // Schema configured with: $files.view = "true" (public read), $files.create = "auth.id != null" (authenticated write)
      try {
        const { InstantDBService } = await import(
          '../services/instantdbService'
        );
        const filename = `image-${crypto.randomUUID()}.png`;

        logInfo('[ImageGen] Uploading to permanent storage...', { filename });
        const permanentUrl =
          await InstantDBService.FileStorage.uploadImageFromUrl(
            imageUrl,
            filename
          );
        imageUrl = permanentUrl; // Replace temporary URL with permanent URL

        logInfo('[ImageGen] ✅ Image uploaded to permanent storage', {
          filename,
          permanentUrl: permanentUrl.substring(0, 60) + '...',
          expiryNote: 'Permanent (no expiry)',
        });
      } catch (uploadError) {
        logError(
          '[ImageGen] ⚠️  Failed to upload to permanent storage, using temporary URL',
          uploadError as Error
        );
        logInfo(
          '[ImageGen] Fallback: Using temporary DALL-E URL (expires in 2 hours)'
        );
        // Continue with temporary URL as fallback
      }
    } catch (dalleError: any) {
      logError('[ImageGen] DALL-E error', dalleError);
      throw new Error(`DALL-E generation failed: ${dalleError.message}`);
    }

    // Store in InstantDB
    let libraryMaterialId: string | null = null;
    let messageId: string | null = null;
    let storageError: Error | null = null;

    if (isInstantDBAvailable()) {
      try {
        // BUG-024 FIX: Use crypto.randomUUID() for ID generation (matches langGraphImageGenerationAgent.ts:701)
        const { getInstantDB } = await import('../services/instantdbService');
        const db = getInstantDB();

        // 1. Save to library_materials
        const libId = crypto.randomUUID();
        libraryMaterialId = libId;
        const now = Date.now();

        // US4 FIX: Extract originalParams for metadata (same as messages line 204-209)
        const originalParams = {
          description: theme || '',
          imageStyle: style || 'realistic',
          learningGroup: educationalLevel || '',
          subject: '',
        };

        // US4 FIX: Validate and stringify metadata before saving
        const { validateAndStringifyMetadata } = await import(
          '../utils/metadataValidator'
        );
        const libraryMetadataObject = {
          type: 'image' as const,
          image_url: imageUrl,
          title: theme || 'Generiertes Bild',
          originalParams: originalParams,
        };

        const validatedLibraryMetadata = validateAndStringifyMetadata(
          libraryMetadataObject
        );

        if (!validatedLibraryMetadata) {
          logError(
            '[ImageGen] Library metadata validation failed - saving without metadata',
            new Error('Metadata validation failed'),
            { libraryMetadataObject }
          );
        } else {
          logInfo('[ImageGen] Library metadata validation successful', {
            libraryId: libId,
            metadataSize: validatedLibraryMetadata.length,
          });
        }

        // BUG-029 FIX: Save to library_materials (not artifacts)
        await db.transact([
          db.tx.library_materials[libId].update({
            title: theme || 'Generiertes Bild',
            type: 'image',
            content: imageUrl,
            description: revisedPrompt || theme || '',
            tags: JSON.stringify([]),
            created_at: now,
            updated_at: now,
            is_favorite: false,
            usage_count: 0,
            user_id: userId,
            source_session_id: sessionId || null,
            metadata: validatedLibraryMetadata, // US4 FIX: Add metadata field
          }),
        ]);

        logInfo('[ImageGen] Saved to library_materials', {
          libraryMaterialId: libId,
          metadataValidated: !!validatedLibraryMetadata,
        });

        // 2. Save to messages (if sessionId provided)
        if (sessionId) {
          // BUG-025 FIX: Validate required fields for InstantDB relationships
          if (!userId) {
            throw new Error(
              'Missing userId - required for message author relationship'
            );
          }

          const msgId = crypto.randomUUID();
          messageId = msgId;

          // BUG-023 FIX: Extract originalParams for re-generation (matches langGraphAgents.ts:375-382)
          const originalParams = {
            description: theme || '',
            imageStyle: style || 'realistic',
            learningGroup: educationalLevel || '',
            subject: '',
          };

          // BUG-025 FIX: Add required relationship fields (session, author)
          await db.transact([
            db.tx.messages[msgId].update({
              content: `Bild generiert: ${theme}`,
              role: 'assistant',
              timestamp: now,
              message_index: 0,
              is_edited: false, // BUG-025: Required field
              metadata: JSON.stringify({
                type: 'image',
                image_url: imageUrl,
                library_id: libraryMaterialId,
                revised_prompt: revisedPrompt,
                dalle_title: theme,
                title: theme,
                originalParams: originalParams, // BUG-023: Added for re-generation
              }),
              session: sessionId, // BUG-025: Link to chat_sessions (use 'session' not 'session_id')
              author: userId, // BUG-025: Link to users (use 'author' not 'user_id')
            }),
          ]);

          logInfo('[ImageGen] Saved to messages', {
            messageId,
            sessionId,
            userId,
          });
        }
      } catch (dbError: any) {
        logError('[ImageGen] InstantDB storage error', dbError);
        storageError = dbError;
        // Continue - return image even if storage fails
      }
    } else {
      logInfo('[ImageGen] InstantDB not available, skipping storage');
    }

    // Return response
    const responseData = {
      success: true,
      data: {
        executionId: `exec-${Date.now()}`,
        image_url: imageUrl,
        library_id: libraryMaterialId,
        message_id: messageId,
        revised_prompt: revisedPrompt,
        enhanced_prompt: enhancedPrompt,
        title: theme,
        dalle_title: theme,
        quality_score: 0.9,
        educational_optimized: true,
        cost: 0.04,
        metadata: {
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'standard',
        },
      },
    };

    // If storage failed, return 207 Multi-Status
    if (storageError) {
      return res.status(207).json({
        ...responseData,
        warning: 'Image generated but storage failed',
        storageError: storageError.message,
      });
    }

    return res.json(responseData);
  } catch (error: any) {
    logError('[ImageGen] Error', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Image generation failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
