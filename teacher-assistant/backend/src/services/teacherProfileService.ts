import { openaiClient, OPENAI_CONFIG } from '../config/openai';
import {
  KnowledgeExtractionRequest,
  KnowledgeExtractionResponse,
  ChatErrorResponse,
  TeacherKnowledge,
  ChatMessage,
} from '../types';
import { OpenAI } from 'openai';
import { logError, logInfo } from '../config/logger';

/**
 * Service class for extracting teacher profile knowledge from chat conversations using OpenAI
 */
export class TeacherProfileService {
  /**
   * Extract teacher knowledge from chat conversation messages
   * @param request - The knowledge extraction request containing messages to analyze
   * @returns Promise<KnowledgeExtractionResponse | ChatErrorResponse>
   */
  static async extractKnowledge(
    request: KnowledgeExtractionRequest
  ): Promise<KnowledgeExtractionResponse | ChatErrorResponse> {
    try {
      logInfo('Starting knowledge extraction', {
        messagesCount: request.messages.length,
        userId: request.userId,
        conversationId: request.conversationId,
      });

      // Validate that we have messages to analyze
      if (!request.messages || request.messages.length === 0) {
        return TeacherProfileService.createErrorResponse(
          'No messages provided for analysis',
          'validation',
          'empty_messages',
          'Keine Nachrichten zur Analyse vorhanden',
          'Bitte stellen Sie Chat-Nachrichten für die Analyse bereit'
        );
      }

      // Filter out system messages and only analyze user/assistant messages
      const conversationMessages = request.messages.filter(
        (msg) => msg.role === 'user' || msg.role === 'assistant'
      );

      if (conversationMessages.length === 0) {
        return TeacherProfileService.createErrorResponse(
          'No conversation messages found for analysis',
          'validation',
          'no_conversation_messages',
          'Keine Gesprächsinhalte zur Analyse gefunden',
          'Die Unterhaltung muss Benutzer- oder Assistenten-Nachrichten enthalten'
        );
      }

      // Create the extraction prompt
      const extractionPrompt = TeacherProfileService.createExtractionPrompt(
        conversationMessages
      );

      // Prepare OpenAI request
      const openaiRequest: OpenAI.Chat.ChatCompletionCreateParams = {
        model: OPENAI_CONFIG.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: extractionPrompt.systemPrompt,
          },
          {
            role: 'user',
            content: extractionPrompt.userPrompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      };

      logInfo('Sending extraction request to OpenAI', {
        model: openaiRequest.model,
        messagesAnalyzed: conversationMessages.length,
      });

      // Call OpenAI API for knowledge extraction
      const completion = await openaiClient.chat.completions.create(openaiRequest);

      // Validate OpenAI response
      if (!completion.choices || completion.choices.length === 0) {
        return TeacherProfileService.createErrorResponse(
          'No response generated from OpenAI for extraction',
          'openai_api',
          'empty_extraction_response'
        );
      }

      const choice = completion.choices[0];
      if (!choice || !choice.message?.content) {
        return TeacherProfileService.createErrorResponse(
          'Invalid extraction response from OpenAI',
          'openai_api',
          'invalid_extraction_response'
        );
      }

      // Parse the extracted knowledge JSON
      let extractedKnowledge: TeacherKnowledge;
      let confidence = 0.8; // Default confidence

      try {
        const parsedResponse = JSON.parse(choice.message.content);
        extractedKnowledge = TeacherProfileService.validateAndNormalizeKnowledge(
          parsedResponse
        );

        // Calculate confidence based on amount of extracted data
        confidence = TeacherProfileService.calculateConfidence(extractedKnowledge);

        logInfo('Successfully extracted teacher knowledge', {
          subjects: extractedKnowledge.subjects.length,
          grades: extractedKnowledge.grades.length,
          topics: extractedKnowledge.topics.length,
          methods: extractedKnowledge.teachingMethods.length,
          challenges: extractedKnowledge.challenges.length,
          confidence,
        });
      } catch (parseError) {
        logError('Failed to parse extraction response', parseError as Error);
        return TeacherProfileService.createErrorResponse(
          'Failed to parse knowledge extraction response',
          'server_error',
          'parse_error',
          'Fehler beim Verarbeiten der extrahierten Daten',
          'Bitte versuchen Sie die Extraktion erneut'
        );
      }

      // Create successful response
      const response: KnowledgeExtractionResponse = {
        success: true,
        data: {
          extractedKnowledge,
          confidence,
          messagesAnalyzed: conversationMessages.length,
        },
        timestamp: new Date().toISOString(),
      };

      return response;
    } catch (error) {
      logError('Knowledge extraction error occurred', error as Error, { request });
      return TeacherProfileService.handleExtractionError(error);
    }
  }

  /**
   * Create the extraction prompt for OpenAI to analyze teacher conversations
   * @param messages - Conversation messages to analyze
   * @returns Object containing system and user prompts
   */
  private static createExtractionPrompt(messages: ChatMessage[]): {
    systemPrompt: string;
    userPrompt: string;
  } {
    const systemPrompt = `Du bist ein spezialisierter KI-Assistent zur Extraktion von Lehrkraft-Profildaten aus Unterhaltungen.

Deine Aufgabe ist es, aus den Gesprächen zwischen Lehrkräften und dem AI-Assistenten relevante Informationen zu extrahieren, die das Profil der Lehrkraft charakterisieren.

EXTRAKTIONSBEREICHE:
1. **Unterrichtsfächer**: Alle erwähnten Schulfächer (z.B. "Mathematik", "Deutsch", "Physik", "Englisch", "Geschichte")
2. **Klassenstufen**: Unterrichtete Jahrgänge (z.B. "5", "6", "7-9", "Oberstufe", "Grundschule", "Sekundarstufe I")
3. **Schultyp**: Typ der Bildungseinrichtung (z.B. "Gymnasium", "Grundschule", "Realschule", "Gesamtschule", "Berufsschule")
4. **Unterrichtsmethoden**: Pädagogische Ansätze (z.B. "Gruppenarbeit", "Projektlernen", "Frontalunterricht", "Differenzierung")
5. **Themen**: Spezifische Unterrichtsthemen (z.B. "Bruchrechnung", "Photosynthese", "Textanalyse", "Französische Revolution")
6. **Herausforderungen**: Unterrichtsprobleme oder -schwierigkeiten (z.B. "Schülermotivation", "Zeitmanagement", "Differenzierung", "Klassenführung")

EXTRAKTIONSREGELN:
- Extrahiere NUR explizit erwähnte Informationen
- Verwende deutsche Begriffe
- Sammle alle relevanten Einzelnennungen
- Normalisiere ähnliche Begriffe (z.B. "Mathe" → "Mathematik")
- Ignoriere hypothetische oder beispielhafte Erwähnungen
- Fokussiere auf konkrete Unterrichtssituationen und -inhalte

ANTWORTFORMAT:
Antworte AUSSCHLIESSLICH im JSON-Format:
{
  "subjects": ["Fach1", "Fach2"],
  "grades": ["Stufe1", "Stufe2"],
  "schoolType": "Schultyp oder null",
  "teachingMethods": ["Methode1", "Methode2"],
  "topics": ["Thema1", "Thema2"],
  "challenges": ["Herausforderung1", "Herausforderung2"]
}

Wenn in einem Bereich keine Informationen gefunden werden, verwende ein leeres Array [] oder null für schoolType.`;

    const conversationText = messages
      .map((msg, index) => `${index + 1}. ${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    const userPrompt = `Analysiere die folgende Lehrkraft-Unterhaltung und extrahiere die relevanten Profildaten:

UNTERHALTUNG:
${conversationText}

Extrahiere die Informationen gemäß den definierten Bereichen und Regeln. Antworte nur im JSON-Format.`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Validate and normalize the extracted knowledge data
   * @param data - Raw extracted data from OpenAI
   * @returns Validated TeacherKnowledge object
   */
  private static validateAndNormalizeKnowledge(data: any): TeacherKnowledge {
    const knowledge: TeacherKnowledge = {
      subjects: [],
      grades: [],
      teachingMethods: [],
      topics: [],
      challenges: [],
    };

    // Validate and normalize subjects
    if (Array.isArray(data.subjects)) {
      knowledge.subjects = data.subjects
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => s.trim());
    }

    // Validate and normalize grades
    if (Array.isArray(data.grades)) {
      knowledge.grades = data.grades
        .filter((g: any) => typeof g === 'string' && g.trim().length > 0)
        .map((g: string) => g.trim());
    }

    // Validate school type
    if (typeof data.schoolType === 'string' && data.schoolType.trim().length > 0) {
      knowledge.schoolType = data.schoolType.trim();
    }

    // Validate and normalize teaching methods
    if (Array.isArray(data.teachingMethods)) {
      knowledge.teachingMethods = data.teachingMethods
        .filter((m: any) => typeof m === 'string' && m.trim().length > 0)
        .map((m: string) => m.trim());
    }

    // Validate and normalize topics
    if (Array.isArray(data.topics)) {
      knowledge.topics = data.topics
        .filter((t: any) => typeof t === 'string' && t.trim().length > 0)
        .map((t: string) => t.trim());
    }

    // Validate and normalize challenges
    if (Array.isArray(data.challenges)) {
      knowledge.challenges = data.challenges
        .filter((c: any) => typeof c === 'string' && c.trim().length > 0)
        .map((c: string) => c.trim());
    }

    return knowledge;
  }

  /**
   * Calculate confidence score based on extracted data quantity and quality
   * @param knowledge - Extracted teacher knowledge
   * @returns Confidence score between 0 and 1
   */
  private static calculateConfidence(knowledge: TeacherKnowledge): number {
    let score = 0;
    let maxScore = 6; // Number of categories

    // Score each category based on presence of data
    if (knowledge.subjects.length > 0) score++;
    if (knowledge.grades.length > 0) score++;
    if (knowledge.schoolType) score++;
    if (knowledge.teachingMethods.length > 0) score++;
    if (knowledge.topics.length > 0) score++;
    if (knowledge.challenges.length > 0) score++;

    // Bonus for rich data (multiple items in arrays)
    const richDataBonus = Math.min(
      0.2,
      (knowledge.subjects.length +
        knowledge.grades.length +
        knowledge.teachingMethods.length +
        knowledge.topics.length +
        knowledge.challenges.length) *
        0.01
    );

    const baseConfidence = score / maxScore;
    return Math.min(1.0, baseConfidence + richDataBonus);
  }

  /**
   * Handle OpenAI API errors for extraction requests
   * @param error - The error from OpenAI API
   * @returns ChatErrorResponse
   */
  private static handleExtractionError(error: unknown): ChatErrorResponse {
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 401:
          return TeacherProfileService.createErrorResponse(
            'Invalid OpenAI API key for extraction',
            'openai_api',
            'invalid_api_key',
            'AI-Extraktionsservice ist momentan nicht verfügbar',
            'Bitte kontaktieren Sie Ihren Administrator'
          );
        case 429:
          return TeacherProfileService.createErrorResponse(
            'OpenAI API rate limit exceeded for extraction',
            'openai_api',
            'rate_limit_exceeded',
            'Zu viele Extraktionsanfragen. Bitte warten Sie einen Moment.',
            'Versuchen Sie es in ein paar Sekunden erneut'
          );
        case 400:
          return TeacherProfileService.createErrorResponse(
            'Invalid extraction request to OpenAI API',
            'openai_api',
            'invalid_request',
            'Die Extraktionsanfrage konnte nicht verarbeitet werden',
            'Bitte überprüfen Sie die Gesprächsdaten und versuchen Sie es erneut'
          );
        default:
          return TeacherProfileService.createErrorResponse(
            `OpenAI API extraction error: ${error.message}`,
            'openai_api',
            'api_error',
            'Ein Fehler bei der Wissensextraktion ist aufgetreten',
            'Bitte versuchen Sie es erneut oder kontaktieren Sie den Support'
          );
      }
    }

    // Network errors
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      ((error as { code: string }).code === 'ECONNRESET' ||
        (error as { code: string }).code === 'ENOTFOUND')
    ) {
      return TeacherProfileService.createErrorResponse(
        'Network error connecting to OpenAI API for extraction',
        'openai_api',
        'network_error',
        'Verbindungsproblem zum Extraktionsservice',
        'Überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut'
      );
    }

    // Generic server error
    return TeacherProfileService.createErrorResponse(
      'An unexpected error occurred during knowledge extraction',
      'server_error',
      'unknown_error',
      'Ein unerwarteter Fehler bei der Wissensextraktion ist aufgetreten',
      'Bitte versuchen Sie es erneut oder kontaktieren Sie den Support'
    );
  }

  /**
   * Create a standardized error response for extraction operations
   * @param message - Technical error message
   * @param errorType - Type of error
   * @param errorCode - Specific error code
   * @param userMessage - User-friendly message in German
   * @param suggestedAction - Suggested action for the user
   * @returns ChatErrorResponse
   */
  private static createErrorResponse(
    message: string,
    errorType: 'validation' | 'openai_api' | 'rate_limit' | 'server_error',
    errorCode: string,
    userMessage?: string,
    suggestedAction?: string
  ): ChatErrorResponse {
    const response: ChatErrorResponse = {
      success: false,
      error: message,
      error_type: errorType,
      error_code: errorCode,
      timestamp: new Date().toISOString(),
    };

    if (userMessage) response.user_message = userMessage;
    if (suggestedAction) response.suggested_action = suggestedAction;

    return response;
  }

  /**
   * Test the teacher profile extraction service
   * @returns Promise<boolean> - True if service is working
   */
  static async testService(): Promise<boolean> {
    try {
      const testRequest: KnowledgeExtractionRequest = {
        messages: [
          {
            role: 'user',
            content:
              'Ich unterrichte Mathematik in der 7. Klasse und habe Probleme mit der Motivation meiner Schüler bei Bruchrechnung.',
          },
          {
            role: 'assistant',
            content:
              'Das ist eine häufige Herausforderung. Haben Sie schon mal Gruppenarbeit mit praktischen Beispielen ausprobiert?',
          },
        ],
      };

      const response = await TeacherProfileService.extractKnowledge(testRequest);
      return response.success;
    } catch (error) {
      logError('Teacher profile extraction service test failed', error as Error);
      return false;
    }
  }
}