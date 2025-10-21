import { logInfo } from '../config/logger';
import { ImageGenerationPrefillData } from '../../../shared/types';

/**
 * Agent Intent Detection Service
 *
 * Detects when a user message should trigger an agent suggestion
 * and extracts relevant prefill data for the agent modal.
 */

export interface AgentIntent {
  agentType: 'image-generation' | 'worksheet' | 'lesson-plan';
  confidence: number; // 0.0 - 1.0
  reasoning: string;
  prefillData: ImageGenerationPrefillData | Record<string, unknown>; // Use shared type
}

export class AgentIntentService {
  /**
   * Detect if a user message should trigger an agent suggestion
   * @param message - The user's message to analyze
   * @param context - Optional teacher knowledge for context-aware extraction
   * @returns AgentIntent if detected, null otherwise
   */
  static detectAgentIntent(message: string, context?: any): AgentIntent | null {
    const lowerMessage = message.toLowerCase().trim();

    // Try to detect image generation intent
    const imageIntent = this.detectImageGenerationIntent(
      lowerMessage,
      message,
      context
    );
    if (imageIntent) {
      const prefillData = imageIntent.prefillData as ImageGenerationPrefillData;
      logInfo('Image generation intent detected', {
        confidence: imageIntent.confidence,
        description: prefillData.description,
      });
      return imageIntent;
    }

    // TODO: Enable when worksheet agent is implemented
    // const worksheetIntent = this.detectWorksheetIntent(lowerMessage, message, context);
    // if (worksheetIntent) {
    //   logInfo('Worksheet intent detected', {
    //     confidence: worksheetIntent.confidence,
    //     theme: worksheetIntent.prefillData.theme
    //   });
    //   return worksheetIntent;
    // }

    // TODO: Enable when lesson-plan agent is implemented
    // const lessonPlanIntent = this.detectLessonPlanIntent(lowerMessage, message, context);
    // if (lessonPlanIntent) {
    //   logInfo('Lesson plan intent detected', {
    //     confidence: lessonPlanIntent.confidence,
    //     theme: lessonPlanIntent.prefillData.theme
    //   });
    //   return lessonPlanIntent;
    // }

    return null;
  }

  /**
   * Detect image generation intent
   */
  private static detectImageGenerationIntent(
    lowerMessage: string,
    originalMessage: string,
    context?: any
  ): AgentIntent | null {
    const imageKeywords = [
      'erstelle bild',
      'generiere bild',
      'erstelle image',
      'generiere image',
      'zeichne',
      'male',
      'bild von',
      'bild über',
      'bild mit',
      'bild zu',
      'bild für',
      'image von',
      'erstelle ein bild',
      'generiere ein bild',
      'mach ein bild',
      'mache ein bild',
      'visualisiere',
      'erstell mir ein bild',
      'generier mir ein bild',
      'kannst du ein bild',
      'könntest du ein bild',
      'würdest du ein bild',
      'bild erstellen',
      'bild generieren',
      'illustration',
      'grafik',
      'schaubild',
      'diagramm erstellen',
      'zeichnung',
      'poster',
      'plakat',
    ];

    const hasImageKeyword = imageKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    if (!hasImageKeyword) {
      return null;
    }

    // Extract description (formerly theme) and learning group
    const description = this.extractTheme(originalMessage, lowerMessage);
    const learningGroup = this.extractLearningGroup(originalMessage, context);
    const subject = context?.subjects?.[0] || undefined;

    return {
      agentType: 'image-generation',
      confidence: 0.85,
      reasoning:
        'Du hast nach einem Bild gefragt. Ich kann dir helfen, eines zu erstellen!',
      prefillData: {
        description, // Use 'description' to match shared type
        imageStyle: 'realistic',
        ...(learningGroup && { learningGroup }),
        ...(subject && { subject }),
      },
    };
  }

  /**
   * Detect worksheet intent
   */
  private static detectWorksheetIntent(
    lowerMessage: string,
    originalMessage: string,
    context?: any
  ): AgentIntent | null {
    const worksheetKeywords = [
      'arbeitsblatt',
      'arbeitsblätter',
      'übungsblatt',
      'aufgabenblatt',
      'übungen',
      'aufgaben',
      'worksheet',
      'erstelle aufgaben',
      'erstelle übungen',
      'übung erstellen',
      'aufgabe erstellen',
    ];

    const hasWorksheetKeyword = worksheetKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    if (!hasWorksheetKeyword) {
      return null;
    }

    const theme = this.extractTheme(originalMessage, lowerMessage);
    const learningGroup = this.extractLearningGroup(originalMessage, context);
    const subject = context?.subjects?.[0] || undefined;

    return {
      agentType: 'worksheet',
      confidence: 0.8,
      reasoning:
        'Du möchtest ein Arbeitsblatt erstellen. Ich kann dir dabei helfen!',
      prefillData: {
        theme,
        ...(learningGroup && { learningGroup }),
        ...(subject && { subject }),
      },
    };
  }

  /**
   * Detect lesson plan intent
   */
  private static detectLessonPlanIntent(
    lowerMessage: string,
    originalMessage: string,
    context?: any
  ): AgentIntent | null {
    const lessonPlanKeywords = [
      'unterrichtsplan',
      'unterrichtsstunde',
      'stundenentwurf',
      'unterrichtsentwurf',
      'lehrplan',
      'unterricht planen',
      'unterricht vorbereiten',
      'stunde planen',
      'lesson plan',
      'unterrichtseinheit',
    ];

    const hasLessonPlanKeyword = lessonPlanKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    if (!hasLessonPlanKeyword) {
      return null;
    }

    const theme = this.extractTheme(originalMessage, lowerMessage);
    const learningGroup = this.extractLearningGroup(originalMessage, context);
    const subject = context?.subjects?.[0] || undefined;

    return {
      agentType: 'lesson-plan',
      confidence: 0.8,
      reasoning:
        'Du planst eine Unterrichtsstunde. Ich kann dir einen Entwurf erstellen!',
      prefillData: {
        theme,
        ...(learningGroup && { learningGroup }),
        ...(subject && { subject }),
      },
    };
  }

  /**
   * Extract theme/topic from message
   */
  private static extractTheme(
    originalMessage: string,
    lowerMessage: string
  ): string {
    // Remove common trigger words to get the theme
    let cleaned = originalMessage
      // Remove "erstelle" variants
      .replace(
        /erstelle?\s+(mir\s+)?(ein\s+)?(bild|image|arbeitsblatt|unterrichtsplan|übung)\s+(von|über|mit|zu|für)?/gi,
        ''
      )
      // Remove "generiere" variants
      .replace(
        /generiere?\s+(mir\s+)?(ein\s+)?(bild|image|arbeitsblatt|unterrichtsplan|übung)\s+(von|über|mit|zu|für)?/gi,
        ''
      )
      // Remove "zeichne" variants
      .replace(/zeichne?\s+(mir\s+)?(ein\s+)?(bild|image)?/gi, '')
      // Remove "male" variants
      .replace(/male?\s+(mir\s+)?(ein\s+)?(bild|image)?/gi, '')
      // Remove "visualisiere" variants
      .replace(/visualisiere?\s+(mir\s+)?(ein\s+)?(bild|image)?/gi, '')
      // Remove "kannst/könntest/würdest du" phrases
      .replace(
        /kannst\s+du\s+(mir\s+)?(ein\s+)?(bild|image|arbeitsblatt|unterrichtsplan)/gi,
        ''
      )
      .replace(
        /könntest\s+du\s+(mir\s+)?(ein\s+)?(bild|image|arbeitsblatt|unterrichtsplan)/gi,
        ''
      )
      .replace(
        /würdest\s+du\s+(mir\s+)?(ein\s+)?(bild|image|arbeitsblatt|unterrichtsplan)/gi,
        ''
      )
      // Remove "mach/mache ein X"
      .replace(
        /mache?\s+(mir\s+)?(ein\s+)?(bild|image|arbeitsblatt|unterrichtsplan)/gi,
        ''
      )
      // Remove "planen/vorbereiten"
      .replace(/unterricht\s+(planen|vorbereiten)/gi, '')
      .replace(/stunde\s+(planen|vorbereiten)/gi, '')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();

    // If nothing left or too short, try to find content after common prepositions
    if (!cleaned || cleaned.length < 3) {
      const prepositionMatch = originalMessage.match(
        /(?:von|über|mit|zu|für)\s+(.+)/i
      );
      if (prepositionMatch && prepositionMatch[1]) {
        cleaned = prepositionMatch[1].trim();
      } else {
        // Fallback to original message
        cleaned = originalMessage;
      }
    }

    // Remove common noise at the end
    cleaned = cleaned
      .replace(/\s+(bitte|danke|dankeschön)\.?$/gi, '')
      .replace(/[?.!]+$/, '')
      .trim();

    return cleaned || originalMessage;
  }

  /**
   * Extract learning group/grade from message or context
   */
  private static extractLearningGroup(
    message: string,
    context?: any
  ): string | undefined {
    // Try to extract from message first
    const gradePatterns = [
      /klasse\s+(\d{1,2}[a-z]?)/i,
      /(\d{1,2})[.\s]?klasse/i,
      /jahrgangsstufe\s+(\d{1,2})/i,
      /stufe\s+(\d{1,2})/i,
      /(\d{1,2})[.\s]?jg/i,
      /jg\.?\s+(\d{1,2})/i,
      /für\s+(\d{1,2}[a-z]?)/i,
    ];

    for (const pattern of gradePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        // Format as "Klasse X" or "Klasse Xa"
        const grade = match[1];
        return `Klasse ${grade}`;
      }
    }

    // Fallback to context if available
    if (context?.grades && context.grades.length > 0) {
      // Return first grade from context
      const firstGrade = context.grades[0];
      if (!firstGrade) {
        return undefined;
      }
      // Format if it's just a number
      if (/^\d+$/.test(firstGrade)) {
        return `Klasse ${firstGrade}`;
      }
      return firstGrade;
    }

    return undefined;
  }

  /**
   * Extract subject from context
   */
  private static extractSubject(context?: any): string | undefined {
    return context?.subjects?.[0] || undefined;
  }
}
