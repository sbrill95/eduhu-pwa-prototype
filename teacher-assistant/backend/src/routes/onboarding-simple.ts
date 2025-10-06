/**
 * Simplified Onboarding API Routes
 *
 * Minimal implementation to fix 404 errors without InstantDB dependency
 */

import { Router, Request, Response } from 'express';
import { ApiResponse, ErrorResponse } from '../types';

const router = Router();

interface OnboardingStatus {
  completed: boolean;
  userId: string;
}

/**
 * GET /api/onboarding/:userId
 * Get user onboarding status - simplified implementation
 */
router.get('/onboarding/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      const response: ErrorResponse = {
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    // Simplified response - in a real implementation this would check database
    const onboardingData: OnboardingStatus = {
      completed: false, // Default to false for new users
      userId,
    };

    const response: ApiResponse<OnboardingStatus> = {
      success: true,
      data: onboardingData,
      message: 'Onboarding status retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching onboarding status:', error);

    const response: ErrorResponse = {
      success: false,
      error: 'Failed to retrieve onboarding status',
      timestamp: new Date().toISOString()
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/onboarding/:userId
 * Update user onboarding status - simplified implementation
 */
router.post('/onboarding/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      const response: ErrorResponse = {
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    // Simplified response - in a real implementation this would update database
    const onboardingData: OnboardingStatus = {
      completed: true,
      userId,
    };

    const response: ApiResponse<OnboardingStatus> = {
      success: true,
      data: onboardingData,
      message: 'Onboarding completed successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating onboarding status:', error);

    const response: ErrorResponse = {
      success: false,
      error: 'Failed to update onboarding status',
      timestamp: new Date().toISOString()
    };

    res.status(500).json(response);
  }
});

export default router;