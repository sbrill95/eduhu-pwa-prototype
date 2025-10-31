/**
 * Unit Tests for Chat Tag Service
 */

import {
  extractChatTags,
  extractTagsFromText,
  mergeTags,
  tagsToStringArray,
  stringArrayToTags,
  ChatTag,
  ChatMessageForTagging,
} from './chatTagService';
import { openaiClient } from '../config/openai';

// Mock OpenAI client
jest.mock('../config/openai', () => ({
  openaiClient: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
  OPENAI_CONFIG: {
    DEFAULT_MODEL: 'gpt-4o-mini',
  },
}));

// Mock logger
jest.mock('../config/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

describe('ChatTagService', () => {
  const mockCreate = openaiClient.chat.completions
    .create as jest.MockedFunction<typeof openaiClient.chat.completions.create>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('extractChatTags', () => {
    it('should extract tags from chat messages', async () => {
      const mockMessages: ChatMessageForTagging[] = [
        {
          role: 'user',
          content:
            'Ich brauche ein Arbeitsblatt für Bruchrechnung für meine 5. Klasse in Mathematik',
        },
        {
          role: 'assistant',
          content:
            'Gerne helfe ich Ihnen bei der Erstellung eines Arbeitsblatts...',
        },
      ];

      const mockTags: ChatTag[] = [
        { label: 'Mathematik', category: 'subject' },
        { label: 'Bruchrechnung', category: 'topic' },
        { label: 'Klasse 5', category: 'grade_level' },
        { label: 'Arbeitsblatt', category: 'material_type' },
      ];

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockTags),
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      } as any);

      const result = await extractChatTags('test-chat-id', mockMessages);

      expect(result).toEqual(mockTags);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.3,
        })
      );
    });

    it('should return empty array for empty messages', async () => {
      const result = await extractChatTags('test-chat-id', []);
      expect(result).toEqual([]);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should handle OpenAI API errors gracefully', async () => {
      const mockMessages: ChatMessageForTagging[] = [
        { role: 'user', content: 'Test message' },
      ];

      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await extractChatTags('test-chat-id', mockMessages);

      expect(result).toEqual([]);
    });

    it('should handle invalid JSON responses', async () => {
      const mockMessages: ChatMessageForTagging[] = [
        { role: 'user', content: 'Test message' },
      ];

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Invalid JSON',
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      } as any);

      const result = await extractChatTags('test-chat-id', mockMessages);

      expect(result).toEqual([]);
    });

    it('should filter out invalid tags', async () => {
      const mockMessages: ChatMessageForTagging[] = [
        { role: 'user', content: 'Test message' },
      ];

      const mockResponse = [
        { label: 'Mathematik', category: 'subject' }, // Valid
        { label: '', category: 'topic' }, // Invalid - empty label
        { label: 'Klasse 5', category: 'invalid_category' }, // Invalid - wrong category
        { label: 'Arbeitsblatt', category: 'material_type' }, // Valid
      ];

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      } as any);

      const result = await extractChatTags('test-chat-id', mockMessages);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { label: 'Mathematik', category: 'subject' },
        { label: 'Arbeitsblatt', category: 'material_type' },
      ]);
    });

    it('should limit tags to 5', async () => {
      const mockMessages: ChatMessageForTagging[] = [
        { role: 'user', content: 'Test message' },
      ];

      const mockTags: ChatTag[] = [
        { label: 'Tag1', category: 'subject' },
        { label: 'Tag2', category: 'topic' },
        { label: 'Tag3', category: 'grade_level' },
        { label: 'Tag4', category: 'material_type' },
        { label: 'Tag5', category: 'general' },
        { label: 'Tag6', category: 'general' }, // Should be excluded
      ];

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockTags),
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      } as any);

      const result = await extractChatTags('test-chat-id', mockMessages);

      expect(result).toHaveLength(5);
    });

    it('should analyze only first 10 messages', async () => {
      const mockMessages: ChatMessageForTagging[] = Array.from(
        { length: 15 },
        (_, i) => ({
          role: 'user' as const,
          content: `Message ${i + 1}`,
        })
      );

      const mockTags: ChatTag[] = [
        { label: 'Mathematik', category: 'subject' },
      ];

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockTags),
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      } as any);

      await extractChatTags('test-chat-id', mockMessages);

      const callArgs = mockCreate.mock.calls[0]?.[0];
      const userMessage = callArgs?.messages.find(
        (m: any) => m.role === 'user'
      );

      // Should only include 10 messages in the analysis
      expect(userMessage?.content).not.toContain('Message 11');
    });
  });

  describe('extractTagsFromText', () => {
    it('should extract tags from text', async () => {
      const mockTags: ChatTag[] = [
        { label: 'Mathematik', category: 'subject' },
        { label: 'Klasse 5', category: 'grade_level' },
      ];

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockTags),
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
      } as any);

      const result = await extractTagsFromText('Mathematik für Klasse 5');

      expect(result).toEqual(mockTags);
    });

    it('should return empty array for empty text', async () => {
      const result = await extractTagsFromText('');
      expect(result).toEqual([]);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('mergeTags', () => {
    it('should merge and deduplicate tags', () => {
      const existingTags: ChatTag[] = [
        { label: 'Mathematik', category: 'subject' },
        { label: 'Klasse 5', category: 'grade_level' },
      ];

      const newTags: ChatTag[] = [
        { label: 'mathematik', category: 'subject' }, // Duplicate (case-insensitive)
        { label: 'Bruchrechnung', category: 'topic' },
      ];

      const result = mergeTags(existingTags, newTags);

      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          { label: 'mathematik', category: 'subject' }, // Latest version kept
          { label: 'Klasse 5', category: 'grade_level' },
          { label: 'Bruchrechnung', category: 'topic' },
        ])
      );
    });

    it('should limit merged tags to 5', () => {
      const existingTags: ChatTag[] = [
        { label: 'Tag1', category: 'subject' },
        { label: 'Tag2', category: 'topic' },
        { label: 'Tag3', category: 'grade_level' },
      ];

      const newTags: ChatTag[] = [
        { label: 'Tag4', category: 'material_type' },
        { label: 'Tag5', category: 'general' },
        { label: 'Tag6', category: 'general' },
      ];

      const result = mergeTags(existingTags, newTags);

      expect(result).toHaveLength(5);
    });
  });

  describe('tagsToStringArray', () => {
    it('should convert tags to string array', () => {
      const tags: ChatTag[] = [
        { label: 'Mathematik', category: 'subject' },
        { label: 'Bruchrechnung', category: 'topic' },
      ];

      const result = tagsToStringArray(tags);

      expect(result).toEqual(['Mathematik', 'Bruchrechnung']);
    });
  });

  describe('stringArrayToTags', () => {
    it('should convert string array to tags', () => {
      const tagStrings = ['Mathematik', 'Bruchrechnung'];

      const result = stringArrayToTags(tagStrings);

      expect(result).toEqual([
        { label: 'Mathematik', category: 'general' },
        { label: 'Bruchrechnung', category: 'general' },
      ]);
    });
  });
});
