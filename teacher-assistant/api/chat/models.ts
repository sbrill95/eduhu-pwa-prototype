import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel serverless function for getting available chat models
 * GET /api/chat/models
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
    const models = {
      success: true,
      data: {
        models: [
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o Mini',
            description: 'Fast and cost-effective model, great for most teacher assistant tasks',
            max_tokens: 4096,
            recommended: true,
          },
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            description: 'Most capable model, best for complex educational content creation',
            max_tokens: 4096,
            recommended: false,
          },
          {
            id: 'gpt-4',
            name: 'GPT-4',
            description: 'High-quality model for detailed educational planning',
            max_tokens: 4096,
            recommended: false,
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            description: 'Fast and efficient for simple tasks',
            max_tokens: 4096,
            recommended: false,
          },
        ],
        default_model: 'gpt-4o-mini',
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(models);
  } catch (error) {
    console.error('Chat models error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat models',
      timestamp: new Date().toISOString(),
    });
  }
}