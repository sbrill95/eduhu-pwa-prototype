/**
 * Summary Service for Chat Summaries Feature
 * Generates AI-powered summaries for chat sessions (max 20 characters)
 */

import { openaiClient, OPENAI_CONFIG } from '../config/openai';
import { logError, logInfo } from '../config/logger';

/**
 * Message interface for summary generation
 */
export interface SummaryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Summary Service Class
 * Handles AI-powered summary generation for chat sessions
 */
export class SummaryService {
  /**
   * Generates a summary for a chat (max 20 characters)
   * @param messages - First 3-4 messages of the chat
   * @returns Summary string (≤20 characters) or fallback text
   */
  async generateSummary(messages: SummaryMessage[]): Promise<string> {
    try {
      return await this.generateSummaryInternal(messages);
    } catch (error) {
      logError('Summary generation failed', error as Error);
      return 'Zusammenfassung fehlt';
    }
  }

  /**
   * Internal summary generation that can throw errors
   * @param messages - Chat messages
   * @returns Summary string
   * @throws Error if generation fails
   */
  private async generateSummaryInternal(messages: SummaryMessage[], retryCount: number = 0): Promise<string> {
    // Validate input
    if (!messages || messages.length === 0) {
      logError('Cannot generate summary with empty messages', new Error('Empty messages array'));
      return 'Neuer Chat';
    }

    // Take only the first 4 messages to keep context focused
    const relevantMessages = messages.slice(0, 4);

    const prompt = this.buildPrompt(relevantMessages);

    logInfo('Generating chat summary', { messageCount: relevantMessages.length, retryCount });

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Assistent, der SEHR kurze Zusammenfassungen erstellt. WICHTIG: Maximal 20 Zeichen! Antworte NUR mit der Zusammenfassung. Keine Anführungszeichen. Kürze aggressiv.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 10, // Even lower token limit
      temperature: 0.2, // Very low temperature for consistency
    });

    let summary = response.choices[0]?.message?.content?.trim() || 'Neuer Chat';

    // Remove quotes if present
    summary = summary.replace(/^["']|["']$/g, '');

    // If summary is too long and we haven't retried yet, try again with stricter prompt
    if (summary.length > 20 && retryCount < 1) {
      logInfo('Summary too long, retrying with stricter prompt', {
        length: summary.length,
        summary
      });
      return this.generateSummaryInternal(messages, retryCount + 1);
    }

    // Smart truncation: cut at word boundary if possible
    let finalSummary = summary;
    if (finalSummary.length > 20) {
      // Try to cut at last space before 20 chars
      const truncated = finalSummary.substring(0, 20);
      const lastSpace = truncated.lastIndexOf(' ');

      if (lastSpace > 10) {
        // If we have a space after position 10, cut there
        finalSummary = truncated.substring(0, lastSpace);
      } else {
        // Otherwise just hard cut at 20
        finalSummary = truncated;
      }
    }

    logInfo('Chat summary generated successfully', {
      originalLength: summary.length,
      finalLength: finalSummary.length,
      summary: finalSummary,
      wasTruncated: summary.length > 20
    });

    return finalSummary;
  }

  /**
   * Generates a summary with retry logic
   * @param messages - Chat messages
   * @returns Summary string or fallback
   */
  async generateSummaryWithRetry(messages: SummaryMessage[]): Promise<string> {
    try {
      // First attempt
      return await this.generateSummaryInternal(messages);
    } catch (firstError) {
      logInfo('First summary generation attempt failed, retrying...', {
        error: (firstError as Error).message,
      });

      try {
        // Second attempt (retry)
        await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
        return await this.generateSummaryInternal(messages);
      } catch (secondError) {
        logError('Summary generation failed after retry', secondError as Error);
        return 'Zusammenfassung fehlt';
      }
    }
  }

  /**
   * Builds the prompt for summary generation
   * @param messages - Chat messages
   * @returns Formatted prompt string
   */
  private buildPrompt(messages: SummaryMessage[]): string {
    // Format conversation for the prompt
    const conversation = messages
      .map((m) => {
        const speaker = m.role === 'user' ? 'Lehrer' : 'Assistent';
        return `${speaker}: ${m.content}`;
      })
      .join('\n');

    return `Erstelle eine EXTREM kurze Zusammenfassung (MAXIMAL 20 Zeichen!) für dieses Gespräch auf Deutsch.

WICHTIG:
- Maximal 20 Zeichen (inkl. Leerzeichen)!
- Nur das Kernthema
- Keine Anführungszeichen
- Kürze stark ab

Konversation:
${conversation}

Zusammenfassung (≤20 Zeichen):`;
  }

  /**
   * Validates that a summary meets the length requirement
   * @param summary - Summary to validate
   * @returns true if valid, false otherwise
   */
  validateSummaryLength(summary: string): boolean {
    return summary.length > 0 && summary.length <= 20;
  }
}

/**
 * Export singleton instance for use across the application
 */
export const summaryService = new SummaryService();
