/**
 * Chat Tags API Routes
 * Endpoints for extracting and managing chat session tags
 */

import { Router, Request, Response } from 'express';
import { extractChatTags, ChatTag, ChatMessageForTagging } from '../services/chatTagService';
import { ChatSessionService, MessageService, isInstantDBAvailable } from '../services/instantdbService';
import { logError, logInfo } from '../config/logger';

const router = Router();

/**
 * POST /api/chat/:chatId/tags
 * Extract and save tags for a chat session
 */
router.post('/:chatId/tags', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { forceRegenerate } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
      });
    }

    logInfo('Extracting tags for chat session', { chatId, forceRegenerate });

    // Check if InstantDB is available
    if (!isInstantDBAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable',
        message: 'InstantDB is not initialized',
      });
    }

    // Fetch messages for the chat session
    const messages = await MessageService.getSessionMessages(chatId);

    if (!messages) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found or no messages available',
      });
    }

    if (messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No messages in chat session to analyze',
      });
    }

    // Check if tags already exist (and forceRegenerate is not set)
    if (!forceRegenerate) {
      // We would need to query the session to check for existing tags
      // For now, we'll always extract tags if not forcing
    }

    // Convert messages to format needed for tag extraction
    const messagesToAnalyze: ChatMessageForTagging[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Extract tags using OpenAI
    const tags = await extractChatTags(chatId, messagesToAnalyze);

    if (tags.length === 0) {
      logInfo('No tags extracted from chat', { chatId });
      return res.status(200).json({
        success: true,
        data: {
          tags: [],
          message: 'No relevant tags could be extracted from this conversation',
        },
      });
    }

    // Save tags to chat session in InstantDB
    const tagsJson = JSON.stringify(tags);
    const updateSuccess = await ChatSessionService.updateSession(chatId, {
      tags: tagsJson as any, // Will be stored as JSON string in InstantDB
    });

    if (!updateSuccess) {
      logError(
        'Failed to save tags to chat session',
        new Error('Update operation failed'),
        { chatId, tags }
      );
      return res.status(500).json({
        success: false,
        error: 'Failed to save tags to database',
      });
    }

    logInfo('Successfully saved tags to chat session', { chatId, tagCount: tags.length });

    return res.status(200).json({
      success: true,
      data: {
        tags,
        chatId,
        tagCount: tags.length,
      },
    });
  } catch (error) {
    logError('Error in POST /api/chat/:chatId/tags', error as Error, {
      chatId: req.params.chatId,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error while extracting tags',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/chat/:chatId/tags
 * Retrieve existing tags for a chat session
 */
router.get('/:chatId/tags', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
      });
    }

    logInfo('Fetching tags for chat session', { chatId });

    // Check if InstantDB is available
    if (!isInstantDBAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable',
      });
    }

    // Fetch the chat session
    const sessions = await ChatSessionService.getUserSessions(''); // We need to improve this to fetch by ID

    // For now, we'll return a simple response
    // In production, we'd query the specific session by ID
    return res.status(200).json({
      success: true,
      data: {
        tags: [],
        chatId,
        message: 'Tag retrieval will be implemented with session-specific query',
      },
    });
  } catch (error) {
    logError('Error in GET /api/chat/:chatId/tags', error as Error, {
      chatId: req.params.chatId,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching tags',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/chat/:chatId/tags
 * Remove all tags from a chat session
 */
router.delete('/:chatId/tags', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
      });
    }

    logInfo('Deleting tags for chat session', { chatId });

    // Check if InstantDB is available
    if (!isInstantDBAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable',
      });
    }

    // Remove tags from chat session
    const updateSuccess = await ChatSessionService.updateSession(chatId, {
      tags: undefined as any,
    });

    if (!updateSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Failed to remove tags from database',
      });
    }

    logInfo('Successfully removed tags from chat session', { chatId });

    return res.status(200).json({
      success: true,
      data: {
        chatId,
        message: 'Tags removed successfully',
      },
    });
  } catch (error) {
    logError('Error in DELETE /api/chat/:chatId/tags', error as Error, {
      chatId: req.params.chatId,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error while deleting tags',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/chat/:chatId/tags
 * Manually update tags for a chat session
 */
router.put('/:chatId/tags', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { tags } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
      });
    }

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: 'Tags must be provided as an array',
      });
    }

    // Validate tag structure
    const validTags = tags.every(
      (tag: any) =>
        tag &&
        typeof tag.label === 'string' &&
        typeof tag.category === 'string' &&
        ['subject', 'topic', 'grade_level', 'material_type', 'general'].includes(
          tag.category
        )
    );

    if (!validTags) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tag structure. Each tag must have label and category fields',
      });
    }

    logInfo('Manually updating tags for chat session', { chatId, tagCount: tags.length });

    // Check if InstantDB is available
    if (!isInstantDBAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable',
      });
    }

    // Limit to 5 tags
    const limitedTags = tags.slice(0, 5);
    const tagsJson = JSON.stringify(limitedTags);

    // Update tags in chat session
    const updateSuccess = await ChatSessionService.updateSession(chatId, {
      tags: tagsJson as any,
    });

    if (!updateSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update tags in database',
      });
    }

    logInfo('Successfully updated tags for chat session', {
      chatId,
      tagCount: limitedTags.length,
    });

    return res.status(200).json({
      success: true,
      data: {
        tags: limitedTags,
        chatId,
        tagCount: limitedTags.length,
      },
    });
  } catch (error) {
    logError('Error in PUT /api/chat/:chatId/tags', error as Error, {
      chatId: req.params.chatId,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error while updating tags',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
