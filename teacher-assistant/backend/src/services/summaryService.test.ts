/**
 * Summary Service Unit Tests
 * Tests for chat summary generation functionality
 */

import { SummaryService, SummaryMessage } from './summaryService';
import { openaiClient } from '../config/openai';

// Mock the OpenAI client
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

// Mock logger to prevent console spam during tests
jest.mock('../config/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

describe('SummaryService', () => {
  let summaryService: SummaryService;
  const mockCreate = openaiClient.chat.completions
    .create as jest.MockedFunction<typeof openaiClient.chat.completions.create>;

  beforeEach(() => {
    summaryService = new SummaryService();
    jest.clearAllMocks();
  });

  describe('generateSummary', () => {
    it('should generate a summary ≤20 characters', async () => {
      // Mock OpenAI response with a valid summary
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Bruchrechnung Kl. 7',
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o-mini',
      } as any);

      const messages: SummaryMessage[] = [
        {
          role: 'user',
          content: 'Ich brauche ein Arbeitsblatt zur Bruchrechnung',
        },
        { role: 'assistant', content: 'Gerne! Für welche Klassenstufe?' },
        { role: 'user', content: 'Klasse 7' },
      ];

      const summary = await summaryService.generateSummary(messages);

      expect(summary).toBeDefined();
      expect(summary.length).toBeLessThanOrEqual(20);
      expect(summary).toBe('Bruchrechnung Kl. 7');
    });

    it('should enforce 20-character limit on long summaries', async () => {
      // Mock OpenAI response with a summary longer than 20 chars
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content:
                'This is a very long summary that exceeds the character limit',
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o-mini',
      } as any);

      const messages: SummaryMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const summary = await summaryService.generateSummary(messages);

      // Smart truncation cuts at word boundary (last space before 20 chars)
      expect(summary.length).toBeLessThanOrEqual(20);
      expect(summary).toBe('This is a very long');
    });

    it('should return fallback text on OpenAI API error', async () => {
      // Mock OpenAI error
      mockCreate.mockRejectedValue(new Error('API Error'));

      const messages: SummaryMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const summary = await summaryService.generateSummary(messages);

      expect(summary).toBe('Zusammenfassung fehlt');
    });

    it('should return "Neuer Chat" for empty messages array', async () => {
      const messages: SummaryMessage[] = [];

      const summary = await summaryService.generateSummary(messages);

      expect(summary).toBe('Neuer Chat');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should use only first 4 messages for context', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Test summary',
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o-mini',
      } as any);

      const messages: SummaryMessage[] = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Message 2' },
        { role: 'user', content: 'Message 3' },
        { role: 'assistant', content: 'Message 4' },
        { role: 'user', content: 'Message 5' }, // Should be ignored
        { role: 'assistant', content: 'Message 6' }, // Should be ignored
      ];

      await summaryService.generateSummary(messages);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Message 4'), // Should include up to message 4
            }),
          ]),
        })
      );

      // Verify the prompt doesn't include messages 5 and 6
      const callArgs = mockCreate.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      const userMessage = callArgs?.messages.find(
        (m: any) => m.role === 'user'
      );
      expect(userMessage).toBeDefined();
      expect(userMessage?.content).not.toContain('Message 5');
      expect(userMessage?.content).not.toContain('Message 6');
    });

    it('should call OpenAI with correct parameters', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Test summary',
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o-mini',
      } as any);

      const messages: SummaryMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      await summaryService.generateSummary(messages);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Maximal 20 Zeichen'),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Zusammenfassung (≤20 Zeichen)'),
          }),
        ]),
        max_tokens: 10,
        temperature: 0.2,
      });
    });
  });

  describe('generateSummaryWithRetry', () => {
    it('should return summary on first attempt success', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Test summary',
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o-mini',
      } as any);

      const messages: SummaryMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const summary = await summaryService.generateSummaryWithRetry(messages);

      expect(summary).toBe('Test summary');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should retry on first attempt failure and succeed on second attempt', async () => {
      // Clear all previous mocks
      jest.clearAllMocks();

      // First call fails, second call succeeds
      mockCreate
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Retry success',
                role: 'assistant',
              },
              finish_reason: 'stop',
              index: 0,
            },
          ],
          id: 'test-id',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gpt-4o-mini',
        } as any);

      const messages: SummaryMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const summary = await summaryService.generateSummaryWithRetry(messages);

      expect(summary).toBe('Retry success');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should return fallback text after both attempts fail', async () => {
      // Clear all previous mocks
      jest.clearAllMocks();

      // Both attempts fail
      mockCreate
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'));

      const messages: SummaryMessage[] = [
        { role: 'user', content: 'Test message' },
      ];

      const summary = await summaryService.generateSummaryWithRetry(messages);

      expect(summary).toBe('Zusammenfassung fehlt');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateSummaryLength', () => {
    it('should return true for valid summaries', () => {
      expect(summaryService.validateSummaryLength('Bruchrechnung')).toBe(true);
      expect(summaryService.validateSummaryLength('Quiz Klasse 7')).toBe(true);
      expect(summaryService.validateSummaryLength('A')).toBe(true); // Single char is valid
      expect(summaryService.validateSummaryLength('12345678901234567890')).toBe(
        true
      ); // Exactly 20
    });

    it('should return false for invalid summaries', () => {
      expect(summaryService.validateSummaryLength('')).toBe(false); // Empty
      expect(
        summaryService.validateSummaryLength('123456789012345678901')
      ).toBe(false); // 21 chars
      expect(
        summaryService.validateSummaryLength(
          'This is way too long for a summary'
        )
      ).toBe(false);
    });
  });

  describe('buildPrompt (via integration)', () => {
    it('should format messages correctly in prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Test',
              role: 'assistant',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o-mini',
      } as any);

      const messages: SummaryMessage[] = [
        { role: 'user', content: 'Hallo' },
        { role: 'assistant', content: 'Guten Tag' },
      ];

      await summaryService.generateSummary(messages);

      const callArgs = mockCreate.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      const userMessage = callArgs?.messages.find(
        (m: any) => m.role === 'user'
      );
      expect(userMessage).toBeDefined();

      expect(userMessage?.content).toContain('Lehrer: Hallo');
      expect(userMessage?.content).toContain('Assistent: Guten Tag');
    });
  });
});
