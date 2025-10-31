/**
 * Context Management API Routes
 *
 * Handles manual context entries that take priority over AI-extracted context.
 * Users can add, edit, and delete custom context information.
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { InstantDBService } from '../services/instantdbService';
import { ApiResponse, ErrorResponse } from '../types';
import { ManualContext } from '../schemas/instantdb';

const router = Router();
const instantdbService = InstantDBService;

interface CreateContextRequest {
  userId: string;
  content: string;
  contextType:
    | 'subject'
    | 'grade'
    | 'method'
    | 'topic'
    | 'challenge'
    | 'custom';
  priority?: number;
}

interface UpdateContextRequest {
  content?: string;
  contextType?:
    | 'subject'
    | 'grade'
    | 'method'
    | 'topic'
    | 'challenge'
    | 'custom';
  priority?: number;
  isActive?: boolean;
}

/**
 * GET /api/profile/context/:userId
 * Get all manual context entries for a user
 */
router.get(
  '/profile/context/:userId',
  [
    param('userId').isString().notEmpty(),
    query('contextType')
      .optional()
      .isIn(['subject', 'grade', 'method', 'topic', 'challenge', 'custom']),
    query('active').optional().isBoolean(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ErrorResponse = {
          success: false,
          error: 'Invalid parameters',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { userId } = req.params;
      const { contextType, active } = req.query;

      // Build query conditions
      const whereConditions: any = { user: userId };

      if (contextType) {
        whereConditions.context_type = contextType;
      }

      if (active !== undefined) {
        whereConditions.is_active = active === 'true';
      }

      const contextData = await instantdbService.db().query({
        manual_context: {
          $: {
            where: whereConditions,
          },
          user: {},
        },
      });

      const contexts = (contextData.data?.manual_context || []).map(
        (context: any) => ({
          id: context.id,
          content: context.content,
          contextType: context.context_type,
          priority: context.priority,
          isManual: context.is_manual,
          createdAt: context.created_at,
          updatedAt: context.updated_at,
          isActive: context.is_active,
          userId: context.user?.id,
        })
      );

      // Sort by priority (higher first) and then by creation date
      contexts.sort((a: any, b: any) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.createdAt - a.createdAt;
      });

      const response: ApiResponse<{
        contexts: typeof contexts;
        count: number;
        grouped: Record<string, typeof contexts>;
      }> = {
        success: true,
        data: {
          contexts,
          count: contexts.length,
          grouped: contexts.reduce(
            (acc: Record<string, typeof contexts>, context: any) => {
              if (!acc[context.contextType]) {
                acc[context.contextType] = [];
              }
              acc[context.contextType].push(context);
              return acc;
            },
            {} as Record<string, typeof contexts>
          ),
        },
        message: 'Manual context entries retrieved successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching manual context:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to retrieve manual context entries',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/profile/context
 * Add a new manual context entry
 */
router.post(
  '/profile/context',
  [
    body('userId').isString().notEmpty(),
    body('content').isString().trim().isLength({ min: 1, max: 500 }),
    body('contextType').isIn([
      'subject',
      'grade',
      'method',
      'topic',
      'challenge',
      'custom',
    ]),
    body('priority').optional().isInt({ min: 1, max: 10 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ErrorResponse = {
          success: false,
          error: 'Validation failed',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const {
        userId,
        content,
        contextType,
        priority = 5,
      }: CreateContextRequest = req.body;

      // Verify user exists
      const user = await instantdbService.db().query({
        users: {
          $: {
            where: { id: userId },
          },
        },
      });

      if (!user.data?.users?.length) {
        const response: ErrorResponse = {
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const now = Date.now();

      const newContext: any = {
        content: content.trim(),
        context_type: contextType,
        priority,
        is_manual: true,
        created_at: now,
        updated_at: now,
        is_active: true,
      };

      const result = await instantdbService.db().transact(
        instantdbService.db().tx.manual_context.insert({
          ...newContext,
          user: userId,
        })
      );

      const response: ApiResponse<{
        contextId: string;
        message: string;
      }> = {
        success: true,
        data: {
          contextId: result.data?.manual_context?.[0]?.id || 'unknown',
          message: 'Manual context entry created successfully',
        },
        message: 'Context entry added',
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating manual context:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to create manual context entry',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * PUT /api/profile/context/:contextId
 * Update an existing manual context entry
 */
router.put(
  '/profile/context/:contextId',
  [
    param('contextId').isString().notEmpty(),
    body('content').optional().isString().trim().isLength({ min: 1, max: 500 }),
    body('contextType')
      .optional()
      .isIn(['subject', 'grade', 'method', 'topic', 'challenge', 'custom']),
    body('priority').optional().isInt({ min: 1, max: 10 }),
    body('isActive').optional().isBoolean(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ErrorResponse = {
          success: false,
          error: 'Validation failed',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { contextId } = req.params;

      if (!contextId) {
        const response: ErrorResponse = {
          success: false,
          error: 'Context ID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { content, contextType, priority, isActive }: UpdateContextRequest =
        req.body;

      // Check if context exists
      const existingContext = await instantdbService.db().query({
        manual_context: {
          $: {
            where: { id: contextId },
          },
          user: {},
        },
      });

      if (!existingContext.data?.manual_context?.length) {
        const response: ErrorResponse = {
          success: false,
          error: 'Context entry not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const now = Date.now();
      const updateData: any = {
        updated_at: now,
        ...(content && { content: content.trim() }),
        ...(contextType && { context_type: contextType }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { is_active: isActive }),
      };

      await instantdbService
        .db()
        .transact(
          instantdbService.db().tx.manual_context[contextId].update(updateData)
        );

      const response: ApiResponse<{
        contextId: string;
        message: string;
      }> = {
        success: true,
        data: {
          contextId: contextId,
          message: 'Manual context entry updated successfully',
        },
        message: 'Context entry updated',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating manual context:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to update manual context entry',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * DELETE /api/profile/context/:contextId
 * Delete a manual context entry (soft delete by setting is_active to false)
 */
router.delete(
  '/profile/context/:contextId',
  [
    param('contextId').isString().notEmpty(),
    query('permanent').optional().isBoolean(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ErrorResponse = {
          success: false,
          error: 'Invalid context ID',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { contextId } = req.params;

      if (!contextId) {
        const response: ErrorResponse = {
          success: false,
          error: 'Context ID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { permanent } = req.query;

      // Check if context exists
      const existingContext = await instantdbService.db().query({
        manual_context: {
          $: {
            where: { id: contextId },
          },
          user: {},
        },
      });

      if (!existingContext.data?.manual_context?.length) {
        const response: ErrorResponse = {
          success: false,
          error: 'Context entry not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      if (permanent === 'true') {
        // Permanent deletion
        await instantdbService
          .db()
          .transact(
            instantdbService.db().tx.manual_context[contextId].delete()
          );
      } else {
        // Soft delete - just mark as inactive
        await instantdbService.db().transact(
          instantdbService.db().tx.manual_context[contextId].update({
            is_active: false,
            updated_at: Date.now(),
          })
        );
      }

      const response: ApiResponse<{
        contextId: string;
        message: string;
        permanent: boolean;
      }> = {
        success: true,
        data: {
          contextId: contextId,
          message: `Manual context entry ${permanent === 'true' ? 'permanently deleted' : 'deactivated'} successfully`,
          permanent: permanent === 'true',
        },
        message: 'Context entry removed',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error deleting manual context:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to delete manual context entry',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/profile/context/bulk
 * Bulk operations for manual context entries
 */
router.post(
  '/profile/context/bulk',
  [
    body('userId').isString().notEmpty(),
    body('operation').isIn([
      'create',
      'update',
      'delete',
      'activate',
      'deactivate',
    ]),
    body('contextIds').optional().isArray(),
    body('contexts').optional().isArray(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ErrorResponse = {
          success: false,
          error: 'Validation failed',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { userId, operation, contextIds, contexts } = req.body;

      let results: any[] = [];

      switch (operation) {
        case 'create':
          if (!contexts || !Array.isArray(contexts)) {
            throw new Error('Contexts array is required for create operation');
          }

          for (const context of contexts) {
            const newContext = {
              content: context.content,
              context_type: context.contextType,
              priority: context.priority || 5,
              is_manual: true,
              created_at: Date.now(),
              updated_at: Date.now(),
              is_active: true,
              user: userId,
            };

            const result = await instantdbService
              .db()
              .transact(
                instantdbService.db().tx.manual_context.insert(newContext)
              );

            results.push({
              contextId: result.data?.manual_context?.[0]?.id,
              content: context.content,
              success: true,
            });
          }
          break;

        case 'activate':
        case 'deactivate':
          if (!contextIds || !Array.isArray(contextIds)) {
            throw new Error(
              'Context IDs array is required for activation/deactivation'
            );
          }

          for (const contextId of contextIds) {
            await instantdbService.db().transact(
              instantdbService.db().tx.manual_context[contextId].update({
                is_active: operation === 'activate',
                updated_at: Date.now(),
              })
            );

            results.push({
              contextId,
              success: true,
              operation,
            });
          }
          break;

        case 'delete':
          if (!contextIds || !Array.isArray(contextIds)) {
            throw new Error(
              'Context IDs array is required for delete operation'
            );
          }

          for (const contextId of contextIds) {
            await instantdbService
              .db()
              .transact(
                instantdbService.db().tx.manual_context[contextId].delete()
              );

            results.push({
              contextId,
              success: true,
              operation: 'deleted',
            });
          }
          break;

        default:
          throw new Error('Invalid operation');
      }

      const response: ApiResponse<{
        operation: string;
        results: typeof results;
        processedCount: number;
      }> = {
        success: true,
        data: {
          operation,
          results,
          processedCount: results.length,
        },
        message: `Bulk ${operation} operation completed successfully`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error performing bulk context operation:', error);

      const response: ErrorResponse = {
        success: false,
        error: `Failed to perform bulk ${req.body.operation} operation`,
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

export default router;
