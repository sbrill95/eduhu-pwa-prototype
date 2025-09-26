import { ChatService } from './chatService';
import { openaiClient } from '../config/openai';
import { OpenAI } from 'openai';

// Mock the OpenAI client
jest.mock('../config/openai');
const mockedOpenAIClient = openaiClient as jest.Mocked<typeof openaiClient>;

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChatCompletion', () => {
    it('should return successful response with valid OpenAI response', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Hello! I can help you create a lesson plan.' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 15,
          total_tokens: 35,
        },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request = {
        messages: [
          {
            role: 'user' as const,
            content: 'Hello, can you help me create a lesson plan?',
          },
        ],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if ('data' in result) {
        expect(result.data.message).toBe(
          'Hello! I can help you create a lesson plan.'
        );
        const resultData = result.data as {
          usage: { total_tokens: number };
          model: string;
          finish_reason: string;
        };
        expect(resultData.usage.total_tokens).toBe(35);
        expect(resultData.model).toBe('gpt-4o-mini');
        expect(resultData.finish_reason).toBe('stop');
      }
    });

    it('should add system message if not present', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Test response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request = {
        messages: [{ role: 'user' as const, content: 'Test message' }],
      };

      await ChatService.createChatCompletion(request);

      expect(mockedOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'Test message' }),
        ]),
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      });
    });

    it('should handle empty choices response', async () => {
      const mockCompletion = {
        choices: [],
        usage: { prompt_tokens: 20, completion_tokens: 0, total_tokens: 20 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request = {
        messages: [{ role: 'user' as const, content: 'Test message' }],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No response generated from OpenAI');
        expect(result.error_type).toBe('openai_api');
        expect(result.error_code).toBe('empty_response');
      }
    });

    it('should handle empty message content', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: null },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 0, total_tokens: 20 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request = {
        messages: [{ role: 'user' as const, content: 'Test message' }],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Empty response content from OpenAI');
        expect(result.error_type).toBe('openai_api');
        expect(result.error_code).toBe('empty_content');
      }
    });

    it('should handle OpenAI API 401 error (invalid API key)', async () => {
      const apiError = new OpenAI.APIError(
        401,
        { error: { message: 'Invalid API key' } },
        'Invalid API key',
        new Headers()
      );

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockRejectedValue(apiError);

      const request = {
        messages: [{ role: 'user' as const, content: 'Test message' }],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid OpenAI API key');
        expect(result.error_type).toBe('openai_api');
        expect(result.error_code).toBe('invalid_api_key');
      }
    });

    it('should handle OpenAI API 429 error (rate limit)', async () => {
      const apiError = new OpenAI.APIError(
        429,
        { error: { message: 'Rate limit exceeded' } },
        'Rate limit exceeded',
        new Headers()
      );

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockRejectedValue(apiError);

      const request = {
        messages: [{ role: 'user' as const, content: 'Test message' }],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('OpenAI API rate limit exceeded');
        expect(result.error_type).toBe('openai_api');
        expect(result.error_code).toBe('rate_limit_exceeded');
      }
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error') as Error & {
        code: string;
      };
      networkError.code = 'ECONNRESET';

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockRejectedValue(networkError);

      const request = {
        messages: [{ role: 'user' as const, content: 'Test message' }],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(
          'Network error connecting to OpenAI API'
        );
        expect(result.error_type).toBe('openai_api');
        expect(result.error_code).toBe('network_error');
      }
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Generic error');

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockRejectedValue(genericError);

      const request = {
        messages: [{ role: 'user' as const, content: 'Test message' }],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('An unexpected error occurred');
        expect(result.error_type).toBe('server_error');
        expect(result.error_code).toBe('unknown_error');
      }
    });
  });

  describe('testService', () => {
    it('should return true when service test succeeds', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Hello' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const result = await ChatService.testService();

      expect(result).toBe(true);
    });

    it('should return false when service test fails', async () => {
      const apiError = new OpenAI.APIError(
        500,
        { error: { message: 'Test error' } },
        'Test error',
        new Headers()
      );

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockRejectedValue(apiError);

      const result = await ChatService.testService();

      expect(result).toBe(false);
    });
  });
});
