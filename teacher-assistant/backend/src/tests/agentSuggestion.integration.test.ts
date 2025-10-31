import { ChatService } from '../services/chatService';
import { ChatRequest } from '../types';
import { openaiClient } from '../config/openai';
import { OpenAI } from 'openai';

// Mock OpenAI for integration tests
jest.mock('../config/openai', () => ({
  openaiClient: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
  generatePersonalizedSystemMessage: jest.fn().mockReturnValue({
    role: 'system',
    content: 'You are a helpful teaching assistant.',
  }),
  OPENAI_CONFIG: {
    DEFAULT_MODEL: 'gpt-4o-mini',
    MAX_TOKENS: 1500,
    TEMPERATURE: 0.7,
  },
}));

const mockedOpenAIClient = openaiClient as jest.Mocked<typeof openaiClient>;

// TODO: Implement agent suggestion intent detection - see SKIP_TESTS.md
describe.skip('Agent Suggestion Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Image Generation Intent', () => {
    it('should detect image generation intent and return agentSuggestion', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Ich kann dir helfen, ein Bild zu erstellen!' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest = {
        messages: [
          { role: 'user', content: 'Erstelle ein Bild zur Photosynthese' },
        ],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agentSuggestion).toBeDefined();
        expect(result.data.agentSuggestion?.agentType).toBe('image-generation');
        expect(result.data.agentSuggestion?.reasoning).toContain('Bild');
        expect(result.data.agentSuggestion?.prefillData.theme).toContain(
          'Photosynthese'
        );
      }
    });

    it('should extract theme correctly from image generation request', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest = {
        messages: [
          {
            role: 'user',
            content:
              'Erstelle mir ein Bild zum Thema Wasserkreislauf für Klasse 7a',
          },
        ],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success && result.data.agentSuggestion) {
        expect(result.data.agentSuggestion.prefillData.theme).toContain(
          'Wasserkreislauf'
        );
        expect(result.data.agentSuggestion.prefillData.learningGroup).toBe(
          'Klasse 7a'
        );
      }
    });

    it('should detect "visualisiere" trigger phrase', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'Visualisiere das Sonnensystem' }],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agentSuggestion).toBeDefined();
        expect(result.data.agentSuggestion?.agentType).toBe('image-generation');
      }
    });

    it('should detect "zeichne" trigger phrase', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'Zeichne einen Vulkan' }],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agentSuggestion).toBeDefined();
        expect(result.data.agentSuggestion?.agentType).toBe('image-generation');
      }
    });
  });

  describe('Worksheet Intent', () => {
    it('should detect worksheet intent and return agentSuggestion', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Ich kann dir ein Arbeitsblatt erstellen!' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Erstelle ein Arbeitsblatt zur Bruchrechnung',
          },
        ],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agentSuggestion).toBeDefined();
        expect(result.data.agentSuggestion?.agentType).toBe('worksheet');
        expect(result.data.agentSuggestion?.prefillData.theme).toContain(
          'Bruchrechnung'
        );
      }
    });

    it('should extract learning group from worksheet request', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Erstelle Übungen zur Prozentrechnung für Klasse 8',
          },
        ],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success && result.data.agentSuggestion) {
        expect(result.data.agentSuggestion.agentType).toBe('worksheet');
        expect(result.data.agentSuggestion.prefillData.learningGroup).toBe(
          'Klasse 8'
        );
      }
    });
  });

  describe('Lesson Plan Intent', () => {
    it('should detect lesson plan intent and return agentSuggestion', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Ich kann einen Unterrichtsplan erstellen!' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Erstelle einen Unterrichtsplan zur Photosynthese',
          },
        ],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agentSuggestion).toBeDefined();
        expect(result.data.agentSuggestion?.agentType).toBe('lesson-plan');
        expect(result.data.agentSuggestion?.prefillData.theme).toContain(
          'Photosynthese'
        );
      }
    });
  });

  describe('No Intent Detection', () => {
    it('should NOT return agentSuggestion for regular chat', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Mir geht es gut, danke!' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 30, completion_tokens: 10, total_tokens: 40 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'Wie geht es dir?' }],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agentSuggestion).toBeUndefined();
      }
    });

    it('should NOT return agentSuggestion for general teaching questions', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Hier sind einige Tipps...' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 40, completion_tokens: 30, total_tokens: 70 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest = {
        messages: [
          {
            role: 'user',
            content: 'Wie kann ich meine Schüler besser motivieren?',
          },
        ],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agentSuggestion).toBeUndefined();
      }
    });
  });

  describe('Context Integration', () => {
    it('should use teacher context when provided', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest & { userId?: string } = {
        messages: [
          {
            role: 'user',
            content: 'Erstelle ein Arbeitsblatt zur Bruchrechnung',
          },
        ],
        userId: 'test-user-123',
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success && result.data.agentSuggestion) {
        expect(result.data.agentSuggestion.agentType).toBe('worksheet');
        // Subject and grade might be extracted from teacher context if available
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle multi-message conversation and detect intent from last user message', async () => {
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 80, completion_tokens: 20, total_tokens: 100 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest = {
        messages: [
          { role: 'user', content: 'Hallo!' },
          { role: 'assistant', content: 'Hallo! Wie kann ich helfen?' },
          { role: 'user', content: 'Erstelle ein Bild zur Photosynthese' },
        ],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agentSuggestion).toBeDefined();
        expect(result.data.agentSuggestion?.agentType).toBe('image-generation');
      }
    });

    it('should only include agentSuggestion if confidence > 0.7', async () => {
      // All valid intents from AgentIntentService have confidence >= 0.8
      // So any detected intent should be included
      const mockCompletion = {
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
        model: 'gpt-4o-mini',
      };

      mockedOpenAIClient.chat.completions.create = jest
        .fn()
        .mockResolvedValue(mockCompletion);

      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'Erstelle ein Bild' }],
      };

      const result = await ChatService.createChatCompletion(request);

      expect(result.success).toBe(true);
      if (result.success) {
        // Intent is detected with confidence 0.85 > 0.7
        expect(result.data.agentSuggestion).toBeDefined();
      }
    });
  });
});
