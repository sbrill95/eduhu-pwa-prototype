import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel serverless function for health check endpoint
 * GET /api/health
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const healthResponse = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'production',
        version: '1.0.0',
      },
    };

    res.status(200).json(healthResponse);
  } catch (error) {
    console.error('Health check error:', error);

    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
}