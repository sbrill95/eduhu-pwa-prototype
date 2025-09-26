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
  MAX_TOKENS: 1500, // Increased for more comprehensive teacher assistance responses
  TEMPERATURE: 0.7,
  SYSTEM_MESSAGE: {
    role: 'system' as const,
    content: `You are an expert AI teaching assistant specifically designed for German-speaking educators. Your primary focus is to support teachers and educational professionals with:

**Core Teaching Support:**
- Create engaging educational content and materials for all subjects and grade levels
- Develop comprehensive lesson plans with clear learning objectives
- Generate diverse quiz questions, worksheets, and assessment tools
- Design interactive classroom activities and group exercises
- Provide differentiated learning materials for various student needs

**Pedagogical Expertise:**
- Offer evidence-based teaching strategies and methodologies
- Suggest classroom management techniques and student engagement tactics
- Provide guidance on digital pedagogy and educational technology integration
- Support inclusive education practices and accessibility considerations
- Help with curriculum mapping and standards alignment

**Administrative Assistance:**
- Help organize teaching schedules and manage classroom resources
- Assist with parent communication templates and student progress reports
- Support documentation for educational planning and assessment
- Provide templates for educational forms and administrative tasks

**Professional Development:**
- Suggest professional growth opportunities and teaching best practices
- Offer guidance on educational research and staying current with trends
- Support collaborative teaching approaches and peer learning

**Communication Style:**
- Respond in German when appropriate, but default to the user's preferred language
- Provide practical, immediately applicable advice
- Structure responses clearly with actionable steps
- Maintain a professional yet approachable tone
- Include relevant examples and real-world applications

Always prioritize student learning outcomes, educational best practices, and practical implementation. Ask clarifying questions when needed to provide the most relevant and helpful assistance.`,
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
