import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Environment validation
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 2,
});

// Types
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// Default OpenAI configuration
const OPENAI_CONFIG = {
  DEFAULT_MODEL: 'gpt-4o-mini',
  MAX_TOKENS: 1500,
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
 * Vercel serverless function for chat completion
 * POST /api/chat
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      error_type: 'validation',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const chatRequest: ChatRequest = req.body;

    // Validate request
    if (!chatRequest.messages || !Array.isArray(chatRequest.messages) || chatRequest.messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required and cannot be empty',
        error_type: 'validation',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate message format
    for (const message of chatRequest.messages) {
      if (!message.role || !message.content) {
        return res.status(400).json({
          success: false,
          error: 'Each message must have role and content',
          error_type: 'validation',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Prepare messages with system message
    const messages = [
      OPENAI_CONFIG.SYSTEM_MESSAGE,
      ...chatRequest.messages,
    ];

    // Call OpenAI API
    const completion = await openaiClient.chat.completions.create({
      model: chatRequest.model || OPENAI_CONFIG.DEFAULT_MODEL,
      messages,
      temperature: chatRequest.temperature ?? OPENAI_CONFIG.TEMPERATURE,
      max_tokens: chatRequest.max_tokens || OPENAI_CONFIG.MAX_TOKENS,
    });

    // Extract response
    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      return res.status(502).json({
        success: false,
        error: 'No response from OpenAI API',
        error_type: 'openai_api',
        timestamp: new Date().toISOString(),
      });
    }

    // Return successful response
    res.status(200).json({
      success: true,
      data: {
        message: assistantMessage,
        usage: completion.usage ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
        } : undefined,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Chat completion error:', error);

    // Handle OpenAI API errors
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        success: false,
        error: 'Invalid OpenAI API key',
        error_type: 'openai_api',
        timestamp: new Date().toISOString(),
      });
    }

    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        success: false,
        error: 'OpenAI API rate limit exceeded',
        error_type: 'rate_limit',
        retry_after: 60,
        timestamp: new Date().toISOString(),
      });
    }

    if (error.code === 'insufficient_quota') {
      return res.status(402).json({
        success: false,
        error: 'OpenAI API quota exceeded',
        error_type: 'openai_api',
        timestamp: new Date().toISOString(),
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your chat request',
      error_type: 'server_error',
      timestamp: new Date().toISOString(),
    });
  }
}