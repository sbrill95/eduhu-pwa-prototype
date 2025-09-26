# Teacher Assistant Backend

A TypeScript-based Express.js server for the Teacher Assistant application with CORS support and comprehensive error handling.

## Features

- **TypeScript Support**: Full TypeScript integration with strict type checking
- **Express.js Server**: RESTful API server with proper middleware setup
- **CORS Configuration**: Configured to allow frontend connections
- **Environment Variables**: Secure configuration management with dotenv
- **Error Handling**: Comprehensive error handling with development/production modes
- **Request Logging**: Development-mode request logging for debugging
- **Health Check**: Server status monitoring endpoint
- **Hot Reload**: Development server with automatic restarts using nodemon

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server (requires build first)
npm start

# Development server with nodemon watch mode
npm run dev:watch
```

## Environment Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# API Configuration
API_PREFIX=/api
```

## API Endpoints

### Health Check
- **GET** `/api/health` - Server health status
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "timestamp": "2025-09-26T05:43:14.546Z",
      "version": "1.0.0",
      "environment": "development",
      "uptime": 54
    },
    "message": "Server is running correctly",
    "timestamp": "2025-09-26T05:43:14.546Z"
  }
  ```

### Root
- **GET** `/` - API welcome message

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration management
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route definitions
│   ├── types/           # TypeScript type definitions
│   ├── app.ts           # Express application setup
│   └── server.ts        # Server entry point
├── dist/                # Compiled JavaScript (generated)
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
├── nodemon.json        # Nodemon configuration
├── package.json        # Project configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Development

### Code Organization
- **Routes**: Add new routes in `src/routes/`
- **Middleware**: Add custom middleware in `src/middleware/`
- **Types**: Define TypeScript interfaces in `src/types/`
- **Configuration**: Environment config in `src/config/`

### Error Handling
All errors are handled by the global error handler with proper HTTP status codes and consistent JSON responses.

### CORS Policy
Configured to allow requests from the frontend URL specified in environment variables.

### Logging
Request logging is enabled in development mode for debugging purposes.

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables:
   ```bash
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://your-frontend-domain.com
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Testing

Test the server endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Root endpoint
curl http://localhost:3001/

# Test 404 handling
curl http://localhost:3001/api/nonexistent
```

## Next Development Steps

1. Database integration (Instant DB or PostgreSQL)
2. Authentication middleware and JWT tokens
3. User management endpoints
4. Course/class management API
5. File upload functionality
6. Production logging and monitoring