import express from 'express';
import rateLimit from 'express-rate-limit';
import VisionService from '../services/visionService';
import { logInfo, logError } from '../config/logger';
import { ApiResponse } from '../types';

const router = express.Router();

// Rate limiting: 10 requests per minute, 100 per hour
const tagImageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'Too many tagging requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const tagImageHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    success: false,
    error: 'Hourly tagging limit exceeded, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/vision/tag-image
 * Generate tags for an educational image using Vision AI
 *
 * Request body:
 * {
 *   "imageUrl": "https://...",
 *   "context": {
 *     "title": "...",
 *     "description": "...",
 *     "subject": "...",
 *     "grade": "..."
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "tags": ["tag1", "tag2", ...],
 *     "confidence": "high" | "medium" | "low",
 *     "model": "gpt-4o",
 *     "processingTime": 1234
 *   }
 * }
 */
router.post(
  '/tag-image',
  tagImageLimiter,
  tagImageHourlyLimiter,
  async (req, res) => {
    try {
      const { imageUrl, context } = req.body;

      // Validation
      if (!imageUrl || typeof imageUrl !== 'string') {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Missing or invalid imageUrl in request body',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Verify imageUrl is a valid URL
      try {
        new URL(imageUrl);
      } catch {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Invalid imageUrl format (must be valid URL)',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(errorResponse);
        return;
      }

      logInfo('[VisionTagging] Tagging image:', { imageUrl });

      // Call Vision service
      const result = await VisionService.tagImage(imageUrl, context);

      const response: ApiResponse = {
        success: true,
        data: {
          tags: result.tags,
          confidence: result.confidence,
          model: result.model,
          processingTime: result.processingTime,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error: unknown) {
      logError('[VisionTagging] Error:', error as Error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('timeout')) {
        const timeoutResponse: ApiResponse = {
          success: false,
          error: 'Vision API timeout, please try again',
          timestamp: new Date().toISOString(),
        };
        res.status(503).json(timeoutResponse);
        return;
      }

      const errorResponse: ApiResponse = {
        success: false,
        error: 'Failed to tag image',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  }
);

export default router;
