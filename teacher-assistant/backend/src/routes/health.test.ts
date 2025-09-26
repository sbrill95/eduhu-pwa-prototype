import request from 'supertest';
import app from '../app';

describe('Health Routes', () => {
  describe('GET /api/health', () => {
    it('should return health check data', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'message',
        'Server is running correctly'
      );
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return correct health data structure', async () => {
      const response = await request(app).get('/api/health');

      const { data } = response.body;
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('uptime');
    });

    it('should return valid timestamp format', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
      expect(response.body.data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should return environment as test', async () => {
      const response = await request(app).get('/api/health');

      expect(response.body.data.environment).toBe('test');
    });

    it('should return uptime as a number', async () => {
      const response = await request(app).get('/api/health');

      expect(typeof response.body.data.uptime).toBe('number');
      expect(response.body.data.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return version as string', async () => {
      const response = await request(app).get('/api/health');

      expect(typeof response.body.data.version).toBe('string');
      expect(response.body.data.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have correct content type', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should be fast response', async () => {
      const startTime = Date.now();
      await request(app).get('/api/health');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});
