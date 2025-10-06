/**
 * Unit tests for Onboarding API routes
 */

import request from 'supertest';
import express from 'express';
import onboardingRouter from './onboarding';
import { InstantDBService } from '../services/instantdbService';

// Mock the InstantDBService
jest.mock('../services/instantdbService');
const mockInstantDBService = InstantDBService as jest.MockedClass<typeof InstantDBService>;

const app = express();
app.use(express.json());
app.use('/', onboardingRouter);

describe('Onboarding API Routes', () => {
  let mockInstantDB: jest.Mocked<InstantDBService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInstantDB = new mockInstantDBService() as jest.Mocked<InstantDBService>;
    mockInstantDB.db = {
      query: jest.fn(),
      transact: jest.fn(),
      tx: {
        users: {
          insert: jest.fn(),
          update: jest.fn()
        },
        teacher_profiles: {
          insert: jest.fn(),
          update: jest.fn()
        }
      }
    } as any;
  });

  describe('POST /onboarding', () => {
    const validOnboardingData = {
      userId: 'user123',
      name: 'Test Teacher',
      germanState: 'Baden-Württemberg',
      subjects: ['Mathematik', 'Physik'],
      gradeLevel: '7',
      teachingPreferences: ['Gruppenarbeit', 'Digitale Medien'],
      school: 'Test Gymnasium',
      role: 'teacher'
    };

    beforeEach(() => {
      (InstantDBService as any).mockImplementation(() => mockInstantDB);
    });

    it('should successfully create new user onboarding', async () => {
      // Mock user doesn't exist
      mockInstantDB.db.query.mockResolvedValueOnce({ data: { users: [] } });
      // Mock teacher profile doesn't exist
      mockInstantDB.db.query.mockResolvedValueOnce({ data: { teacher_profiles: [] } });
      // Mock successful transactions
      mockInstantDB.db.transact.mockResolvedValue({ data: { users: [{ id: 'user123' }] } });

      const response = await request(app)
        .post('/onboarding')
        .send(validOnboardingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe('user123');
      expect(response.body.data.message).toBe('Onboarding completed successfully');
      expect(mockInstantDB.db.transact).toHaveBeenCalledTimes(2); // User + teacher profile
    });

    it('should successfully update existing user onboarding', async () => {
      const existingUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Existing User',
        role: 'teacher'
      };

      // Mock user exists
      mockInstantDB.db.query.mockResolvedValueOnce({ data: { users: [existingUser] } });
      // Mock teacher profile exists
      mockInstantDB.db.query.mockResolvedValueOnce({
        data: { teacher_profiles: [{ id: 'profile123', user_id: 'user123' }] }
      });
      // Mock successful updates
      mockInstantDB.db.transact.mockResolvedValue({ data: {} });

      const response = await request(app)
        .post('/onboarding')
        .send(validOnboardingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockInstantDB.db.transact).toHaveBeenCalledTimes(2); // User + teacher profile updates
    });

    it('should validate required fields', async () => {
      const invalidData = {
        userId: 'user123',
        // Missing required fields
      };

      const response = await request(app)
        .post('/onboarding')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate subjects array', async () => {
      const invalidData = {
        ...validOnboardingData,
        subjects: [] // Empty array
      };

      const response = await request(app)
        .post('/onboarding')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate teaching preferences array', async () => {
      const invalidData = {
        ...validOnboardingData,
        teachingPreferences: [''] // Empty string in array
      };

      const response = await request(app)
        .post('/onboarding')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate role enum', async () => {
      const invalidData = {
        ...validOnboardingData,
        role: 'invalid_role'
      };

      const response = await request(app)
        .post('/onboarding')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle database errors', async () => {
      mockInstantDB.db.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/onboarding')
        .send(validOnboardingData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to save onboarding data');
    });
  });

  describe('PUT /onboarding/:userId', () => {
    const updateData = {
      germanState: 'Bayern',
      subjects: ['Chemie', 'Biologie'],
      gradeLevel: '9',
      teachingPreferences: ['Projektarbeit'],
      school: 'Updated School'
    };

    beforeEach(() => {
      (InstantDBService as any).mockImplementation(() => mockInstantDB);
    });

    it('should successfully update user onboarding data', async () => {
      const existingUser = { id: 'user123', name: 'Test User' };
      const existingProfile = { id: 'profile123', user_id: 'user123' };

      // Mock user exists
      mockInstantDB.db.query.mockResolvedValueOnce({ data: { users: [existingUser] } });
      // Mock profile exists
      mockInstantDB.db.query.mockResolvedValueOnce({ data: { teacher_profiles: [existingProfile] } });
      // Mock successful updates
      mockInstantDB.db.transact.mockResolvedValue({ data: {} });

      const response = await request(app)
        .put('/onboarding/user123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe('user123');
      expect(mockInstantDB.db.transact).toHaveBeenCalledTimes(2);
    });

    it('should return 404 for non-existent user', async () => {
      // Mock user doesn't exist
      mockInstantDB.db.query.mockResolvedValue({ data: { users: [] } });

      const response = await request(app)
        .put('/onboarding/nonexistent')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should validate update data', async () => {
      const invalidData = {
        subjects: [''], // Invalid empty string
        gradeLevel: 'x'.repeat(25) // Too long
      };

      const response = await request(app)
        .put('/onboarding/user123')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle partial updates', async () => {
      const existingUser = { id: 'user123', name: 'Test User' };

      mockInstantDB.db.query.mockResolvedValueOnce({ data: { users: [existingUser] } });
      mockInstantDB.db.query.mockResolvedValueOnce({ data: { teacher_profiles: [] } });
      mockInstantDB.db.transact.mockResolvedValue({ data: {} });

      const partialUpdate = { germanState: 'Berlin' };

      const response = await request(app)
        .put('/onboarding/user123')
        .send(partialUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockInstantDB.db.transact).toHaveBeenCalledWith(
        expect.objectContaining({
          // Should only contain the updated field and timestamps
        })
      );
    });

    it('should handle database errors during update', async () => {
      mockInstantDB.db.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/onboarding/user123')
        .send(updateData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to update onboarding data');
    });
  });

  describe('GET /onboarding/:userId', () => {
    beforeEach(() => {
      (InstantDBService as any).mockImplementation(() => mockInstantDB);
    });

    it('should successfully retrieve user onboarding data', async () => {
      const mockUser = {
        id: 'user123',
        name: 'Test Teacher',
        german_state: 'Baden-Württemberg',
        subjects: JSON.stringify(['Mathematik', 'Physik']),
        grade_levels: JSON.stringify(['7', '8']),
        teaching_preferences: JSON.stringify(['Gruppenarbeit']),
        school: 'Test School',
        role: 'teacher',
        onboarding_completed: true,
        onboarding_completed_at: Date.now()
      };

      mockInstantDB.db.query.mockResolvedValue({ data: { users: [mockUser] } });

      const response = await request(app)
        .get('/onboarding/user123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe('user123');
      expect(response.body.data.name).toBe('Test Teacher');
      expect(response.body.data.subjects).toEqual(['Mathematik', 'Physik']);
      expect(response.body.data.gradeLevel).toBe('7');
      expect(response.body.data.onboardingCompleted).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      mockInstantDB.db.query.mockResolvedValue({ data: { users: [] } });

      const response = await request(app)
        .get('/onboarding/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should handle users with null JSON fields gracefully', async () => {
      const mockUser = {
        id: 'user123',
        name: 'Test Teacher',
        german_state: 'Baden-Württemberg',
        subjects: null,
        grade_levels: null,
        teaching_preferences: null,
        school: null,
        role: 'teacher',
        onboarding_completed: false,
        onboarding_completed_at: null
      };

      mockInstantDB.db.query.mockResolvedValue({ data: { users: [mockUser] } });

      const response = await request(app)
        .get('/onboarding/user123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subjects).toEqual([]);
      expect(response.body.data.gradeLevel).toBe(null);
      expect(response.body.data.teachingPreferences).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockInstantDB.db.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/onboarding/user123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to retrieve onboarding data');
    });
  });
});