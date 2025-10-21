import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { ChatErrorResponse } from '../types';

/**
 * Rate limiter for general API endpoints
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    error_type: 'rate_limit',
    timestamp: new Date().toISOString(),
  } as ChatErrorResponse,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting in test environment
  skip: (_req: Request): boolean => {
    return process.env.NODE_ENV === 'test';
  },
});

/**
 * Rate limiter specifically for chat endpoints (more restrictive)
 */
export const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 chat requests per 15 minutes
  message: {
    success: false,
    error: 'Too many chat requests from this IP, please try again later',
    error_type: 'rate_limit',
    timestamp: new Date().toISOString(),
  } as ChatErrorResponse,
  standardHeaders: true,
  legacyHeaders: false,
  // Use default key generator for proper IPv6 handling
  // Custom skip function for certain conditions
  skip: (_req: Request): boolean => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  },
});

/**
 * Rate limiter for authentication endpoints (very restrictive)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per 15 minutes
  message: {
    success: false,
    error:
      'Too many authentication attempts from this IP, please try again later',
    error_type: 'rate_limit',
    timestamp: new Date().toISOString(),
  } as ChatErrorResponse,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in test environment
  skip: (_req: Request): boolean => {
    return process.env.NODE_ENV === 'test';
  },
  // Longer delay for auth attempts
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
});
