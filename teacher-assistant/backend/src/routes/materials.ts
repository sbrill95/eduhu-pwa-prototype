/**
 * Materials Management Routes
 * Library & Materials Unification Feature
 *
 * API endpoints for managing educational materials across different sources:
 * - Manual artifacts (created by teachers)
 * - Agent-generated artifacts (created by AI agents)
 * - Upload artifacts (stored in messages, read-only)
 */

import { Router, Request, Response } from 'express';
import {
  getInstantDB,
  isInstantDBAvailable,
} from '../services/instantdbService';
import { logError, logInfo } from '../config/logger';

const router = Router();

/**
 * Type definitions for material sources
 */
type MaterialSource = 'manual' | 'agent-generated' | 'upload';

/**
 * Request body interface for updating material title
 */
interface UpdateTitleRequest {
  materialId: string;
  newTitle: string;
  source: MaterialSource;
}

/**
 * Request body interface for authentication
 */
interface AuthenticatedRequest extends Request {
  userId?: string; // Added by auth middleware
}

/**
 * Update Material Title Endpoint
 * POST /api/materials/update-title
 *
 * Updates the title of a material based on its source type.
 * - Manual artifacts: Updates 'artifacts' table
 * - Agent-generated: Updates 'generated_artifacts' table
 * - Uploads: Returns error (uploads use filename as title)
 */
router.post('/update-title', async (req: Request, res: Response) => {
  try {
    const { materialId, newTitle, source } = req.body as UpdateTitleRequest;

    // Validation: Check required fields
    if (!materialId || !newTitle || !source) {
      return res.status(400).json({
        success: false,
        error:
          'Fehlende Pflichtfelder: Material-ID, neuer Titel und Quelle sind erforderlich.',
      });
    }

    // Validation: Check if title is not empty
    if (newTitle.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Der neue Titel darf nicht leer sein.',
      });
    }

    // Validation: Check valid source type
    const validSources: MaterialSource[] = [
      'manual',
      'agent-generated',
      'upload',
    ];
    if (!validSources.includes(source)) {
      return res.status(400).json({
        success: false,
        error: `Ungültige Quelle. Erlaubt sind: ${validSources.join(', ')}`,
      });
    }

    // Special case: Uploads cannot have custom titles
    if (source === 'upload') {
      return res.status(400).json({
        success: false,
        error:
          'Upload-Titel können nicht geändert werden (der Dateiname dient als Titel).',
      });
    }

    // Check InstantDB availability
    if (!isInstantDBAvailable()) {
      logError(
        'InstantDB not available for title update',
        new Error('InstantDB not initialized')
      );
      return res.status(503).json({
        success: false,
        error:
          'Datenbank ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
      });
    }

    const db = getInstantDB();

    // Update based on source type
    if (source === 'manual') {
      // Verify material exists and user owns it
      const existingArtifact = await db.query({
        artifacts: {
          $: { where: { id: materialId } },
          creator: {},
        },
      });

      if (
        !existingArtifact.artifacts ||
        existingArtifact.artifacts.length === 0
      ) {
        return res.status(404).json({
          success: false,
          error: 'Material nicht gefunden.',
        });
      }

      // Update artifacts table
      await db.transact([
        db.tx.artifacts[materialId].update({
          title: newTitle,
          updated_at: Date.now(),
        }),
      ]);

      logInfo('Manual artifact title updated', { materialId, newTitle });
    } else if (source === 'agent-generated') {
      // Verify material exists and user owns it
      const existingGenerated = await db.query({
        generated_artifacts: {
          $: { where: { id: materialId } },
          creator: {},
        },
      });

      if (
        !existingGenerated.generated_artifacts ||
        existingGenerated.generated_artifacts.length === 0
      ) {
        return res.status(404).json({
          success: false,
          error: 'Material nicht gefunden.',
        });
      }

      // Update generated_artifacts table
      await db.transact([
        db.tx.generated_artifacts[materialId].update({
          title: newTitle,
          updated_at: Date.now(),
        }),
      ]);

      logInfo('Generated artifact title updated', { materialId, newTitle });
    }

    return res.json({
      success: true,
      data: {
        materialId,
        newTitle,
        source,
        updated_at: Date.now(),
      },
    });
  } catch (error) {
    logError('Failed to update material title', error as Error);
    return res.status(500).json({
      success: false,
      error:
        'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    });
  }
});

/**
 * Delete Material Endpoint
 * DELETE /api/materials/:id
 *
 * Deletes a material based on its source type.
 * - Manual artifacts: Permanently deletes from 'artifacts' table
 * - Agent-generated: Permanently deletes from 'generated_artifacts' table
 * - Uploads: Returns error (uploads are stored in messages, cannot be deleted)
 *
 * Query parameter: source ('manual' | 'agent-generated' | 'upload')
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { source } = req.query as { source?: MaterialSource };

    // Validation: Check required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Fehlende Material-ID.',
      });
    }

    if (!source) {
      return res.status(400).json({
        success: false,
        error: 'Fehlende Quelle (source-Parameter erforderlich).',
      });
    }

    // Validation: Check valid source type
    const validSources: MaterialSource[] = [
      'manual',
      'agent-generated',
      'upload',
    ];
    if (!validSources.includes(source)) {
      return res.status(400).json({
        success: false,
        error: `Ungültige Quelle. Erlaubt sind: ${validSources.join(', ')}`,
      });
    }

    // Special case: Uploads cannot be deleted
    if (source === 'upload') {
      return res.status(400).json({
        success: false,
        error:
          'Uploads können nicht direkt gelöscht werden (sie sind in Nachrichten gespeichert).',
      });
    }

    // Check InstantDB availability
    if (!isInstantDBAvailable()) {
      logError(
        'InstantDB not available for material deletion',
        new Error('InstantDB not initialized')
      );
      return res.status(503).json({
        success: false,
        error:
          'Datenbank ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
      });
    }

    const db = getInstantDB();

    // Delete based on source type
    if (source === 'manual') {
      // Verify material exists and user owns it
      const existingArtifact = await db.query({
        artifacts: {
          $: { where: { id } },
          creator: {},
        },
      });

      if (
        !existingArtifact.artifacts ||
        existingArtifact.artifacts.length === 0
      ) {
        return res.status(404).json({
          success: false,
          error: 'Material nicht gefunden.',
        });
      }

      // Delete from artifacts table
      await db.transact([db.tx.artifacts[id].delete()]);

      logInfo('Manual artifact deleted', { materialId: id });
    } else if (source === 'agent-generated') {
      // Verify material exists and user owns it
      const existingGenerated = await db.query({
        generated_artifacts: {
          $: { where: { id } },
          creator: {},
        },
      });

      if (
        !existingGenerated.generated_artifacts ||
        existingGenerated.generated_artifacts.length === 0
      ) {
        return res.status(404).json({
          success: false,
          error: 'Material nicht gefunden.',
        });
      }

      // Delete from generated_artifacts table
      await db.transact([db.tx.generated_artifacts[id].delete()]);

      logInfo('Generated artifact deleted', { materialId: id });
    }

    return res.json({
      success: true,
      data: {
        materialId: id,
        source,
        deleted_at: Date.now(),
      },
    });
  } catch (error) {
    logError('Failed to delete material', error as Error);
    return res.status(500).json({
      success: false,
      error:
        'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    });
  }
});

export default router;
