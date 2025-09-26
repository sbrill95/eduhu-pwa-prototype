// Test setup file for Jest

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Prevent actual server from starting during tests
beforeAll(() => {
  // Any global test setup
});

afterAll(() => {
  // Any global test cleanup
});

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Comment out the line below if you want to see console output during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
