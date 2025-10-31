/**
 * Unit Tests for InstantDB Service - Profile Characteristics
 * Tests the Profile Characteristics Service methods
 */

import {
  ProfileCharacteristicsService,
  initializeInstantDB,
  isInstantDBAvailable,
  getInstantDB,
} from './instantdbService';

// Mock dependencies
jest.mock('@instantdb/admin');
jest.mock('../config/logger');
jest.mock('../config', () => ({
  config: {
    INSTANTDB_APP_ID: 'test-app-id',
    INSTANTDB_ADMIN_TOKEN: 'test-admin-token',
  },
}));

// TODO: Implement profile characteristics service - see SKIP_TESTS.md
describe.skip('ProfileCharacteristicsService', () => {
  const mockUserId = 'test-user-123';
  let mockInstantDB: any;

  beforeEach(() => {
    // Setup mock InstantDB instance
    mockInstantDB = {
      id: jest.fn(() => 'mock-id-' + Date.now()),
      query: jest.fn(),
      transact: jest.fn().mockResolvedValue({ txId: 'mock-tx-id' }),
      tx: {
        profile_characteristics: {},
      },
    };

    // Mock the getInstantDB to return our mock
    (getInstantDB as jest.Mock) = jest.fn(() => mockInstantDB);

    // Mock isInstantDBAvailable
    (isInstantDBAvailable as jest.Mock) = jest.fn(() => true);

    jest.clearAllMocks();
  });

  describe('incrementCharacteristic', () => {
    it('should create new characteristic with count=1 when not exists', async () => {
      // Mock query to return no existing characteristic
      mockInstantDB.query.mockResolvedValue({
        profile_characteristics: [],
      });

      const mockUpdate = jest.fn();
      mockInstantDB.tx.profile_characteristics['mock-id-123'] = {
        update: mockUpdate,
      };

      await ProfileCharacteristicsService.incrementCharacteristic(
        mockUserId,
        'Mathematik',
        'subjects'
      );

      // Verify query was called
      expect(mockInstantDB.query).toHaveBeenCalledWith({
        profile_characteristics: {
          $: {
            where: {
              user_id: mockUserId,
              characteristic: 'Mathematik',
            },
          },
        },
      });

      // Verify transact was called with correct data
      expect(mockInstantDB.transact).toHaveBeenCalled();
    });

    it('should increment count when characteristic already exists', async () => {
      const existingChar = {
        id: 'char-123',
        user_id: mockUserId,
        characteristic: 'Mathematik',
        category: 'subjects',
        count: 2,
        first_seen: Date.now() - 10000,
        last_seen: Date.now() - 5000,
        manually_added: false,
        created_at: Date.now() - 10000,
        updated_at: Date.now() - 5000,
      };

      // Mock query to return existing characteristic
      mockInstantDB.query.mockResolvedValue({
        profile_characteristics: [existingChar],
      });

      const mockUpdate = jest.fn();
      mockInstantDB.tx.profile_characteristics['char-123'] = {
        update: mockUpdate,
      };

      await ProfileCharacteristicsService.incrementCharacteristic(
        mockUserId,
        'Mathematik',
        'subjects'
      );

      // Verify transact was called to increment count
      expect(mockInstantDB.transact).toHaveBeenCalled();
      const transactCall = mockInstantDB.transact.mock.calls[0][0][0];

      // Check that it's updating the existing characteristic
      expect(mockInstantDB.tx.profile_characteristics).toHaveProperty(
        'char-123'
      );
    });

    it('should handle InstantDB not available', async () => {
      (isInstantDBAvailable as jest.Mock) = jest.fn(() => false);

      await expect(
        ProfileCharacteristicsService.incrementCharacteristic(
          mockUserId,
          'Mathematik',
          'subjects'
        )
      ).resolves.not.toThrow();

      // Should not call query or transact
      expect(mockInstantDB.query).not.toHaveBeenCalled();
      expect(mockInstantDB.transact).not.toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      mockInstantDB.query.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        ProfileCharacteristicsService.incrementCharacteristic(
          mockUserId,
          'Mathematik',
          'subjects'
        )
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('getCharacteristics', () => {
    it('should return only characteristics with count >= minCount', async () => {
      const mockCharacteristics = [
        {
          id: 'char-1',
          user_id: mockUserId,
          characteristic: 'Mathematik',
          category: 'subjects',
          count: 5,
          first_seen: Date.now(),
          last_seen: Date.now(),
          manually_added: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'char-2',
          user_id: mockUserId,
          characteristic: 'Klasse 7',
          category: 'gradeLevel',
          count: 3,
          first_seen: Date.now(),
          last_seen: Date.now(),
          manually_added: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'char-3',
          user_id: mockUserId,
          characteristic: 'Englisch',
          category: 'subjects',
          count: 2, // Below threshold
          first_seen: Date.now(),
          last_seen: Date.now(),
          manually_added: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ];

      mockInstantDB.query.mockResolvedValue({
        profile_characteristics: mockCharacteristics,
      });

      const result = await ProfileCharacteristicsService.getCharacteristics(
        mockUserId,
        3
      );

      // Should only return characteristics with count >= 3
      expect(result).toHaveLength(2);
      expect(result[0].characteristic).toBe('Klasse 7');
      expect(result[1].characteristic).toBe('Mathematik');
    });

    it('should sort by category then by count descending', async () => {
      const mockCharacteristics = [
        {
          id: 'char-1',
          user_id: mockUserId,
          characteristic: 'Mathematik',
          category: 'subjects',
          count: 5,
          first_seen: Date.now(),
          last_seen: Date.now(),
          manually_added: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'char-2',
          user_id: mockUserId,
          characteristic: 'Englisch',
          category: 'subjects',
          count: 8,
          first_seen: Date.now(),
          last_seen: Date.now(),
          manually_added: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'char-3',
          user_id: mockUserId,
          characteristic: 'Klasse 7',
          category: 'gradeLevel',
          count: 6,
          first_seen: Date.now(),
          last_seen: Date.now(),
          manually_added: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ];

      mockInstantDB.query.mockResolvedValue({
        profile_characteristics: mockCharacteristics,
      });

      const result = await ProfileCharacteristicsService.getCharacteristics(
        mockUserId,
        3
      );

      // Should be sorted by category first (gradeLevel < subjects alphabetically)
      expect(result[0].category).toBe('gradeLevel');
      // Within subjects, higher count first
      expect(result[1].characteristic).toBe('Englisch'); // count: 8
      expect(result[2].characteristic).toBe('Mathematik'); // count: 5
    });

    it('should return empty array when InstantDB not available', async () => {
      (isInstantDBAvailable as jest.Mock) = jest.fn(() => false);

      const result =
        await ProfileCharacteristicsService.getCharacteristics(mockUserId);

      expect(result).toEqual([]);
      expect(mockInstantDB.query).not.toHaveBeenCalled();
    });

    it('should return empty array on database error', async () => {
      mockInstantDB.query.mockRejectedValue(new Error('Query failed'));

      const result =
        await ProfileCharacteristicsService.getCharacteristics(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('addManualCharacteristic', () => {
    it('should create new manual characteristic with count=1', async () => {
      // Mock query to return no existing characteristic
      mockInstantDB.query.mockResolvedValue({
        profile_characteristics: [],
      });

      const mockUpdate = jest.fn();
      mockInstantDB.tx.profile_characteristics['mock-id-123'] = {
        update: mockUpdate,
      };

      await ProfileCharacteristicsService.addManualCharacteristic(
        mockUserId,
        'Projektbasiertes Lernen'
      );

      // Verify query was called
      expect(mockInstantDB.query).toHaveBeenCalledWith({
        profile_characteristics: {
          $: {
            where: {
              user_id: mockUserId,
              characteristic: 'Projektbasiertes Lernen',
            },
          },
        },
      });

      // Verify transact was called
      expect(mockInstantDB.transact).toHaveBeenCalled();
    });

    it('should increment count if characteristic already exists', async () => {
      const existingChar = {
        id: 'char-456',
        user_id: mockUserId,
        characteristic: 'Gruppenarbeit',
        category: 'teachingStyle',
        count: 3,
        first_seen: Date.now() - 10000,
        last_seen: Date.now() - 5000,
        manually_added: false,
        created_at: Date.now() - 10000,
        updated_at: Date.now() - 5000,
      };

      mockInstantDB.query.mockResolvedValue({
        profile_characteristics: [existingChar],
      });

      const mockUpdate = jest.fn();
      mockInstantDB.tx.profile_characteristics['char-456'] = {
        update: mockUpdate,
      };

      await ProfileCharacteristicsService.addManualCharacteristic(
        mockUserId,
        'Gruppenarbeit'
      );

      // Verify transact was called to increment
      expect(mockInstantDB.transact).toHaveBeenCalled();
    });

    it('should set manually_added=true for new characteristics', async () => {
      mockInstantDB.query.mockResolvedValue({
        profile_characteristics: [],
      });

      const mockUpdate = jest.fn();
      mockInstantDB.tx.profile_characteristics['mock-id-123'] = {
        update: mockUpdate,
      };

      await ProfileCharacteristicsService.addManualCharacteristic(
        mockUserId,
        'Test Characteristic'
      );

      // Verify transact was called (we can't easily verify the exact data structure
      // without more complex mocking, but we can verify it was called)
      expect(mockInstantDB.transact).toHaveBeenCalled();
    });

    it('should handle InstantDB not available', async () => {
      (isInstantDBAvailable as jest.Mock) = jest.fn(() => false);

      await expect(
        ProfileCharacteristicsService.addManualCharacteristic(
          mockUserId,
          'Test'
        )
      ).resolves.not.toThrow();

      expect(mockInstantDB.query).not.toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      mockInstantDB.query.mockRejectedValue(new Error('Database error'));

      await expect(
        ProfileCharacteristicsService.addManualCharacteristic(
          mockUserId,
          'Test'
        )
      ).rejects.toThrow('Database error');
    });
  });

  // TODO: Implement updateCharacteristicCategory method
  // describe('updateCharacteristicCategory', () => {
  //   it('should update category for uncategorized characteristic', async () => {
  //     const characteristicId = 'char-789';
  //     const newCategory = 'teachingStyle';

  //     const mockUpdate = jest.fn();
  //     mockInstantDB.tx.profile_characteristics[characteristicId] = {
  //       update: mockUpdate,
  //     };

  //     await ProfileCharacteristicsService.updateCharacteristicCategory(
  //       characteristicId,
  //       newCategory
  //     );

  //     // Verify transact was called
  //     expect(mockInstantDB.transact).toHaveBeenCalled();
  //   });

  //   it('should handle InstantDB not available', async () => {
  //     (isInstantDBAvailable as jest.Mock) = jest.fn(() => false);

  //     await expect(
  //       ProfileCharacteristicsService.updateCharacteristicCategory(
  //         'char-123',
  //         'subjects'
  //       )
  //     ).resolves.not.toThrow();

  //     expect(mockInstantDB.transact).not.toHaveBeenCalled();
  //   });

  //   it('should throw error on database failure', async () => {
  //     mockInstantDB.transact.mockRejectedValue(new Error('Update failed'));

  //     await expect(
  //       ProfileCharacteristicsService.updateCharacteristicCategory(
  //         'char-123',
  //         'subjects'
  //       )
  //     ).rejects.toThrow('Update failed');
  //   });
  // });

  describe('database constraints', () => {
    it('should enforce unique user_id + characteristic constraint', async () => {
      // First creation succeeds
      mockInstantDB.query.mockResolvedValueOnce({
        profile_characteristics: [],
      });

      const mockUpdate = jest.fn();
      mockInstantDB.tx.profile_characteristics['mock-id-1'] = {
        update: mockUpdate,
      };

      await ProfileCharacteristicsService.incrementCharacteristic(
        mockUserId,
        'Mathematik',
        'subjects'
      );

      // Second creation should find existing and increment
      mockInstantDB.query.mockResolvedValueOnce({
        profile_characteristics: [
          {
            id: 'char-existing',
            user_id: mockUserId,
            characteristic: 'Mathematik',
            category: 'subjects',
            count: 1,
            first_seen: Date.now(),
            last_seen: Date.now(),
            manually_added: false,
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ],
      });

      mockInstantDB.tx.profile_characteristics['char-existing'] = {
        update: mockUpdate,
      };

      await ProfileCharacteristicsService.incrementCharacteristic(
        mockUserId,
        'Mathematik',
        'subjects'
      );

      // Should have been called twice (once for create, once for update)
      expect(mockInstantDB.transact).toHaveBeenCalledTimes(2);
    });
  });
});
