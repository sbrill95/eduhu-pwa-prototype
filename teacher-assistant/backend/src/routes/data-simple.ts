/**
 * Simplified Data API Routes
 *
 * Minimal implementation to fix 404 errors with static data
 */

import { Router, Request, Response } from 'express';
import { ApiResponse, ErrorResponse } from '../types';

const router = Router();

// German states data - with proper structure for frontend
const GERMAN_STATES = [
  { id: 'bw', name: 'Baden-Württemberg', code: 'BW' },
  { id: 'by', name: 'Bayern', code: 'BY' },
  { id: 'be', name: 'Berlin', code: 'BE' },
  { id: 'bb', name: 'Brandenburg', code: 'BB' },
  { id: 'hb', name: 'Bremen', code: 'HB' },
  { id: 'hh', name: 'Hamburg', code: 'HH' },
  { id: 'he', name: 'Hessen', code: 'HE' },
  { id: 'mv', name: 'Mecklenburg-Vorpommern', code: 'MV' },
  { id: 'ni', name: 'Niedersachsen', code: 'NI' },
  { id: 'nw', name: 'Nordrhein-Westfalen', code: 'NW' },
  { id: 'rp', name: 'Rheinland-Pfalz', code: 'RP' },
  { id: 'sl', name: 'Saarland', code: 'SL' },
  { id: 'sn', name: 'Sachsen', code: 'SN' },
  { id: 'st', name: 'Sachsen-Anhalt', code: 'ST' },
  { id: 'sh', name: 'Schleswig-Holstein', code: 'SH' },
  { id: 'th', name: 'Thüringen', code: 'TH' },
];

// Teaching subjects data - static for immediate use
const TEACHING_SUBJECTS = [
  'Deutsch',
  'Mathematik',
  'Englisch',
  'Biologie',
  'Chemie',
  'Physik',
  'Geschichte',
  'Erdkunde',
  'Politik',
  'Wirtschaft',
  'Französisch',
  'Spanisch',
  'Latein',
  'Kunst',
  'Musik',
  'Sport',
  'Religion',
  'Ethik',
  'Philosophie',
  'Informatik',
  'Sachunterricht',
];

// Teaching preferences data - static for immediate use
const TEACHING_PREFERENCES = [
  'Frontalunterricht',
  'Gruppenarbeit',
  'Projektarbeit',
  'Partnerarbeit',
  'Einzelarbeit',
  'Stationenlernen',
  'Flipped Classroom',
  'Blended Learning',
  'Montessori-Pädagogik',
  'Waldorf-Pädagogik',
  'Konstruktivismus',
  'Differenzierung',
  'Inklusion',
  'Digitale Medien',
  'Interactive Whiteboards',
  'Gamification',
  'Formative Bewertung',
  'Summative Bewertung',
  'Peer Assessment',
  'Positive Verstärkung',
];

/**
 * GET /api/data/states
 * Retrieve all German states
 */
router.get(
  '/data/states',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { search } = req.query;

      // Filter states based on search query if provided
      let filteredStates = GERMAN_STATES;
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredStates = GERMAN_STATES.filter(
          (state) =>
            state.name.toLowerCase().includes(searchLower) ||
            state.code.toLowerCase().includes(searchLower)
        );
      }

      const response: ApiResponse<{
        states: typeof GERMAN_STATES;
        count: number;
      }> = {
        success: true,
        data: {
          states: filteredStates,
          count: filteredStates.length,
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
 * Retrieve all teaching subjects
 */
router.get(
  '/data/subjects',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const response: ApiResponse<string[]> = {
        success: true,
        data: TEACHING_SUBJECTS,
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
 * Retrieve all teaching preferences
 */
router.get(
  '/data/preferences',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const response: ApiResponse<string[]> = {
        success: true,
        data: TEACHING_PREFERENCES,
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

export default router;
