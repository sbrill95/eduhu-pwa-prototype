/**
 * Agent Validation Middleware
 * Provides validation and security checks for agent operations
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { agentRegistry } from '../services/agentService';
import { ApiResponse } from '../types';
import { logError } from '../config/logger';

/**
 * Validate agent ID exists and is enabled
 */
export const validateAgentExists = (req: Request, res: Response, next: NextFunction): void => {
  const agentId = req.body.agentId || req.params.agentId;

  if (!agentId) {
    const response: ApiResponse = {
      success: false,
      error: 'Agent ID is required',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  const agent = agentRegistry.getAgent(agentId);
  if (!agent) {
    const response: ApiResponse = {
      success: false,
      error: `Agent not found: ${agentId}`,
      timestamp: new Date().toISOString()
    };
    res.status(404).json(response);
    return;
  }

  if (!agent.enabled) {
    const response: ApiResponse = {
      success: false,
      error: `Agent is disabled: ${agentId}`,
      timestamp: new Date().toISOString()
    };
    res.status(403).json(response);
    return;
  }

  // Attach agent to request for later use
  req.agent = agent;
  next();
};

/**
 * Validate agent parameters
 */
export const validateAgentParams = (req: Request, res: Response, next: NextFunction): void => {
  const agent = req.agent;
  const params = req.body.params;

  if (!agent) {
    const response: ApiResponse = {
      success: false,
      error: 'Agent validation failed',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
    return;
  }

  if (!params || typeof params !== 'object') {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid or missing parameters',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  try {
    const isValid = agent.validateParams(params);
    if (!isValid) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid parameters for this agent',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    next();
  } catch (error) {
    logError('Parameter validation failed', error as Error);
    const response: ApiResponse = {
      success: false,
      error: 'Parameter validation error',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
    return;
  }
};

/**
 * Rate limiting middleware for agent execution
 */
export const agentRateLimit = (maxRequestsPerMinute: number = 10) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.body.userId || req.params.userId;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'User ID is required for rate limiting',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(response);
      return;
    }

    const userKey = `agent_rate_${userId}`;
    const userLimit = requestCounts.get(userKey);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize the rate limit
      requestCounts.set(userKey, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
    } else if (userLimit.count < maxRequestsPerMinute) {
      // Increment the count
      userLimit.count++;
      next();
    } else {
      // Rate limit exceeded
      const response: ApiResponse = {
        success: false,
        error: 'Rate limit exceeded. Please wait before making another request.',
        timestamp: new Date().toISOString()
      };
      res.status(429).json(response);
    }
  };
};

/**
 * Content filtering middleware for prompts
 */
export const contentFilter = (req: Request, res: Response, next: NextFunction): void => {
  const params = req.body.params;
  const prompt = params?.prompt;

  if (!prompt || typeof prompt !== 'string') {
    next();
    return;
  }

  // Basic content filtering
  const inappropriateTerms = [
    'violent',
    'nsfw',
    'explicit',
    'adult',
    'inappropriate',
    // Add more terms as needed
  ];

  const lowerPrompt = prompt.toLowerCase();
  const hasInappropriate = inappropriateTerms.some(term =>
    lowerPrompt.includes(term)
  );

  if (hasInappropriate) {
    const response: ApiResponse = {
      success: false,
      error: 'Content not suitable for educational purposes',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(response);
    return;
  }

  next();
};

/**
 * Cost estimation middleware
 */
export const provideCostEstimate = (req: Request, res: Response, next: NextFunction) => {
  const agent = req.agent;
  const params = req.body.params;

  if (!agent || !params) {
    next();
    return;
  }

  try {
    const estimatedCost = agent.estimateCost(params);
    req.estimatedCost = estimatedCost;

    // Add cost estimate to response headers
    res.setHeader('X-Estimated-Cost-Cents', estimatedCost.toString());
    res.setHeader('X-Estimated-Cost-USD', (estimatedCost / 100).toFixed(2));

    next();
  } catch (error) {
    logError('Cost estimation failed', error as Error);
    // Don't fail the request, just continue without cost estimate
    next();
  }
};

/**
 * Validation schemas for different agent operations
 */
export const agentValidationSchemas = {
  executeAgent: [
    body('agentId').isString().notEmpty().withMessage('Agent ID is required'),
    body('params').isObject().withMessage('Parameters must be an object'),
    body('params.prompt').isString().notEmpty().withMessage('Prompt is required')
      .isLength({ max: 1000 }).withMessage('Prompt must be less than 1000 characters'),
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('sessionId').optional().isString()
  ],

  imageGeneration: [
    body('prompt').isString().notEmpty().withMessage('Prompt is required')
      .isLength({ max: 1000 }).withMessage('Prompt must be less than 1000 characters'),
    body('size').optional().isIn(['1024x1024', '1024x1792', '1792x1024'])
      .withMessage('Invalid size option'),
    body('quality').optional().isIn(['standard', 'hd'])
      .withMessage('Invalid quality option'),
    body('style').optional().isIn(['vivid', 'natural'])
      .withMessage('Invalid style option'),
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('sessionId').optional().isString(),
    body('enhancePrompt').optional().isBoolean()
  ],

  getUserUsage: [
    param('userId').isString().notEmpty().withMessage('User ID is required')
  ],

  getUserArtifacts: [
    param('userId').isString().notEmpty().withMessage('User ID is required'),
    query('agentId').optional().isString(),
    query('type').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  toggleFavorite: [
    param('artifactId').isString().notEmpty().withMessage('Artifact ID is required'),
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('favorite').isBoolean().withMessage('Favorite must be a boolean')
  ],

  findByTriggers: [
    query('text').isString().notEmpty().withMessage('Text parameter is required')
      .isLength({ max: 500 }).withMessage('Text must be less than 500 characters')
  ]
};

/**
 * Security headers for agent endpoints
 */
export const agentSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Agent-specific headers
  res.setHeader('X-Agent-System-Version', '1.0.0');
  res.setHeader('X-Rate-Limit-Type', 'agent-execution');

  next();
};

// Extend Express Request interface to include agent and cost estimate
declare global {
  namespace Express {
    interface Request {
      agent?: any;
      estimatedCost?: number;
    }
  }
}