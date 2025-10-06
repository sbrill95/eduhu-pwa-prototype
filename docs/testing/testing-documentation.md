# Testing Documentation

## Overview

This document outlines the comprehensive testing infrastructure implemented for the Teacher Assistant project, including unit tests, integration tests, end-to-end tests, and CI/CD pipelines.

## Testing Strategy

### Test Pyramid Implementation

```
       /\
      /E2E\     ← End-to-End Tests (Playwright)
     /______\
    /        \
   /Integration\ ← API Integration Tests (Jest + Supertest)
  /__________\
 /            \
/  Unit Tests  \  ← Unit Tests (Vitest + Jest)
/________________\
```

## Frontend Testing (Vitest)

### Setup
- **Framework:** Vitest with React Testing Library
- **Environment:** jsdom for DOM simulation
- **Coverage:** v8 provider with multiple output formats

### Configuration Files
- `vitest.config.ts` - Main configuration
- `src/test/setup.ts` - Test environment setup with mocks

### Running Tests
```bash
cd frontend
npm run test          # Run in watch mode
npm run test:run      # Run once
npm run test:ui       # Run with UI
npm run test:coverage # Run with coverage report
```

### Test Files
- `src/App.test.tsx` - React component tests
- `src/lib/utils.test.ts` - Utility function tests

### Mocks Included
- `matchMedia` - For responsive design testing
- `IntersectionObserver` - For intersection-based components
- `ResizeObserver` - For resize-based components

## Backend Testing (Jest)

### Setup
- **Framework:** Jest with ts-jest preset
- **API Testing:** Supertest for HTTP assertions
- **Environment:** Node.js test environment

### Configuration Files
- `jest.config.js` - Main Jest configuration
- `src/test/setup.ts` - Test environment setup

### Running Tests
```bash
cd backend
npm run test         # Run in watch mode
npm run test:ci      # Run once with coverage
npm run test:coverage # Generate coverage report
```

### Test Files
- `src/app.test.ts` - Express application tests
- `src/routes/health.test.ts` - Health endpoint tests
- `src/config/index.test.ts` - Configuration tests

## End-to-End Testing (Playwright)

### Setup
- **Framework:** Playwright with TypeScript
- **Browsers:** Chromium, Firefox, WebKit
- **Mobile Testing:** Pixel 5, iPhone 12 viewports

### Configuration
- `playwright.config.ts` - Main configuration
- Auto-starts frontend (port 3000) and backend (port 3001)

### Running Tests
```bash
# From project root
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Run with Playwright UI
npm run test:e2e:headed  # Run in headed mode
npm run test:e2e:debug   # Run in debug mode
npm run test:e2e:report  # Show test report
```

### Test Files
- `tests/app.spec.ts` - Frontend UI tests
- `tests/api.spec.ts` - API integration tests

### Features
- Multi-browser testing
- Mobile responsive testing
- Screenshot capture on failure
- Video recording on failure
- Trace collection for debugging

## CI/CD Pipeline

### Workflow Files
Located in `.github/workflows/`:

#### 1. ci.yml - Main CI/CD Pipeline
```yaml
Triggers: Push/PR to main/develop branches
Jobs:
  - frontend-test: Lint, format, build, unit tests
  - backend-test: Build, unit tests
  - e2e-test: Full E2E suite
  - build: Production builds (main branch only)
```

#### 2. quality.yml - Code Quality
```yaml
Triggers: Push/PR to main/develop branches
Jobs:
  - quality: Lint, format, security audit, dependencies
  - lighthouse: Performance testing
  - bundle-analysis: Bundle size monitoring
```

#### 3. deploy.yml - Deployment
```yaml
Triggers: Push to main, version tags
Jobs:
  - deploy-staging: Auto deployment to staging
  - deploy-production: Manual approval required
  - rollback: Manual rollback capability
```

### Quality Gates
- All tests must pass
- Code coverage requirements met
- No security vulnerabilities (high level)
- Performance thresholds met (Lighthouse)
- Bundle size within limits

## Testing Commands Reference

### All Projects
```bash
# Run all tests across all projects
npm run test:all

# Start all development servers
npm run dev:all

# Build all projects
npm run build:all
```

### Frontend Only
```bash
cd frontend
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage
npm run test:ui       # With UI
```

### Backend Only
```bash
cd backend
npm run test         # Watch mode
npm run test:ci      # CI mode
npm run test:coverage # With coverage
```

### E2E Only
```bash
npm run test:e2e         # All browsers
npm run test:e2e:ui      # With UI
npm run test:e2e:headed  # Headed mode
npm run test:e2e:debug   # Debug mode
```

## Coverage Requirements

### Frontend (Vitest)
- **Minimum:** 80% line coverage
- **Exclusions:** Test files, config files, type definitions

### Backend (Jest)
- **Minimum:** 80% line coverage
- **Exclusions:** Test files, server entry point

### Reporting
- Coverage reports uploaded to Codecov
- HTML reports generated locally
- JSON/LCOV formats for CI integration

## Test Writing Guidelines

### Unit Tests
- Test pure functions thoroughly
- Mock external dependencies
- Use descriptive test names
- Group related tests in describe blocks

### Integration Tests
- Test API endpoints with real HTTP requests
- Verify request/response formats
- Test error handling scenarios
- Validate CORS and middleware functionality

### E2E Tests
- Test critical user journeys
- Verify cross-browser compatibility
- Test mobile responsiveness
- Include accessibility checks

## Performance Testing

### Lighthouse CI
- **Configuration:** `frontend/lighthouserc.json`
- **Thresholds:**
  - Performance: 70%
  - Accessibility: 90%
  - Best Practices: 80%
  - SEO: 80%

### Bundle Analysis
- Automatic bundle size monitoring
- Comparison against main branch
- Alerts for significant size increases

## Debugging Tests

### Frontend (Vitest)
```bash
npm run test:ui  # Interactive UI
# Or use browser dev tools with --inspect
```

### Backend (Jest)
```bash
npm run test -- --detectOpenHandles
# For debugging async issues
```

### E2E (Playwright)
```bash
npm run test:e2e:debug     # Debug mode
npm run test:e2e:headed    # See browser actions
npx playwright codegen     # Generate tests
```

## Continuous Integration

### Branch Protection Rules
- Require status checks to pass
- Require branches to be up to date
- Require review from code owners

### Automated Checks
- Lint and format validation
- TypeScript compilation
- All test suites pass
- Security vulnerability scan
- Performance regression detection

## Future Improvements

### Planned Enhancements
- Visual regression testing with Percy/Chromatic
- Load testing with Artillery or k6
- Contract testing with Pact
- Mutation testing for test quality assessment
- Database integration testing
- Authentication flow testing

### Monitoring
- Test execution time tracking
- Flaky test detection and reporting
- Coverage trend analysis
- Performance metric tracking

---

For questions or improvements to the testing infrastructure, please refer to the project documentation or create an issue in the repository.