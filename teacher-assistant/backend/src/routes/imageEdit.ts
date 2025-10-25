import { Router, Request, Response } from 'express';
import GeminiImageService, {
  GeminiServiceError,
  GeminiErrorType,
} from '../services/geminiImageService';
import { isInstantDBAvailable } from '../services/instantdbService';
import { logInfo, logError } from '../config/logger';

const router = Router();

router.post('/edit', async (req: Request, res: Response) => {
  logInfo('[ImageEdit] Request received', {
    bodyKeys: Object.keys(req.body),
  });

  try {
    const { imageId, instruction, userId } = req.body;

    if (!imageId || !instruction || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    if (!isInstantDBAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Database service not available',
      });
    }

    const { getInstantDB } = await import('../services/instantdbService');
    const db = getInstantDB();

    const queryResult = await db.query({
      library_materials: {
        $: { where: { id: imageId } },
      },
    });

    const originalImage = queryResult.library_materials?.[0];

    if (!originalImage) {
      return res.status(404).json({
        success: false,
        error: 'Original image not found',
      });
    }

    if (originalImage.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const usageCheck = await checkCombinedDailyLimit(db, userId);

    if (!usageCheck.canEdit) {
      return res.status(429).json({
        success: false,
        error: 'Daily limit reached',
        usage: {
          used: usageCheck.used,
          limit: usageCheck.limit,
          remaining: 0,
        },
      });
    }

    let imageBase64: string;
    const imageContent = originalImage.content;

    if (!imageContent) {
      return res.status(400).json({
        success: false,
        error: 'No content',
      });
    }

    if (imageContent.startsWith('data:image/')) {
      imageBase64 = imageContent;
    } else if (imageContent.startsWith('http')) {
      const response = await fetch(imageContent);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/png';
      imageBase64 = `data:${contentType};base64,${base64}`;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format',
      });
    }

    const geminiService = new GeminiImageService();
    let editResult;

    try {
      editResult = await geminiService.editImage({
        imageBase64,
        instruction,
        userId,
        imageId,
      });
    } catch (geminiError) {
      if (geminiError instanceof GeminiServiceError) {
        if (geminiError.type === GeminiErrorType.RATE_LIMIT) {
          return res.status(429).json({ success: false, error: geminiError.message });
        }
      }
      return res.status(500).json({
        success: false,
        error: 'Edit failed',
      });
    }

    const version = await getNextVersion(db, imageId);
    const editedImageId = crypto.randomUUID();
    const now = Date.now();

    let editedImageUrl = editResult.editedImageUrl;

    try {
      const { InstantDBService } = await import('../services/instantdbService');
      const filename = `edited-${editedImageId}.png`;

      if (editedImageUrl.startsWith('data:')) {
        const base64Data = editedImageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data || '', 'base64');
        const blob = new Blob([buffer]);
        const file = new File([blob], filename, { type: 'image/png' });
        editedImageUrl = await InstantDBService.FileStorage.uploadImageFromUrl(
          URL.createObjectURL(file),
          filename
        );
      } else {
        editedImageUrl = await InstantDBService.FileStorage.uploadImageFromUrl(
          editedImageUrl,
          filename
        );
      }
    } catch (uploadError) {
      return res.status(500).json({
        success: false,
        error: 'Upload failed',
      });
    }

    const editedImageMetadata = JSON.stringify({
      type: 'image',
      image_url: editedImageUrl,
      originalImageId: imageId,
      editInstruction: instruction,
      version,
      editedAt: new Date().toISOString(),
    });

    await db.transact([
      db.tx.library_materials[editedImageId].update({
        title: `${originalImage.title || 'Bild'} (Version ${version})`,
        type: 'image',
        content: editedImageUrl,
        description: `Bearbeitet: ${instruction}`,
        tags: originalImage.tags || JSON.stringify([]),
        created_at: now,
        updated_at: now,
        is_favorite: false,
        usage_count: 0,
        user_id: userId,
        source_session_id: originalImage.source_session_id || null,
        metadata: editedImageMetadata,
      }),
    ]);

    const originalAfterEdit = await db.query({
      library_materials: {
        $: { where: { id: imageId } },
      },
    });

    const originalAfter = originalAfterEdit.library_materials?.[0];

    if (!originalAfter || originalAfter.content !== originalImage.content) {
      return res.status(500).json({
        success: false,
        error: 'CRITICAL: Original modified',
      });
    }

    const updatedUsage = await checkCombinedDailyLimit(db, userId);

    return res.json({
      success: true,
      data: {
        editedImage: {
          id: editedImageId,
          url: editedImageUrl,
          originalImageId: imageId,
          editInstruction: instruction,
          version,
          createdAt: new Date(now),
        },
        usage: {
          used: updatedUsage.used,
          limit: updatedUsage.limit,
          remaining: updatedUsage.limit - updatedUsage.used,
        },
      },
    });
  } catch (error: any) {
    logError('[ImageEdit] Error', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed',
    });
  }
});

async function checkCombinedDailyLimit(db: any, userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Query ALL user images (no comparison operator - InstantDB requires indexes for $gte)
  const queryResult = await db.query({
    library_materials: {
      $: {
        where: {
          user_id: userId,
          type: 'image',
        },
      },
    },
  });

  // Filter in JavaScript instead of using comparison operator in query
  const todayImages = queryResult.library_materials?.filter(
    (img: any) => img.created_at >= todayTimestamp
  ) || [];

  const totalUsed = todayImages.length;
  const limit = 20;

  return {
    used: totalUsed,
    limit,
    canEdit: totalUsed < limit,
    resetTime: tomorrow,
  };
}

async function getNextVersion(db: any, originalImageId: string): Promise<number> {
  const queryResult = await db.query({
    library_materials: {
      $: {
        where: {
          metadata: {
            $contains: `"originalImageId":"${originalImageId}"`,
          },
        },
      },
    },
  });

  const edits = queryResult.library_materials || [];
  let maxVersion = 0;

  for (const edit of edits) {
    try {
      const metadata = JSON.parse(edit.metadata || '{}');
      const version = metadata.version || 0;
      if (version > maxVersion) {
        maxVersion = version;
      }
    } catch (e) {
      // Ignore
    }
  }

  return maxVersion + 1;
}

export default router;
