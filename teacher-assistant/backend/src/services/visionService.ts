import OpenAI from 'openai';
import { config } from '../config';
import { logInfo, logError } from '../config/logger';

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

interface TaggingContext {
  title?: string;
  description?: string;
  subject?: string;
  grade?: string;
}

interface TaggingResult {
  tags: string[];
  confidence: 'high' | 'medium' | 'low';
  model: string;
  processingTime: number;
}

/**
 * Vision Service for automatic image tagging using GPT-4o Vision
 * Used for generating searchable tags for educational materials
 */
export class VisionService {
  /**
   * Generate tags for an educational image using GPT-4o Vision
   * @param imageUrl - URL of the image to tag
   * @param context - Optional context about the image (title, description, subject, grade)
   * @returns TaggingResult with tags, confidence, model, and processing time
   */
  static async tagImage(
    imageUrl: string,
    context?: TaggingContext
  ): Promise<TaggingResult> {
    const startTime = Date.now();

    try {
      // Build context string
      const contextStr = context
        ? `
        Kontext:
        - Titel: ${context.title || 'Nicht angegeben'}
        - Beschreibung: ${context.description || 'Nicht angegeben'}
        - Fach: ${context.subject || 'Nicht angegeben'}
        - Klassenstufe: ${context.grade || 'Nicht angegeben'}
      `
        : '';

      const prompt = `Analysiere dieses Bildungsmaterial und generiere 5-10 relevante Tags auf Deutsch für Suchzwecke.

      Berücksichtige:
      - Fachgebiet (z.B. Biologie, Mathematik, Geschichte)
      - Thema (z.B. Anatomie, Geometrie, Mittelalter)
      - Visuelle Elemente (z.B. Diagramm, Foto, Illustration)
      - Bildungskontext (z.B. Grundschule, Sekundarstufe)
      - Perspektive/Darstellung (z.B. Seitenansicht, Querschnitt)

      ${contextStr}

      Antwort nur als kommaseparierte Liste von Tags (keine Erklärungen):`;

      logInfo('[VisionService] Calling GPT-4o Vision for tagging...', {
        imageUrl,
        hasContext: !!context,
      });

      const response = (await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                    detail: 'low', // Faster, cheaper for tagging
                  },
                },
              ],
            },
          ],
          max_tokens: 100,
          temperature: 0.3, // Lower for more consistent tags
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Vision API timeout (30s)')),
            30000
          )
        ),
      ])) as OpenAI.Chat.Completions.ChatCompletion;

      const content = response.choices[0]?.message?.content || '';
      const rawTags = content.split(',').map((t) => t.trim());

      const normalizedTags = this.normalizeTags(rawTags);
      const processingTime = Date.now() - startTime;

      logInfo(
        `[VisionService] Generated ${normalizedTags.length} tags in ${processingTime}ms:`,
        { tags: normalizedTags }
      );

      return {
        tags: normalizedTags,
        confidence: normalizedTags.length >= 5 ? 'high' : 'medium',
        model: 'gpt-4o',
        processingTime,
      };
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logError('[VisionService] Tagging failed:', error as Error);

      // Graceful degradation
      return {
        tags: [],
        confidence: 'low',
        model: 'gpt-4o',
        processingTime,
      };
    }
  }

  /**
   * Normalize tags: lowercase, trim, deduplicate, limit to 15
   * @param tags - Array of raw tags
   * @returns Array of normalized tags
   */
  private static normalizeTags(tags: string[]): string[] {
    const normalized = tags
      .map((t) => t.toLowerCase().trim())
      .filter((t) => t.length > 0 && t.length < 50); // Remove empty and too long

    const uniqueTags = Array.from(new Set(normalized));
    return uniqueTags.slice(0, 15);
  }
}

export default VisionService;
