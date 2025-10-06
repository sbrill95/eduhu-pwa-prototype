import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { getInstantDB, isInstantDBAvailable } from '../services/instantdbService';
import { logInfo, logError } from '../config/logger';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
            available: true
          }
        ]
      }
    });
  } catch (error: any) {
    logError('[ImageGen] Error fetching available agents', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch available agents'
    });
  }
});

/**
 * Simple Image Generation Route (Fallback for broken langGraphAgents)
 * POST /api/agents/execute
 */
router.post('/agents/execute', async (req: Request, res: Response) => {
  try {
    const { agentType, parameters, sessionId } = req.body;

    logInfo('[ImageGen] Request received', { agentType, parameters, sessionId });

    if (agentType !== 'image-generation') {
      return res.status(400).json({
        success: false,
        error: 'Only image-generation agent is supported'
      });
    }

    const { theme, style = 'realistic', educationalLevel } = parameters || {};

    if (!theme) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: theme'
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

      logInfo('[ImageGen] Image generated successfully', { imageUrl });
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
        const db = getInstantDB();

        // 1. Save to library_materials
        const libId = db.id();
        libraryMaterialId = libId;

        await db.transact([
          db.tx.library_materials[libId].update({
            title: theme || 'Generiertes Bild',
            type: 'image',
            url: imageUrl,
            description: revisedPrompt || enhancedPrompt,
            created_at: Date.now(),
            metadata: JSON.stringify({
              dalle_title: theme,
              revised_prompt: revisedPrompt,
              enhanced_prompt: enhancedPrompt,
              model: 'dall-e-3',
              size: '1024x1024',
              quality: 'standard',
              style: style || 'realistic',
              educationalLevel: educationalLevel,
            })
          })
        ]);

        logInfo('[ImageGen] Saved to library_materials', { libraryMaterialId });

        // 2. Save to messages (if sessionId provided)
        if (sessionId) {
          const msgId = db.id();
          messageId = msgId;

          await db.transact([
            db.tx.messages[msgId].update({
              content: `Bild generiert: ${theme}`,
              role: 'assistant',
              chat_session_id: sessionId,
              created_at: Date.now(),
              metadata: JSON.stringify({
                type: 'image',
                image_url: imageUrl,
                library_id: libraryMaterialId,
                revised_prompt: revisedPrompt,
                dalle_title: theme,
              })
            })
          ]);

          logInfo('[ImageGen] Saved to messages', { messageId, sessionId });
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
        }
      }
    };

    // If storage failed, return 207 Multi-Status
    if (storageError) {
      return res.status(207).json({
        ...responseData,
        warning: 'Image generated but storage failed',
        storageError: storageError.message
      });
    }

    return res.json(responseData);

  } catch (error: any) {
    logError('[ImageGen] Error', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Image generation failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

