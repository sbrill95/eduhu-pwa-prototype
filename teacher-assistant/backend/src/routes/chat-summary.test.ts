/**
 * Chat Summary API Route Integration Tests
 */

import request from 'supertest';
import express from 'express';
import chatSummaryRouter from './chat-summary';
import { summaryService } from '../services/summaryService';
import { ChatSessionService } from '../services/instantdbService';

// Mock the services
jest.mock('../services/summaryService');
jest.mock('../services/instantdbService');
jest.mock('../config/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

describe('Chat Summary API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/chat', chatSummaryRouter);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /chat/summary', () => {
    const validRequest = {
      chatId: 'test-chat-123',
      messages: [
        {
          role: 'user',
          content: 'Ich brauche ein Arbeitsblatt zur Bruchrechnung',
        },
        { role: 'assistant', content: 'Gerne! Für welche Klassenstufe?' },
        { role: 'user', content: 'Klasse 7' },
      ],
    };

    it('should generate and store a summary successfully', async () => {
      // Mock successful summary generation
      const mockSummary = 'Bruchrechnung Kl. 7';
      (summaryService.generateSummaryWithRetry as jest.Mock).mockResolvedValue(
        mockSummary
      );

      // Mock successful database update
      (ChatSessionService.updateSummary as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/chat/summary')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          summary: mockSummary,
          chatId: validRequest.chatId,
          generatedAt: expect.any(String),
        },
      });

      expect(summaryService.generateSummaryWithRetry).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.any(String),
          }),
        ])
      );

      expect(ChatSessionService.updateSummary).toHaveBeenCalledWith(
        validRequest.chatId,
        mockSummary
      );
    });

    it('should return 400 if chatId is missing', async () => {
      const response = await request(app)
        .post('/chat/summary')
        .send({ messages: validRequest.messages })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Fehlende oder ungültige Chat-ID.',
        timestamp: expect.any(String),
      });

      expect(summaryService.generateSummaryWithRetry).not.toHaveBeenCalled();
    });

    it('should return 400 if messages is missing', async () => {
      const response = await request(app)
        .post('/chat/summary')
        .send({ chatId: validRequest.chatId })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Fehlende oder ungültige Nachrichten.',
        timestamp: expect.any(String),
      });

      expect(summaryService.generateSummaryWithRetry).not.toHaveBeenCalled();
    });

    it('should return 400 if messages is not an array', async () => {
      const response = await request(app)
        .post('/chat/summary')
        .send({ chatId: validRequest.chatId, messages: 'invalid' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Fehlende oder ungültige Nachrichten.',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 if messages array is empty', async () => {
      const response = await request(app)
        .post('/chat/summary')
        .send({ chatId: validRequest.chatId, messages: [] })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Mindestens eine Nachricht ist erforderlich.',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 if message has invalid structure', async () => {
      const response = await request(app)
        .post('/chat/summary')
        .send({
          chatId: validRequest.chatId,
          messages: [{ role: 'user' }], // Missing content
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error:
          'Ungültiges Nachrichtenformat. Jede Nachricht muss "role" und "content" enthalten.',
        timestamp: expect.any(String),
      });
    });

    it('should return 400 if message has invalid role', async () => {
      const response = await request(app)
        .post('/chat/summary')
        .send({
          chatId: validRequest.chatId,
          messages: [{ role: 'invalid', content: 'test' }],
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error:
          'Ungültige Nachrichtenrolle. Erlaubt sind: user, assistant, system.',
        timestamp: expect.any(String),
      });
    });

    it('should limit messages to first 4 for summary generation', async () => {
      const mockSummary = 'Test summary';
      (summaryService.generateSummaryWithRetry as jest.Mock).mockResolvedValue(
        mockSummary
      );
      (ChatSessionService.updateSummary as jest.Mock).mockResolvedValue(true);

      const manyMessages = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Message 2' },
        { role: 'user', content: 'Message 3' },
        { role: 'assistant', content: 'Message 4' },
        { role: 'user', content: 'Message 5' }, // Should be ignored
        { role: 'assistant', content: 'Message 6' }, // Should be ignored
      ];

      await request(app)
        .post('/chat/summary')
        .send({ chatId: validRequest.chatId, messages: manyMessages })
        .expect(200);

      // Verify only first 4 messages were passed to the service
      expect(summaryService.generateSummaryWithRetry).toHaveBeenCalledWith(
        manyMessages.slice(0, 4)
      );
    });

    it('should return 500 if summary generation throws an error', async () => {
      (summaryService.generateSummaryWithRetry as jest.Mock).mockRejectedValue(
        new Error('OpenAI API Error')
      );

      const response = await request(app)
        .post('/chat/summary')
        .send(validRequest)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error:
          'Fehler bei der Zusammenfassungserstellung. Bitte versuchen Sie es später erneut.',
        timestamp: expect.any(String),
      });
    });

    it('should still return summary even if database update fails', async () => {
      const mockSummary = 'Test summary';
      (summaryService.generateSummaryWithRetry as jest.Mock).mockResolvedValue(
        mockSummary
      );

      // Mock database update failure
      (ChatSessionService.updateSummary as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/chat/summary')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          summary: mockSummary,
          chatId: validRequest.chatId,
          generatedAt: expect.any(String),
        },
      });
    });

    it('should handle summary with special characters', async () => {
      const mockSummary = 'Übung für Klasse 7';
      (summaryService.generateSummaryWithRetry as jest.Mock).mockResolvedValue(
        mockSummary
      );
      (ChatSessionService.updateSummary as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/chat/summary')
        .send(validRequest)
        .expect(200);

      expect(response.body.data.summary).toBe(mockSummary);
    });
  });

  describe('GET /chat/:chatId/summary', () => {
    it('should return placeholder response (endpoint implementation pending)', async () => {
      const chatId = 'test-chat-123';

      const response = await request(app)
        .get(`/chat/${chatId}/summary`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          chatId,
          summary: null,
          message: 'Summary retrieval endpoint - implementation pending',
        },
      });
    });

    it('should handle missing chatId parameter', async () => {
      // This test is tricky because Express requires the param in the route
      // So we test the chatId validation indirectly by ensuring it exists
      const response = await request(app).get('/chat//summary').expect(404);

      // 404 because the route doesn't match without chatId
      expect(response.status).toBe(404);
    });
  });

  describe('Integration Flow', () => {
    it('should handle complete flow: validate -> generate -> store -> respond', async () => {
      const mockSummary = 'Quiz Klasse 8';
      (summaryService.generateSummaryWithRetry as jest.Mock).mockResolvedValue(
        mockSummary
      );
      (ChatSessionService.updateSummary as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/chat/summary')
        .send({
          chatId: 'integration-test-chat',
          messages: [
            { role: 'user', content: 'Erstelle ein Quiz für Klasse 8' },
            { role: 'assistant', content: 'Zu welchem Thema?' },
          ],
        })
        .expect(200);

      // Verify the complete flow
      expect(summaryService.generateSummaryWithRetry).toHaveBeenCalledTimes(1);
      expect(ChatSessionService.updateSummary).toHaveBeenCalledTimes(1);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBe(mockSummary);
    });
  });
});
