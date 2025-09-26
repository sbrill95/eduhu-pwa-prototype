import request from 'supertest';
import app from '../app';
import { ChatService } from '../services/chatService';

// Mock the ChatService to avoid making real API calls in tests
jest.mock('../services/chatService');
const mockedChatService = ChatService as jest.Mocked<typeof ChatService>;

describe('Chat Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Skip rate limiting in test environment
    process.env.NODE_ENV = 'test';
  });

  describe('POST /api/chat', () => {
    it('should return successful chat response with valid input', async () => {
      const mockResponse = {
        success: true as const,
        data: {
          message: 'Hello! I can help you create a lesson plan.',
          usage: {
            prompt_tokens: 20,
            completion_tokens: 15,
            total_tokens: 35,
          },
          model: 'gpt-4o-mini',
          finish_reason: 'stop',
        },
        timestamp: '2025-09-26T06:00:00.000Z',
      };

      mockedChatService.createChatCompletion.mockResolvedValue(mockResponse);

      const chatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Hello, can you help me create a lesson plan?',
          },
        ],
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatRequest)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockedChatService.createChatCompletion).toHaveBeenCalledWith(
        chatRequest
      );
    });

    it('should return validation error for missing messages', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe('validation');
      expect(response.body.error).toContain('Messages array is required');
    });

    it('should return validation error for empty messages array', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ messages: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe('validation');
      expect(response.body.error).toContain('Messages array is required');
    });

    it('should return validation error for invalid role', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          messages: [{ role: 'invalid', content: 'test message' }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe('validation');
      expect(response.body.error).toContain('Message role must be either');
    });

    it('should return validation error for empty content', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          messages: [{ role: 'user', content: '' }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe('validation');
      expect(response.body.error).toContain('Message content must be');
    });

    it('should return validation error for invalid temperature', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          messages: [{ role: 'user', content: 'test message' }],
          temperature: 3.0,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe('validation');
      expect(response.body.error).toContain('Temperature must be');
    });

    it('should handle OpenAI API errors', async () => {
      const mockErrorResponse = {
        success: false as const,
        error: 'OpenAI API rate limit exceeded',
        error_type: 'openai_api' as const,
        error_code: 'rate_limit_exceeded',
        timestamp: '2025-09-26T06:00:00.000Z',
      };

      mockedChatService.createChatCompletion.mockResolvedValue(
        mockErrorResponse
      );

      const chatRequest = {
        messages: [{ role: 'user', content: 'test message' }],
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatRequest)
        .expect(502);

      expect(response.body).toEqual(mockErrorResponse);
    });
  });

  describe('GET /api/chat/models', () => {
    it('should return available OpenAI models', async () => {
      const response = await request(app).get('/api/chat/models').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('models');
      expect(response.body.data).toHaveProperty('default_model', 'gpt-4o-mini');
      expect(Array.isArray(response.body.data.models)).toBe(true);
      expect(response.body.data.models.length).toBeGreaterThan(0);

      // Check that each model has required properties
      response.body.data.models.forEach(
        (model: {
          id: string;
          name: string;
          description: string;
          max_tokens: number;
          recommended: boolean;
        }) => {
          expect(model).toHaveProperty('id');
          expect(model).toHaveProperty('name');
          expect(model).toHaveProperty('description');
          expect(model).toHaveProperty('max_tokens');
          expect(model).toHaveProperty('recommended');
        }
      );
    });
  });

  describe('GET /api/chat/health', () => {
    it('should return healthy status when service is working', async () => {
      mockedChatService.testService.mockResolvedValue(true);

      const response = await request(app).get('/api/chat/health').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.openai_connection).toBe(true);
      expect(response.body.data.service_available).toBe(true);
    });

    it('should return unhealthy status when service fails', async () => {
      mockedChatService.testService.mockResolvedValue(false);

      const response = await request(app).get('/api/chat/health').expect(503);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('unhealthy');
      expect(response.body.data.openai_connection).toBe(false);
      expect(response.body.data.service_available).toBe(true);
    });

    it('should handle service errors', async () => {
      mockedChatService.testService.mockRejectedValue(new Error('Test error'));

      const response = await request(app).get('/api/chat/health').expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Chat service health check failed');
      expect(response.body.data.status).toBe('unhealthy');
      expect(response.body.data.openai_connection).toBe(false);
      expect(response.body.data.service_available).toBe(false);
    });
  });
});
