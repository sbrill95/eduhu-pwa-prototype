/**
 * Unit tests for Data API routes
 */

import request from 'supertest';
import express from 'express';
import dataRouter from './data';
import DataSeederService from '../services/dataSeederService';

// Mock the DataSeederService
jest.mock('../services/dataSeederService');
const mockDataSeederService = DataSeederService as jest.Mocked<typeof DataSeederService>;

const app = express();
app.use(express.json());
app.use('/', dataRouter);

describe('Data API Routes', () => {
  let mockDataSeeder: jest.Mocked<DataSeederService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataSeeder = new mockDataSeederService() as jest.Mocked<DataSeederService>;
  });

  describe('GET /data/states', () => {
    const mockStates = [
      { id: '1', name: 'Baden-Württemberg', abbreviation: 'BW', created_at: Date.now(), is_active: true },
      { id: '2', name: 'Bayern', abbreviation: 'BY', created_at: Date.now(), is_active: true },
      { id: '3', name: 'Berlin', abbreviation: 'BE', created_at: Date.now(), is_active: true },
    ];

    beforeEach(() => {
      mockDataSeeder.getGermanStates = jest.fn().mockResolvedValue(mockStates);
      mockDataSeeder.searchData = jest.fn().mockImplementation((data, search) => {
        if (!search) return data;
        return data.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
      });
      DataSeederService.prototype.getGermanStates = mockDataSeeder.getGermanStates;
      DataSeederService.prototype.searchData = mockDataSeeder.searchData;
    });

    it('should return all German states', async () => {
      const response = await request(app)
        .get('/data/states')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.states).toHaveLength(3);
      expect(response.body.data.count).toBe(3);
      expect(mockDataSeeder.getGermanStates).toHaveBeenCalledTimes(1);
    });

    it('should filter states by search term', async () => {
      const response = await request(app)
        .get('/data/states?search=Baden')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockDataSeeder.searchData).toHaveBeenCalledWith(mockStates, 'Baden');
    });

    it('should handle invalid search parameter', async () => {
      const response = await request(app)
        .get('/data/states?search=' + 'a'.repeat(101)) // Too long
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid search parameters');
    });

    it('should handle service errors', async () => {
      mockDataSeeder.getGermanStates.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/data/states')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to retrieve German states');
    });
  });

  describe('GET /data/subjects', () => {
    const mockSubjects = [
      { id: '1', name: 'Mathematik', category: 'STEM', grade_levels: ['5', '6', '7'], created_at: Date.now(), is_active: true },
      { id: '2', name: 'Deutsch', category: 'Languages', grade_levels: ['1', '2', '3'], created_at: Date.now(), is_active: true },
      { id: '3', name: 'Englisch', category: 'Languages', grade_levels: ['3', '4', '5'], created_at: Date.now(), is_active: true },
    ];

    beforeEach(() => {
      mockDataSeeder.getTeachingSubjects = jest.fn().mockResolvedValue(mockSubjects);
      mockDataSeeder.searchData = jest.fn().mockImplementation((data, search) => {
        if (!search) return data;
        return data.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
      });
      DataSeederService.prototype.getTeachingSubjects = mockDataSeeder.getTeachingSubjects;
      DataSeederService.prototype.searchData = mockDataSeeder.searchData;
    });

    it('should return all teaching subjects', async () => {
      const response = await request(app)
        .get('/data/subjects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subjects).toHaveLength(3);
      expect(response.body.data.categories).toEqual(['Languages', 'STEM']);
      expect(mockDataSeeder.getTeachingSubjects).toHaveBeenCalledTimes(2); // Once for filtering, once for categories
    });

    it('should filter subjects by category', async () => {
      const response = await request(app)
        .get('/data/subjects?category=STEM')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subjects).toHaveLength(1);
      expect(response.body.data.subjects[0].name).toBe('Mathematik');
    });

    it('should filter subjects by grade level', async () => {
      const response = await request(app)
        .get('/data/subjects?grade_level=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subjects).toHaveLength(2); // Mathematik and Englisch
    });

    it('should filter subjects by search term', async () => {
      const response = await request(app)
        .get('/data/subjects?search=Deutsch')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockDataSeeder.searchData).toHaveBeenCalled();
    });
  });

  describe('GET /data/preferences', () => {
    const mockPreferences = [
      { id: '1', name: 'Gruppenarbeit', description: 'Kollaboratives Lernen', category: 'Method', created_at: Date.now(), is_active: true },
      { id: '2', name: 'Digitale Medien', description: 'Einsatz von Computern', category: 'Tool', created_at: Date.now(), is_active: true },
    ];

    beforeEach(() => {
      mockDataSeeder.getTeachingPreferences = jest.fn().mockResolvedValue(mockPreferences);
      mockDataSeeder.searchData = jest.fn().mockImplementation((data, search) => {
        if (!search) return data;
        return data.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
      });
      DataSeederService.prototype.getTeachingPreferences = mockDataSeeder.getTeachingPreferences;
      DataSeederService.prototype.searchData = mockDataSeeder.searchData;
    });

    it('should return all teaching preferences', async () => {
      const response = await request(app)
        .get('/data/preferences')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toHaveLength(2);
      expect(response.body.data.categories).toEqual(['Method', 'Tool']);
    });

    it('should filter preferences by category', async () => {
      const response = await request(app)
        .get('/data/preferences?category=Method')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toHaveLength(1);
      expect(response.body.data.preferences[0].name).toBe('Gruppenarbeit');
    });
  });

  describe('GET /data/search', () => {
    const mockStates = [
      { id: '1', name: 'Baden-Württemberg', abbreviation: 'BW', created_at: Date.now(), is_active: true }
    ];
    const mockSubjects = [
      { id: '1', name: 'Mathematik', category: 'STEM', grade_levels: ['5'], created_at: Date.now(), is_active: true }
    ];
    const mockPreferences = [
      { id: '1', name: 'Gruppenarbeit', description: 'Kollaboratives Lernen', category: 'Method', created_at: Date.now(), is_active: true }
    ];

    beforeEach(() => {
      mockDataSeeder.getGermanStates = jest.fn().mockResolvedValue(mockStates);
      mockDataSeeder.getTeachingSubjects = jest.fn().mockResolvedValue(mockSubjects);
      mockDataSeeder.getTeachingPreferences = jest.fn().mockResolvedValue(mockPreferences);
      mockDataSeeder.searchData = jest.fn().mockImplementation((data, search) => {
        return data.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
      });
      DataSeederService.prototype.getGermanStates = mockDataSeeder.getGermanStates;
      DataSeederService.prototype.getTeachingSubjects = mockDataSeeder.getTeachingSubjects;
      DataSeederService.prototype.getTeachingPreferences = mockDataSeeder.getTeachingPreferences;
      DataSeederService.prototype.searchData = mockDataSeeder.searchData;
    });

    it('should search across all data types', async () => {
      const response = await request(app)
        .get('/data/search?q=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('states');
      expect(response.body.data).toHaveProperty('subjects');
      expect(response.body.data).toHaveProperty('preferences');
      expect(response.body.data).toHaveProperty('totalResults');
    });

    it('should search specific data types', async () => {
      const response = await request(app)
        .get('/data/search?q=test&types=states,subjects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('states');
      expect(response.body.data).toHaveProperty('subjects');
      expect(response.body.data).not.toHaveProperty('preferences');
    });

    it('should require search query', async () => {
      const response = await request(app)
        .get('/data/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search query is required');
    });

    it('should reject empty search query', async () => {
      const response = await request(app)
        .get('/data/search?q=')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /data/seed', () => {
    beforeEach(() => {
      mockDataSeeder.seedAllData = jest.fn().mockResolvedValue(undefined);
      DataSeederService.prototype.seedAllData = mockDataSeeder.seedAllData;
    });

    it('should seed data in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .post('/data/seed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('seeded successfully');
      expect(mockDataSeeder.seedAllData).toHaveBeenCalledTimes(1);

      process.env.NODE_ENV = originalEnv;
    });

    it('should reject seeding in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/data/seed')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Data seeding not allowed in production');
      expect(mockDataSeeder.seedAllData).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle seeding errors', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      mockDataSeeder.seedAllData.mockRejectedValue(new Error('Seeding failed'));

      const response = await request(app)
        .post('/data/seed')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to seed data collections');

      process.env.NODE_ENV = originalEnv;
    });
  });
});