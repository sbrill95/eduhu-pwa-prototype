import express from 'express';
import cors from 'cors';
import { config, isDevelopment } from './config';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import routes from './routes';
import { ApiResponse } from './types';

const app = express();

// CORS configuration
const corsOptions = {
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (only in development)
if (isDevelopment) {
  app.use(requestLogger);
}

// General rate limiting for all API endpoints
app.use(config.API_PREFIX, generalLimiter);

// API routes
app.use(config.API_PREFIX, routes);

// Root endpoint
app.get('/', (req, res) => {
  const response: ApiResponse = {
    success: true,
    message: 'Teacher Assistant API Server is running',
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

// 404 handler
app.use((req, res) => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(response);
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
