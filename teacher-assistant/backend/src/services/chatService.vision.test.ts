/**
 * Tests for ChatGPT Vision Integration
 * TASK-016: Verify that generated images are included in conversation context
 */

import { ChatService } from './chatService';
import { ChatMessage } from '../types';

describe('ChatService Vision Integration', () => {
  describe.skip('processMessagesForVision', () => {
    it('should detect and format messages with image metadata', () => {
      // Access private method via type casting for testing
      const processMessagesForVision = (
        ChatService as any
      ).processMessagesForVision.bind(ChatService);

      const messages: any[] = [
        {
          role: 'user',
          content: 'Erstelle ein Bild von einem Löwen',
        },
        {
          role: 'assistant',
          content: 'Ich habe ein Bild für dich erstellt.',
          metadata: JSON.stringify({
            type: 'image',
            image_url: 'https://example.com/lion.png',
            library_id: 'xyz123',
          }),
        },
        {
          role: 'user',
          content: 'Was siehst du auf dem Bild?',
        },
      ];

      const result = processMessagesForVision(messages);

      expect(result.hasImages).toBe(true);
      expect(result.messages).toHaveLength(3);

      // Check first message (user) - unchanged
      expect(result.messages[0].content).toBe(
        'Erstelle ein Bild von einem Löwen'
      );

      // Check second message (assistant with image) - should be multimodal
      expect(Array.isArray(result.messages[1].content)).toBe(true);
      expect(result.messages[1].content).toHaveLength(2);
      expect(result.messages[1].content[0].type).toBe('text');
      expect(result.messages[1].content[0].text).toBe(
        'Ich habe ein Bild für dich erstellt.'
      );
      expect(result.messages[1].content[1].type).toBe('image_url');
      expect(result.messages[1].content[1].image_url.url).toBe(
        'https://example.com/lion.png'
      );
      expect(result.messages[1].content[1].image_url.detail).toBe('auto');

      // Check third message (user) - unchanged
      expect(result.messages[2].content).toBe('Was siehst du auf dem Bild?');
    });

    it('should handle messages without image metadata', () => {
      const processMessagesForVision = (
        ChatService as any
      ).processMessagesForVision.bind(ChatService);

      const messages: any[] = [
        {
          role: 'user',
          content: 'Was ist 2+2?',
        },
        {
          role: 'assistant',
          content: '2+2 ist 4.',
        },
      ];

      const result = processMessagesForVision(messages);

      expect(result.hasImages).toBe(false);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].content).toBe('Was ist 2+2?');
      expect(result.messages[1].content).toBe('2+2 ist 4.');
    });

    it('should handle metadata as object (not string)', () => {
      const processMessagesForVision = (
        ChatService as any
      ).processMessagesForVision.bind(ChatService);

      const messages: any[] = [
        {
          role: 'assistant',
          content: 'Hier ist dein Bild.',
          metadata: {
            type: 'image',
            image_url: 'https://example.com/image.png',
          },
        },
      ];

      const result = processMessagesForVision(messages);

      expect(result.hasImages).toBe(true);
      expect(Array.isArray(result.messages[0].content)).toBe(true);
    });

    it('should skip already processed multimodal messages', () => {
      const processMessagesForVision = (
        ChatService as any
      ).processMessagesForVision.bind(ChatService);

      const messages: any[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Look at this' },
            {
              type: 'image_url',
              image_url: { url: 'https://example.com/img.png' },
            },
          ],
        },
      ];

      const result = processMessagesForVision(messages);

      expect(result.hasImages).toBe(true);
      expect(result.messages[0].content).toEqual(messages[0].content);
    });

    it('should handle invalid metadata gracefully', () => {
      const processMessagesForVision = (
        ChatService as any
      ).processMessagesForVision.bind(ChatService);

      const messages: any[] = [
        {
          role: 'assistant',
          content: 'Test message',
          metadata: 'invalid json{',
        },
      ];

      const result = processMessagesForVision(messages);

      // Should not crash, should treat as regular message
      expect(result.hasImages).toBe(false);
      expect(result.messages[0].content).toBe('Test message');
    });

    it('should handle metadata without image_url', () => {
      const processMessagesForVision = (
        ChatService as any
      ).processMessagesForVision.bind(ChatService);

      const messages: any[] = [
        {
          role: 'assistant',
          content: 'Test message',
          metadata: JSON.stringify({
            type: 'text',
            some_other_field: 'value',
          }),
        },
      ];

      const result = processMessagesForVision(messages);

      // Should not be treated as image message
      expect(result.hasImages).toBe(false);
      expect(result.messages[0].content).toBe('Test message');
    });
  });
});
