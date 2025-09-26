import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';
import { logError } from '../config/logger';

export interface CustomError extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const errorResponse: ErrorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  // Log error with structured logging
  logError('HTTP Error occurred', err, {
    statusCode,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  res.status(statusCode).json(errorResponse);
};
