import { test, expect } from '@playwright/test';

test.describe('API Tests', () => {
  const API_BASE = 'http://localhost:3001';

  test('should respond to root endpoint', async ({ request }) => {
    const response = await request.get(`${API_BASE}/`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('message', 'Teacher Assistant API Server is running');
    expect(data).toHaveProperty('timestamp');
  });

  test('should respond to health check endpoint', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('status', 'ok');
    expect(data.data).toHaveProperty('environment');
    expect(data.data).toHaveProperty('uptime');
    expect(data.data).toHaveProperty('version');
  });

  test('should handle 404 for non-existent routes', async ({ request }) => {
    const response = await request.get(`${API_BASE}/non-existent-route`);

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Route /non-existent-route not found');
  });

  test('should handle CORS correctly', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`, {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  test('should handle OPTIONS preflight requests', async ({ request }) => {
    const response = await request.fetch(`${API_BASE}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    });

    expect(response.status()).toBe(204);
    expect(response.headers()['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  test('should return JSON content type', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('should have reasonable response times', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${API_BASE}/api/health`);
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(1000); // Should respond within 1 second
  });
});