/**
 * Chat Tag Service
 * Extracts meaningful tags from chat conversations for categorization and search
 */

import { openaiClient, OPENAI_CONFIG } from '../config/openai';
import { logError, logInfo } from '../config/logger';

/**
 * Represents a chat tag with category classification
 */
export interface ChatTag {
  label: string;
  category: 'subject' | 'topic' | 'grade_level' | 'material_type' | 'general';
  confidence?: number;
}

/**
 * Represents a message in a chat
 */
export interface ChatMessageForTagging {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * System prompt for tag extraction
 */
const TAG_EXTRACTION_PROMPT = `Du bist ein Experte für die Analyse von Lehrkraft-Gesprächen und die Extraktion relevanter Tags.

Analysiere die folgenden Chat-Nachrichten zwischen einer Lehrkraft und einem AI-Assistenten.
Extrahiere 3-5 relevante Tags in folgenden Kategorien:

**Kategorien:**
- **subject**: Schulfächer (z.B. Mathematik, Deutsch, Englisch, Geschichte, Biologie, Physik, Chemie, Erdkunde, etc.)
- **topic**: Spezifische Themen innerhalb eines Fachs (z.B. Bruchrechnung, Gedichtanalyse, Industrial Revolution, Photosynthese)
- **grade_level**: Klassenstufe oder Bildungsstufe (z.B. Klasse 5, Klasse 10, Oberstufe, Grundschule, Sekundarstufe)
- **material_type**: Art des erstellten Materials (z.B. Arbeitsblatt, Quiz, Präsentation, Unterrichtsplan, Test)
- **general**: Allgemeine pädagogische Konzepte (z.B. Gruppenarbeit, Hausaufgaben, Prüfungsvorbereitung, Differenzierung, Projektarbeit)

**Richtlinien:**
1. Wähle 3-5 Tags aus, die den Chat am besten beschreiben
2. Priorisiere konkrete, spezifische Tags über allgemeine
3. Verwende deutsche Begriffe
4. Achte auf die richtige Kategorisierung
5. Wenn ein Fach klar erkennbar ist, füge es immer als subject Tag hinzu
6. Wenn eine Klassenstufe erwähnt wird, füge sie als grade_level Tag hinzu

**Antwortformat:**
Antworte NUR mit einem JSON-Array im folgenden Format:
[
  {"label": "Mathematik", "category": "subject"},
  {"label": "Bruchrechnung", "category": "topic"},
  {"label": "Klasse 5", "category": "grade_level"}
]

Wenn keine relevanten Tags gefunden werden können, antworte mit einem leeren Array: []`;

/**
 * Extract tags from chat messages using OpenAI
 */
export async function extractChatTags(
  chatSessionId: string,
  messages: ChatMessageForTagging[]
): Promise<ChatTag[]> {
  try {
    // Validate input
    if (!messages || messages.length === 0) {
      logInfo('No messages provided for tag extraction', { chatSessionId });
      return [];
    }

    // Take first 10 messages for analysis (more context for better tags)
    const messagesToAnalyze = messages.slice(0, 10);

    // Build conversation string for analysis
    const conversationText = messagesToAnalyze
      .map((msg) => {
        const roleLabel =
          msg.role === 'user'
            ? 'Lehrkraft'
            : msg.role === 'assistant'
              ? 'Assistent'
              : 'System';
        return `${roleLabel}: ${msg.content}`;
      })
      .join('\n\n');

    logInfo('Extracting tags from chat', {
      chatSessionId,
      messageCount: messagesToAnalyze.length,
    });

    // Call OpenAI for tag extraction
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini', // Use gpt-4o-mini for cost-effective tagging
      messages: [
        { role: 'system', content: TAG_EXTRACTION_PROMPT },
        {
          role: 'user',
          content: `Analysiere diese Unterhaltung und extrahiere relevante Tags:\n\n${conversationText}`,
        },
      ],
      temperature: 0.3, // Low temperature for consistent tagging
      max_tokens: 500,
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      logError(
        'Empty response from OpenAI for tag extraction',
        new Error('No content in OpenAI response'),
        { chatSessionId }
      );
      return [];
    }

    // Parse JSON response
    try {
      const tags: ChatTag[] = JSON.parse(responseContent.trim());

      // Validate tags structure
      if (!Array.isArray(tags)) {
        throw new Error('Response is not an array');
      }

      // Validate each tag
      const validTags = tags.filter((tag) => {
        return (
          tag &&
          typeof tag.label === 'string' &&
          tag.label.length > 0 &&
          typeof tag.category === 'string' &&
          [
            'subject',
            'topic',
            'grade_level',
            'material_type',
            'general',
          ].includes(tag.category)
        );
      });

      // Limit to 5 tags
      const limitedTags = validTags.slice(0, 5);

      logInfo('Successfully extracted tags', {
        chatSessionId,
        tagCount: limitedTags.length,
        tags: limitedTags,
      });

      return limitedTags;
    } catch (parseError) {
      logError('Failed to parse tag extraction response', parseError as Error, {
        chatSessionId,
        response: responseContent,
      });
      return [];
    }
  } catch (error) {
    logError('Error extracting chat tags', error as Error, { chatSessionId });
    // Return empty array on error - don't break the UI
    return [];
  }
}

/**
 * Extract tags from a simple text description (for quick tagging without full chat)
 */
export async function extractTagsFromText(text: string): Promise<ChatTag[]> {
  try {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: TAG_EXTRACTION_PROMPT },
        {
          role: 'user',
          content: `Analysiere diesen Text und extrahiere relevante Tags:\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return [];
    }

    const tags: ChatTag[] = JSON.parse(responseContent.trim());

    if (!Array.isArray(tags)) {
      return [];
    }

    const validTags = tags.filter((tag) => {
      return (
        tag &&
        typeof tag.label === 'string' &&
        tag.label.length > 0 &&
        typeof tag.category === 'string' &&
        [
          'subject',
          'topic',
          'grade_level',
          'material_type',
          'general',
        ].includes(tag.category)
      );
    });

    return validTags.slice(0, 5);
  } catch (error) {
    logError('Error extracting tags from text', error as Error, { text });
    return [];
  }
}

/**
 * Merge and deduplicate tags
 */
export function mergeTags(
  existingTags: ChatTag[],
  newTags: ChatTag[]
): ChatTag[] {
  const tagMap = new Map<string, ChatTag>();

  // Add existing tags
  existingTags.forEach((tag) => {
    const key = `${tag.category}:${tag.label.toLowerCase()}`;
    tagMap.set(key, tag);
  });

  // Add new tags (will overwrite if duplicate)
  newTags.forEach((tag) => {
    const key = `${tag.category}:${tag.label.toLowerCase()}`;
    tagMap.set(key, tag);
  });

  // Convert back to array and limit to 5 tags
  return Array.from(tagMap.values()).slice(0, 5);
}

/**
 * Convert tags to string array format (for simple display)
 */
export function tagsToStringArray(tags: ChatTag[]): string[] {
  return tags.map((tag) => tag.label);
}

/**
 * Convert string array to ChatTag format (assumes 'general' category)
 */
export function stringArrayToTags(tagStrings: string[]): ChatTag[] {
  return tagStrings.map((label) => ({
    label,
    category: 'general' as const,
  }));
}
