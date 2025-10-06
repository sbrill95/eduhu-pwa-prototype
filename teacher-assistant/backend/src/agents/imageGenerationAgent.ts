/**
 * Image Generation Agent - Uses OpenAI DALL-E 3 for educational image generation
 * Supports German prompt enhancement and implements monthly usage limits
 */

import { openaiClient } from '../config/openai';
import { IAgent, AgentParams, AgentResult, agentExecutionService } from '../services/agentService';
import { Artifact as GeneratedArtifact } from '../schemas/instantdb';
import { logInfo, logError } from '../config/logger';

/**
 * Parameters specific to image generation
 */
export interface ImageGenerationParams extends AgentParams {
  prompt: string;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  enhancePrompt?: boolean; // Whether to enhance German prompts
}

/**
 * Configuration for DALL-E 3 pricing (in USD cents)
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
};

/**
 * Image Generation Agent Implementation
 */
export class ImageGenerationAgent implements IAgent {
  public readonly id = 'image-generation';
  public readonly name = 'Bildgenerierung';
  public readonly description = 'Generiert Bilder für den Unterricht mit DALL-E 3';
  public readonly type = 'image-generation';
  public readonly triggers = [
    'bild',
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
    'visualisierung'
  ];
  public readonly enabled = true;
  public readonly config = {
    model: 'dall-e-3',
    default_size: '1024x1024',
    default_quality: 'standard',
    default_style: 'natural',
    enhance_german_prompts: true,
    monthly_limit: MONTHLY_LIMITS.FREE_TIER
  };

  /**
   * Execute image generation
   */
  public async execute(params: AgentParams, userId: string, sessionId?: string): Promise<AgentResult> {
    const imageParams = params as ImageGenerationParams;

    try {
      logInfo(`Starting image generation for user ${userId}: "${imageParams.prompt}"`);

      // Map frontend style to DALL-E 3 parameters
      const styleMapping = {
        realistic: { dalleStyle: 'natural' as const, promptSuffix: 'realistic illustration' },
        cartoon: { dalleStyle: 'vivid' as const, promptSuffix: 'cartoon style' },
        illustrative: { dalleStyle: 'natural' as const, promptSuffix: 'educational illustration' },
        abstract: { dalleStyle: 'vivid' as const, promptSuffix: 'abstract art' }
      };

      const userStyle = (imageParams.style || 'realistic') as string;
      const mappedStyle = styleMapping[userStyle as keyof typeof styleMapping] ?? styleMapping.realistic;

      logInfo(`Style mapping: ${userStyle} → DALL-E style: ${mappedStyle.dalleStyle}, suffix: "${mappedStyle.promptSuffix}"`);

      // Enhance prompt if needed
      let finalPrompt = imageParams.prompt;
      if (imageParams.enhancePrompt !== false && this.config.enhance_german_prompts) {
        finalPrompt = await this.enhanceGermanPrompt(imageParams.prompt);
      }

      // Add style suffix to prompt
      if (mappedStyle.promptSuffix && !finalPrompt.toLowerCase().includes(mappedStyle.promptSuffix)) {
        finalPrompt = `${finalPrompt}, ${mappedStyle.promptSuffix}`;
      }

      // Generate image with DALL-E 3
      const imageResult = await this.generateImage({
        prompt: finalPrompt,
        size: imageParams.size || this.config.default_size,
        quality: imageParams.quality || this.config.default_quality,
        style: mappedStyle.dalleStyle
      });

      if (!imageResult.success) {
        return imageResult;
      }

      // Generate German title via ChatGPT
      let germanTitle = '';
      let titleGenerationCost = 0;
      const dalleTitle = imageResult.data.revised_prompt?.split(',')[0] || 'AI-generiertes Bild';

      try {
        logInfo(`Generating German title for: "${imageResult.data.revised_prompt}"`);

        const titleResponse = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Assistent der prägnante Bildtitel generiert.'
            },
            {
              role: 'user',
              content: `Erstelle einen kurzen deutschen Titel (maximal 3-5 Wörter) für dieses Bild: ${imageResult.data.revised_prompt}`
            }
          ],
          max_tokens: 20,
          temperature: 0.7
        });

        germanTitle = titleResponse.choices[0]?.message?.content?.trim() || dalleTitle;

        // Calculate title generation cost (rough estimate: ~100 tokens total)
        titleGenerationCost = 0.01; // $0.01 for gpt-4o-mini (~100 tokens)

        logInfo(`German title generated: "${germanTitle}"`);
      } catch (error) {
        logError('Failed to generate German title, using DALL-E title', error as Error);
        germanTitle = dalleTitle;
      }

      // Calculate image cost
      const imageCost = this.calculateCost(
        imageParams.size || this.config.default_size,
        imageParams.quality || this.config.default_quality
      );

      const totalCost = imageCost + titleGenerationCost;

      // Create artifact with image data stored in content as JSON
      const artifactContent = {
        image_url: imageResult.data.url,
        revised_prompt: imageResult.data.revised_prompt,
        original_size: imageParams.size || this.config.default_size,
        quality: imageParams.quality || this.config.default_quality,
        style: imageParams.style || this.config.default_style,
        prompt: imageParams.prompt,
        enhanced_prompt: finalPrompt !== imageParams.prompt ? finalPrompt : '',
        agent_id: this.id,
        model_used: 'dall-e-3',
        cost: totalCost,
        metadata: {
          generation_timestamp: Date.now(),
          user_language: this.detectLanguage(imageParams.prompt),
          prompt_enhanced: finalPrompt !== imageParams.prompt
        }
      };

      const artifact: GeneratedArtifact = {
        id: crypto.randomUUID(),
        title: germanTitle,
        type: 'image',
        content: JSON.stringify(artifactContent),
        created_at: Date.now(),
        updated_at: Date.now(),
        is_favorite: false,
        usage_count: 0,
        creator: {} as any, // Will be populated by the execution service
        feedback_received: [] as any[], // Will be populated when feedback is added
      };

      logInfo(`Image generation completed successfully for user ${userId}`);

      return {
        success: true,
        data: {
          image_url: imageResult.data.url,
          revised_prompt: imageResult.data.revised_prompt,
          enhanced_prompt: finalPrompt !== imageParams.prompt ? finalPrompt : undefined,
          title: germanTitle, // German title for UI
          dalle_title: dalleTitle // English fallback
        },
        cost: totalCost,
        metadata: {
          processing_time: Date.now(),
          model: 'dall-e-3',
          size: imageParams.size || this.config.default_size,
          quality: imageParams.quality || this.config.default_quality,
          title_generation_cost: titleGenerationCost
        },
        artifacts: [artifact]
      };

    } catch (error) {
      logError('Image generation failed', error as Error);
      return {
        success: false,
        error: `Bildgenerierung fehlgeschlagen: ${(error as Error).message}`
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
      return false; // DALL-E 3 has prompt limits
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
    const imageParams = params as ImageGenerationParams;
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
        return true; // No usage record means user can execute
      }

      return usage.usage_count < this.config.monthly_limit;
    } catch (error) {
      logError('Failed to check user execution limits', error as Error);
      return false; // Fail safe - deny execution if we can't check limits
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
        return {
          success: false,
          error: 'Keine Bilddaten von DALL-E erhalten'
        };
      }

      const imageData = response.data[0];
      if (!imageData?.url) {
        return {
          success: false,
          error: 'Keine Bild-URL von DALL-E erhalten'
        };
      }

      return {
        success: true,
        data: {
          url: imageData.url,
          revised_prompt: imageData.revised_prompt || params.prompt
        }
      };

    } catch (error) {
      logError('DALL-E API call failed', error as Error);
      return {
        success: false,
        error: `DALL-E API Fehler: ${(error as Error).message}`
      };
    }
  }

  /**
   * Enhance German prompts for better educational context
   */
  private async enhanceGermanPrompt(prompt: string): Promise<string> {
    // Check if prompt is in German
    if (!this.isGermanText(prompt)) {
      return prompt; // Return unchanged if not German
    }

    try {
      const enhancementPrompt = `Du bist ein Experte für Bildgenerierung im Bildungsbereich. Verbessere den folgenden deutschen Prompt für DALL-E 3, um ein besseres Ergebnis für Unterrichtsmaterialien zu erzielen.

Regeln:
- Übersetze ins Englische (DALL-E funktioniert besser mit englischen Prompts)
- Füge Details hinzu, die für Bildungszwecke relevant sind
- Mache den Prompt spezifischer und visuell ansprechender
- Behalte den pädagogischen Kontext bei
- Sorge für altersgerechte Darstellung
- Limitiere auf 800 Zeichen

Originalter Prompt: "${prompt}"

Verbesserter englischer Prompt:`;

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: enhancementPrompt }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      const enhancedPrompt = completion.choices[0]?.message?.content?.trim();

      if (enhancedPrompt && enhancedPrompt.length > 10) {
        logInfo(`Prompt enhanced: "${prompt}" → "${enhancedPrompt}"`);
        return enhancedPrompt;
      }

      return prompt; // Return original if enhancement failed

    } catch (error) {
      logError('Failed to enhance German prompt', error as Error);
      return prompt; // Return original prompt if enhancement fails
    }
  }

  /**
   * Check if text is in German
   */
  private isGermanText(text: string): boolean {
    // Simple heuristic: check for common German words and characters
    const germanWords = ['der', 'die', 'das', 'und', 'ist', 'mit', 'für', 'von', 'auf', 'ein', 'eine', 'einen'];
    const germanChars = ['ä', 'ö', 'ü', 'ß'];

    const lowerText = text.toLowerCase();

    // Check for German characters
    if (germanChars.some(char => lowerText.includes(char))) {
      return true;
    }

    // Check for German words
    const words = lowerText.split(/\s+/);
    const germanWordCount = words.filter(word => germanWords.includes(word)).length;

    return germanWordCount >= 1; // At least one German word
  }

  /**
   * Detect language of text
   */
  private detectLanguage(text: string): string {
    return this.isGermanText(text) ? 'de' : 'en';
  }

  /**
   * Calculate cost based on size and quality
   */
  private calculateCost(size: string, quality: string): number {
    const key = `${quality}_${size}` as keyof typeof DALLE_PRICING;
    return DALLE_PRICING[key] || DALLE_PRICING.standard_1024x1024;
  }

  /**
   * Generate a title for the image artifact
   */
  private generateImageTitle(prompt: string): string {
    // Take first 50 characters and clean up
    let title = prompt.trim().substring(0, 50);

    // Remove incomplete words at the end
    const lastSpace = title.lastIndexOf(' ');
    if (lastSpace > 30) {
      title = title.substring(0, lastSpace);
    }

    // Add ellipsis if truncated
    if (title.length < prompt.trim().length) {
      title += '...';
    }

    // Ensure it starts with capital letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return title || 'Generiertes Bild';
  }
}

/**
 * Export singleton instance
 */
export const imageGenerationAgent = new ImageGenerationAgent();