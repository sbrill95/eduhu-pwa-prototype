# Teacher Assistant

A modern AI-powered assistant application specifically designed for educators, built with React, Express, and OpenAI integration.

## Overview

Teacher Assistant is a production-ready Progressive Web App (PWA) that provides teachers with an intelligent chat interface powered by GPT-4. The application features authentication, real-time messaging, persistent chat history, and a comprehensive library for managing educational content and conversations.

### Key Features

- **AI-Powered Chat**: Integration with OpenAI GPT-4 models for intelligent assistance
- **Authentication**: Secure magic-link authentication via InstantDB
- **Real-time Updates**: Live message synchronization across sessions
- **Responsive Design**: Mobile-first interface optimized for all devices
- **Chat Management**: Organized chat history with search and categorization
- **Rate Limiting**: Built-in protection against API abuse
- **Comprehensive Testing**: 89 tests covering frontend, backend, and integration
- **Production Ready**: Professional logging, error handling, and monitoring

## Technology Stack

### Frontend
- **React 19** with TypeScript for modern UI development
- **Vite** for fast development and optimized builds
- **Tailwind CSS v4** for utility-first styling
- **React Router v7** for client-side navigation
- **InstantDB** for authentication and real-time data
- **Vitest** for unit testing with React Testing Library

### Backend
- **Node.js** with Express and TypeScript
- **OpenAI API** for GPT-4 chat completions
- **Winston** for structured logging
- **Express Rate Limit** for API protection
- **Jest** for comprehensive API testing
- **ESLint & Prettier** for code quality

### Infrastructure
- **InstantDB**: Authentication, real-time database, and file storage
- **OpenAI API**: GPT-4 models for AI chat capabilities
- **Playwright**: End-to-end testing across browsers
- **GitHub Actions**: CI/CD pipeline with automated testing

## Project Structure

```
teacher-assistant/
├── docs/                   # Project documentation
│   ├── README.md          # Main project documentation
│   ├── PRD.md            # Product requirements document
│   ├── implementation-plan.md # Development roadmap
│   ├── project-structure.md   # Architecture documentation
│   ├── api-docs/         # API endpoint documentation
│   ├── agent-logs.md     # Development session logs
│   └── testing.md        # Testing strategy and results
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   │   ├── auth/    # Authentication components
│   │   │   └── Layout/  # Layout and navigation
│   │   ├── pages/       # Route-based page components
│   │   ├── lib/         # Utilities and API clients
│   │   ├── hooks/       # Custom React hooks
│   │   └── test/        # Test setup and utilities
│   ├── public/          # Static assets
│   └── dist/           # Production build output
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── config/      # Configuration and environment setup
│   │   ├── middleware/  # Express middleware (auth, logging, validation)
│   │   ├── routes/      # API route definitions
│   │   ├── services/    # Business logic and external API integration
│   │   ├── types/       # TypeScript type definitions
│   │   └── test/        # Test setup and utilities
│   └── dist/           # Compiled TypeScript output
├── tests/                 # End-to-end tests
└── .github/workflows/     # CI/CD pipeline configuration
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- InstantDB account and App ID
- OpenAI API key

### Development Setup

1. **Clone and install dependencies**:
   ```bash
   cd teacher-assistant
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Configure environment variables**:
   ```bash
   # Frontend (.env)
   VITE_INSTANTDB_APP_ID=your_instantdb_app_id

   # Backend (.env)
   NODE_ENV=development
   PORT=3001
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Start development servers**:
   ```bash
   # Root directory - starts both frontend and backend
   npm run dev:all

   # Or individually:
   cd frontend && npm run dev    # Frontend on http://localhost:5173
   cd backend && npm run dev     # Backend on http://localhost:3001
   ```

4. **Run tests**:
   ```bash
   npm run test:all              # All tests (frontend + backend + e2e)
   cd frontend && npm test       # Frontend tests only
   cd backend && npm test        # Backend tests only
   npm run test:e2e             # E2E tests only
   ```

### Production Build

```bash
npm run build:all               # Build both frontend and backend
cd frontend && npm run build    # Frontend production build
cd backend && npm run build     # Backend TypeScript compilation
```

## Configuration

### InstantDB Setup

1. Create an account at [InstantDB](https://instantdb.com/dash)
2. Create a new application
3. Copy the App ID to your frontend `.env` file
4. The application uses magic-link authentication - no additional configuration needed

### OpenAI API Setup

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your backend `.env` file
3. The application uses `gpt-4o-mini` by default for cost-effectiveness

## API Endpoints

### Health Check
- `GET /api/health` - Server health and status information

### Chat Endpoints
- `POST /api/chat` - Create chat completion with OpenAI
- `GET /api/chat/models` - Available OpenAI models
- `GET /api/chat/health` - Chat service health check

### Rate Limits
- General API: 100 requests per 15 minutes
- Chat endpoints: 30 requests per 15 minutes
- Authentication: 5 requests per 15 minutes

## Testing

The application includes comprehensive testing at all levels:

- **Unit Tests**: 52 tests covering components, utilities, and business logic
- **Integration Tests**: 37 tests for API endpoints and frontend-backend communication
- **End-to-End Tests**: 13 tests covering complete user workflows across browsers

Total: **89 passing tests** with comprehensive coverage of authentication, API integration, UI components, and error scenarios.

### Running Tests

```bash
# All tests
npm run test:all

# Frontend tests with UI
cd frontend && npm run test:ui

# Backend tests with coverage
cd backend && npm run test:coverage

# E2E tests with browser UI
npm run test:e2e:ui
```

## Development Workflow

1. **Feature Development**: Create feature branches from main
2. **Code Quality**: Run `npm run quality` to check linting and formatting
3. **Testing**: Ensure all tests pass with `npm run test:all`
4. **Pull Request**: CI/CD pipeline runs all checks automatically
5. **Deployment**: Automatic deployment on merge to main (when configured)

## Code Quality Standards

- **TypeScript**: Strict type checking with no `any` types
- **ESLint**: Enforced coding standards and best practices
- **Prettier**: Consistent code formatting across all files
- **Testing**: Minimum 80% test coverage requirement
- **Logging**: Structured logging with Winston in production

## Architecture Decisions

### Authentication Strategy
- **Magic Link Authentication**: Passwordless, secure, and user-friendly
- **InstantDB Integration**: Real-time capabilities with minimal backend complexity

### AI Integration
- **OpenAI GPT-4**: Industry-leading language model for educational assistance
- **Rate Limiting**: Prevents abuse and controls API costs
- **Error Handling**: Comprehensive error scenarios with user-friendly messages

### Frontend Architecture
- **Component-Based**: Reusable, testable components with clear separation of concerns
- **Mobile-First**: Responsive design optimized for teachers using mobile devices
- **Real-Time Updates**: Instant message synchronization across sessions

### Backend Architecture
- **Service-Oriented**: Clear separation between routes, services, and middleware
- **Comprehensive Logging**: Structured logs for debugging and monitoring
- **Type Safety**: Full TypeScript coverage with strict compilation

## Contributing

1. Follow the established code style and testing patterns
2. Run quality checks before submitting PRs: `npm run quality:fix`
3. Ensure all tests pass: `npm run test:all`
4. Update documentation for new features
5. Add tests for new functionality

## Support and Documentation

- **API Documentation**: See `docs/api-docs/` directory
- **Architecture**: See `docs/project-structure.md`
- **Product Requirements**: See `docs/PRD.md`
- **Development Logs**: See `docs/agent-logs.md`
- **Testing Strategy**: See `docs/testing.md`

## Production Checklist

- [ ] InstantDB App ID configured
- [ ] OpenAI API key configured
- [ ] Environment variables set for production
- [ ] SSL certificates configured
- [ ] Monitoring and logging set up
- [ ] Rate limiting configured appropriately
- [ ] Database backups configured
- [ ] Error tracking service integrated

## License

ISC License - See LICENSE file for details.