import { Router, Request, Response } from 'express';
import { ApiResponse, HealthCheckResponse } from '../types';
import { config } from '../config';

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 * Returns server status and basic information
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const uptime = process.uptime();
    const version = process.env.npm_package_version || '1.0.0';

    const healthData: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version,
      environment: config.NODE_ENV,
      uptime: Math.floor(uptime),
    };

    const response: ApiResponse<HealthCheckResponse> = {
      success: true,
      data: healthData,
      message: 'Server is running correctly',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch {
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
});

export default router;
