import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

/**
 * Vercel serverless function for chat service health check
 * GET /api/chat/health
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI API key not configured',
        data: {
          status: 'unhealthy',
          openai_connection: false,
          service_available: false,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Test OpenAI connection
    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 10000, // 10 seconds timeout for health check
    });

    try {
      const completion = await openaiClient.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Say "Hello" to test the connection.' },
        ],
        model: 'gpt-4o-mini',
        max_tokens: 10,
        temperature: 0,
      });

      const isHealthy = completion.choices && completion.choices.length > 0;

      const healthResponse = {
        success: true,
        data: {
          status: isHealthy ? 'healthy' : 'unhealthy',
          openai_connection: isHealthy,
          service_available: true,
        },
        timestamp: new Date().toISOString(),
      };

      const statusCode = isHealthy ? 200 : 503;
      res.status(statusCode).json(healthResponse);

    } catch (openaiError: any) {
      console.error('OpenAI connection test failed:', openaiError);

      // Determine error type
      let errorMessage = 'OpenAI connection test failed';
      if (openaiError.code === 'invalid_api_key') {
        errorMessage = 'Invalid OpenAI API key';
      } else if (openaiError.code === 'rate_limit_exceeded') {
        errorMessage = 'OpenAI rate limit exceeded';
      } else if (openaiError.code === 'insufficient_quota') {
        errorMessage = 'OpenAI quota exceeded';
      }

      return res.status(503).json({
        success: false,
        error: errorMessage,
        data: {
          status: 'unhealthy',
          openai_connection: false,
          service_available: false,
        },
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    console.error('Chat health check error:', error);

    res.status(500).json({
      success: false,
      error: 'Chat service health check failed',
      data: {
        status: 'unhealthy',
        openai_connection: false,
        service_available: false,
      },
      timestamp: new Date().toISOString(),
    });
  }
}