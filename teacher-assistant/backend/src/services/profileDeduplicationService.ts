/**
 * Profile Deduplication Service
 * Merges duplicate profile characteristics using string similarity algorithms
 *
 * Handles duplicates like:
 * - Different casing (SOL, sol)
 * - Typos (Selbstorganisiretes lernen vs Selbstorganisiertes Lernen)
 * - Abbreviations (SOL vs Selbstorganisiertes Lernen)
 * - Different capitalization (projektbasiertes Lernen, Projektbasiertes Lernen)
 */

import { compareTwoStrings } from 'string-similarity';
import { ProfileCharacteristic } from '../schemas/instantdb';
import {
  InstantDBService,
  getInstantDB,
  isInstantDBAvailable,
} from './instantdbService';
import { logError, logInfo } from '../config/logger';

/**
 * Similarity threshold for merging characteristics
 * 0.8 = 80% similarity required for merge consideration
 */
const SIMILARITY_THRESHOLD = 0.8;

/**
 * Common abbreviations mapping for German educational terms
 */
const ABBREVIATION_MAP: Record<string, string> = {
  sol: 'Selbstorganisiertes Lernen',
  's.o.l': 'Selbstorganisiertes Lernen',
  's.o.l.': 'Selbstorganisiertes Lernen',
  pbl: 'Projektbasiertes Lernen',
  'p.b.l': 'Projektbasiertes Lernen',
  'p.b.l.': 'Projektbasiertes Lernen',
  gk: 'Grundkurs',
  lk: 'Leistungskurs',
  mathe: 'Mathematik',
  bio: 'Biologie',
  geo: 'Geographie',
  sowi: 'Sozialwissenschaften',
  powi: 'Politikwissenschaften',
  reli: 'Religion',
  pädagogik: 'Pädagogik',
  päda: 'Pädagogik',
};

/**
 * Group of similar characteristics that should be merged
 */
export interface SimilarityGroup {
  /**
   * The characteristic to keep (highest count or longest name)
   */
  keepCharacteristic: ProfileCharacteristic;

  /**
   * Characteristics to merge into keepCharacteristic
   */
  mergeCharacteristics: ProfileCharacteristic[];

  /**
   * Similarity score (0-1)
   */
  similarity: number;

  /**
   * Reason for grouping
   */
  reason: 'abbreviation' | 'typo' | 'casing' | 'similarity';
}

/**
 * Normalizes a string for comparison
 * - Lowercase
 * - Trim whitespace
 * - Remove extra spaces
 */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Checks if two characteristics are abbreviation matches
 */
function isAbbreviationMatch(str1: string, str2: string): boolean {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);

  // Check both directions
  if (
    ABBREVIATION_MAP[norm1] &&
    normalizeString(ABBREVIATION_MAP[norm1]) === norm2
  ) {
    return true;
  }
  if (
    ABBREVIATION_MAP[norm2] &&
    normalizeString(ABBREVIATION_MAP[norm2]) === norm1
  ) {
    return true;
  }

  return false;
}

/**
 * Calculates similarity between two characteristics
 * Returns a score between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(
  char1: ProfileCharacteristic,
  char2: ProfileCharacteristic
): {
  score: number;
  reason: 'abbreviation' | 'typo' | 'casing' | 'similarity';
} {
  const str1 = char1.characteristic;
  const str2 = char2.characteristic;

  // Exact match (after normalization)
  if (normalizeString(str1) === normalizeString(str2)) {
    return { score: 1.0, reason: 'casing' };
  }

  // Abbreviation match
  if (isAbbreviationMatch(str1, str2)) {
    return { score: 1.0, reason: 'abbreviation' };
  }

  // Levenshtein distance-based similarity
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  const score = compareTwoStrings(norm1, norm2);

  // Determine reason based on score
  let reason: 'abbreviation' | 'typo' | 'casing' | 'similarity' = 'similarity';
  if (score >= 0.9) {
    reason = 'typo'; // Very similar, likely a typo
  } else if (score >= SIMILARITY_THRESHOLD) {
    reason = 'similarity'; // Similar enough
  }

  return { score, reason };
}

/**
 * Determines which characteristic to keep when merging
 * Priority:
 * 1. Highest count
 * 2. Longest name (prefer full name over abbreviation)
 * 3. Non-manually added (prefer AI-extracted)
 */
function selectKeepCharacteristic(
  chars: ProfileCharacteristic[]
): ProfileCharacteristic {
  return chars.reduce((best, current) => {
    // Higher count wins
    if (current.count > best.count) return current;
    if (current.count < best.count) return best;

    // Longer name wins (prefer full name over abbreviation)
    if (current.characteristic.length > best.characteristic.length)
      return current;
    if (current.characteristic.length < best.characteristic.length) return best;

    // Prefer AI-extracted over manual
    if (!current.manually_added && best.manually_added) return current;
    if (current.manually_added && !best.manually_added) return best;

    // Older characteristic wins (first seen)
    if (current.first_seen < best.first_seen) return current;

    return best;
  });
}

/**
 * Finds groups of similar characteristics for a user
 * @param userId - User ID
 * @returns Array of similarity groups
 */
export async function findSimilarCharacteristics(
  userId: string
): Promise<SimilarityGroup[]> {
  if (!isInstantDBAvailable()) {
    const error = new Error('InstantDB not initialized');
    logError('InstantDB not available for similarity detection', error);
    throw error;
  }

  try {
    // Fetch all characteristics for this user (no min count filter)
    const allCharacteristics =
      await InstantDBService.ProfileCharacteristics.getCharacteristics(
        userId,
        0
      );

    logInfo('Finding similar characteristics', {
      userId,
      totalCharacteristics: allCharacteristics.length,
    });

    const groups: SimilarityGroup[] = [];
    const processed = new Set<string>();

    // Compare each characteristic with every other characteristic
    for (let i = 0; i < allCharacteristics.length; i++) {
      const char1 = allCharacteristics[i];

      // Skip if already processed
      if (processed.has(char1.id)) continue;

      const similar: ProfileCharacteristic[] = [char1];
      let maxSimilarity = 0;
      let groupReason: 'abbreviation' | 'typo' | 'casing' | 'similarity' =
        'similarity';

      // Find all similar characteristics
      for (let j = i + 1; j < allCharacteristics.length; j++) {
        const char2 = allCharacteristics[j];

        // Skip if already processed
        if (processed.has(char2.id)) continue;

        // Calculate similarity
        const { score, reason } = calculateSimilarity(char1, char2);

        if (score >= SIMILARITY_THRESHOLD) {
          similar.push(char2);
          if (score > maxSimilarity) {
            maxSimilarity = score;
            groupReason = reason;
          }
        }
      }

      // If we found similar characteristics, create a group
      if (similar.length > 1) {
        const keepCharacteristic = selectKeepCharacteristic(similar);
        const mergeCharacteristics = similar.filter(
          (c) => c.id !== keepCharacteristic.id
        );

        groups.push({
          keepCharacteristic,
          mergeCharacteristics,
          similarity: maxSimilarity,
          reason: groupReason,
        });

        // Mark all as processed
        similar.forEach((c) => processed.add(c.id));

        logInfo('Found similarity group', {
          userId,
          keep: keepCharacteristic.characteristic,
          merge: mergeCharacteristics.map((c) => c.characteristic),
          similarity: maxSimilarity,
          reason: groupReason,
        });
      }
    }

    logInfo('Similarity detection completed', {
      userId,
      totalGroups: groups.length,
      totalCharacteristics: allCharacteristics.length,
    });

    return groups;
  } catch (error) {
    logError('Failed to find similar characteristics', error as Error, {
      userId,
    });
    throw error;
  }
}

/**
 * Merges similar characteristics into a single characteristic
 * @param userId - User ID
 * @param keepId - ID of characteristic to keep
 * @param mergeIds - IDs of characteristics to merge into keepId
 */
export async function mergeSimilarCharacteristics(
  userId: string,
  keepId: string,
  mergeIds: string[]
): Promise<void> {
  if (!isInstantDBAvailable()) {
    const error = new Error('InstantDB not initialized');
    logError('InstantDB not available for characteristic merge', error);
    throw error;
  }

  try {
    logInfo('Starting characteristic merge', { userId, keepId, mergeIds });

    // Fetch all characteristics involved
    const allCharacteristics =
      await InstantDBService.ProfileCharacteristics.getCharacteristics(
        userId,
        0
      );
    const keepChar = allCharacteristics.find((c) => c.id === keepId);
    const mergeChars = allCharacteristics.filter((c) =>
      mergeIds.includes(c.id)
    );

    if (!keepChar) {
      throw new Error(`Keep characteristic not found: ${keepId}`);
    }

    if (mergeChars.length !== mergeIds.length) {
      throw new Error('Some merge characteristics not found');
    }

    // Calculate merged data
    const totalCount = mergeChars.reduce(
      (sum, char) => sum + char.count,
      keepChar.count
    );
    const earliestFirstSeen = Math.min(
      keepChar.first_seen,
      ...mergeChars.map((c) => c.first_seen)
    );
    const latestLastSeen = Math.max(
      keepChar.last_seen,
      ...mergeChars.map((c) => c.last_seen)
    );

    const db = getInstantDB();
    const now = Date.now();

    // Update the keep characteristic with merged data
    await db.transact([
      db.tx.profile_characteristics[keepId].update({
        count: totalCount,
        first_seen: earliestFirstSeen,
        last_seen: latestLastSeen,
        updated_at: now,
      }),
    ]);

    logInfo('Keep characteristic updated', {
      userId,
      keepId,
      characteristic: keepChar.characteristic,
      newCount: totalCount,
    });

    // Delete the merged characteristics
    const deleteTransactions = mergeIds.map((id) =>
      db.tx.profile_characteristics[id].delete()
    );

    await db.transact(deleteTransactions);

    logInfo('Merged characteristics deleted', {
      userId,
      deletedIds: mergeIds,
      deletedCount: mergeIds.length,
    });

    logInfo('Characteristic merge completed successfully', {
      userId,
      keepId,
      mergedCount: mergeIds.length,
      totalCount,
    });
  } catch (error) {
    logError('Failed to merge characteristics', error as Error, {
      userId,
      keepId,
      mergeIds,
    });
    throw error;
  }
}

/**
 * Checks for similar characteristics before adding a new one
 * If similarity > threshold, returns the existing characteristic ID
 * Otherwise, returns null (indicating a new characteristic should be created)
 *
 * @param userId - User ID
 * @param characteristic - New characteristic text
 * @returns Existing characteristic ID if similar found, null otherwise
 */
export async function findSimilarExisting(
  userId: string,
  characteristic: string
): Promise<string | null> {
  if (!isInstantDBAvailable()) {
    return null;
  }

  try {
    // Fetch all characteristics for this user
    const allCharacteristics =
      await InstantDBService.ProfileCharacteristics.getCharacteristics(
        userId,
        0
      );

    // Normalize the new characteristic
    const normalizedNew = normalizeString(characteristic);

    // Check for exact match (after normalization)
    for (const existing of allCharacteristics) {
      const normalizedExisting = normalizeString(existing.characteristic);

      if (normalizedNew === normalizedExisting) {
        logInfo('Found exact match for new characteristic', {
          userId,
          newCharacteristic: characteristic,
          existingCharacteristic: existing.characteristic,
          existingId: existing.id,
        });
        return existing.id;
      }
    }

    // Check for abbreviation match
    for (const existing of allCharacteristics) {
      if (isAbbreviationMatch(characteristic, existing.characteristic)) {
        logInfo('Found abbreviation match for new characteristic', {
          userId,
          newCharacteristic: characteristic,
          existingCharacteristic: existing.characteristic,
          existingId: existing.id,
        });
        return existing.id;
      }
    }

    // Check for similarity match
    for (const existing of allCharacteristics) {
      const similarity = compareTwoStrings(
        normalizedNew,
        normalizeString(existing.characteristic)
      );

      if (similarity >= SIMILARITY_THRESHOLD) {
        logInfo('Found similarity match for new characteristic', {
          userId,
          newCharacteristic: characteristic,
          existingCharacteristic: existing.characteristic,
          existingId: existing.id,
          similarity,
        });
        return existing.id;
      }
    }

    // No similar characteristic found
    return null;
  } catch (error) {
    logError('Failed to find similar existing characteristic', error as Error, {
      userId,
      characteristic,
    });
    return null;
  }
}

export default {
  findSimilarCharacteristics,
  mergeSimilarCharacteristics,
  findSimilarExisting,
};
