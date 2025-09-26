import dotenv from 'dotenv';
import { EnvironmentVariables } from '../types';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
  'API_PREFIX',
  'OPENAI_API_KEY',
];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

// Export configuration object
export const config: EnvironmentVariables = {
  PORT: process.env.PORT!,
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  FRONTEND_URL: process.env.FRONTEND_URL!,
  API_PREFIX: process.env.API_PREFIX!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
};

// Environment helpers
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';
