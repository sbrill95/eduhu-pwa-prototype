import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useProfileCharacteristics, ProfileCharacteristic } from './useProfileCharacteristics';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth-context';

// Mock dependencies
vi.mock('../lib/api');
vi.mock('../lib/auth-context');

const mockApiClient = apiClient as any;
const mockUseAuth = useAuth as any;

describe('useProfileCharacteristics', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User'
  };

  const mockCharacteristics: ProfileCharacteristic[] = [
    {
      id: '1',
      user_id: 'test-user-123',
      characteristic: 'Mathematik',
      category: 'subjects',
      count: 5,
      first_seen: '2025-01-01T00:00:00Z',
      last_seen: '2025-01-10T00:00:00Z',
      manually_added: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-10T00:00:00Z'
    },
    {
      id: '2',
      user_id: 'test-user-123',
      characteristic: 'Klasse 7',
      category: 'gradeLevel',
      count: 3,
      first_seen: '2025-01-02T00:00:00Z',
      last_seen: '2025-01-08T00:00:00Z',
      manually_added: false,
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-08T00:00:00Z'
    },
    {
      id: '3',
      user_id: 'test-user-123',
      characteristic: 'Gruppenarbeit',
      category: 'teachingStyle',
      count: 4,
      first_seen: '2025-01-03T00:00:00Z',
      last_seen: '2025-01-09T00:00:00Z',
      manually_added: false,
      created_at: '2025-01-03T00:00:00Z',
      updated_at: '2025-01-09T00:00:00Z'
    },
    {
      id: '4',
      user_id: 'test-user-123',
      characteristic: 'Englisch',
      category: 'subjects',
      count: 3,
      first_seen: '2025-01-04T00:00:00Z',
      last_seen: '2025-01-07T00:00:00Z',
      manually_added: false,
      created_at: '2025-01-04T00:00:00Z',
      updated_at: '2025-01-07T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: user is authenticated
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
      signOut: vi.fn(),
      sendMagicCode: vi.fn(),
      signInWithMagicCode: vi.fn()
    });

    // Default mock: API returns characteristics
    mockApiClient.get.mockResolvedValue({
      characteristics: mockCharacteristics
    });
  });

  describe('Fetching characteristics', () => {
    test('fetches and sets characteristics correctly', async () => {
      const { result } = renderHook(() => useProfileCharacteristics());

      // Initial state
      expect(result.current.isLoading).toBe(true);

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.characteristics).toEqual(mockCharacteristics);
      expect(result.current.error).toBeNull();
      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/profile/characteristics?userId=${mockUser.id}`
      );
    });

    test('handles empty characteristics array', async () => {
      mockApiClient.get.mockResolvedValue({ characteristics: [] });

      const { result } = renderHook(() => useProfileCharacteristics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.characteristics).toEqual([]);
      expect(result.current.groupedCharacteristics).toEqual({});
    });

    test('handles unauthenticated user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
        signOut: vi.fn(),
        sendMagicCode: vi.fn(),
        signInWithMagicCode: vi.fn()
      });

      const { result } = renderHook(() => useProfileCharacteristics());

      // Should not fetch when user is null
      expect(mockApiClient.get).not.toHaveBeenCalled();
      expect(result.current.characteristics).toEqual([]);
    });

    test('handles API errors gracefully', async () => {
      const mockError = new Error('Network error');
      mockApiClient.get.mockRejectedValue(mockError);

      const { result } = renderHook(() => useProfileCharacteristics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.characteristics).toEqual([]);
    });
  });

  describe('Grouping by category', () => {
    test('groups characteristics by category correctly', async () => {
      const { result } = renderHook(() => useProfileCharacteristics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const grouped = result.current.groupedCharacteristics;

      // Check subjects category
      expect(grouped.subjects).toHaveLength(2);
      expect(grouped.subjects.map(c => c.characteristic)).toEqual(['Mathematik', 'Englisch']);

      // Check gradeLevel category
      expect(grouped.gradeLevel).toHaveLength(1);
      expect(grouped.gradeLevel[0].characteristic).toBe('Klasse 7');

      // Check teachingStyle category
      expect(grouped.teachingStyle).toHaveLength(1);
      expect(grouped.teachingStyle[0].characteristic).toBe('Gruppenarbeit');
    });

    test('returns empty object when no characteristics', async () => {
      mockApiClient.get.mockResolvedValue({ characteristics: [] });

      const { result } = renderHook(() => useProfileCharacteristics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.groupedCharacteristics).toEqual({});
    });

    test('handles single category correctly', async () => {
      const singleCategoryData: ProfileCharacteristic[] = [
        {
          id: '1',
          user_id: 'test-user-123',
          characteristic: 'Mathematik',
          category: 'subjects',
          count: 5,
          first_seen: '2025-01-01T00:00:00Z',
          last_seen: '2025-01-10T00:00:00Z',
          manually_added: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z'
        }
      ];

      mockApiClient.get.mockResolvedValue({ characteristics: singleCategoryData });

      const { result } = renderHook(() => useProfileCharacteristics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const grouped = result.current.groupedCharacteristics;
      expect(Object.keys(grouped)).toEqual(['subjects']);
      expect(grouped.subjects).toHaveLength(1);
    });
  });

  describe('Adding characteristics', () => {
    test('addCharacteristic calls API and refetches', async () => {
      const { result } = renderHook(() => useProfileCharacteristics());

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Reset mock to track refetch
      mockApiClient.get.mockClear();

      // Add new characteristic
      await act(async () => {
        await result.current.addCharacteristic('Projektbasiertes Lernen');
      });

      // Should call POST endpoint
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/profile/characteristics/add',
        {
          userId: mockUser.id,
          characteristic: 'Projektbasiertes Lernen'
        }
      );

      // Should refetch characteristics
      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/profile/characteristics?userId=${mockUser.id}`
      );
    });

    test('addCharacteristic trims whitespace', async () => {
      const { result } = renderHook(() => useProfileCharacteristics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addCharacteristic('  SOL  ');
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/profile/characteristics/add',
        {
          userId: mockUser.id,
          characteristic: 'SOL'
        }
      );
    });

    test('addCharacteristic throws error when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
        signOut: vi.fn(),
        sendMagicCode: vi.fn(),
        signInWithMagicCode: vi.fn()
      });

      const { result } = renderHook(() => useProfileCharacteristics());

      await expect(async () => {
        await act(async () => {
          await result.current.addCharacteristic('Test');
        });
      }).rejects.toThrow('User ID and characteristic text are required');
    });

    test('addCharacteristic throws error when text is empty', async () => {
      const { result } = renderHook(() => useProfileCharacteristics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.addCharacteristic('   ');
        });
      }).rejects.toThrow('User ID and characteristic text are required');
    });

    test('addCharacteristic handles API errors', async () => {
      const mockError = new Error('Failed to add characteristic');
      mockApiClient.post.mockRejectedValue(mockError);

      const { result } = renderHook(() => useProfileCharacteristics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let thrownError: Error | undefined;

      await act(async () => {
        try {
          await result.current.addCharacteristic('Test');
        } catch (err) {
          thrownError = err as Error;
        }
      });

      // Verify error was thrown
      expect(thrownError?.message).toBe('Failed to add characteristic');

      // Verify error state is set
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      }, { timeout: 3000 });

      expect(result.current.error?.message).toBe('Failed to add characteristic');
    });
  });

  describe('Loading states', () => {
    test('sets loading state correctly during fetch', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      mockApiClient.get.mockReturnValue(fetchPromise as any);

      const { result } = renderHook(() => useProfileCharacteristics());

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);

      // Resolve the fetch
      await act(async () => {
        resolveFetch!({ characteristics: mockCharacteristics });
        await fetchPromise;
      });

      // Should not be loading after fetch completes
      expect(result.current.isLoading).toBe(false);
    });

    test('sets loading state correctly during addCharacteristic', async () => {
      const { result } = renderHook(() => useProfileCharacteristics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let resolveAdd: (value: any) => void;
      const addPromise = new Promise((resolve) => {
        resolveAdd = resolve;
      });

      mockApiClient.post.mockReturnValue(addPromise as any);

      // Start adding
      act(() => {
        result.current.addCharacteristic('Test');
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve the add
      await act(async () => {
        resolveAdd!({ success: true });
        await addPromise;
      });

      // Should not be loading after add completes
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Refetch', () => {
    test('refetch calls fetchCharacteristics', async () => {
      const { result } = renderHook(() => useProfileCharacteristics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear previous calls
      mockApiClient.get.mockClear();

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      // Should fetch again
      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/profile/characteristics?userId=${mockUser.id}`
      );
    });
  });
});
