import winston, { format, transports } from 'winston';
import { config } from './index';

// Define custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Define log format for different environments
const developmentFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? JSON.stringify(meta, null, 2)
      : '';
    const stackString = stack ? `\n${stack}` : '';
    return `${timestamp} [${level}]: ${message}${metaString}${stackString}`;
  })
);

const productionFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

// Define transports based on environment
const getTransports = (): winston.transport[] => {
  const commonTransports: winston.transport[] = [
    // Console transport
    new transports.Console({
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      format:
        config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    }),
  ];

  // File transports for production
  if (config.NODE_ENV === 'production') {
    commonTransports.push(
      // Error log file
      new transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: productionFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Combined log file
      new transports.File({
        filename: 'logs/combined.log',
        format: productionFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  return commonTransports;
};

// Create logger instance
export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  levels: customLevels.levels,
  format:
    config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports: getTransports(),
  // Handle uncaught exceptions
  exceptionHandlers: [
    new transports.Console({
      format:
        config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new transports.Console({
      format:
        config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    }),
  ],
  // Exit process on handled exceptions
  exitOnError: false,
});

// Create a stream for morgan HTTP logging middleware
export const logStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logError = (
  message: string,
  error?: Error,
  meta?: Record<string, unknown>
): void => {
  logger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...meta,
  });
};

export const logInfo = (
  message: string,
  meta?: Record<string, unknown>
): void => {
  logger.info(message, meta);
};

export const logWarn = (
  message: string,
  meta?: Record<string, unknown>
): void => {
  logger.warn(message, meta);
};

export const logDebug = (
  message: string,
  meta?: Record<string, unknown>
): void => {
  logger.debug(message, meta);
};

export const logHttp = (
  message: string,
  meta?: Record<string, unknown>
): void => {
  logger.http(message, meta);
};

// Log system startup
if (config.NODE_ENV !== 'test') {
  logger.info('Logger initialized', {
    level: logger.level,
    environment: config.NODE_ENV,
    transports: logger.transports.map((t) => t.constructor.name),
  });
}

export default logger;
