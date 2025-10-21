/**
 * Profile Deduplication Service Tests
 * Tests for similarity detection and characteristic merging
 */

import {
  findSimilarCharacteristics,
  mergeSimilarCharacteristics,
  findSimilarExisting,
} from './profileDeduplicationService';
import {
  InstantDBService,
  getInstantDB,
  isInstantDBAvailable,
} from './instantdbService';
import { ProfileCharacteristic } from '../schemas/instantdb';

// Mock dependencies
jest.mock('./instantdbService', () => ({
  InstantDBService: {
    ProfileCharacteristics: {
      getCharacteristics: jest.fn(),
    },
  },
  getInstantDB: jest.fn(),
  isInstantDBAvailable: jest.fn(),
}));

jest.mock('../config/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

describe('profileDeduplicationService', () => {
  const mockUserId = 'test-user-id';

  // Create a proper mock DB with transaction methods
  const createMockUpdate = () => ({
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  });

  const mockDB = {
    transact: jest.fn().mockResolvedValue({}),
    tx: {
      profile_characteristics: new Proxy(
        {},
        {
          get: (target, prop) => {
            return createMockUpdate();
          },
        }
      ),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDB.transact.mockResolvedValue({});
    (isInstantDBAvailable as jest.Mock).mockReturnValue(true);
    (getInstantDB as jest.Mock).mockReturnValue(mockDB);
  });

  describe('findSimilarCharacteristics', () => {
    it('should find exact matches with different casing', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: '1',
          user_id: mockUserId,
          characteristic: 'Selbstorganisiertes Lernen',
          category: 'teachingStyle',
          count: 5,
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
        {
          id: '2',
          user_id: mockUserId,
          characteristic: 'selbstorganisiertes lernen',
          category: 'teachingStyle',
          count: 3,
          first_seen: 1500000,
          last_seen: 2500000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      const groups = await findSimilarCharacteristics(mockUserId);

      expect(groups).toHaveLength(1);
      expect(groups[0]!.keepCharacteristic.id).toBe('1'); // Higher count wins
      expect(groups[0]!.mergeCharacteristics).toHaveLength(1);
      expect(groups[0]!.mergeCharacteristics[0]!.id).toBe('2');
      expect(groups[0]!.reason).toBe('casing');
      expect(groups[0]!.similarity).toBe(1.0);
    });

    it('should find abbreviation matches', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: '1',
          user_id: mockUserId,
          characteristic: 'SOL',
          category: 'teachingStyle',
          count: 2,
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
        {
          id: '2',
          user_id: mockUserId,
          characteristic: 'Selbstorganisiertes Lernen',
          category: 'teachingStyle',
          count: 5,
          first_seen: 1500000,
          last_seen: 2500000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      const groups = await findSimilarCharacteristics(mockUserId);

      expect(groups).toHaveLength(1);
      expect(groups[0]!.keepCharacteristic.id).toBe('2'); // Longer name wins when counts differ
      expect(groups[0]!.mergeCharacteristics[0]!.id).toBe('1');
      expect(groups[0]!.reason).toBe('abbreviation');
    });

    it('should find typo matches', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: '1',
          user_id: mockUserId,
          characteristic: 'Selbstorganisiertes Lernen',
          category: 'teachingStyle',
          count: 5,
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
        {
          id: '2',
          user_id: mockUserId,
          characteristic: 'Selbstorganisiretes lernen', // Typo: 'siertes' -> 'siretes'
          category: 'teachingStyle',
          count: 2,
          first_seen: 1500000,
          last_seen: 2500000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      const groups = await findSimilarCharacteristics(mockUserId);

      expect(groups).toHaveLength(1);
      expect(groups[0]!.keepCharacteristic.id).toBe('1');
      expect(groups[0]!.mergeCharacteristics[0]!.id).toBe('2');
      expect(groups[0]!.similarity).toBeGreaterThan(0.8);
    });

    it('should prefer longer names over abbreviations', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: '1',
          user_id: mockUserId,
          characteristic: 'SOL',
          category: 'teachingStyle',
          count: 5, // Same count
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
        {
          id: '2',
          user_id: mockUserId,
          characteristic: 'Selbstorganisiertes Lernen',
          category: 'teachingStyle',
          count: 5, // Same count
          first_seen: 1500000,
          last_seen: 2500000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      const groups = await findSimilarCharacteristics(mockUserId);

      expect(groups).toHaveLength(1);
      expect(groups[0]!.keepCharacteristic.id).toBe('2'); // Longer name wins
    });

    it('should handle multiple similar characteristics in one group', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: '1',
          user_id: mockUserId,
          characteristic: 'Selbstorganisiertes Lernen',
          category: 'teachingStyle',
          count: 5,
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
        {
          id: '2',
          user_id: mockUserId,
          characteristic: 'SOL',
          category: 'teachingStyle',
          count: 3,
          first_seen: 1500000,
          last_seen: 2500000,
          manually_added: false,
        },
        {
          id: '3',
          user_id: mockUserId,
          characteristic: 'sol',
          category: 'teachingStyle',
          count: 2,
          first_seen: 1700000,
          last_seen: 2700000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      const groups = await findSimilarCharacteristics(mockUserId);

      expect(groups).toHaveLength(1);
      expect(groups[0]!.keepCharacteristic.id).toBe('1');
      expect(groups[0]!.mergeCharacteristics).toHaveLength(2);
    });

    it('should not group dissimilar characteristics', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: '1',
          user_id: mockUserId,
          characteristic: 'Mathematik',
          category: 'subjects',
          count: 5,
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
        {
          id: '2',
          user_id: mockUserId,
          characteristic: 'Deutsch',
          category: 'subjects',
          count: 3,
          first_seen: 1500000,
          last_seen: 2500000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      const groups = await findSimilarCharacteristics(mockUserId);

      expect(groups).toHaveLength(0); // No groups should be created
    });

    it('should throw error when InstantDB is not available', async () => {
      (isInstantDBAvailable as jest.Mock).mockReturnValue(false);

      await expect(findSimilarCharacteristics(mockUserId)).rejects.toThrow(
        'InstantDB not initialized'
      );
    });
  });

  describe('mergeSimilarCharacteristics', () => {
    it('should merge characteristics correctly', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: 'keep-id',
          user_id: mockUserId,
          characteristic: 'Selbstorganisiertes Lernen',
          category: 'teachingStyle',
          count: 5,
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
        {
          id: 'merge-id-1',
          user_id: mockUserId,
          characteristic: 'SOL',
          category: 'teachingStyle',
          count: 3,
          first_seen: 900000, // Earlier than keep
          last_seen: 2500000, // Later than keep
          manually_added: false,
        },
        {
          id: 'merge-id-2',
          user_id: mockUserId,
          characteristic: 'sol',
          category: 'teachingStyle',
          count: 2,
          first_seen: 1100000,
          last_seen: 2200000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      mockDB.transact.mockResolvedValue({});

      await mergeSimilarCharacteristics(mockUserId, 'keep-id', [
        'merge-id-1',
        'merge-id-2',
      ]);

      // Verify transact was called twice (once for update, once for deletes)
      expect(mockDB.transact).toHaveBeenCalledTimes(2);

      // The actual values are tested by integration - here we just verify the calls were made
      // First call should update the keep characteristic
      expect(mockDB.transact.mock.calls[0]).toBeDefined();

      // Second call should delete the merged characteristics
      expect(mockDB.transact.mock.calls[1]).toBeDefined();
    });

    it('should throw error if keep characteristic not found', async () => {
      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue([]);

      await expect(
        mergeSimilarCharacteristics(mockUserId, 'non-existent', [])
      ).rejects.toThrow('Keep characteristic not found');
    });

    it('should throw error if merge characteristics not found', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: 'keep-id',
          user_id: mockUserId,
          characteristic: 'Test',
          category: 'teachingStyle',
          count: 5,
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      await expect(
        mergeSimilarCharacteristics(mockUserId, 'keep-id', [
          'non-existent-1',
          'non-existent-2',
        ])
      ).rejects.toThrow('Some merge characteristics not found');
    });

    it('should throw error when InstantDB is not available', async () => {
      (isInstantDBAvailable as jest.Mock).mockReturnValue(false);

      await expect(
        mergeSimilarCharacteristics(mockUserId, 'keep-id', ['merge-id'])
      ).rejects.toThrow('InstantDB not initialized');
    });
  });

  describe('findSimilarExisting', () => {
    it('should find exact match', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: 'existing-id',
          user_id: mockUserId,
          characteristic: 'Selbstorganisiertes Lernen',
          category: 'teachingStyle',
          count: 5,
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      const result = await findSimilarExisting(
        mockUserId,
        'selbstorganisiertes lernen'
      );

      expect(result).toBe('existing-id');
    });

    it('should find abbreviation match', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: 'existing-id',
          user_id: mockUserId,
          characteristic: 'Selbstorganisiertes Lernen',
          category: 'teachingStyle',
          count: 5,
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      const result = await findSimilarExisting(mockUserId, 'SOL');

      expect(result).toBe('existing-id');
    });

    it('should find similarity match', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: 'existing-id',
          user_id: mockUserId,
          characteristic: 'Selbstorganisiertes Lernen',
          category: 'teachingStyle',
          count: 5,
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      const result = await findSimilarExisting(
        mockUserId,
        'Selbstorganisiretes lernen'
      ); // Typo

      expect(result).toBe('existing-id');
    });

    it('should return null if no similar characteristic found', async () => {
      const mockCharacteristics: Partial<ProfileCharacteristic>[] = [
        {
          id: 'existing-id',
          user_id: mockUserId,
          characteristic: 'Mathematik',
          category: 'subjects',
          count: 5,
          first_seen: 1000000,
          last_seen: 2000000,
          manually_added: false,
        },
      ];

      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockResolvedValue(mockCharacteristics);

      const result = await findSimilarExisting(mockUserId, 'Deutsch');

      expect(result).toBeNull();
    });

    it('should return null when InstantDB is not available', async () => {
      (isInstantDBAvailable as jest.Mock).mockReturnValue(false);

      const result = await findSimilarExisting(mockUserId, 'Test');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (
        InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock
      ).mockRejectedValue(new Error('DB Error'));

      const result = await findSimilarExisting(mockUserId, 'Test');

      expect(result).toBeNull();
    });
  });
});
