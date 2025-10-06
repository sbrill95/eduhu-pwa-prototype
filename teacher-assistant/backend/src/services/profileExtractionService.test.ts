/**
 * Unit Tests for Profile Extraction Service
 * Tests automatic extraction and categorization of teacher profile characteristics
 */

import { ProfileExtractionService, ChatMessage, ExistingProfileCharacteristic } from './profileExtractionService';
import { openaiClient } from '../config/openai';
import { InstantDBService } from './instantdbService';

// Mock dependencies
jest.mock('../config/openai');
jest.mock('./instantdbService');
jest.mock('../config/logger');

describe('ProfileExtractionService', () => {
  let service: ProfileExtractionService;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    service = new ProfileExtractionService();
    jest.clearAllMocks();
  });

  describe('extractCharacteristics', () => {
    it('should extract 2-3 characteristics from valid chat', async () => {
      // Mock chat messages about mathematics and grade 7
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Ich unterrichte Mathematik in Klasse 7' },
        { role: 'assistant', content: 'Gerne! Was für ein Thema behandeln Sie gerade?' },
        { role: 'user', content: 'Wir arbeiten an Bruchrechnung. Die Schüler haben Schwierigkeiten mit dem Kürzen.' },
        { role: 'assistant', content: 'Ich kann Ihnen dabei helfen...' },
      ];

      const existingProfile: ExistingProfileCharacteristic[] = [];

      // Mock OpenAI extraction response
      (openaiClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: '["Mathematik", "Klasse 7", "Bruchrechnung"]'
            }
          }]
        })
        // Mock categorization responses
        .mockResolvedValueOnce({ choices: [{ message: { content: 'subjects' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'gradeLevel' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'topics' } }] });

      // Mock InstantDB increment
      (InstantDBService.ProfileCharacteristics.incrementCharacteristic as jest.Mock).mockResolvedValue(undefined);

      const result = await service.extractCharacteristics(mockUserId, messages, existingProfile);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ characteristic: 'Mathematik', category: 'subjects' });
      expect(result[1]).toEqual({ characteristic: 'Klasse 7', category: 'gradeLevel' });
      expect(result[2]).toEqual({ characteristic: 'Bruchrechnung', category: 'topics' });

      // Verify InstantDB was called for each characteristic
      expect(InstantDBService.ProfileCharacteristics.incrementCharacteristic).toHaveBeenCalledTimes(3);
    });

    it('should handle empty/short chats gracefully', async () => {
      const emptyMessages: ChatMessage[] = [];
      const result1 = await service.extractCharacteristics(mockUserId, emptyMessages, []);
      expect(result1).toEqual([]);

      const shortMessages: ChatMessage[] = [
        { role: 'user', content: 'Hallo' }
      ];
      const result2 = await service.extractCharacteristics(mockUserId, shortMessages, []);
      expect(result2).toEqual([]);

      // Verify OpenAI was never called
      expect(openaiClient.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should limit extraction to max 3 characteristics', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Ich unterrichte Mathematik, Deutsch, Englisch und Geschichte' },
        { role: 'assistant', content: 'Das ist eine vielfältige Fächerkombination!' },
      ];

      // Mock OpenAI returning 5 characteristics
      (openaiClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: '["Mathematik", "Deutsch", "Englisch", "Geschichte", "Klasse 8"]'
            }
          }]
        })
        // Mock categorization responses (only 3 will be used)
        .mockResolvedValueOnce({ choices: [{ message: { content: 'subjects' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'subjects' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'subjects' } }] });

      (InstantDBService.ProfileCharacteristics.incrementCharacteristic as jest.Mock).mockResolvedValue(undefined);

      const result = await service.extractCharacteristics(mockUserId, messages, []);

      // Should be limited to 3
      expect(result).toHaveLength(3);
      expect(result[0]?.characteristic).toBe('Mathematik');
      expect(result[1]?.characteristic).toBe('Deutsch');
      expect(result[2]?.characteristic).toBe('Englisch');
    });

    it('should handle OpenAI API failure gracefully', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Ich unterrichte Mathematik' },
        { role: 'assistant', content: 'Toll!' },
      ];

      // Mock OpenAI failure
      (openaiClient.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('OpenAI API rate limit exceeded')
      );

      const result = await service.extractCharacteristics(mockUserId, messages, []);

      // Should return empty array on error
      expect(result).toEqual([]);
    });

    it('should handle invalid JSON response from OpenAI', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Ich unterrichte Mathematik' },
        { role: 'assistant', content: 'Toll!' },
      ];

      // Mock OpenAI returning invalid JSON
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{
          message: {
            content: 'This is not JSON'
          }
        }]
      });

      const result = await service.extractCharacteristics(mockUserId, messages, []);

      // Should return empty array
      expect(result).toEqual([]);
    });

    it('should avoid duplicate characteristics', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Ich unterrichte Mathematik in Klasse 7' },
        { role: 'assistant', content: 'Toll!' },
      ];

      const existingProfile: ExistingProfileCharacteristic[] = [
        {
          id: 'char-1',
          user_id: mockUserId,
          characteristic: 'Mathematik',
          category: 'subjects',
          count: 5,
          first_seen: Date.now(),
          last_seen: Date.now(),
          manually_added: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        }
      ];

      // Mock OpenAI extracting "Mathematik" again
      (openaiClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: '["Mathematik", "Klasse 7"]'
            }
          }]
        })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'subjects' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'gradeLevel' } }] });

      (InstantDBService.ProfileCharacteristics.incrementCharacteristic as jest.Mock).mockResolvedValue(undefined);

      const result = await service.extractCharacteristics(mockUserId, messages, existingProfile);

      // Should still extract both, but InstantDB will handle incrementing existing
      expect(result).toHaveLength(2);
      expect(InstantDBService.ProfileCharacteristics.incrementCharacteristic).toHaveBeenCalledWith(
        mockUserId,
        'Mathematik',
        'subjects'
      );
    });
  });

  describe('categorizeCharacteristic', () => {
    it('should categorize subjects correctly', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: 'subjects' } }]
      });

      const result = await service.categorizeCharacteristic('Mathematik');
      expect(result).toBe('subjects');
    });

    it('should categorize grade levels correctly', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({
        choices: [{ message: { content: 'gradeLevel' } }]
      });

      const result = await service.categorizeCharacteristic('Klasse 7');
      expect(result).toBe('gradeLevel');
    });

    it('should categorize teaching styles correctly', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({
        choices: [{ message: { content: 'teachingStyle' } }]
      });

      const result = await service.categorizeCharacteristic('Gruppenarbeit');
      expect(result).toBe('teachingStyle');
    });

    it('should categorize school types correctly', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValueOnce({
        choices: [{ message: { content: 'schoolType' } }]
      });

      const result = await service.categorizeCharacteristic('Gymnasium');
      expect(result).toBe('schoolType');
    });

    it('should categorize topics correctly', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: 'topics' } }]
      });

      const result = await service.categorizeCharacteristic('Bruchrechnung');
      expect(result).toBe('topics');
    });

    it('should default to uncategorized for invalid category', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: 'invalid_category' } }]
      });

      const result = await service.categorizeCharacteristic('Something weird');
      expect(result).toBe('uncategorized');
    });

    it('should default to uncategorized on OpenAI error', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('OpenAI API error')
      );

      const result = await service.categorizeCharacteristic('Test');
      expect(result).toBe('uncategorized');
    });

    it('should return uncategorized for case mismatch', async () => {
      (openaiClient.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: 'SUBJECTS' } }]
      });

      const result = await service.categorizeCharacteristic('Mathematik');
      // Uppercase won't match validCategories, so should default to uncategorized
      expect(result).toBe('uncategorized');
    });
  });

  describe('buildExtractionPrompt', () => {
    it('should build prompt with conversation and existing profile', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Ich unterrichte Mathematik' },
        { role: 'assistant', content: 'Toll!' },
      ];

      const existingProfile: ExistingProfileCharacteristic[] = [
        {
          id: 'char-1',
          user_id: mockUserId,
          characteristic: 'Englisch',
          category: 'subjects',
          count: 3,
          first_seen: Date.now(),
          last_seen: Date.now(),
          manually_added: false,
          created_at: Date.now(),
          updated_at: Date.now(),
        }
      ];

      // Access private method via any cast for testing
      const prompt = (service as any).buildExtractionPrompt(messages, existingProfile);

      expect(prompt).toContain('Lehrer: Ich unterrichte Mathematik');
      expect(prompt).toContain('Assistant: Toll!');
      expect(prompt).toContain('Bestehende Profil-Merkmale:');
      expect(prompt).toContain('Englisch');
    });

    it('should handle empty existing profile', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hallo' },
      ];

      const prompt = (service as any).buildExtractionPrompt(messages, []);

      expect(prompt).toContain('Bestehende Profil-Merkmale:');
      expect(prompt).toContain('Keine');
    });

    it('should limit conversation to last 10 messages', () => {
      const manyMessages: ChatMessage[] = Array.from({ length: 20 }, (_, i) => ({
        role: 'user' as const,
        content: `Message ${i}`
      }));

      const prompt = (service as any).buildExtractionPrompt(manyMessages, []);

      // Should only contain first 10 messages (0-9)
      expect(prompt).toContain('Message 0');
      expect(prompt).toContain('Message 9');
      expect(prompt).not.toContain('Message 10');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle missing userId', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Test' },
        { role: 'assistant', content: 'Response' },
      ];

      const result = await service.extractCharacteristics('', messages, []);
      expect(result).toEqual([]);
    });

    it('should handle null messages array', async () => {
      const result = await service.extractCharacteristics(mockUserId, null as any, []);
      expect(result).toEqual([]);
    });

    it('should continue processing even if one characteristic fails to increment', async () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Ich unterrichte Mathematik und Deutsch' },
        { role: 'assistant', content: 'Super!' },
      ];

      (openaiClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: '["Mathematik", "Deutsch"]'
            }
          }]
        })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'subjects' } }] })
        .mockResolvedValueOnce({ choices: [{ message: { content: 'subjects' } }] });

      // Mock first increment to fail, second to succeed
      (InstantDBService.ProfileCharacteristics.incrementCharacteristic as jest.Mock)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(undefined);

      const result = await service.extractCharacteristics(mockUserId, messages, []);

      // Should still return all extracted characteristics
      expect(result).toHaveLength(2);
      expect(InstantDBService.ProfileCharacteristics.incrementCharacteristic).toHaveBeenCalledTimes(2);
    });
  });
});
