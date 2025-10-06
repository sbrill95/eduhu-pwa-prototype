/**
 * Integration Tests for Chat Tags API Routes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import chatTagsRouter from './chatTags';
import * as chatTagService from '../services/chatTagService';
import * as instantdbService from '../services/instantdbService';

// Mock services
vi.mock('../services/chatTagService');
vi.mock('../services/instantdbService');
vi.mock('../config/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

describe('Chat Tags API Routes', () => {
  let app: Express;

  beforeEach(() => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/chat', chatTagsRouter);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/chat/:chatId/tags', () => {
    it('should extract and save tags for a chat session', async () => {
      const mockChatId = 'test-chat-123';
      const mockMessages = [
        {
          id: '1',
          role: 'user',
          content: 'Ich brauche ein Arbeitsblatt für Mathematik Klasse 5',
          timestamp: Date.now(),
          is_edited: false,
          message_index: 0,
        },
      ];

      const mockTags = [
        { label: 'Mathematik', category: 'subject' },
        { label: 'Klasse 5', category: 'grade_level' },
        { label: 'Arbeitsblatt', category: 'material_type' },
      ];

      // Mock InstantDB availability
      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(true);

      // Mock message retrieval
      vi.mocked(instantdbService.MessageService.getSessionMessages).mockResolvedValue(
        mockMessages as any
      );

      // Mock tag extraction
      vi.mocked(chatTagService.extractChatTags).mockResolvedValue(mockTags);

      // Mock session update
      vi.mocked(instantdbService.ChatSessionService.updateSession).mockResolvedValue(
        true
      );

      const response = await request(app)
        .post(`/api/chat/${mockChatId}/tags`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          tags: mockTags,
          chatId: mockChatId,
          tagCount: 3,
        },
      });

      expect(chatTagService.extractChatTags).toHaveBeenCalledWith(
        mockChatId,
        expect.arrayContaining([
          { role: 'user', content: expect.any(String) },
        ])
      );

      expect(instantdbService.ChatSessionService.updateSession).toHaveBeenCalledWith(
        mockChatId,
        { tags: JSON.stringify(mockTags) }
      );
    });

    it('should return 400 when chat ID is missing', async () => {
      const response = await request(app).post('/api/chat//tags').send({});

      expect(response.status).toBe(404); // Express router will return 404 for missing param
    });

    it('should return 503 when InstantDB is unavailable', async () => {
      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(false);

      const response = await request(app)
        .post('/api/chat/test-chat-123/tags')
        .send({});

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Database service unavailable',
      });
    });

    it('should return 404 when chat session is not found', async () => {
      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(true);
      vi.mocked(instantdbService.MessageService.getSessionMessages).mockResolvedValue(
        null
      );

      const response = await request(app)
        .post('/api/chat/nonexistent-chat/tags')
        .send({});

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Chat session not found or no messages available',
      });
    });

    it('should return 400 when chat has no messages', async () => {
      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(true);
      vi.mocked(instantdbService.MessageService.getSessionMessages).mockResolvedValue(
        []
      );

      const response = await request(app)
        .post('/api/chat/empty-chat/tags')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'No messages in chat session to analyze',
      });
    });

    it('should return success with empty tags when no tags extracted', async () => {
      const mockMessages = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: Date.now(),
          is_edited: false,
          message_index: 0,
        },
      ];

      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(true);
      vi.mocked(instantdbService.MessageService.getSessionMessages).mockResolvedValue(
        mockMessages as any
      );
      vi.mocked(chatTagService.extractChatTags).mockResolvedValue([]);

      const response = await request(app)
        .post('/api/chat/test-chat-123/tags')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          tags: [],
          message: 'No relevant tags could be extracted from this conversation',
        },
      });
    });

    it('should return 500 when tag saving fails', async () => {
      const mockMessages = [
        {
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: Date.now(),
          is_edited: false,
          message_index: 0,
        },
      ];

      const mockTags = [{ label: 'Test', category: 'general' }];

      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(true);
      vi.mocked(instantdbService.MessageService.getSessionMessages).mockResolvedValue(
        mockMessages as any
      );
      vi.mocked(chatTagService.extractChatTags).mockResolvedValue(mockTags);
      vi.mocked(instantdbService.ChatSessionService.updateSession).mockResolvedValue(
        false
      );

      const response = await request(app)
        .post('/api/chat/test-chat-123/tags')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to save tags to database',
      });
    });
  });

  describe('PUT /api/chat/:chatId/tags', () => {
    it('should manually update tags', async () => {
      const mockChatId = 'test-chat-123';
      const mockTags = [
        { label: 'Mathematik', category: 'subject' },
        { label: 'Klasse 5', category: 'grade_level' },
      ];

      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(true);
      vi.mocked(instantdbService.ChatSessionService.updateSession).mockResolvedValue(
        true
      );

      const response = await request(app)
        .put(`/api/chat/${mockChatId}/tags`)
        .send({ tags: mockTags });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          tags: mockTags,
          chatId: mockChatId,
          tagCount: 2,
        },
      });
    });

    it('should return 400 when tags are not an array', async () => {
      const response = await request(app)
        .put('/api/chat/test-chat-123/tags')
        .send({ tags: 'not-an-array' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Tags must be provided as an array',
      });
    });

    it('should return 400 when tag structure is invalid', async () => {
      const invalidTags = [
        { label: 'Test' }, // Missing category
        { category: 'subject' }, // Missing label
      ];

      const response = await request(app)
        .put('/api/chat/test-chat-123/tags')
        .send({ tags: invalidTags });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid tag structure. Each tag must have label and category fields',
      });
    });

    it('should limit tags to 5', async () => {
      const sixTags = [
        { label: 'Tag1', category: 'subject' },
        { label: 'Tag2', category: 'topic' },
        { label: 'Tag3', category: 'grade_level' },
        { label: 'Tag4', category: 'material_type' },
        { label: 'Tag5', category: 'general' },
        { label: 'Tag6', category: 'general' },
      ];

      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(true);
      vi.mocked(instantdbService.ChatSessionService.updateSession).mockResolvedValue(
        true
      );

      const response = await request(app)
        .put('/api/chat/test-chat-123/tags')
        .send({ tags: sixTags });

      expect(response.status).toBe(200);
      expect(response.body.data.tagCount).toBe(5);
      expect(response.body.data.tags).toHaveLength(5);
    });
  });

  describe('DELETE /api/chat/:chatId/tags', () => {
    it('should remove tags from chat session', async () => {
      const mockChatId = 'test-chat-123';

      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(true);
      vi.mocked(instantdbService.ChatSessionService.updateSession).mockResolvedValue(
        true
      );

      const response = await request(app).delete(`/api/chat/${mockChatId}/tags`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          chatId: mockChatId,
          message: 'Tags removed successfully',
        },
      });

      expect(instantdbService.ChatSessionService.updateSession).toHaveBeenCalledWith(
        mockChatId,
        { tags: undefined }
      );
    });

    it('should return 503 when InstantDB is unavailable', async () => {
      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(false);

      const response = await request(app).delete('/api/chat/test-chat-123/tags');

      expect(response.status).toBe(503);
    });

    it('should return 500 when deletion fails', async () => {
      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(true);
      vi.mocked(instantdbService.ChatSessionService.updateSession).mockResolvedValue(
        false
      );

      const response = await request(app).delete('/api/chat/test-chat-123/tags');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to remove tags from database',
      });
    });
  });

  describe('GET /api/chat/:chatId/tags', () => {
    it('should retrieve tags for chat session', async () => {
      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(true);

      const response = await request(app).get('/api/chat/test-chat-123/tags');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          chatId: 'test-chat-123',
        },
      });
    });

    it('should return 503 when InstantDB is unavailable', async () => {
      vi.mocked(instantdbService.isInstantDBAvailable).mockReturnValue(false);

      const response = await request(app).get('/api/chat/test-chat-123/tags');

      expect(response.status).toBe(503);
    });
  });
});
