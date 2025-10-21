/**
 * Unit tests for Context Management API routes
 */

import request from 'supertest';
import express from 'express';
import contextRouter from './context';
import { InstantDBService } from '../services/instantdbService';

// Mock the InstantDBService
jest.mock('../services/instantdbService');

const app = express();
app.use(express.json());
app.use('/', contextRouter);

// TODO: Implement context management routes - see SKIP_TESTS.md
describe.skip('Context Management API Routes', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      query: jest.fn(),
      transact: jest.fn(),
      tx: {
        manual_context: {
          insert: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      },
      id: jest.fn(() => 'generated-id'),
    };

    // Mock the db function to return our mockDb
    (InstantDBService.db as jest.Mock) = jest.fn(() => mockDb);
    (InstantDBService.isAvailable as jest.Mock) = jest.fn(() => true);
  });

  describe('GET /profile/context/:userId', () => {
    const mockContexts = [
      {
        id: 'ctx1',
        content: 'Bruchrechnung',
        context_type: 'topic',
        priority: 8,
        is_manual: true,
        created_at: Date.now() - 1000,
        updated_at: Date.now() - 1000,
        is_active: true,
        user: { id: 'user123' },
      },
      {
        id: 'ctx2',
        content: 'Differenzierung',
        context_type: 'method',
        priority: 5,
        is_manual: true,
        created_at: Date.now(),
        updated_at: Date.now(),
        is_active: true,
        user: { id: 'user123' },
      },
    ];

    it('should successfully retrieve all context entries for a user', async () => {
      mockDb.query.mockResolvedValue({
        data: { manual_context: mockContexts },
      });

      const response = await request(app)
        .get('/profile/context/user123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contexts).toHaveLength(2);
      expect(response.body.data.count).toBe(2);
      expect(response.body.data.grouped).toHaveProperty('topic');
      expect(response.body.data.grouped).toHaveProperty('method');

      // Check sorting by priority (higher first)
      expect(response.body.data.contexts[0].priority).toBe(8);
      expect(response.body.data.contexts[1].priority).toBe(5);
    });

    it('should filter context entries by type', async () => {
      const topicContexts = mockContexts.filter(
        (ctx) => ctx.context_type === 'topic'
      );
      mockDb.db.query.mockResolvedValue({
        data: { manual_context: topicContexts },
      });

      const response = await request(app)
        .get('/profile/context/user123?contextType=topic')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contexts).toHaveLength(1);
      expect(response.body.data.contexts[0].contextType).toBe('topic');
    });

    it('should filter context entries by active status', async () => {
      const activeContexts = mockContexts.filter((ctx) => ctx.is_active);
      mockDb.db.query.mockResolvedValue({
        data: { manual_context: activeContexts },
      });

      const response = await request(app)
        .get('/profile/context/user123?active=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contexts).toHaveLength(2);
    });

    it('should validate context type parameter', async () => {
      const response = await request(app)
        .get('/profile/context/user123?contextType=invalid_type')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid parameters');
    });

    it('should handle database errors', async () => {
      mockDb.db.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/profile/context/user123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        'Failed to retrieve manual context entries'
      );
    });
  });

  describe('POST /profile/context', () => {
    const validContextData = {
      userId: 'user123',
      content: 'Algebraische Gleichungen',
      contextType: 'topic',
      priority: 7,
    };

    it('should successfully create a new context entry', async () => {
      // Mock user exists
      mockDb.db.query.mockResolvedValue({
        data: { users: [{ id: 'user123', name: 'Test User' }] },
      });
      // Mock successful insert
      mockDb.db.transact.mockResolvedValue({
        data: { manual_context: [{ id: 'new_ctx_id' }] },
      });

      const response = await request(app)
        .post('/profile/context')
        .send(validContextData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contextId).toBe('new_ctx_id');
      expect(response.body.data.message).toBe(
        'Manual context entry created successfully'
      );
      expect(mockDb.db.transact).toHaveBeenCalledTimes(1);
    });

    it('should use default priority when not provided', async () => {
      const dataWithoutPriority = {
        userId: 'user123',
        content: 'Test content',
        contextType: 'subject',
      };

      mockDb.db.query.mockResolvedValue({
        data: { users: [{ id: 'user123' }] },
      });
      mockDb.db.transact.mockResolvedValue({
        data: { manual_context: [{ id: 'new_ctx_id' }] },
      });

      const response = await request(app)
        .post('/profile/context')
        .send(dataWithoutPriority)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Verify default priority (5) was used in the transact call
      expect(mockDb.db.transact).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 5,
        })
      );
    });

    it('should validate required fields', async () => {
      const invalidData = {
        userId: 'user123',
        // Missing content and contextType
      };

      const response = await request(app)
        .post('/profile/context')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate context type enum', async () => {
      const invalidData = {
        ...validContextData,
        contextType: 'invalid_type',
      };

      const response = await request(app)
        .post('/profile/context')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate priority range', async () => {
      const invalidData = {
        ...validContextData,
        priority: 15, // Outside 1-10 range
      };

      const response = await request(app)
        .post('/profile/context')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate content length', async () => {
      const invalidData = {
        ...validContextData,
        content: 'x'.repeat(501), // Too long
      };

      const response = await request(app)
        .post('/profile/context')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 404 for non-existent user', async () => {
      mockDb.db.query.mockResolvedValue({ data: { users: [] } });

      const response = await request(app)
        .post('/profile/context')
        .send(validContextData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      mockDb.db.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/profile/context')
        .send(validContextData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to create manual context entry');
    });
  });

  describe('PUT /profile/context/:contextId', () => {
    const updateData = {
      content: 'Updated content',
      contextType: 'method',
      priority: 9,
      isActive: true,
    };

    it('should successfully update a context entry', async () => {
      // Mock context exists
      mockDb.db.query.mockResolvedValue({
        data: { manual_context: [{ id: 'ctx123', content: 'Old content' }] },
      });
      // Mock successful update
      mockDb.db.transact.mockResolvedValue({ data: {} });

      const response = await request(app)
        .put('/profile/context/ctx123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contextId).toBe('ctx123');
      expect(response.body.data.message).toBe(
        'Manual context entry updated successfully'
      );
      expect(mockDb.db.transact).toHaveBeenCalledTimes(1);
    });

    it('should return 404 for non-existent context', async () => {
      mockDb.db.query.mockResolvedValue({ data: { manual_context: [] } });

      const response = await request(app)
        .put('/profile/context/nonexistent')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Context entry not found');
    });

    it('should handle partial updates', async () => {
      mockDb.db.query.mockResolvedValue({
        data: { manual_context: [{ id: 'ctx123' }] },
      });
      mockDb.db.transact.mockResolvedValue({ data: {} });

      const partialUpdate = { priority: 10 };

      const response = await request(app)
        .put('/profile/context/ctx123')
        .send(partialUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should validate update data', async () => {
      const invalidData = {
        content: '', // Empty content
        priority: 0, // Invalid priority
      };

      const response = await request(app)
        .put('/profile/context/ctx123')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /profile/context/:contextId', () => {
    it('should successfully soft delete a context entry', async () => {
      // Mock context exists
      mockDb.db.query.mockResolvedValue({
        data: { manual_context: [{ id: 'ctx123', content: 'Test content' }] },
      });
      // Mock successful update
      mockDb.db.transact.mockResolvedValue({ data: {} });

      const response = await request(app)
        .delete('/profile/context/ctx123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contextId).toBe('ctx123');
      expect(response.body.data.permanent).toBe(false);
      expect(response.body.data.message).toContain('deactivated');
    });

    it('should successfully permanently delete a context entry', async () => {
      mockDb.db.query.mockResolvedValue({
        data: { manual_context: [{ id: 'ctx123' }] },
      });
      mockDb.db.transact.mockResolvedValue({ data: {} });

      const response = await request(app)
        .delete('/profile/context/ctx123?permanent=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.permanent).toBe(true);
      expect(response.body.data.message).toContain('permanently deleted');
    });

    it('should return 404 for non-existent context', async () => {
      mockDb.db.query.mockResolvedValue({ data: { manual_context: [] } });

      const response = await request(app)
        .delete('/profile/context/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Context entry not found');
    });

    it('should handle database errors', async () => {
      mockDb.db.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/profile/context/ctx123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to delete manual context entry');
    });
  });

  describe('POST /profile/context/bulk', () => {
    const bulkCreateData = {
      userId: 'user123',
      operation: 'create',
      contexts: [
        { content: 'Context 1', contextType: 'topic', priority: 5 },
        { content: 'Context 2', contextType: 'method', priority: 7 },
      ],
    };

    it('should successfully create multiple context entries', async () => {
      mockDb.db.transact
        .mockResolvedValueOnce({ data: { manual_context: [{ id: 'ctx1' }] } })
        .mockResolvedValueOnce({ data: { manual_context: [{ id: 'ctx2' }] } });

      const response = await request(app)
        .post('/profile/context/bulk')
        .send(bulkCreateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.operation).toBe('create');
      expect(response.body.data.results).toHaveLength(2);
      expect(response.body.data.processedCount).toBe(2);
      expect(mockDb.db.transact).toHaveBeenCalledTimes(2);
    });

    it('should successfully activate/deactivate multiple entries', async () => {
      const bulkActivateData = {
        userId: 'user123',
        operation: 'activate',
        contextIds: ['ctx1', 'ctx2'],
      };

      mockDb.db.transact.mockResolvedValue({ data: {} });

      const response = await request(app)
        .post('/profile/context/bulk')
        .send(bulkActivateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.operation).toBe('activate');
      expect(response.body.data.results).toHaveLength(2);
      expect(mockDb.db.transact).toHaveBeenCalledTimes(2);
    });

    it('should successfully delete multiple entries', async () => {
      const bulkDeleteData = {
        userId: 'user123',
        operation: 'delete',
        contextIds: ['ctx1', 'ctx2'],
      };

      mockDb.db.transact.mockResolvedValue({ data: {} });

      const response = await request(app)
        .post('/profile/context/bulk')
        .send(bulkDeleteData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.operation).toBe('delete');
      expect(mockDb.db.transact).toHaveBeenCalledTimes(2);
    });

    it('should validate operation type', async () => {
      const invalidData = {
        ...bulkCreateData,
        operation: 'invalid_operation',
      };

      const response = await request(app)
        .post('/profile/context/bulk')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should require contexts array for create operation', async () => {
      const invalidData = {
        userId: 'user123',
        operation: 'create',
        // Missing contexts array
      };

      const response = await request(app)
        .post('/profile/context/bulk')
        .send(invalidData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        'Failed to perform bulk create operation'
      );
    });

    it('should require contextIds array for activate/deactivate operations', async () => {
      const invalidData = {
        userId: 'user123',
        operation: 'activate',
        // Missing contextIds array
      };

      const response = await request(app)
        .post('/profile/context/bulk')
        .send(invalidData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        'Failed to perform bulk activate operation'
      );
    });
  });
});
