/**
 * Profile Routes Tests
 * Tests for Profile Redesign with Auto-Extraction API endpoints
 */

import request from 'supertest';
import express from 'express';
import profileRouter from './profile';
import { profileExtractionService } from '../services/profileExtractionService';
import { InstantDBService, isInstantDBAvailable, getInstantDB } from '../services/instantdbService';

// Mock dependencies
jest.mock('../services/profileExtractionService');
jest.mock('../services/instantdbService');
jest.mock('../config/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/profile', profileRouter);

describe('POST /profile/extract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract characteristics with valid request', async () => {
    // Mock data
    const mockUserId = 'user123';
    const mockMessages = [
      { role: 'user', content: 'Ich unterrichte Mathematik in Klasse 7' },
      { role: 'assistant', content: 'Das klingt interessant!' },
    ];
    const mockExistingProfile = [
      {
        id: '1',
        user_id: mockUserId,
        characteristic: 'Mathematik',
        category: 'subjects',
        count: 2,
        first_seen: Date.now(),
        last_seen: Date.now(),
        manually_added: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    ];
    const mockExtracted = [
      { characteristic: 'Klasse 7', category: 'gradeLevel' },
      { characteristic: 'Mathematik', category: 'subjects' },
    ];

    // Mock service methods
    (InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock).mockResolvedValue(
      mockExistingProfile
    );
    (profileExtractionService.extractCharacteristics as jest.Mock).mockResolvedValue(mockExtracted);

    // Make request
    const response = await request(app)
      .post('/profile/extract')
      .send({ userId: mockUserId, messages: mockMessages });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.extracted).toEqual(mockExtracted);
    expect(response.body.data.count).toBe(2);
    expect(InstantDBService.ProfileCharacteristics.getCharacteristics).toHaveBeenCalledWith(
      mockUserId,
      0
    );
    expect(profileExtractionService.extractCharacteristics).toHaveBeenCalledWith(
      mockUserId,
      mockMessages,
      mockExistingProfile
    );
  });

  it('should return 400 with missing userId', async () => {
    const response = await request(app)
      .post('/profile/extract')
      .send({ messages: [] });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Pflichtfelder');
  });

  it('should return 400 with missing messages', async () => {
    const response = await request(app)
      .post('/profile/extract')
      .send({ userId: 'user123' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Pflichtfelder');
  });

  it('should return 400 with insufficient messages (< 2)', async () => {
    const response = await request(app)
      .post('/profile/extract')
      .send({
        userId: 'user123',
        messages: [{ role: 'user', content: 'Hello' }],
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Mindestens 2 Nachrichten');
  });

  it('should return 500 on service error', async () => {
    // Mock service to throw error
    (InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const response = await request(app)
      .post('/profile/extract')
      .send({
        userId: 'user123',
        messages: [
          { role: 'user', content: 'Test' },
          { role: 'assistant', content: 'Test response' },
        ],
      });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Serverfehler');
  });
});

describe('GET /profile/characteristics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return filtered characteristics (count >= 3)', async () => {
    const mockUserId = 'user123';
    const mockCharacteristics = [
      {
        id: '1',
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
        id: '2',
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
    ];

    // Mock service
    (InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock).mockResolvedValue(
      mockCharacteristics
    );

    // Make request
    const response = await request(app).get('/profile/characteristics').query({ userId: mockUserId });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.characteristics).toEqual(mockCharacteristics);
    expect(InstantDBService.ProfileCharacteristics.getCharacteristics).toHaveBeenCalledWith(
      mockUserId,
      3 // minCount threshold
    );
  });

  it('should return 400 with missing userId', async () => {
    const response = await request(app).get('/profile/characteristics');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Benutzer-ID');
  });

  it('should return 500 on service error', async () => {
    (InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const response = await request(app)
      .get('/profile/characteristics')
      .query({ userId: 'user123' });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Serverfehler');
  });
});

describe('POST /profile/characteristics/add', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add manual characteristic successfully', async () => {
    const mockUserId = 'user123';
    const mockCharacteristic = 'Projektbasiertes Lernen';

    // Mock service
    (InstantDBService.ProfileCharacteristics.addManualCharacteristic as jest.Mock).mockResolvedValue(
      undefined
    );

    // Make request
    const response = await request(app)
      .post('/profile/characteristics/add')
      .send({ userId: mockUserId, characteristic: mockCharacteristic });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.characteristic).toBe(mockCharacteristic);
    expect(InstantDBService.ProfileCharacteristics.addManualCharacteristic).toHaveBeenCalledWith(
      mockUserId,
      mockCharacteristic
    );
  });

  it('should trim whitespace from characteristic', async () => {
    const mockUserId = 'user123';
    const mockCharacteristic = '  Projektbasiertes Lernen  ';

    (InstantDBService.ProfileCharacteristics.addManualCharacteristic as jest.Mock).mockResolvedValue(
      undefined
    );

    const response = await request(app)
      .post('/profile/characteristics/add')
      .send({ userId: mockUserId, characteristic: mockCharacteristic });

    expect(response.status).toBe(200);
    expect(response.body.data.characteristic).toBe('Projektbasiertes Lernen');
    expect(InstantDBService.ProfileCharacteristics.addManualCharacteristic).toHaveBeenCalledWith(
      mockUserId,
      'Projektbasiertes Lernen'
    );
  });

  it('should return 400 with missing userId', async () => {
    const response = await request(app)
      .post('/profile/characteristics/add')
      .send({ characteristic: 'Test' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Pflichtfelder');
  });

  it('should return 400 with missing characteristic', async () => {
    const response = await request(app)
      .post('/profile/characteristics/add')
      .send({ userId: 'user123' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Pflichtfelder');
  });

  it('should return 400 with empty characteristic', async () => {
    const response = await request(app)
      .post('/profile/characteristics/add')
      .send({ userId: 'user123', characteristic: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('darf nicht leer sein');
  });

  it('should return 500 on service error', async () => {
    (InstantDBService.ProfileCharacteristics.addManualCharacteristic as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const response = await request(app)
      .post('/profile/characteristics/add')
      .send({ userId: 'user123', characteristic: 'Test' });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Serverfehler');
  });
});

describe('POST /profile/characteristics/categorize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should categorize uncategorized characteristics', async () => {
    const mockUserId = 'user123';
    const mockAllCharacteristics = [
      {
        id: '1',
        user_id: mockUserId,
        characteristic: 'Mathematik',
        category: 'subjects',
        count: 3,
        first_seen: Date.now(),
        last_seen: Date.now(),
        manually_added: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      {
        id: '2',
        user_id: mockUserId,
        characteristic: 'Projektbasiertes Lernen',
        category: 'uncategorized',
        count: 1,
        first_seen: Date.now(),
        last_seen: Date.now(),
        manually_added: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      {
        id: '3',
        user_id: mockUserId,
        characteristic: 'Differenzierung',
        category: 'uncategorized',
        count: 1,
        first_seen: Date.now(),
        last_seen: Date.now(),
        manually_added: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    ];

    // Mock InstantDB availability
    (isInstantDBAvailable as jest.Mock).mockReturnValue(true);

    // Mock getInstantDB
    const mockTransact = jest.fn().mockResolvedValue({});
    const mockDb = {
      tx: {
        profile_characteristics: {
          '2': { update: jest.fn() },
          '3': { update: jest.fn() },
        },
      },
      transact: mockTransact,
    };
    (getInstantDB as jest.Mock).mockReturnValue(mockDb);

    // Mock service methods
    (InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock).mockResolvedValue(
      mockAllCharacteristics
    );
    (profileExtractionService.categorizeCharacteristic as jest.Mock)
      .mockResolvedValueOnce('teachingStyle')
      .mockResolvedValueOnce('teachingStyle');

    // Make request
    const response = await request(app)
      .post('/profile/characteristics/categorize')
      .send({ userId: mockUserId });

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.categorized).toBe(2);
    expect(response.body.data.total).toBe(2);
    expect(profileExtractionService.categorizeCharacteristic).toHaveBeenCalledTimes(2);
    expect(mockTransact).toHaveBeenCalledTimes(2);
  });

  it('should return 400 with missing userId', async () => {
    const response = await request(app).post('/profile/characteristics/categorize').send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Benutzer-ID');
  });

  it('should return 503 when InstantDB not available', async () => {
    (isInstantDBAvailable as jest.Mock).mockReturnValue(false);

    const response = await request(app)
      .post('/profile/characteristics/categorize')
      .send({ userId: 'user123' });

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Datenbank');
  });

  it('should handle partial failures gracefully', async () => {
    const mockUserId = 'user123';
    const mockAllCharacteristics = [
      {
        id: '1',
        user_id: mockUserId,
        characteristic: 'Test1',
        category: 'uncategorized',
        count: 1,
        first_seen: Date.now(),
        last_seen: Date.now(),
        manually_added: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      {
        id: '2',
        user_id: mockUserId,
        characteristic: 'Test2',
        category: 'uncategorized',
        count: 1,
        first_seen: Date.now(),
        last_seen: Date.now(),
        manually_added: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    ];

    (isInstantDBAvailable as jest.Mock).mockReturnValue(true);

    const mockTransact = jest.fn().mockResolvedValue({});
    const mockDb = {
      tx: {
        profile_characteristics: {
          '1': { update: jest.fn() },
          '2': { update: jest.fn() },
        },
      },
      transact: mockTransact,
    };
    (getInstantDB as jest.Mock).mockReturnValue(mockDb);

    (InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock).mockResolvedValue(
      mockAllCharacteristics
    );

    // First categorization succeeds, second fails
    (profileExtractionService.categorizeCharacteristic as jest.Mock)
      .mockResolvedValueOnce('subjects')
      .mockRejectedValueOnce(new Error('OpenAI error'));

    const response = await request(app)
      .post('/profile/characteristics/categorize')
      .send({ userId: mockUserId });

    // Should still return success with partial count
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.categorized).toBe(1);
    expect(response.body.data.total).toBe(2);
  });

  it('should return 500 on service error', async () => {
    (isInstantDBAvailable as jest.Mock).mockReturnValue(true);
    (InstantDBService.ProfileCharacteristics.getCharacteristics as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const response = await request(app)
      .post('/profile/characteristics/categorize')
      .send({ userId: 'user123' });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Serverfehler');
  });
});
