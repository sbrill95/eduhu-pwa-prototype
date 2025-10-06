/**
 * Simplified LangGraph Image Generation Agent - Minimal working implementation
 * Uses OpenAI DALL-E 3 for educational image generation
 */

import { openaiClient } from '../config/openai';
import { AgentParams, AgentResult, agentExecutionService } from '../services/agentService';
import { Artifact as GeneratedArtifact } from '../schemas/instantdb';
import { logInfo, logError, logWarn } from '../config/logger';
import { ImageGenerationPrefillData } from '../../../shared/types';

/**
 * Enhanced parameters for image generation
 */
export interface LangGraphImageGenerationParams extends AgentParams {
  prompt: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  enhancePrompt?: boolean;
  educationalContext?: string;
  targetAgeGroup?: string;
  subject?: string;
}

// Note: ImageGenerationInput is now imported from shared types as ImageGenerationPrefillData

/**
 * DALL-E 3 pricing configuration
 */
const DALLE_PRICING = {
  'standard_1024x1024': 4, // $0.04
  'standard_1024x1792': 8, // $0.08
  'standard_1792x1024': 8, // $0.08
  'hd_1024x1024': 8, // $0.08
  'hd_1024x1792': 12, // $0.12
  'hd_1792x1024': 12, // $0.12
};

/**
 * Monthly usage limits
 */
const MONTHLY_LIMITS = {
  FREE_TIER: 10, // 10 images per month for free users
  PREMIUM_TIER: 50, // 50 images per month for premium users
};

/**
 * Simplified Image Generation Agent
 */
export class LangGraphImageGenerationAgent {
  public readonly id = 'langgraph-image-generation';
  public readonly name = 'Erweiterte Bildgenerierung';
  public readonly description = 'Generiert Bilder für den Unterricht mit AI-Unterstützung';
  public readonly type = 'image-generation';
  public readonly triggers = [
    'bild erstellen',
    'bild generieren',
    'foto',
    'illustration',
    'zeichnung',
    'grafik',
    'image',
    'picture',
    'generate image',
    'erstelle bild',
    'zeichne',
    'male',
    'visualisierung',
    'diagram',
    'schaubild'
  ];
  public readonly enabled = true;
  public readonly config = {
    model: 'dall-e-3',
    default_size: '1024x1024',
    default_quality: 'standard',
    default_style: 'natural',
    enhance_german_prompts: true,
    monthly_limit: MONTHLY_LIMITS.FREE_TIER,
    educational_optimization: true,
    content_safety_check: true
  };

  /**
   * Execute the agent
   */
  public async execute(params: AgentParams, userId: string, sessionId?: string): Promise<AgentResult> {
    const imageParams = params as LangGraphImageGenerationParams;

    try {
      logInfo(`Starting image generation for user ${userId}: "${imageParams.prompt}"`);

      // Validate prompt
      if (!imageParams.prompt || imageParams.prompt.trim().length === 0) {
        return {
          success: false,
          error: 'Prompt ist erforderlich'
        };
      }

      if (imageParams.prompt.length > 1000) {
        return {
          success: false,
          error: 'Prompt ist zu lang (max. 1000 Zeichen)'
        };
      }

      // Check user limits
      const canExecute = await this.canExecute(userId);
      if (!canExecute) {
        return {
          success: false,
          error: 'Monatliches Limit für Bildgenerierung erreicht'
        };
      }

      // Enhanced prompt processing
      let finalPrompt = imageParams.prompt;
      let descriptionForMetadata = imageParams.prompt; // Store original description

      // Check if this is Gemini form input (Phase 3.2)
      const geminiInput = params as any as ImageGenerationPrefillData;
      if (geminiInput.description && geminiInput.imageStyle) {
        // Use new Gemini prompt builder
        logInfo(`Using Gemini prompt builder with description: "${geminiInput.description}", style: ${geminiInput.imageStyle}`);
        finalPrompt = this.buildImagePrompt(geminiInput);
        descriptionForMetadata = geminiInput.description; // Use Gemini description
      } else if (imageParams.enhancePrompt !== false && this.config.enhance_german_prompts) {
        // Fallback: Use old enhancement method
        finalPrompt = await this.enhanceGermanPrompt(imageParams.prompt, imageParams);
      }

      // Generate image
      const imageResult = await this.generateImage({
        prompt: finalPrompt,
        size: imageParams.size || this.config.default_size,
        quality: imageParams.quality || this.config.default_quality,
        style: imageParams.style || this.config.default_style
      });

      if (!imageResult.success) {
        return imageResult;
      }

      // Generate title and tags for library search
      console.log('[ImageAgent] About to generate title and tags for:', descriptionForMetadata);
      const { title, tags } = await this.generateTitleAndTags(descriptionForMetadata);
      console.log('[ImageAgent] ✅ Generated title:', title);
      console.log('[ImageAgent] ✅ Generated tags:', tags);
      logInfo(`Generated title: "${title}", tags: [${tags.join(', ')}]`);

      // Calculate cost
      const cost = this.calculateCost(
        imageParams.size || this.config.default_size,
        imageParams.quality || this.config.default_quality
      );

      // Create artifact with title and tags
      const artifact = await this.createArtifact(
        imageParams,
        finalPrompt,
        imageResult.data,
        cost,
        sessionId,
        title,
        tags
      );

      logInfo(`Image generation completed successfully for user ${userId}`);

      const resultData = {
        image_url: imageResult.data.url,
        revised_prompt: imageResult.data.revised_prompt,
        enhanced_prompt: finalPrompt !== imageParams.prompt ? finalPrompt : undefined,
        educational_optimized: finalPrompt !== imageParams.prompt,
        title, // Include generated title
        tags // Include generated tags
      };

      console.log('[ImageAgent] Final result data:', {
        hasImageUrl: !!resultData.image_url,
        imageUrlPreview: resultData.image_url?.substring(0, 60),
        title: resultData.title,
        tagsCount: resultData.tags?.length || 0
      });

      return {
        success: true,
        data: resultData,
        cost,
        metadata: {
          processing_time: Date.now(),
          model: 'dall-e-3',
          size: imageParams.size || this.config.default_size,
          quality: imageParams.quality || this.config.default_quality
        },
        artifacts: [artifact]
      };

    } catch (error) {
      logError('Image generation failed', error as Error);
      return {
        success: false,
        error: this.getGermanErrorMessage((error as Error).message)
      };
    }
  }

  /**
   * Validate parameters
   */
  public validateParams(params: any): boolean {
    if (!params.prompt || typeof params.prompt !== 'string') {
      return false;
    }

    if (params.prompt.trim().length === 0) {
      return false;
    }

    if (params.prompt.length > 1000) {
      return false;
    }

    if (params.size && !['1024x1024', '1024x1792', '1792x1024'].includes(params.size)) {
      return false;
    }

    if (params.quality && !['standard', 'hd'].includes(params.quality)) {
      return false;
    }

    if (params.style && !['vivid', 'natural'].includes(params.style)) {
      return false;
    }

    return true;
  }

  /**
   * Estimate cost for image generation
   */
  public estimateCost(params: AgentParams): number {
    const imageParams = params as LangGraphImageGenerationParams;
    const size = imageParams.size || this.config.default_size;
    const quality = imageParams.quality || this.config.default_quality;

    return this.calculateCost(size, quality);
  }

  /**
   * Check if user can execute (monthly limit check)
   */
  public async canExecute(userId: string): Promise<boolean> {
    try {
      const usage = await agentExecutionService.getUserUsage(userId, this.id);

      if (!usage) {
        return true;
      }

      return usage.usage_count < this.config.monthly_limit;
    } catch (error) {
      logError('Failed to check user execution limits', error as Error);
      return false;
    }
  }

  /**
   * Generate image with DALL-E 3
   */
  private async generateImage(params: {
    prompt: string;
    size: string;
    quality: string;
    style: string;
  }): Promise<AgentResult> {
    try {
      const response = await openaiClient.images.generate({
        model: 'dall-e-3',
        prompt: params.prompt,
        size: params.size as any,
        quality: params.quality as any,
        style: params.style as any,
        n: 1
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('Keine Bilddaten von DALL-E erhalten');
      }

      const imageData = response.data[0];
      if (!imageData?.url) {
        throw new Error('Keine Bild-URL von DALL-E erhalten');
      }

      return {
        success: true,
        data: {
          url: imageData.url,
          revised_prompt: imageData.revised_prompt || params.prompt
        }
      };

    } catch (error) {
      logError('DALL-E image generation failed', error as Error);
      throw error;
    }
  }

  /**
   * Generate title and tags for library search using ChatGPT
   * @param description - The original image description
   * @returns Object with title and tags
   */
  private async generateTitleAndTags(description: string): Promise<{ title: string; tags: string[] }> {
    console.log('[ImageAgent] generateTitleAndTags - START for:', description);

    try {
      const prompt = `Du bist ein Experte für Bildungs-Metadaten. Analysiere die folgende Bildbeschreibung und erstelle:
1. Einen kurzen, prägnanten deutschen Titel (maximal 5 Wörter)
2. 3-5 relevante deutsche Suchbegriffe/Tags

Die Tags sollen das Bild optimal für die Suche erschließen und umfassen:
- Fachbegriffe und Themen
- Klassenstufe oder Altersgruppe (falls erkennbar)
- Bildungskontext

Bildbeschreibung: "${description}"

Antworte NUR im folgenden JSON-Format:
{
  "title": "Kurzer Titel hier",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      console.log('[ImageAgent] Calling ChatGPT for title generation...');

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const responseContent = completion.choices[0]?.message?.content?.trim();

      console.log('[ImageAgent] ChatGPT response:', responseContent);

      if (!responseContent) {
        throw new Error('Keine Antwort von ChatGPT erhalten');
      }

      const parsed = JSON.parse(responseContent);

      console.log('[ImageAgent] Parsed ChatGPT response:', parsed);

      // Validate and return
      const title = parsed.title || this.generateFallbackTitle(description);
      const tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : this.generateFallbackTags(description);

      console.log('[ImageAgent] Final title and tags:', { title, tags });

      return { title, tags };

    } catch (error) {
      console.error('[ImageAgent] ❌ Title generation failed:', {
        error: (error as Error).message,
        stack: (error as Error).stack
      });

      logWarn('Title and tag generation failed, using fallback', {
        error: (error as Error).message,
        stack: (error as Error).stack || ''
      } as Record<string, unknown>);

      // Fallback: Generate title and tags without ChatGPT
      const fallbackTitle = this.generateFallbackTitle(description);
      const fallbackTags = this.generateFallbackTags(description);

      console.log('[ImageAgent] Using fallback:', { title: fallbackTitle, tags: fallbackTags });

      return {
        title: fallbackTitle,
        tags: fallbackTags
      };
    }
  }

  /**
   * Generate fallback title from description (first 50 chars)
   */
  private generateFallbackTitle(description: string): string {
    let title = description.trim().substring(0, 50);

    const lastSpace = title.lastIndexOf(' ');
    if (lastSpace > 30) {
      title = title.substring(0, lastSpace);
    }

    if (title.length < description.trim().length) {
      title += '...';
    }

    title = title.charAt(0).toUpperCase() + title.slice(1);

    return title || 'Generiertes Bild';
  }

  /**
   * Generate fallback tags from description (extract nouns)
   */
  private generateFallbackTags(description: string): string[] {
    // Simple noun extraction: words that are capitalized or educational keywords
    const educationalKeywords = [
      'Mathematik', 'Deutsch', 'Englisch', 'Physik', 'Chemie', 'Biologie',
      'Geschichte', 'Geographie', 'Kunst', 'Musik', 'Sport',
      'Grundschule', 'Gymnasium', 'Realschule', 'Klasse',
      'Arbeitsblatt', 'Quiz', 'Diagramm', 'Tabelle', 'Grafik'
    ];

    const words = description.split(/\s+/);
    const tags: string[] = [];

    // Extract capitalized words (likely nouns in German)
    for (const word of words) {
      const cleaned = word.replace(/[.,!?;:]/, '');
      const firstChar = cleaned[0];
      if (cleaned.length > 3 && firstChar && firstChar === firstChar.toUpperCase()) {
        tags.push(cleaned);
      }
    }

    // Add matching educational keywords
    for (const keyword of educationalKeywords) {
      if (description.toLowerCase().includes(keyword.toLowerCase())) {
        tags.push(keyword);
      }
    }

    // Return unique tags, max 5
    return [...new Set(tags)].slice(0, 5);
  }

  /**
   * Enhanced German prompt optimization with educational context
   */
  private async enhanceGermanPrompt(
    prompt: string,
    params: LangGraphImageGenerationParams
  ): Promise<string> {
    if (!this.isGermanText(prompt)) {
      return prompt;
    }

    try {
      const enhancementPrompt = this.buildEnhancementPrompt(prompt, params);

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: enhancementPrompt }
        ],
        max_tokens: 250,
        temperature: 0.7
      });

      const enhancedPrompt = completion.choices[0]?.message?.content?.trim();

      if (enhancedPrompt && enhancedPrompt.length > 10) {
        logInfo(`Prompt enhanced: "${prompt}" → "${enhancedPrompt}"`);
        return enhancedPrompt;
      }

      return prompt;

    } catch (error) {
      logError('Failed to enhance German prompt', error as Error);
      return prompt;
    }
  }

  /**
   * Build pedagogically-enhanced prompt from Gemini form input (Phase 3.2)
   * Uses the CORRECT fields: description + imageStyle
   */
  private buildImagePrompt(input: ImageGenerationPrefillData): string {
    // Base prompt with user's description
    let prompt = `Create an educational image: ${input.description}\n\n`;

    // Style-specific prompt enhancements for DALL-E
    const stylePrompts = {
      realistic: 'photorealistic, detailed, high-quality, educational photography style',
      cartoon: 'cartoon illustration, friendly, colorful, playful, educational',
      illustrative: 'educational illustration, clear, pedagogical, well-structured',
      abstract: 'abstract representation, conceptual, thought-provoking, symbolic'
    };

    const styleDescription = input.imageStyle ? stylePrompts[input.imageStyle] : stylePrompts.illustrative;

    prompt += `Style: ${styleDescription}\n\n`;
    prompt += `Requirements:\n`;
    prompt += `- Suitable for classroom use\n`;
    prompt += `- Clear visual elements\n`;
    prompt += `- Educational context\n`;
    prompt += `- High quality\n`;
    prompt += `- No text overlays (unless explicitly requested in description)`;

    return prompt;
  }

  /**
   * Build context-aware enhancement prompt
   */
  private buildEnhancementPrompt(
    prompt: string,
    params: LangGraphImageGenerationParams
  ): string {
    let enhancementPrompt = `Du bist ein Experte für Bildgenerierung im Bildungsbereich. Verbessere den folgenden deutschen Prompt für DALL-E 3, um ein besseres Ergebnis für Unterrichtsmaterialien zu erzielen.

Regeln:
- Übersetze ins Englische (DALL-E funktioniert besser mit englischen Prompts)
- Füge Details hinzu, die für Bildungszwecke relevant sind
- Mache den Prompt spezifischer und visuell ansprechender
- Behalte den pädagogischen Kontext bei
- Sorge für altersgerechte Darstellung
- Limitiere auf 800 Zeichen`;

    if (params.educationalContext) {
      enhancementPrompt += `\n- Bildungskontext: ${params.educationalContext}`;
    }

    if (params.targetAgeGroup) {
      enhancementPrompt += `\n- Zielgruppe: ${params.targetAgeGroup}`;
    }

    if (params.subject) {
      enhancementPrompt += `\n- Fachbereich: ${params.subject}`;
    }

    enhancementPrompt += `\n\nOriginaler Prompt: "${prompt}"\n\nVerbesserter englischer Prompt:`;

    return enhancementPrompt;
  }

  /**
   * Create artifact with title and tags for library search
   */
  private async createArtifact(
    params: LangGraphImageGenerationParams,
    finalPrompt: string,
    imageData: { url: string; revised_prompt: string },
    cost: number,
    sessionId?: string,
    title?: string,
    tags?: string[]
  ): Promise<GeneratedArtifact> {
    // Store all image generation data in content as JSON
    const artifactContent = {
      image_url: imageData.url,
      revised_prompt: imageData.revised_prompt,
      original_size: params.size || this.config.default_size,
      quality: params.quality || this.config.default_quality,
      style: params.style || this.config.default_style,
      educational_context: params.educationalContext || undefined,
      target_age_group: params.targetAgeGroup || undefined,
      subject: params.subject || undefined,
      tags: tags || [],
      prompt: params.prompt,
      enhanced_prompt: finalPrompt !== params.prompt ? finalPrompt : '',
      agent_id: this.id,
      model_used: 'dall-e-3',
      cost,
      metadata: {
        generation_timestamp: Date.now(),
        user_language: this.detectLanguage(params.prompt),
        prompt_enhanced: finalPrompt !== params.prompt,
        educational_optimized: Boolean(params.educationalContext || params.targetAgeGroup || params.subject),
        search_tags: tags || []
      }
    };

    const artifact: Partial<GeneratedArtifact> = {
      id: crypto.randomUUID(),
      title: title || this.generateImageTitle(params.prompt),
      type: 'image',
      content: JSON.stringify(artifactContent),
      created_at: Date.now(),
      updated_at: Date.now(),
      is_favorite: false,
      usage_count: 0,
      creator: {} as any,
      feedback_received: [] as any[], // Will be populated when feedback is added
    };

    // Add optional fields only if they exist
    if (params.subject) artifact.subject = params.subject;
    if (tags && tags.length > 0) artifact.tags = tags;

    return artifact as GeneratedArtifact;
  }

  /**
   * Get German error message
   */
  private getGermanErrorMessage(originalMessage: string): string {
    const errorMappings: Record<string, string> = {
      'Rate limit': 'OpenAI ist momentan überlastet. Bitte versuche es in einigen Minuten erneut.',
      'quota': 'OpenAI-Kontingent erschöpft. Bitte versuche es später wieder.',
      'API key': 'API-Schlüssel ungültig. Bitte kontaktiere den Administrator.',
      'content policy': 'Dein Prompt wurde vom Inhaltsfilter blockiert. Bitte verwende andere Begriffe.',
      'timeout': 'Zeitüberschreitung. Die Bildgenerierung dauert länger als erwartet.'
    };

    for (const [key, message] of Object.entries(errorMappings)) {
      if (originalMessage.toLowerCase().includes(key.toLowerCase())) {
        return message;
      }
    }

    return `Fehler: ${originalMessage}`;
  }

  /**
   * Utility methods
   */
  private isGermanText(text: string): boolean {
    const germanWords = ['der', 'die', 'das', 'und', 'ist', 'mit', 'für', 'von', 'auf', 'ein', 'eine', 'einen'];
    const germanChars = ['ä', 'ö', 'ü', 'ß'];

    const lowerText = text.toLowerCase();

    if (germanChars.some(char => lowerText.includes(char))) {
      return true;
    }

    const words = lowerText.split(/\s+/);
    const germanWordCount = words.filter(word => germanWords.includes(word)).length;

    return germanWordCount >= 1;
  }

  private detectLanguage(text: string): string {
    return this.isGermanText(text) ? 'de' : 'en';
  }

  private calculateCost(size: string, quality: string): number {
    const key = `${quality}_${size}` as keyof typeof DALLE_PRICING;
    return DALLE_PRICING[key] || DALLE_PRICING.standard_1024x1024;
  }

  private generateImageTitle(prompt: string): string {
    let title = prompt.trim().substring(0, 50);

    const lastSpace = title.lastIndexOf(' ');
    if (lastSpace > 30) {
      title = title.substring(0, lastSpace);
    }

    if (title.length < prompt.trim().length) {
      title += '...';
    }

    title = title.charAt(0).toUpperCase() + title.slice(1);

    return title || 'Generiertes Bild';
  }

  /**
   * Create LangGraph workflow (required for LangGraph compatibility)
   */
  public createWorkflow(): any {
    // This method marks the agent as LangGraph-compatible
    // In a full implementation, this would return an actual LangGraph workflow
    return {
      id: this.id,
      name: this.name,
      enabled: true,
      supports_checkpoints: true,
      supports_streaming: true,
      workflow_type: 'image_generation'
    };
  }
}

/**
 * Export singleton instance
 */
export const langGraphImageGenerationAgent = new LangGraphImageGenerationAgent();