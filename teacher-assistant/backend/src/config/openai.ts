import OpenAI from 'openai';
import { config } from './index';
import { logError } from './logger';

/**
 * OpenAI client configuration with error handling
 */
export const openaiClient = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds timeout
  maxRetries: 2, // Retry failed requests up to 2 times
});

/**
 * Default OpenAI configuration for teacher assistant
 */
export const OPENAI_CONFIG = {
  DEFAULT_MODEL: 'gpt-4o-mini', // Cost-effective model for teacher assistant
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  SYSTEM_MESSAGE: {
    role: 'system' as const,
    content: `You are a helpful teacher assistant. Your role is to:
1. Help teachers create educational content
2. Assist with lesson planning and curriculum development
3. Generate quiz questions and educational activities
4. Provide teaching tips and pedagogical guidance
5. Support administrative tasks related to teaching

Always provide clear, educational, and professional responses. Focus on practical and actionable advice for teachers.`,
  },
};

/**
 * Validate OpenAI API key format
 */
export const validateOpenAIKey = (apiKey: string): boolean => {
  return apiKey.startsWith('sk-') && apiKey.length > 20;
};

/**
 * Test OpenAI API connection
 */
export const testOpenAIConnection = async (): Promise<boolean> => {
  try {
    const completion = await openaiClient.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Say "Hello" to test the connection.' },
      ],
      model: OPENAI_CONFIG.DEFAULT_MODEL,
      max_tokens: 10,
      temperature: 0,
    });

    return completion.choices && completion.choices.length > 0;
  } catch (error) {
    logError('OpenAI connection test failed', error as Error);
    return false;
  }
};
