# Developer Setup Guide

## Teacher Assistant - Complete Setup Instructions

This guide will help new developers set up the Teacher Assistant application from scratch on their local development environment.

---

## Prerequisites

### Required Software

#### 1. Node.js and npm
- **Version**: Node.js 18+ (LTS recommended)
- **Download**: [https://nodejs.org/](https://nodejs.org/)
- **Verify Installation**:
  ```bash
  node --version  # Should be v18.x.x or higher
  npm --version   # Should be 9.x.x or higher
  ```

#### 2. Git
- **Download**: [https://git-scm.com/](https://git-scm.com/)
- **Verify Installation**:
  ```bash
  git --version
  ```

#### 3. Code Editor (Recommended)
- **Visual Studio Code** with extensions:
  - TypeScript and JavaScript Language Features
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier - Code formatter

### External Service Accounts

#### 1. InstantDB Account
- **Purpose**: Authentication and real-time database
- **Sign up**: [https://instantdb.com/dash](https://instantdb.com/dash)
- **Required**: App ID for frontend configuration

#### 2. OpenAI API Account
- **Purpose**: GPT-4 chat completions
- **Sign up**: [https://platform.openai.com/](https://platform.openai.com/)
- **Required**: API key for backend configuration
- **Billing**: Requires payment method for API usage

---

## Project Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone [repository-url]
cd teacher-assistant

# Verify project structure
ls -la
# Should see: backend/, frontend/, docs/, tests/, package.json
```

### Step 2: Install Dependencies

#### Root Dependencies (E2E Testing)
```bash
# Install root-level dependencies for E2E testing
npm install

# Install Playwright browsers
npx playwright install
```

#### Frontend Dependencies
```bash
cd frontend
npm install

# Verify installation
npm list --depth=0
# Should show React, TypeScript, Vite, Tailwind CSS, etc.
```

#### Backend Dependencies
```bash
cd ../backend
npm install

# Verify installation
npm list --depth=0
# Should show Express, OpenAI, Winston, Jest, etc.
```

### Step 3: Environment Configuration

#### Frontend Environment Variables
```bash
# In frontend directory
cp .env.example .env

# Edit .env file
nano .env
```

Frontend `.env` contents:
```bash
# InstantDB Configuration
VITE_INSTANTDB_APP_ID=your_instantdb_app_id_here

# Development URLs
VITE_API_BASE_URL=http://localhost:3001
```

#### Backend Environment Variables
```bash
# In backend directory
cp .env.example .env

# Edit .env file
nano .env
```

Backend `.env` contents:
```bash
# Server Configuration
NODE_ENV=development
PORT=3001

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Logging Level
LOG_LEVEL=debug
```

---

## Service Configuration

### InstantDB Setup

1. **Create InstantDB Account**:
   - Go to [https://instantdb.com/dash](https://instantdb.com/dash)
   - Sign up with your email
   - Verify your email address

2. **Create New App**:
   - Click "Create App"
   - Name: "Teacher Assistant"
   - Choose appropriate plan (free tier available)

3. **Get App ID**:
   - Copy the App ID from your dashboard
   - Add it to `frontend/.env` as `VITE_INSTANTDB_APP_ID`

4. **Verify Configuration**:
   ```bash
   cd frontend
   echo $VITE_INSTANTDB_APP_ID  # Should show your App ID
   ```

### OpenAI API Setup

1. **Create OpenAI Account**:
   - Go to [https://platform.openai.com/](https://platform.openai.com/)
   - Sign up and verify your email
   - Add payment method (required for API access)

2. **Create API Key**:
   - Go to API Keys section
   - Click "Create new secret key"
   - Name: "Teacher Assistant Development"
   - Copy the key (you won't see it again!)

3. **Configure Backend**:
   ```bash
   cd backend
   # Add key to .env file
   echo "OPENAI_API_KEY=your_key_here" >> .env
   ```

4. **Test API Connection**:
   ```bash
   # Start backend server
   npm run dev

   # In another terminal, test the connection
   curl http://localhost:3001/api/chat/health
   # Should return: {"success": true, "data": {"status": "healthy"}}
   ```

---

## Development Server Setup

### Option 1: Run All Services (Recommended)

```bash
# From root directory
npm run dev:all
```

This starts:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3001 (Express server)

### Option 2: Run Services Individually

#### Terminal 1: Backend Server
```bash
cd backend
npm run dev

# Should see:
# > nodemon --exec ts-node src/server.ts
# [INFO] Server starting on port 3001
# [INFO] OpenAI connection test: SUCCESS
# [INFO] Server ready and listening on http://localhost:3001
```

#### Terminal 2: Frontend Server
```bash
cd frontend
npm run dev

# Should see:
# > vite
#
#   VITE v7.1.7  ready in 234 ms
#
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: use --host to expose
```

### Verify Setup

1. **Backend Health Check**:
   ```bash
   curl http://localhost:3001/api/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "data": {
       "status": "ok",
       "environment": "development",
       "uptime": 30
     }
   }
   ```

2. **Frontend Access**:
   - Open browser to http://localhost:5173
   - Should see Teacher Assistant login page
   - InstantDB authentication should work

3. **Full Stack Test**:
   - Login via magic link
   - Navigate to Chat page
   - Send a test message
   - Should receive AI response

---

## Testing Setup

### Run All Tests
```bash
# From root directory - runs all test suites
npm run test:all

# Expected output:
# Frontend: 52 tests passing
# Backend: 24 tests passing
# E2E: 13 tests passing
# Total: 89 tests passing
```

### Individual Test Suites

#### Frontend Tests (Vitest)
```bash
cd frontend

# Run tests once
npm run test:run

# Watch mode for development
npm run test

# With UI interface
npm run test:ui

# With coverage report
npm run test:coverage
```

#### Backend Tests (Jest)
```bash
cd backend

# Run tests once
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

#### End-to-End Tests (Playwright)
```bash
# From root directory
npm run test:e2e

# With browser UI
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

---

## Development Workflow

### Code Quality Setup

#### ESLint and Prettier
Both frontend and backend have pre-configured linting and formatting:

```bash
# Frontend
cd frontend
npm run lint          # Check for errors
npm run lint:fix      # Auto-fix errors
npm run format        # Format code
npm run format:check  # Check formatting

# Backend
cd backend
npm run lint          # Check for errors
npm run lint:fix      # Auto-fix errors
npm run format        # Format code
npm run quality       # Run all checks
```

#### Git Hooks (Optional)
Set up pre-commit hooks to ensure code quality:

```bash
# Install husky for git hooks
npm install -g husky

# Set up pre-commit hook
husky add .husky/pre-commit "npm run quality && npm run test:run"
```

### TypeScript Configuration

Both projects use strict TypeScript configuration:
- No `any` types allowed
- Strict null checks enabled
- All imports must be typed

#### VS Code TypeScript Setup
1. Install TypeScript extension
2. Open workspace in VS Code
3. Select TypeScript version: "Use Workspace Version"
4. Enable "TypeScript: Strict" in settings

### Development Best Practices

1. **Feature Development**:
   ```bash
   # Create feature branch
   git checkout -b feature/new-feature

   # Make changes
   # Run tests before committing
   npm run test:all

   # Commit changes
   git add .
   git commit -m "Add new feature"
   ```

2. **Code Changes**:
   - Always run linter before committing: `npm run lint:fix`
   - Ensure all tests pass: `npm run test:all`
   - Follow existing patterns and conventions
   - Add tests for new functionality

3. **API Changes**:
   - Update API documentation if endpoints change
   - Add/update tests for new endpoints
   - Test with both curl and frontend integration

---

## Troubleshooting

### Common Setup Issues

#### 1. Node.js Version Mismatch
```bash
# Error: unsupported engine
# Solution: Update Node.js to version 18+
node --version  # Check current version
# Download latest LTS from nodejs.org
```

#### 2. Port Already in Use
```bash
# Error: EADDRINUSE :::3001
# Solution: Kill process using port or change port
lsof -ti:3001 | xargs kill -9  # Kill process on port 3001
# Or change PORT in backend/.env
```

#### 3. InstantDB Connection Issues
```bash
# Error: InstantDB App ID not configured
# Solution: Verify App ID in frontend/.env
grep VITE_INSTANTDB_APP_ID frontend/.env
# Should show: VITE_INSTANTDB_APP_ID=your_app_id
```

#### 4. OpenAI API Issues
```bash
# Error: 401 Unauthorized
# Solution: Check API key configuration
grep OPENAI_API_KEY backend/.env
# Test connection:
curl -H "Authorization: Bearer your_key" https://api.openai.com/v1/models
```

#### 5. Frontend Build Issues
```bash
# Error: TypeScript compilation failed
# Solution: Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Development Server Issues

#### Frontend Not Loading
1. Check if Vite server is running on port 5173
2. Verify no TypeScript errors in console
3. Check browser developer tools for JavaScript errors
4. Ensure environment variables are loaded

#### Backend API Errors
1. Check server logs for error messages
2. Verify OpenAI API key is valid
3. Test health endpoint: `curl http://localhost:3001/api/health`
4. Check rate limiting isn't blocking requests

#### Authentication Issues
1. Verify InstantDB App ID is correct
2. Check browser network tab for failed requests
3. Clear browser localStorage and try again
4. Verify magic link emails aren't in spam folder

### Testing Issues

#### Tests Failing
```bash
# Clear test cache
npm run test -- --clearCache

# Run specific test file
npm test -- --testNamePattern="specific test"

# Run with verbose output
npm test -- --verbose
```

#### E2E Tests Timing Out
```bash
# Increase timeout in playwright.config.ts
# Or run tests in headed mode to debug
npm run test:e2e:headed
```

---

## VS Code Workspace Setup

### Recommended Extensions
1. **TypeScript and JavaScript Language Features** (built-in)
2. **ES7+ React/Redux/React-Native snippets**
3. **Tailwind CSS IntelliSense**
4. **ESLint**
5. **Prettier - Code formatter**
6. **Auto Rename Tag**
7. **Bracket Pair Colorizer**
8. **GitLens**

### Workspace Settings
Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.useAliasesForRenames": false,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/*.log": true
  }
}
```

### Keyboard Shortcuts
Create `.vscode/keybindings.json`:
```json
[
  {
    "key": "cmd+shift+t",
    "command": "workbench.action.tasks.runTask",
    "args": "test:all"
  },
  {
    "key": "cmd+shift+b",
    "command": "workbench.action.tasks.runTask",
    "args": "build:all"
  }
]
```

---

## Production Deployment Preparation

### Environment Variables for Production

#### Frontend Production Variables
```bash
# Production .env
VITE_INSTANTDB_APP_ID=your_production_app_id
VITE_API_BASE_URL=https://your-backend-domain.com
```

#### Backend Production Variables
```bash
# Production .env
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=your_production_api_key

# Optional production settings
LOG_LEVEL=info
CORS_ORIGIN=https://your-frontend-domain.com
```

### Build for Production

```bash
# Build all projects
npm run build:all

# Or individually:
cd frontend && npm run build  # Creates dist/ folder
cd backend && npm run build   # Creates dist/ folder
```

### Production Checklist

- [ ] Environment variables configured for production
- [ ] InstantDB production app created
- [ ] OpenAI API billing configured
- [ ] All tests passing: `npm run test:all`
- [ ] Production builds successful: `npm run build:all`
- [ ] CORS configured for production domains
- [ ] SSL certificates configured
- [ ] Monitoring and logging set up

---

## Getting Help

### Documentation
- **API Documentation**: `docs/api-docs/backend-api.md`
- **Project Structure**: `docs/project-structure.md`
- **Testing Guide**: `docs/testing.md`

### Common Commands Reference
```bash
# Development
npm run dev:all              # Start all services
npm run test:all             # Run all tests
npm run build:all            # Build all projects

# Quality Checks
npm run lint                 # Check code quality
npm run format              # Format code
npm run quality             # Run all quality checks

# Testing
npm run test:e2e            # E2E tests
npm run test:coverage       # Coverage reports
npm run test:ui             # Interactive test UI
```

### Support Resources
1. **GitHub Issues**: Report bugs and request features
2. **Development Logs**: Check `docs/agent-logs.md` for implementation details
3. **Source Code**: All code is documented with TypeScript interfaces
4. **Test Examples**: Look at test files for usage examples

---

**Setup Guide Version**: 1.0.0
**Last Updated**: September 26, 2025
**Status**: Production Ready ✅

This setup should get you up and running with the Teacher Assistant application. If you encounter any issues not covered in this guide, please check the troubleshooting section or create an issue in the project repository.