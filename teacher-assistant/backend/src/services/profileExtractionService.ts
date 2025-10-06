/**
 * Profile Extraction Service
 * Automatically extracts teacher profile characteristics from chat conversations
 * using AI to build rich, personalized profiles organically over time.
 */

import { openaiClient, OPENAI_CONFIG } from '../config/openai';
import { logError, logInfo } from '../config/logger';
import { InstantDBService } from './instantdbService';

/**
 * Chat message interface for extraction
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Profile characteristic with category
 */
export interface ProfileCharacteristic {
  characteristic: string;
  category: string;
}

/**
 * Existing profile characteristic (from database)
 */
export interface ExistingProfileCharacteristic {
  id: string;
  user_id: string;
  characteristic: string;
  category: string;
  count: number;
  first_seen: number;
  last_seen: number;
  manually_added: boolean;
  created_at: number;
  updated_at: number;
}

/**
 * Profile Extraction Service Class
 * Handles automatic extraction of teacher characteristics from conversations
 */
export class ProfileExtractionService {
  /**
   * Extracts 2-3 profile characteristics from a chat conversation
   * Focuses on recurring themes, NOT one-off mentions
   *
   * @param userId - User ID
   * @param messages - Chat messages from the conversation
   * @param existingProfile - User's existing profile characteristics
   * @returns Array of extracted characteristics with categories
   */
  async extractCharacteristics(
    userId: string,
    messages: ChatMessage[],
    existingProfile: ExistingProfileCharacteristic[] = []
  ): Promise<ProfileCharacteristic[]> {
    // Validate inputs
    if (!userId || !messages || messages.length < 2) {
      logInfo('Skipping profile extraction - insufficient messages', {
        userId,
        messageCount: messages?.length || 0
      });
      return [];
    }

    try {
      // Build extraction prompt
      const prompt = this.buildExtractionPrompt(messages, existingProfile);

      logInfo('Starting profile characteristic extraction', {
        userId,
        messageCount: messages.length,
        existingCharacteristicsCount: existingProfile.length
      });

      // Call OpenAI for extraction
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Experte darin, Lehrerprofil-Merkmale aus Gesprächen zu extrahieren.

WICHTIG: Extrahiere 2-3 relevante, wiederkehrende Merkmale.
- Fokus: Fächer, Prinzipien, Klassenstufen, Schultyp, wiederkehrende Themen
- Ignoriere einmalige Erwähnungen (z.B. "Arbeitsblatt" nur weil eins generiert wurde)
- Suche nach Mustern und wiederkehrenden Themen
- Bevorzuge spezifische über allgemeine Merkmale

ANTWORTE NUR mit einem JSON Array von Strings: ["Merkmal1", "Merkmal2", "Merkmal3"]
Keine Erklärungen, nur das JSON Array.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content?.trim() || '[]';

      // Parse JSON response
      let characteristics: string[] = [];
      try {
        characteristics = JSON.parse(content);
      } catch (parseError) {
        logError('Failed to parse OpenAI response', parseError as Error, { content });
        return [];
      }

      // Validate that we got an array
      if (!Array.isArray(characteristics)) {
        logError('OpenAI returned non-array response', new Error('Invalid response format'), { content });
        return [];
      }

      // Limit to 2-3 characteristics
      characteristics = characteristics.slice(0, 3);

      logInfo('Successfully extracted characteristics', {
        userId,
        extractedCount: characteristics.length,
        characteristics
      });

      // Categorize each characteristic
      const categorized = await Promise.all(
        characteristics.map(async (char) => {
          const category = await this.categorizeCharacteristic(char);
          return { characteristic: char, category };
        })
      );

      // Update counts in database
      await this.updateCharacteristicCounts(userId, categorized);

      return categorized;

    } catch (error) {
      logError('Profile extraction failed', error as Error, { userId });
      return []; // Graceful fallback - return empty array on error
    }
  }

  /**
   * Categorizes a characteristic into a profile category
   *
   * @param characteristic - The characteristic to categorize
   * @returns Category string (subjects, gradeLevel, teachingStyle, schoolType, topics, uncategorized)
   */
  async categorizeCharacteristic(characteristic: string): Promise<string> {
    const validCategories = ['subjects', 'gradeLevel', 'teachingStyle', 'schoolType', 'topics', 'uncategorized'];

    const prompt = `Kategorisiere dieses Lehrerprofil-Merkmal:
"${characteristic}"

Kategorien:
- subjects: Unterrichtsfächer (Mathematik, Englisch, SOL, etc.)
- gradeLevel: Klassenstufen (Klasse 5, Sekundarstufe I, Klasse 7-9, etc.)
- teachingStyle: Unterrichtsmethoden (Gruppenarbeit, Differenzierung, Projektarbeit, etc.)
- schoolType: Schulform (Gymnasium, Realschule, Gesamtschule, etc.)
- topics: Wiederkehrende Themen (Bruchrechnung, Photosynthese, Literaturanalyse, etc.)
- uncategorized: Nicht zuordenbar

Antworte NUR mit der Kategorie (ein Wort, lowercase).`;

    try {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Kategorisierungs-Experte. Antworte nur mit einem Wort: der Kategorie.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 10,
        temperature: 0.2,
      });

      const category = response.choices[0]?.message?.content?.trim() || 'uncategorized';

      // Validate category
      if (!validCategories.includes(category)) {
        logInfo('Invalid category returned, defaulting to uncategorized', {
          characteristic,
          returnedCategory: category
        });
        return 'uncategorized';
      }

      return category;

    } catch (error) {
      logError('Categorization failed, defaulting to uncategorized', error as Error, { characteristic });
      return 'uncategorized';
    }
  }

  /**
   * Updates characteristic counts in database
   * Increments count for existing characteristics or creates new ones
   *
   * @param userId - User ID
   * @param characteristics - Array of characteristics with categories
   */
  private async updateCharacteristicCounts(
    userId: string,
    characteristics: ProfileCharacteristic[]
  ): Promise<void> {
    for (const { characteristic, category } of characteristics) {
      try {
        await InstantDBService.ProfileCharacteristics.incrementCharacteristic(
          userId,
          characteristic,
          category
        );

        logInfo('Characteristic count updated', { userId, characteristic, category });
      } catch (error) {
        logError('Failed to update characteristic count', error as Error, {
          userId,
          characteristic,
          category
        });
        // Continue with next characteristic even if one fails
      }
    }
  }

  /**
   * Builds extraction prompt for OpenAI
   *
   * @param messages - Chat messages
   * @param existingProfile - Existing profile characteristics
   * @returns Formatted prompt string
   */
  private buildExtractionPrompt(
    messages: ChatMessage[],
    existingProfile: ExistingProfileCharacteristic[]
  ): string {
    // Format conversation
    const conversation = messages
      .slice(0, 10) // Limit to last 10 messages for context
      .map(m => `${m.role === 'user' ? 'Lehrer' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    // Format existing profile characteristics
    const existing = existingProfile
      .map(p => p.characteristic)
      .slice(0, 15) // Limit to top 15 for context
      .join(', ');

    return `Konversation:
${conversation}

Bestehende Profil-Merkmale:
${existing || 'Keine'}

Extrahiere 2-3 neue oder wiederkehrende Merkmale aus dieser Konversation.
Fokus: Fächer, Prinzipien, Klassenstufen, Schultyp, wiederkehrende Themen.
Ignoriere Einzel-Erwähnungen wie "Arbeitsblatt" oder "Bild" (es sei denn, sie sind zentral für das Gespräch).

Beispiele guter Merkmale:
- "SOL" (wenn mehrfach erwähnt oder zentral)
- "Klasse 7"
- "Gruppenarbeit"
- "Differenzierung"
- "Mathematik"
- "Bruchrechnung" (wenn wiederkehrendes Thema)

JSON Array (2-3 Merkmale):`;
  }
}

/**
 * Export singleton instance
 */
export const profileExtractionService = new ProfileExtractionService();
