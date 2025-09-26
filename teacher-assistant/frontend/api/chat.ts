import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting (simple in-memory store for demo)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per 15 minutes
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutes in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIP = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Validate OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Add teacher assistant system message
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful AI assistant specifically designed to help teachers and educators.
      You understand educational contexts, teaching methods, curriculum development, and student management.
      Provide practical, actionable advice that teachers can implement in their classrooms.
      Be supportive, professional, and focus on educational best practices.`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...messages],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = {
      message: completion.choices[0]?.message?.content || '',
      model: completion.model,
      usage: completion.usage
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('OpenAI API Error:', error);

    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid OpenAI API key' });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'OpenAI rate limit exceeded' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}