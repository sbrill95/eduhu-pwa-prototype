import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ChatErrorResponse } from '../types';

/**
 * Validation rules for chat requests
 */
export const chatValidationRules = [
  body('messages')
    .isArray({ min: 1 })
    .withMessage(
      'Messages array is required and must contain at least one message'
    ),

  body('messages.*.role')
    .isIn(['system', 'user', 'assistant'])
    .withMessage(
      'Message role must be either "system", "user", or "assistant"'
    ),

  body('messages.*.content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 4000 })
    .withMessage(
      'Message content must be a non-empty string with maximum 4000 characters'
    ),

  body('model')
    .optional()
    .isString()
    .trim()
    .isIn(['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-3.5-turbo'])
    .withMessage('Model must be a valid OpenAI model'),

  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be a number between 0 and 2'),

  body('max_tokens')
    .optional()
    .isInt({ min: 1, max: 4000 })
    .withMessage('Max tokens must be an integer between 1 and 4000'),

  body('stream')
    .optional()
    .isBoolean()
    .withMessage('Stream must be a boolean value'),
];

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => error.msg)
      .join(', ');

    const response: ChatErrorResponse = {
      success: false,
      error: `Validation error: ${errorMessages}`,
      error_type: 'validation',
      timestamp: new Date().toISOString(),
    };

    res.status(400).json(response);
    return;
  }

  next();
};

/**
 * Middleware to sanitize and validate request body size
 */
export const validateRequestSize = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contentLength = req.get('content-length');
  const maxSize = 10 * 1024 * 1024; // 10MB limit

  if (contentLength && parseInt(contentLength, 10) > maxSize) {
    const response: ChatErrorResponse = {
      success: false,
      error: 'Request payload too large. Maximum allowed size is 10MB',
      error_type: 'validation',
      timestamp: new Date().toISOString(),
    };

    res.status(413).json(response);
    return;
  }

  next();
};

/**
 * Middleware to validate API key presence in development
 */
export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !apiKey.startsWith('sk-')) {
    const response: ChatErrorResponse = {
      success: false,
      error: 'OpenAI API key is not configured properly',
      error_type: 'server_error',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
    return;
  }

  next();
};
