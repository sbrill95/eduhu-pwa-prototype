import express from 'express';
import cors from 'cors';
import { config, isDevelopment } from './config';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import routes from './routes';
import { ApiResponse } from './types';
import { initializeInstantDB } from './services/instantdbService';
import { logInfo, logWarn } from './config/logger';

const app = express();

// Initialize InstantDB on startup
const instantDBInitialized = initializeInstantDB();
if (!instantDBInitialized) {
  logWarn('InstantDB initialization failed - features requiring database will be unavailable');
} else {
  logInfo('InstantDB initialized successfully');
}

// CORS configuration - Support multiple origins for development and deployment
const allowedOrigins = [
  config.FRONTEND_URL, // Primary frontend URL from env
  'http://localhost:3000', // Legacy frontend port
  'http://localhost:5173', // Vite default port
  'http://localhost:5174', // Alternative Vite port
  'http://localhost:5175', // Current frontend port
  'https://eduhu-pwa-prototype.vercel.app', // Vercel deployment
  'https://teacher-assistant-pwa.vercel.app', // Alternative Vercel deployment
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, allow any localhost origin
    if (isDevelopment && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  exposedHeaders: ['RateLimit-*'],
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
