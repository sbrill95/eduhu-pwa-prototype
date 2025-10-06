/**
 * Profile Management Routes
 * Profile Redesign with Auto-Extraction Feature
 *
 * API endpoints for managing teacher profile characteristics:
 * - Auto-extraction from chat conversations (AI-powered)
 * - Manual characteristic addition
 * - Fetching profile characteristics for display
 * - Background categorization of uncategorized items
 */

import { Router, Request, Response } from 'express';
import { profileExtractionService } from '../services/profileExtractionService';
import { InstantDBService, getInstantDB, isInstantDBAvailable } from '../services/instantdbService';
import { findSimilarCharacteristics, mergeSimilarCharacteristics } from '../services/profileDeduplicationService';
import { logError, logInfo } from '../config/logger';

const router = Router();

/**
 * POST /api/profile/update-name
 * Update user's display name
 *
 * Request body:
 * - userId: string (required)
 * - name: string (required)
 *
 * Response:
 * - userId: string
 * - name: string
 * - message: string
 */
router.post('/update-name', async (req: Request, res: Response) => {
  try {
    const { userId, name } = req.body;

    // Validation: Check required fields
    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Fehlende Pflichtfelder: Benutzer-ID und Name sind erforderlich.',
      });
    }

    // Validation: Check name is not empty
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Der Name darf nicht leer sein.',
      });
    }

    // Check InstantDB availability
    if (!isInstantDBAvailable()) {
      logError(
        'InstantDB not available for name update',
        new Error('InstantDB not initialized')
      );
      return res.status(503).json({
        success: false,
        error: 'Datenbank ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
      });
    }

    logInfo('Updating user name', { userId, name });

    // Update user name via InstantDB
    const db = getInstantDB();
    await db.transact([
      db.tx.users[userId].update({
        name: name.trim(),
        last_active: Date.now(),
      })
    ]);

    logInfo('User name updated successfully', { userId, name });

    return res.json({
      success: true,
      data: {
        userId,
        name: name.trim(),
        message: 'Name erfolgreich aktualisiert.',
      },
    });
  } catch (error) {
    logError('Failed to update user name', error as Error);
    return res.status(500).json({
      success: false,
      error: 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    });
  }
});

/**
 * POST /api/profile/extract
 * Triggered after chat ends (≥2-3 messages)
 * Extracts 2-3 profile characteristics from chat conversation
 *
 * Request body:
 * - userId: string (required)
 * - messages: ChatMessage[] (required, min length 2)
 *
 * Response:
 * - extracted: ProfileCharacteristic[]
 * - count: number
 */
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const { userId, messages } = req.body;

    // Validation: Check required fields
    if (!userId || !messages) {
      return res.status(400).json({
        success: false,
        error: 'Fehlende Pflichtfelder: Benutzer-ID und Nachrichten sind erforderlich.',
      });
    }

    // Validation: Check minimum message count
    if (!Array.isArray(messages) || messages.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Mindestens 2 Nachrichten erforderlich für die Profil-Extraktion.',
      });
    }

    logInfo('Starting profile extraction', { userId, messageCount: messages.length });

    // Fetch existing profile characteristics (all, not filtered)
    const existingProfile = await InstantDBService.ProfileCharacteristics.getCharacteristics(userId, 0);

    // Extract characteristics using AI
    const extracted = await profileExtractionService.extractCharacteristics(
      userId,
      messages,
      existingProfile
    );

    logInfo('Profile extraction completed', { userId, extractedCount: extracted.length });

    return res.json({
      success: true,
      data: {
        extracted,
        count: extracted.length,
      },
    });
  } catch (error) {
    logError('Profile extraction failed', error as Error);
    return res.status(500).json({
      success: false,
      error: 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    });
  }
});

/**
 * GET /api/profile/characteristics
 * Fetch user's profile characteristics (for display)
 * Only returns characteristics with count >= 3 (threshold met)
 *
 * Query params:
 * - userId: string (required)
 *
 * Response:
 * - characteristics: ProfileCharacteristic[]
 */
router.get('/characteristics', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    // Validation: Check required field
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Fehlende oder ungültige Benutzer-ID.',
      });
    }

    logInfo('Fetching profile characteristics', { userId });

    // Fetch characteristics with count >= 3 OR manually_added = true
    // Manual tags should always be visible immediately
    const allCharacteristics = await InstantDBService.ProfileCharacteristics.getCharacteristics(
      userId,
      0 // Fetch all first
    );

    // Filter: count >= 3 OR manually_added
    const characteristics = allCharacteristics.filter(
      char => char.count >= 3 || char.manually_added
    );

    logInfo('Profile characteristics fetched', { userId, count: characteristics.length });

    return res.json({
      success: true,
      data: {
        characteristics,
      },
    });
  } catch (error) {
    logError('Failed to fetch profile characteristics', error as Error);
    return res.status(500).json({
      success: false,
      error: 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    });
  }
});

/**
 * POST /api/profile/characteristics/add
 * Manually add a characteristic (user input)
 * Creates with count=1, category=uncategorized (will be categorized later)
 *
 * Request body:
 * - userId: string (required)
 * - characteristic: string (required)
 *
 * Response:
 * - success: boolean
 */
router.post('/characteristics/add', async (req: Request, res: Response) => {
  try {
    const { userId, characteristic } = req.body;

    // Validation: Check required fields
    if (!userId || !characteristic) {
      return res.status(400).json({
        success: false,
        error: 'Fehlende Pflichtfelder: Benutzer-ID und Merkmal sind erforderlich.',
      });
    }

    // Validation: Check characteristic is not empty
    if (typeof characteristic !== 'string' || characteristic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Das Merkmal darf nicht leer sein.',
      });
    }

    // Check InstantDB availability
    if (!isInstantDBAvailable()) {
      logError(
        'InstantDB not available for manual characteristic add',
        new Error('InstantDB not initialized')
      );
      return res.status(503).json({
        success: false,
        error: 'Datenbank ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
      });
    }

    logInfo('Adding manual characteristic', { userId, characteristic });

    // Add manual characteristic via InstantDB service
    await InstantDBService.ProfileCharacteristics.addManualCharacteristic(
      userId,
      characteristic.trim()
    );

    logInfo('Manual characteristic added successfully', { userId, characteristic });

    return res.json({
      success: true,
      data: {
        userId,
        characteristic: characteristic.trim(),
      },
    });
  } catch (error) {
    logError('Failed to add manual characteristic', error as Error);
    return res.status(500).json({
      success: false,
      error: 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    });
  }
});

/**
 * POST /api/profile/characteristics/categorize
 * Background job: Re-categorize uncategorized characteristics
 * Fetches all uncategorized items and categorizes them via AI
 *
 * Request body:
 * - userId: string (required)
 *
 * Response:
 * - categorized: number (count of items categorized)
 */
router.post('/characteristics/categorize', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    // Validation: Check required field
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Fehlende Benutzer-ID.',
      });
    }

    // Check InstantDB availability
    if (!isInstantDBAvailable()) {
      logError(
        'InstantDB not available for categorization',
        new Error('InstantDB not initialized')
      );
      return res.status(503).json({
        success: false,
        error: 'Datenbank ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
      });
    }

    logInfo('Starting characteristic categorization', { userId });

    // Fetch all characteristics for this user (no min count filter)
    const allCharacteristics = await InstantDBService.ProfileCharacteristics.getCharacteristics(userId, 0);

    // Filter for uncategorized items
    const uncategorized = allCharacteristics.filter((char: any) => char.category === 'uncategorized');

    logInfo('Found uncategorized characteristics', { userId, count: uncategorized.length });

    // Categorize each uncategorized characteristic
    const db = getInstantDB();
    let categorizedCount = 0;

    for (const char of uncategorized) {
      try {
        // Get category via AI
        const category = await profileExtractionService.categorizeCharacteristic(char.characteristic);

        // Update in database
        await db.transact([
          db.tx.profile_characteristics[char.id].update({
            category,
            updated_at: Date.now(),
          })
        ]);

        logInfo('Characteristic categorized', {
          userId,
          characteristic: char.characteristic,
          category
        });

        categorizedCount++;
      } catch (error) {
        logError('Failed to categorize individual characteristic', error as Error, {
          userId,
          characteristicId: char.id,
          characteristic: char.characteristic
        });
        // Continue with next characteristic even if one fails
      }
    }

    logInfo('Categorization completed', { userId, categorizedCount });

    return res.json({
      success: true,
      data: {
        categorized: categorizedCount,
        total: uncategorized.length,
      },
    });
  } catch (error) {
    logError('Categorization failed', error as Error);
    return res.status(500).json({
      success: false,
      error: 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    });
  }
});

/**
 * POST /api/profile/characteristics/deduplicate
 * Automatically find and merge duplicate characteristics
 * Uses similarity detection to group and merge similar items
 *
 * Request body:
 * - userId: string (required)
 * - autoMerge: boolean (optional, default: false) - If true, automatically merges all found groups
 *
 * Response:
 * - groups: SimilarityGroup[] - Groups of similar characteristics
 * - mergedGroups: number - Number of groups merged (if autoMerge=true)
 * - totalMerged: number - Total characteristics merged (if autoMerge=true)
 */
router.post('/characteristics/deduplicate', async (req: Request, res: Response) => {
  try {
    const { userId, autoMerge = false } = req.body;

    // Validation: Check required field
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Fehlende Benutzer-ID.',
      });
    }

    // Check InstantDB availability
    if (!isInstantDBAvailable()) {
      logError(
        'InstantDB not available for deduplication',
        new Error('InstantDB not initialized')
      );
      return res.status(503).json({
        success: false,
        error: 'Datenbank ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
      });
    }

    logInfo('Starting characteristic deduplication', { userId, autoMerge });

    // Find similar characteristics
    const groups = await findSimilarCharacteristics(userId);

    logInfo('Found similarity groups', { userId, groupCount: groups.length });

    // If autoMerge is enabled, merge all groups
    if (autoMerge && groups.length > 0) {
      let mergedGroupsCount = 0;
      let totalMergedCount = 0;

      for (const group of groups) {
        try {
          const mergeIds = group.mergeCharacteristics.map((c) => c.id);
          await mergeSimilarCharacteristics(userId, group.keepCharacteristic.id, mergeIds);

          mergedGroupsCount++;
          totalMergedCount += mergeIds.length;

          logInfo('Group merged successfully', {
            userId,
            keepCharacteristic: group.keepCharacteristic.characteristic,
            mergedCount: mergeIds.length,
          });
        } catch (error) {
          logError('Failed to merge group', error as Error, {
            userId,
            keepCharacteristic: group.keepCharacteristic.characteristic,
          });
          // Continue with next group even if one fails
        }
      }

      logInfo('Auto-merge completed', {
        userId,
        mergedGroupsCount,
        totalMergedCount,
      });

      return res.json({
        success: true,
        data: {
          mergedGroups: mergedGroupsCount,
          totalMerged: totalMergedCount,
          totalGroups: groups.length,
        },
      });
    }

    // Return groups for manual review
    return res.json({
      success: true,
      data: {
        groups: groups.map((g) => ({
          keep: {
            id: g.keepCharacteristic.id,
            characteristic: g.keepCharacteristic.characteristic,
            count: g.keepCharacteristic.count,
            category: g.keepCharacteristic.category,
          },
          merge: g.mergeCharacteristics.map((c) => ({
            id: c.id,
            characteristic: c.characteristic,
            count: c.count,
            category: c.category,
          })),
          similarity: g.similarity,
          reason: g.reason,
        })),
        totalGroups: groups.length,
      },
    });
  } catch (error) {
    logError('Deduplication failed', error as Error);
    return res.status(500).json({
      success: false,
      error: 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    });
  }
});

/**
 * POST /api/profile/characteristics/merge
 * Manually merge specific characteristics
 *
 * Request body:
 * - userId: string (required)
 * - keepId: string (required) - ID of characteristic to keep
 * - mergeIds: string[] (required) - IDs of characteristics to merge into keepId
 *
 * Response:
 * - success: boolean
 */
router.post('/characteristics/merge', async (req: Request, res: Response) => {
  try {
    const { userId, keepId, mergeIds } = req.body;

    // Validation: Check required fields
    if (!userId || !keepId || !mergeIds) {
      return res.status(400).json({
        success: false,
        error: 'Fehlende Pflichtfelder: Benutzer-ID, Keep-ID und Merge-IDs sind erforderlich.',
      });
    }

    // Validation: Check mergeIds is array
    if (!Array.isArray(mergeIds) || mergeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Merge-IDs müssen ein nicht-leeres Array sein.',
      });
    }

    // Check InstantDB availability
    if (!isInstantDBAvailable()) {
      logError(
        'InstantDB not available for characteristic merge',
        new Error('InstantDB not initialized')
      );
      return res.status(503).json({
        success: false,
        error: 'Datenbank ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
      });
    }

    logInfo('Starting manual characteristic merge', { userId, keepId, mergeIds });

    // Merge characteristics
    await mergeSimilarCharacteristics(userId, keepId, mergeIds);

    logInfo('Manual merge completed successfully', {
      userId,
      keepId,
      mergedCount: mergeIds.length,
    });

    return res.json({
      success: true,
      data: {
        userId,
        keepId,
        mergedCount: mergeIds.length,
      },
    });
  } catch (error) {
    logError('Manual merge failed', error as Error);
    return res.status(500).json({
      success: false,
      error: 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
    });
  }
});

export default router;
