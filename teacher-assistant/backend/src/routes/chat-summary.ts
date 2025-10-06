/**
 * Chat Summary API Routes
 *
 * API endpoints for generating AI-powered chat summaries
 * Part of the Chat Summaries feature
 */

import express, { Request, Response } from 'express';
import { summaryService } from '../services/summaryService';
import { ChatSessionService } from '../services/instantdbService';
import { logError, logInfo } from '../config/logger';
import { SummaryMessage } from '../services/summaryService';

const router = express.Router();

/**
 * POST /api/chat/summary
 *
 * Generate an AI-powered summary for a chat session
 *
 * Request Body:
 * - chatId: string - The chat session ID
 * - messages: SummaryMessage[] - First 3-4 messages of the chat
 *
 * Response:
 * - summary: string - Generated summary (max 20 characters)
 *
 * Error Responses:
 * - 400: Bad request (missing or invalid parameters)
 * - 500: Internal server error (summary generation failed)
 */
router.post('/summary', async (req: Request, res: Response) => {
  try {
    const { chatId, messages } = req.body;

    // Validate request body
    if (!chatId || typeof chatId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Fehlende oder ungültige Chat-ID.',
        timestamp: new Date().toISOString(),
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Fehlende oder ungültige Nachrichten.',
        timestamp: new Date().toISOString(),
      });
    }

    if (messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Mindestens eine Nachricht ist erforderlich.',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({
          success: false,
          error: 'Ungültiges Nachrichtenformat. Jede Nachricht muss "role" und "content" enthalten.',
          timestamp: new Date().toISOString(),
        });
      }

      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        return res.status(400).json({
          success: false,
          error: 'Ungültige Nachrichtenrolle. Erlaubt sind: user, assistant, system.',
          timestamp: new Date().toISOString(),
        });
      }
    }

    logInfo('Generating chat summary', { chatId, messageCount: messages.length });

    // Take only first 4 messages for summary generation
    const relevantMessages: SummaryMessage[] = messages.slice(0, 4);

    // Generate summary with retry logic
    const summary = await summaryService.generateSummaryWithRetry(relevantMessages);

    // Store summary in InstantDB using the dedicated method
    const updateSuccess = await ChatSessionService.updateSummary(chatId, summary);

    if (!updateSuccess) {
      logError('Failed to store summary in database', new Error('InstantDB update failed'), {
        chatId,
        summary,
      });
      // Note: We still return the summary even if DB update fails
      // This allows the frontend to use it temporarily
    }

    logInfo('Chat summary generated and stored successfully', {
      chatId,
      summary,
      summaryLength: summary.length,
    });

    return res.status(200).json({
      success: true,
      data: {
        summary,
        chatId,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logError('Chat summary endpoint error', error as Error, {
      chatId: req.body?.chatId,
    });

    return res.status(500).json({
      success: false,
      error: 'Fehler bei der Zusammenfassungserstellung. Bitte versuchen Sie es später erneut.',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/chat/:chatId/summary
 *
 * Retrieve the existing summary for a chat session
 *
 * Response:
 * - summary: string | null - The chat summary (null if not generated yet)
 *
 * Error Responses:
 * - 400: Bad request (invalid chat ID)
 * - 404: Chat not found
 * - 500: Internal server error
 */
router.get('/:chatId/summary', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat-ID ist erforderlich.',
        timestamp: new Date().toISOString(),
      });
    }

    // Note: This would need a method to fetch a single session by ID
    // For now, we'll return a placeholder response
    // TODO: Implement ChatSessionService.getSessionById(chatId)

    logInfo('Fetching chat summary', { chatId });

    return res.status(200).json({
      success: true,
      data: {
        chatId,
        summary: null, // Placeholder - implement proper fetch later
        message: 'Summary retrieval endpoint - implementation pending',
      },
    });
  } catch (error) {
    logError('Chat summary retrieval error', error as Error, {
      chatId: req.params?.chatId,
    });

    return res.status(500).json({
      success: false,
      error: 'Fehler beim Abrufen der Zusammenfassung.',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
