/**
 * Storage Proxy Route
 *
 * Proxies InstantDB S3 image requests through the backend to avoid CORS issues.
 * Frontend can request images via /api/storage-proxy?url=<s3-url>
 * and the backend will fetch and return the image with proper CORS headers.
 */

import { Router, Request, Response } from 'express';
import { logInfo, logError } from '../config/logger';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /storage-proxy
 *
 * Query params:
 *   - url: The S3 URL to proxy (InstantDB storage URL)
 *
 * Returns: The image file with proper CORS headers
 */
router.get('/storage-proxy', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;

  if (!imageUrl) {
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Missing url parameter',
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(errorResponse);
  }

  // Validate URL is from InstantDB storage
  if (!imageUrl.includes('instant-storage.s3.amazonaws.com')) {
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Invalid storage URL - must be InstantDB S3 URL',
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(errorResponse);
  }

  try {
    logInfo('[StorageProxy] Fetching image', { url: imageUrl.substring(0, 100) + '...' });

    // Fetch the image from S3
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`S3 fetch failed: ${response.status} ${response.statusText}`);
    }

    // Get image as buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set proper headers
    const contentType = response.headers.get('content-type') || 'image/png';

    res.set({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*', // Allow all origins for images
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    });

    logInfo('[StorageProxy] Image fetched successfully', {
      size: buffer.length,
      contentType,
    });

    // Send the image
    return res.send(buffer);

  } catch (error) {
    logError('[StorageProxy] Failed to fetch image', error as Error);

    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to fetch image from storage',
      timestamp: new Date().toISOString(),
    };
    return res.status(500).json(errorResponse);
  }
});

export default router;
