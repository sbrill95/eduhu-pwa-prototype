/**
 * Test Helper Endpoints
 *
 * SECURITY WARNING: These endpoints should ONLY be available in test/development mode
 * NEVER enable in production environments
 *
 * Purpose: Support E2E Playwright tests by providing utilities to:
 * - Create test data in InstantDB
 * - Clean up test data after tests complete
 */

import { Router, Request, Response } from 'express';
import { getInstantDB, isInstantDBAvailable } from '../services/instantdbService';
import { logInfo, logError } from '../config/logger';
import { id as generateId } from '@instantdb/admin';

const router = Router();

// Security middleware: Only allow in test/development mode
router.use((req: Request, res: Response, next): void => {
  const isTestMode = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

  if (!isTestMode) {
    res.status(403).json({
      success: false,
      error: 'Test endpoints only available in test/development mode',
    });
    return;
  }

  next();
});

/**
 * POST /api/test/create-image
 * Creates a test image in InstantDB for E2E testing
 */
router.post('/create-image', async (req: Request, res: Response) => {
  logInfo('[TestHelpers] Creating test image', {
    bodyKeys: Object.keys(req.body),
  });

  try {
    if (!isInstantDBAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database service not available',
      });
    }

    const db = getInstantDB();
    const {
      user_id,
      title,
      type,
      content,
      description,
      tags,
      created_at,
      updated_at,
      is_favorite,
      source_session_id,
      metadata,
    } = req.body;

    // Validate required fields
    if (!user_id || !title || !type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, title, type, content',
      });
    }

    // Generate UUID for the image (server-side, following InstantDB best practices)
    const imageId = generateId();

    // Create image in InstantDB
    await db.transact([
      db.tx.library_materials[imageId].update({
        title,
        type,
        content,
        description: description || '',
        tags: tags || '[]',
        created_at: created_at || Date.now(),
        updated_at: updated_at || Date.now(),
        is_favorite: is_favorite || false,
        usage_count: 0,
        user_id,
        source_session_id: source_session_id || null,
        metadata: metadata || '{}',
      }),
    ]);

    logInfo('[TestHelpers] Test image created successfully', {
      id: imageId,
      user_id,
      title,
    });

    return res.json({
      success: true,
      data: {
        id: imageId,
        message: 'Test image created successfully',
      },
    });
  } catch (error: any) {
    logError('[TestHelpers] Error creating test image', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create test image',
    });
  }
});

/**
 * DELETE /api/test/delete-image/:imageId
 * Deletes a test image from InstantDB after testing completes
 */
router.delete('/delete-image/:imageId', async (req: Request, res: Response) => {
  const { imageId } = req.params;

  logInfo('[TestHelpers] Deleting test image', {
    imageId,
  });

  try {
    if (!isInstantDBAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database service not available',
      });
    }

    const db = getInstantDB();

    // Verify image exists and is marked as test data
    const queryResult = await db.query({
      library_materials: {
        $: { where: { id: imageId } },
      },
    });

    const image = queryResult.library_materials?.[0];

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    // Safety check: Only delete if marked as test data
    try {
      const metadata = JSON.parse(image.metadata || '{}');
      if (!metadata.test) {
        return res.status(403).json({
          success: false,
          error: 'Can only delete test images (metadata.test must be true)',
        });
      }
    } catch (e) {
      // If metadata is invalid, allow deletion anyway (assume it's a test image)
      logInfo('[TestHelpers] Invalid metadata JSON, allowing deletion anyway');
    }

    // Delete the image (imageId guaranteed to exist from params)
    await db.transact([
      db.tx.library_materials[imageId as string].delete(),
    ]);

    logInfo('[TestHelpers] Test image deleted successfully', {
      imageId,
    });

    return res.json({
      success: true,
      data: {
        imageId,
        message: 'Test image deleted successfully',
      },
    });
  } catch (error: any) {
    logError('[TestHelpers] Error deleting test image', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete test image',
    });
  }
});

/**
 * POST /api/test/cleanup-all
 * Deletes ALL test images (metadata.test = true) from InstantDB
 * Useful for cleaning up after test suite failures
 */
router.post('/cleanup-all', async (req: Request, res: Response) => {
  logInfo('[TestHelpers] Cleaning up all test images');

  try {
    if (!isInstantDBAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database service not available',
      });
    }

    const db = getInstantDB();

    // Query all library_materials
    const queryResult = await db.query({
      library_materials: {},
    });

    const allMaterials = queryResult.library_materials || [];
    let deletedCount = 0;

    // Filter test images and delete them
    for (const material of allMaterials) {
      try {
        if (!material.id) {
          continue;
        }
        const metadata = JSON.parse(material.metadata || '{}');
        if (metadata.test === true) {
          await db.transact([
            db.tx.library_materials[material.id].delete(),
          ]);
          deletedCount++;
          logInfo('[TestHelpers] Deleted test image', { id: material.id });
        }
      } catch (e) {
        // Skip if metadata parsing fails
        continue;
      }
    }

    logInfo('[TestHelpers] Cleanup complete', { deletedCount });

    return res.json({
      success: true,
      data: {
        deletedCount,
        message: `Cleaned up ${deletedCount} test images`,
      },
    });
  } catch (error: any) {
    logError('[TestHelpers] Error during cleanup', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Cleanup failed',
    });
  }
});

export default router;
