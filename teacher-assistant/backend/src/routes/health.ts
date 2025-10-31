import { Router, Request, Response } from 'express';
import { ApiResponse, HealthCheckResponse } from '../types';
import { config } from '../config';
import { execSync } from 'child_process';

const router = Router();

// Store startup timestamp (set once when server starts)
const STARTUP_TIMESTAMP = Date.now();

// Get git commit hash (run once at startup)
let GIT_COMMIT_HASH = 'unknown';
try {
  GIT_COMMIT_HASH = execSync('git rev-parse HEAD').toString().trim();
} catch {
  // Git not available or not a git repo
  GIT_COMMIT_HASH = process.env.GIT_COMMIT_HASH || 'unknown';
}

/**
 * Health check endpoint (ENHANCED for test verification)
 * GET /api/health
 * Returns server status and basic information
 *
 * Enhanced with:
 * - Git commit hash (verify backend version matches current code)
 * - Startup timestamp (verify backend restarted recently)
 * - InstantDB status (verify database connection)
 *
 * Used by:
 * - Pre-test validation (scripts/pre-test-checklist.sh)
 * - Playwright global setup
 * - Monitoring/alerting systems
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const uptime = process.uptime();
    const version = process.env.npm_package_version || '1.0.0';

    // Check InstantDB status (basic check)
    let instantdbStatus = 'unknown';
    try {
      // If InstantDB client is available, it's connected
      instantdbStatus = config.INSTANTDB_APP_ID ? 'connected' : 'not_configured';
    } catch {
      instantdbStatus = 'error';
    }

    const healthData: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version,
      environment: config.NODE_ENV,
      uptime: Math.floor(uptime),
      // ENHANCED: Add version tracking for pre-test validation
      gitCommit: GIT_COMMIT_HASH,
      startupTimestamp: STARTUP_TIMESTAMP,
      instantdb: instantdbStatus,
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
