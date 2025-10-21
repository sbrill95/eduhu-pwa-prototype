/**
 * Integration Tests for Agents SDK API Endpoints
 *
 * Tests cover:
 * - API endpoint responses (TEST-015)
 * - Input validation (TEST-016)
 * - Error handling (TEST-017)
 * - Route registration (TEST-018)
 */

import request from 'supertest';
import express, { Express } from 'express';
import agentsSdkRouter from '../agentsSdk';

// Create test app
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json({ limit: '10kb' }));
  app.use('/api/agents-sdk', agentsSdkRouter);
  return app;
};

// TODO: Complete Agents SDK routes - see SKIP_TESTS.md
describe.skip('POST /api/agents-sdk/test', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    process.env.OPENAI_API_KEY = 'sk-test-key-1234567890';
  });

  describe('TEST-015: Endpoint Returns Test Agent Response', () => {
    test('Endpoint returns test agent response', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/test')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message');
      expect(response.body.data.message).toBe('Hello from OpenAI Agents SDK');
    });

    test('Endpoint includes timestamp in response', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/test')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('number');
    });

    test('Endpoint returns correct content-type', async () => {
      const response = await request(app).post('/api/agents-sdk/test').send({});

      expect(response.headers['content-type']).toContain('application/json');
    });

    test('Endpoint includes SDK version', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/test')
        .send({})
        .expect(200);

      expect(response.body.data).toHaveProperty('sdkVersion');
      expect(response.body.data.sdkVersion).toBe('0.1.10');
    });
  });

  describe('TEST-016: Input Validation', () => {
    test('Rejects malformed JSON', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/test')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('Validates Content-Type header', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/test')
        .send('plain text')
        .set('Content-Type', 'text/plain')
        .expect(400);
    });

    test('Accepts valid empty JSON object', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/test')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Accepts JSON with optional parameters', async () => {
      const response = await request(app)
        .post('/api/agents-sdk/test')
        .send({ message: 'test' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('TEST-017: Error Handling', () => {
    test('Returns 500 on internal error', async () => {
      delete process.env.OPENAI_API_KEY;

      const response = await request(app)
        .post('/api/agents-sdk/test')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('Error response follows consistent format', async () => {
      delete process.env.OPENAI_API_KEY;

      const response = await request(app).post('/api/agents-sdk/test').send({});

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body.success).toBe(false);
      expect(typeof response.body.error).toBe('string');
    });

    test('Error response includes timestamp', async () => {
      delete process.env.OPENAI_API_KEY;

      const response = await request(app).post('/api/agents-sdk/test').send({});

      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('number');
    });
  });

  describe('TEST-018: Route Registration', () => {
    test('Route exists at correct path', async () => {
      const response = await request(app).post('/api/agents-sdk/test').send({});

      expect(response.status).not.toBe(404);
    });

    test('Route uses /api/agents-sdk prefix', async () => {
      const response = await request(app).post('/api/agents-sdk/test').send({});

      expect(response.status).toBeLessThan(500);
    });
  });
});

describe('GET /api/agents-sdk/health', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    process.env.OPENAI_API_KEY = 'sk-test-key-1234567890';
  });

  describe('Health Check Endpoint', () => {
    test('Health endpoint returns SDK status', async () => {
      const response = await request(app)
        .get('/api/agents-sdk/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sdkConfigured');
      expect(response.body.data).toHaveProperty('sdkVersion');
    });

    test('Health endpoint returns correct SDK version', async () => {
      const response = await request(app)
        .get('/api/agents-sdk/health')
        .expect(200);

      expect(response.body.data.sdkVersion).toBe('0.1.10');
    });

    test('Health endpoint includes timestamp', async () => {
      const response = await request(app)
        .get('/api/agents-sdk/health')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('number');
    });

    test('Health endpoint returns JSON', async () => {
      const response = await request(app).get('/api/agents-sdk/health');

      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});
