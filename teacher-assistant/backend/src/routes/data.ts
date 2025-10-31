/**
 * Data API Routes
 *
 * Handles predefined data collections for German states, teaching subjects,
 * and teaching preferences. Includes search functionality for real-time filtering.
 */

import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import DataSeederService from '../services/dataSeederService';
import { ApiResponse, ErrorResponse } from '../types';
import {
  GermanState,
  TeachingSubject,
  TeachingPreference,
} from '../schemas/instantdb';

const router = Router();
const dataSeederService = new DataSeederService();

/**
 * GET /api/data/states
 * Retrieve all German states with optional search
 */
router.get(
  '/data/states',
  [query('search').optional().isString().trim().isLength({ max: 100 })],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ErrorResponse = {
          success: false,
          error: 'Invalid search parameters',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { search } = req.query;
      let states = await dataSeederService.getGermanStates();

      // Apply search filter if provided
      if (search && typeof search === 'string') {
        states = dataSeederService.searchData(states, search);
      }

      const response: ApiResponse<{ states: GermanState[]; count: number }> = {
        success: true,
        data: {
          states,
          count: states.length,
        },
        message: 'German states retrieved successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching German states:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to retrieve German states',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/data/subjects
 * Retrieve all teaching subjects with optional search and category filter
 */
router.get(
  '/data/subjects',
  [
    query('search').optional().isString().trim().isLength({ max: 100 }),
    query('category').optional().isString().trim().isLength({ max: 50 }),
    query('grade_level').optional().isString().trim().isLength({ max: 10 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ErrorResponse = {
          success: false,
          error: 'Invalid search parameters',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { search, category, grade_level } = req.query;
      let subjects = await dataSeederService.getTeachingSubjects();

      // Apply category filter if provided
      if (category && typeof category === 'string') {
        subjects = subjects.filter(
          (subject) => subject.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Apply grade level filter if provided
      if (grade_level && typeof grade_level === 'string') {
        subjects = subjects.filter(
          (subject) => subject.grade_levels?.includes(grade_level) ?? false
        );
      }

      // Apply search filter if provided
      if (search && typeof search === 'string') {
        subjects = dataSeederService.searchData(subjects, search);
      }

      // Get unique categories for frontend filtering
      const allSubjects = await dataSeederService.getTeachingSubjects();
      const categories = [
        ...new Set(allSubjects.map((s) => s.category)),
      ].sort();

      const response: ApiResponse<{
        subjects: TeachingSubject[];
        count: number;
        categories: string[];
      }> = {
        success: true,
        data: {
          subjects,
          count: subjects.length,
          categories,
        },
        message: 'Teaching subjects retrieved successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching teaching subjects:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to retrieve teaching subjects',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/data/preferences
 * Retrieve all teaching preferences with optional search and category filter
 */
router.get(
  '/data/preferences',
  [
    query('search').optional().isString().trim().isLength({ max: 100 }),
    query('category').optional().isString().trim().isLength({ max: 50 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ErrorResponse = {
          success: false,
          error: 'Invalid search parameters',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { search, category } = req.query;
      let preferences = await dataSeederService.getTeachingPreferences();

      // Apply category filter if provided
      if (category && typeof category === 'string') {
        preferences = preferences.filter(
          (preference) =>
            preference.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Apply search filter if provided
      if (search && typeof search === 'string') {
        preferences = dataSeederService.searchData(preferences, search);
      }

      // Get unique categories for frontend filtering
      const allPreferences = await dataSeederService.getTeachingPreferences();
      const categories = [
        ...new Set(allPreferences.map((p) => p.category)),
      ].sort();

      const response: ApiResponse<{
        preferences: TeachingPreference[];
        count: number;
        categories: string[];
      }> = {
        success: true,
        data: {
          preferences,
          count: preferences.length,
          categories,
        },
        message: 'Teaching preferences retrieved successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching teaching preferences:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to retrieve teaching preferences',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/data/seed
 * Seed all predefined data collections (development/admin only)
 */
router.post(
  '/data/seed',
  async (req: Request, res: Response): Promise<void> => {
    try {
      // In production, this should be protected with admin authentication
      if (process.env.NODE_ENV === 'production') {
        const response: ErrorResponse = {
          success: false,
          error: 'Data seeding not allowed in production',
          timestamp: new Date().toISOString(),
        };
        res.status(403).json(response);
        return;
      }

      await dataSeederService.seedAllData();

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'All predefined data collections seeded successfully',
        },
        message: 'Data seeding completed',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error seeding data:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to seed data collections',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/data/search
 * Global search across all data collections
 */
router.get(
  '/data/search',
  [
    query('q').isString().trim().isLength({ min: 1, max: 100 }),
    query('types').optional().isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ErrorResponse = {
          success: false,
          error: 'Search query is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { q: searchTerm, types } = req.query;
      const searchTypes =
        typeof types === 'string'
          ? types.split(',')
          : ['states', 'subjects', 'preferences'];

      const results: {
        states?: GermanState[];
        subjects?: TeachingSubject[];
        preferences?: TeachingPreference[];
      } = {};

      // Search states
      if (searchTypes.includes('states')) {
        const states = await dataSeederService.getGermanStates();
        results.states = dataSeederService
          .searchData(states, searchTerm as string)
          .slice(0, 10);
      }

      // Search subjects
      if (searchTypes.includes('subjects')) {
        const subjects = await dataSeederService.getTeachingSubjects();
        results.subjects = dataSeederService
          .searchData(subjects, searchTerm as string)
          .slice(0, 10);
      }

      // Search preferences
      if (searchTypes.includes('preferences')) {
        const preferences = await dataSeederService.getTeachingPreferences();
        results.preferences = dataSeederService
          .searchData(preferences, searchTerm as string)
          .slice(0, 10);
      }

      const totalResults =
        (results.states?.length || 0) +
        (results.subjects?.length || 0) +
        (results.preferences?.length || 0);

      const response: ApiResponse<typeof results & { totalResults: number }> = {
        success: true,
        data: {
          ...results,
          totalResults,
        },
        message: `Found ${totalResults} results for "${searchTerm}"`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error performing global search:', error);

      const response: ErrorResponse = {
        success: false,
        error: 'Failed to perform search',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
);

export default router;
