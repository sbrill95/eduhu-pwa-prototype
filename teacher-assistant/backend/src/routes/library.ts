import { Router, Request, Response } from 'express';
import { InstantDBService } from '../services/instantdbService';
import { logInfo, logError } from '../config/logger';

const router = Router();

/**
 * GET /api/library/images
 *
 * Fetch all images for a user from InstantDB
 * Query params: userId (required)
 */
router.get('/images', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'userId query parameter is required'
      });
      return;
    }

    logInfo('GET /api/library/images - Fetching images', { userId });

    const db = InstantDBService.db();

    // Query images from library_materials where type = 'image'
    const result = await db.query({
      library_materials: {
        $: {
          where: {
            user_id: userId,
            type: 'image'
          }
        }
      }
    });

    const images = result?.library_materials || [];

    logInfo('GET /api/library/images - Success', {
      userId,
      imageCount: images.length
    });

    res.status(200).json(images);
  } catch (error) {
    logError('GET /api/library/images - Error', error as Error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch images'
    });
  }
});

export default router;
