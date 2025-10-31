/**
 * Onboarding API Routes
 *
 * Handles user onboarding flow including saving initial profile data,
 * marking onboarding completion, and managing user preferences.
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { InstantDBService } from '../services/instantdbService';
import { ApiResponse, ErrorResponse } from '../types';
import { User } from '../schemas/instantdb';

const router = Router();
const instantdbService = InstantDBService;

interface OnboardingRequest {
  userId: string;
  name: string;
  germanState: string;
  subjects: string[];
  gradeLevel: string;
  teachingPreferences: string[];
  school?: string;
  role?: 'teacher' | 'admin' | 'student';
}

interface OnboardingUpdateRequest {
  germanState?: string;
  subjects?: string[];
  gradeLevel?: string;
  teachingPreferences?: string[];
  school?: string;
  completedAt?: number;
}

/**
 * POST /api/onboarding
 * Save user onboarding data and mark onboarding as completed
 */
router.post(
  '/onboarding',
  [
    body('userId').isString().notEmpty(),
    body('name').isString().trim().isLength({ min: 1, max: 100 }),
    body('germanState').isString().trim().isLength({ min: 1, max: 50 }),
    body('subjects')
      .isArray()
      .custom((subjects: string[]) => {
        if (!Array.isArray(subjects) || subjects.length === 0) {
          throw new Error('At least one subject is required');
        }
        if (
          subjects.some(
            (subject) => typeof subject !== 'string' || subject.trim() === ''
          )
        ) {
          throw new Error('All subjects must be non-empty strings');
        }
        return true;
      }),
    body('gradeLevel').isString().trim().isLength({ min: 1, max: 20 }),
    body('teachingPreferences')
      .isArray()
      .custom((preferences: string[]) => {
        if (!Array.isArray(preferences)) {
          throw new Error('Teaching preferences must be an array');
        }
        if (
          preferences.some(
            (pref) => typeof pref !== 'string' || pref.trim() === ''
          )
        ) {
          throw new Error('All teaching preferences must be non-empty strings');
        }
        return true;
      }),
    body('school').optional().isString().trim().isLength({ max: 200 }),
    body('role').optional().isIn(['teacher', 'admin', 'student']),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ErrorResponse = {
          success: false,
          error: 'Validation failed',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const {
        userId,
        name,
        germanState,
        subjects,
        gradeLevel,
        teachingPreferences,
        school,
        role = 'teacher',
      }: OnboardingRequest = req.body;

      const now = Date.now();

      // First, check if user already exists
      const db = instantdbService.db();
      const existingUser = await db.query({
        users: {
          $: {
            where: { id: userId },
          },
        },
      });

      if (existingUser.data?.users?.length) {
        // Update existing user
        const updateData: Partial<User> = {
          name,
          german_state: germanState,
          subjects: JSON.parse(JSON.stringify(subjects)),
          grade_levels: [gradeLevel],
          teaching_preferences: JSON.parse(JSON.stringify(teachingPreferences)),
          onboarding_completed: true,
          onboarding_completed_at: now,
          last_active: now,
          ...(school && { school }),
          ...(role && { role }),
        };

        await db.transact(db.tx.users[userId].update(updateData));
      } else {
        // Create new user
        const newUser: Omit<User, 'id'> = {
          email: `${userId}@temp.local`, // This should be replaced with actual email from auth
          name,
          role,
          german_state: germanState,
          subjects: JSON.parse(JSON.stringify(subjects)),
          grade_levels: [gradeLevel],
          teaching_preferences: JSON.parse(JSON.stringify(teachingPreferences)),
          onboarding_completed: true,
          onboarding_completed_at: now,
          created_at: now,
          last_active: now,
          is_active: true,
          ...(school && { school }),
        };

        await db.transact(db.tx.users.insert({ ...newUser, id: userId }));
      }

      // Also create or update teacher profile
      const existingProfile = await db.query({
        teacher_profiles: {
          $: {
            where: { user_id: userId },
          },
        },
      });

      if (existingProfile.data?.teacher_profiles?.length) {
        // Update existing profile
        await db.transact(
          db.tx.teacher_profiles[
            existingProfile.data.teacher_profiles[0].id
          ].update({
            display_name: name,
            subjects: JSON.stringify(subjects),
            grades: JSON.stringify([gradeLevel]),
            teaching_methods: JSON.stringify(teachingPreferences),
            last_updated: now,
          })
        );
      } else {
        // Create new profile
        await db.transact(
          db.tx.teacher_profiles.insert({
            user_id: userId,
            display_name: name,
            subjects: JSON.stringify(subjects),
            grades: JSON.stringify([gradeLevel]),
            teaching_methods: JSON.stringify(teachingPreferences),
            topics: JSON.stringify([]),
            challenges: JSON.stringify([]),
            created_at: now,
            last_updated: now,
            conversation_count: 0,
            extraction_history: JSON.stringify([]),
          })
        );
      }

      const response: ApiResponse<{ userId: string; message: string }> = {
        success: true,
        data: {
          userId,
          message: 'Onboarding completed successfully',
        },
        message: 'User onboarding data saved',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error saving onboarding data:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to save onboarding data',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * PUT /api/onboarding/:userId
 * Update user onboarding data
 */
router.put(
  '/onboarding/:userId',
  [
    body('germanState')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 }),
    body('subjects')
      .optional()
      .isArray()
      .custom((subjects: string[]) => {
        if (subjects && (!Array.isArray(subjects) || subjects.length === 0)) {
          throw new Error('Subjects must be a non-empty array');
        }
        if (
          subjects &&
          subjects.some(
            (subject) => typeof subject !== 'string' || subject.trim() === ''
          )
        ) {
          throw new Error('All subjects must be non-empty strings');
        }
        return true;
      }),
    body('gradeLevel')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 20 }),
    body('teachingPreferences')
      .optional()
      .isArray()
      .custom((preferences: string[]) => {
        if (preferences && !Array.isArray(preferences)) {
          throw new Error('Teaching preferences must be an array');
        }
        if (
          preferences &&
          preferences.some(
            (pref) => typeof pref !== 'string' || pref.trim() === ''
          )
        ) {
          throw new Error('All teaching preferences must be non-empty strings');
        }
        return true;
      }),
    body('school').optional().isString().trim().isLength({ max: 200 }),
    body('completedAt').optional().isNumeric(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ErrorResponse = {
          success: false,
          error: 'Validation failed',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { userId } = req.params;

      if (!userId) {
        const response: ErrorResponse = {
          success: false,
          error: 'User ID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const {
        germanState,
        subjects,
        gradeLevel,
        teachingPreferences,
        school,
        completedAt,
      }: OnboardingUpdateRequest = req.body;

      // Check if user exists
      const db = instantdbService.db();
      const existingUser = await db.query({
        users: {
          $: {
            where: { id: userId },
          },
        },
      });

      if (!existingUser.data?.users?.length) {
        const response: ErrorResponse = {
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const now = Date.now();
      const updateData: Partial<User> = {
        last_active: now,
        ...(germanState && { german_state: germanState }),
        ...(subjects && { subjects: JSON.parse(JSON.stringify(subjects)) }),
        ...(gradeLevel && { grade_levels: [gradeLevel] }),
        ...(teachingPreferences && {
          teaching_preferences: JSON.parse(JSON.stringify(teachingPreferences)),
        }),
        ...(school !== undefined && { school }),
        ...(completedAt && {
          onboarding_completed: true,
          onboarding_completed_at: completedAt,
        }),
      };

      await db.transact(db.tx.users[userId].update(updateData));

      // Also update teacher profile if it exists
      const existingProfile = await db.query({
        teacher_profiles: {
          $: {
            where: { user_id: userId },
          },
        },
      });

      if (existingProfile.data?.teacher_profiles?.length) {
        const profileUpdateData: any = {
          last_updated: now,
          ...(subjects && { subjects: JSON.stringify(subjects) }),
          ...(gradeLevel && { grades: JSON.stringify([gradeLevel]) }),
          ...(teachingPreferences && {
            teaching_methods: JSON.stringify(teachingPreferences),
          }),
        };

        await db.transact(
          db.tx.teacher_profiles[
            existingProfile.data.teacher_profiles[0].id
          ].update(profileUpdateData)
        );
      }

      const response: ApiResponse<{ userId: string; message: string }> = {
        success: true,
        data: {
          userId: userId,
          message: 'Onboarding data updated successfully',
        },
        message: 'User onboarding data updated',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating onboarding data:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to update onboarding data',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/onboarding/:userId
 * Get user onboarding status and data
 */
router.get(
  '/onboarding/:userId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const db = instantdbService.db();
      const user = await db.query({
        users: {
          $: {
            where: { id: userId },
          },
        },
      });

      if (!user.data?.users?.length) {
        const response: ErrorResponse = {
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const userData = user.data.users[0];

      const onboardingData = {
        userId: userData.id,
        name: userData.name,
        germanState: userData.german_state,
        subjects: userData.subjects ? JSON.parse(userData.subjects) : [],
        gradeLevel: userData.grade_levels
          ? JSON.parse(userData.grade_levels)[0]
          : null,
        teachingPreferences: userData.teaching_preferences
          ? JSON.parse(userData.teaching_preferences)
          : [],
        school: userData.school,
        role: userData.role,
        onboardingCompleted: userData.onboarding_completed,
        onboardingCompletedAt: userData.onboarding_completed_at,
      };

      const response: ApiResponse<typeof onboardingData> = {
        success: true,
        data: onboardingData,
        message: 'Onboarding data retrieved successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching onboarding data:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to retrieve onboarding data',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

export default router;
