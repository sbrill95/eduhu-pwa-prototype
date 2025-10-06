import app from './app';
import { config, isDevelopment } from './config';
import { logInfo, logError } from './config/logger';

const PORT = parseInt(config.PORT, 10) || 3001;

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logInfo('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logInfo('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  logInfo('Teacher Assistant Backend Server started successfully', {
    port: PORT,
    environment: config.NODE_ENV,
    apiBaseUrl: `http://localhost:${PORT}${config.API_PREFIX}`,
    healthCheckUrl: `http://localhost:${PORT}${config.API_PREFIX}/health`,
  });

  if (isDevelopment) {
    logInfo('Development mode enabled', {
      corsEnabled: config.FRONTEND_URL,
    });
  }
});

// Handle server startup errors
server.on('error', (error: Error & { code?: string }) => {
  if (error.code === 'EADDRINUSE') {
    logError(
      `Port ${PORT} is already in use. Please choose a different port.`,
      error
    );
  } else {
    logError('Server startup error', error);
  }
  process.exit(1);
});

export default server;

// trigger restart

